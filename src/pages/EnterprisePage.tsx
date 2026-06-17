import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import { mockROIData, mockCompletionRateData, mockUserAgeDistribution } from "@/data/mockData";
import {
  Plus,
  Video,
  FileText,
  Heart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Eye,
  MousePointer,
  BarChart3,
  PieChart,
  Zap,
  Settings2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  SlidersHorizontal,
  Upload,
  Store,
  Shield,
  UserCheck,
  Wallet,
  MapPin,
  Sparkles,
  ArrowRight,
  Scale,
  Calculator,
  History,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { TaskTemplate, Task, TaskType } from "@/types";

const templateIconMap: Record<string, React.ElementType> = {
  Video,
  FileText,
  Heart,
  Users,
  Package,
  Store,
};

interface CreateFormData {
  type: TaskType;
  title: string;
  description: string;
  difficulty: number;
  estimatedTime: number;
  targetDemographic: {
    ageRange: [number, number];
    regions: string[];
  };
  quota: number;
  riskConfig: {
    ipDeduplication: boolean;
    deviceFingerprintCheck: boolean;
    logicValidation: boolean;
    antiCheating: boolean;
  };
  executorQualification: {
    minCreditScore: number;
    requireRealName: boolean;
  };
  reviewChain: {
    aiReview: boolean;
    manualSamplingRate: number;
    allowDispute: boolean;
  };
  baseReward: number;
  dynamicPricing: boolean;
  maxReward: number;
  budgetLimit: number;
}

const initialFormData: CreateFormData = {
  type: "survey",
  title: "",
  description: "",
  difficulty: 2,
  estimatedTime: 5,
  targetDemographic: {
    ageRange: [18, 50],
    regions: ["全国"],
  },
  quota: 1000,
  riskConfig: {
    ipDeduplication: true,
    deviceFingerprintCheck: true,
    logicValidation: true,
    antiCheating: true,
  },
  executorQualification: {
    minCreditScore: 60,
    requireRealName: true,
  },
  reviewChain: {
    aiReview: true,
    manualSamplingRate: 0.15,
    allowDispute: true,
  },
  baseReward: 5,
  dynamicPricing: false,
  maxReward: 10,
  budgetLimit: 6000,
};

const difficultyConfig = [
  { level: 1, label: "入门级", desc: "操作简单，适合新手用户" },
  { level: 2, label: "简单", desc: "常规任务，无特殊要求" },
  { level: 3, label: "中等", desc: "需一定时间和专注度" },
  { level: 4, label: "困难", desc: "复杂任务，需特定技能" },
  { level: 5, label: "专家级", desc: "高难度，需专业能力" },
];

const taskTypeConfig = {
  media: { label: "媒体类", icon: Video, color: "text-cyber-cyan-400", bg: "bg-cyber-cyan-500/10", border: "border-cyber-cyan-500/30" },
  survey: { label: "调研类", icon: FileText, color: "text-success-400", bg: "bg-success-500/10", border: "border-success-500/30" },
  experience: { label: "体验类", icon: Package, color: "text-amber-gold-400", bg: "bg-amber-gold-500/10", border: "border-amber-gold-500/30" },
};

export default function EnterprisePage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentEnterprise,
    taskTemplates,
    tasks,
    createTask,
    updateTaskPricing,
  } = useAppStore();

  const tabParam = searchParams.get("tab") as "dashboard" | "templates" | "tasks" | "pricing" | null;
  const prefillParam = searchParams.get("prefill") as TaskType | null;

  const [activeTab, setActiveTab] = useState<"dashboard" | "templates" | "tasks" | "pricing">("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [baseReward, setBaseReward] = useState(2);
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1.5);
  const [completionThreshold, setCompletionThreshold] = useState(60);
  const [boostPercentage, setBoostPercentage] = useState(25);
  const [maxReward, setMaxReward] = useState(10);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);

  useEffect(() => {
    if (tabParam && ["dashboard", "templates", "tasks", "pricing"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (prefillParam && ["media", "survey", "experience"].includes(prefillParam)) {
      setActiveTab("templates");
      setFormData((prev) => ({ ...prev, type: prefillParam }));
      setShowCreateForm(true);
      setCreateStep(1);
    }
  }, [tabParam, prefillParam]);

  const enterpriseTasks = tasks.filter((t) => t.enterpriseId === currentEnterprise.id);

  const totalViews = enterpriseTasks.reduce((sum, t) => sum + t.views, 0);
  const totalClicks = enterpriseTasks.reduce((sum, t) => sum + t.clicks, 0);
  const totalConversions = enterpriseTasks.reduce((sum, t) => sum + t.completed, 0);
  const totalSpent = enterpriseTasks.reduce((sum, t) => sum + t.completed * t.reward, 0);
  const remainingBudget = currentEnterprise.totalBudget - totalSpent;

  const estimatedTotalCost = formData.quota * formData.baseReward * 1.2;
  const budgetExceeded = estimatedTotalCost > remainingBudget;

  const activeEnterpriseTasks = enterpriseTasks.filter((t) => t.status === "active");
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  const handleTaskSelect = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTaskId(taskId);
      setTaskSelectorOpen(false);

      const latestPricing = task.pricingHistory.length > 0
        ? task.pricingHistory[task.pricingHistory.length - 1]
        : null;

      setBaseReward(latestPricing ? latestPricing.newReward : task.originalReward);
      setDifficultyMultiplier(1 + (task.difficulty - 1) * 0.25);
      setCompletionThreshold(60);
      setBoostPercentage(25);
      setMaxReward(task.budgetLimit / task.quota);
    }
  };

  const handleApplyPricing = () => {
    if (!selectedTask) return;

    const oldReward = selectedTask.reward;
    const newReward = Math.min(
      baseReward * difficultyMultiplier * (1 + boostPercentage / 100),
      maxReward
    );

    const remainingQuota = selectedTask.quota - selectedTask.completed;
    const budgetImpact = (newReward - oldReward) * remainingQuota;
    const currentROI = selectedTask.completed > 0
      ? (selectedTask.completed * selectedTask.reward) / (selectedTask.completed * oldReward)
      : 1;
    const roiImpact = currentROI * (oldReward / newReward) - currentROI;

    updateTaskPricing(selectedTask.id, {
      reason: "手动调整定价参数",
      oldReward,
      newReward,
      triggeredBy: "manual",
      completionRateAtTime: selectedTask.completed / selectedTask.quota,
      budgetImpact,
      roiImpact,
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const calculateBudgetMetrics = () => {
    if (!selectedTask) return null;

    const usedBudget = selectedTask.completed * selectedTask.reward;
    const remainingQuota = selectedTask.quota - selectedTask.completed;
    const remainingBudgetTask = selectedTask.budgetLimit - usedBudget;
    const estimatedTotalSpend = remainingQuota * selectedTask.reward;
    const newReward = Math.min(
      baseReward * difficultyMultiplier * (1 + boostPercentage / 100),
      maxReward
    );
    const estimatedNewSpend = remainingQuota * newReward;
    const budgetInsufficient = estimatedTotalSpend > remainingBudgetTask;

    return {
      usedBudget,
      remainingQuota,
      remainingBudgetTask,
      estimatedTotalSpend,
      estimatedNewSpend,
      budgetInsufficient,
      newReward,
    };
  };

  const getROIChartData = () => {
    if (!selectedTask) return [];

    const data = selectedTask.pricingHistory.map((record) => ({
      time: new Date(record.timestamp).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit" }),
      reward: record.newReward,
      roi: 1 + record.roiImpact,
    }));

    if (selectedTask.pricingHistory.length === 0) {
      data.push({
        time: new Date(selectedTask.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit" }),
        reward: selectedTask.originalReward,
        roi: 1,
      });
    }

    return data;
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...initialFormData,
      type: template.type,
      title: template.name,
      description: template.description,
      riskConfig: {
        ...initialFormData.riskConfig,
        logicValidation: template.type !== "media",
      },
      reviewChain: {
        ...initialFormData.reviewChain,
        manualSamplingRate: template.type === "media" ? 0.05 : template.type === "survey" ? 0.15 : 0.25,
      },
      executorQualification: {
        ...initialFormData.executorQualification,
        minCreditScore: template.type === "media" ? 60 : template.type === "survey" ? 75 : 85,
      },
    });
    setShowCreateForm(true);
    setCreateStep(1);
  };

  const handleCreateFromQuick = () => {
    setFormData(initialFormData);
    setShowCreateForm(true);
    setCreateStep(1);
  };

  const handleCreateTask = () => {
    createTask({
      title: formData.title,
      type: formData.type,
      description: formData.description,
      reward: formData.baseReward,
      originalReward: formData.baseReward,
      difficulty: formData.difficulty,
      estimatedTime: formData.estimatedTime,
      targetDemographic: formData.targetDemographic,
      quota: formData.quota,
      riskConfig: formData.riskConfig,
      executorQualification: formData.executorQualification,
      reviewChain: formData.reviewChain,
      budgetLimit: formData.budgetLimit,
    });
    setShowCreateForm(false);
    setSelectedTemplate(null);
    setActiveTab("tasks");
    setSearchParams({});
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setSelectedTemplate(null);
    setFormData(initialFormData);
    setSearchParams({});
  };

  const updateFormData = <K extends keyof CreateFormData>(key: K, value: CreateFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const taskStatusConfig = {
    active: { label: "进行中", icon: PlayCircle, color: "text-success-500", bg: "bg-success-500/10" },
    paused: { label: "已暂停", icon: PauseCircle, color: "text-warning-500", bg: "bg-warning-500/10" },
    completed: { label: "已完成", icon: CheckCircle2, color: "text-cyber-cyan-400", bg: "bg-cyber-cyan-500/10" },
    draft: { label: "草稿", icon: Clock, color: "text-gray-400", bg: "bg-gray-500/10" },
    closed: { label: "已关闭", icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10" },
  };

  const stepTitles = ["资质确认", "基础信息", "风控配置", "审核链配置", "预算确认"];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4, 5].map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                createStep > step
                  ? "bg-success-500/20 border-success-500 text-success-400"
                  : createStep === step
                  ? "bg-cyber-cyan-500/20 border-cyber-cyan-500 text-cyber-cyan-400"
                  : "bg-white/5 border-white/10 text-gray-500"
              )}
            >
              {createStep > step ? <CheckCircle className="w-5 h-5" /> : step}
            </div>
            <span
              className={cn(
                "text-xs mt-2",
                createStep >= step ? "text-white" : "text-gray-500"
              )}
            >
              {stepTitles[index]}
            </span>
          </div>
          {step < 5 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                createStep > step ? "bg-success-500" : "bg-white/10"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyber-cyan-500/10 border border-cyber-cyan-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-cyber-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">企业资质确认</h3>
          <p className="text-sm text-gray-500">请确认以下企业信息，资质认证通过后方可发布任务</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm text-gray-400">企业名称</h4>
            {currentEnterprise.status === "approved" ? (
              <span className="tag tag-green flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                已认证
              </span>
            ) : currentEnterprise.status === "pending" ? (
              <span className="tag tag-yellow flex items-center gap-1">
                <Clock className="w-3 h-3" />
                待审核
              </span>
            ) : (
              <span className="tag tag-red flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                认证失败
              </span>
            )}
          </div>
          <p className="text-white font-medium">{currentEnterprise.name}</p>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-sm text-gray-400 mb-4">营业执照号</h4>
          <p className="text-white font-mono">{currentEnterprise.licenseNo}</p>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-sm text-gray-400 mb-4">行业类别</h4>
          <p className="text-white">{currentEnterprise.industry}</p>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-sm text-gray-400 mb-4">联系人</h4>
          <p className="text-white">{currentEnterprise.contactPerson}</p>
          <p className="text-sm text-gray-500 mt-1">{currentEnterprise.contactPhone}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-gold-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-gold-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">账户余额</p>
              <p className="text-xl font-bold text-amber-gold-400">¥{currentEnterprise.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">总预算</p>
              <p className="text-xl font-bold text-success-400">¥{currentEnterprise.totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyber-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">剩余预算</p>
              <p className="text-xl font-bold text-cyber-cyan-400">¥{remainingBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {currentEnterprise.status !== "approved" && (
        <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-danger-400 font-medium">企业资质尚未通过认证</p>
            <p className="text-sm text-gray-500 mt-1">请联系客服完成企业认证，认证通过后方可发布任务。</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-success-500/10 border border-success-500/20 flex items-center justify-center">
          <FileText className="w-6 h-6 text-success-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">任务基础信息</h3>
          <p className="text-sm text-gray-500">设置任务的基本属性和要求</p>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-3">任务类型</label>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(taskTypeConfig) as TaskType[]).map((type) => {
            const config = taskTypeConfig[type];
            const Icon = config.icon;
            const isSelected = formData.type === type;
            return (
              <button
                key={type}
                onClick={() => updateFormData("type", type)}
                className={cn(
                  "glass-card p-4 text-left transition-all",
                  isSelected && `${config.bg} ${config.border} border`
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                    isSelected ? config.bg : "bg-white/5"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isSelected ? config.color : "text-gray-400")} />
                </div>
                <p className={cn("font-medium", isSelected ? "text-white" : "text-gray-300")}>{config.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {type === "media" && "视频观看、广告点击等"}
                  {type === "survey" && "问卷调研、用户访谈等"}
                  {type === "experience" && "产品试用、门店体验等"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">任务名称</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateFormData("title", e.target.value)}
          placeholder="请输入任务名称"
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">任务描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder="请详细描述任务要求、执行步骤和注意事项"
          rows={4}
          className="input-field resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-3">任务难度</label>
        <div className="grid grid-cols-5 gap-3">
          {difficultyConfig.map((d) => (
            <button
              key={d.level}
              onClick={() => updateFormData("difficulty", d.level)}
              className={cn(
                "glass-card p-3 text-center transition-all",
                formData.difficulty === d.level && "border-cyber-cyan-500/50 bg-cyber-cyan-500/5"
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: d.level }).map((_, i) => (
                  <Zap key={i} className={cn("w-3.5 h-3.5", formData.difficulty >= d.level ? "text-amber-gold-400" : "text-gray-600")} />
                ))}
              </div>
              <p className={cn("text-sm font-medium", formData.difficulty === d.level ? "text-cyber-cyan-400" : "text-gray-400")}>
                {d.label}
              </p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">预计时长（分钟）</label>
          <input
            type="number"
            value={formData.estimatedTime}
            onChange={(e) => updateFormData("estimatedTime", Number(e.target.value))}
            min="1"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">任务配额（份）</label>
          <input
            type="number"
            value={formData.quota}
            onChange={(e) => updateFormData("quota", Number(e.target.value))}
            min="1"
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-3">目标年龄范围</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={formData.targetDemographic.ageRange[0]}
              onChange={(e) =>
                updateFormData("targetDemographic", {
                  ...formData.targetDemographic,
                  ageRange: [Number(e.target.value), formData.targetDemographic.ageRange[1]],
                })
              }
              min="16"
              max={formData.targetDemographic.ageRange[1]}
              className="input-field flex-1"
            />
            <span className="text-gray-500">至</span>
            <input
              type="number"
              value={formData.targetDemographic.ageRange[1]}
              onChange={(e) =>
                updateFormData("targetDemographic", {
                  ...formData.targetDemographic,
                  ageRange: [formData.targetDemographic.ageRange[0], Number(e.target.value)],
                })
              }
              min={formData.targetDemographic.ageRange[0]}
              max="80"
              className="input-field flex-1"
            />
            <span className="text-gray-500">岁</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              目标地区
            </div>
          </label>
          <select
            value={formData.targetDemographic.regions[0]}
            onChange={(e) =>
              updateFormData("targetDemographic", {
                ...formData.targetDemographic,
                regions: [e.target.value],
              })
            }
            className="input-field"
          >
            <option value="全国">全国</option>
            <option value="北京">北京</option>
            <option value="上海">上海</option>
            <option value="广州">广州</option>
            <option value="深圳">深圳</option>
            <option value="杭州">杭州</option>
            <option value="成都">成都</option>
            <option value="武汉">武汉</option>
            <option value="西安">西安</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-gold-500/10 border border-amber-gold-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-amber-gold-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">风控配置</h3>
          <p className="text-sm text-gray-500">配置任务的风险控制规则，确保任务质量</p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          {
            key: "ipDeduplication",
            label: "IP 去重",
            desc: "同一 IP 地址仅允许完成一次任务",
          },
          {
            key: "deviceFingerprintCheck",
            label: "设备指纹检测",
            desc: "通过设备特征识别防止同一设备重复提交",
          },
          {
            key: "logicValidation",
            label: "问卷逻辑校验",
            desc: "校验问卷答案的逻辑一致性，仅调研类任务可用",
            disabled: formData.type !== "survey",
            showFor: ["survey"] as TaskType[],
          },
          {
            key: "antiCheating",
            label: "防刷题机制",
            desc: "检测异常行为模式，防止机器刷量和工作室作弊",
          },
        ].map((item) => {
          const isDisabled = item.disabled || (item.showFor && !item.showFor.includes(formData.type));
          const isEnabled = formData.riskConfig[item.key as keyof typeof formData.riskConfig];
          return (
            <div
              key={item.key}
              className={cn(
                "glass-card p-4 flex items-center justify-between",
                isDisabled && "opacity-50"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium">{item.label}</h4>
                  {isDisabled && item.showFor && (
                    <span className="text-xs text-gray-500">（仅调研类任务）</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  !isDisabled &&
                  updateFormData("riskConfig", {
                    ...formData.riskConfig,
                    [item.key]: !isEnabled,
                  })
                }
                disabled={isDisabled}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  isEnabled ? "bg-cyber-cyan-500" : "bg-white/10",
                  isDisabled && "cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                    isEnabled ? "left-6" : "left-0.5"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-5">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyber-cyan-400" />
          执行者资质要求
        </h4>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">最低信用分要求</label>
              <span className="text-cyber-cyan-400 font-mono">{formData.executorQualification.minCreditScore} 分</span>
            </div>
            <input
              type="range"
              value={formData.executorQualification.minCreditScore}
              onChange={(e) =>
                updateFormData("executorQualification", {
                  ...formData.executorQualification,
                  minCreditScore: Number(e.target.value),
                })
              }
              min="0"
              max="100"
              step="5"
              className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-white text-sm font-medium">实名认证要求</h5>
              <p className="text-xs text-gray-500 mt-1">要求执行者完成实名认证后方可接单</p>
            </div>
            <button
              onClick={() =>
                updateFormData("executorQualification", {
                  ...formData.executorQualification,
                  requireRealName: !formData.executorQualification.requireRealName,
                })
              }
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                formData.executorQualification.requireRealName ? "bg-cyber-cyan-500" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                  formData.executorQualification.requireRealName ? "left-6" : "left-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Scale className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">审核链配置</h3>
          <p className="text-sm text-gray-500">配置任务提交后的审核流程</p>
        </div>
      </div>

      <div className="glass-card p-5 mb-6">
        <h4 className="text-white font-medium mb-4">审核流程示意</h4>
        <div className="flex items-center justify-between py-4">
          {[
            { label: "提交", icon: Upload, active: true },
            { label: "AI初筛", icon: Sparkles, active: formData.reviewChain.aiReview },
            { label: "人工抽检", icon: Users, active: formData.reviewChain.manualSamplingRate > 0 },
            { label: "争议仲裁", icon: Scale, active: formData.reviewChain.allowDispute },
          ].map((stage, index) => (
            <div key={stage.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    stage.active ? "bg-cyber-cyan-500/20" : "bg-white/5"
                  )}
                >
                  <stage.icon className={cn("w-5 h-5", stage.active ? "text-cyber-cyan-400" : "text-gray-500")} />
                </div>
                <span className={cn("text-xs mt-2", stage.active ? "text-white" : "text-gray-500")}>
                  {stage.label}
                </span>
              </div>
              {index < 3 && (
                <ArrowRight className={cn("w-5 h-5 mx-2 flex-shrink-0", stage.active ? "text-cyber-cyan-500" : "text-gray-700")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-medium">AI 智能审核</h4>
              <span className="tag tag-cyan text-xs">推荐开启</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">使用 AI 模型自动检测风险，过滤无效提交</p>
          </div>
          <button
            onClick={() =>
              updateFormData("reviewChain", {
                ...formData.reviewChain,
                aiReview: !formData.reviewChain.aiReview,
              })
            }
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              formData.reviewChain.aiReview ? "bg-cyber-cyan-500" : "bg-white/10"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                formData.reviewChain.aiReview ? "left-6" : "left-0.5"
              )}
            />
          </button>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-medium">人工抽检率</h4>
              <p className="text-sm text-gray-500 mt-1">从通过 AI 审核的提交中抽取一定比例进行人工复核</p>
            </div>
            <span className="text-cyber-cyan-400 font-mono text-lg">
              {(formData.reviewChain.manualSamplingRate * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            value={formData.reviewChain.manualSamplingRate * 100}
            onChange={(e) =>
              updateFormData("reviewChain", {
                ...formData.reviewChain,
                manualSamplingRate: Number(e.target.value) / 100,
              })
            }
            min="0"
            max="50"
            step="5"
            className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            媒体类建议 5%，调研类建议 15%，体验类建议 25%
          </p>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-white font-medium">允许争议申诉</h4>
            <p className="text-sm text-gray-500 mt-1">允许执行者对审核结果提出申诉，由平台进行仲裁</p>
          </div>
          <button
            onClick={() =>
              updateFormData("reviewChain", {
                ...formData.reviewChain,
                allowDispute: !formData.reviewChain.allowDispute,
              })
            }
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              formData.reviewChain.allowDispute ? "bg-cyber-cyan-500" : "bg-white/10"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                formData.reviewChain.allowDispute ? "left-6" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-gold-500/10 border border-amber-gold-500/20 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-amber-gold-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">预算确认</h3>
          <p className="text-sm text-gray-500">设置任务赏金和预算上限</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">基础赏金（元/份）</label>
          <input
            type="number"
            value={formData.baseReward}
            onChange={(e) => updateFormData("baseReward", Number(e.target.value))}
            min="0.5"
            step="0.5"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">预算上限（元）</label>
          <input
            type="number"
            value={formData.budgetLimit}
            onChange={(e) => updateFormData("budgetLimit", Number(e.target.value))}
            min={formData.baseReward * formData.quota}
            className="input-field"
          />
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-white font-medium">动态定价</h4>
              <span className="tag tag-green text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                智能
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">根据任务完成率自动调整赏金，最大化 ROI</p>
          </div>
          <button
            onClick={() => updateFormData("dynamicPricing", !formData.dynamicPricing)}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              formData.dynamicPricing ? "bg-success-500" : "bg-white/10"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                formData.dynamicPricing ? "left-6" : "left-0.5"
              )}
            />
          </button>
        </div>

        {formData.dynamicPricing && (
          <div className="pt-4 border-t border-white/5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">最高赏金上限</label>
                <span className="text-danger-400 font-mono">¥{formData.maxReward}</span>
              </div>
              <input
                type="range"
                value={formData.maxReward}
                onChange={(e) => updateFormData("maxReward", Number(e.target.value))}
                min={formData.baseReward}
                max={formData.baseReward * 5}
                step="0.5"
                className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-danger-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>¥{formData.baseReward}</span>
                <span>¥{formData.maxReward}</span>
                <span>¥{(formData.baseReward * 5).toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-5 bg-cyber-cyan-500/5 border-cyber-cyan-500/20">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyber-cyan-400" />
          预算明细
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">任务配额</span>
            <span className="text-white font-mono">{formData.quota} 份</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">基础赏金</span>
            <span className="text-white font-mono">¥{formData.baseReward.toFixed(2)}/份</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">浮动空间（20%）</span>
            <span className="text-amber-gold-400 font-mono">× 1.2</span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">预估总支出</span>
            <span className="text-2xl font-bold text-cyber-cyan-400 font-mono">
              ¥{estimatedTotalCost.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">账户剩余预算</span>
            <span className={cn("font-mono", remainingBudget >= estimatedTotalCost ? "text-success-400" : "text-danger-400")}>
              ¥{remainingBudget.toLocaleString()}
            </span>
          </div>
        </div>

        {budgetExceeded && (
          <div className="mt-4 bg-danger-500/10 border border-danger-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-danger-400 font-medium">预算不足警告</p>
              <p className="text-sm text-gray-500 mt-1">
                预估支出（¥{estimatedTotalCost.toLocaleString()}）已超过账户剩余预算（¥{remainingBudget.toLocaleString()}），
                请先充值或调整任务参数。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-success-500/10 border border-success-500/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-success-400 font-medium">费用说明</p>
          <p className="text-sm text-gray-500 mt-1">
            任务发布时将冻结预估总金额，实际支出以最终完成份数为准。未使用的预算将在任务结束后自动解冻。
            平台收取 {formData.type === "media" ? "10%" : formData.type === "survey" ? "15%" : "20%"} 服务费。
          </p>
        </div>
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className="fixed inset-0 bg-deep-space-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-deep-space-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedTemplate ? `使用「${selectedTemplate.name}」创建任务` : "创建新任务"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">完成以下步骤即可发布任务</p>
            </div>
            <button onClick={handleCancelCreate} className="text-gray-400 hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {renderStepIndicator()}

          {createStep === 1 && renderStep1()}
          {createStep === 2 && renderStep2()}
          {createStep === 3 && renderStep3()}
          {createStep === 4 && renderStep4()}
          {createStep === 5 && renderStep5()}
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <button onClick={handleCancelCreate} className="btn-secondary">
            取消
          </button>
          <div className="flex items-center gap-3">
            {createStep > 1 && (
              <button
                onClick={() => setCreateStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
            )}
            {createStep < 5 && (
              <button
                onClick={() => setCreateStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5)}
                className="btn-primary flex items-center gap-2"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {createStep === 5 && (
              <button
                onClick={handleCreateTask}
                disabled={budgetExceeded || currentEnterprise.status !== "approved"}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                提交创建
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="企业工作台" subtitle={`${currentEnterprise.name} · 已认证企业`}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {[
            { key: "dashboard", label: "数据看板", icon: BarChart3 },
            { key: "templates", label: "任务模板", icon: FileText },
            { key: "tasks", label: "我的任务", icon: Target },
            { key: "pricing", label: "动态定价", icon: SlidersHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as typeof activeTab);
                  setSearchParams({ tab: tab.key });
                }}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  isActive
                    ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-5">
              <StatCard
                title="账户余额"
                value={`¥${currentEnterprise.balance.toLocaleString()}`}
                icon={<DollarSign className="w-6 h-6" />}
                subtitle={`总预算 ¥${currentEnterprise.totalBudget.toLocaleString()}`}
                accentColor="#FFB800"
              />
              <StatCard
                title="任务曝光量"
                value={totalViews.toLocaleString()}
                icon={<Eye className="w-6 h-6" />}
                trend={15.3}
                trendLabel="较上周"
                accentColor="#00F0FF"
              />
              <StatCard
                title="点击转化率"
                value={`${((totalClicks / totalViews) * 100).toFixed(1)}%`}
                icon={<MousePointer className="w-6 h-6" />}
                trend={3.2}
                trendLabel="较上周"
                accentColor="#00E676"
              />
              <StatCard
                title="完成转化数"
                value={totalConversions.toLocaleString()}
                icon={<CheckCircle2 className="w-6 h-6" />}
                trend={8.7}
                trendLabel="较上周"
                accentColor="#FF9100"
              />
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">ROI 趋势分析</h3>
                    <p className="text-sm text-gray-500 mt-1">近7天投入产出对比</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyber-cyan-500" />
                      <span className="text-gray-400">投入成本</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-success-500" />
                      <span className="text-gray-400">转化价值</span>
                    </span>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockROIData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#00F0FF"
                        fill="url(#colorCost)"
                        name="投入(元)"
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00E676"
                        fill="url(#colorRevenue)"
                        name="价值(元)"
                      />
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-2">用户画像分布</h3>
                <p className="text-sm text-gray-500 mb-6">按年龄段分布</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockUserAgeDistribution.reduce((acc: { range: string; male: number; female: number }[], curr) => {
                        const existing = acc.find((a) => a.range === curr.range);
                        if (existing) {
                          if (curr.gender === "male") existing.male = curr.count;
                          else existing.female = curr.count;
                        } else {
                          acc.push({
                            range: curr.range,
                            male: curr.gender === "male" ? curr.count : 0,
                            female: curr.gender === "female" ? curr.count : 0,
                          });
                        }
                        return acc;
                      }, [])}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="range" stroke="#666" fontSize={11} />
                      <YAxis stroke="#666" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="male" fill="#00F0FF" name="男性" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="female" fill="#FF9100" name="女性" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">任务完成率走势</h3>
                  <p className="text-sm text-gray-500 mt-1">近7日完成率与目标对比</p>
                </div>
                <span className="tag tag-red flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 rotate-180" />
                  拐点预警
                </span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockCompletionRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A1628",
                        border: "1px solid rgba(0,240,255,0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#666"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                      name="目标"
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#FF3D71"
                      strokeWidth={2}
                      dot={{ fill: "#FF3D71", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="实际完成率"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">任务模板库</h3>
                <p className="text-sm text-gray-500 mt-1">选择预设模板快速创建任务，或自定义任务类型</p>
              </div>
              <button className="btn-secondary flex items-center gap-2">
                <Upload className="w-4 h-4" />
                导入模板
              </button>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {taskTemplates.map((template) => {
                const Icon = templateIconMap[template.icon] || FileText;
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "glass-card-hover p-6 cursor-pointer relative",
                      isSelected && "border-cyber-cyan-500/50 shadow-glow-cyan"
                    )}
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyber-cyan-500/10 border border-cyber-cyan-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-cyber-cyan-400" />
                      </div>
                      <span className="tag tag-cyan text-xs">
                        使用 {template.usageCount.toLocaleString()} 次
                      </span>
                    </div>

                    <h4 className="text-base font-medium text-white mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description}</p>

                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">典型配置</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(template.defaultConfig).map(([key, value]) => (
                          <span key={key} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-gray-500">
                        类型：
                        {template.type === "media" && "媒体类"}
                        {template.type === "survey" && "调研类"}
                        {template.type === "experience" && "体验类"}
                      </span>
                      <button className="text-cyber-cyan-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                        使用模板
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div
                className="glass-card p-6 border-dashed border-2 border-white/10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-cyber-cyan-500/30 hover:bg-cyber-cyan-500/5 transition-all"
                onClick={handleCreateFromQuick}
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">创建自定义任务</p>
                <p className="text-xs text-gray-600 mt-1">不使用模板，从头开始配置</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select className="input-field w-40 text-sm">
                  <option>全部状态</option>
                  <option>进行中</option>
                  <option>已暂停</option>
                  <option>已完成</option>
                  <option>草稿</option>
                </select>
                <select className="input-field w-40 text-sm">
                  <option>全部类型</option>
                  <option>媒体类</option>
                  <option>调研类</option>
                  <option>体验类</option>
                </select>
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={handleCreateFromQuick}>
                <Plus className="w-4 h-4" />
                新建任务
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="table-header">任务名称</th>
                    <th className="table-header">类型</th>
                    <th className="table-header">赏金</th>
                    <th className="table-header">进度</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {enterpriseTasks.map((task: Task) => {
                    const statusConfig = taskStatusConfig[task.status];
                    const StatusIcon = statusConfig.icon;
                    const progress = (task.completed / task.quota) * 100;
                    return (
                      <tr key={task.id} className="hover:bg-white/5 transition-colors">
                        <td className="table-cell">
                          <div>
                            <p className="text-white font-medium">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {task.enterpriseName}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="tag tag-cyan">
                            {task.type === "media" && "媒体类"}
                            {task.type === "survey" && "调研类"}
                            {task.type === "experience" && "体验类"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-amber-gold-400 font-medium">
                            ¥{task.reward}
                          </span>
                        </td>
                        <td className="table-cell w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-12 text-right">
                              {task.completed}/{task.quota}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={cn("tag", statusConfig.bg, statusConfig.color)}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button className="text-cyber-cyan-400 hover:text-cyber-cyan-300 text-sm">
                              详情
                            </button>
                            <button className="text-gray-400 hover:text-white text-sm">
                              编辑
                            </button>
                            <Settings2 className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-6">
            {showSuccessToast && (
              <div className="fixed top-4 right-4 bg-success-500/20 border border-success-500/30 text-success-400 px-4 py-3 rounded-lg flex items-center gap-2 z-50 animate-pulse">
                <CheckCircle className="w-5 h-5" />
                定价调整已成功应用
              </div>
            )}

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">动态定价引擎</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    根据任务难度、完成率和市场行情实时调整赏金，最大化ROI
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tag tag-green flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    已启用
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">选择任务</label>
                <div className="relative">
                  <button
                    onClick={() => setTaskSelectorOpen(!taskSelectorOpen)}
                    className={cn(
                      "w-full glass-card p-4 flex items-center justify-between text-left transition-all",
                      !selectedTask && "text-gray-500"
                    )}
                  >
                    {selectedTask ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            taskTypeConfig[selectedTask.type].bg
                          )}>
                            {(() => {
                              const Icon = taskTypeConfig[selectedTask.type].icon;
                              return <Icon className={cn("w-5 h-5", taskTypeConfig[selectedTask.type].color)} />;
                            })()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{selectedTask.title}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>{taskTypeConfig[selectedTask.type].label}</span>
                              <span className="text-amber-gold-400">当前赏金: ¥{selectedTask.reward}</span>
                              <span>完成率: {(selectedTask.completed / selectedTask.quota * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">请选择一个进行中的任务</span>
                    )}
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", taskSelectorOpen && "rotate-180")} />
                  </button>

                  {taskSelectorOpen && (
                    <div className="absolute z-20 w-full mt-2 glass-card overflow-hidden border border-white/10">
                      {activeEnterpriseTasks.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">暂无进行中的任务</p>
                        </div>
                      ) : (
                        activeEnterpriseTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleTaskSelect(task.id)}
                            className={cn(
                              "w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0",
                              selectedTaskId === task.id && "bg-cyber-cyan-500/5"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              taskTypeConfig[task.type].bg
                            )}>
                              {(() => {
                                const Icon = taskTypeConfig[task.type].icon;
                                return <Icon className={cn("w-5 h-5", taskTypeConfig[task.type].color)} />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{task.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="text-gray-500">{taskTypeConfig[task.type].label}</span>
                                <span className="text-amber-gold-400 font-mono">¥{task.reward}</span>
                                <span className="text-gray-500">
                                  {task.completed}/{task.quota} ({(task.completed / task.quota * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                            {selectedTaskId === task.id && (
                              <CheckCircle className="w-5 h-5 text-cyber-cyan-400 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!selectedTask ? (
                <div className="glass-card p-12 text-center border-dashed border-2 border-white/10">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500 text-lg">请先选择一个任务</p>
                  <p className="text-sm text-gray-600 mt-2">选择任务后将显示定价历史和可调整参数</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400">基础赏金</label>
                          <span className="text-cyber-cyan-400 font-mono">¥{baseReward.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="50"
                          step="0.5"
                          value={baseReward}
                          onChange={(e) => setBaseReward(Number(e.target.value))}
                          className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400">难度系数倍率</label>
                          <span className="text-cyber-cyan-400 font-mono">{difficultyMultiplier.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={difficultyMultiplier}
                          onChange={(e) => setDifficultyMultiplier(Number(e.target.value))}
                          className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400">完成率触发阈值</label>
                          <span className="text-cyber-cyan-400 font-mono">{completionThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="90"
                          step="5"
                          value={completionThreshold}
                          onChange={(e) => setCompletionThreshold(Number(e.target.value))}
                          className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400">自动加价幅度</label>
                          <span className="text-amber-gold-400 font-mono">+{boostPercentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={boostPercentage}
                          onChange={(e) => setBoostPercentage(Number(e.target.value))}
                          className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-amber-gold-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400">最高赏金上限</label>
                          <span className="text-danger-400 font-mono">¥{maxReward.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="100"
                          step="1"
                          value={maxReward}
                          onChange={(e) => setMaxReward(Number(e.target.value))}
                          className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-danger-500"
                        />
                      </div>

                      <button
                        onClick={handleApplyPricing}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        应用定价调整
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-deep-space-950/50 rounded-xl p-6 border border-white/5">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-amber-gold-400" />
                          ROI 变化趋势
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getROIChartData()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="time" stroke="#666" fontSize={11} />
                              <YAxis
                                yAxisId="left"
                                stroke="#00F0FF"
                                fontSize={12}
                                tickFormatter={(v) => `¥${v.toFixed(1)}`}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#FFB800"
                                fontSize={12}
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#0A1628",
                                  border: "1px solid rgba(0,240,255,0.2)",
                                  borderRadius: "8px",
                                  color: "#fff",
                                }}
                                formatter={(value: number, name: string) => [
                                  name === "赏金(元)" ? `¥${value.toFixed(2)}` : `${(value * 100).toFixed(1)}%`,
                                  name
                                ]}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="reward"
                                stroke="#00F0FF"
                                strokeWidth={2}
                                dot={{ fill: "#00F0FF", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                                name="赏金(元)"
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="roi"
                                stroke="#FFB800"
                                strokeWidth={2}
                                dot={{ fill: "#FFB800", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                                name="ROI"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          赏金调整历史与 ROI 变化对比
                        </p>
                      </div>

                      {(() => {
                        const metrics = calculateBudgetMetrics();
                        if (!metrics) return null;
                        const priceIncrease = metrics.newReward - selectedTask.reward;
                        const priceIncreasePercent = ((priceIncrease / selectedTask.reward) * 100).toFixed(1);

                        return (
                          <div className={cn(
                            "rounded-xl p-6 border",
                            metrics.budgetInsufficient
                              ? "bg-danger-500/10 border-danger-500/30"
                              : "bg-cyber-cyan-500/5 border-cyber-cyan-500/20"
                          )}>
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                              <Wallet className={cn("w-5 h-5", metrics.budgetInsufficient ? "text-danger-400" : "text-cyber-cyan-400")} />
                              预算上限校验
                              {metrics.budgetInsufficient && (
                                <span className="tag tag-red text-xs ml-2">预算不足</span>
                              )}
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">任务预算上限</span>
                                <span className="text-white font-mono">¥{selectedTask.budgetLimit.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">已使用预算</span>
                                <span className="text-white font-mono">¥{metrics.usedBudget.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">剩余预算</span>
                                <span className={cn("font-mono", metrics.remainingBudgetTask < 0 ? "text-danger-400" : "text-success-400")}>
                                  ¥{metrics.remainingBudgetTask.toLocaleString()}
                                </span>
                              </div>
                              <div className="h-px bg-white/10 my-2" />
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">预计总支出（当前赏金）</span>
                                <span className="text-white font-mono">¥{metrics.estimatedTotalSpend.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">预计总支出（加价后）</span>
                                <span className="text-amber-gold-400 font-mono">¥{metrics.estimatedNewSpend.toLocaleString()}</span>
                              </div>
                              {priceIncrease > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">加价后预算影响</span>
                                  <span className="text-danger-400 font-mono flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    +¥{(metrics.estimatedNewSpend - metrics.estimatedTotalSpend).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {metrics.budgetInsufficient && (
                                <div className="mt-3 bg-danger-500/10 border border-danger-500/30 rounded-lg p-3 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-danger-400">
                                    预算不足！预计支出已超过任务预算上限，请降低赏金或增加预算。
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-8 glass-card overflow-hidden">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <History className="w-5 h-5 text-cyber-cyan-400" />
                        加价触发记录
                      </h4>
                    </div>
                    {selectedTask.pricingHistory.length === 0 ? (
                      <div className="p-12 text-center">
                        <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">暂无定价调整记录</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="table-header">时间</th>
                            <th className="table-header">触发原因</th>
                            <th className="table-header">原赏金</th>
                            <th className="table-header">新赏金</th>
                            <th className="table-header">涨幅</th>
                            <th className="table-header">完成率</th>
                            <th className="table-header">预算影响</th>
                            <th className="table-header">ROI影响</th>
                            <th className="table-header">操作人</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTask.pricingHistory.slice().reverse().map((record) => {
                            const increaseAmount = record.newReward - record.oldReward;
                            const increasePercent = ((increaseAmount / record.oldReward) * 100).toFixed(1);

                            return (
                              <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                                  {new Date(record.timestamp).toLocaleString("zh-CN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </td>
                                <td className="table-cell">
                                  <span className="text-white text-sm">{record.reason}</span>
                                </td>
                                <td className="table-cell">
                                  <span className="text-gray-400 font-mono">¥{record.oldReward.toFixed(2)}</span>
                                </td>
                                <td className="table-cell">
                                  <span className="text-amber-gold-400 font-mono">¥{record.newReward.toFixed(2)}</span>
                                </td>
                                <td className="table-cell">
                                  <span className="text-success-400 font-mono flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{increasePercent}%
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <span className="text-white font-mono">{(record.completionRateAtTime * 100).toFixed(1)}%</span>
                                </td>
                                <td className="table-cell">
                                  <span className={cn(
                                    "font-mono flex items-center gap-1",
                                    record.budgetImpact >= 0 ? "text-danger-400" : "text-success-400"
                                  )}>
                                    {record.budgetImpact >= 0 ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
                                    {record.budgetImpact >= 0 ? "+" : ""}¥{record.budgetImpact.toFixed(0)}
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <span className={cn(
                                    "font-mono flex items-center gap-1",
                                    record.roiImpact >= 0 ? "text-success-400" : "text-danger-400"
                                  )}>
                                    {record.roiImpact >= 0 ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
                                    {record.roiImpact >= 0 ? "+" : ""}{(record.roiImpact * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <span className={cn(
                                    "tag text-xs",
                                    record.triggeredBy === "system"
                                      ? "tag-cyan"
                                      : "tag-amber"
                                  )}>
                                    {record.triggeredBy === "system" ? "系统自动" : "手动调整"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateForm && renderCreateForm()}
    </MainLayout>
  );
}