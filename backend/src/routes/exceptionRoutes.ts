import { Router } from 'express';
import { getExceptions, getExceptionById, createException, resolveException } from '../controllers/exceptionController';

const router = Router();

router.get('/', getExceptions);
router.get('/:id', getExceptionById);
router.post('/', createException);
router.post('/:id/resolve', resolveException);

export default router;
