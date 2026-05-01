import { Router, Request, Response } from 'express';
import { registerController, loginController, logoutController, refreshTokenController } from '../controllers/authController';
import {
  getCurrentUserController,
  getUserByIdController,
  updateCurrentUserController,
  changePasswordController,
  upgradeRoleController,
  deactivateUserController,
} from '../controllers/userController';
import { contextMiddleware } from '../middleware/context';
import { ApiResponse } from '../types';

const router = Router();

router.use(contextMiddleware);

const healthCheckRouter = Router();
healthCheckRouter.get('/', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string; service: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'user-service',
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };
  res.json(response);
});

router.use('/health', healthCheckRouter);

const authRouter = Router();
authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
authRouter.post('/refresh', refreshTokenController);

router.use('/auth', authRouter);

const userRouter = Router();
userRouter.get('/me', getCurrentUserController);
userRouter.put('/me', updateCurrentUserController);
userRouter.post('/me/change-password', changePasswordController);
userRouter.get('/:userId', getUserByIdController);
userRouter.post('/upgrade-role', upgradeRoleController);
userRouter.post('/deactivate', deactivateUserController);

router.use('/users', userRouter);

export default router;
