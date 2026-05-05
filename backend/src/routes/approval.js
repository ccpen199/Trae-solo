const express = require('express');
const approvalController = require('../controllers/approvalController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/todos', authenticate, approvalController.getTodoList);
router.get('/todos/:id', authenticate, approvalController.getTodoDetail);
router.post('/todos/:id/handle', authenticate, approvalController.handleApproval);

module.exports = router;
