const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

const pool = require('./config/db');

(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Connected to Neon Postgres');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
})();


// Middleware
// Allow requests from any origin (frontend is hosted separately, e.g. on Vercel)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add with other imports
const notificationRoutes = require('./routes/notifications');


// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const participationRoutes = require('./routes/participations');
const feedbackRoutes = require('./routes/feedback');
const feedbackFormRoutes = require('./routes/feedbackForms');
const reportRoutes = require('./routes/reports');
const fileRoutes = require('./routes/files');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/feedback-forms', feedbackFormRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/files', fileRoutes); // images, QR codes, screenshots & reports stored in DB
// Add with other routes
app.use('/api/notifications', notificationRoutes);
// Add with other imports
const statsRoutes = require('./routes/stats');

// Add with other routes
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});