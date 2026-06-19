import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '@middleware/errorHandler';
import { DeviceService } from '@services/deviceService';
import { TransactionService } from '@services/transactionService';
import { UserService } from '@services/userService';
import { User, IUser } from '@models/User';
import { Device, IDevice } from '@models/Device';
import { config } from '@config/index';
import { logger } from '@utils/logger';

const deviceService = DeviceService.getInstance();
const transactionService = TransactionService.getInstance();
const userService = UserService.getInstance();

export const getDeviceList = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20, status, deviceModel } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  const pageNum = parseInt(page as string, 10);
  const sizeNum = parseInt(pageSize as string, 10);

  if (pageNum < 1) {
    throw BadRequestError('页码必须大于0');
  }

  if (sizeNum < 1 || sizeNum > 100) {
    throw BadRequestError('每页数量必须在1-100之间');
  }

  const { devices, total } = await deviceService.getUserDevices(userId, {
    status: status as string,
    deviceModel: deviceModel as string,
    page: pageNum,
    pageSize: sizeNum,
  });

  res.json({
    success: true,
    data: {
      devices,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
    },
    message: '获取设备列表成功',
  });
});

export const getDeviceDetail = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const device = await deviceService.getDeviceById(deviceId);

  if (!device) {
    throw NotFoundError('设备不存在');
  }

  const bindings = await deviceService.getDeviceBindings(deviceId);
  const isBound = bindings.some(b => b.userId?.toString() === userId);

  if (!isBound && req.userRole !== 'admin' && req.userRole !== 'operator') {
    const deviceOwnerId = (device as any).investorId?.toString();
    if (deviceOwnerId !== userId) {
      throw ForbiddenError('无权访问该设备');
    }
  }

  res.json({
    success: true,
    data: {
      device,
      bindings,
      isBound,
    },
    message: '获取设备详情成功',
  });
});

export const bindDevice = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId: deviceIdParam, bindType = 'user' } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceIdParam) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!['owner', 'user'].includes(bindType)) {
    throw BadRequestError('无效的绑定类型');
  }

  let device: IDevice | null = null;

  device = await deviceService.getDeviceByNo(deviceIdParam);

  if (!device) {
    throw NotFoundError('设备不存在');
  }

  const binding = await deviceService.bindDevice({
    deviceId: device._id.toString(),
    userId,
    bindType: bindType as 'owner' | 'user',
  });

  logger.info(`设备绑定成功: userId=${userId}, deviceId=${device._id}`);

  res.json({
    success: true,
    data: binding,
    message: '设备绑定成功',
  });
});

export const unbindDevice = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  await deviceService.unbindDevice(deviceId, userId);

  logger.info(`设备解绑成功: userId=${userId}, deviceId=${deviceId}`);

  res.json({
    success: true,
    data: null,
    message: '设备解绑成功',
  });
});

export const scanToStart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId: deviceIdParam, waterType = 'cold' } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceIdParam) {
    throw BadRequestError('设备ID不能为空');
  }

  const validWaterTypes = ['cold', 'hot', 'warm'];
  if (!validWaterTypes.includes(waterType)) {
    throw BadRequestError('无效的取水类型');
  }

  const device = await deviceService.getDeviceByNo(deviceIdParam);

  if (!device) {
    throw NotFoundError('设备不存在');
  }

  if (device.status === 'fault') {
    throw ConflictError('设备故障，暂时无法使用');
  }

  if (device.status === 'maintenance') {
    throw ConflictError('设备维护中，暂时无法使用');
  }

  if (device.status !== 'online') {
    throw ConflictError('设备离线，请检查设备连接');
  }

  const balance = await userService.getBalance(userId);
  if (balance < config.business.balanceWarningThreshold) {
    logger.warn(`用户余额不足预警: userId=${userId}, balance=${balance}`);
  }

  const sessionId = `WATER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info(`扫码启动取水: userId=${userId}, deviceId=${device._id}, waterType=${waterType}, sessionId=${sessionId}`);

  res.json({
    success: true,
    data: {
      sessionId,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        location: device.location,
        status: device.status,
      },
      waterType,
      startTime: new Date(),
      waterPrice: config.business.waterPricePerLiter,
      balance,
      isLowBalance: balance < config.business.balanceWarningThreshold,
    },
    message: '设备启动成功，请开始取水',
  });
});

export const bluetoothStart = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId: deviceIdParam, bluetoothMac, waterType = 'cold' } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceIdParam) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!bluetoothMac) {
    throw BadRequestError('蓝牙MAC地址不能为空');
  }

  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  if (!macRegex.test(bluetoothMac)) {
    throw BadRequestError('蓝牙MAC地址格式不正确');
  }

  const validWaterTypes = ['cold', 'hot', 'warm'];
  if (!validWaterTypes.includes(waterType)) {
    throw BadRequestError('无效的取水类型');
  }

  const device = await deviceService.getDeviceByNo(deviceIdParam);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  if (device.status === 'fault') {
    throw ConflictError('设备故障，暂时无法使用');
  }

  if (device.status === 'maintenance') {
    throw ConflictError('设备维护中，暂时无法使用');
  }

  const balance = await userService.getBalance(userId);
  const sessionId = `BLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info(`蓝牙启动取水: userId=${userId}, deviceId=${deviceIdParam}, bluetoothMac=${bluetoothMac}, sessionId=${sessionId}`);

  res.json({
    success: true,
    data: {
      sessionId,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        location: device.location,
        status: device.status,
      },
      waterType,
      bluetoothMac,
      startTime: new Date(),
      waterPrice: config.business.waterPricePerLiter,
      balance,
      isLowBalance: balance < config.business.balanceWarningThreshold,
      authToken: `BLE_AUTH_${sessionId}_${Date.now()}`,
    },
    message: '蓝牙连接成功，可以开始取水',
  });
});

export const stopWater = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { sessionId, deviceId, waterVolume, startTime } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!sessionId) {
    throw BadRequestError('会话ID不能为空');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (waterVolume === undefined || waterVolume === null) {
    throw BadRequestError('取水量不能为空');
  }

  const waterVolumeNum = parseFloat(waterVolume);
  if (isNaN(waterVolumeNum) || waterVolumeNum < 0) {
    throw BadRequestError('取水量必须是非负数');
  }

  if (!startTime) {
    throw BadRequestError('开始时间不能为空');
  }

  const device = await deviceService.getDeviceById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  let transaction = null;
  let balanceAfter = 0;

  if (waterVolumeNum > 0) {
    try {
      transaction = await transactionService.realTimeDeduct({
        userId,
        deviceId,
        waterVolume: waterVolumeNum,
        description: `取水结束扣费: ${waterVolumeNum.toFixed(2)}升`,
      });

      const user = await User.findById(userId);
      balanceAfter = user?.balance || 0;

      logger.info(`实时扣费成功: sessionId=${sessionId}, transactionNo=${transaction.transactionNo}, amount=${transaction.amount}, waterVolume=${waterVolumeNum}`);
    } catch (error: any) {
      logger.error(`实时扣费失败: sessionId=${sessionId}, error=${error.message}`);

      res.json({
        success: false,
        data: {
          sessionId,
          deviceId,
          waterVolume: waterVolumeNum,
          failedReason: error.message || '扣费失败',
        },
        message: error.message || '扣费失败，请检查余额',
      });
      return;
    }
  }

  const endTime = new Date();
  const duration = startTime ? Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000) : 0;

  res.json({
    success: true,
    data: {
      sessionId,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      },
      waterVolume: waterVolumeNum,
      duration,
      startTime,
      endTime,
      transaction: transaction ? {
        id: transaction._id,
        transactionNo: transaction.transactionNo,
        amount: transaction.amount,
        waterVolume: transaction.waterVolume,
        pricePerLiter: transaction.pricePerLiter,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
      } : null,
      currentBalance: balanceAfter,
      savedAmount: waterVolumeNum * config.business.waterPricePerLiter,
    },
    message: waterVolumeNum > 0 ? '取水结束，扣费成功' : '取水结束，无用水量',
  });
});

export const getDeviceByScan = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { qrContent } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!qrContent) {
    throw BadRequestError('二维码内容不能为空');
  }

  let deviceIdStr = qrContent;
  try {
    const parsed = JSON.parse(qrContent);
    if (parsed.deviceId) {
      deviceIdStr = parsed.deviceId;
    }
  } catch {
    const match = qrContent.match(/deviceId[:=]([A-Z0-9-]+)/i);
    if (match) {
      deviceIdStr = match[1];
    }
  }

  const device = await deviceService.getDeviceByNo(deviceIdStr);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  res.json({
    success: true,
    data: {
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceModel: device.deviceModel,
        location: device.location,
        status: device.status,
        currentTemperature: device.currentTemperature,
        currentFlowRate: device.currentFlowRate,
        totalWaterUsage: device.totalWaterUsage,
        signalStrength: device.network?.signalStrength,
        lastHeartbeatAt: device.lastHeartbeatAt,
      },
      canUse: device.status === 'online',
      reason: device.status !== 'online' ? `设备当前状态: ${device.status}` : null,
    },
    message: '二维码解析成功',
  });
});

export const realTimeDeduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId, waterVolume, description } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (waterVolume === undefined || waterVolume === null) {
    throw BadRequestError('用水量不能为空');
  }

  const waterVolumeNum = parseFloat(waterVolume);
  if (isNaN(waterVolumeNum) || waterVolumeNum <= 0) {
    throw BadRequestError('用水量必须大于0');
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  const transaction = await transactionService.realTimeDeduct({
    userId,
    deviceId,
    waterVolume: waterVolumeNum,
    description,
  });

  res.json({
    success: true,
    data: {
      transaction,
    },
    message: '扣费成功',
  });
});
