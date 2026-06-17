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
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
  resolveRiskAlert: (alertId: string) => void;
  createTask: (task: Partial<Task>) => void;
  acceptTask: (taskId: string, executorId: string) => void;
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

  updateSubmissionStatus: (submissionId, status) =>
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId ? { ...s, status, reviewedAt: new Date().toISOString() } : s
      ),
    })),

  resolveRiskAlert: (alertId) =>
    set((state) => ({
      riskAlerts: state.riskAlerts.map((a) =>
        a.id === alertId
          ? { ...a, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: "admin" }
          : a
      ),
    })),

  createTask: (taskData) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      enterpriseId: "ent-001",
      enterpriseName: "星辰数字科技有限公司",
      title: taskData.title || "新任务",
      description: taskData.description || "",
      type: taskData.type || "survey",
      reward: taskData.reward || 5,
      originalReward: taskData.originalReward || taskData.reward || 5,
      difficulty: taskData.difficulty || 2,
      completionRate: 0,
      quota: taskData.quota || 1000,
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
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
  },

  acceptTask: (_taskId, _executorId) => {
    // 模拟接单
    set((state) => state);
  },
}));
