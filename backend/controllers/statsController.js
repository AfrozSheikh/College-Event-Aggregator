const pool = require('../config/db');

const statsController = {
    // Get dashboard statistics for admin
    getDashboardStats: async (req, res) => {
        try {
            // Get counts in parallel
            const [
                [eventsResult],
                [studentsResult],
                [facultyResult],
                [participationsResult],
                [pendingFacultyResult]
            ] = await Promise.all([
                pool.query('SELECT COUNT(*) as count FROM events'),
                pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student" AND status = "approved"'),
                pool.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty" AND status = "approved"'),
                pool.query('SELECT COUNT(*) as count FROM participations'),
                pool.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty" AND status = "pending"')
            ]);
            
            // Get recent events (last 7 days)
            const [recentEvents] = await pool.query(
                `SELECT COUNT(*) as count FROM events 
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
            );
            
            // Get upcoming events
            const [upcomingEvents] = await pool.query(
                `SELECT COUNT(*) as count FROM events 
                 WHERE event_date >= CURDATE()`
            );
            
            // Get feedback count
            const [feedbackResult] = await pool.query(
                'SELECT COUNT(*) as count FROM feedback'
            );
            
            // Get registrations for current month
            const [monthlyRegistrations] = await pool.query(
                `SELECT COUNT(*) as count FROM participations 
                 WHERE MONTH(registered_at) = MONTH(CURDATE()) 
                 AND YEAR(registered_at) = YEAR(CURDATE())`
            );
            
            const stats = {
                totalEvents: eventsResult[0].count || 0,
                totalStudents: studentsResult[0].count || 0,
                totalFaculty: facultyResult[0].count || 0,
                totalParticipants: participationsResult[0].count || 0,
                pendingFaculty: pendingFacultyResult[0].count || 0,
                recentEvents: recentEvents[0].count || 0,
                upcomingEvents: upcomingEvents[0].count || 0,
                totalFeedback: feedbackResult[0].count || 0,
                monthlyRegistrations: monthlyRegistrations[0].count || 0
            };
            
            res.json(stats);
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get faculty-specific stats
    getFacultyStats: async (req, res) => {
        try {
            const { facultyId } = req.params;
            
            // Get faculty's created events
            const [myEventsResult] = await pool.query(
                'SELECT COUNT(*) as count FROM events WHERE created_by = ?',
                [facultyId]
            );
            
            // Get upcoming events for this faculty
            const [upcomingEvents] = await pool.query(
                `SELECT COUNT(*) as count FROM events 
                 WHERE created_by = ? AND event_date >= CURDATE()`,
                [facultyId]
            );
            
            // Get total participants for faculty's events
            const [participantsResult] = await pool.query(
                `SELECT COUNT(DISTINCT p.student_id) as count 
                 FROM participations p 
                 JOIN events e ON p.event_id = e.id 
                 WHERE e.created_by = ?`,
                [facultyId]
            );
            
            // Get events by category for this faculty
            const [eventsByCategory] = await pool.query(
                `SELECT category, COUNT(*) as count 
                 FROM events 
                 WHERE created_by = ? 
                 GROUP BY category`,
                [facultyId]
            );
            
            const stats = {
                myEvents: myEventsResult[0].count || 0,
                upcomingEvents: upcomingEvents[0].count || 0,
                totalParticipants: participantsResult[0].count || 0,
                eventsByCategory: eventsByCategory
            };
            
            res.json(stats);
        } catch (error) {
            console.error('Get faculty stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get student-specific stats
    getStudentStats: async (req, res) => {
        try {
            const { studentId } = req.params;
            
            // Get student's registrations
            const [registrationsResult] = await pool.query(
                'SELECT COUNT(*) as count FROM participations WHERE student_id = ?',
                [studentId]
            );
            
            // Get upcoming registrations
            const [upcomingRegistrations] = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM participations p 
                 JOIN events e ON p.event_id = e.id 
                 WHERE p.student_id = ? AND e.event_date >= CURDATE()`,
                [studentId]
            );
            
            // Get feedback submitted
            const [feedbackResult] = await pool.query(
                'SELECT COUNT(*) as count FROM feedback WHERE student_id = ?',
                [studentId]
            );
            
            // Get events attended (past)
            const [attendedEvents] = await pool.query(
                `SELECT COUNT(DISTINCT p.event_id) as count 
                 FROM participations p 
                 JOIN events e ON p.event_id = e.id 
                 WHERE p.student_id = ? AND e.event_date < CURDATE()`,
                [studentId]
            );
            
            const stats = {
                totalRegistrations: registrationsResult[0].count || 0,
                upcomingRegistrations: upcomingRegistrations[0].count || 0,
                feedbackSubmitted: feedbackResult[0].count || 0,
                attendedEvents: attendedEvents[0].count || 0
            };
            
            res.json(stats);
        } catch (error) {
            console.error('Get student stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get system-wide analytics
    getSystemAnalytics: async (req, res) => {
        try {
            // Get monthly event creation stats
            const [monthlyEvents] = await pool.query(
                `SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count
                 FROM events 
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month`
            );
            
            // Get category distribution
            const [categoryStats] = await pool.query(
                `SELECT category, COUNT(*) as count 
                 FROM events 
                 GROUP BY category`
            );
            
            // Get registration trends
            const [registrationTrends] = await pool.query(
                `SELECT 
                    DATE_FORMAT(registered_at, '%Y-%m-%d') as date,
                    COUNT(*) as count
                 FROM participations 
                 WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                 GROUP BY DATE_FORMAT(registered_at, '%Y-%m-%d')
                 ORDER BY date`
            );
            
            // Get top events by participation
            const [topEvents] = await pool.query(
                `SELECT 
                    e.title,
                    COUNT(p.id) as participants
                 FROM events e
                 LEFT JOIN participations p ON e.id = p.event_id
                 GROUP BY e.id, e.title
                 ORDER BY participants DESC
                 LIMIT 10`
            );
            
            // Get user growth
            const [userGrowth] = await pool.query(
                `SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    role,
                    COUNT(*) as count
                 FROM users 
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m'), role
                 ORDER BY month`
            );
            
            const analytics = {
                monthlyEvents,
                categoryStats,
                registrationTrends,
                topEvents,
                userGrowth
            };
            
            res.json(analytics);
        } catch (error) {
            console.error('Get system analytics error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = statsController;