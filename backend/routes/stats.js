const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Admin dashboard stats
router.get('/dashboard', statsController.getDashboardStats);

// Faculty-specific stats
router.get('/faculty/:facultyId', statsController.getFacultyStats);

// Student-specific stats
router.get('/student/:studentId', statsController.getStudentStats);

// System analytics
router.get('/analytics', statsController.getSystemAnalytics);

module.exports = router;