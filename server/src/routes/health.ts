import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { success, error } from '../utils/response';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  return success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.get('/deep', async (req: Request, res: Response) => {
  try {
    const dbStatus = await prisma.$queryRaw`SELECT 1 as health`;

    return success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
      },
    });
  } catch (err) {
    console.error('健康检查失败:', err);
    return error(res, '服务不健康', 503);
  }
});

export { router as healthRouter };
