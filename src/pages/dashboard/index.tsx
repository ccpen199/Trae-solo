import ReactECharts from "echarts-for-react";
import { motion as m, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppStore } from "@/stores";
import { cn, formatPercent, getTimeRemaining, formatDate } from "@/utils";
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
} from "lucide-react";

type TodoModalType =
  | { type: "seal"; data: SealApplication }
  | { type: "approval"; data: Invoice }
  | { type: "vote"; data: Motion }
  | { type: "supervision"; data: RepairTicket }
  | { type: "ticket"; data: RepairTicket }
  | { type: "verification"; data: Owner[] }
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
              {coreIndicators.map((indicator, idx) => (
                <m.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  onClick={() =>
                    setHealthDetailModal({
                      indicator: indicator.name,
                      value: indicator.value,
                      target: indicator.target,
                      unit: indicator.unit,
                    })
                  }
                  className="p-3 rounded-lg bg-slate-50 hover:bg-primary-50 cursor-pointer transition-colors border border-transparent hover:border-primary-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-800">
                      {indicator.name}
                    </span>
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
                </m.div>
              ))}
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
            <h3 className="text-lg font-semibold text-primary-800 mb-4">
              最近动态
            </h3>
            <div className="space-y-3">
              {todos.slice(0, 3).map((todo, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 pulse-dot" />
                    {idx < 2 && (
                      <div className="absolute top-full left-1/2 w-px h-6 bg-slate-200 -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{todo.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(todo.createdAt, "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
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
        {healthDetailModal && (
          <Modal
            isOpen={true}
            onClose={() => setHealthDetailModal(null)}
            title={`${healthDetailModal.indicator} · 评估详情`}
            size="lg"
          >
            <div className="space-y-6">
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

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-600" />
                  复查记录
                </h4>
                <div className="space-y-3">
                  {healthDetailData[
                    healthDetailModal.indicator as keyof typeof healthDetailData
                  ]?.reviewRecords.map((record, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                        {idx < 2 && (
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
                                : "warning"
                            }
                          >
                            {record.result}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {record.remark}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setHealthDetailModal(null)}
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
