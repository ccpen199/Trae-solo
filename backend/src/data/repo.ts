import { db } from "./db.js";
import { v4 as uuid } from "uuid";

const j = (s: string | null | undefined) => (s ? JSON.parse(s) : undefined);
const b = (n: number | null) => (n === 1 ? true : n === 0 ? false : !!n);

function taskFromRow(r: any) {
  return {
    id: r.id,
    enterpriseId: r.enterprise_id,
    enterpriseName: r.enterprise_name,
    title: r.title,
    description: r.description,
    type: r.type,
    reward: r.reward,
    originalReward: r.original_reward,
    difficulty: r.difficulty,
    completionRate: r.completion_rate,
    quota: r.quota,
    completed: r.completed,
    status: r.status,
    estimatedTime: r.estimated_time,
    targetDemographic: j(r.target_demographic),
    createdAt: r.created_at,
    deadline: r.deadline,
    views: r.views,
    clicks: r.clicks,
    conversionRate: r.conversion_rate,
    riskConfig: j(r.risk_config),
    executorQualification: j(r.executor_qualification),
    reviewChain: j(r.review_chain),
    budgetLimit: r.budget_limit,
    mediaConfig: j(r.media_config),
    surveyConfig: j(r.survey_config),
    experienceConfig: j(r.experience_config),
    pricingHistory: db
      .prepare("SELECT id, timestamp, reason, old_reward as oldReward, new_reward as newReward, triggered_by as triggeredBy, completion_rate_at_time as completionRateAtTime, budget_impact as budgetImpact, roi_impact as roiImpact FROM pricing_records WHERE task_id = ? ORDER BY timestamp ASC")
      .all(r.id),
  };
}

function submissionFromRow(r: any) {
  return {
    id: r.id,
    taskId: r.task_id,
    taskTitle: r.task_title,
    taskType: r.task_type,
    executorId: r.executor_id,
    executorName: r.executor_name,
    executorAvatar: r.executor_avatar,
    status: r.status,
    aiScore: r.ai_score,
    aiFlags: j(r.ai_flags) || [],
    reviewNotes: r.review_notes,
    evidence: j(r.evidence) || {},
    submittedAt: r.submitted_at,
    reviewedAt: r.reviewed_at,
    rewardAmount: r.reward_amount,
    riskChecks: j(r.risk_checks),
    deviceInfo: j(r.device_info),
    reviewFlow: db
      .prepare("SELECT id, submission_id as submissionId, stage, action, operator, timestamp, notes, previous_stage as previousStage, next_stage as nextStage FROM review_flow WHERE submission_id = ? ORDER BY timestamp ASC")
      .all(r.id),
  };
}

function alertFromRow(r: any) {
  return {
    id: r.id,
    type: r.type,
    severity: r.severity,
    description: r.description,
    affectedEntities: j(r.affected_entities) || [],
    detectedAt: r.detected_at,
    resolved: b(r.resolved),
    batchNumber: r.batch_number,
    processingStatus: r.processing_status,
  };
}

export const repo = {
  listTasks: (filters?: { type?: string; status?: string; sort?: string }) => {
    let sql = "SELECT * FROM tasks WHERE 1=1";
    const params: any[] = [];
    if (filters?.type && filters.type !== "all") {
      sql += " AND type = ?";
      params.push(filters.type);
    }
    if (filters?.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    switch (filters?.sort) {
      case "reward":
        sql += " ORDER BY reward DESC";
        break;
      case "difficulty":
        sql += " ORDER BY difficulty ASC";
        break;
      case "completion":
        sql += " ORDER BY completion_rate DESC";
        break;
      default:
        sql += " ORDER BY created_at DESC";
    }
    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(taskFromRow);
  },

  getTask: (id: string) => {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as any;
    return row ? taskFromRow(row) : null;
  },

  createTask: (data: any) => {
    const id = `task-${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO tasks (id,enterprise_id,enterprise_name,title,description,type,reward,original_reward,difficulty,completion_rate,quota,completed,status,estimated_time,target_demographic,created_at,deadline,views,clicks,conversion_rate,risk_config,executor_qualification,review_chain,budget_limit,media_config,survey_config,experience_config)
       VALUES (@id,@enterprise_id,@enterprise_name,@title,@description,@type,@reward,@original_reward,@difficulty,0,@quota,0,@status,@estimated_time,@target_demographic,@created_at,@deadline,0,0,0,@risk_config,@executor_qualification,@review_chain,@budget_limit,@media_config,@survey_config,@experience_config)`
    ).run({
      id,
      enterprise_id: data.enterpriseId || "ent-001",
      enterprise_name: data.enterpriseName || "星辰数字科技有限公司",
      title: data.title || "新任务",
      description: data.description || "",
      type: data.type || "survey",
      reward: data.reward ?? 5,
      original_reward: data.originalReward ?? data.reward ?? 5,
      difficulty: data.difficulty ?? 2,
      quota: data.quota ?? 1000,
      status: data.status || "active",
      estimated_time: data.estimatedTime ?? 5,
      target_demographic: JSON.stringify(data.targetDemographic || { ageRange: [18, 50], regions: ["全国"] }),
      created_at: now,
      deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      risk_config: JSON.stringify(data.riskConfig || { ipDeduplication: true, deviceFingerprintCheck: true, logicValidation: true, antiCheating: true }),
      executor_qualification: JSON.stringify(data.executorQualification || { minCreditScore: 60, requireRealName: true }),
      review_chain: JSON.stringify(data.reviewChain || { aiReview: true, manualSamplingRate: 0.15, allowDispute: true }),
      budget_limit: data.budgetLimit ?? (data.quota ?? 1000) * (data.reward ?? 5) * 1.2,
      media_config: data.mediaConfig ? JSON.stringify(data.mediaConfig) : null,
      survey_config: data.surveyConfig ? JSON.stringify(data.surveyConfig) : null,
      experience_config: data.experienceConfig ? JSON.stringify(data.experienceConfig) : null,
    });
    return repo.getTask(id);
  },

  updateTask: (id: string, patch: any) => {
    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as any;
    if (!existing) return null;
    const merged = { ...existing, ...patch };
    db.prepare(
      `UPDATE tasks SET title=@title,description=@description,type=@type,reward=@reward,original_reward=@original_reward,difficulty=@difficulty,completion_rate=@completion_rate,quota=@quota,completed=@completed,status=@status,estimated_time=@estimated_time,deadline=@deadline,risk_config=@risk_config,executor_qualification=@executor_qualification,review_chain=@review_chain,budget_limit=@budget_limit WHERE id=@id`
    ).run({
      id,
      title: merged.title,
      description: merged.description,
      type: merged.type,
      reward: merged.reward,
      original_reward: merged.original_reward,
      difficulty: merged.difficulty,
      completion_rate: merged.completion_rate,
      quota: merged.quota,
      completed: merged.completed,
      status: merged.status,
      estimated_time: merged.estimated_time,
      deadline: merged.deadline,
      risk_config: typeof merged.risk_config === "string" ? merged.risk_config : JSON.stringify(merged.riskConfig || merged.risk_config),
      executor_qualification: typeof merged.executor_qualification === "string" ? merged.executor_qualification : JSON.stringify(merged.executorQualification || merged.executor_qualification),
      review_chain: typeof merged.review_chain === "string" ? merged.review_chain : JSON.stringify(merged.reviewChain || merged.review_chain),
      budget_limit: merged.budget_limit ?? merged.budgetLimit,
    });
    return repo.getTask(id);
  },

  addPricingRecord: (taskId: string, record: any) => {
    const id = `adj-${Date.now()}`;
    db.prepare(
      `INSERT INTO pricing_records (id,task_id,timestamp,reason,old_reward,new_reward,triggered_by,completion_rate_at_time,budget_impact,roi_impact)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      taskId,
      record.timestamp || new Date().toISOString(),
      record.reason || "手动调整",
      record.oldReward,
      record.newReward,
      record.triggeredBy || "manual",
      record.completionRateAtTime ?? null,
      record.budgetImpact ?? 0,
      record.roiImpact ?? 0
    );
    db.prepare("UPDATE tasks SET reward = ? WHERE id = ?").run(record.newReward, taskId);
    return { id, ...record };
  },

  listSubmissions: (filters?: { status?: string; stage?: string }) => {
    let sql = "SELECT * FROM submissions WHERE 1=1";
    const params: any[] = [];
    if (filters?.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    if (filters?.stage === "ai_review") {
      sql += " AND status IN ('pending','ai_flagged')";
    } else if (filters?.stage === "manual_review") {
      sql += " AND status IN ('ai_flagged','manual_passed','manual_rejected')";
    } else if (filters?.stage === "dispute") {
      sql += " AND status IN ('disputed','arbitrated')";
    }
    sql += " ORDER BY submitted_at DESC";
    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(submissionFromRow);
  },

  getSubmission: (id: string) => {
    const row = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any;
    return row ? submissionFromRow(row) : null;
  },

  updateSubmissionStatus: (id: string, status: string, notes?: string) => {
    const sub = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any;
    if (!sub) return null;
    const stageMap: Record<string, string> = { ai_passed: "ai_review", ai_flagged: "ai_review", manual_passed: "manual_review", manual_rejected: "manual_review", disputed: "dispute_arbitration", arbitrated: "dispute_arbitration" };
    const actionMap: Record<string, string> = { ai_passed: "pass", ai_flagged: "flag", manual_passed: "pass", manual_rejected: "reject", disputed: "escalate", arbitrated: "reject" };
    const stage = stageMap[status] || "ai_review";
    const action = actionMap[status] || "flag";
    const operator = status.startsWith("ai_") ? "AI审核引擎" : status === "disputed" ? "执行者" : "审核员";
    const now = new Date().toISOString();
    db.prepare("INSERT INTO review_flow (id,submission_id,stage,action,operator,timestamp,notes) VALUES (?,?,?,?,?,?,?)").run(`rf-${Date.now()}`, id, stage, action, operator, now, notes || null);
    db.prepare("UPDATE submissions SET status = ?, reviewed_at = ? WHERE id = ?").run(status, now, id);
    return repo.getSubmission(id);
  },

  listAlerts: () => {
    const rows = db.prepare("SELECT * FROM risk_alerts ORDER BY detected_at DESC").all() as any[];
    return rows.map(alertFromRow);
  },

  refreshAlerts: () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const statuses = ["unprocessed", "processing", "processed"];
    const rows = db.prepare("SELECT * FROM risk_alerts").all() as any[];
    const stmt = db.prepare("UPDATE risk_alerts SET detected_at = ?, batch_number = ?, processing_status = ?, resolved = ? WHERE id = ?");
    rows.forEach((r, i) => {
      const detectedAt = new Date(now.getTime() - Math.random() * 3600000).toISOString();
      const shouldChange = Math.random() > 0.3;
      const resolved = shouldChange ? !b(r.resolved) : b(r.resolved);
      stmt.run(detectedAt, `BATCH-${dateStr}-${String(i + 1).padStart(3, "0")}`, resolved ? "processed" : statuses[Math.floor(Math.random() * statuses.length)], resolved ? 1 : 0, r.id);
    });
    return repo.listAlerts();
  },

  resolveAlert: (id: string) => {
    const now = new Date().toISOString();
    const r = db.prepare("SELECT * FROM risk_alerts WHERE id = ?").get(id) as any;
    if (!r) return null;
    db.prepare("UPDATE risk_alerts SET resolved = 1, processing_status = 'processed', detected_at = ? WHERE id = ?").run(now, id);
    return alertFromRow({ ...r, resolved: 1, processing_status: "processed", detected_at: now });
  },

  listTransactions: (filters?: { userId?: string; type?: string }) => {
    let sql = "SELECT * FROM transactions WHERE 1=1";
    const params: any[] = [];
    if (filters?.userId) {
      sql += " AND user_id = ?";
      params.push(filters.userId);
    }
    if (filters?.type) {
      sql += " AND type = ?";
      params.push(filters.type);
    }
    sql += " ORDER BY created_at DESC";
    return db.prepare(sql).all(...params);
  },

  createWithdrawal: (userId: string, amount: number) => {
    const exe = db.prepare("SELECT * FROM executors WHERE id = ?").get(userId) as any;
    if (!exe) return { error: "Executor not found" };
    if (amount > exe.available_balance) return { error: "余额不足" };
    if (amount > 5000) return { error: "单日提现限额5000元" };
    db.prepare("UPDATE executors SET available_balance = available_balance - ?, frozen_balance = frozen_balance + ? WHERE id = ?").run(amount, amount, userId);
    const id = `txn-${Date.now()}`;
    db.prepare("INSERT INTO transactions (id,user_id,user_name,type,amount,status,description,created_at) VALUES (?,?,?,?,?,?,?,?)").run(id, userId, exe.name, "withdrawal", amount, "pending", `提现到银行卡(${exe.bank_account})`, new Date().toISOString());
    return db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
  },

  listEnterprises: () => db.prepare("SELECT id,name,email,license_no as licenseNo,industry,contact_person as contactPerson,contact_phone as contactPhone,status,balance,total_budget as totalBudget,task_count as taskCount,created_at as createdAt FROM enterprises ORDER BY created_at DESC").all(),
  listExecutors: () => db.prepare("SELECT id,name,phone,real_name_verified as realNameVerified,credit_score as creditScore,total_earnings as totalEarnings,available_balance as availableBalance,frozen_balance as frozenBalance,bank_account as bankAccount,bank_type as bankType,task_count as taskCount,pass_rate as passRate,device_fingerprint as deviceFingerprint,created_at as createdAt FROM executors ORDER BY created_at DESC").all(),

  platformStats: () => {
    const tasks = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active, AVG(completion_rate) as avgRate FROM tasks").get() as any;
    const ex = db.prepare("SELECT COUNT(*) as total FROM executors").get() as any;
    const reviews = db.prepare("SELECT COUNT(*) as total FROM submissions WHERE status IN ('pending','ai_flagged')").get() as any;
    const alerts = db.prepare("SELECT COUNT(*) as total FROM risk_alerts WHERE resolved = 0").get() as any;
    const reward = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'reward' AND status = 'completed'").get() as any;
    return {
      totalTasks: tasks.total,
      activeTasks: tasks.active,
      totalExecutors: ex.total,
      totalRewardDistributed: Math.round(reward.total * 100) / 100,
      avgCompletionRate: tasks.avgRate ? Math.round(tasks.avgRate * 100) / 100 : 0,
      pendingReviews: reviews.total,
      unresolvedAlerts: alerts.total,
      todayEarnings: 156.5,
      dailyActiveUsers: 342,
    };
  },
};
