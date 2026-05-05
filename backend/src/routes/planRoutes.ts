import { Router } from 'express';
import { authMiddleware, requireEmployee } from '../middleware/auth';
import * as planController from '../controllers/planController';

const router = Router();

// 所有计划路由都需要认证
router.use(authMiddleware);

// 获取任务下的所有计划（所有角色都可以，但有权限检查）
router.get('/task/:taskId', planController.getPlansByTask);

// 创建计划（员工）
router.post('/', requireEmployee, planController.createPlanValidation, planController.createPlan);

// 更新计划（员工）
router.put('/:id', requireEmployee, planController.updatePlanValidation, planController.updatePlan);

// 删除计划（员工）
router.delete('/:id', requireEmployee, planController.deletePlan);

export default router;
