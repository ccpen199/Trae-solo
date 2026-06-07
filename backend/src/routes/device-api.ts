import { Router, Response } from 'express';
import {
  reportStatus,
  getPendingCommands,
  checkFirmware,
  upgradeFirmware
} from '../services/deviceApiService';
import { success, error } from '../utils/response';

const router = Router();

router.post('/report', (req, res: Response) => {
  const { deviceId, status, fault_code, door_lock, power_usage, water_usage, temperature, remain_time } = req.body;
  if (!deviceId) {
    error(res, '设备ID不能为空');
    return;
  }

  const result = reportStatus({
    deviceId: parseInt(deviceId, 10),
    status,
    fault_code,
    door_lock,
    power_usage,
    water_usage,
    temperature,
    remain_time
  });

  if (result) {
    success(res, { received: true }, '上报成功');
  } else {
    error(res, '上报失败');
  }
});

router.get('/:id/command', (req, res: Response) => {
  const deviceId = parseInt(req.params.id, 10);
  const commands = getPendingCommands(deviceId);
  success(res, commands);
});

router.post('/:id/firmware/check', (req, res: Response) => {
  const deviceId = parseInt(req.params.id, 10);
  const { currentVersion } = req.body;
  if (!currentVersion) {
    error(res, '当前版本号不能为空');
    return;
  }

  const firmware = checkFirmware(deviceId, currentVersion);
  success(res, firmware ? { upgradeAvailable: true, firmware } : { upgradeAvailable: false });
});

router.post('/:id/firmware/upgrade', (req, res: Response) => {
  const deviceId = parseInt(req.params.id, 10);
  const { version } = req.body;
  if (!version) {
    error(res, '版本号不能为空');
    return;
  }

  upgradeFirmware(deviceId, version);
  success(res, { success: true }, '升级指令已下发');
});

export default router;
