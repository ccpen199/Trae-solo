import { Request, Response } from 'express';
import packageService from '../services/packageService';
import db from '../config/database';

export const scanInStation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingNumber, packageDetails } = req.body;
    const operator = req.user!;

    if (!trackingNumber) {
      res.status(400).json({ error: '请提供运单号' });
      return;
    }

    const result = packageService.scanInStation(trackingNumber, operator, packageDetails);
    res.json(result);
  } catch (error: any) {
    console.error('入库错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const assignToArea = (req: Request, res: Response): void => {
  try {
    const { packageId, areaId } = req.body;
    const operator = req.user!;

    if (!packageId || !areaId) {
      res.status(400).json({ error: '请提供包裹ID和区域ID' });
      return;
    }

    const result = packageService.assignToArea(packageId, areaId, operator);
    res.json(result);
  } catch (error: any) {
    console.error('分配区域错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const assignToCourier = (req: Request, res: Response): void => {
  try {
    const { packageId, courierId } = req.body;
    const operator = req.user!;

    if (!packageId || !courierId) {
      res.status(400).json({ error: '请提供包裹ID和快递员ID' });
      return;
    }

    const result = packageService.assignToCourier(packageId, courierId, operator);
    res.json(result);
  } catch (error: any) {
    console.error('分配快递员错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const generatePickupCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId } = req.body;
    const operator = req.user!;

    if (!packageId) {
      res.status(400).json({ error: '请提供包裹ID' });
      return;
    }

    const result = await packageService.generatePickupCode(packageId, operator);
    res.json(result);
  } catch (error: any) {
    console.error('生成取件码错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const startDelivery = (req: Request, res: Response): void => {
  try {
    const { packageId } = req.body;
    const operator = req.user!;

    if (!packageId) {
      res.status(400).json({ error: '请提供包裹ID' });
      return;
    }

    const result = packageService.startDelivery(packageId, operator);
    res.json(result);
  } catch (error: any) {
    console.error('开始派送错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const signPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId, signType, pickupCode, signCode } = req.body;
    const operator = req.user;

    if (!packageId || !signType) {
      res.status(400).json({ error: '请提供包裹ID和签收方式' });
      return;
    }

    if (signType !== 'home' && signType !== 'station') {
      res.status(400).json({ error: '签收方式只能是 home 或 station' });
      return;
    }

    const result = await packageService.signPackage(
      packageId,
      signType,
      pickupCode,
      signCode,
      operator
    );
    res.json(result);
  } catch (error: any) {
    console.error('签收错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const markException = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId, type, reason } = req.body;
    const operator = req.user!;

    if (!packageId || !type || !reason) {
      res.status(400).json({ error: '请提供包裹ID、异常类型和原因' });
      return;
    }

    const validTypes = ['damaged', 'rejected', 'unreachable', 'other'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: '异常类型无效' });
      return;
    }

    await packageService.markException(
      packageId,
      type as 'damaged' | 'rejected' | 'unreachable' | 'other',
      reason,
      operator
    );
    res.json({ success: true, message: '异常记录已创建' });
  } catch (error: any) {
    console.error('标记异常错误:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getPackage = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const pkg = packageService.getById(id);
    if (!pkg) {
      res.status(404).json({ error: '包裹不存在' });
      return;
    }

    res.json(pkg);
  } catch (error: any) {
    console.error('获取包裹错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPackageByTracking = (req: Request, res: Response): void => {
  try {
    const { trackingNumber } = req.params;
    
    const pkg = packageService.getByTrackingNumber(trackingNumber);
    if (!pkg) {
      res.status(404).json({ error: '包裹不存在' });
      return;
    }

    res.json(pkg);
  } catch (error: any) {
    console.error('获取包裹错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const searchPackages = (req: Request, res: Response): void => {
  try {
    const { phone, trackingNumber, status, courierId } = req.query;
    
    if (phone) {
      const results = packageService.searchByPhone(phone as string);
      res.json(results);
      return;
    }

    if (trackingNumber) {
      const pkg = packageService.getByTrackingNumber(trackingNumber as string);
      res.json(pkg ? [pkg] : []);
      return;
    }

    const results = packageService.getByStatus(
      status as string | undefined,
      courierId as string | undefined
    );
    res.json(results);
  } catch (error: any) {
    console.error('搜索包裹错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPackageTrails = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const trails = packageService.getTrails(id);
    res.json(trails);
  } catch (error: any) {
    console.error('获取轨迹错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAreas = (req: Request, res: Response): void => {
  try {
    const areas = db.prepare(`
      SELECT id, name, code, description, created_at as createdAt
      FROM areas
      ORDER BY code
    `).all() as any[];

    res.json(areas);
  } catch (error: any) {
    console.error('获取区域错误:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCouriers = (req: Request, res: Response): void => {
  try {
    const couriers = db.prepare(`
      SELECT id, username, name, role, phone, created_at as createdAt
      FROM users
      WHERE role = 'courier'
      ORDER BY name
    `).all() as any[];

    res.json(couriers);
  } catch (error: any) {
    console.error('获取快递员错误:', error);
    res.status(500).json({ error: error.message });
  }
};
