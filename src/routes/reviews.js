const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

router.post('/add', auth, reviewController.addReview);
router.get('/:workerId', reviewController.getWorkerReviews);
router.get('/user/reviews', auth, reviewController.getUserReviews);

module.exports = router;
