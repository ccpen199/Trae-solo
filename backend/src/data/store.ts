import type { Task, TaskSubmission, RiskAlert, Transaction, Enterprise, Executor, PricingAdjustmentRecord, ReviewFlowRecord } from "../types.js";
import { v4 as uuid } from "uuid";

const enterprises: Enterprise[] = [
  { id: "ent-001", name: "星辰数字科技有限公司", email: "contact@stardigital.cn", licenseNo: "91110108MA01XXXX", industry: "互联网科技", contactPerson: "张明", contactPhone: "138****5678", status: "verified", balance: 125000, totalBudget: 200000, taskCount: 5, createdAt: "2026-01-15T08:00:00Z" },
  { id: "ent-002", name: "云端市场研究公司", email: "info@cloudresearch.cn", licenseNo: "91310115MA1HXXXX", industry: "市场调研", contactPerson: "李娜", contactPhone: "139****1234", status: "verified", balance: 88000, totalBudget: 150000, taskCount: 3, createdAt: "2026-02-01T10:00:00Z" },
  { id: "ent-003", name: "新锐品牌管理公司", email: "hello@xinbrand.cn", licenseNo: "91440300MA5FXXXX", industry: "品牌管理", contactPerson: "王磊", contactPhone: "137****9876", status: "pending", balance: 45000, totalBudget: 80000, taskCount: 2, createdAt: "2026-03-10T09:00:00Z" },
];

const executors: Executor[] = [
  { id: "exe-001", name: "陈晓", phone: "136****2345", realNameVerified: true, creditScore: 92, totalEarnings: 4560.50, availableBalance: 320.00, frozenBalance: 150.00, bankAccount: "6222****8901", bankType: "二类户", taskCount: 128, passRate: 0.96, deviceFingerprint: "fp-a1b2c3", createdAt: "2026-01-20T10:00:00Z" },
  { id: "exe-002", name: "赵磊", phone: "138****6789", realNameVerified: true, creditScore: 85, totalEarnings: 2890.00, availableBalance: 180.00, frozenBalance: 0, bankAccount: "6228****3456", bankType: "二类户", taskCount: 87, passRate: 0.91, deviceFingerprint: "fp-d4e5f6", createdAt: "2026-02-05T14:00:00Z" },
  { id: "exe-003", name: "周芳", phone: "139****0123", realNameVerified: true, creditScore: 78, totalEarnings: 1250.00, availableBalance: 95.00, frozenBalance: 50.00, bankAccount: "6217****7890", bankType: "二类户", taskCount: 42, passRate: 0.88, deviceFingerprint: "fp-g7h8i9", createdAt: "2026-03-01T08:00:00Z" },
];

const tasks: Task[] = [
  {
    id: "task-001", enterpriseId: "ent-001", enterpriseName: "星辰数字科技有限公司", title: "品牌视频观看与反馈收集", description: "观看3分钟品牌宣传片并提交真实反馈", type: "media", reward: 2.5, originalReward: 2.0, difficulty: 1, completionRate: 0.72, quota: 2000, completed: 1440, status: "active", estimatedTime: 5,
    targetDemographic: { ageRange: [18, 45], regions: ["全国"] }, createdAt: "2026-06-01T08:00:00Z", deadline: "2026-07-01T23:59:59Z", views: 5680, clicks: 2890, conversionRate: 0.51,
    riskConfig: { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: false, antiCheating: true },
    executorQualification: { minCreditScore: 60, requireRealName: true },
    reviewChain: { aiReview: true, manualSamplingRate: 0.05, allowDispute: true },
    pricingHistory: [{ id: "adj-001", timestamp: "2026-06-10T10:00:00Z", reason: "完成率低于70%阈值", oldReward: 2.0, newReward: 2.5, triggeredBy: "system", completionRateAtTime: 0.68, budgetImpact: 1000, roiImpact: -0.08 }],
    budgetLimit: 4800,
    mediaConfig: { videoUrl: "https://example.com/video/brand-001.mp4", requiredDuration: 180, allowSkip: false },
  },
  {
    id: "task-002", enterpriseId: "ent-002", enterpriseName: "云端市场研究公司", title: "消费者购物偏好调研问卷", description: "完成30道消费者行为调研题目，需通过逻辑校验", type: "survey", reward: 5.0, originalReward: 5.0, difficulty: 2, completionRate: 0.45, quota: 1000, completed: 450, status: "active", estimatedTime: 15,
    targetDemographic: { ageRange: [25, 50], regions: ["北京", "上海", "广州", "深圳"] }, createdAt: "2026-06-05T09:00:00Z", deadline: "2026-07-15T23:59:59Z", views: 3200, clicks: 1200, conversionRate: 0.38,
    riskConfig: { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true },
    executorQualification: { minCreditScore: 70, requireRealName: true },
    reviewChain: { aiReview: true, manualSamplingRate: 0.15, allowDispute: true },
    pricingHistory: [],
    budgetLimit: 6000,
    surveyConfig: { questions: [], logicRules: [] },
  },
  {
    id: "task-003", enterpriseId: "ent-003", enterpriseName: "新锐品牌管理公司", title: "新品沐浴露体验与反馈", description: "签收新品并上传OCR识别凭证，提交使用反馈图文", type: "experience", reward: 15.0, originalReward: 12.0, difficulty: 3, completionRate: 0.30, quota: 500, completed: 150, status: "active", estimatedTime: 30,
    targetDemographic: { ageRange: [20, 40], regions: ["全国"] }, createdAt: "2026-06-08T10:00:00Z", deadline: "2026-08-01T23:59:59Z", views: 1800, clicks: 650, conversionRate: 0.36,
    riskConfig: { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true },
    executorQualification: { minCreditScore: 75, requireRealName: true },
    reviewChain: { aiReview: true, manualSamplingRate: 0.25, allowDispute: true },
    pricingHistory: [{ id: "adj-003", timestamp: "2026-06-12T14:00:00Z", reason: "完成率低于50%阈值", oldReward: 12.0, newReward: 15.0, triggeredBy: "system", completionRateAtTime: 0.28, budgetImpact: 1500, roiImpact: -0.15 }],
    budgetLimit: 7200,
    experienceConfig: { productName: "清新沐浴露", requireOcr: true, requireFeedback: true, feedbackMinLength: 50, minPhotos: 2 },
  },
  {
    id: "task-004", enterpriseId: "ent-001", enterpriseName: "星辰数字科技有限公司", title: "APP功能体验评测", description: "下载并体验APP核心功能流程，提交截图和反馈", type: "experience", reward: 8.0, originalReward: 8.0, difficulty: 2, completionRate: 0.55, quota: 800, completed: 440, status: "active", estimatedTime: 20,
    targetDemographic: { ageRange: [18, 35], regions: ["全国"] }, createdAt: "2026-06-10T08:00:00Z", deadline: "2026-07-20T23:59:59Z", views: 2100, clicks: 880, conversionRate: 0.42,
    riskConfig: { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true },
    executorQualification: { minCreditScore: 65, requireRealName: true },
    reviewChain: { aiReview: true, manualSamplingRate: 0.20, allowDispute: true },
    pricingHistory: [],
    budgetLimit: 7680,
    experienceConfig: { productName: "星辰APP", requireOcr: false, requireFeedback: true, feedbackMinLength: 30, minPhotos: 3 },
  },
  {
    id: "task-005", enterpriseId: "ent-002", enterpriseName: "云端市场研究公司", title: "健康饮食习惯调研", description: "完成25道健康饮食相关调研题目", type: "survey", reward: 3.5, originalReward: 3.0, difficulty: 1, completionRate: 0.62, quota: 1500, completed: 930, status: "active", estimatedTime: 10,
    targetDemographic: { ageRange: [20, 60], regions: ["全国"] }, createdAt: "2026-06-03T09:00:00Z", deadline: "2026-07-10T23:59:59Z", views: 4100, clicks: 1800, conversionRate: 0.44,
    riskConfig: { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true },
    executorQualification: { minCreditScore: 60, requireRealName: true },
    reviewChain: { aiReview: true, manualSamplingRate: 0.10, allowDispute: true },
    pricingHistory: [{ id: "adj-005", timestamp: "2026-06-11T09:00:00Z", reason: "完成率低于60%阈值", oldReward: 3.0, newReward: 3.5, triggeredBy: "system", completionRateAtTime: 0.58, budgetImpact: 750, roiImpact: -0.05 }],
    budgetLimit: 5400,
    surveyConfig: { questions: [], logicRules: [] },
  },
  {
    id: "task-006", enterpriseId: "ent-001", enterpriseName: "星辰数字科技有限公司", title: "短视频广告效果测评", description: "观看15秒广告视频并回答相关问题", type: "media", reward: 1.5, originalReward: 1.5, difficulty: 1, completionRate: 0.85, quota: 3000, completed: 2550, status: "active", estimatedTime: 3,
    targetDemographic: { ageRange: [16, 50], regions: ["全国"] }, createdAt: "2026-05-28T08:00:00Z", deadline: "2026-06-28T23:59:59Z", views: 8900, clicks: 4500, conversionRate: 0.51,
    riskConfig: { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: false, antiCheating: true },
    executorQualification: { minCreditScore: 50, requireRealName: true },
    reviewChain: { aiReview: true, manualSamplingRate: 0.05, allowDispute: true },
    pricingHistory: [],
    budgetLimit: 5400,
    mediaConfig: { videoUrl: "https://example.com/video/ad-001.mp4", requiredDuration: 15, allowSkip: false },
  },
];

const submissions: TaskSubmission[] = [
  { id: "sub-001", taskId: "task-001", taskTitle: "品牌视频观看与反馈收集", taskType: "media", executorId: "exe-001", executorName: "陈晓", status: "ai_passed", aiScore: 92, aiFlags: [], evidence: {}, submittedAt: "2026-06-15T10:30:00Z", reviewedAt: "2026-06-15T10:30:05Z", rewardAmount: 2.5, reviewFlow: [{ id: "rf-001", submissionId: "sub-001", stage: "ai_review", action: "pass", operator: "AI审核引擎", timestamp: "2026-06-15T10:30:05Z" }], riskChecks: { ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: true, antiCheatingPassed: true }, deviceInfo: { deviceFingerprint: "fp-a1b2c3", ip: "192.168.1.100", browser: "Chrome 126", os: "Android 14", screenSize: "1080x2400" } },
  { id: "sub-002", taskId: "task-002", taskTitle: "消费者购物偏好调研问卷", taskType: "survey", executorId: "exe-002", executorName: "赵磊", status: "ai_flagged", aiScore: 45, aiFlags: ["答题速度异常", "逻辑校验不通过"], evidence: {}, submittedAt: "2026-06-15T11:00:00Z", reviewedAt: "2026-06-15T11:00:08Z", rewardAmount: 5.0, reviewFlow: [{ id: "rf-002", submissionId: "sub-002", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-15T11:00:08Z", notes: "答题速度异常，逻辑校验不通过" }], riskChecks: { ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: false, antiCheatingPassed: false }, deviceInfo: { deviceFingerprint: "fp-d4e5f6", ip: "10.0.0.55", browser: "Safari 17", os: "iOS 18", screenSize: "1170x2532" } },
  { id: "sub-003", taskId: "task-003", taskTitle: "新品沐浴露体验与反馈", taskType: "experience", executorId: "exe-003", executorName: "周芳", status: "manual_passed", aiScore: 78, aiFlags: ["图片质量偏低"], evidence: {}, submittedAt: "2026-06-14T16:00:00Z", reviewedAt: "2026-06-14T17:30:00Z", rewardAmount: 15.0, reviewFlow: [{ id: "rf-003a", submissionId: "sub-003", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-14T16:00:10Z", notes: "图片质量偏低" }, { id: "rf-003b", submissionId: "sub-003", stage: "manual_review", action: "pass", operator: "审核员A", timestamp: "2026-06-14T17:30:00Z" }], riskChecks: { ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: true, antiCheatingPassed: true }, deviceInfo: { deviceFingerprint: "fp-g7h8i9", ip: "172.16.0.88", browser: "Chrome 126", os: "Windows 11", screenSize: "1920x1080" } },
  { id: "sub-004", taskId: "task-001", taskTitle: "品牌视频观看与反馈收集", taskType: "media", executorId: "exe-002", executorName: "赵磊", status: "manual_rejected", aiScore: 35, aiFlags: ["IP地址重复", "设备指纹异常", "观看时长不足"], evidence: {}, submittedAt: "2026-06-15T09:00:00Z", reviewedAt: "2026-06-15T10:00:00Z", rewardAmount: 0, reviewFlow: [{ id: "rf-004a", submissionId: "sub-004", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-15T09:00:06Z", notes: "IP地址重复，设备指纹异常" }, { id: "rf-004b", submissionId: "sub-004", stage: "manual_review", action: "reject", operator: "审核员B", timestamp: "2026-06-15T10:00:00Z", notes: "确认作弊行为" }], riskChecks: { ipDuplicate: true, deviceFingerprintDuplicate: true, logicValidationPassed: true, antiCheatingPassed: false }, deviceInfo: { deviceFingerprint: "fp-xyz999", ip: "10.0.0.55", browser: "Chrome 126", os: "Android 13", screenSize: "1080x2340" } },
  { id: "sub-005", taskId: "task-005", taskTitle: "健康饮食习惯调研", taskType: "survey", executorId: "exe-001", executorName: "陈晓", status: "disputed", aiScore: 55, aiFlags: ["部分答案疑似随机填写"], evidence: {}, submittedAt: "2026-06-15T14:00:00Z", reviewedAt: "2026-06-15T15:00:00Z", rewardAmount: 3.5, reviewFlow: [{ id: "rf-005a", submissionId: "sub-005", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-15T14:00:07Z", notes: "部分答案疑似随机填写" }, { id: "rf-005b", submissionId: "sub-005", stage: "manual_review", action: "reject", operator: "审核员A", timestamp: "2026-06-15T15:00:00Z", notes: "答案质量不达标" }, { id: "rf-005c", submissionId: "sub-005", stage: "dispute_arbitration", action: "escalate", operator: "执行者陈晓", timestamp: "2026-06-15T16:00:00Z", notes: "申请争议仲裁" }], riskChecks: { ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: false, antiCheatingPassed: true }, deviceInfo: { deviceFingerprint: "fp-a1b2c3", ip: "192.168.1.100", browser: "Chrome 126", os: "Android 14", screenSize: "1080x2400" } },
  { id: "sub-006", taskId: "task-002", taskTitle: "消费者购物偏好调研问卷", taskType: "survey", executorId: "exe-001", executorName: "陈晓", status: "pending", aiScore: 0, aiFlags: [], evidence: {}, submittedAt: "2026-06-16T09:00:00Z", rewardAmount: 5.0, reviewFlow: [], riskChecks: { ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: true, antiCheatingPassed: true }, deviceInfo: { deviceFingerprint: "fp-a1b2c3", ip: "192.168.2.200", browser: "Chrome 126", os: "Android 14", screenSize: "1080x2400" } },
];

const riskAlerts: RiskAlert[] = [
  { id: "alert-001", type: "device_cluster", severity: "critical", description: "检测到同一IP段(10.0.0.x)下12台设备集中提交任务", affectedEntities: ["exe-002", "task-001"], detectedAt: "2026-06-15T10:30:00Z", resolved: false, batchNumber: "BATCH-20260617-001", processingStatus: "unprocessed" },
  { id: "alert-002", type: "abnormal_rate", severity: "high", description: "任务task-002的提交失败率突增至35%", affectedEntities: ["task-002"], detectedAt: "2026-06-15T11:00:00Z", resolved: false, batchNumber: "BATCH-20260617-002", processingStatus: "processing" },
  { id: "alert-003", type: "duplicate_submission", severity: "medium", description: "执行者exe-003在3个相似任务中提交了雷同内容", affectedEntities: ["exe-003", "task-003"], detectedAt: "2026-06-14T16:00:00Z", resolved: true, batchNumber: "BATCH-20260616-001", processingStatus: "processed" },
  { id: "alert-004", type: "suspicious_behavior", severity: "low", description: "执行者exe-002在凌晨2-5点高频提交任务", affectedEntities: ["exe-002"], detectedAt: "2026-06-13T02:00:00Z", resolved: false, batchNumber: "BATCH-20260613-001", processingStatus: "unprocessed" },
];

const transactions: Transaction[] = [
  { id: "txn-001", userId: "exe-001", userName: "陈晓", type: "reward", amount: 2.50, status: "completed", description: "品牌视频观看与反馈收集", createdAt: "2026-06-15T10:30:00Z" },
  { id: "txn-002", userId: "exe-003", userName: "周芳", type: "reward", amount: 15.00, status: "completed", description: "新品沐浴露体验与反馈", createdAt: "2026-06-14T17:30:00Z" },
  { id: "txn-003", userId: "exe-001", userName: "陈晓", type: "withdrawal", amount: 200.00, status: "completed", description: "提现到银行卡", createdAt: "2026-06-13T14:00:00Z" },
  { id: "txn-004", userId: "exe-001", userName: "陈晓", type: "tax", amount: 40.00, status: "completed", description: "劳务报酬个税代扣", createdAt: "2026-06-13T14:00:01Z" },
  { id: "txn-005", userId: "exe-002", userName: "赵磊", type: "reward", amount: 5.00, status: "failed", description: "消费者购物偏好调研问卷（审核驳回）", createdAt: "2026-06-15T10:00:00Z" },
  { id: "txn-006", userId: "ent-001", userName: "星辰数字科技有限公司", type: "refund", amount: 500.00, status: "completed", description: "任务预算退款", createdAt: "2026-06-12T09:00:00Z" },
];

export const db = {
  tasks,
  submissions,
  riskAlerts,
  transactions,
  enterprises,
  executors,

  findTask(id: string) { return tasks.find((t) => t.id === id); },
  findSubmission(id: string) { return submissions.find((s) => s.id === id); },
  findEnterprise(id: string) { return enterprises.find((e) => e.id === id); },
  findExecutor(id: string) { return executors.find((e) => e.id === id); },

  createTask(data: Partial<Task>): Task {
    const task: Task = {
      id: `task-${Date.now()}`,
      enterpriseId: data.enterpriseId || "ent-001",
      enterpriseName: data.enterpriseName || "星辰数字科技有限公司",
      title: data.title || "新任务",
      description: data.description || "",
      type: data.type || "survey",
      reward: data.reward || 5,
      originalReward: data.originalReward || data.reward || 5,
      difficulty: data.difficulty || 2,
      completionRate: 0,
      quota: data.quota || 1000,
      completed: 0,
      status: data.status || "active",
      estimatedTime: data.estimatedTime || 5,
      targetDemographic: data.targetDemographic || { ageRange: [18, 50], regions: ["全国"] },
      createdAt: new Date().toISOString(),
      deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      views: 0, clicks: 0, conversionRate: 0,
      riskConfig: data.riskConfig || { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true },
      executorQualification: data.executorQualification || { minCreditScore: 60, requireRealName: true },
      reviewChain: data.reviewChain || { aiReview: true, manualSamplingRate: 0.15, allowDispute: true },
      pricingHistory: [],
      budgetLimit: data.budgetLimit || (data.quota || 1000) * (data.reward || 5) * 1.2,
    };
    tasks.unshift(task);
    return task;
  },

  updateTask(id: string, patch: Partial<Task>) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    Object.assign(tasks[idx], patch);
    return tasks[idx];
  },

  updateSubmissionStatus(id: string, status: TaskSubmission["status"], notes?: string) {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return null;
    sub.status = status;
    sub.reviewedAt = new Date().toISOString();
    const stageMap: Record<string, ReviewFlowRecord["stage"]> = { ai_passed: "ai_review", ai_flagged: "ai_review", manual_passed: "manual_review", manual_rejected: "manual_review", disputed: "dispute_arbitration", arbitrated: "dispute_arbitration" };
    const actionMap: Record<string, ReviewFlowRecord["action"]> = { ai_passed: "pass", ai_flagged: "flag", manual_passed: "pass", manual_rejected: "reject", disputed: "escalate", arbitrated: "reject" };
    sub.reviewFlow.push({ id: `rf-${uuid()}`, submissionId: id, stage: stageMap[status] || "ai_review", action: actionMap[status] || "flag", operator: status.startsWith("ai_") ? "AI审核引擎" : status === "disputed" ? "执行者" : "审核员", timestamp: new Date().toISOString(), notes });
    return sub;
  },

  addPricingRecord(taskId: string, record: Omit<PricingAdjustmentRecord, "id">) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    const rec: PricingAdjustmentRecord = { ...record, id: `adj-${uuid()}` };
    task.pricingHistory.push(rec);
    task.reward = record.newReward;
    return rec;
  },

  refreshAlerts() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    riskAlerts.forEach((a, i) => {
      if (!a.resolved) {
        a.detectedAt = new Date(now.getTime() - Math.random() * 3600000).toISOString();
        a.batchNumber = `BATCH-${dateStr}-${String(i + 1).padStart(3, "0")}`;
        if (Math.random() > 0.6) a.processingStatus = "processing";
      }
    });
    return riskAlerts;
  },

  getPlatformStats() {
    const activeTasks = tasks.filter((t) => t.status === "active");
    const totalRewardDistributed = transactions.filter((t) => t.type === "reward" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
    const avgCompletionRate = activeTasks.length ? activeTasks.reduce((s, t) => s + t.completionRate, 0) / activeTasks.length : 0;
    return {
      totalTasks: tasks.length,
      activeTasks: activeTasks.length,
      totalExecutors: executors.length,
      totalRewardDistributed: Math.round(totalRewardDistributed * 100) / 100,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      pendingReviews: submissions.filter((s) => s.status === "pending" || s.status === "ai_flagged").length,
      unresolvedAlerts: riskAlerts.filter((a) => !a.resolved).length,
      todayEarnings: 156.50,
      dailyActiveUsers: 342,
    };
  },
};
