const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.post('/', feedbackController.submitFeedback);
router.get('/event/:eventId', feedbackController.getEventFeedback);
router.get('/check/:eventId/:studentId', feedbackController.checkFeedbackStatus);
router.get('/user/:userId', feedbackController.getUserFeedback); // ✅ Use controller

module.exports = router;
// const express = require('express');
// const router = express.Router();
// const feedbackController = require('../controllers/feedbackController');
// const pool = require('../config/db');

// router.post('/', feedbackController.submitFeedback);
// router.get('/event/:eventId', feedbackController.getEventFeedback);

// // Add check feedback status route
// router.get('/check/:eventId/:studentId', async (req, res) => {
//   try {
//     const { eventId, studentId } = req.params;
    
//     const [feedback] = await pool.query(
//       'SELECT id FROM feedback WHERE event_id = ? AND student_id = ?',
//       [eventId, studentId]
//     );
    
//     res.json({ hasGivenFeedback: feedback.length > 0 });
//   } catch (error) {
//     console.error('Check feedback error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // ✅ ADD THIS ROUTE - Get feedback by user ID
// router.get('/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
    
//     const [feedback] = await pool.query(
//       `SELECT f.*, e.title as event_title, e.event_date, e.location 
//        FROM feedback f 
//        LEFT JOIN events e ON f.event_id = e.id 
//        WHERE f.student_id = ? 
//        ORDER BY f.submitted_at DESC`,
//       [userId]
//     );
    
//     res.json(feedback);
//   } catch (error) {
//     console.error('Get user feedback error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;