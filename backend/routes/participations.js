const express = require('express');
const router = express.Router();
const participationController = require('../controllers/participationController');

router.post('/register', participationController.registerForEvent);
router.get('/event/:eventId', participationController.getEventParticipations);
router.get('/student/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
      
      const [participations] = await pool.query(
        `SELECT p.*, e.title as event_title, e.event_date, e.location, e.category 
         FROM participations p 
         LEFT JOIN events e ON p.event_id = e.id 
         WHERE p.student_id = ? 
         ORDER BY e.event_date DESC`,
        [studentId]
      );
      
      res.json(participations);
    } catch (error) {
      console.error('Get student participations error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
module.exports = router;