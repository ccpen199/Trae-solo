import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/login', authController.login);
router.post('/send-sms', authController.sendSmsCode);
router.post('/login-sms', authController.loginBySms);
router.post('/login-face', authController.loginByFace);
router.post('/face-verify', authController.faceVerify);
router.get('/user', authController.getCurrentUser);

export default router;
