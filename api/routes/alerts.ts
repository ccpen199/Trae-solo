import { Router } from "express";
import type { Request, Response } from "express";
import { alertService } from "../services/alertService.js";
import { sendPrivacyAwareResponse } from "../utils/response.js";

const router = Router();
const DEFAULT_USER_ID = "user-001";

router.get("/", (req: Request, res: Response) => {
  const status = req.query.status as "active" | "acknowledged" | "dismissed" | undefined;
  const alerts = alertService.getAlerts(DEFAULT_USER_ID, status);
  sendPrivacyAwareResponse(res, alerts);
});

router.get("/active", (req: Request, res: Response) => {
  const alerts = alertService.getActiveAlerts(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, alerts);
});

router.get("/rules", (req: Request, res: Response) => {
  let rules = alertService.getAlertRules(DEFAULT_USER_ID);
  if (rules.length === 0) {
    rules = alertService.initializeDefaultRules(DEFAULT_USER_ID);
  }
  sendPrivacyAwareResponse(res, rules);
});

router.post("/rules", (req: Request, res: Response) => {
  const rule = alertService.createAlertRule(DEFAULT_USER_ID, req.body);
  sendPrivacyAwareResponse(res, rule);
});

router.put("/rules/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const rule = alertService.updateAlertRule(DEFAULT_USER_ID, id, req.body);
  if (!rule) {
    res.status(404).json({
      success: false,
      error: "规则不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, rule);
});

router.delete("/rules/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const success = alertService.deleteAlertRule(DEFAULT_USER_ID, id);
  if (!success) {
    res.status(404).json({
      success: false,
      error: "规则不存在",
    });
    return;
  }
  res.json({ success: true, message: "规则已删除" });
});

router.put("/:id/acknowledge", (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = alertService.acknowledgeAlert(DEFAULT_USER_ID, id, req.body);
  if (!alert) {
    res.status(404).json({
      success: false,
      error: "预警不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, alert);
});

router.put("/:id/dismiss", (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = alertService.dismissAlert(DEFAULT_USER_ID, id, req.body);
  if (!alert) {
    res.status(404).json({
      success: false,
      error: "预警不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, alert);
});

router.put("/:id/schedule-review", (req: Request, res: Response) => {
  const { id } = req.params;
  const { reviewTime, dispositionStatus } = req.body;
  if (!reviewTime) {
    res.status(400).json({
      success: false,
      error: "复查时间为必填项",
    });
    return;
  }
  const alert = alertService.scheduleReview(DEFAULT_USER_ID, id, reviewTime, dispositionStatus);
  if (!alert) {
    res.status(404).json({
      success: false,
      error: "预警不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, alert);
});

router.put("/:id/mark-referral", (req: Request, res: Response) => {
  const { id } = req.params;
  const { appointmentId } = req.body;
  const alert = alertService.markForReferral(DEFAULT_USER_ID, id, appointmentId);
  if (!alert) {
    res.status(404).json({
      success: false,
      error: "预警不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, alert);
});

router.put("/:id/complete-review", (req: Request, res: Response) => {
  const { id } = req.params;
  const { dispositionStatus, dispositionNote } = req.body;
  if (!dispositionStatus) {
    res.status(400).json({
      success: false,
      error: "处置状态为必填项",
    });
    return;
  }
  const alert = alertService.completeReview(DEFAULT_USER_ID, id, dispositionStatus, dispositionNote);
  if (!alert) {
    res.status(404).json({
      success: false,
      error: "预警不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, alert);
});

router.post("/evaluate", (req: Request, res: Response) => {
  const newAlerts = alertService.evaluateRules(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, {
    evaluated: true,
    newAlertsCount: newAlerts.length,
    newAlerts,
  });
});

export default router;
