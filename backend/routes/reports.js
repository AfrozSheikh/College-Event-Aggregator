const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/event/:eventId', reportController.generateEventReport);

module.exports = router;