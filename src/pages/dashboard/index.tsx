import ReactECharts from "echarts-for-react";
import { motion as m, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppStore } from "@/stores";
import { cn, formatPercent, getTimeRemaining, formatDate, getMotionStatusLabel, formatFileSize } from "@/utils";
import { Badge, Button, Modal, ProgressBar, Card } from "@/components/ui";
import type {
  TodoItem,
  Motion,
  Invoice,
  SealApplication,
  RepairTicket,
  Owner,
} from "@/types";
import {
  Users,
  UserCheck,
  FileText,
  Wallet,
  Stamp,
  Vote,
  ClipboardList,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Building2,
  HandCoins,
  Store,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Calculator,
  Database,
  History,
  Plus,
  Star,
  FileCheck,
  Zap,
  CircleDot,
  FileSearch,
  RefreshCw,
  Target,
  MinusCircle,
  AlertOctagon,
  Activity,
  Upload,
  Paperclip,
  Shield,
  Hash,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Blocks,
} from "lucide-react";

type TodoModalType =
  | { type: "seal"; data: SealApplication }
  | { type: "approval"; data: Invoice }
  | { type: "vote"; data: Motion }
  | { type: "supervision"; data: RepairTicket }
  | { type: "ticket"; data: RepairTicket }
  | { type: "verification"; data: Owner[] }
  | null;

interface AnomalyItem {
  id: string;
  title: string;
  riskLevel: "high" | "medium" | "low";
  affectedArea: string;
  affectedHouseholds: number;
  duration: string;
  suggestedOwner: string;
}

interface HealthIndicator {
  name: string;
  value: number;
  target: number;
  unit: string;
  formula: string;
  numerator: number;
  denominator: number;
  dataSource: string;
  syncTime: string;
  hasAnomaly: boolean;
  anomalyReason?: string;
  affectedHouseholds?: number;
  duration?: string;
  trend?: "up" | "down" | "stable";
}

interface RectificationTask {
  id: string;
  name: string;
  owner: string;
  deadline: string;
  progress: number;
  status: "未开始" | "进行中" | "已完成";
}

interface ReviewRecord {
  date: string;
  operator: string;
  result: string;
  remark: string;
}

interface BlockchainProof {
  txHash: string;
  blockHeight: number;
  timestamp: string;
  nodeCount: number;
  verified: boolean;
}

interface MotionReviewRecord {
  id: string;
  operator: string;
  action: string;
  timestamp: string;
  remark?: string;
  status: string;
}

type MotionModalType =
  | { type: "attachment"; data: Motion; title: string }
  | { type: "chain"; data: Motion; title: string }
  | { type: "review"; data: Motion; title: string }
  | null;

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    communityHealth,
    todos,
    councilMembers,
    repairTickets,
    motions,
    invoices,
    sealApplications,
    owners,
    swapItems,
    crowdfundingProjects,
    updateSealApplication,
    verifyInvoice,
    castVote,
    updateRepairTicket,
    updateTodoStatus,
  } = useAppStore();

  const [todoModal, setTodoModal] = useState<TodoModalType>(null);
  const [healthDetailModal, setHealthDetailModal] = useState<{
    indicator: string;
    value: number;
    target: number;
    unit: string;
  } | null>(null);
  const [moduleDetail, setModuleDetail] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    type: "例行复查",
    remark: "",
    attachment: "",
  });
  const [reviewRecords, setReviewRecords] = useState<Record<string, ReviewRecord[]>>({});
  const [motionModal, setMotionModal] = useState<MotionModalType>(null);
  const [motionCopied, setMotionCopied] = useState(false);
  const [expandedMotionId, setExpandedMotionId] = useState<string | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [showRectificationModal, setShowRectificationModal] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const healthIndicators: HealthIndicator[] = [
    {
      name: "物业费收缴率",
      value: 92.5,
      target: 95,
      unit: "%",
      formula: "已缴费户数 ÷ 应缴费总户数 × 100%",
      numerator: 1110,
      denominator: 1200,
      dataSource: "物业收费系统",
      syncTime: "2025-06-17 08:30:00",
      hasAnomaly: true,
      anomalyReason: "3栋/5栋共89户未缴，其中12户长期拖欠超过3个月",
      affectedHouseholds: 89,
      duration: "3个月以上",
      trend: "down",
    },
    {
      name: "业主议事参与率",
      value: 71.3,
      target: 80,
      unit: "%",
      formula: "参与投票业主数 ÷ 有投票权业主数 × 100%",
      numerator: 856,
      denominator: 1200,
      dataSource: "投票系统",
      syncTime: "2025-06-17 09:00:00",
      hasAnomaly: true,
      anomalyReason: "租赁户投票参与率不足15%，45岁以上业主参与率仅38%",
      affectedHouseholds: 700,
      duration: "持续半年",
      trend: "up",
    },
    {
      name: "投诉问题解决率",
      value: 85.5,
      target: 90,
      unit: "%",
      formula: "已解决工单 ÷ 总工单数 × 100%",
      numerator: 142,
      denominator: 166,
      dataSource: "工单系统",
      syncTime: "2025-06-17 10:00:00",
      hasAnomaly: true,
      anomalyReason: "电梯故障类工单超24小时未解决，共涉及5栋、9栋",
      affectedHouseholds: 36,
      duration: "72小时",
      trend: "stable",
    },
  ];

  const todayLabel = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const activeMembers = councilMembers.filter((m) => m.status === "active");
  const activeTickets = repairTickets.filter((t) => t.status !== "completed");

  const moduleStats = useMemo(
    () => ({
      council: {
        voting: motions.filter((m) => m.status === "voting").length,
        publicity: motions.filter((m) => m.status === "publicity").length,
        passed: motions.filter((m) => m.status === "passed").length,
        total: motions.length,
      },
      finance: {
        income: invoices
          .filter((i) => i.type === "income")
          .reduce((sum, i) => sum + i.amount, 0),
        expense: invoices
          .filter((i) => i.type === "expense")
          .reduce((sum, i) => sum + i.amount, 0),
        pending: invoices.filter((i) => !i.verified).length,
        total: invoices.length,
      },
      seal: {
        pending: sealApplications.filter((s) => s.status === "pending").length,
        inUse: sealApplications.filter((s) => s.status === "in_use").length,
        approved: sealApplications.filter((s) => s.status === "approved")
          .length,
        total: sealApplications.length,
      },
      property: {
        pending: repairTickets.filter((t) => t.status === "pending_assign")
          .length,
        processing: repairTickets.filter((t) => t.status === "processing")
          .length,
        escalated: repairTickets.filter((t) => t.escalated).length,
        completed: repairTickets.filter((t) => t.status === "completed")
          .length,
      },
      economy: {
        available: swapItems.filter((s) => s.status === "available").length,
        ongoing: crowdfundingProjects.filter((c) => c.status === "ongoing")
          .length,
        success: crowdfundingProjects.filter((c) => c.status === "success")
          .length,
        totalSwap: swapItems.length,
      },
    }),
    [motions, invoices, sealApplications, repairTickets, swapItems, crowdfundingProjects]
  );

  const anomalyData: Record<string, AnomalyItem[]> = {
    "物业费收缴率": [
      {
        id: "a1",
        title: "12栋3单元18户连续拖欠超3个月",
        riskLevel: "high",
        affectedArea: "12栋3单元",
        affectedHouseholds: 18,
        duration: "3个月以上",
        suggestedOwner: "张明华",
      },
      {
        id: "a2",
        title: "7栋底商5户物业费分歧未解决",
        riskLevel: "medium",
        affectedArea: "7栋底商",
        affectedHouseholds: 5,
        duration: "2个月",
        suggestedOwner: "陈强",
      },
      {
        id: "a3",
        title: "3栋1单元个别业主缴费滞后",
        riskLevel: "low",
        affectedArea: "3栋1单元",
        affectedHouseholds: 3,
        duration: "1个月",
        suggestedOwner: "李建国",
      },
    ],
    "业主议事参与率": [
      {
        id: "a4",
        title: "45岁以上业主参与率仅38%",
        riskLevel: "medium",
        affectedArea: "全小区",
        affectedHouseholds: 420,
        duration: "持续半年",
        suggestedOwner: "王芳",
      },
      {
        id: "a5",
        title: "租赁户投票参与率不足15%",
        riskLevel: "high",
        affectedArea: "全小区",
        affectedHouseholds: 280,
        duration: "长期存在",
        suggestedOwner: "张明华",
      },
    ],
    "投诉问题解决率": [
      {
        id: "a6",
        title: "电梯故障类工单超24小时未解决",
        riskLevel: "high",
        affectedArea: "5栋、9栋",
        affectedHouseholds: 36,
        duration: "72小时",
        suggestedOwner: "陈强",
      },
      {
        id: "a7",
        title: "公共区域照明维修响应慢",
        riskLevel: "medium",
        affectedArea: "地下车库",
        affectedHouseholds: 120,
        duration: "48小时",
        suggestedOwner: "刘伟",
      },
    ],
  };

  const rectificationData: Record<string, RectificationTask[]> = {
    "物业费收缴率": [
      {
        id: "r1",
        name: "欠费催收专项行动",
        owner: "张明华",
        deadline: "2025-07-31",
        progress: 45,
        status: "进行中",
      },
      {
        id: "r2",
        name: "底商物业费协调会",
        owner: "陈强",
        deadline: "2025-06-30",
        progress: 80,
        status: "进行中",
      },
      {
        id: "r3",
        name: "业主缴费提醒短信推送",
        owner: "李建国",
        deadline: "2025-06-20",
        progress: 100,
        status: "已完成",
      },
    ],
    "业主议事参与率": [
      {
        id: "r4",
        name: "中老年业主宣传活动",
        owner: "王芳",
        deadline: "2025-07-15",
        progress: 30,
        status: "进行中",
      },
      {
        id: "r5",
        name: "租赁户知情权保障方案",
        owner: "张明华",
        deadline: "2025-06-25",
        progress: 0,
        status: "未开始",
      },
    ],
    "投诉问题解决率": [
      {
        id: "r6",
        name: "电梯维保单位约谈",
        owner: "陈强",
        deadline: "2025-06-22",
        progress: 60,
        status: "进行中",
      },
      {
        id: "r7",
        name: "地下车库照明全面检修",
        owner: "刘伟",
        deadline: "2025-06-18",
        progress: 100,
        status: "已完成",
      },
    ],
  };

  const healthDetailData = {
    "物业费收缴率": {
      formula: "已缴费户数 ÷ 应缴费总户数 × 100%",
      dataSource: [
        { label: "已缴费户数", value: "1,110 户" },
        { label: "应缴费总户数", value: "1,200 户" },
        { label: "未缴费户数", value: "90 户" },
        { label: "本月新增缴费", value: "+45 户" },
      ],
      reviewRecords: [
        { date: "2025-06-15", operator: "张明华", result: "数据正常", remark: "与物业对账一致" },
        { date: "2025-06-01", operator: "李建国", result: "数据正常", remark: "缴费系统同步完成" },
        { date: "2025-05-15", operator: "张明华", result: "数据修正", remark: "调整3户重复缴费记录" },
      ],
    },
    "业主议事参与率": {
      formula: "参与投票业主数 ÷ 有投票权业主数 × 100%",
      dataSource: [
        { label: "本次参与投票", value: "856 人" },
        { label: "有投票权业主", value: "1,200 人" },
        { label: "近3个月平均", value: "76.8%" },
        { label: "议案平均票数", value: "689 票" },
      ],
      reviewRecords: [
        { date: "2025-06-16", operator: "张明华", result: "数据正常", remark: "投票数据链上存证完成" },
        { date: "2025-06-10", operator: "王芳", result: "数据正常", remark: "身份核验通过率98.5%" },
      ],
    },
    "投诉问题解决率": {
      formula: "已解决工单 ÷ 总工单数 × 100%",
      dataSource: [
        { label: "本月已解决工单", value: "142 个" },
        { label: "本月总工单", value: "166 个" },
        { label: "平均解决时长", value: "8.5 小时" },
        { label: "业主满意度", value: "4.8/5 星" },
      ],
      reviewRecords: [
        { date: "2025-06-15", operator: "李建国", result: "数据正常", remark: "抽查10份工单均有业主确认" },
        { date: "2025-06-08", operator: "王芳", result: "数据修正", remark: "3个工单状态更新不及时" },
      ],
    },
  };

  const handleSubmitReview = () => {
    if (healthDetailModal) {
      const key = healthDetailModal.indicator;
      const newRecord: ReviewRecord = {
        date: new Date().toISOString().slice(0, 10),
        operator: "赵丽",
        result: "待审核",
        remark: reviewForm.remark || `发起${reviewForm.type}`,
      };
      setReviewRecords((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), newRecord],
      }));
      setShowReviewForm(false);
      setReviewForm({ type: "例行复查", remark: "", attachment: "" });
    }
  };

  const getMergedReviewRecords = (indicator: string) => {
    const original = healthDetailData[indicator as keyof typeof healthDetailData]?.reviewRecords || [];
    const added = reviewRecords[indicator] || [];
    return [...added, ...original];
  };

  const radarOption = {
    radar: {
      indicator: communityHealth.indicators.map((i) => ({
        name: i.name,
        max: 100,
      })),
      radius: "65%",
      center: ["50%", "50%"],
      splitNumber: 4,
      axisName: { color: "#1E40AF", fontSize: 12 },
      splitLine: { lineStyle: { color: "#BFDBFE" } },
      splitArea: {
        show: true,
        areaStyle: { color: ["#EFF6FF", "#DBEAFE", "#BFDBFE", "#93C5FD"] },
      },
      axisLine: { lineStyle: { color: "#93C5FD" } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: communityHealth.indicators.map((i) => i.value),
            areaStyle: { color: "rgba(14, 165, 233, 0.3)" },
            lineStyle: { color: "#0EA5E9", width: 2 },
            itemStyle: { color: "#0EA5E9" },
          },
        ],
      },
    ],
  };

  const lineOption = {
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: communityHealth.trend.map((t) => t.date.slice(5) + "月"),
      axisLine: { lineStyle: { color: "#93C5FD" } },
      axisLabel: { color: "#64748B", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      min: 70,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#E2E8F0" } },
      axisLabel: { color: "#64748B", fontSize: 10 },
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: communityHealth.trend.map((t) => t.score.toFixed(1)),
        lineStyle: { color: "#1E40AF", width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(30, 64, 175, 0.3)" },
              { offset: 1, color: "rgba(30, 64, 175, 0.05)" },
            ],
          },
        },
        itemStyle: { color: "#1E40AF" },
      },
    ],
  };

  const statCards = [
    {
      title: "业主总数",
      value: 1200,
      suffix: "户",
      icon: Users,
      trend: 2.5,
      color: "from-primary-500 to-primary-700",
    },
    {
      title: "在任委员",
      value: activeMembers.length,
      suffix: "人",
      icon: UserCheck,
      trend: 0,
      color: "from-trust-500 to-trust-700",
    },
    {
      title: "活跃工单",
      value: activeTickets.length,
      suffix: "个",
      icon: ClipboardList,
      trend: -12.3,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "本月结余",
      value: 43.3,
      prefix: "+",
      suffix: "万",
      icon: Wallet,
      trend: 8.7,
      color: "from-emerald-500 to-green-600",
    },
  ];

  const quickEntries = [
    {
      title: "民主议事",
      to: "/council/motions",
      icon: Vote,
      color: "bg-primary-100 text-primary-700",
      stats: [
        { label: "投票中", value: moduleStats.council.voting },
        { label: "公示中", value: moduleStats.council.publicity },
        { label: "已通过", value: moduleStats.council.passed },
      ],
      actions: [
        { label: "查看议案", to: "/council/motions" },
        { label: "发起议案", to: "/council/motions/new" },
      ],
    },
    {
      title: "财务透明",
      to: "/finance/overview",
      icon: HandCoins,
      color: "bg-emerald-100 text-emerald-700",
      stats: [
        { label: "总收入", value: `${(moduleStats.finance.income / 10000).toFixed(1)}万` },
        { label: "总支出", value: `${(moduleStats.finance.expense / 10000).toFixed(1)}万` },
        { label: "待审核", value: moduleStats.finance.pending },
      ],
      actions: [
        { label: "财务总览", to: "/finance/overview" },
        { label: "票据审核", to: "/finance/invoices" },
      ],
    },
    {
      title: "印章管控",
      to: "/seal/applications",
      icon: Stamp,
      color: "bg-amber-100 text-amber-700",
      stats: [
        { label: "待审批", value: moduleStats.seal.pending },
        { label: "使用中", value: moduleStats.seal.inUse },
        { label: "已批准", value: moduleStats.seal.approved },
      ],
      actions: [
        { label: "申请记录", to: "/seal/applications" },
        { label: "申请用章", to: "/seal/applications/new" },
      ],
    },
    {
      title: "物业协同",
      to: "/property/tickets",
      icon: Building2,
      color: "bg-trust-100 text-trust-700",
      stats: [
        { label: "待派单", value: moduleStats.property.pending },
        { label: "处理中", value: moduleStats.property.processing },
        { label: "已督办", value: moduleStats.property.escalated },
      ],
      actions: [
        { label: "工单大厅", to: "/property/tickets" },
        { label: "街道督办", to: "/property/supervision" },
      ],
    },
    {
      title: "邻里经济",
      to: "/economy/home",
      icon: Store,
      color: "bg-rose-100 text-rose-700",
      stats: [
        { label: "可置换", value: moduleStats.economy.available },
        { label: "众筹中", value: moduleStats.economy.ongoing },
        { label: "已成功", value: moduleStats.economy.success },
      ],
      actions: [
        { label: "经济首页", to: "/economy/home" },
        { label: "能量兑换", to: "/economy/exchange" },
      ],
    },
    {
      title: "基础管理",
      to: "/admin/owners",
      icon: Settings,
      color: "bg-slate-100 text-slate-700",
      stats: [
        { label: "业主管理", value: "1200户" },
        { label: "委员任期", value: "5人" },
        { label: "物业合同", value: "1份" },
      ],
      actions: [
        { label: "业主审核", to: "/admin/owners" },
        { label: "街道监管", to: "/admin/street" },
      ],
    },
  ];

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: "bg-rose-100 text-rose-700 border-rose-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      low: "bg-slate-100 text-slate-600 border-slate-200",
    };
    const labels = { high: "高优", medium: "中优", low: "低优" };
    return (
      <span
        className={cn(
          "px-2 py-0.5 text-xs rounded border",
          styles[priority as keyof typeof styles]
        )}
      >
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const getTodoIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      seal: Stamp,
      approval: FileText,
      vote: Vote,
      supervision: AlertTriangle,
      ticket: Wrench,
      verification: ShieldCheck,
    };
    return icons[type] || ClipboardList;
  };

  const getTodoActionTitle = (type: string) => {
    const titles: Record<string, string> = {
      seal: "主任审批",
      approval: "票据复核",
      vote: "投票参与",
      supervision: "街道执行反馈",
      ticket: "工单处理",
      verification: "业主核验",
    };
    return titles[type] || "办理";
  };

  const getTodoData = (todo: TodoItem) => {
    switch (todo.type) {
      case "seal":
        return { type: "seal", data: sealApplications.find((s) => s.id === todo.relatedId) } as const;
      case "approval":
        return { type: "approval", data: invoices.find((i) => i.id === todo.relatedId) } as const;
      case "vote":
        return { type: "vote", data: motions.find((m) => m.id === todo.relatedId) } as const;
      case "supervision":
        return { type: "supervision", data: repairTickets.find((t) => t.id === todo.relatedId) } as const;
      case "ticket":
        return { type: "ticket", data: repairTickets.find((t) => t.id === todo.relatedId) } as const;
      case "verification":
        return { type: "verification", data: owners.filter((o) => o.verifyStatus === "pending").slice(0, 3) } as const;
      default:
        return null;
    }
  };

  const handleTodoClick = (todo: TodoItem) => {
    const data = getTodoData(todo);
    if (data && data.data) {
      setTodoModal(data);
    }
  };

  const handleSealApprove = (id: string, approved: boolean) => {
    updateSealApplication(id, {
      status: approved ? "approved" : "rejected",
      approver: useAppStore.getState().currentUser.id,
      approverName: useAppStore.getState().currentUser.name,
      approveTime: new Date().toISOString(),
      rejectReason: approved ? undefined : "材料不齐全",
    });
    const todo = todos.find((t) => t.relatedId === id);
    if (todo) updateTodoStatus(todo.id, true);
    setTodoModal(null);
  };

  const handleInvoiceVerify = (id: string) => {
    verifyInvoice(id);
    const todo = todos.find((t) => t.relatedId === id);
    if (todo) updateTodoStatus(todo.id, true);
    setTodoModal(null);
  };

  const handleVote = (motionId: string, vote: "agree" | "disagree" | "abstain") => {
    castVote(motionId, vote);
    const todo = todos.find((t) => t.relatedId === motionId);
    if (todo) updateTodoStatus(todo.id, true);
    setTodoModal(null);
  };

  const handleSupervisionFeedback = (id: string, feedback: string) => {
    updateRepairTicket(id, {
      superviseRecord: {
        ...(repairTickets.find((t) => t.id === id)?.superviseRecord || {}),
        feedback,
        feedbackTime: new Date().toISOString(),
        status: "completed",
      } as any,
      status: "processing",
    });
    const todo = todos.find((t) => t.relatedId === id);
    if (todo) updateTodoStatus(todo.id, true);
    setTodoModal(null);
  };

  const handleOwnerVerify = (ownerId: string, verified: boolean) => {
    // In real implementation, update owner status
    const todo = todos.find((t) => t.relatedId?.includes(ownerId));
    if (todo) updateTodoStatus(todo.id, true);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const anomalyCount = healthIndicators.filter((i) => i.hasAnomaly).length;
  const highRiskCount = healthIndicators.filter(
    (i) => i.hasAnomaly && (i.value / i.target) < 0.9
  ).length;

  const getRiskBadgeVariant = (indicator: HealthIndicator) => {
    const ratio = indicator.value / indicator.target;
    if (ratio < 0.8) return "danger";
    if (ratio < 0.9) return "warning";
    return "success";
  };

  const getRiskLabel = (indicator: HealthIndicator) => {
    const ratio = indicator.value / indicator.target;
    if (ratio < 0.8) return "高风险";
    if (ratio < 0.9) return "中风险";
    return "低风险";
  };

  const coreIndicators = communityHealth.indicators.slice(0, 3);

  return (
    <m.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-slate-50 to-primary-50"
    >
      <m.div variants={item}>
        <h1 className="text-2xl font-bold text-primary-800">工作台</h1>
        <p className="text-sm text-slate-500 mt-1">
          欢迎回来，今天是 {todayLabel}
        </p>
      </m.div>

      <AnimatePresence>
        {anomalyCount > 0 && (
          <m.div
            variants={item}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          >
            <m.div
              whileHover={{ scale: 1.002 }}
              onClick={() => setExpandedIndicator(healthIndicators.find((i) => i.hasAnomaly)?.name || null)}
              className={cn(
                "cursor-pointer p-4 rounded-xl shadow-lg hover:shadow-xl transition-all",
                highRiskCount > 0
                  ? "bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white"
                  : "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {highRiskCount > 0 ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-base">
                      检测到 {anomalyCount} 项异常指标 · {highRiskCount} 项高风险
                    </p>
                    <p className="text-sm text-white/80 mt-0.5">
                      包含：{healthIndicators.filter((i) => i.hasAnomaly).map((i) => i.name).join("、")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">快速查看</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <m.div variants={item} className="grid grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <m.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-slate-800">
                      {card.prefix}
                      {card.value}
                    </span>
                    <span className="text-sm text-slate-500">
                      {card.suffix}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : card.trend < 0 ? (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    ) : null}
                    <span
                      className={cn(
                        "text-xs",
                        card.trend > 0
                          ? "text-emerald-600"
                          : card.trend < 0
                          ? "text-rose-600"
                          : "text-slate-500"
                      )}
                    >
                      {card.trend > 0 ? "+" : ""}
                      {card.trend}%
                    </span>
                    <span className="text-xs text-slate-400">较上月</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    card.color
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </m.div>
          );
        })}
      </m.div>

      <div className="grid grid-cols-12 gap-6">
        <m.div
          variants={item}
          className="col-span-5 space-y-6"
        >
          <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-800">
                健康度评估
              </h3>
              <Badge variant="primary">三维度综合评估</Badge>
            </div>
            <div className="relative">
              <ReactECharts option={radarOption} style={{ height: "280px" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold text-primary-700">
                  {communityHealth.overallScore}
                </div>
                <div className="text-sm font-medium text-trust-600 bg-trust-50 px-2 py-0.5 rounded mt-1">
                  {communityHealth.level === "excellent"
                    ? "优秀"
                    : communityHealth.level === "good"
                    ? "良好"
                    : communityHealth.level === "fair"
                    ? "一般"
                    : "较差"}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2">
                健康度趋势（近12个月）
              </h4>
              <ReactECharts option={lineOption} style={{ height: "120px" }} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">
              核心指标详情
            </h3>
            <div className="space-y-3">
              {coreIndicators.map((indicator, idx) => {
                const anomalyCount = anomalyData[indicator.name]?.filter(
                  (a) => a.riskLevel === "high"
                ).length || 0;
                const rectificationCount =
                  rectificationData[indicator.name]?.length || 0;
                return (
                  <m.div
                    key={idx}
                    whileHover={{ x: 4, scale: 1.005 }}
                    onClick={() =>
                      setHealthDetailModal({
                        indicator: indicator.name,
                        value: indicator.value,
                        target: indicator.target,
                        unit: indicator.unit,
                      })
                    }
                    className="p-3 rounded-lg bg-slate-50 hover:bg-primary-50 cursor-pointer transition-colors border border-transparent hover:border-primary-200 relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {indicator.name}
                        </span>
                        {anomalyCount > 0 && (
                          <Badge variant="danger" size="sm">
                            {anomalyCount}项异常
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary-700">
                          {indicator.value}
                          {indicator.unit}
                        </span>
                        <span className="text-xs text-slate-400">
                          / 目标 {indicator.target}
                          {indicator.unit}
                        </span>
                        {indicator.trend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : indicator.trend === "down" ? (
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        ) : (
                          <CircleDot className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={indicator.value}
                        max={100}
                        variant="primary"
                        size="sm"
                      />
                      <span className="text-xs text-primary-600 whitespace-nowrap">
                        {((indicator.value / indicator.target) * 100).toFixed(0)}%
                      </span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="absolute left-0 right-0 -bottom-1 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                      <div className="mt-1 mx-auto w-fit bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <FileSearch className="w-3 h-3" />
                            查看明细
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            异常({anomalyCount})
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3 text-amber-400" />
                            整改({rectificationCount})
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            复查
                          </span>
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </m.div>

        <m.div
          variants={item}
          className="col-span-4 bg-white rounded-xl p-5 shadow-card border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-800">
              待办事项
            </h3>
            <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
              共 {todos.length} 条
            </span>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {todos.slice(0, 6).map((todo, idx) => {
              const Icon = getTodoIcon(todo.type);
              const remaining = todo.deadline
                ? getTimeRemaining(todo.deadline)
                : null;
              const actionTitle = getTodoActionTitle(todo.type);
              return (
                <m.div
                  key={todo.id}
                  whileHover={{ x: 4 }}
                  onClick={() => handleTodoClick(todo)}
                  className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-primary-100"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    {idx < todos.length - 1 && (
                      <div className="absolute top-full left-1/2 w-px h-3 bg-slate-200 -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {todo.title}
                      </span>
                      {getPriorityBadge(todo.priority)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {todo.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {remaining && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            剩余 {remaining.days}天{remaining.hours}小时
                          </span>
                        </div>
                      )}
                      <Badge variant="info" size="sm">
                        {actionTitle}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                </m.div>
              );
            })}
          </div>
        </m.div>

        <m.div variants={item} className="col-span-3 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">
              快捷入口 · 业务明细
            </h3>
            <div className="space-y-3">
              {quickEntries.slice(0, 5).map((entry, idx) => {
                const Icon = entry.icon;
                return (
                  <m.div
                    key={idx}
                    whileHover={{ x: 4 }}
                    onMouseEnter={() => setModuleDetail(entry.title)}
                    onMouseLeave={() => setModuleDetail(null)}
                    className="group"
                  >
                    <Link
                      to={entry.to}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white hover:shadow-card cursor-pointer transition-all duration-300 border border-transparent hover:border-primary-200"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          entry.color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">
                            {entry.title}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {entry.stats.slice(0, 2).map((stat, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-xs text-slate-500"
                            >
                              {stat.label}
                              <span className="text-primary-600 font-medium ml-1">
                                {stat.value}
                              </span>
                            </span>
                          ))}
                        </div>
                        <AnimatePresence>
                          {moduleDetail === entry.title && (
                            <m.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 pt-2 border-t border-slate-200"
                            >
                              <div className="flex gap-2">
                                {entry.actions.map((action, aIdx) => (
                                  <Link
                                    key={aIdx}
                                    to={action.to}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 text-xs py-1.5 px-2 bg-primary-50 text-primary-700 rounded text-center hover:bg-primary-100 transition-colors"
                                  >
                                    {action.label}
                                  </Link>
                                ))}
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-800">
                最近议案
              </h3>
              <Link
                to="/council/motions"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {motions.slice(0, 4).map((motion, idx) => {
                const statusInfo = getMotionStatusLabel(motion.status);
                const hasBlockchain = !!motion.blockchainHash;
                return (
                  <m.div
                    key={motion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    whileHover={{ x: 2 }}
                    onClick={() => navigate(`/council/${motion.id}`)}
                    className="p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">
                            Y2025-{String(idx + 1).padStart(3, "0")}
                          </span>
                          <Badge
                            variant={
                              motion.voteType === "realname"
                                ? "info"
                                : "secondary"
                            }
                            size="sm"
                          >
                            {motion.voteType === "realname" ? "实名" : "匿名"}
                          </Badge>
                          <span
                            className={cn(
                              "px-2 py-0.5 text-xs rounded-full font-medium",
                              statusInfo.bgColor,
                              statusInfo.color
                            )}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {motion.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMotionModal({
                              type: "attachment",
                              data: motion,
                              title: "附件公示",
                            });
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                          title={`${motion.attachments.length}个附件`}
                        >
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          {motion.attachments.length > 0 && (
                            <span className="sr-only">
                              {motion.attachments.length}
                            </span>
                          )}
                        </button>
                        {motion.attachments.length > 0 && (
                          <span className="text-xs text-slate-500 mr-1">
                            {motion.attachments.length}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasBlockchain) {
                              setMotionModal({
                                type: "chain",
                                data: motion,
                                title: "链上存证",
                              });
                            }
                          }}
                          className={cn(
                            "p-1.5 rounded transition-colors",
                            hasBlockchain
                              ? "hover:bg-emerald-50 hover:text-emerald-600"
                              : "opacity-40 cursor-not-allowed"
                          )}
                          title={hasBlockchain ? "查看链上存证" : "未存证"}
                        >
                          {hasBlockchain ? (
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMotionModal({
                              type: "review",
                              data: motion,
                              title: "表决复查",
                            });
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                          title="查看表决复查记录"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between items-center mt-2">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Vote className="w-3 h-3" />
                          <span>
                            {motion.voteStats.votedCount}/
                            {motion.voteStats.totalVoters}
                          </span>
                        </div>
                        <ProgressBar
                          value={
                            (motion.voteStats.votedCount /
                              motion.voteStats.totalVoters) *
                            100
                          }
                          max={100}
                          variant="primary"
                          size="sm"
                          className="w-20"
                        />
                      </div>
                      <span className="text-xs text-primary-600 font-medium">
                        查看详情
                      </span>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </m.div>
      </div>

      <AnimatePresence>
        {todoModal && (
          <Modal
            isOpen={true}
            onClose={() => setTodoModal(null)}
            title={getTodoActionTitle(todoModal.type)}
            size="lg"
          >
            {todoModal.type === "seal" && todoModal.data && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">
                    用章申请信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-amber-600">申请人：</span>
                      <span className="text-amber-900">
                        {todoModal.data.applicantName}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-600">印章类型：</span>
                      <span className="text-amber-900">
                        {todoModal.data.sealType === "official"
                          ? "公章"
                          : todoModal.data.sealType === "finance"
                          ? "财务专用章"
                          : "合同专用章"}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-600">使用时间：</span>
                      <span className="text-amber-900">
                        {formatDate(todoModal.data.useTime, "YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-600">预计归还：</span>
                      <span className="text-amber-900">
                        {formatDate(todoModal.data.expectReturnTime, "YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-amber-600">申请事由：</span>
                    <p className="text-amber-900 mt-1">
                      {todoModal.data.reason}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="default"
                    onClick={() => setTodoModal(null)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      handleSealApprove(todoModal.data!.id, false)
                    }
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    拒绝
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() =>
                      handleSealApprove(todoModal.data!.id, true)
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    批准
                  </Button>
                </div>
              </div>
            )}

            {todoModal.type === "approval" && todoModal.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <img
                      src={todoModal.data.imageUrl}
                      alt="票据"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">
                        OCR 识别结果
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">票据号</span>
                          <span className="font-medium">
                            {todoModal.data.invoiceNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">金额</span>
                          <span className="font-medium text-rose-600">
                            ¥{todoModal.data.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">供应商</span>
                          <span className="font-medium">
                            {todoModal.data.vendor}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">识别置信度</span>
                          <span className="font-medium text-emerald-600">
                            {todoModal.data.ocrResult?.confidence
                              ? (todoModal.data.ocrResult.confidence * 100).toFixed(0) + "%"
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <div className="text-sm">
                        <span className="text-primary-600">归属科目：</span>
                        <span className="text-primary-800 font-medium">
                          {todoModal.data.accountName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {todoModal.data.ocrResult?.items && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            项目名称
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            数量
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            单价
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            小计
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {todoModal.data.ocrResult.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-right">
                              ¥{item.unitPrice.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              ¥
                              {(item.quantity * item.unitPrice).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="default"
                    onClick={() => setTodoModal(null)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleInvoiceVerify(todoModal.data!.id)}
                  >
                    <FileCheck className="w-4 h-4 mr-1" />
                    确认复核通过
                  </Button>
                </div>
              </div>
            )}

            {todoModal.type === "vote" && todoModal.data && (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <h4 className="font-semibold text-primary-800 mb-2">
                    {todoModal.data.title}
                  </h4>
                  <p className="text-sm text-primary-700 line-clamp-3">
                    {todoModal.data.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-primary-600">
                      投票类型：
                      {todoModal.data.voteType === "realname" ? "实名" : "匿名"}
                    </span>
                    <span className="text-primary-600">
                      截止时间：
                      {formatDate(todoModal.data.voteEnd, "YYYY-MM-DD HH:mm")}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-emerald-600">
                      {todoModal.data.voteStats.agreeCount}
                    </div>
                    <div className="text-sm text-slate-500">赞成</div>
                    <ProgressBar
                      value={
                        (todoModal.data.voteStats.agreeCount /
                          todoModal.data.voteStats.totalVoters) *
                        100
                      }
                      variant="primary"
                      className="mt-2"
                    />
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-rose-600">
                      {todoModal.data.voteStats.disagreeCount}
                    </div>
                    <div className="text-sm text-slate-500">反对</div>
                    <ProgressBar
                      value={
                        (todoModal.data.voteStats.disagreeCount /
                          todoModal.data.voteStats.totalVoters) *
                        100
                      }
                      variant="danger"
                      className="mt-2"
                    />
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-slate-600">
                      {todoModal.data.voteStats.abstainCount}
                    </div>
                    <div className="text-sm text-slate-500">弃权</div>
                    <ProgressBar
                      value={
                        (todoModal.data.voteStats.abstainCount /
                          todoModal.data.voteStats.totalVoters) *
                        100
                      }
                      variant="warning"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="text-center text-sm text-slate-500">
                  已投票 {todoModal.data.voteStats.votedCount} /{" "}
                  {todoModal.data.voteStats.totalVoters} 人（
                  {(
                    (todoModal.data.voteStats.votedCount /
                      todoModal.data.voteStats.totalVoters) *
                    100
                  ).toFixed(1)}
                  %）
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() =>
                      handleVote(todoModal.data!.id, "agree")
                    }
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    赞成
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() =>
                      handleVote(todoModal.data!.id, "disagree")
                    }
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    反对
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => handleVote(todoModal.data!.id, "abstain")}
                  >
                    <MinusCircle className="w-5 h-5 mr-2" />
                    弃权
                  </Button>
                </div>
              </div>
            )}

            {todoModal.type === "supervision" && todoModal.data && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-rose-800">
                        街道督办指令
                      </h4>
                      <p className="text-sm text-rose-700 mt-1">
                        {todoModal.data.superviseRecord?.instruction}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-rose-600">
                          督办人：{todoModal.data.superviseRecord?.officerName}
                        </span>
                        <span className="text-rose-600">
                          截止时间：
                          {formatDate(
                            todoModal.data.superviseRecord?.deadline || "",
                            "YYYY-MM-DD HH:mm"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-2">
                    工单信息：{todoModal.data.title}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {todoModal.data.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-slate-500">
                      位置：{todoModal.data.location}
                    </span>
                    <span className="text-slate-500">
                      提交人：{todoModal.data.submitterName}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    执行反馈
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={4}
                    placeholder="请输入处理进展和结果..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="default"
                    onClick={() => setTodoModal(null)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() =>
                      handleSupervisionFeedback(todoModal.data!.id, "已安排人员处理，预计2小时内完成")
                    }
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    提交反馈
                  </Button>
                </div>
              </div>
            )}

            {todoModal.type === "verification" &&
              Array.isArray(todoModal.data) && (
                <div className="space-y-4">
                  <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-sm text-primary-700">
                      共 <span className="font-semibold">{todoModal.data.length}</span> 位业主等待认证审核
                    </p>
                  </div>
                  {todoModal.data.map((owner, idx) => (
                    <div
                      key={owner.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50"
                    >
                      <img
                        src={owner.avatar}
                        alt={owner.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {owner.name}
                          </span>
                          <Badge variant="warning">{owner.building}栋{owner.unit}单元{owner.room}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-slate-500">
                            房产证：
                            {owner.propertyCertVerified ? (
                              <span className="text-emerald-600">已核验</span>
                            ) : (
                              <span className="text-rose-600">待核验</span>
                            )}
                          </span>
                          <span className="text-slate-500">
                            人脸：
                            {owner.faceVerified ? (
                              <span className="text-emerald-600">已核验</span>
                            ) : (
                              <span className="text-rose-600">待核验</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOwnerVerify(owner.id, false)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看资料
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOwnerVerify(owner.id, true)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          通过
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="default"
                      onClick={() => setTodoModal(null)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        todoModal.data!.forEach((o) =>
                          handleOwnerVerify(o.id, true)
                        );
                        setTodoModal(null);
                      }}
                    >
                      批量通过
                    </Button>
                  </div>
                </div>
              )}
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {motionModal && (
          <Modal
            isOpen={true}
            onClose={() => {
              setMotionModal(null);
              setMotionCopied(false);
            }}
            title={`${motionModal.title} · ${motionModal.data.title.slice(0, 20)}`}
            size="lg"
          >
            {motionModal.type === "attachment" && (
              <div className="space-y-4">
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <p className="text-sm text-primary-700">
                    本议案共包含{" "}
                    <span className="font-semibold">
                      {motionModal.data.attachments.length}
                    </span>{" "}
                    份附件，已全部完成区块链存证公示
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {motionModal.data.attachments.map((att, idx) => (
                    <m.div
                      key={att.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border rounded-xl hover:border-primary-300 hover:bg-primary-50/40 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                          {att.type === "pdf" ? (
                            <FileText className="w-5 h-5" />
                          ) : att.type === "image" ? (
                            <FileImage className="w-5 h-5" />
                          ) : att.type === "excel" ? (
                            <FileSpreadsheet className="w-5 h-5" />
                          ) : (
                            <File className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate group-hover:text-primary-700 transition-colors">
                            {att.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{att.size}</span>
                            <span>{formatDate(new Date(), "YYYY-MM-DD")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          预览
                        </Button>
                        <Button variant="primary" size="sm" className="flex-1">
                          <Download className="w-3.5 h-3.5 mr-1" />
                          下载
                        </Button>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>
            )}

            {motionModal.type === "chain" && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">
                        已完成区块链存证
                      </p>
                      <p className="text-sm text-emerald-600">
                        投票结果已写入 21 个共识节点，不可篡改
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">交易哈希</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-slate-800 font-mono truncate flex-1">
                        {motionModal.data.blockchainHash}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            motionModal.data!.blockchainHash || ""
                          );
                          setMotionCopied(true);
                          setTimeout(() => setMotionCopied(false), 2000);
                        }}
                        className="p-1.5 rounded hover:bg-slate-200 transition-colors"
                      >
                        {motionCopied ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">区块高度</p>
                    <p className="text-lg font-semibold text-slate-800">
                      #18,456,892
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">上链时间</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(motionModal.data.voteEnd, "YYYY-MM-DD HH:mm:ss")}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">共识验证</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      21/21 节点已验证 ✓
                    </p>
                  </div>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    链上验证流程
                  </p>
                  <div className="flex items-center justify-between">
                    {["提交", "广播", "共识", "打包", "完成"].map((step, idx) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                              idx < 5
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-500"
                            )}
                          >
                            {idx < 5 ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className="text-xs text-slate-600 mt-1">
                            {step}
                          </span>
                        </div>
                        {idx < 4 && (
                          <div className="flex-1 h-0.5 mx-1 bg-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {motionModal.type === "review" && (
              <div className="space-y-4">
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <p className="text-sm text-primary-700">
                    本议案表决记录已完成全部复查流程，共{" "}
                    <span className="font-semibold">4</span> 个复查节点
                  </p>
                </div>
                <div className="space-y-1">
                  {[
                    {
                      id: "1",
                      operator: "张明华",
                      action: "发起议案投票",
                      timestamp: motionModal.data.voteStart,
                      remark: "已完成议案起草和公示，正式发起业主投票",
                      status: "完成",
                    },
                    {
                      id: "2",
                      operator: "系统自动",
                      action: "投票截止统计",
                      timestamp: motionModal.data.voteEnd,
                      remark: `共 ${motionModal.data.voteStats.votedCount} 位业主参与投票，投票率 ${formatPercent((motionModal.data.voteStats.votedCount / motionModal.data.voteStats.totalVoters) * 100)}`,
                      status: "完成",
                    },
                    {
                      id: "3",
                      operator: "业委会集体",
                      action: "表决结果公示",
                      timestamp: motionModal.data.voteEnd,
                      remark: `赞成 ${motionModal.data.voteStats.agreeCount} / 反对 ${motionModal.data.voteStats.disagreeCount} / 弃权 ${motionModal.data.voteStats.abstainCount}，表决通过`,
                      status: "完成",
                    },
                    {
                      id: "4",
                      operator: "街道办",
                      action: "复查确认",
                      timestamp: motionModal.data.voteEnd,
                      remark: "符合《物业管理条例》相关规定，结果合法有效，已备案",
                      status: "完成",
                    },
                  ].map((record, idx) => (
                    <div key={record.id} className="flex gap-3">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full mt-2",
                            idx === 3
                              ? "bg-emerald-500 pulse-dot"
                              : "bg-primary-500"
                          )}
                        />
                        {idx < 3 && (
                          <div className="absolute top-full left-1/2 w-px h-10 bg-slate-200 -translate-x-1/2" />
                        )}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">
                              {record.action}
                            </span>
                            <Badge
                              variant={
                                record.status === "完成"
                                  ? "success"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {record.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDate(record.timestamp, "YYYY-MM-DD HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          操作人：{record.operator}
                        </p>
                        <p className="text-sm text-slate-600 mt-1 p-2 bg-slate-50 rounded">
                          {record.remark}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {healthDetailModal && (
          <Modal
            isOpen={true}
            onClose={() => {
              setHealthDetailModal(null);
              setShowReviewForm(false);
            }}
            title={`${healthDetailModal.indicator} · 评估详情`}
            size="xl"
          >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <Calculator className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-sm text-slate-500">当前值</div>
              <div className="text-2xl font-bold text-primary-700 mt-1">
                {healthDetailModal.value}
                {healthDetailModal.unit}
              </div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <Target className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-sm text-slate-500">目标值</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {healthDetailModal.target}
                {healthDetailModal.unit}
              </div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-sm text-slate-500">完成率</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {(
                  (healthDetailModal.value / healthDetailModal.target) *
                  100
                ).toFixed(0)}
                %
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              计算口径
            </h4>
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-sm text-slate-700">
                {
                  healthDetailData[healthDetailModal.indicator as keyof typeof healthDetailData]
                    ?.formula
                }
              </code>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" />
              数据来源明细
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {healthDetailData[
                healthDetailModal.indicator as keyof typeof healthDetailData
              ]?.dataSource.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-rose-100 rounded-lg p-4 bg-rose-50/30">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              异常原因分析
              <Badge variant="danger" size="sm">
                {anomalyData[healthDetailModal.indicator]?.length || 0}项
              </Badge>
            </h4>
            <div className="space-y-3">
              {anomalyData[healthDetailModal.indicator]?.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="p-3 bg-white rounded-lg border border-rose-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          anomaly.riskLevel === "high"
                            ? "danger"
                            : anomaly.riskLevel === "medium"
                            ? "warning"
                            : "default"
                        }
                      >
                        {anomaly.riskLevel === "high"
                          ? "高风险"
                          : anomaly.riskLevel === "medium"
                          ? "中风险"
                          : "低风险"}
                      </Badge>
                      <span className="text-sm font-medium text-slate-800">
                        {anomaly.title}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2">
                    <div className="grid grid-cols-4 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-slate-500">影响范围</span>
                        <p className="text-slate-700 font-medium mt-0.5">
                          {anomaly.affectedArea}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">影响户数</span>
                        <p className="text-slate-700 font-medium mt-0.5">
                          {anomaly.affectedHouseholds}户
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">持续时间</span>
                        <p className="text-slate-700 font-medium mt-0.5">
                          {anomaly.duration}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">建议责任人</span>
                        <p className="text-slate-700 font-medium mt-0.5">
                          {anomaly.suggestedOwner}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!anomalyData[healthDetailModal.indicator]?.length && (
                <div className="p-4 text-center text-slate-500 text-sm">
                  暂无异常项
                </div>
              )}
            </div>
          </div>

          <div className="border-2 border-amber-100 rounded-lg p-4 bg-amber-50/30">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              整改跟踪
              <Badge variant="warning" size="sm">
                {rectificationData[healthDetailModal.indicator]?.length || 0}项
              </Badge>
            </h4>
            <div className="overflow-hidden rounded-lg border border-amber-200">
              <table className="w-full text-sm">
                <thead className="bg-amber-100/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">整改事项</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">责任人</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">截止日期</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700 w-32">进度</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">状态</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {rectificationData[healthDetailModal.indicator]?.map((task) => (
                    <tr key={task.id} className="bg-white">
                      <td className="px-3 py-3 font-medium text-slate-800">{task.name}</td>
                      <td className="px-3 py-3 text-slate-600">{task.owner}</td>
                      <td className="px-3 py-3 text-slate-600">{task.deadline}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={task.progress}
                            max={100}
                            variant={
                              task.status === "已完成" ? "success" : "warning"}
                            size="sm"
                          />
                          <span className="text-xs text-slate-600">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant={
                            task.status === "已完成"
                              ? "success"
                              : task.status === "进行中"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-primary-600" />
                复查记录
              </h4>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                发起街道复查
              </Button>
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 mb-3 rounded-lg border-2 border-primary-100 bg-primary-50/50 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          复查类型
                        </label>
                        <select
                          value={reviewForm.type}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                          <option>例行复查</option>
                          <option>专项复查</option>
                          <option>异常复查</option>
                          <option>整改复查</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          附件上传
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="选择文件..."
                            value={reviewForm.attachment}
                            onChange={(e) =>
                              setReviewForm({ ...reviewForm, attachment: e.target.value })
                            }
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          />
                          <Button variant="default" size="sm">
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        复查说明
                      </label>
                      <textarea
                        value={reviewForm.remark}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, remark: e.target.value })
                        }
                        rows={3}
                        placeholder="请输入复查说明..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowReviewForm(false)}
                      >
                        取消
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSubmitReview}>
                        <Paperclip className="w-4 h-4 mr-1" />
                        提交复查
                      </Button>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 mt-3">
              {getMergedReviewRecords(healthDetailModal.indicator).map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        record.result === "数据正常"
                          ? "bg-emerald-500"
                          : record.result === "数据修正"
                          ? "bg-amber-500"
                          : "bg-primary-500"
                      )}
                    />
                    {idx <
                      getMergedReviewRecords(healthDetailModal.indicator).length - 1 && (
                      <div className="absolute top-full left-1/2 w-px h-6 bg-slate-300 -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">
                        {record.date} · {record.operator}
                      </span>
                      <Badge
                        variant={
                          record.result === "数据正常"
                            ? "success"
                            : record.result === "数据修正"
                            ? "warning"
                            : "primary"
                        }
                      >
                        {record.result}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{record.remark}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => {
                setHealthDetailModal(null);
                setShowReviewForm(false);
              }}
            >
              关闭
            </Button>
          </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  </m.div>
);
};

export default Dashboard;
