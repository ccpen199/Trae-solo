import { create } from "zustand";
import type {
  Task,
  TaskSubmission,
  Enterprise,
  Executor,
  Transaction,
  RiskAlert,
  TaskTemplate,
  PlatformStats,
  TaskType,
  SubmissionStatus,
  ReviewFlowRecord,
} from "@/types";
import {
  mockTasks,
  mockSubmissions,
  mockEnterprises,
  mockExecutors,
  mockTransactions,
  mockRiskAlerts,
  mockTaskTemplates,
  mockPlatformStats,
} from "@/data/mockData";
import { api } from "@/lib/api";

interface AppState {
  tasks: Task[];
  submissions: TaskSubmission[];
  enterprises: Enterprise[];
  executors: Executor[];
  transactions: Transaction[];
  riskAlerts: RiskAlert[];
  taskTemplates: TaskTemplate[];
  platformStats: PlatformStats;
  currentExecutor: Executor;
  currentEnterprise: Enterprise;

  taskFilter: {
    type?: TaskType;
    search?: string;
    sortBy: "reward" | "difficulty" | "newest" | "completion";
  };

  setTaskFilter: (filter: Partial<AppState["taskFilter"]>) => void;
  getFilteredTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  getSubmissionById: (id: string) => TaskSubmission | undefined;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus, notes?: string) => void;
  resolveRiskAlert: (alertId: string) => void;
  createTask: (task: Partial<Task>) => void;
  acceptTask: (taskId: string, executorId: string) => void;
  updateTaskPricing: (taskId: string, record: Partial<import("@/types").PricingAdjustmentRecord>) => void;
  addReviewFlowRecord: (submissionId: string, record: Omit<ReviewFlowRecord, "id" | "submissionId" | "timestamp">) => void;
  refreshRiskAlerts: () => void;
  hydrateFromApi: () => Promise<void>;
  apiConnected: boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: mockTasks,
  submissions: mockSubmissions,
  enterprises: mockEnterprises,
  executors: mockExecutors,
  transactions: mockTransactions,
  riskAlerts: mockRiskAlerts,
  taskTemplates: mockTaskTemplates,
  platformStats: mockPlatformStats,
  currentExecutor: mockExecutors[0],
  currentEnterprise: mockEnterprises[0],

  taskFilter: {
    sortBy: "newest",
  },

  setTaskFilter: (filter) =>
    set((state) => ({
      taskFilter: { ...state.taskFilter, ...filter },
    })),

  getFilteredTasks: () => {
    const { tasks, taskFilter } = get();
    let filtered = [...tasks];

    if (taskFilter.type) {
      filtered = filtered.filter((t) => t.type === taskFilter.type);
    }

    if (taskFilter.search) {
      const search = taskFilter.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.enterpriseName.toLowerCase().includes(search)
      );
    }

    switch (taskFilter.sortBy) {
      case "reward":
        filtered.sort((a, b) => b.reward - a.reward);
        break;
      case "difficulty":
        filtered.sort((a, b) => a.difficulty - b.difficulty);
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "completion":
        filtered.sort((a, b) => b.completionRate - a.completionRate);
        break;
    }

    return filtered;
  },

  getTaskById: (id) => get().tasks.find((t) => t.id === id),
  getSubmissionById: (id) => get().submissions.find((s) => s.id === id),

  updateSubmissionStatus: (submissionId, status, notes) =>
    set((state) => {
      const submission = state.submissions.find((s) => s.id === submissionId);
      if (!submission) return state;

      const getStageAndAction = (
        currentStatus: SubmissionStatus,
        newStatus: SubmissionStatus
      ): {
        stage: ReviewFlowRecord["stage"];
        action: ReviewFlowRecord["action"];
        operator: string;
        defaultNotes: string;
      } => {
        if (newStatus === "ai_passed") {
          return { stage: "ai_review", action: "pass", operator: "system", defaultNotes: "AI自动审核通过" };
        }
        if (newStatus === "ai_flagged") {
          return { stage: "ai_review", action: "flag", operator: "system", defaultNotes: "AI标记存疑" };
        }
        if (newStatus === "manual_passed") {
          return { stage: "manual_review", action: "pass", operator: "admin", defaultNotes: "人工审核通过" };
        }
        if (newStatus === "manual_rejected") {
          return { stage: "manual_review", action: "reject", operator: "admin", defaultNotes: "人工审核驳回" };
        }
        if (newStatus === "arbitrated") {
          return { stage: "dispute_arbitration", action: currentStatus === "disputed" ? "pass" : "reject", operator: "admin", defaultNotes: "争议仲裁完成" };
        }
        return { stage: "ai_review", action: "flag", operator: "system", defaultNotes: "状态更新" };
      };

      const { stage, action, operator, defaultNotes } = getStageAndAction(submission.status, status);

      const getPreviousStage = (s: SubmissionStatus): string => {
        if (s === "pending") return "pending";
        if (s === "ai_passed" || s === "ai_flagged") return "ai_review";
        if (s === "manual_passed" || s === "manual_rejected") return "manual_review";
        if (s === "disputed") return "manual_review";
        return "unknown";
      };

      const getNextStage = (s: SubmissionStatus): string => {
        if (s === "ai_passed") return "completed";
        if (s === "ai_flagged") return "manual_review";
        if (s === "manual_passed") return "completed";
        if (s === "manual_rejected") return "rejected";
        if (s === "disputed") return "dispute_arbitration";
        if (s === "arbitrated") return "completed";
        return "unknown";
      };

      const newFlowRecord: ReviewFlowRecord = {
        id: `rf-${Date.now()}`,
        submissionId,
        stage,
        action,
        operator,
        timestamp: new Date().toISOString(),
        notes: notes || defaultNotes,
        previousStage: getPreviousStage(submission.status),
        nextStage: getNextStage(status),
      };

      return {
        submissions: state.submissions.map((s) =>
          s.id === submissionId
            ? { ...s, status, reviewedAt: new Date().toISOString(), reviewFlow: [...s.reviewFlow, newFlowRecord] }
            : s
        ),
      };
    }),

  addReviewFlowRecord: (submissionId, record) =>
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              reviewFlow: [
                ...s.reviewFlow,
                {
                  id: `rf-${Date.now()}`,
                  submissionId,
                  timestamp: new Date().toISOString(),
                  ...record,
                },
              ],
            }
          : s
      ),
    })),

  refreshRiskAlerts: () =>
    set((state) => {
      const now = new Date();
      const statuses: Array<"unprocessed" | "processing" | "processed"> = ["unprocessed", "processing", "processed"];
      
      const generateBatchNumber = (index: number): string => {
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
        return `BATCH-${dateStr}-${String(index + 1).padStart(3, "0")}`;
      };

      return {
        riskAlerts: state.riskAlerts.map((alert, index) => {
          const shouldChangeStatus = Math.random() > 0.3;
          const newResolved = shouldChangeStatus ? !alert.resolved : alert.resolved;
          return {
            ...alert,
            detectedAt: now.toISOString(),
            resolved: newResolved,
            resolvedAt: newResolved ? now.toISOString() : undefined,
            resolvedBy: newResolved ? "admin" : undefined,
            batchNumber: generateBatchNumber(index),
            processingStatus: statuses[Math.floor(Math.random() * statuses.length)],
          } as RiskAlert & { batchNumber: string; processingStatus: string };
        }),
      };
    }),

  resolveRiskAlert: (alertId) =>
    set((state) => ({
      riskAlerts: state.riskAlerts.map((a) =>
        a.id === alertId
          ? { ...a, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: "admin" }
          : a
      ),
    })),

  createTask: (taskData) => {
    const type = taskData.type || "survey";
    const difficulty = taskData.difficulty || 2;
    const originalReward = taskData.originalReward || taskData.reward || 5;
    const quota = taskData.quota || 1000;
    const manualSamplingRate = type === "media" ? 0.05 : type === "survey" ? 0.15 : 0.25;
    const minCreditScore = difficulty <= 2 ? 60 : difficulty === 3 ? 75 : 85;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      enterpriseId: "ent-001",
      enterpriseName: "星辰数字科技有限公司",
      title: taskData.title || "新任务",
      description: taskData.description || "",
      type,
      reward: taskData.reward || 5,
      originalReward,
      difficulty,
      completionRate: 0,
      quota,
      completed: 0,
      status: "active",
      estimatedTime: taskData.estimatedTime || 5,
      targetDemographic: taskData.targetDemographic || {
        ageRange: [18, 50],
        regions: ["全国"],
      },
      createdAt: new Date().toISOString(),
      deadline: taskData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      views: 0,
      clicks: 0,
      conversionRate: 0,
      riskConfig: {
        ipDeduplication: true,
        deviceFingerprintCheck: true,
        logicValidation: type !== "media",
        antiCheating: true,
      },
      executorQualification: {
        minCreditScore,
        requireRealName: true,
      },
      reviewChain: {
        aiReview: true,
        manualSamplingRate,
        allowDispute: true,
      },
      pricingHistory: [],
      budgetLimit: quota * originalReward * 1.2,
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
  },

  acceptTask: (_taskId, _executorId) => {
    set((state) => state);
  },

  apiConnected: false,

  hydrateFromApi: async () => {
    try {
      const results = await Promise.allSettled([
        api.tasks.list(),
        api.submissions.list(),
        api.alerts.list(),
        api.transactions.list(),
        api.users.enterprises(),
        api.users.executors(),
        api.tasks.stats(),
      ]);
      const [tasksRes, subsRes, alertsRes, txnsRes, entRes, exeRes, stats] = results;
      const state = get();
      let changed = false;
      const patch: Partial<AppState> = {};
      if (tasksRes.status === "fulfilled" && tasksRes.value.data?.length) {
        patch.tasks = tasksRes.value.data;
        changed = true;
      }
      if (subsRes.status === "fulfilled" && subsRes.value.data?.length) {
        patch.submissions = subsRes.value.data;
        changed = true;
      }
      if (alertsRes.status === "fulfilled" && alertsRes.value.data?.length) {
        patch.riskAlerts = alertsRes.value.data;
        changed = true;
      }
      if (txnsRes.status === "fulfilled" && txnsRes.value.data?.length) {
        patch.transactions = txnsRes.value.data;
        changed = true;
      }
      if (entRes.status === "fulfilled" && entRes.value.data?.length) {
        patch.enterprises = entRes.value.data;
        changed = true;
      }
      if (exeRes.status === "fulfilled" && exeRes.value.data?.length) {
        patch.executors = exeRes.value.data;
        patch.currentExecutor = exeRes.value.data[0] || state.currentExecutor;
        changed = true;
      }
      if (stats.status === "fulfilled") {
        patch.platformStats = stats.value;
        changed = true;
      }
      if (changed) {
        patch.apiConnected = true;
        set(patch);
      } else {
        set({ apiConnected: false });
      }
    } catch (err) {
      console.warn("[Store] hydrate failed, using mock fallback", err);
      set({ apiConnected: false });
    }
  },

  updateTaskPricing: (taskId, record) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newRecord: import("@/types").PricingAdjustmentRecord = {
      id: `pricing-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason: record.reason || "手动调整",
      oldReward: record.oldReward ?? task.reward,
      newReward: record.newReward ?? task.reward,
      triggeredBy: record.triggeredBy || "manual",
      completionRateAtTime: record.completionRateAtTime ?? task.completionRate,
      budgetImpact: record.budgetImpact ?? 0,
      roiImpact: record.roiImpact ?? 0,
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              reward: newRecord.newReward,
              pricingHistory: [...t.pricingHistory, newRecord],
            }
          : t
      ),
    }));
  },
}));
