const pool = require('../config/db');

// "Today" in Indian time, independent of the database session's timezone
const TODAY = "(NOW() AT TIME ZONE 'Asia/Kolkata')::date";

const statsController = {
    // Get dashboard statistics for admin
    getDashboardStats: async (req, res) => {
        try {
            // Get counts in parallel
            const [
                { rows: eventsResult },
                { rows: studentsResult },
                { rows: facultyResult },
                { rows: participationsResult },
                { rows: pendingFacultyResult }
            ] = await Promise.all([
                pool.query('SELECT COUNT(*) as count FROM events'),
                pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND status = 'approved'"),
                pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'faculty' AND status = 'approved'"),
                pool.query('SELECT COUNT(*) as count FROM participations'),
                pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'faculty' AND status = 'pending'")
            ]);

            // Get recent events (last 7 days)
            const { rows: recentEvents } = await pool.query(
                `SELECT COUNT(*) as count FROM events
                 WHERE created_at >= NOW() - INTERVAL '7 days'`
            );

            // Get upcoming events
            const { rows: upcomingEvents } = await pool.query(
                `SELECT COUNT(*) as count FROM events
                 WHERE event_date >= ${TODAY}`
            );

            // Get feedback count
            const { rows: feedbackResult } = await pool.query(
                'SELECT COUNT(*) as count FROM feedback'
            );

            // Get registrations for current month
            const { rows: monthlyRegistrations } = await pool.query(
                `SELECT COUNT(*) as count FROM participations
                 WHERE date_trunc('month', registered_at AT TIME ZONE 'Asia/Kolkata') = date_trunc('month', NOW() AT TIME ZONE 'Asia/Kolkata')`
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
            const { rows: myEventsResult } = await pool.query(
                'SELECT COUNT(*) as count FROM events WHERE created_by = $1',
                [facultyId]
            );

            // Get upcoming events for this faculty
            const { rows: upcomingEvents } = await pool.query(
                `SELECT COUNT(*) as count FROM events
                 WHERE created_by = $1 AND event_date >= ${TODAY}`,
                [facultyId]
            );

            // Get total participants for faculty's events
            const { rows: participantsResult } = await pool.query(
                `SELECT COUNT(DISTINCT p.student_id) as count
                 FROM participations p
                 JOIN events e ON p.event_id = e.id
                 WHERE e.created_by = $1`,
                [facultyId]
            );

            // Get events by category for this faculty
            const { rows: eventsByCategory } = await pool.query(
                `SELECT category, COUNT(*) as count
                 FROM events
                 WHERE created_by = $1
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
            const { rows: registrationsResult } = await pool.query(
                'SELECT COUNT(*) as count FROM participations WHERE student_id = $1',
                [studentId]
            );

            // Get upcoming registrations
            const { rows: upcomingRegistrations } = await pool.query(
                `SELECT COUNT(*) as count
                 FROM participations p
                 JOIN events e ON p.event_id = e.id
                 WHERE p.student_id = $1 AND e.event_date >= ${TODAY}`,
                [studentId]
            );

            // Get feedback submitted
            const { rows: feedbackResult } = await pool.query(
                'SELECT COUNT(*) as count FROM feedback WHERE student_id = $1',
                [studentId]
            );

            // Get events attended (past)
            const { rows: attendedEvents } = await pool.query(
                `SELECT COUNT(DISTINCT p.event_id) as count
                 FROM participations p
                 JOIN events e ON p.event_id = e.id
                 WHERE p.student_id = $1 AND e.event_date < ${TODAY}`,
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
            const { rows: monthlyEvents } = await pool.query(
                `SELECT
                    to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') as month,
                    COUNT(*) as count
                 FROM events
                 WHERE created_at >= NOW() - INTERVAL '6 months'
                 GROUP BY to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')
                 ORDER BY month`
            );

            // Get category distribution
            const { rows: categoryStats } = await pool.query(
                `SELECT category, COUNT(*) as count
                 FROM events
                 GROUP BY category`
            );

            // Get registration trends
            const { rows: registrationTrends } = await pool.query(
                `SELECT
                    to_char(registered_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') as "date",
                    COUNT(*) as count
                 FROM participations
                 WHERE registered_at >= NOW() - INTERVAL '30 days'
                 GROUP BY to_char(registered_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
                 ORDER BY "date"`
            );

            // Get top events by participation
            const { rows: topEvents } = await pool.query(
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
            const { rows: userGrowth } = await pool.query(
                `SELECT
                    to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') as month,
                    role,
                    COUNT(*) as count
                 FROM users
                 WHERE created_at >= NOW() - INTERVAL '6 months'
                 GROUP BY to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM'), role
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