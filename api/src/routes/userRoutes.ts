import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

router.post('/login', userController.login);
router.get('/:userId', userController.getUserInfo);
router.put('/:userId', userController.updateUserInfo);
router.post('/follow', userController.followUser);
router.get('/:userId/follows', userController.getFollowList);

export default router;
