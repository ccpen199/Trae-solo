import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken } from '../middleware/auth';
import { packageConfigEngine } from '../engines/package-config-engine';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const packages = await packageConfigEngine.getAvailablePackages(
      category as string | undefined
    );

    res.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: '获取套餐列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pkg = await packageConfigEngine.getPackageById(id);

    if (!pkg) {
      return res.status(404).json({ message: '套餐不存在' });
    }

    res.json(pkg);
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ message: '获取套餐详情失败' });
  }
});

router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: '请提供日期' });
    }

    const checkDate = new Date(date as string);
    const availability = await packageConfigEngine.validateReservationAvailability(
      id,
      checkDate
    );

    res.json(availability);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: '检查可用性失败' });
  }
});

router.get('/slots/available', async (req: Request, res: Response) => {
  try {
    const { date, departmentId } = req.query;

    if (!date) {
      return res.status(400).json({ message: '请提供日期' });
    }

    const checkDate = new Date(date as string);
    const timeSlots = await packageConfigEngine.getAvailableTimeSlots(
      checkDate,
      departmentId as string | undefined
    );

    res.json(timeSlots);
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ message: '获取可预约时段失败' });
  }
});

router.post('/custom', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, itemIds, category } = req.body;

    if (!name || !itemIds || itemIds.length === 0) {
      return res.status(400).json({ message: '请提供套餐名称和项目列表' });
    }

    const customPackage = await packageConfigEngine.createCustomPackage(
      name,
      description || '',
      itemIds,
      category || 'custom'
    );

    res.status(201).json(customPackage);
  } catch (error) {
    console.error('Create custom package error:', error);
    res.status(500).json({ message: '创建自定义套餐失败' });
  }
});

router.post('/validate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds) {
      return res.status(400).json({ message: '请提供项目列表' });
    }

    const validation = await packageConfigEngine.validatePackageItems(itemIds);
    res.json(validation);
  } catch (error) {
    console.error('Validate package error:', error);
    res.status(500).json({ message: '验证套餐失败' });
  }
});

export default router;
