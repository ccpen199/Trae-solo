import { Router, Response } from 'express';
import { asyncHandler, BadRequestError, NotFoundError } from '@middleware/errorHandler';
import { AuthRequest, authMiddleware, studentOnly } from '@middleware/auth';
import { deviceService } from '@services/deviceService';
import { logger } from '@utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 20, status, deviceModel } = req.query;

  const result = await deviceService.queryDevices({
    page: Number(page),
    pageSize: Number(pageSize),
    status: status as string,
    deviceModel: deviceModel as string,
  } as any);

  res.json({
    success: true,
    data: {
      devices: result.devices,
      total: result.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
}));

router.get('/my-devices', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 20, status, deviceModel } = req.query;

  const result = await deviceService.getUserDevices(req.userId!, {
    page: Number(page),
    pageSize: Number(pageSize),
    status: status as string,
    deviceModel: deviceModel as string,
  } as any);

  res.json({
    success: true,
    data: {
      devices: result.devices,
      total: result.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
}));

router.get('/nearby', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { latitude, longitude, radius = 1000 } = req.query;

  logger.info(`搜索附近设备: userId=${req.userId}, lat=${latitude}, lng=${longitude}, radius=${radius}`);

  res.json({
    success: true,
    data: {
      devices: [],
      total: 0,
    },
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw BadRequestError('设备ID不能为空');
  }

  try {
    const device = await deviceService.getDeviceById(id);
    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    throw NotFoundError('设备不存在');
  }
}));

router.post('/bind', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceId, bindType = 'user' } = req.body;

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const binding = await deviceService.bindDevice({
    deviceId,
    userId: req.userId!,
    bindType: bindType as 'owner' | 'user',
  });

  res.json({
    success: true,
    message: '设备绑定成功',
    data: binding,
  });
}));

router.post('/unbind', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  await deviceService.unbindDevice(deviceId, req.userId!);

  res.json({
    success: true,
    message: '设备解绑成功',
  });
}));

router.post('/scan-start', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`启动设备扫描: userId=${req.userId}`);

  res.json({
    success: true,
    message: '设备扫描已启动',
    data: {
      scanId: `SCAN${Date.now()}`,
      duration: 30,
    },
  });
}));

router.post('/bluetooth-start', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`启动蓝牙连接: userId=${req.userId}`);

  res.json({
    success: true,
    message: '蓝牙连接已启动',
    data: {
      connectionId: `BT${Date.now()}`,
    },
  });
}));

router.post('/stop', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scanId, connectionId } = req.body;

  logger.info(`停止扫描/连接: userId=${req.userId}, scanId=${scanId}, connectionId=${connectionId}`);

  res.json({
    success: true,
    message: '操作已停止',
  });
}));

export default router;
