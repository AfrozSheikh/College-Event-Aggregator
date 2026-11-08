const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const emailService = require('../services/emailService');


// Configure multer for registration uploads - files are kept in memory and saved to the DB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        // Payment screenshots must be images, documents can also be PDF/DOC
        const filetypes = file.fieldname === 'paymentScreenshot'
            ? /jpeg|jpg|png|webp/
            : /pdf|doc|docx|jpg|jpeg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(file.fieldname === 'paymentScreenshot'
            ? 'Payment screenshot must be a JPG, PNG or WEBP image!'
            : 'Only document files are allowed!'));
    }
}).fields([
    { name: 'document', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 }
]);

// URLs for files attached to a participation (served by /api/files)
const PARTICIPATION_FILE_URLS = `
    (SELECT CONCAT('/api/files/participations/', pf.id) FROM participation_files pf
        WHERE pf.participation_id = p.id AND pf.file_type = 'document') AS document_url,
    (SELECT CONCAT('/api/files/participations/', pf.id) FROM participation_files pf
        WHERE pf.participation_id = p.id AND pf.file_type = 'payment_screenshot') AS payment_screenshot_url`;

const participationController = {
    PARTICIPATION_FILE_URLS,

    // Register for event
    registerForEvent: async (req, res) => {
        upload(req, res, async function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            let connection;
            try {
                connection = await pool.connect();

                const {
                    eventId,
                    studentId,
                    name,
                    email,
                    phone,
                    college,
                    courseYear,
                    teamMembers
                } = req.body;

                const documentFile = req.files?.document?.[0];
                const paymentScreenshot = req.files?.paymentScreenshot?.[0];

                const { rows: eventDetails } = await connection.query(
                    'SELECT * FROM events WHERE id = $1',
                    [eventId]
                );

                if (eventDetails.length === 0) {
                    return res.status(404).json({ error: 'Event not found' });
                }

                // Paid events need proof of payment
                if (Number(eventDetails[0].registration_fees) > 0 && !paymentScreenshot) {
                    return res.status(400).json({ error: 'Please upload the payment screenshot for this paid event' });
                }

                // Check if already registered
                const { rows: existing } = await connection.query(
                    'SELECT id FROM participations WHERE event_id = $1 AND student_id = $2',
                    [eventId, studentId]
                );

                if (existing.length > 0) {
                    return res.status(400).json({ error: 'Already registered for this event' });
                }

                await connection.query('BEGIN');

                // Insert participation
                const participationData = {
                    event_id: eventId,
                    student_id: studentId,
                    name,
                    email,
                    phone,
                    college,
                    course_year: courseYear,
                    team_members: teamMembers
                };

                const columns = Object.keys(participationData);
                const { rows: inserted } = await connection.query(
                    `INSERT INTO participations (${columns.join(', ')})
                     VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
                     RETURNING id`,
                    Object.values(participationData)
                );

                // Save uploaded files in the database
                const files = [
                    ['document', documentFile],
                    ['payment_screenshot', paymentScreenshot]
                ].filter(([, file]) => file);

                for (const [fileType, file] of files) {
                    await connection.query(
                        `INSERT INTO participation_files (participation_id, file_type, file_name, mime_type, file_data)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [inserted[0].id, fileType, file.originalname, file.mimetype, file.buffer]
                    );
                }

                await connection.query('COMMIT');

                // Send registration confirmation email
                try {
                    await emailService.sendRegistrationConfirmation(
                        eventDetails[0],
                        { name, email }
                    );
                } catch (emailError) {
                    console.error('Failed to send registration confirmation email:', emailError);
                    // Don't fail the request if email fails
                }

                res.json({ message: 'Successfully registered for the event!' });
            } catch (error) {
                if (connection) await connection.query('ROLLBACK').catch(() => {});
                console.error('Registration error:', error);
                res.status(500).json({ error: 'Server error' });
            } finally {
                if (connection) connection.release();
            }
        });
    },

    // Get participations for an event (Admin only)
    getEventParticipations: async (req, res) => {
        try {
            const { eventId } = req.params;

            const { rows: participations } = await pool.query(
                `SELECT p.*, u.name as student_name, u.email as student_email, ${PARTICIPATION_FILE_URLS}
                 FROM participations p
                 LEFT JOIN users u ON p.student_id = u.id
                 WHERE p.event_id = $1
                 ORDER BY p.registered_at`,
                [eventId]
            );

            res.json(participations);
        } catch (error) {
            console.error('Get participations error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = participationController;