const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/pending', userController.getPendingFaculty);
router.get('/all', userController.getAllUsers);
router.put('/:id/approve', userController.approveFaculty);
router.delete('/:id', userController.deleteUser);
router.get('/stats', userController.getDashboardStats);
// router.get('/stats', userController.getDashboardStats);

module.exports = router;