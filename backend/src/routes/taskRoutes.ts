import { Router } from 'express';
import { authMiddleware, requireSupervisor, requireEmployee } from '../middleware/auth';
import * as taskController from '../controllers/taskController';

const router = Router();

// 所有任务路由都需要认证
router.use(authMiddleware);

// 主管获取自己创建的任务列表
router.get('/supervisor', requireSupervisor, taskController.getTasksValidation, taskController.getTasksBySupervisor);

// 员工获取分配给自己的任务列表
router.get('/employee', requireEmployee, taskController.getTasksValidation, taskController.getTasksByEmployee);

// 获取任务详情（所有角色都可以，但有权限检查）
router.get('/:id', taskController.getTaskDetail);

// 创建任务（主管）
router.post('/', requireSupervisor, taskController.createTaskValidation, taskController.createTask);

// 更新任务（主管，仅限待实施状态）
router.put('/:id', requireSupervisor, taskController.updateTaskValidation, taskController.updateTask);

// 删除任务（主管，仅限待实施状态）
router.delete('/:id', requireSupervisor, taskController.deleteTask);

// 员工开始任务
router.post('/:id/start', requireEmployee, taskController.startTask);

// 主管确认任务完成
router.post('/:id/confirm', requireSupervisor, taskController.confirmTask);

export default router;
