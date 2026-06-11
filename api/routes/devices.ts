import { Router } from "express";
import type { Request, Response } from "express";
import { deviceService } from "../services/deviceService.js";
import { sendPrivacyAwareResponse } from "../utils/response.js";

const router = Router();
const DEFAULT_USER_ID = "user-001";

router.get("/", (req: Request, res: Response) => {
  const devices = deviceService.getDevicesByUserId(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, devices);
});

router.post("/scan", (req: Request, res: Response) => {
  const results = deviceService.scanDevices();
  sendPrivacyAwareResponse(res, results);
});

router.post("/bind", (req: Request, res: Response) => {
  const { brand, model, name, deviceId } = req.body;
  if (!brand || !model || !name) {
    res.status(400).json({
      success: false,
      error: "品牌、型号和名称为必填项",
    });
    return;
  }
  try {
    const device = deviceService.bindDevice(DEFAULT_USER_ID, { brand, model, name, deviceId });
    sendPrivacyAwareResponse(res, device);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "绑定设备失败",
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const success = deviceService.unbindDevice(DEFAULT_USER_ID, id);
  if (!success) {
    res.status(404).json({
      success: false,
      error: "设备不存在",
    });
    return;
  }
  res.json({ success: true, message: "设备已解绑" });
});

router.get("/:id/status", (req: Request, res: Response) => {
  const { id } = req.params;
  const device = deviceService.getDeviceById(DEFAULT_USER_ID, id);
  if (!device) {
    res.status(404).json({
      success: false,
      error: "设备不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, {
    connectionStatus: device.connectionStatus,
    batteryLevel: device.batteryLevel,
    lastSyncTime: device.lastSyncTime,
  });
});

router.post("/:id/sync", (req: Request, res: Response) => {
  const { id } = req.params;
  const success = deviceService.syncDeviceData(DEFAULT_USER_ID, id);
  if (!success) {
    res.status(404).json({
      success: false,
      error: "设备不存在",
    });
    return;
  }
  const device = deviceService.getDeviceById(DEFAULT_USER_ID, id);
  sendPrivacyAwareResponse(res, device);
});

router.put("/:id/connection", (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["connected", "disconnected", "pairing"].includes(status)) {
    res.status(400).json({
      success: false,
      error: "无效的连接状态",
    });
    return;
  }
  const device = deviceService.updateConnectionStatus(DEFAULT_USER_ID, id, status);
  if (!device) {
    res.status(404).json({
      success: false,
      error: "设备不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, device);
});

export default router;
