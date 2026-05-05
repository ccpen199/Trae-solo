import { Router } from 'express';
import { authMiddleware, requireAdmin, requireSupervisor } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router = Router();

// 所有用户路由都需要认证
router.use(authMiddleware);

// 获取所有员工（主管创建任务时选择实施人）
router.get('/employees', requireSupervisor, userController.getEmployees);

// 管理员路由
router.get('/', requireAdmin, userController.getAllUsers);
router.post('/', requireAdmin, userController.createUserValidation, userController.createUser);
router.put('/:id', requireAdmin, userController.updateUserValidation, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);

export default router;
