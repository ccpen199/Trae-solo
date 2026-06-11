import db from "../db/index.js";
import type {
  VitalRecord,
  SleepRecord,
  ExerciseRecord,
  ExercisePlan,
  DailyPlan,
  HealthScoreBreakdown,
} from "../../shared/types.js";
import { reversePrivacyFilter } from "../utils/privacy.js";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function rowToVitalRecord(row: unknown): VitalRecord {
  const r = row as {
    id: string;
    user_id: string;
    heart_rate: number;
    hrv: number;
    blood_oxygen: number;
    stress_index: number;
    resting_heart_rate: number;
    timestamp: string;
    created_at: string;
  };
  return {
    id: r.id,
    userId: r.user_id,
    heartRate: r.heart_rate,
    hrv: r.hrv,
    bloodOxygen: r.blood_oxygen,
    stressIndex: r.stress_index,
    restingHeartRate: r.resting_heart_rate,
    timestamp: r.timestamp,
    createdAt: r.created_at,
  };
}

function rowToSleepRecord(row: unknown): SleepRecord {
  const r = reversePrivacyFilter(row) as {
    id: string;
    user_id: string;
    date: string;
    total_time: number;
    deep_sleep: number;
    light_sleep: number;
    rem_sleep: number;
    awake_time: number;
    noise_level_avg: number;
    noise_level_json?: string;
    quality_score: number;
    stages_json?: string;
    created_at: string;
  };
  let noiseLevel: number[] = [];
  let stages: SleepRecord["stages"] = [];
  try { if (r.noise_level_json) noiseLevel = JSON.parse(r.noise_level_json); } catch (_) {}
  try { if (r.stages_json) stages = JSON.parse(r.stages_json) as SleepRecord["stages"]; } catch (_) {}
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    totalTime: r.total_time,
    deepSleep: r.deep_sleep,
    lightSleep: r.light_sleep,
    remSleep: r.rem_sleep,
    awakeTime: r.awake_time,
    noiseLevelAvg: r.noise_level_avg,
    noiseLevel,
    qualityScore: r.quality_score,
    stages,
    createdAt: r.created_at,
  };
}

function rowToExerciseRecord(row: unknown): ExerciseRecord {
  const r = reversePrivacyFilter(row) as {
    id: string;
    user_id: string;
    type: string;
    start_time: string;
    duration: number;
    distance: number;
    calories: number;
    avg_heart_rate: number;
    max_heart_rate: number;
    trajectory_encrypted?: string;
    heart_rate_zones_json?: string;
    created_at: string;
  };
  let heartRateZones: ExerciseRecord["heartRateZones"] = [];
  try { if (r.heart_rate_zones_json) heartRateZones = JSON.parse(r.heart_rate_zones_json) as ExerciseRecord["heartRateZones"]; } catch (_) {}
  let trajectory: ExerciseRecord["trajectory"] = [];
  try { if (r.trajectory_encrypted) trajectory = JSON.parse(r.trajectory_encrypted) as ExerciseRecord["trajectory"]; } catch (_) {}
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    startTime: r.start_time,
    duration: r.duration,
    distance: r.distance,
    calories: r.calories,
    avgHeartRate: r.avg_heart_rate,
    maxHeartRate: r.max_heart_rate,
    trajectory,
    heartRateZones,
    createdAt: r.created_at,
  };
}

function rowToExercisePlan(row: unknown): ExercisePlan {
  const r = reversePrivacyFilter(row) as {
    id: string;
    user_id: string;
    week_start: string;
    week_end: string;
    daily_plans_json: string;
    completion_rate: number;
    recommendation: string;
    adaptive_reasoning: string;
  };
  let dailyPlans: DailyPlan[] = [];
  try {
    if (r.daily_plans_json) {
      dailyPlans = JSON.parse(r.daily_plans_json) as DailyPlan[];
    }
  } catch (e) {
    console.error("Failed to parse dailyPlans JSON:", e);
  }
  return {
    id: r.id,
    userId: r.user_id,
    weekStart: r.week_start,
    weekEnd: r.week_end,
    dailyPlans,
    completionRate: r.completion_rate,
    recommendation: r.recommendation,
    adaptiveReasoning: r.adaptive_reasoning,
  };
}

export class HealthDataService {
  getVitalRecords(userId: string, days: number = 30): VitalRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM vital_records 
      WHERE user_id = ? AND timestamp >= datetime('now', '-' || ? || ' days')
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(userId, days) as unknown[];
    return rows.map(rowToVitalRecord);
  }

  getLatestVital(userId: string): VitalRecord | null {
    const stmt = db.prepare(`
      SELECT * FROM vital_records WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1
    `);
    const row = stmt.get(userId) as unknown;
    return row ? rowToVitalRecord(row) : null;
  }

  addVitalRecord(
    userId: string,
    data: Omit<VitalRecord, "id" | "userId" | "createdAt">
  ): VitalRecord {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO vital_records (id, user_id, heart_rate, hrv, blood_oxygen, stress_index, resting_heart_rate, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      data.heartRate,
      data.hrv,
      data.bloodOxygen,
      data.stressIndex,
      data.restingHeartRate,
      data.timestamp
    );
    return this.getLatestVital(userId) as VitalRecord;
  }

  getSleepRecords(userId: string, days: number = 30): SleepRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM sleep_records 
      WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date DESC
    `);
    const rows = stmt.all(userId, days) as unknown[];
    return rows.map(rowToSleepRecord);
  }

  addSleepRecord(
    userId: string,
    data: Omit<SleepRecord, "id" | "userId" | "createdAt">
  ): SleepRecord | null {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO sleep_records (
        id, user_id, date, total_time, deep_sleep, light_sleep, rem_sleep, 
        awake_time, noise_level_avg, noise_level_json, quality_score, stages_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
      stmt.run(
        id,
        userId,
        data.date,
        data.totalTime,
        data.deepSleep,
        data.lightSleep,
        data.remSleep,
        data.awakeTime,
        data.noiseLevelAvg,
        JSON.stringify(data.noiseLevel || []),
        data.qualityScore,
        JSON.stringify(data.stages || [])
      );
      const find = db.prepare(`SELECT * FROM sleep_records WHERE id = ?`);
      const row = find.get(id) as unknown;
      return row ? rowToSleepRecord(row) : null;
    } catch (e) {
      console.error("addSleepRecord error:", e);
      return null;
    }
  }

  getExerciseRecords(userId: string, days: number = 30): ExerciseRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM exercise_records 
      WHERE user_id = ? AND start_time >= datetime('now', '-' || ? || ' days')
      ORDER BY start_time DESC
    `);
    const rows = stmt.all(userId, days) as unknown[];
    return rows.map(rowToExerciseRecord);
  }

  addExerciseRecord(
    userId: string,
    data: Omit<ExerciseRecord, "id" | "userId" | "createdAt">
  ): ExerciseRecord | null {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO exercise_records (
        id, user_id, type, start_time, duration, distance, calories,
        avg_heart_rate, max_heart_rate, trajectory_encrypted, heart_rate_zones_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
      stmt.run(
        id,
        userId,
        data.type,
        data.startTime,
        data.duration,
        data.distance,
        data.calories,
        data.avgHeartRate,
        data.maxHeartRate,
        JSON.stringify(data.trajectory || []),
        JSON.stringify(data.heartRateZones || [])
      );
      const find = db.prepare(`SELECT * FROM exercise_records WHERE id = ?`);
      const row = find.get(id) as unknown;
      return row ? rowToExerciseRecord(row) : null;
    } catch (e) {
      console.error("addExerciseRecord error:", e);
      return null;
    }
  }

  getExerciseRecordById(userId: string, recordId: string): ExerciseRecord | null {
    const stmt = db.prepare(`
      SELECT * FROM exercise_records WHERE id = ? AND user_id = ?
    `);
    const row = stmt.get(recordId, userId) as unknown;
    return row ? rowToExerciseRecord(row) : null;
  }

  getCurrentPlan(userId: string): ExercisePlan | null {
    const stmt = db.prepare(`
      SELECT * FROM exercise_plans 
      WHERE user_id = ? AND week_start <= date('now') AND week_end >= date('now')
      ORDER BY week_start DESC LIMIT 1
    `);
    const row = stmt.get(userId) as unknown;
    return row ? rowToExercisePlan(row) : null;
  }

  createExercisePlan(
    userId: string,
    plan: Omit<ExercisePlan, "id" | "userId">
  ): ExercisePlan {
    const id = generateId();
    const existing = db
      .prepare(`SELECT id FROM exercise_plans WHERE user_id = ? AND week_start = ?`)
      .get(userId, plan.weekStart) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE exercise_plans SET daily_plans_json = ?, completion_rate = ?, recommendation = ?, adaptive_reasoning = ? WHERE id = ?`
      ).run(
        JSON.stringify(plan.dailyPlans),
        plan.completionRate,
        plan.recommendation,
        plan.adaptiveReasoning,
        existing.id
      );
      return this.getCurrentPlan(userId) as ExercisePlan;
    }

    const stmt = db.prepare(`
      INSERT INTO exercise_plans (id, user_id, week_start, week_end, daily_plans_json, completion_rate, recommendation, adaptive_reasoning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      plan.weekStart,
      plan.weekEnd,
      JSON.stringify(plan.dailyPlans),
      plan.completionRate,
      plan.recommendation,
      plan.adaptiveReasoning
    );
    return this.getCurrentPlan(userId) as ExercisePlan;
  }

  markExerciseCompleted(
    userId: string,
    planId: string,
    dayIdx: number,
    exerciseId: string
  ): ExercisePlan | null {
    const plan = this.getCurrentPlan(userId);
    if (!plan || plan.id !== planId) return null;

    const dailyPlan = plan.dailyPlans[dayIdx];
    if (!dailyPlan) return null;

    const exercise = dailyPlan.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return null;

    exercise.completed = true;
    dailyPlan.completed = dailyPlan.exercises.every((e) => e.completed);
    dailyPlan.completionRate =
      dailyPlan.exercises.filter((e) => e.completed).length /
      dailyPlan.exercises.length;

    const totalExercises = plan.dailyPlans.reduce(
      (sum, d) => sum + d.exercises.length,
      0
    );
    const completedExercises = plan.dailyPlans.reduce(
      (sum, d) => sum + d.exercises.filter((e) => e.completed).length,
      0
    );
    plan.completionRate =
      totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

    db.prepare(
      `UPDATE exercise_plans SET daily_plans_json = ?, completion_rate = ? WHERE id = ?`
    ).run(JSON.stringify(plan.dailyPlans), plan.completionRate, planId);

    return plan;
  }

  calculateHealthScore(userId: string): HealthScoreBreakdown {
    const vitals = this.getVitalRecords(userId, 7);
    const sleeps = this.getSleepRecords(userId, 7);
    const exercises = this.getExerciseRecords(userId, 7);

    if (vitals.length === 0) {
      return { overall: 75, sleep: 75, activity: 75, heart: 75, stress: 75 };
    }

    const avgHR = vitals.reduce((sum, v) => sum + v.heartRate, 0) / vitals.length;
    const avgHRV = vitals.reduce((sum, v) => sum + v.hrv, 0) / vitals.length;
    const avgStress = vitals.reduce((sum, v) => sum + v.stressIndex, 0) / vitals.length;
    const avgSleep =
      sleeps.length > 0
        ? sleeps.reduce((sum, s) => sum + s.qualityScore, 0) / sleeps.length
        : 75;

    const heartScore = Math.max(0, Math.min(100, 100 - Math.abs(avgHR - 65) * 1.5));
    const hrvScore = Math.max(0, Math.min(100, (avgHRV / 70) * 100));
    const stressScore = Math.max(0, Math.min(100, 100 - avgStress));
    const sleepScore = avgSleep;
    const activityScore = Math.min(100, exercises.length * 20);

    return {
      overall: Math.round((heartScore + hrvScore + sleepScore + activityScore + stressScore) / 5),
      sleep: Math.round(sleepScore),
      activity: Math.round(activityScore),
      heart: Math.round((heartScore + hrvScore) / 2),
      stress: Math.round(stressScore),
    };
  }

  getBaselineHeartRate(userId: string): number {
    const vitals = this.getVitalRecords(userId, 14);
    if (vitals.length === 0) return 65;
    const restingRates = vitals
      .map((v) => v.restingHeartRate)
      .filter((r) => r > 40 && r < 100);
    if (restingRates.length === 0) return 65;
    return Math.round(restingRates.reduce((a, b) => a + b, 0) / restingRates.length);
  }
}

export const healthDataService = new HealthDataService();
