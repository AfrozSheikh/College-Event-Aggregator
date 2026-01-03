const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
// Add this route to get feedback by user
router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [feedback] = await pool.query(
        `SELECT f.*, e.title as event_title, e.event_date 
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
  });
router.get('/student/:userId', notificationController.getUserNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/user/:userId/read-all', notificationController.markAllAsRead);
router.get('/user/:userId/unread-count', notificationController.getUnreadCount);

module.exports = router;