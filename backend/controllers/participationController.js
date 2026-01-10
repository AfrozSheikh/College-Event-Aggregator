const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const emailService = require('../services/emailService');


// Configure multer for document upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only document files are allowed!'));
    }
}).single('document');

const participationController = {
    // Register for event
    registerForEvent: async (req, res) => {
        try {
            upload(req, res, async function (err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
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
                
                // Check if already registered
                const [existing] = await pool.query(
                    'SELECT id FROM participations WHERE event_id = ? AND student_id = ?',
                    [eventId, studentId]
                );
                
                if (existing.length > 0) {
                    return res.status(400).json({ error: 'Already registered for this event' });
                }
                
                // Insert participation
                const participationData = {
                    event_id: eventId,
                    student_id: studentId,
                    name,
                    email,
                    phone,
                    college,
                    course_year: courseYear,
                    team_members: teamMembers,
                    document_path: req.file ? req.file.path : null
                };
                
                await pool.query('INSERT INTO participations SET ?', participationData);
                
                // Send registration confirmation email
                try {
                    const [eventDetails] = await pool.query(
                        'SELECT * FROM events WHERE id = ?',
                        [eventId]
                    );
                    
                    if (eventDetails.length > 0) {
                        await emailService.sendRegistrationConfirmation(
                            eventDetails[0],
                            { name, email }
                        );
                    }
                } catch (emailError) {
                    console.error('Failed to send registration confirmation email:', emailError);
                    // Don't fail the request if email fails
                }
                
                res.json({ message: 'Successfully registered for the event!' });
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get participations for an event (Admin only)
    getEventParticipations: async (req, res) => {
        try {
            const { eventId } = req.params;
            
            const [participations] = await pool.query(
                `SELECT p.*, u.name as student_name, u.email as student_email 
                 FROM participations p 
                 LEFT JOIN users u ON p.student_id = u.id 
                 WHERE p.event_id = ?`,
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