const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = require('./config/db'); // wherever your pool is

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
})();


// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/feedback-forms', feedbackFormRoutes);
app.use('/api/reports', reportRoutes);
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