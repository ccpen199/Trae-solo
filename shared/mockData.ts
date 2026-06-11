import type {
  Device,
  ScanResult,
  VitalRecord,
  SleepRecord,
  ExerciseRecord,
  ExercisePlan,
  Alert,
  AlertRule,
  HealthArchive,
  HISDepartment,
  HISDoctor,
  HISAppointment,
  DataAuthorization,
  HealthScoreBreakdown,
  SleepStage,
  ExerciseTrajectoryPoint,
} from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getDaysAgoDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function formatDate(date: Date): string {
  return date.toISOString();
}

export const mockDevices: Device[] = [
  {
    id: generateId(),
    userId: "user-001",
    brand: "Xiaomi",
    model: "Mi Band 8",
    name: "我的小米手环",
    firmwareVersion: "1.5.2",
    batteryLevel: 78,
    connectionStatus: "connected",
    lastSyncTime: formatDate(new Date()),
    signalStrength: -55,
    syncStatus: "completed",
    abstractionStatus: "adapted",
    privacyStatus: "encrypted",
    archiveStatus: "completed",
    lastSyncResult: {
      recordsSynced: 288,
      recordsFailed: 0,
      syncDuration: 12.5,
      completedAt: formatDate(new Date()),
    },
    supportedFeatures: ["心率", "血氧", "睡眠", "压力", "HRV", "运动追踪"],
    protocolVersion: "BLE 5.2 / GATT / HRS v1.0",
  },
  {
    id: generateId(),
    userId: "user-001",
    brand: "Apple",
    model: "Watch Series 9",
    name: "Apple Watch",
    firmwareVersion: "10.2",
    batteryLevel: 45,
    connectionStatus: "disconnected",
    lastSyncTime: getDaysAgoDate(1),
    signalStrength: -78,
    syncStatus: "idle",
    abstractionStatus: "adapted",
    privacyStatus: "encrypted",
    archiveStatus: "completed",
    lastSyncResult: {
      recordsSynced: 144,
      recordsFailed: 2,
      syncDuration: 18.3,
      completedAt: getDaysAgoDate(1),
    },
    supportedFeatures: ["心率", "血氧", "ECG", "睡眠", "HRV", "运动追踪", "跌倒检测"],
    protocolVersion: "BLE 5.3 / GATT / HRS v1.0",
  },
];

export const mockScanResults: ScanResult[] = [
  {
    deviceId: "scan-001",
    name: "Xiaomi Band 8",
    brand: "Xiaomi",
    signalStrength: -58,
    supportedProtocols: ["BLE", "GATT", "HRS"],
    supportedFeatures: ["心率", "血氧", "睡眠", "压力"],
    rawSignalData: {
      rssi: -58,
      txPower: -60,
      advertisingData: "02010603020D1809095869616F6D692042616E64",
    },
  },
  {
    deviceId: "scan-002",
    name: "Huawei Watch GT4",
    brand: "Huawei",
    signalStrength: -72,
    supportedProtocols: ["BLE", "GATT"],
    supportedFeatures: ["心率", "血氧", "睡眠", "HRV", "运动追踪"],
    rawSignalData: {
      rssi: -72,
      txPower: -55,
      advertisingData: "02010603020D18090C487561776569205761746368",
    },
  },
  {
    deviceId: "scan-003",
    name: "Amazfit Bip 5",
    brand: "Amazfit",
    signalStrength: -85,
    supportedProtocols: ["BLE", "HRS"],
    supportedFeatures: ["心率", "睡眠", "运动追踪"],
    rawSignalData: {
      rssi: -85,
      txPower: -58,
      advertisingData: "02010603020D18090B416D617A66697420426970",
    },
  },
];

export function generateVitalRecords(days: number = 30): VitalRecord[] {
  const records: VitalRecord[] = [];
  const baseHR = 62;
  const baseHRV = 55;
  const baseSpO2 = 97;
  const baseStress = 35;

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);

    for (let h = 0; h < 24; h += 2) {
      const hourVariation = h >= 6 && h <= 22 ? randomInt(5, 15) : randomInt(-10, -2);
      const dayVariation = Math.sin(d / 7) * 5;

      records.push({
        id: generateId(),
        userId: "user-001",
        heartRate: Math.max(45, baseHR + hourVariation + dayVariation + randomInt(-5, 5)),
        hrv: Math.max(20, baseHRV + dayVariation * 2 + randomInt(-10, 10)),
        bloodOxygen: Math.min(100, baseSpO2 + randomInt(-2, 2)),
        stressIndex: Math.max(10, Math.min(100, baseStress + (h >= 9 && h <= 18 ? randomInt(10, 25) : randomInt(-10, 5)))),
        restingHeartRate: baseHR + randomInt(-3, 3),
        timestamp: formatDate(new Date(date.setHours(h, randomInt(0, 59), 0, 0))),
        createdAt: formatDate(new Date()),
      });
    }
  }

  records.push({
    id: generateId(),
    userId: "user-001",
    heartRate: 78,
    hrv: 52,
    bloodOxygen: 98,
    stressIndex: 32,
    restingHeartRate: 63,
    timestamp: formatDate(new Date()),
    createdAt: formatDate(new Date()),
  });

  return records;
}

export function generateSleepRecords(days: number = 30): SleepRecord[] {
  const records: SleepRecord[] = [];

  for (let d = days - 1; d >= 0; d--) {
    const date = getDaysAgoDate(d);
    const dayQuality = Math.sin(d / 5) * 15 + 75;
    const totalMinutes = randomInt(360, 540);
    const noiseLevel: number[] = Array.from({ length: 48 }, () => randomFloat(25, 70, 0));

    const deepPct = randomFloat(0.15, 0.25);
    const lightPct = randomFloat(0.45, 0.55);
    const remPct = randomFloat(0.15, 0.25);
    const awakePct = 1 - deepPct - lightPct - remPct;

    const stages: { stage: SleepStage; start: string; end: string; duration: number }[] = [];
    let currentTime = 0;
    const stageTypes: SleepStage[] = ["light", "deep", "light", "rem", "light", "deep", "rem", "light"];

    for (const stage of stageTypes) {
      const duration = randomInt(20, 60);
      const startDate = new Date(`${date}T23:00:00`);
      startDate.setMinutes(startDate.getMinutes() + currentTime);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);

      stages.push({
        stage,
        start: formatDate(startDate),
        end: formatDate(endDate),
        duration,
      });

      currentTime += duration;
      if (currentTime >= totalMinutes) break;
    }

    records.push({
      id: generateId(),
      userId: "user-001",
      date,
      totalTime: totalMinutes,
      deepSleep: Math.round(totalMinutes * deepPct),
      lightSleep: Math.round(totalMinutes * lightPct),
      remSleep: Math.round(totalMinutes * remPct),
      awakeTime: Math.round(totalMinutes * awakePct),
      noiseLevelAvg: noiseLevel.reduce((a, b) => a + b, 0) / noiseLevel.length,
      noiseLevel,
      qualityScore: Math.max(50, Math.min(100, dayQuality + randomInt(-10, 10))),
      stages,
      createdAt: formatDate(new Date()),
    });
  }

  return records;
}

export function generateExerciseRecords(days: number = 30): ExerciseRecord[] {
  const records: ExerciseRecord[] = [];
  const exerciseTypes = ["跑步", "骑行", "游泳", "瑜伽", "力量训练", "快走"];

  for (let d = days - 1; d >= 0; d--) {
    if (Math.random() > 0.4) continue;

    const date = new Date();
    date.setDate(date.getDate() - d);
    const type = exerciseTypes[randomInt(0, exerciseTypes.length - 1)];

    const duration = randomInt(20, 90);
    const distance = type === "跑步" || type === "骑行" || type === "快走"
      ? randomFloat(1, 15, 1)
      : 0;
    const calories = randomInt(150, 600);
    const avgHR = randomInt(110, 155);

    const trajectory: ExerciseTrajectoryPoint[] = [];
    if (distance > 0) {
      const points = randomInt(20, 50);
      const baseLat = 31.2304;
      const baseLng = 121.4737;

      for (let i = 0; i < points; i++) {
        const ts = new Date(date);
        ts.setMinutes(ts.getMinutes() + (duration * i) / points);

        trajectory.push({
          lat: baseLat + randomFloat(-0.02, 0.02, 5),
          lng: baseLng + randomFloat(-0.02, 0.02, 5),
          hr: avgHR + randomInt(-15, 20),
          ts: formatDate(ts),
        });
      }
    }

    records.push({
      id: generateId(),
      userId: "user-001",
      type,
      startTime: formatDate(new Date(date.setHours(randomInt(6, 20), randomInt(0, 59)))),
      duration,
      distance,
      calories,
      avgHeartRate: avgHR,
      maxHeartRate: avgHR + randomInt(10, 30),
      trajectory,
      heartRateZones: [
        { zone: "轻松", duration: randomInt(5, 15), percentage: randomFloat(10, 30) },
        { zone: "燃脂", duration: randomInt(10, 30), percentage: randomFloat(30, 50) },
        { zone: "有氧", duration: randomInt(5, 20), percentage: randomFloat(20, 40) },
        { zone: "极限", duration: randomInt(0, 10), percentage: randomFloat(0, 15) },
      ],
      createdAt: formatDate(new Date()),
    });
  }

  return records;
}

export function generateExercisePlan(): ExercisePlan {
  const weekStart = getDaysAgoDate(new Date().getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const exercises = [
    { name: "晨跑 5 公里", low: 30, medium: 45, high: 60 },
    { name: "HIIT 训练", low: 20, medium: 30, high: 45 },
    { name: "力量训练", low: 30, medium: 45, high: 60 },
    { name: "瑜伽放松", low: 30, medium: 45, high: 60 },
    { name: "游泳", low: 30, medium: 45, high: 60 },
    { name: "骑行", low: 40, medium: 60, high: 90 },
    { name: "快走", low: 30, medium: 45, high: 60 },
  ];

  const dailyPlans = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);

    const dayExercises = [];
    const numExercises = randomInt(1, 3);

    for (let j = 0; j < numExercises; j++) {
      const exercise = exercises[randomInt(0, exercises.length - 1)];
      const intensities: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
      const intensity = intensities[randomInt(0, 2)];

      dayExercises.push({
        id: generateId(),
        name: exercise.name,
        duration: exercise[intensity],
        intensity,
        completed: Math.random() > 0.3,
      });
    }

    const completedCount = dayExercises.filter((e) => e.completed).length;

    dailyPlans.push({
      day: date.toISOString().split("T")[0],
      dayName: dayNames[i],
      exercises: dayExercises,
      completed: completedCount === dayExercises.length,
      completionRate: dayExercises.length > 0 ? (completedCount / dayExercises.length) * 100 : 100,
    });
  }

  const totalExercises = dailyPlans.reduce((sum, d) => sum + d.exercises.length, 0);
  const completedExercises = dailyPlans.reduce(
    (sum, d) => sum + d.exercises.filter((e) => e.completed).length,
    0
  );

  return {
    id: generateId(),
    userId: "user-001",
    weekStart,
    weekEnd: weekEnd.toISOString().split("T")[0],
    dailyPlans,
    completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
    recommendation: "基于您上周 75% 的运动完成率和良好的 HRV 恢复指数，本周建议增加 2 次低强度有氧训练以提升心肺耐力。",
    adaptiveReasoning: "HRV 指数近 7 天呈上升趋势，表明身体恢复状态良好，可适当提升训练强度。",
  };
}

export const mockAlerts: Alert[] = [
  {
    id: generateId(),
    userId: "user-001",
    type: "heart_rate_spike",
    severity: "critical",
    title: "静息心率异常升高",
    description: "您的静息心率较基线值升高 28%，已持续 2.5 小时，建议休息并监测身体状况。",
    value: 85,
    threshold: 20,
    startedAt: formatDate(new Date(Date.now() - 150 * 60 * 1000)),
    durationMinutes: 150,
    status: "active",
    createdAt: formatDate(new Date()),
  },
  {
    id: generateId(),
    userId: "user-001",
    type: "high_stress",
    severity: "warning",
    title: "压力指数偏高",
    description: "过去 4 小时您的平均压力指数达到 78，建议进行深呼吸或冥想放松。",
    value: 78,
    threshold: 70,
    startedAt: formatDate(new Date(Date.now() - 240 * 60 * 1000)),
    durationMinutes: 240,
    status: "active",
    createdAt: formatDate(new Date()),
  },
  {
    id: generateId(),
    userId: "user-001",
    type: "abnormal_hrv",
    severity: "info",
    title: "HRV 下降提醒",
    description: "您的 HRV 近期呈下降趋势，可能提示身体疲劳，请注意休息。",
    value: 42,
    threshold: 45,
    startedAt: formatDate(new Date(Date.now() - 48 * 60 * 60 * 1000)),
    durationMinutes: 2880,
    status: "acknowledged",
    createdAt: formatDate(new Date()),
    acknowledgedBy: "张三",
    acknowledgedAt: formatDate(new Date(Date.now() - 47 * 60 * 60 * 1000)),
    dispositionStatus: "observed",
    dispositionNote: "近期工作压力较大，已调整作息，每日增加30分钟放松时间",
    reviewScheduledAt: formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  },
  {
    id: generateId(),
    userId: "user-001",
    type: "low_blood_oxygen",
    severity: "warning",
    title: "血氧饱和度偏低",
    description: "睡眠期间血氧饱和度最低值为 91%，建议检查睡眠环境通风情况。",
    value: 91,
    threshold: 92,
    startedAt: formatDate(new Date(Date.now() - 8 * 60 * 60 * 1000)),
    durationMinutes: 480,
    status: "pending_review",
    createdAt: formatDate(new Date()),
    acknowledgedBy: "张三",
    acknowledgedAt: formatDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
    dispositionStatus: "referral_suggested",
    dispositionNote: "夜间血氧持续偏低，建议转诊至呼吸内科进一步检查",
    reviewScheduledAt: formatDate(new Date(Date.now() + 48 * 60 * 60 * 1000)),
    referralNeeded: true,
  },
  {
    id: generateId(),
    userId: "user-001",
    type: "custom",
    severity: "warning",
    title: "睡眠质量持续下降",
    description: "近一周睡眠质量评分平均低于65分，深睡占比不足15%。",
    value: 62,
    threshold: 65,
    startedAt: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    durationMinutes: 10080,
    status: "dismissed",
    createdAt: formatDate(new Date()),
    dismissedBy: "张三",
    dismissedAt: formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    dismissReason: "近期熬夜看球，属于已知原因导致的睡眠质量下降，已调整作息",
  },
];

export const mockAlertRules: AlertRule[] = [
  {
    id: generateId(),
    userId: "user-001",
    metric: "restingHeartRate",
    metricName: "静息心率",
    condition: "spike_percent",
    threshold: 20,
    durationMinutes: 120,
    severity: "critical",
    enabled: true,
  },
  {
    id: generateId(),
    userId: "user-001",
    metric: "bloodOxygen",
    metricName: "血氧饱和度",
    condition: "lt",
    threshold: 92,
    durationMinutes: 30,
    severity: "warning",
    enabled: true,
  },
  {
    id: generateId(),
    userId: "user-001",
    metric: "stressIndex",
    metricName: "压力指数",
    condition: "gt",
    threshold: 75,
    durationMinutes: 60,
    severity: "warning",
    enabled: true,
  },
  {
    id: generateId(),
    userId: "user-001",
    metric: "hrv",
    metricName: "心率变异性",
    condition: "lt",
    threshold: 40,
    durationMinutes: 360,
    severity: "info",
    enabled: true,
  },
  {
    id: generateId(),
    userId: "user-001",
    metric: "sleepQuality",
    metricName: "睡眠质量评分",
    condition: "lt",
    threshold: 60,
    durationMinutes: 0,
    severity: "info",
    enabled: false,
  },
];

export const mockHealthArchives: HealthArchive[] = [
  {
    id: generateId(),
    userId: "user-001",
    dateStart: getDaysAgoDate(30),
    dateEnd: getDaysAgoDate(0),
    dataTypes: ["vitals", "sleep", "exercise", "alerts"],
    format: "json",
    standard: "移动健康终端设备数据交互规范",
    generatedAt: formatDate(new Date()),
    filePath: "/archives/archive-001.json",
    downloadUrl: "/api/archives/archive-001/download",
    status: "completed",
  },
  {
    id: generateId(),
    userId: "user-001",
    dateStart: getDaysAgoDate(90),
    dateEnd: getDaysAgoDate(31),
    dataTypes: ["vitals", "sleep", "exercise"],
    format: "pdf",
    standard: "移动健康终端设备数据交互规范",
    generatedAt: formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    filePath: "/archives/archive-002.pdf",
    downloadUrl: "/api/archives/archive-002/download",
    status: "completed",
  },
];

export const mockHISDepartments: HISDepartment[] = [
  { id: "dept-001", name: "心血管内科", description: "诊治心血管系统相关疾病" },
  { id: "dept-002", name: "呼吸内科", description: "诊治呼吸系统相关疾病" },
  { id: "dept-003", name: "神经内科", description: "诊治神经系统相关疾病" },
  { id: "dept-004", name: "内分泌科", description: "诊治内分泌代谢相关疾病" },
  { id: "dept-005", name: "全科医学科", description: "全科医疗与健康咨询" },
];

export const mockHISDoctors: HISDoctor[] = [
  {
    id: "doc-001",
    name: "张医生",
    department: "心血管内科",
    departmentId: "dept-001",
    title: "主任医师",
    availableSlots: ["2026-06-12 上午 09:00", "2026-06-12 上午 10:00", "2026-06-13 下午 14:00"],
  },
  {
    id: "doc-002",
    name: "李医生",
    department: "心血管内科",
    departmentId: "dept-001",
    title: "副主任医师",
    availableSlots: ["2026-06-12 下午 14:30", "2026-06-14 上午 09:30"],
  },
  {
    id: "doc-003",
    name: "王医生",
    department: "全科医学科",
    departmentId: "dept-005",
    title: "主治医师",
    availableSlots: ["2026-06-11 下午 15:00", "2026-06-12 上午 11:00", "2026-06-13 上午 09:00"],
  },
];

export const mockAppointments: HISAppointment[] = [
  {
    id: generateId(),
    hospitalId: "hosp-001",
    departmentId: "dept-001",
    doctorId: "doc-001",
    date: "2026-06-12",
    timeSlot: "上午 09:00",
    patientName: "张三",
    patientPhone: "138****8888",
    status: "confirmed",
    createdAt: formatDate(new Date()),
  },
];

export const mockAuthorizations: DataAuthorization[] = [
  {
    id: generateId(),
    userId: "user-001",
    targetOrg: "city-hospital-001",
    targetOrgName: "市第一人民医院",
    scope: ["vitals", "sleep", "exercise"],
    scopeDescription: "基础生理数据、睡眠数据、运动记录",
    expiresAt: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    createdAt: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    revoked: false,
  },
  {
    id: generateId(),
    userId: "user-001",
    targetOrg: "health-insurance-001",
    targetOrgName: "平安健康保险",
    scope: ["exercise", "vitals"],
    scopeDescription: "运动记录、基础生理指标",
    expiresAt: formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    createdAt: formatDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
    revoked: false,
  },
];

export function calculateHealthScore(): HealthScoreBreakdown {
  const vitals = generateVitalRecords(7);
  const sleeps = generateSleepRecords(7);
  const exercises = generateExerciseRecords(7);

  const avgHR = vitals.reduce((sum, v) => sum + v.heartRate, 0) / vitals.length;
  const avgHRV = vitals.reduce((sum, v) => sum + v.hrv, 0) / vitals.length;
  const avgStress = vitals.reduce((sum, v) => sum + v.stressIndex, 0) / vitals.length;
  const avgSleep = sleeps.reduce((sum, s) => sum + s.qualityScore, 0) / sleeps.length;

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

export function generateRealtimeVitals(): VitalRecord {
  const baseHR = 65 + Math.sin(Date.now() / 5000) * 3;
  return {
    id: generateId(),
    userId: "user-001",
    heartRate: Math.round(baseHR + randomInt(-2, 2)),
    hrv: 55 + randomFloat(-5, 5),
    bloodOxygen: 97 + randomInt(-1, 1),
    stressIndex: 35 + randomInt(-5, 5),
    restingHeartRate: 62 + randomInt(-2, 2),
    timestamp: formatDate(new Date()),
    createdAt: formatDate(new Date()),
  };
}
