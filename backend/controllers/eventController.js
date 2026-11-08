const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const notificationController = require('./notificationController');
const emailService = require('../services/emailService');

// Configure multer for image uploads - files are kept in memory and saved to the DB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'paymentQr', maxCount: 1 }
]);

// Image metadata only - never select file_data here, it is served by /api/files
const GALLERY_COLUMNS = `id, event_id, file_name, mime_type, uploaded_at,
    CONCAT('/api/files/gallery/', id) AS image_url`;

// Event columns plus the payment QR URL (if a QR has been uploaded)
const EVENT_SELECT = `
    SELECT e.*, u.name as organizer_name,
        CASE WHEN q.event_id IS NULL THEN NULL ELSE CONCAT('/api/files/event-qr/', e.id) END AS payment_qr_url
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN event_payment_qr q ON q.event_id = e.id
`;

const saveGalleryImages = async (eventId, files) => {
    for (const file of files) {
        await pool.query(
            'INSERT INTO event_gallery (event_id, file_name, mime_type, file_data) VALUES ($1, $2, $3, $4)',
            [eventId, file.originalname, file.mimetype, file.buffer]
        );
    }
};

const savePaymentQr = async (eventId, file) => {
    await pool.query(
        `INSERT INTO event_payment_qr (event_id, file_name, mime_type, file_data) VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id) DO UPDATE SET
             file_name = EXCLUDED.file_name,
             mime_type = EXCLUDED.mime_type,
             file_data = EXCLUDED.file_data,
             uploaded_at = NOW()`,
        [eventId, file.originalname, file.mimetype, file.buffer]
    );
};

const eventController = {
    // Get all events
    getAllEvents: async (req, res) => {
        try {
            const { rows: events } = await pool.query(`${EVENT_SELECT} ORDER BY e.event_date DESC`);

            // Get images for each event
            for (let event of events) {
                const { rows: images } = await pool.query(
                    `SELECT ${GALLERY_COLUMNS} FROM event_gallery WHERE event_id = $1 ORDER BY id`,
                    [event.id]
                );
                event.images = images;
            }

            res.json(events);
        } catch (error) {
            console.error('Get events error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get single event
    getEventById: async (req, res) => {
        try {
            const { id } = req.params;

            const { rows: events } = await pool.query(`${EVENT_SELECT} WHERE e.id = $1`, [id]);

            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const { rows: images } = await pool.query(
                `SELECT ${GALLERY_COLUMNS} FROM event_gallery WHERE event_id = $1 ORDER BY id`,
                [id]
            );

            const event = {
                ...events[0],
                images
            };

            res.json(event);
        } catch (error) {
            console.error('Get event error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Create event
    createEvent: async (req, res) => {
        try {
            upload(req, res, async function (err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }

                try {
                    const {
                        title,
                        description,
                        category,
                        location,
                        eventDate,
                        eventTime,
                        organizedBy,
                        organizerDepartment,
                        rulesEligibility,
                        maxParticipants,
                        registrationFees,
                        createdBy
                    } = req.body;

                    // Insert event
                    const { rows: inserted } = await pool.query(
                        `INSERT INTO events
                        (title, description, category, location, event_date, event_time,
                         organized_by, organizer_department, rules_eligibility, max_participants, registration_fees, created_by)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        RETURNING id`,
                        [
                            title,
                            description,
                            category,
                            location,
                            eventDate,
                            eventTime,
                            organizedBy || organizerDepartment,
                            organizerDepartment,
                            rulesEligibility,
                            maxParticipants || null,
                            registrationFees || 0,
                            createdBy
                        ]
                    );


                    const eventId = inserted[0].id;

                    // Save payment QR code and event images in the database
                    if (req.files && req.files['paymentQr']) {
                        await savePaymentQr(eventId, req.files['paymentQr'][0]);
                    }
                    if (req.files && req.files['images']) {
                        await saveGalleryImages(eventId, req.files['images']);
                    }

                    // Get event details for notifications
                    const { rows: newEvent } = await pool.query(
                        'SELECT * FROM events WHERE id = $1',
                        [eventId]
                    );
                    const eventDetails = newEvent[0];

                    try {
                        // Get faculty name who created the event
                        const { rows: faculty } = await pool.query(
                            'SELECT name FROM users WHERE id = $1',
                            [createdBy]
                        );

                        const facultyName = faculty[0]?.name || 'Faculty';

                        // Send in-app notifications
                        await notificationController.notifyNewEvent(
                            eventId,
                            title,
                            facultyName
                        );

                        // Send email notifications to all students
                        const { rows: students } = await pool.query(
                            'SELECT id, name, email FROM users WHERE role = $1 AND status = $2',
                            ['student', 'approved']
                        );

                        // Send emails asynchronously (don't wait for all to complete)
                        students.forEach(student => {
                            emailService.sendEventCreatedEmail(
                                eventDetails,
                                student.email,
                                student.name
                            ).catch(err => {
                                console.error(`Failed to send email to ${student.email}:`, err);
                            });
                        });

                    } catch (notifError) {
                        console.error('Failed to send notifications:', notifError);
                        // Don't fail the request if notifications fail
                    }

                    res.json({
                        message: 'Event created successfully',
                        eventId
                    });
                } catch (error) {
                    console.error('Create event error:', error);
                    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
                }
            });
        } catch (error) {
            console.error('Create event error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Update event
    updateEvent: async (req, res) => {
        try {
            upload(req, res, async function (err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }

                try {
                    const { id } = req.params;
                    const eventData = req.body;

                    // Check if event exists
                    const { rows: events } = await pool.query(
                        'SELECT id FROM events WHERE id = $1',
                        [id]
                    );

                    if (events.length === 0) {
                        return res.status(404).json({ error: 'Event not found' });
                    }

                    // Map frontend field names to database column names
                    const mappedData = {};

                    if (eventData.title !== undefined) mappedData.title = eventData.title;
                    if (eventData.description !== undefined) mappedData.description = eventData.description;
                    if (eventData.category !== undefined) mappedData.category = eventData.category;
                    if (eventData.location !== undefined) mappedData.location = eventData.location;

                    // Map date and time fields
                    if (eventData.eventDate !== undefined) mappedData.event_date = eventData.eventDate;
                    if (eventData.eventTime !== undefined) mappedData.event_time = eventData.eventTime;

                    // Map other fields
                    if (eventData.organizedBy !== undefined) mappedData.organized_by = eventData.organizedBy;
                    if (eventData.organizerDepartment !== undefined) {
                        mappedData.organizer_department = eventData.organizerDepartment;
                        if (!eventData.organizedBy) {
                            mappedData.organized_by = eventData.organizerDepartment;
                        }
                    }
                    if (eventData.rulesEligibility !== undefined) mappedData.rules_eligibility = eventData.rulesEligibility;
                    if (eventData.maxParticipants !== undefined) {
                        const mp = eventData.maxParticipants;
                        mappedData.max_participants = (mp === '' || mp === 'null' || mp === null || mp === undefined || mp === '0') ? null : parseInt(mp, 10);
                    }
                    if (eventData.registrationFees !== undefined) {
                        // Postgres rejects '' for a numeric column, so treat an empty fee as free
                        mappedData.registration_fees = eventData.registrationFees === '' ? 0 : eventData.registrationFees;
                    }

                    // Handle payment QR code update
                    if (req.files && req.files['paymentQr'] && req.files['paymentQr'].length > 0) {
                        await savePaymentQr(id, req.files['paymentQr'][0]);
                    }

                    // Update event fields
                    // (column names come from the fixed mapping above, never from user input)
                    const columns = Object.keys(mappedData);
                    if (columns.length > 0) {
                        await pool.query(
                            `UPDATE events SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')}
                             WHERE id = $${columns.length + 1}`,
                            [...Object.values(mappedData), id]
                        );
                    }

                    // Handle removed images
                    if (eventData.removedImageIds) {
                        let removedIds;
                        try {
                            removedIds = JSON.parse(eventData.removedImageIds);
                        } catch (e) {
                            removedIds = [];
                        }
                        if (Array.isArray(removedIds) && removedIds.length > 0) {
                            await pool.query(
                                'DELETE FROM event_gallery WHERE id = ANY($1::int[]) AND event_id = $2',
                                [removedIds.map(Number).filter(Number.isInteger), id]
                            );
                        }
                    }

                    // Handle new image uploads
                    if (req.files && req.files['images'] && req.files['images'].length > 0) {
                        await saveGalleryImages(id, req.files['images']);
                    }

                    res.json({ message: 'Event updated successfully' });
                } catch (error) {
                    console.error('Update event error:', error);
                    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
                }
            });
        } catch (error) {
            console.error('Update event error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Delete event
    deleteEvent: async (req, res) => {
        try {
            const { id } = req.params;

            // Check if event exists
            const { rows: events } = await pool.query(
                'SELECT id FROM events WHERE id = $1',
                [id]
            );

            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Delete event (cascade will delete related records)
            await pool.query('DELETE FROM events WHERE id = $1', [id]);

            res.json({ message: 'Event deleted successfully' });
        } catch (error) {
            console.error('Delete event error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get events by date (past/future)
    getEventsByDate: async (req, res) => {
        try {
            const { type } = req.params; // 'past' or 'future'
            const today = new Date().toISOString().split('T')[0];

            let query = EVENT_SELECT;

            if (type === 'past') {
                query += ` WHERE e.event_date < $1 ORDER BY e.event_date DESC`;
            } else if (type === 'future') {
                query += ` WHERE e.event_date >= $1 ORDER BY e.event_date ASC`;
            } else {
                return res.status(400).json({ error: 'Invalid event type' });
            }

            const { rows: events } = await pool.query(query, [today]);

            // Get images for each event
            for (let event of events) {
                const { rows: images } = await pool.query(
                    `SELECT ${GALLERY_COLUMNS} FROM event_gallery WHERE event_id = $1 ORDER BY id`,
                    [event.id]
                );
                event.images = images;
            }

            res.json(events);
        } catch (error) {
            console.error('Get events by date error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = eventController;