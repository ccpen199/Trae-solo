import { Router, Response } from 'express';
import multer from 'multer';
import { asyncHandler, BadRequestError, NotFoundError, ValidationError } from '@middleware/errorHandler';
import { AuthRequest, authMiddleware, operatorOnly } from '@middleware/auth';
import { maintenanceService } from '@services/maintenanceService';
import { deviceService } from '@services/deviceService';
import { logger } from '@utils/logger';
import { config } from '@config/index';

const router = Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: config.maintenance.firmwareUploadDir,
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `firmware-${uniqueSuffix}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: config.maintenance.maxFirmwareSize,
  },
});

router.use(authMiddleware, operatorOnly);

router.get('/devices', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 20, status, deviceModel, projectId } = req.query;

  const result = await deviceService.queryDevices({
    page: Number(page),
    pageSize: Number(pageSize),
    status: status as string,
    deviceModel: deviceModel as string,
    projectId: projectId as string,
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

router.post('/device/:id/restart', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw BadRequestError('设备ID不能为空');
  }

  const result = await maintenanceService.sendRemoteCommand({
    deviceId: id,
    command: 'restart',
    operatorId: req.userId!,
  });

  res.json({
    success: true,
    message: '设备重启命令已发送',
    data: result,
  });
}));

router.post('/device/:id/params', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const params = req.body;

  if (!id) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!params || Object.keys(params).length === 0) {
    throw BadRequestError('请提供要设置的参数');
  }

  const result = await maintenanceService.sendRemoteCommand({
    deviceId: id,
    command: 'set_param',
    params,
    operatorId: req.userId!,
  });

  res.json({
    success: true,
    message: '设备参数设置命令已发送',
    data: result,
  });
}));

router.post('/firmware/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { version, deviceType, releaseNote, forceUpdate } = req.body;

  if (!version || !deviceType) {
    throw BadRequestError('固件版本和设备类型不能为空');
  }

  if (!req.file) {
    throw BadRequestError('请上传固件文件');
  }

  const firmware = await maintenanceService.uploadFirmware({
    version,
    deviceType,
    fileName: req.file.originalname,
    fileUrl: req.file.path,
    fileSize: req.file.size,
    md5: 'pending',
    releaseNote,
    forceUpdate: forceUpdate === 'true',
  });

  res.json({
    success: true,
    message: '固件上传成功',
    data: firmware,
  });
}));

router.post('/firmware/batch-upgrade', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { firmwareId, deviceIds, upgradeMode, scheduledTime } = req.body;

  if (!firmwareId || !deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
    throw BadRequestError('请提供固件ID和设备ID列表');
  }

  if (!['immediate', 'scheduled'].includes(upgradeMode)) {
    throw ValidationError('无效的升级模式');
  }

  if (upgradeMode === 'scheduled' && !scheduledTime) {
    throw BadRequestError('定时升级需要指定升级时间');
  }

  const task = await maintenanceService.createFirmwareUpgradeTask({
    firmwareId,
    deviceIds,
    upgradeMode: upgradeMode as 'immediate' | 'scheduled',
    scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
  });

  res.json({
    success: true,
    message: '固件升级任务创建成功',
    data: task,
  });
}));

router.get('/firmwares', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceType } = req.query;

  const firmwares = await maintenanceService.getFirmwareList(deviceType as string);

  res.json({
    success: true,
    data: {
      firmwares,
      total: firmwares.length,
    },
  });
}));

router.get('/work-orders', asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    type,
    priority,
    startDate,
    endDate,
    assigneeId,
  } = req.query;

  const result = await maintenanceService.queryWorkOrders({
    page: Number(page),
    pageSize: Number(pageSize),
    status: status as string,
    type: type as string,
    priority: priority as string,
    assigneeId: assigneeId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  res.json({
    success: true,
    data: {
      orders: result.orders,
      total: result.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
}));

router.post('/work-orders', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceId, title, description, type, priority, assigneeId } = req.body;

  if (!deviceId || !title || !description || !type || !priority) {
    throw BadRequestError('请填写完整的工单信息');
  }

  const workOrder = await maintenanceService.createWorkOrder({
    deviceId,
    title,
    description,
    type,
    priority,
    reporterId: req.userId!,
    assigneeId,
  });

  res.json({
    success: true,
    message: '工单创建成功',
    data: workOrder,
  });
}));

router.put('/work-orders/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    throw BadRequestError('工单ID不能为空');
  }

  try {
    const updatedOrder = await maintenanceService.updateWorkOrder(id, updateData);
    res.json({
      success: true,
      message: '工单更新成功',
      data: updatedOrder,
    });
  } catch (error) {
    throw NotFoundError('工单不存在');
  }
}));

export default router;
