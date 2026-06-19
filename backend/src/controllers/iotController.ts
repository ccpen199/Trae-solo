import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '@middleware/errorHandler';
import { Device } from '@models/Device';
import { Project } from '@models/Project';
import { DeviceAuthService } from '@security/deviceAuth';
import { mqttClient } from '@iot/mqttClient';
import { offlineSyncService } from '@iot/offlineSync';
import { deviceCommandService } from '@iot/deviceCommands';
import { dataCollectorService } from '@iot/dataCollector';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { CryptoService } from '@security/crypto';

export const deviceAuth = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { deviceId, nonce, timestamp, signature } = req.body;

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const deviceNoRegex = /^[A-Z0-9]{8,20}$/;
  if (!deviceNoRegex.test(deviceId)) {
    throw BadRequestError('设备ID格式不正确');
  }

  if (!nonce) {
    throw BadRequestError('随机数(nonce)不能为空');
  }

  if (!timestamp) {
    throw BadRequestError('时间戳不能为空');
  }

  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(timestampNum)) {
    throw BadRequestError('时间戳格式不正确');
  }

  const now = Date.now();
  const timeDiff = Math.abs(now - timestampNum);
  if (timeDiff > config.security.nonceExpireSeconds * 1000) {
    throw BadRequestError('请求已过期，请检查设备时间');
  }

  if (!signature) {
    throw BadRequestError('签名不能为空');
  }

  const device = await Device.findOne({ deviceId }).select('+deviceSecret');
  if (!device) {
    throw NotFoundError('设备未注册');
  }

  if (!(device as any).isActive) {
    throw ForbiddenError('设备已被禁用');
  }

  const authResponse = await DeviceAuthService.authenticateDevice({
    deviceId,
    nonce,
    timestamp: timestampNum,
    signature,
  });

  if (!authResponse.success) {
    logger.error(`设备认证失败: deviceId=${deviceId}, error=${authResponse.error}`);
    throw UnauthorizedError(`认证失败: ${authResponse.error}`);
  }

  await Device.findByIdAndUpdate(device._id, {
    $set: {
      status: 'online',
      lastHeartbeatAt: new Date(),
      lastOnlineAt: new Date(),
    },
  });

  logger.info(`设备认证成功: deviceId=${deviceId}, deviceId=${device.deviceId}`);

  res.json({
    success: true,
    data: {
      token: authResponse.token,
      serverNonce: authResponse.serverNonce,
      serverTimestamp: authResponse.serverTimestamp,
      serverSignature: authResponse.serverSignature,
      sessionExpireSeconds: 3600 * 24,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceModel: device.deviceModel,
        firmwareVersion: device.firmwareVersion,
        status: device.status,
      },
    },
    message: '设备认证成功',
  });
});

export const deviceVerifySession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { deviceId, token } = req.body;

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!token) {
    throw BadRequestError('会话令牌不能为空');
  }

  const isValid = await DeviceAuthService.verifySessionToken(deviceId, token);

  if (!isValid) {
    throw UnauthorizedError('会话无效或已过期，请重新认证');
  }

  res.json({
    success: true,
    data: {
      isValid: true,
      deviceId,
    },
    message: '会话验证通过',
  });
});

export const deviceRefreshSession = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { deviceId, currentToken } = req.body;

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  if (!currentToken) {
    throw BadRequestError('当前会话令牌不能为空');
  }

  const isValid = await DeviceAuthService.verifySessionToken(deviceId, currentToken);
  if (!isValid) {
    throw UnauthorizedError('当前会话无效，无法刷新');
  }

  const newToken = await DeviceAuthService.refreshSession(deviceId);

  if (!newToken) {
    throw NotFoundError('设备不存在');
  }

  res.json({
    success: true,
    data: {
      newToken,
      deviceId,
      refreshTime: Date.now(),
      sessionExpireSeconds: 3600 * 24,
    },
    message: '会话刷新成功',
  });
});

export const getMQTTConnectionInfo = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (deviceId && userRole !== 'admin' && userRole !== 'operator') {
    const device = await Device.findById(deviceId as string);
    if (!device) {
      throw NotFoundError('设备不存在');
    }
    if (!(device as any).investorId || (device as any).investorId?.toString() !== userId) {
      const project = await Project.findById(device.projectId);
      if (!project || !project.investorIds?.map((id: any) => id.toString()).includes(userId)) {
        throw ForbiddenError('无权访问该设备的MQTT信息');
      }
    }
  }

  const isConnected = mqttClient.getConnectionStatus();

  let username = config.mqtt.username;
  let password = config.mqtt.password;

  if (userRole === 'student' || (userRole as string) === 'user') {
    username = `user_${userId}`;
    password = CryptoService.hmacSHA256WithDeviceSecret(
      config.jwt.secret,
      `${userId}_${Date.now()}`
    ).substring(0, 32);
  } else if (deviceId) {
    username = `device_${deviceId}`;
    const device = await Device.findById(deviceId as string).select('+deviceSecret');
    if (device && device.deviceSecret) {
      password = CryptoService.hmacSHA256WithDeviceSecret(
        device.deviceSecret,
        `${deviceId}_${Date.now()}`
      ).substring(0, 32);
    }
  }

  const clientId = deviceId
    ? `device_${deviceId}_${uuidv4().substring(0, 8)}`
    : `client_${userId}_${uuidv4().substring(0, 8)}`;

  const topics: Record<string, { subscribe: string[]; publish: string[] }> = {
    student: {
      subscribe: [
        `user/${userId}/notification`,
        `user/${userId}/transaction/+`,
      ],
      publish: [
        `user/${userId}/heartbeat`,
      ],
    },
    operator: {
      subscribe: [
        `operator/${userId}/workorder/+`,
        `device/+/status`,
        `device/+/alert`,
      ],
      publish: [
        `device/+/command`,
      ],
    },
    investor: {
      subscribe: [
        `investor/${userId}/dashboard`,
        `investor/${userId}/alert`,
      ],
      publish: [],
    },
    admin: {
      subscribe: [
        `$SYS/brokers/#`,
        `device/+/+`,
        `system/+`,
      ],
      publish: [
        `device/+/command`,
        `system/command`,
      ],
    },
  };

  if (deviceId) {
    const deviceTopics = {
      subscribe: [
        `device/${deviceId}/command`,
        `device/${deviceId}/config`,
      ],
      publish: [
        `device/${deviceId}/telemetry`,
        `device/${deviceId}/event`,
        `device/${deviceId}/alert`,
        `device/${deviceId}/status`,
        `device/${deviceId}/command/response`,
        `device/${deviceId}/offline/sync`,
      ],
    };

    res.json({
      success: true,
      data: {
        broker: {
          tcp: {
            host: config.mqtt.host,
            port: config.mqtt.port,
            protocol: 'mqtt',
          },
          websocket: {
            host: config.mqtt.host,
            port: config.mqtt.wsPort,
            path: config.mqtt.websocketPath,
            protocol: 'wss',
            url: `wss://${config.mqtt.host}:${config.mqtt.wsPort}${config.mqtt.websocketPath}`,
          },
        },
        auth: {
          clientId,
          username,
          password,
          keepalive: 60,
          clean: true,
          protocolVersion: 5,
        },
        topics: deviceTopics,
        qos: {
          telemetry: 0,
          command: 1,
          alert: 2,
          status: 1,
          offlineSync: 1,
        },
        connectionStatus: isConnected,
      },
      message: '获取MQTT连接信息成功',
    });
    return;
  }

  const userTopics = topics[(userRole || 'student') as keyof typeof topics] || topics.student;

  res.json({
    success: true,
    data: {
      broker: {
        tcp: {
          host: config.mqtt.host,
          port: config.mqtt.port,
          protocol: 'mqtt',
        },
        websocket: {
          host: config.mqtt.host,
          port: config.mqtt.wsPort,
          path: config.mqtt.websocketPath,
          protocol: 'wss',
          url: `wss://${config.mqtt.host}:${config.mqtt.wsPort}${config.mqtt.websocketPath}`,
        },
      },
      auth: {
        clientId,
        username,
        password,
        keepalive: 60,
        clean: true,
        protocolVersion: 5,
      },
      topics: userTopics,
      connectionStatus: isConnected,
    },
    message: '获取MQTT连接信息成功',
  });
});

export const triggerOfflineSync = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以触发离线同步');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  const result = await offlineSyncService.triggerSync(deviceId);

  logger.info(`触发离线同步: deviceId=${deviceId}, operatorId=${userId}, result=${result.success}`);

  res.json({
    success: result.success,
    data: {
      id: deviceId,
      deviceId: device.deviceId,
      maxBatchSize: offlineSyncService.getMaxSyncBatchSize(),
    },
    message: result.message,
  });
});

export const getOfflineSyncProgress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { syncId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以查看同步进度');
  }

  if (!syncId) {
    throw BadRequestError('同步ID不能为空');
  }

  const progress = offlineSyncService.getSyncProgress(syncId);

  if (!progress) {
    throw NotFoundError('同步任务不存在或已完成');
  }

  res.json({
    success: true,
    data: {
      syncId: progress.syncId,
      deviceId: progress.deviceId,
      totalItems: progress.totalItems,
      processedItems: progress.processedItems,
      progressPercentage: progress.totalItems > 0
        ? Math.round((progress.processedItems / progress.totalItems) * 100)
        : 0,
      status: progress.status,
      elapsedTime: Date.now() - progress.startTime,
    },
    message: '获取同步进度成功',
  });
});

export const getDeviceSyncHistory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId } = req.params;
  const { limit = 20 } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以查看同步历史');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  const limitNum = parseInt(limit as string, 10);
  if (limitNum < 1 || limitNum > 100) {
    throw BadRequestError('查询数量必须在1-100之间');
  }

  const history = await offlineSyncService.getDeviceSyncHistory(deviceId, limitNum);

  res.json({
    success: true,
    data: {
      id: deviceId,
      deviceId: device.deviceId,
      history,
      activeSyncCount: offlineSyncService.getActiveSyncCount(),
    },
    message: '获取同步历史成功',
  });
});

export const getDeviceCommandHistory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId } = req.params;
  const { limit = 20 } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'operator' && userRole !== 'admin') {
    throw ForbiddenError('只有运维人员和管理员可以查看指令历史');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  const limitNum = parseInt(limit as string, 10);
  if (limitNum < 1 || limitNum > 100) {
    throw BadRequestError('查询数量必须在1-100之间');
  }

  const history = await deviceCommandService.getCommandHistory(deviceId, limitNum);

  res.json({
    success: true,
    data: {
      id: deviceId,
      deviceId: device.deviceId,
      commands: history,
      pendingCount: deviceCommandService.getPendingCommandsCount(),
    },
    message: '获取指令历史成功',
  });
});

export const getIoTDataRealtime = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { deviceId, dataType } = req.params;
  const { limit = 50 } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!deviceId) {
    throw BadRequestError('设备ID不能为空');
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw NotFoundError('设备不存在');
  }

  if (userRole === 'student' || (userRole as string) === 'user') {
    const DeviceBinding = (await import('@models/DeviceBinding')).DeviceBinding;
    const binding = await DeviceBinding.findOne({ deviceId, userId, status: 'active' });
    const project = await Project.findById(device.projectId);
    if (!binding && (!project || !project.investorIds?.map((id: any) => id.toString()).includes(userId))) {
      throw ForbiddenError('无权访问该设备数据');
    }
  } else if (userRole === 'investor') {
    const project = await Project.findById(device.projectId);
    if (!project || !project.investorIds?.map((id: any) => id.toString()).includes(userId)) {
      throw ForbiddenError('无权访问该设备数据');
    }
  }

  const limitNum = parseInt(limit as string, 10);
  if (limitNum < 1 || limitNum > 500) {
    throw BadRequestError('查询数量必须在1-500之间');
  }

  const query: any = { deviceId };
  if (dataType && dataType !== 'all') {
    query.type = dataType;
  }

  const { IoTData } = require('@models/IoTData') as any;
  const dataList = await IoTData.find(query)
    .sort({ timestamp: -1 })
    .limit(limitNum);

  res.json({
    success: true,
    data: {
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
      },
      dataType: dataType || 'all',
      data: dataList,
      total: dataList.length,
    },
    message: '获取IoT数据成功',
  });
});

export const getIoTHealthStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (userRole !== 'admin' && userRole !== 'operator') {
    throw ForbiddenError('只有管理员和运维人员可以查看系统健康状态');
  }

  const mqttConnected = mqttClient.getConnectionStatus();
  const activeSyncs = offlineSyncService.getActiveSyncCount();
  const pendingCommands = deviceCommandService.getPendingCommandsCount();

  const totalDevices = await Device.countDocuments();
  const onlineDevices = await Device.countDocuments({ status: 'online' });
  const offlineDevices = await Device.countDocuments({ status: 'offline' });
  const faultDevices = await Device.countDocuments({ status: 'fault' });
  const maintenanceDevices = await Device.countDocuments({ status: 'maintenance' });

  const now = Date.now();
  const offlineThreshold = config.maintenance.offlineThreshold * 1000;
  const heartbeatTimeoutDevices = await Device.countDocuments({
    status: 'online',
    lastHeartbeatAt: { $lt: new Date(now - offlineThreshold) },
  } as any);

  const overallStatus = mqttConnected && heartbeatTimeoutDevices === 0 ? 'healthy' :
    heartbeatTimeoutDevices > 0 ? 'warning' : 'critical';

  res.json({
    success: true,
    data: {
      overallStatus,
      components: {
        mqtt: {
          status: mqttConnected ? 'online' : 'offline',
          connected: mqttConnected,
        },
        offlineSync: {
          activeSyncs,
          status: activeSyncs > 10 ? 'busy' : 'normal',
        },
        commandQueue: {
          pendingCommands,
          status: pendingCommands > 100 ? 'busy' : 'normal',
        },
      },
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: offlineDevices,
        fault: faultDevices,
        maintenance: maintenanceDevices,
        heartbeatTimeout: heartbeatTimeoutDevices,
        onlineRate: totalDevices > 0
          ? (onlineDevices / totalDevices) * 100
          : 0,
      },
      serverTime: new Date(),
    },
    message: '获取IoT系统健康状态成功',
  });
});
