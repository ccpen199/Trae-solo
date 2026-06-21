import { Router, type Request, type Response } from 'express';
import { successResponse, mockUser } from '../mock/data.js';

const router = Router();

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(mockUser));
});

router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  res.json(successResponse({
    ...mockUser,
    ...data,
  }, '个人信息已更新'));
});

router.post('/verify-license', async (req: Request, res: Response): Promise<void> => {
  const { licenseNumber, licenseImage } = req.body;
  res.json(successResponse({
    ...mockUser,
    verified: true,
    licenseInfo: {
      ...mockUser.licenseInfo,
      licenseNumber,
      licenseImage,
      verifiedAt: new Date().toISOString(),
    },
  }, '执业证核验通过'));
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20 } = req.query;
  const users = [mockUser];
  const result = {
    items: users,
    total: users.length,
    page: Number(page),
    pageSize: Number(pageSize),
  };
  res.json(successResponse(result));
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(mockUser));
});

export default router;
