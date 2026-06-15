import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/login', authController.login);
router.post('/face-verify', authController.faceVerify);
router.get('/user', authController.getCurrentUser);

export default router;
