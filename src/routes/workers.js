const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { auth } = require('../middleware/auth');

// Get all workers (public)
router.get('/', async (req, res) => {
  try {
    const Worker = require('../models/Worker');
    const { occupation } = req.query;
    
    let query = { verified: true, blocked: false };
    if (occupation) query.occupation = occupation;
    
    const workers = await Worker.find(query).lean();
    
    res.json({
      success: true,
      count: workers.length,
      workers: workers.map(w => ({
        ...w,
        distance: (Math.random() * 5 + 1).toFixed(1)
      }))
    });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/nearby', workerController.getNearbyWorkers);
router.get('/recommended', workerController.getRecommendedWorkers);
router.get('/:id', workerController.getWorkerById);
router.post('/register', auth, workerController.registerWorker);
router.patch('/update', auth, workerController.updateWorker);
router.patch('/availability', auth, workerController.updateAvailability);
router.patch('/location', auth, workerController.updateLocation);
router.get('/earnings/dashboard', auth, workerController.getEarnings);
router.post('/emergency', workerController.emergencyRequest);

module.exports = router;
