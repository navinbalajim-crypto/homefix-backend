const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/profile', auth, userController.getProfile);
router.patch('/profile', auth, userController.updateProfile);
router.patch('/location', auth, userController.updateLocation);

module.exports = router;
