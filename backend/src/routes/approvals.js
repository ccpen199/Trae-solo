const express = require('express');
const ApprovalController = require('../controllers/ApprovalController');

const router = express.Router();

router.post('/', ApprovalController.submitApproval);
router.get('/', ApprovalController.getApprovalList);
router.get('/:id', ApprovalController.getApprovalDetail);
router.post('/:approval_id/process', ApprovalController.processApproval);
router.get('/teacher/:teacher_id', ApprovalController.getTeacherApprovals);

module.exports = router;
