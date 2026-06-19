import { Router, Request, Response } from 'express';
import { asyncHandler, BadRequestError } from '@middleware/errorHandler';
import { DeviceAuthService } from '@security/deviceAuth';
import { dataCollectorService, DataType } from '@iot/dataCollector';
import { config } from '@config/index';
import { logger } from '@utils/logger';

const router = Router();

router.post('/device-auth', asyncHandler(async (req: Request, res: Response) => {
  const { deviceId, nonce, timestamp, signature } = req.body;

  if (!deviceId || !nonce || !timestamp || !signature) {
    throw BadRequestError('设备ID、nonce、timestamp、signature 不能为空');
  }

  const authResult = await DeviceAuthService.authenticateDevice({
    deviceId,
    nonce,
    timestamp,
    signature,
  });

  if (!authResult.success) {
    logger.warn(`设备认证失败: deviceId=${deviceId}, error=${authResult.error}`);
    return res.status(401).json({
      success: false,
      message: authResult.error || '设备认证失败',
      code: 'DEVICE_AUTH_FAILED',
    });
  }

  logger.info(`设备认证成功: deviceId=${deviceId}`);

  res.json({
    success: true,
    message: '设备认证成功',
    data: {
      token: authResult.token,
      serverNonce: authResult.serverNonce,
      serverTimestamp: authResult.serverTimestamp,
      serverSignature: authResult.serverSignature,
    },
  });
}));

router.get('/mqtt-config', asyncHandler(async (req: Request, res: Response) => {
  const { deviceId, token } = req.query;

  if (!deviceId || !token) {
    throw BadRequestError('设备ID和令牌不能为空');
  }

  const isValid = await DeviceAuthService.verifySessionToken(deviceId as string, token as string);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: '无效的会话令牌',
      code: 'INVALID_SESSION_TOKEN',
    });
  }

  res.json({
    success: true,
    data: {
      broker: {
        host: config.mqtt.host,
        port: config.mqtt.port,
        wsPort: config.mqtt.wsPort,
        websocketPath: config.mqtt.websocketPath,
      },
      credentials: {
        username: `device_${deviceId}`,
        password: token as string,
      },
      topics: {
        telemetry: `device/${deviceId}/telemetry`,
        command: `device/${deviceId}/command`,
        response: `device/${deviceId}/response`,
        status: `device/${deviceId}/status`,
      },
      qos: {
        telemetry: 1,
        command: 2,
        response: 1,
        status: 1,
      },
    },
  });
}));

router.post('/offline-sync', asyncHandler(async (req: Request, res: Response) => {
  const { deviceId, token, data } = req.body;

  if (!deviceId || !token || !data) {
    throw BadRequestError('设备ID、令牌和同步数据不能为空');
  }

  const isValid = await DeviceAuthService.verifySessionToken(deviceId, token);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: '无效的会话令牌',
      code: 'INVALID_SESSION_TOKEN',
    });
  }

  try {
    const syncData: Array<{
      dataType: DataType;
      data: any;
      timestamp: number;
      transactionNo: string;
      nonce: string;
    }> = Array.isArray(data) ? data : [data];
    const syncResult = await dataCollectorService.processOfflineData(deviceId, syncData);

    const successCount = syncResult.filter((r) => r.success).length;
    const failedCount = syncResult.length - successCount;

    logger.info(`设备离线数据同步完成: deviceId=${deviceId}, total=${syncResult.length}, success=${successCount}, failed=${failedCount}`);

    res.json({
      success: true,
      message: '离线数据同步成功',
      data: {
        totalCount: syncResult.length,
        successCount,
        failedCount,
        results: syncResult,
      },
    });
  } catch (error) {
    logger.error(`设备离线数据同步失败: deviceId=${deviceId}`, error);
    res.status(500).json({
      success: false,
      message: '离线数据同步失败',
      code: 'OFFLINE_SYNC_FAILED',
    });
  }
}));

export default router;
