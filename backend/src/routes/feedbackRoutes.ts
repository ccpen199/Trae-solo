import { Router } from 'express';
import { authMiddleware, requireEmployee } from '../middleware/auth';
import * as feedbackController from '../controllers/feedbackController';

const router = Router();

// 所有反馈路由都需要认证
router.use(authMiddleware);

// 获取任务下的所有反馈（所有角色都可以，但有权限检查）
router.get('/task/:taskId', feedbackController.getFeedbacksByTask);

// 提交反馈（员工）
router.post('/', requireEmployee, feedbackController.submitFeedbackValidation, feedbackController.submitFeedback);

export default router;
