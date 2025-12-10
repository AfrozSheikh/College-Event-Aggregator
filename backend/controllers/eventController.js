const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/event-images/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
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
}).array('images', 10); // Max 10 images

const eventController = {
    // Get all events
    getAllEvents: async (req, res) => {
        try {
            const [events] = await pool.query(`
                SELECT e.*, u.name as organizer_name 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                ORDER BY e.event_date DESC
            `);
            
            // Get images for each event
            for (let event of events) {
                const [images] = await pool.query(
                    'SELECT * FROM event_gallery WHERE event_id = ?',
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
            
            const [events] = await pool.query(`
                SELECT e.*, u.name as organizer_name 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                WHERE e.id = ?
            `, [id]);
            
            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            const [images] = await pool.query(
                'SELECT * FROM event_gallery WHERE event_id = ?',
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
                
                const {
                    title,
                    description,
                    category,
                    location,
                    eventDate,
                    eventTime,
                    organizedBy,
                    rulesEligibility,
                    maxParticipants,
                    registrationFees,
                    createdBy
                } = req.body;
                
                // Insert event
                const [result] = await pool.query(
                    `INSERT INTO events 
                    (title, description, category, location, event_date, event_time, 
                     organized_by, rules_eligibility, max_participants, registration_fees, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        title,
                        description,
                        category,
                        location,
                        eventDate,
                        eventTime,
                        organizedBy,
                        rulesEligibility,
                        maxParticipants || null,
                        registrationFees || 0,
                        createdBy
                    ]
                );
                
                const eventId = result.insertId;
                
                // Handle image uploads
                if (req.files && req.files.length > 0) {
                    const imageInserts = req.files.map(file => {
                        return pool.query(
                            'INSERT INTO event_gallery (event_id, image_path) VALUES (?, ?)',
                            [eventId, file.path]
                        );
                    });
                    await Promise.all(imageInserts);
                }
                
                res.json({ 
                    message: 'Event created successfully',
                    eventId 
                });
            });
        } catch (error) {
            console.error('Create event error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Update event
    updateEvent: async (req, res) => {
        try {
            const { id } = req.params;
            const eventData = req.body;
            
            // Check if event exists
            const [events] = await pool.query(
                'SELECT id FROM events WHERE id = ?',
                [id]
            );
            
            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            // Update event
            const [result] = await pool.query(
                'UPDATE events SET ? WHERE id = ?',
                [eventData, id]
            );
            
            res.json({ message: 'Event updated successfully' });
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
            const [events] = await pool.query(
                'SELECT id FROM events WHERE id = ?',
                [id]
            );
            
            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            // Delete event (cascade will delete related records)
            await pool.query('DELETE FROM events WHERE id = ?', [id]);
            
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
            
            let query = `
                SELECT e.*, u.name as organizer_name 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
            `;
            
            if (type === 'past') {
                query += ` WHERE e.event_date < ? ORDER BY e.event_date DESC`;
            } else if (type === 'future') {
                query += ` WHERE e.event_date >= ? ORDER BY e.event_date ASC`;
            } else {
                return res.status(400).json({ error: 'Invalid event type' });
            }
            
            const [events] = await pool.query(query, [today]);
            
            // Get images for each event
            for (let event of events) {
                const [images] = await pool.query(
                    'SELECT * FROM event_gallery WHERE event_id = ?',
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