const pool = require('../config/db');

const notificationController = {
    // Create notification for all students when new event is created
    notifyNewEvent: async (eventId, eventTitle, facultyName) => {
        try {
            // Get all student users
            const [students] = await pool.query(
                'SELECT id FROM users WHERE role = "student" AND status = "approved"'
            );
            
            if (students.length === 0) return;
            
            // Create notifications for each student
            const notifications = students.map(student => [
                student.id,
                'New Event Created',
                `New event "${eventTitle}" has been created by ${facultyName}. Check it out!`,
                'new_event',
                false
            ]);
            
            // Insert all notifications at once - ESCAPE 'read' keyword with backticks
            await pool.query(
                'INSERT INTO notifications (user_id, title, message, type, `read`) VALUES ?',
                [notifications]
            );
            
            console.log(`Sent ${students.length} notifications for new event: ${eventTitle}`);
        } catch (error) {
            console.error('Error sending notifications:', error);
        }
    },

    // Get notifications for a user
    getUserNotifications: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const [notifications] = await pool.query(
                `SELECT * FROM notifications 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [userId]
            );
            
            res.json(notifications);
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            
            await pool.query(
                'UPDATE notifications SET `read` = TRUE WHERE id = ?',
                [notificationId]
            );
            
            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Mark all notifications as read
    markAllAsRead: async (req, res) => {

        console.log(req.body);
        // console.log("hit the dance");
        
        
        try {
            const { userId } = req.params;
            
            await pool.query(
                'UPDATE notifications SET `read` = TRUE WHERE user_id = ?',
                [userId]
            );
            
            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get unread notification count
    getUnreadCount: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const [result] = await pool.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND `read` = FALSE',
                [userId]
            );
            
            res.json({ count: result[0].count });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = notificationController;