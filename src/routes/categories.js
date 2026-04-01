const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/seed', categoryController.seedCategories);

module.exports = router;
