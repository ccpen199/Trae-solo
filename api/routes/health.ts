import { Router } from "express";
import type { Request, Response } from "express";
import { healthDataService } from "../services/healthDataService.js";
import { sendPrivacyAwareResponse } from "../utils/response.js";
import { generateRealtimeVitals } from "../../shared/mockData.js";

const router = Router();
const DEFAULT_USER_ID = "user-001";

router.get("/vitals/realtime", (req: Request, res: Response) => {
  let latest = healthDataService.getLatestVital(DEFAULT_USER_ID);
  if (!latest) {
    latest = generateRealtimeVitals();
    healthDataService.addVitalRecord(DEFAULT_USER_ID, latest);
  }
  sendPrivacyAwareResponse(res, latest);
});

router.get("/hrv", (req: Request, res: Response) => {
  const range = req.query.range as string;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const records = healthDataService.getVitalRecords(DEFAULT_USER_ID, days);
  const hrvData = records.map((r) => ({
    date: r.timestamp.split("T")[0],
    time: r.timestamp.split("T")[1]?.substring(0, 5),
    timestamp: r.timestamp,
    hrv: r.hrv,
    heartRate: r.heartRate,
  }));
  sendPrivacyAwareResponse(res, hrvData);
});

router.get("/heart-rate", (req: Request, res: Response) => {
  const range = req.query.range as string;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const records = healthDataService.getVitalRecords(DEFAULT_USER_ID, days);
  const hrData = records.map((r) => ({
    timestamp: r.timestamp,
    heartRate: r.heartRate,
    restingHeartRate: r.restingHeartRate,
  }));
  sendPrivacyAwareResponse(res, hrData);
});

router.get("/stress", (req: Request, res: Response) => {
  const range = req.query.range as string;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const records = healthDataService.getVitalRecords(DEFAULT_USER_ID, days);
  const stressData = records.map((r) => ({
    timestamp: r.timestamp,
    stressIndex: r.stressIndex,
    heartRate: r.heartRate,
  }));
  sendPrivacyAwareResponse(res, stressData);
});

router.get("/blood-oxygen", (req: Request, res: Response) => {
  const range = req.query.range as string;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const records = healthDataService.getVitalRecords(DEFAULT_USER_ID, days);
  const spo2Data = records.map((r) => ({
    timestamp: r.timestamp,
    bloodOxygen: r.bloodOxygen,
  }));
  sendPrivacyAwareResponse(res, spo2Data);
});

router.get("/health-score", (req: Request, res: Response) => {
  const score = healthDataService.calculateHealthScore(DEFAULT_USER_ID);
  const baselineHR = healthDataService.getBaselineHeartRate(DEFAULT_USER_ID);
  sendPrivacyAwareResponse(res, {
    ...score,
    baselineHeartRate: baselineHR,
  });
});

router.post("/vitals/data", (req: Request, res: Response) => {
  const data = req.body;
  const record = healthDataService.addVitalRecord(DEFAULT_USER_ID, {
    heartRate: data.heartRate,
    hrv: data.hrv,
    bloodOxygen: data.bloodOxygen,
    stressIndex: data.stressIndex,
    restingHeartRate: data.restingHeartRate,
    timestamp: data.timestamp || new Date().toISOString(),
  });
  sendPrivacyAwareResponse(res, record);
});

router.get("/sleep", (req: Request, res: Response) => {
  const range = req.query.range as string;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const records = healthDataService.getSleepRecords(DEFAULT_USER_ID, days);
  sendPrivacyAwareResponse(res, records);
});

router.get("/exercise", (req: Request, res: Response) => {
  const range = req.query.range as string;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const records = healthDataService.getExerciseRecords(DEFAULT_USER_ID, days);
  sendPrivacyAwareResponse(res, records);
});

router.get("/exercise/:id/trajectory", (req: Request, res: Response) => {
  const { id } = req.params;
  const record = healthDataService.getExerciseRecordById(DEFAULT_USER_ID, id);
  if (!record) {
    res.status(404).json({
      success: false,
      error: "运动记录不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, record.trajectory);
});

router.get("/plans/current", (req: Request, res: Response) => {
  let plan = healthDataService.getCurrentPlan(DEFAULT_USER_ID);
  if (!plan) {
    const { generateExercisePlan } = require("../../shared/mockData.js");
    const mockPlan = generateExercisePlan();
    plan = healthDataService.createExercisePlan(DEFAULT_USER_ID, mockPlan);
  }
  sendPrivacyAwareResponse(res, plan);
});

router.post("/plans/generate", (req: Request, res: Response) => {
  const { generateExercisePlan } = require("../../shared/mockData.js");
  const mockPlan = generateExercisePlan();
  const plan = healthDataService.createExercisePlan(DEFAULT_USER_ID, mockPlan);
  sendPrivacyAwareResponse(res, plan);
});

router.put("/plans/:id/exercise/:dayIdx/complete", (req: Request, res: Response) => {
  const { id, dayIdx } = req.params;
  const { exerciseId } = req.body;
  const plan = healthDataService.markExerciseCompleted(
    DEFAULT_USER_ID,
    id,
    parseInt(dayIdx),
    exerciseId
  );
  if (!plan) {
    res.status(404).json({
      success: false,
      error: "计划或运动不存在",
    });
    return;
  }
  sendPrivacyAwareResponse(res, plan);
});

export default router;
