const express = require('express');
const router = express.Router();
const feedbackFormController = require('../controllers/feedbackFormController');

// Feedback form routes
router.post('/', feedbackFormController.createFeedbackForm);
router.get('/event/:eventId', feedbackFormController.getFeedbackForm);
router.put('/:id', feedbackFormController.updateFeedbackForm);
router.delete('/:id', feedbackFormController.deleteFeedbackForm);

// Feedback response routes
router.post('/responses', feedbackFormController.submitFeedbackResponse);
router.get('/:formId/responses', feedbackFormController.getFeedbackResponses);
router.get('/check/:eventId/:studentId', feedbackFormController.checkFeedbackStatus);
router.get('/responses/event/:eventId', feedbackFormController.getResponsesByEvent);

module.exports = router;
