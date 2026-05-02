import { Router } from 'express';
import * as exceptionController from '../controllers/exceptionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, exceptionController.getExceptionStats);
router.get('/', authMiddleware, exceptionController.getExceptionsValidation, exceptionController.getExceptions);
router.get('/:id', authMiddleware, exceptionController.getExceptionById);

router.post('/:id/assign', authMiddleware, exceptionController.assignException);
router.put('/:id/status', authMiddleware, exceptionController.updateExceptionStatus);
router.post('/:id/logs', authMiddleware, exceptionController.addExceptionLog);

export default router;
