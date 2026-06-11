import { Router } from "express";
import type { Request, Response } from "express";
import { archiveService, hisService, authorizationService } from "../services/archiveService.js";
import { sendPrivacyAwareResponse } from "../utils/response.js";
import fs from "fs";

const router = Router();
const DEFAULT_USER_ID = "user-001";

router.get("/", (req: Request, res: Response) => {
  const archives = archiveService.getArchives(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, archives);
});

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { dateStart, dateEnd, dataTypes, format } = req.body;
    if (!dateStart || !dateEnd || !dataTypes) {
      res.status(400).json({
        success: false,
        error: "日期范围和数据类型为必填项",
      });
      return;
    }
    const archive = await archiveService.generateArchive(
      DEFAULT_USER_ID,
      dateStart,
      dateEnd,
      dataTypes,
      format || "json"
    );
    sendPrivacyAwareResponse(res, archive);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "生成档案失败",
    });
  }
});

router.get("/:id/download", (req: Request, res: Response) => {
  const { id } = req.params;
  const filePath = archiveService.getArchiveFilePath(id);
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({
      success: false,
      error: "档案文件不存在",
    });
    return;
  }
  res.download(filePath, `health-archive-${id}.json`);
});

router.get("/his/departments", (req: Request, res: Response) => {
  const departments = hisService.getDepartments();
  sendPrivacyAwareResponse(res, departments);
});

router.get("/his/doctors", (req: Request, res: Response) => {
  const dept = req.query.dept as string | undefined;
  const doctors = hisService.getDoctors(dept);
  sendPrivacyAwareResponse(res, doctors);
});

router.get("/his/appointments", (req: Request, res: Response) => {
  const appointments = hisService.getAppointments(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, appointments);
});

router.post("/his/appointments", (req: Request, res: Response) => {
  const appointment = hisService.createAppointment(DEFAULT_USER_ID, req.body);
  sendPrivacyAwareResponse(res, appointment);
});

router.put("/his/appointments/:id/cancel", (req: Request, res: Response) => {
  const { id } = req.params;
  const success = hisService.cancelAppointment(DEFAULT_USER_ID, id);
  if (!success) {
    res.status(404).json({
      success: false,
      error: "预约不存在",
    });
    return;
  }
  res.json({ success: true, message: "预约已取消" });
});

router.get("/authorization", (req: Request, res: Response) => {
  const authorizations = authorizationService.getAuthorizations(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, authorizations);
});

router.post("/authorization", (req: Request, res: Response) => {
  const auth = authorizationService.createAuthorization(DEFAULT_USER_ID, req.body);
  sendPrivacyAwareResponse(res, auth);
});

router.delete("/authorization/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const success = authorizationService.revokeAuthorization(DEFAULT_USER_ID, id);
  if (!success) {
    res.status(404).json({
      success: false,
      error: "授权不存在",
    });
    return;
  }
  res.json({ success: true, message: "授权已撤销" });
});

export default router;
