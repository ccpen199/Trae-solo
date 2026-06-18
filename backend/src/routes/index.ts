import { Router, Request, Response } from 'express';
import config from '../config';
import authRoutes from './auth';
import profileRoutes from './profile';
import serviceRoutes from './services';
import knowledgeRoutes from './knowledge';
import orchestrationRoutes from './orchestration';
import feedbackRoutes from './feedback';
import departmentRoutes from './departments';
import adminRoutes from './admin';
import offlineRoutes from './offline';
import { HealthCheckService } from '../services/healthCheck';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    name: '郑州市掌上办事中枢 API Gateway',
    version: '2.1.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      auth: `${config.apiPrefix}/auth/*`,
      profile: `${config.apiPrefix}/profile/*`,
      services: `${config.apiPrefix}/services/*`,
      knowledge: `${config.apiPrefix}/knowledge/*`,
      orchestration: `${config.apiPrefix}/orchestration/*`,
      feedback: `${config.apiPrefix}/feedback/*`,
      departments: `${config.apiPrefix}/departments/*`,
      offline: `${config.apiPrefix}/offline/*`,
      admin: `${config.apiPrefix}/admin/*`
    },
    docs: `${config.apiPrefix}/docs`
  });
});

router.get('/health', HealthCheckService.check);
router.get('/health/detailed', HealthCheckService.detailed);

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/services', serviceRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/orchestration', orchestrationRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/departments', departmentRoutes);
router.use('/offline', offlineRoutes);
router.use('/admin', adminRoutes);

export default router;
