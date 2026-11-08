const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// All files are served straight from the database
router.get('/gallery/:id', fileController.getGalleryImage);
router.get('/event-qr/:eventId', fileController.getEventPaymentQr);
router.get('/participations/:id', fileController.getParticipationFile);
router.get('/reports/:id', fileController.getReport);

module.exports = router;
