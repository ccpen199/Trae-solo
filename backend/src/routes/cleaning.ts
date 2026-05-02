import { Router } from 'express';
import { body, param } from 'express-validator';
import cleaningController from '../controllers/CleaningController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../constants/enums';

const router = Router();

router.use(authenticate);

router.get('/statistics', cleaningController.getStatistics);

router.get('/available-cleaners', 
  requireRole(UserRole.LANDLORD, UserRole.ADMIN),
  cleaningController.getAvailableCleaners
);

router.get('/', cleaningController.getTasks);

router.get('/:id', cleaningController.getTask);

router.post(
  '/:id/assign',
  requireRole(UserRole.LANDLORD, UserRole.ADMIN),
  [
    param('id').notEmpty().withMessage('任务ID不能为空'),
    body('cleanerId').notEmpty().withMessage('保洁人员ID不能为空'),
  ],
  cleaningController.assignCleaner
);

router.post(
  '/:id/auto-dispatch',
  requireRole(UserRole.LANDLORD, UserRole.ADMIN),
  [
    param('id').notEmpty().withMessage('任务ID不能为空'),
  ],
  cleaningController.autoDispatch
);

router.post(
  '/:id/start',
  requireRole(UserRole.CLEANER),
  [
    param('id').notEmpty().withMessage('任务ID不能为空'),
  ],
  cleaningController.startTask
);

router.post(
  '/:id/complete',
  requireRole(UserRole.CLEANER),
  [
    param('id').notEmpty().withMessage('任务ID不能为空'),
  ],
  cleaningController.completeTask
);

router.post(
  '/:id/verify',
  requireRole(UserRole.LANDLORD, UserRole.ADMIN),
  [
    param('id').notEmpty().withMessage('任务ID不能为空'),
  ],
  cleaningController.verifyTask
);

router.post(
  '/:id/cancel',
  requireRole(UserRole.LANDLORD, UserRole.ADMIN),
  [
    param('id').notEmpty().withMessage('任务ID不能为空'),
    body('reason').notEmpty().withMessage('取消原因不能为空'),
  ],
  cleaningController.cancelTask
);

export default router;
