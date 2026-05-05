import express from 'express';
import mockController from '../controllers/mock.controller.js';

const router = express.Router();

router.post('/user-activity/check', mockController.checkUserActivity);
router.post('/risk-check/level', mockController.getRiskLevel);
router.post('/user-activity/target-check', mockController.checkTargetProductActivity);
router.post('/risk-check/blacklist', mockController.checkBlacklist);
router.post('/member-center/check', mockController.checkMemberCenter);
router.post('/member-center/register', mockController.registerMember);

export default router;
