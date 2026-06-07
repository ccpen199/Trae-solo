import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '安徽省一体化政务服务平台 API',
    version: '1.0.0',
  });
});

export default router;
