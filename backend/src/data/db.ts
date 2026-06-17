import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, "..", "..", "crowdsource.db");

export const db: DatabaseType = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------- schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS enterprises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  license_no TEXT,
  industry TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  balance REAL NOT NULL DEFAULT 0,
  total_budget REAL NOT NULL DEFAULT 0,
  task_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS executors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  real_name_verified INTEGER NOT NULL DEFAULT 0,
  credit_score INTEGER NOT NULL DEFAULT 60,
  total_earnings REAL NOT NULL DEFAULT 0,
  available_balance REAL NOT NULL DEFAULT 0,
  frozen_balance REAL NOT NULL DEFAULT 0,
  bank_account TEXT,
  bank_type TEXT,
  task_count INTEGER NOT NULL DEFAULT 0,
  pass_rate REAL NOT NULL DEFAULT 0,
  device_fingerprint TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  enterprise_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  reward REAL NOT NULL,
  original_reward REAL NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  completion_rate REAL NOT NULL DEFAULT 0,
  quota INTEGER NOT NULL DEFAULT 100,
  completed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  estimated_time INTEGER NOT NULL DEFAULT 5,
  target_demographic TEXT,
  created_at TEXT NOT NULL,
  deadline TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversion_rate REAL NOT NULL DEFAULT 0,
  risk_config TEXT,
  executor_qualification TEXT,
  review_chain TEXT,
  budget_limit REAL,
  media_config TEXT,
  survey_config TEXT,
  experience_config TEXT
);

CREATE TABLE IF NOT EXISTS pricing_records (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  reason TEXT,
  old_reward REAL,
  new_reward REAL,
  triggered_by TEXT,
  completion_rate_at_time REAL,
  budget_impact REAL,
  roi_impact REAL
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title TEXT,
  task_type TEXT,
  executor_id TEXT NOT NULL REFERENCES executors(id),
  executor_name TEXT,
  executor_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_score INTEGER NOT NULL DEFAULT 0,
  ai_flags TEXT,
  review_notes TEXT,
  evidence TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reward_amount REAL,
  risk_checks TEXT,
  device_info TEXT
);

CREATE TABLE IF NOT EXISTS review_flow (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  action TEXT NOT NULL,
  operator TEXT,
  timestamp TEXT NOT NULL,
  notes TEXT,
  previous_stage TEXT,
  next_stage TEXT
);

CREATE TABLE IF NOT EXISTS risk_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  affected_entities TEXT,
  detected_at TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  batch_number TEXT,
  processing_status TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TEXT NOT NULL
);
`);

// ---------- seeding ----------
const seedCount = db.prepare("SELECT COUNT(*) as c FROM enterprises").get() as { c: number };
if (seedCount.c === 0) {
  const NOW = new Date().toISOString();
  const ins = {
    enterprise: db.prepare(
      `INSERT INTO enterprises (id,name,email,license_no,industry,contact_person,contact_phone,status,balance,total_budget,task_count,created_at)
       VALUES (@id,@name,@email,@license_no,@industry,@contact_person,@contact_phone,@status,@balance,@total_budget,@task_count,@created_at)`
    ),
    executor: db.prepare(
      `INSERT INTO executors (id,name,phone,real_name_verified,credit_score,total_earnings,available_balance,frozen_balance,bank_account,bank_type,task_count,pass_rate,device_fingerprint,created_at)
       VALUES (@id,@name,@phone,@real_name_verified,@credit_score,@total_earnings,@available_balance,@frozen_balance,@bank_account,@bank_type,@task_count,@pass_rate,@device_fingerprint,@created_at)`
    ),
    task: db.prepare(
      `INSERT INTO tasks (id,enterprise_id,enterprise_name,title,description,type,reward,original_reward,difficulty,completion_rate,quota,completed,status,estimated_time,target_demographic,created_at,deadline,views,clicks,conversion_rate,risk_config,executor_qualification,review_chain,budget_limit,media_config,survey_config,experience_config)
       VALUES (@id,@enterprise_id,@enterprise_name,@title,@description,@type,@reward,@original_reward,@difficulty,@completion_rate,@quota,@completed,@status,@estimated_time,@target_demographic,@created_at,@deadline,@views,@clicks,@conversion_rate,@risk_config,@executor_qualification,@review_chain,@budget_limit,@media_config,@survey_config,@experience_config)`
    ),
    pricing: db.prepare(
      `INSERT INTO pricing_records (id,task_id,timestamp,reason,old_reward,new_reward,triggered_by,completion_rate_at_time,budget_impact,roi_impact)
       VALUES (@id,@task_id,@timestamp,@reason,@old_reward,@new_reward,@triggered_by,@completion_rate_at_time,@budget_impact,@roi_impact)`
    ),
    submission: db.prepare(
      `INSERT INTO submissions (id,task_id,task_title,task_type,executor_id,executor_name,status,ai_score,ai_flags,review_notes,evidence,submitted_at,reviewed_at,reward_amount,risk_checks,device_info)
       VALUES (@id,@task_id,@task_title,@task_type,@executor_id,@executor_name,@status,@ai_score,@ai_flags,@review_notes,@evidence,@submitted_at,@reviewed_at,@reward_amount,@risk_checks,@device_info)`
    ),
    review: db.prepare(
      `INSERT INTO review_flow (id,submission_id,stage,action,operator,timestamp,notes,previous_stage,next_stage)
       VALUES (@id,@submission_id,@stage,@action,@operator,@timestamp,@notes,@previous_stage,@next_stage)`
    ),
    alert: db.prepare(
      `INSERT INTO risk_alerts (id,type,severity,description,affected_entities,detected_at,resolved,batch_number,processing_status)
       VALUES (@id,@type,@severity,@description,@affected_entities,@detected_at,@resolved,@batch_number,@processing_status)`
    ),
    txn: db.prepare(
      `INSERT INTO transactions (id,user_id,user_name,type,amount,status,description,created_at)
       VALUES (@id,@user_id,@user_name,@type,@amount,@status,@description,@created_at)`
    ),
  };

  const enterprises: any[] = [
    { id: "ent-001", name: "星辰数字科技有限公司", email: "contact@stardigital.cn", license_no: "91110108MA01XXXX", industry: "互联网科技", contact_person: "张明", contact_phone: "138****5678", status: "verified", balance: 125000, total_budget: 200000, task_count: 5, created_at: "2026-01-15T08:00:00Z" },
    { id: "ent-002", name: "云端市场研究公司", email: "info@cloudresearch.cn", license_no: "91310115MA1HXXXX", industry: "市场调研", contact_person: "李娜", contact_phone: "139****1234", status: "verified", balance: 88000, total_budget: 150000, task_count: 3, created_at: "2026-02-01T10:00:00Z" },
    { id: "ent-003", name: "新锐品牌管理公司", email: "hello@xinbrand.cn", license_no: "91440300MA5FXXXX", industry: "品牌管理", contact_person: "王磊", contact_phone: "137****9876", status: "pending", balance: 45000, total_budget: 80000, task_count: 2, created_at: "2026-03-10T09:00:00Z" },
  ];
  const executors: any[] = [
    { id: "exe-001", name: "陈晓", phone: "136****2345", real_name_verified: 1, credit_score: 92, total_earnings: 4560.5, available_balance: 320, frozen_balance: 150, bank_account: "6222****8901", bank_type: "二类户", task_count: 128, pass_rate: 0.96, device_fingerprint: "fp-a1b2c3", created_at: "2026-01-20T10:00:00Z" },
    { id: "exe-002", name: "赵磊", phone: "138****6789", real_name_verified: 1, credit_score: 85, total_earnings: 2890, available_balance: 180, frozen_balance: 0, bank_account: "6228****3456", bank_type: "二类户", task_count: 87, pass_rate: 0.91, device_fingerprint: "fp-d4e5f6", created_at: "2026-02-05T14:00:00Z" },
    { id: "exe-003", name: "周芳", phone: "139****0123", real_name_verified: 1, credit_score: 78, total_earnings: 1250, available_balance: 95, frozen_balance: 50, bank_account: "6217****7890", bank_type: "二类户", task_count: 42, pass_rate: 0.88, device_fingerprint: "fp-g7h8i9", created_at: "2026-03-01T08:00:00Z" },
  ];
  const tasks: any[] = [
    { id: "task-001", enterprise_id: "ent-001", enterprise_name: "星辰数字科技有限公司", title: "品牌视频观看与反馈收集", description: "观看3分钟品牌宣传片并提交真实反馈", type: "media", reward: 2.5, original_reward: 2.0, difficulty: 1, completion_rate: 0.72, quota: 2000, completed: 1440, status: "active", estimated_time: 5, target_demographic: JSON.stringify({ ageRange: [18, 45], regions: ["全国"] }), created_at: "2026-06-01T08:00:00Z", deadline: "2026-07-01T23:59:59Z", views: 5680, clicks: 2890, conversion_rate: 0.51, risk_config: JSON.stringify({ ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: false, antiCheating: true }), executor_qualification: JSON.stringify({ minCreditScore: 60, requireRealName: true }), review_chain: JSON.stringify({ aiReview: true, manualSamplingRate: 0.05, allowDispute: true }), budget_limit: 4800, media_config: JSON.stringify({ videoUrl: "https://example.com/video/brand-001.mp4", requiredDuration: 180, allowSkip: false }), survey_config: null, experience_config: null },
    { id: "task-002", enterprise_id: "ent-002", enterprise_name: "云端市场研究公司", title: "消费者购物偏好调研问卷", description: "完成30道消费者行为调研题目，需通过逻辑校验", type: "survey", reward: 5.0, original_reward: 5.0, difficulty: 2, completion_rate: 0.45, quota: 1000, completed: 450, status: "active", estimated_time: 15, target_demographic: JSON.stringify({ ageRange: [25, 50], regions: ["北京", "上海", "广州", "深圳"] }), created_at: "2026-06-05T09:00:00Z", deadline: "2026-07-15T23:59:59Z", views: 3200, clicks: 1200, conversion_rate: 0.38, risk_config: JSON.stringify({ ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true }), executor_qualification: JSON.stringify({ minCreditScore: 70, requireRealName: true }), review_chain: JSON.stringify({ aiReview: true, manualSamplingRate: 0.15, allowDispute: true }), budget_limit: 6000, media_config: null, survey_config: JSON.stringify({ questions: [], logicRules: [] }), experience_config: null },
    { id: "task-003", enterprise_id: "ent-003", enterprise_name: "新锐品牌管理公司", title: "新品沐浴露体验与反馈", description: "签收新品并上传OCR识别凭证，提交使用反馈图文", type: "experience", reward: 15.0, original_reward: 12.0, difficulty: 3, completion_rate: 0.30, quota: 500, completed: 150, status: "active", estimated_time: 30, target_demographic: JSON.stringify({ ageRange: [20, 40], regions: ["全国"] }), created_at: "2026-06-08T10:00:00Z", deadline: "2026-08-01T23:59:59Z", views: 1800, clicks: 650, conversion_rate: 0.36, risk_config: JSON.stringify({ ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true }), executor_qualification: JSON.stringify({ minCreditScore: 75, requireRealName: true }), review_chain: JSON.stringify({ aiReview: true, manualSamplingRate: 0.25, allowDispute: true }), budget_limit: 7200, media_config: null, survey_config: null, experience_config: JSON.stringify({ productName: "清新沐浴露", requireOcr: true, requireFeedback: true, feedbackMinLength: 50, minPhotos: 2 }) },
    { id: "task-004", enterprise_id: "ent-001", enterprise_name: "星辰数字科技有限公司", title: "APP功能体验评测", description: "下载并体验APP核心功能流程，提交截图和反馈", type: "experience", reward: 8.0, original_reward: 8.0, difficulty: 2, completion_rate: 0.55, quota: 800, completed: 440, status: "active", estimated_time: 20, target_demographic: JSON.stringify({ ageRange: [18, 35], regions: ["全国"] }), created_at: "2026-06-10T08:00:00Z", deadline: "2026-07-20T23:59:59Z", views: 2100, clicks: 880, conversion_rate: 0.42, risk_config: JSON.stringify({ ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true }), executor_qualification: JSON.stringify({ minCreditScore: 65, requireRealName: true }), review_chain: JSON.stringify({ aiReview: true, manualSamplingRate: 0.20, allowDispute: true }), budget_limit: 7680, media_config: null, survey_config: null, experience_config: JSON.stringify({ productName: "星辰APP", requireOcr: false, requireFeedback: true, feedbackMinLength: 30, minPhotos: 3 }) },
    { id: "task-005", enterprise_id: "ent-002", enterprise_name: "云端市场研究公司", title: "健康饮食习惯调研", description: "完成25道健康饮食相关调研题目", type: "survey", reward: 3.5, original_reward: 3.0, difficulty: 1, completion_rate: 0.62, quota: 1500, completed: 930, status: "active", estimated_time: 10, target_demographic: JSON.stringify({ ageRange: [20, 60], regions: ["全国"] }), created_at: "2026-06-03T09:00:00Z", deadline: "2026-07-10T23:59:59Z", views: 4100, clicks: 1800, conversion_rate: 0.44, risk_config: JSON.stringify({ ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true }), executor_qualification: JSON.stringify({ minCreditScore: 60, requireRealName: true }), review_chain: JSON.stringify({ aiReview: true, manualSamplingRate: 0.10, allowDispute: true }), budget_limit: 5400, media_config: null, survey_config: JSON.stringify({ questions: [], logicRules: [] }), experience_config: null },
    { id: "task-006", enterprise_id: "ent-001", enterprise_name: "星辰数字科技有限公司", title: "短视频广告效果测评", description: "观看15秒广告视频并回答相关问题", type: "media", reward: 1.5, original_reward: 1.5, difficulty: 1, completion_rate: 0.85, quota: 3000, completed: 2550, status: "active", estimated_time: 3, target_demographic: JSON.stringify({ ageRange: [16, 50], regions: ["全国"] }), created_at: "2026-05-28T08:00:00Z", deadline: "2026-06-28T23:59:59Z", views: 8900, clicks: 4500, conversion_rate: 0.51, risk_config: JSON.stringify({ ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: false, antiCheating: true }), executor_qualification: JSON.stringify({ minCreditScore: 50, requireRealName: true }), review_chain: JSON.stringify({ aiReview: true, manualSamplingRate: 0.05, allowDispute: true }), budget_limit: 5400, media_config: JSON.stringify({ videoUrl: "https://example.com/video/ad-001.mp4", requiredDuration: 15, allowSkip: false }), survey_config: null, experience_config: null },
  ];
  const pricing: any[] = [
    { id: "adj-001", task_id: "task-001", timestamp: "2026-06-10T10:00:00Z", reason: "完成率低于70%阈值", old_reward: 2.0, new_reward: 2.5, triggered_by: "system", completion_rate_at_time: 0.68, budget_impact: 1000, roi_impact: -0.08 },
    { id: "adj-003", task_id: "task-003", timestamp: "2026-06-12T14:00:00Z", reason: "完成率低于50%阈值", old_reward: 12.0, new_reward: 15.0, triggered_by: "system", completion_rate_at_time: 0.28, budget_impact: 1500, roi_impact: -0.15 },
    { id: "adj-005", task_id: "task-005", timestamp: "2026-06-11T09:00:00Z", reason: "完成率低于60%阈值", old_reward: 3.0, new_reward: 3.5, triggered_by: "system", completion_rate_at_time: 0.58, budget_impact: 750, roi_impact: -0.05 },
  ];
  const submissions: any[] = [
    { id: "sub-001", task_id: "task-001", task_title: "品牌视频观看与反馈收集", task_type: "media", executor_id: "exe-001", executor_name: "陈晓", status: "ai_passed", ai_score: 92, ai_flags: JSON.stringify([]), review_notes: null, evidence: JSON.stringify({}), submitted_at: "2026-06-15T10:30:00Z", reviewed_at: "2026-06-15T10:30:05Z", reward_amount: 2.5, risk_checks: JSON.stringify({ ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: true, antiCheatingPassed: true }), device_info: JSON.stringify({ deviceFingerprint: "fp-a1b2c3", ip: "192.168.1.100", browser: "Chrome 126", os: "Android 14", screenSize: "1080x2400" }) },
    { id: "sub-002", task_id: "task-002", task_title: "消费者购物偏好调研问卷", task_type: "survey", executor_id: "exe-002", executor_name: "赵磊", status: "ai_flagged", ai_score: 45, ai_flags: JSON.stringify(["答题速度异常", "逻辑校验不通过"]), review_notes: null, evidence: JSON.stringify({}), submitted_at: "2026-06-15T11:00:00Z", reviewed_at: "2026-06-15T11:00:08Z", reward_amount: 5.0, risk_checks: JSON.stringify({ ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: false, antiCheatingPassed: false }), device_info: JSON.stringify({ deviceFingerprint: "fp-d4e5f6", ip: "10.0.0.55", browser: "Safari 17", os: "iOS 18", screenSize: "1170x2532" }) },
    { id: "sub-003", task_id: "task-003", task_title: "新品沐浴露体验与反馈", task_type: "experience", executor_id: "exe-003", executor_name: "周芳", status: "manual_passed", ai_score: 78, ai_flags: JSON.stringify(["图片质量偏低"]), review_notes: null, evidence: JSON.stringify({}), submitted_at: "2026-06-14T16:00:00Z", reviewed_at: "2026-06-14T17:30:00Z", reward_amount: 15.0, risk_checks: JSON.stringify({ ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: true, antiCheatingPassed: true }), device_info: JSON.stringify({ deviceFingerprint: "fp-g7h8i9", ip: "172.16.0.88", browser: "Chrome 126", os: "Windows 11", screenSize: "1920x1080" }) },
    { id: "sub-004", task_id: "task-001", task_title: "品牌视频观看与反馈收集", task_type: "media", executor_id: "exe-002", executor_name: "赵磊", status: "manual_rejected", ai_score: 35, ai_flags: JSON.stringify(["IP地址重复", "设备指纹异常", "观看时长不足"]), review_notes: "确认作弊行为", evidence: JSON.stringify({}), submitted_at: "2026-06-15T09:00:00Z", reviewed_at: "2026-06-15T10:00:00Z", reward_amount: 0, risk_checks: JSON.stringify({ ipDuplicate: true, deviceFingerprintDuplicate: true, logicValidationPassed: true, antiCheatingPassed: false }), device_info: JSON.stringify({ deviceFingerprint: "fp-xyz999", ip: "10.0.0.55", browser: "Chrome 126", os: "Android 13", screenSize: "1080x2340" }) },
    { id: "sub-005", task_id: "task-005", task_title: "健康饮食习惯调研", task_type: "survey", executor_id: "exe-001", executor_name: "陈晓", status: "disputed", ai_score: 55, ai_flags: JSON.stringify(["部分答案疑似随机填写"]), review_notes: "答案质量不达标", evidence: JSON.stringify({}), submitted_at: "2026-06-15T14:00:00Z", reviewed_at: "2026-06-15T15:00:00Z", reward_amount: 3.5, risk_checks: JSON.stringify({ ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: false, antiCheatingPassed: true }), device_info: JSON.stringify({ deviceFingerprint: "fp-a1b2c3", ip: "192.168.1.100", browser: "Chrome 126", os: "Android 14", screenSize: "1080x2400" }) },
    { id: "sub-006", task_id: "task-002", task_title: "消费者购物偏好调研问卷", task_type: "survey", executor_id: "exe-001", executor_name: "陈晓", status: "pending", ai_score: 0, ai_flags: JSON.stringify([]), review_notes: null, evidence: JSON.stringify({}), submitted_at: "2026-06-16T09:00:00Z", reviewed_at: null, reward_amount: 5.0, risk_checks: JSON.stringify({ ipDuplicate: false, deviceFingerprintDuplicate: false, logicValidationPassed: true, antiCheatingPassed: true }), device_info: JSON.stringify({ deviceFingerprint: "fp-a1b2c3", ip: "192.168.2.200", browser: "Chrome 126", os: "Android 14", screenSize: "1080x2400" }) },
  ];
  const reviewFlow: any[] = [
    { id: "rf-001", submission_id: "sub-001", stage: "ai_review", action: "pass", operator: "AI审核引擎", timestamp: "2026-06-15T10:30:05Z", notes: null, previous_stage: null, next_stage: null },
    { id: "rf-002", submission_id: "sub-002", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-15T11:00:08Z", notes: "答题速度异常，逻辑校验不通过", previous_stage: null, next_stage: "manual_review" },
    { id: "rf-003a", submission_id: "sub-003", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-14T16:00:10Z", notes: "图片质量偏低", previous_stage: null, next_stage: "manual_review" },
    { id: "rf-003b", submission_id: "sub-003", stage: "manual_review", action: "pass", operator: "审核员A", timestamp: "2026-06-14T17:30:00Z", notes: null, previous_stage: "ai_review", next_stage: null },
    { id: "rf-004a", submission_id: "sub-004", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-15T09:00:06Z", notes: "IP地址重复，设备指纹异常", previous_stage: null, next_stage: "manual_review" },
    { id: "rf-004b", submission_id: "sub-004", stage: "manual_review", action: "reject", operator: "审核员B", timestamp: "2026-06-15T10:00:00Z", notes: "确认作弊行为", previous_stage: "ai_review", next_stage: null },
    { id: "rf-005a", submission_id: "sub-005", stage: "ai_review", action: "flag", operator: "AI审核引擎", timestamp: "2026-06-15T14:00:07Z", notes: "部分答案疑似随机填写", previous_stage: null, next_stage: "manual_review" },
    { id: "rf-005b", submission_id: "sub-005", stage: "manual_review", action: "reject", operator: "审核员A", timestamp: "2026-06-15T15:00:00Z", notes: "答案质量不达标", previous_stage: "ai_review", next_stage: "dispute_arbitration" },
    { id: "rf-005c", submission_id: "sub-005", stage: "dispute_arbitration", action: "escalate", operator: "执行者陈晓", timestamp: "2026-06-15T16:00:00Z", notes: "申请争议仲裁", previous_stage: "manual_review", next_stage: null },
  ];
  const alerts: any[] = [
    { id: "alert-001", type: "device_cluster", severity: "critical", description: "检测到同一IP段(10.0.0.x)下12台设备集中提交任务", affected_entities: JSON.stringify(["exe-002", "task-001"]), detected_at: "2026-06-15T10:30:00Z", resolved: 0, batch_number: "BATCH-20260617-001", processing_status: "unprocessed" },
    { id: "alert-002", type: "abnormal_rate", severity: "high", description: "任务task-002的提交失败率突增至35%", affected_entities: JSON.stringify(["task-002"]), detected_at: "2026-06-15T11:00:00Z", resolved: 0, batch_number: "BATCH-20260617-002", processing_status: "processing" },
    { id: "alert-003", type: "duplicate_submission", severity: "medium", description: "执行者exe-003在3个相似任务中提交了雷同内容", affected_entities: JSON.stringify(["exe-003", "task-003"]), detected_at: "2026-06-14T16:00:00Z", resolved: 1, batch_number: "BATCH-20260616-001", processing_status: "processed" },
    { id: "alert-004", type: "suspicious_behavior", severity: "low", description: "执行者exe-002在凌晨2-5点高频提交任务", affected_entities: JSON.stringify(["exe-002"]), detected_at: "2026-06-13T02:00:00Z", resolved: 0, batch_number: "BATCH-20260613-001", processing_status: "unprocessed" },
  ];
  const transactions: any[] = [
    { id: "txn-001", user_id: "exe-001", user_name: "陈晓", type: "reward", amount: 2.50, status: "completed", description: "品牌视频观看与反馈收集", created_at: "2026-06-15T10:30:00Z" },
    { id: "txn-002", user_id: "exe-003", user_name: "周芳", type: "reward", amount: 15.00, status: "completed", description: "新品沐浴露体验与反馈", created_at: "2026-06-14T17:30:00Z" },
    { id: "txn-003", user_id: "exe-001", user_name: "陈晓", type: "withdrawal", amount: 200.00, status: "completed", description: "提现到银行卡", created_at: "2026-06-13T14:00:00Z" },
    { id: "txn-004", user_id: "exe-001", user_name: "陈晓", type: "tax", amount: 40.00, status: "completed", description: "劳务报酬个税代扣", created_at: "2026-06-13T14:00:01Z" },
    { id: "txn-005", user_id: "exe-002", user_name: "赵磊", type: "reward", amount: 5.00, status: "failed", description: "消费者购物偏好调研问卷（审核驳回）", created_at: "2026-06-15T10:00:00Z" },
    { id: "txn-006", user_id: "ent-001", user_name: "星辰数字科技有限公司", type: "refund", amount: 500.00, status: "completed", description: "任务预算退款", created_at: "2026-06-12T09:00:00Z" },
  ];

  const tx = db.transaction(() => {
    enterprises.forEach((e) => ins.enterprise.run(e));
    executors.forEach((e) => ins.executor.run(e));
    tasks.forEach((t) => ins.task.run(t));
    pricing.forEach((p) => ins.pricing.run(p));
    submissions.forEach((s) => ins.submission.run(s));
    reviewFlow.forEach((r) => ins.review.run(r));
    alerts.forEach((a) => ins.alert.run(a));
    transactions.forEach((t) => ins.txn.run(t));
  });
  tx();
  console.log(`[DB] Seeded: ${enterprises.length} 企业 / ${executors.length} 执行者 / ${tasks.length} 任务 / ${submissions.length} 提交 / ${alerts.length} 告警 / ${transactions.length} 交易`);
}

console.log(`[DB] SQLite ready at ${DB_PATH}`);
