import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '@middleware/errorHandler';
import { MaintenanceService } from '@services/maintenanceService';
import { DeviceService } from '@services/deviceService';
import { Device } from '@models/Device';
import { Firmware } from '@models/Firmware';
import { WorkOrder } from '@models/WorkOrder';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { deviceCommandService } from '@iot/deviceCommands';

const maintenanceService = MaintenanceService.getInstance();
const deviceService = DeviceService.getInstance();

export const getAllDevices = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const {
    page = 1,
    pageSize = 20,
    status,
    deviceModel,
    projectId,
    keyword,
  } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以访问');
  }

  const pageNum = parseInt(page as string, 10);
  const sizeNum = parseInt(pageSize as string, 10);

  if (pageNum < 1) {
    throw BadRequestError('页码必须大于0');
  }

  if (sizeNum < 1 || sizeNum > 200) {
    throw BadRequestError('每页数量必须在1-200之间');
  }

  const { devices, total } = await deviceService.queryDevices({
    status: status as string,
    deviceModel: deviceModel as string,
    projectId: projectId as string,
    page: pageNum,
    pageSize: sizeNum,
  } as any);

  const deviceStatistics = await deviceService.getDeviceStatistics();

  res.json({
    success: true,
    data: {
      devices,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
      statistics: deviceStatistics,
    },
    message: '获取设备列表成功',
  });
});

export const remoteRestartDevice = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId } = req.params;
  const { delaySeconds = 0 } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以执行远程重启');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (delaySeconds < 0 || delaySeconds > 3600) {
    throw BadRequestError('延迟时间必须在0-3600秒之间');
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  if (device.status !== 'online') {
    throw ConflictError('设备不在线，无法执行远程重启');
  }

  const result = await deviceCommandService.sendRebootCommand(deviceId, delaySeconds);

  logger.info(`远程重启设备: deviceId=${deviceId}, operatorId=${userId}, delaySeconds=${delaySeconds}`);

  res.json({
    success: result.success,
    data: {
      commandId: result.commandId,
      status: result.status,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      },
      estimatedRestartTime: delaySeconds + 30,
    },
    message: result.success ? '重启指令已发送' : `重启失败: ${result.error}`,
  });
});

export const sendDeviceParams = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId } = req.params;
  const { params } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以下发参数');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
    throw BadRequestError('参数不能为空');
  }

  const allowedParams = [
    'waterPrice',
    'maxWaterVolume',
    'hotWaterTemp',
    'coldWaterTemp',
    'heartbeatInterval',
    'dataReportInterval',
    'filterChangeThreshold',
    'uvSterilizeInterval',
    'workingHours',
    'volumeMode',
  ];

  const invalidParams = Object.keys(params).filter(key => !allowedParams.includes(key));
  if (invalidParams.length > 0) {
    throw BadRequestError(`不支持的参数: ${invalidParams.join(', ')}`);
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  if (device.status !== 'online') {
    throw ConflictError('设备不在线，无法下发参数');
  }

  const result = await deviceCommandService.sendParamConfigCommand(deviceId, params);

  logger.info(`下发设备参数: deviceId=${deviceId}, operatorId=${userId}, params=${JSON.stringify(params)}`);

  res.json({
    success: result.success,
    data: {
      commandId: result.commandId,
      status: result.status,
      params,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      },
    },
    message: result.success ? '参数下发成功' : `参数下发失败: ${result.error}`,
  });
});

export const uploadFirmware = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const {
    version,
    name,
    description,
    targetModels,
    fileUrl,
    fileSize,
    fileHash,
    checksum,
    releaseNotes,
    isMandatory = false,
  } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以上传固件');
  }

  if (!version) {
    throw BadRequestError('固件版本号不能为空');
  }

  const versionRegex = /^(\d+\.)?(\d+\.)?(\*|\d+)$/;
  if (!versionRegex.test(version)) {
    throw BadRequestError('固件版本号格式不正确，应为 x.y.z 格式');
  }

  if (!targetModels || !Array.isArray(targetModels) || targetModels.length === 0) {
    throw BadRequestError('目标设备型号不能为空');
  }

  if (!fileUrl) {
    throw BadRequestError('文件URL不能为空');
  }

  if (!fileSize) {
    throw BadRequestError('文件大小不能为空');
  }

  const fileSizeNum = parseInt(fileSize, 10);
  if (isNaN(fileSizeNum) || fileSizeNum <= 0) {
    throw BadRequestError('文件大小必须大于0');
  }

  if (fileSizeNum > config.maintenance.maxFirmwareSize) {
    throw BadRequestError(`文件大小不能超过${Math.round(config.maintenance.maxFirmwareSize / 1024 / 1024)}MB`);
  }

  if (!fileHash) {
    throw BadRequestError('文件哈希值不能为空');
  }

  const firmware = await maintenanceService.uploadFirmware({
    version,
    name,
    description,
    targetModels,
    fileUrl,
    fileSize: fileSizeNum,
    fileHash,
    checksum,
    releaseNotes,
    isMandatory: !!isMandatory,
    uploadedBy: userId,
  } as any);

  logger.info(`固件上传成功: version=${version}, targetModels=${targetModels.join(',')}, operatorId=${userId}`);

  res.json({
    success: true,
    data: {
      firmwareId: firmware._id,
      version: firmware.version,
      name: firmware.name,
      targetModels: firmware.targetModels,
      fileUrl: firmware.fileUrl,
      fileSize: firmware.fileSize,
      fileHash: firmware.fileHash,
      status: firmware.status,
      releaseDate: firmware.releaseDate,
      releaseNotes: firmware.releaseNotes,
      isMandatory: firmware.isMandatory,
    },
    message: '固件上传成功',
  });
});

export const createFirmwareUpgradeTask = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { firmwareId, deviceIds, upgradeMode = 'immediate', scheduledTime } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以创建固件升级任务');
  }

  if (!firmwareId) {
    throw BadRequestError('固件ID不能为空');
  }

  if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
    throw BadRequestError('设备ID列表不能为空');
  }

  if (deviceIds.length > 500) {
    throw BadRequestError('单次升级设备数量不能超过500台');
  }

  if (!['immediate', 'scheduled'].includes(upgradeMode)) {
    throw BadRequestError('无效的升级模式');
  }

  if (upgradeMode === 'scheduled') {
    if (!scheduledTime) {
      throw BadRequestError('定时升级需要指定升级时间');
    }
    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      throw BadRequestError('升级时间格式不正确');
    }
    if (scheduledDate.getTime() <= Date.now()) {
      throw BadRequestError('升级时间必须大于当前时间');
    }
  }

  const firmware = await Firmware.findById(firmwareId);
  if (!firmware) {
    throw NotFoundError('固件不存在');
  }

  const invalidDevices: string[] = [];
  for (const deviceId of deviceIds) {
    const device = await Device.findById(deviceId);
    if (!device) {
      invalidDevices.push(`${deviceId} (设备不存在)`);
    } else if (!firmware.targetModels?.includes(device.deviceModel)) {
      invalidDevices.push(`${device.deviceId} (设备型号不匹配)`);
    }
  }

  if (invalidDevices.length > 0) {
    throw BadRequestError(`以下设备无法升级: ${invalidDevices.join(', ')}`);
  }

  const upgradeTask = await maintenanceService.createFirmwareUpgradeTask({
    firmwareId,
    deviceIds,
    upgradeMode: upgradeMode as 'immediate' | 'scheduled',
    scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
  });

  logger.info(`创建固件升级任务: taskId=${upgradeTask.taskId}, firmwareId=${firmwareId}, deviceCount=${deviceIds.length}, operatorId=${userId}`);

  res.json({
    success: true,
    data: {
      taskId: upgradeTask.taskId,
      firmware: {
        id: firmware._id,
        version: firmware.version,
        targetModels: firmware.targetModels,
      },
      deviceCount: upgradeTask.totalDevices,
      upgradeMode: upgradeTask.upgradeMode,
      scheduledTime: upgradeTask.scheduledTime,
      status: upgradeTask.status,
    },
    message: upgradeMode === 'immediate' ? '固件升级任务已创建并开始执行' : '固件升级任务已创建，将在指定时间执行',
  });
});

export const batchUpgradeFirmware = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { firmwareId, projectId, deviceModel, status, upgradeMode = 'immediate', scheduledTime } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以批量升级固件');
  }

  if (!firmwareId) {
    throw BadRequestError('固件ID不能为空');
  }

  const firmware = await Firmware.findById(firmwareId);
  if (!firmware) {
    throw NotFoundError('固件不存在');
  }

  const query: any = {};
  if (projectId) query.projectId = projectId;
  if (deviceModel) query.deviceModel = deviceModel;
  if (status) query.status = status;

  query.deviceModel = { $in: firmware.targetModels };
  query.firmwareVersion = { $ne: firmware.version };

  const devices = await Device.find(query).select('_id deviceId deviceName');

  if (devices.length === 0) {
    throw NotFoundError('没有找到符合条件的待升级设备');
  }

  if (devices.length > 1000) {
    throw BadRequestError(`待升级设备数量(${devices.length})超过单次最大限制(1000台)，请分批升级`);
  }

  const deviceIds = devices.map(d => d._id.toString());

  const upgradeTask = await maintenanceService.createFirmwareUpgradeTask({
    firmwareId,
    deviceIds,
    upgradeMode: upgradeMode as 'immediate' | 'scheduled',
    scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
  });

  logger.info(`批量固件升级: taskId=${upgradeTask.taskId}, firmwareVersion=${firmware.version}, deviceCount=${devices.length}, operatorId=${userId}`);

  res.json({
    success: true,
    data: {
      taskId: upgradeTask.taskId,
      firmware: {
        id: firmware._id,
        version: firmware.version,
        targetModels: firmware.targetModels,
      },
      deviceCount: devices.length,
      upgradeMode: upgradeTask.upgradeMode,
      scheduledTime: upgradeTask.scheduledTime,
      status: upgradeTask.status,
      devices: devices.slice(0, 20),
      hasMoreDevices: devices.length > 20,
    },
    message: `批量升级任务已创建，共${devices.length}台设备待升级`,
  });
});

export const getFirmwareList = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { targetModel, page = 1, pageSize = 20 } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以访问固件列表');
  }

  const pageNum = parseInt(page as string, 10);
  const sizeNum = parseInt(pageSize as string, 10);

  if (pageNum < 1) {
    throw BadRequestError('页码必须大于0');
  }

  if (sizeNum < 1 || sizeNum > 100) {
    throw BadRequestError('每页数量必须在1-100之间');
  }

  const firmwares = await maintenanceService.getFirmwareList(targetModel as string);
  const total = firmwares.length;
  const paginatedFirmwares = firmwares.slice((pageNum - 1) * sizeNum, pageNum * sizeNum);

  res.json({
    success: true,
    data: {
      firmwares: paginatedFirmwares,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
    },
    message: '获取固件列表成功',
  });
});

export const createWorkOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { deviceId, title, description, type = 'fault', priority = 'medium', assigneeId } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!title) {
    throw BadRequestError('工单标题不能为空');
  }

  if (title.length < 1 || title.length > 200) {
    throw BadRequestError('工单标题长度必须在1-200个字符之间');
  }

  if (!description) {
    throw BadRequestError('工单描述不能为空');
  }

  if (!['repair', 'maintenance', 'inspection', 'installation', 'firmware_upgrade'].includes(type)) {
    throw BadRequestError('无效的工单类型');
  }

  if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
    throw BadRequestError('无效的优先级');
  }

  const workOrder = await maintenanceService.createWorkOrder({
    deviceId,
    title,
    description,
    type: type as 'repair' | 'maintenance' | 'inspection' | 'installation' | 'firmware_upgrade',
    priority: priority as 'low' | 'medium' | 'high' | 'critical',
    reporterId: userId,
    assigneeId,
  } as any);

  logger.info(`创建工单: orderNo=${workOrder.orderNo}, deviceId=${deviceId}, reporterId=${userId}, type=${type}`);

  res.json({
    success: true,
    data: {
      workOrderId: workOrder._id,
      orderNo: workOrder.orderNo,
      status: workOrder.status,
    },
    message: '工单创建成功',
  });
});

export const getWorkOrderList = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const {
    page = 1,
    pageSize = 20,
    status,
    type,
    priority,
    deviceId,
    reporterId,
    assigneeId,
    startDate,
    endDate,
  } = req.query;

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

  const queryParams: any = {
    page: pageNum,
    pageSize: sizeNum,
    status: status as string,
    type: type as string,
    priority: priority as string,
    deviceId: deviceId as string,
  };

  if (userRole === 'operator') {
    queryParams.assigneeId = userId;
  } else if (userRole === 'student') {
    queryParams.reporterId = userId;
  } else {
    if (reporterId) queryParams.reporterId = reporterId as string;
    if (assigneeId) queryParams.assigneeId = assigneeId as string;
  }

  if (startDate) {
    const start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      throw BadRequestError('开始日期格式不正确');
    }
    queryParams.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      throw BadRequestError('结束日期格式不正确');
    }
    queryParams.endDate = end;
  }

  const { orders, total } = await maintenanceService.queryWorkOrders(queryParams);

  const statistics = await maintenanceService.getWorkOrderStatistics({
    startDate: queryParams.startDate,
    endDate: queryParams.endDate,
    assigneeId: userRole === 'operator' ? userId : (assigneeId as string),
  });

  res.json({
    success: true,
    data: {
      orders,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
      statistics,
    },
    message: '获取工单列表成功',
  });
});

export const getWorkOrderDetail = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { orderId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!orderId) {
    throw BadRequestError('工单ID不能为空');
  }

  const workOrder = await maintenanceService.getWorkOrderById(orderId);
  if (!workOrder) {
    throw NotFoundError('工单不存在');
  }

  res.json({
    success: true,
    data: workOrder,
    message: '获取工单详情成功',
  });
});

export const updateWorkOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { orderId } = req.params;
  const { status, title, description, priority, assigneeId, resolution, remark } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!orderId) {
    throw BadRequestError('工单ID不能为空');
  }

  const existingOrder = await WorkOrder.findById(orderId);
  if (!existingOrder) {
    throw NotFoundError('工单不存在');
  }

  const updateParams: any = {};
  if (status !== undefined) updateParams.status = status;
  if (title !== undefined) updateParams.title = title;
  if (description !== undefined) updateParams.description = description;
  if (priority !== undefined) updateParams.priority = priority;
  if (assigneeId !== undefined) updateParams.assigneeId = assigneeId;
  if (resolution !== undefined) updateParams.resolution = resolution;
  if (remark !== undefined) updateParams.remark = remark;

  const updatedOrder = await maintenanceService.updateWorkOrder(orderId, updateParams);

  logger.info(`更新工单: orderId=${orderId}, status=${status}, operatorId=${userId}`);

  res.json({
    success: true,
    data: updatedOrder,
    message: '工单更新成功',
  });
});

export const addWorkOrderRemark = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { orderId } = req.params;
  const { remark } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!orderId) {
    throw BadRequestError('工单ID不能为空');
  }

  if (!remark) {
    throw BadRequestError('备注内容不能为空');
  }

  if (remark.length < 1 || remark.length > 1000) {
    throw BadRequestError('备注长度必须在1-1000个字符之间');
  }

  const workOrder = await maintenanceService.addWorkOrderRemark(orderId, userId, remark);

  res.json({
    success: true,
    data: workOrder,
    message: '备注添加成功',
  });
});

export const getDeviceCommandStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { commandId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以查询指令状态');
  }

  if (!commandId) {
    throw BadRequestError('指令ID不能为空');
  }

  const result = deviceCommandService.getCommandStatus(commandId);

  if (!result) {
    throw NotFoundError('指令不存在或已完成');
  }

  const commandResult = await maintenanceService.getCommandResult(commandId);

  res.json({
    success: true,
    data: {
      commandId,
      status: result,
      detail: commandResult,
    },
    message: '获取指令状态成功',
  });
});
