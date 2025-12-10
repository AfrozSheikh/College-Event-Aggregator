const pool = require('../config/db');

const userController = {
    // Get all pending faculty
    getPendingFaculty: async (req, res) => {
        try {
            const [faculty] = await pool.query(
                'SELECT id, name, email, phone, faculty_id, department, created_at FROM users WHERE role = "faculty" AND status = "pending"'
            );
            res.json(faculty);
        } catch (error) {
            console.error('Get pending faculty error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const [users] = await pool.query(
                'SELECT id, name, email, phone, role, status, faculty_id, department, college_name, course, year FROM users WHERE role != "admin"'
            );
            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Approve faculty
    approveFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [result] = await pool.query(
                'UPDATE users SET status = "approved" WHERE id = ? AND role = "faculty"',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Faculty not found' });
            }
            
            res.json({ message: 'Faculty approved successfully' });
        } catch (error) {
            console.error('Approve faculty error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [result] = await pool.query(
                'DELETE FROM users WHERE id = ? AND role != "admin"',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Get dashboard statistics
    getDashboardStats: async (req, res) => {
        try {
            const [events] = await pool.query('SELECT COUNT(*) as count FROM events');
            const [students] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student" AND status = "approved"');
            const [faculty] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty" AND status = "approved"');
            const [participations] = await pool.query('SELECT COUNT(*) as count FROM participations');
            
            res.json({
                totalEvents: events[0].count,
                totalStudents: students[0].count,
                totalFaculty: faculty[0].count,
                totalParticipants: participations[0].count
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = userController;