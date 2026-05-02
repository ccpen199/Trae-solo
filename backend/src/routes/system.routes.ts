import { Router } from 'express';
import { SystemController } from '../controllers';

const router = Router();
const systemController = new SystemController();

router.get('/health', systemController.healthCheck.bind(systemController));
router.get('/dashboard', systemController.getDashboardStats.bind(systemController));
router.get('/users', systemController.getUsers.bind(systemController));
router.post('/test-data', systemController.createTestData.bind(systemController));
router.get('/todos', systemController.getUserTodos.bind(systemController));
router.post('/todos/:todoId/start', systemController.startTodo.bind(systemController));
router.post('/todos/:todoId/complete', systemController.completeTodo.bind(systemController));
router.get('/notifications', systemController.getUserNotifications.bind(systemController));
router.post('/notifications/:notificationId/read', systemController.markNotificationRead.bind(systemController));
router.post('/notifications/read-all', systemController.markAllNotificationsRead.bind(systemController));
router.get('/audit-logs', systemController.getAuditLogs.bind(systemController));

export { router as systemRouter };
