const pool = require('../config/db');

const feedbackController = {
    // Submit feedback
    submitFeedback: async (req, res) => {
        try {
            const { eventId, studentId, rating, comment, suggestions } = req.body;
            
            // Check if feedback already submitted
            const [existing] = await pool.query(
                'SELECT id FROM feedback WHERE event_id = ? AND student_id = ?',
                [eventId, studentId]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Feedback already submitted for this event' });
            }
            
            // Insert feedback
            await pool.query(
                `INSERT INTO feedback (event_id, student_id, rating, comment, suggestions) 
                 VALUES (?, ?, ?, ?, ?)`,
                [eventId, studentId, rating, comment, suggestions]
            );
            
            res.json({ message: 'Thank you for your feedback!' });
        } catch (error) {
            console.error('Submit feedback error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get feedback for an event
    getEventFeedback: async (req, res) => {
        try {
            const { eventId } = req.params;
            
            const [feedback] = await pool.query(
                `SELECT f.*, u.name as student_name 
                 FROM feedback f 
                 LEFT JOIN users u ON f.student_id = u.id 
                 WHERE f.event_id = ? 
                 ORDER BY f.submitted_at DESC`,
                [eventId]
            );
            
            // Calculate average rating
            const avgRating = feedback.length > 0 
                ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
                : 0;
            
            res.json({
                feedback,
                averageRating: avgRating.toFixed(1),
                totalFeedback: feedback.length
            });
        } catch (error) {
            console.error('Get feedback error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // ✅ ADD THIS FUNCTION - Get feedback by user
    getUserFeedback: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const [feedback] = await pool.query(
                `SELECT f.*, e.title as event_title, e.event_date, e.location 
                 FROM feedback f 
                 LEFT JOIN events e ON f.event_id = e.id 
                 WHERE f.student_id = ? 
                 ORDER BY f.submitted_at DESC`,
                [userId]
            );
            
            res.json(feedback);
        } catch (error) {
            console.error('Get user feedback error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // ✅ ADD THIS FUNCTION - Check feedback status
    checkFeedbackStatus: async (req, res) => {
        try {
            const { eventId, studentId } = req.params;
            
            const [feedback] = await pool.query(
                'SELECT id FROM feedback WHERE event_id = ? AND student_id = ?',
                [eventId, studentId]
            );
            
            res.json({ hasGivenFeedback: feedback.length > 0 });
        } catch (error) {
            console.error('Check feedback error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = feedbackController;