const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getAllCategories);
router.get('/code/:code', categoryController.getCategoryByCode);

module.exports = router;
