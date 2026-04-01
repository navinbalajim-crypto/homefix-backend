const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/dashboard', adminAuth, adminController.getDashboardStats);
router.get('/workers', adminAuth, adminController.getAllWorkers);
router.get('/workers/:id', adminController.getWorkerDetails);
router.patch('/verify-worker', adminAuth, adminController.verifyWorker);
router.patch('/block-worker', adminController.blockWorker);
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.get('/revenue', adminAuth, adminController.getRevenueReport);

module.exports = router;
