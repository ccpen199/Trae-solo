import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  Check,
  X,
  Play,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Hash,
  Users,
  Building2,
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  Shield,
  UserCheck,
  Link2,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Calendar,
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  ProgressBar,
  DataTable,
  type Column,
} from "@/components/ui";
import { cn, formatCurrency, formatDate, formatPercent } from "@/utils";
import type { AuditReport, Invoice } from "@/types";

const generateSteps = [
  { key: 1, label: "数据采集", icon: FileText },
  { key: 2, label: "科目核对", icon: CheckCircle2 },
  { key: 3, label: "异常检测", icon: AlertTriangle },
  { key: 4, label: "报告生成", icon: FileSearch },
  { key: 5, label: "数字签名", icon: Shield },
];

const conclusionMap: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger"; color: string }
> = {
  pass: { label: "标准无保留意见", variant: "success", color: "emerald" },
  qualified: { label: "带强调事项段", variant: "warning", color: "amber" },
  adverse: { label: "否定意见", variant: "danger", color: "rose" },
};

const severityMap: Record<
  string,
  { variant: "success" | "warning" | "danger"; label: string }
> = {
  low: { variant: "success", label: "低风险" },
  medium: { variant: "warning", label: "中风险" },
  high: { variant: "danger", label: "高风险" },
};

interface Toast {
  show: boolean;
  type: "success" | "error" | "info";
  message: string;
}

export default function AuditReportPage() {
  const {
    auditReport,
    financeAccounts,
    isGeneratingAuditReport,
    auditGenerateProgress,
    auditGenerateStep,
    generateAuditReport,
    acceptAuditReport,
    showToast,
  } = useAppStore();

  const [accepted, setAccepted] = useState(false);
  const [toast, setToast] = useState<Toast>({ show: false, type: "success", message: "" });
  const [activeSection, setActiveSection] = useState<"info" | "opinion" | "anomalies" | "metrics">("info");

  const conclusion = conclusionMap[auditReport.conclusion] || conclusionMap.pass;

  const showMessage = (type: Toast["type"], message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "success", message: "" }), 3000);
    showToast(type, message);
  };

  const handleGenerate = async () => {
    showMessage("info", "正在生成审计报告...");
    await generateAuditReport();
    showMessage("success", "审计报告生成完成！");
  };

  const handleAccept = () => {
    acceptAuditReport();
    setAccepted(true);
    showMessage("success", "审计报告已验收确认！");
  };

  const financialMetrics = useMemo(() => {
    const income = financeAccounts.filter((a) => a.type === "income");
    const expense = financeAccounts.filter((a) => a.type === "expense");
    const sumBudget = (arr: typeof income) => arr.reduce((s, a) => s + a.budget, 0);
    const sumActual = (arr: typeof income) => arr.reduce((s, a) => s + a.actual, 0);

    const incomeActual = sumActual(income);
    const incomeBudget = sumBudget(income);
    const expenseActual = sumActual(expense);
    const expenseBudget = sumBudget(expense);
    const balanceActual = incomeActual - expenseActual;
    const balanceBudget = incomeBudget - expenseBudget;
    const lastPeriodIncome = incomeActual * 0.92;
    const lastPeriodExpense = expenseActual * 0.95;
    const lastPeriodBalance = lastPeriodIncome - lastPeriodExpense;

    return [
      {
        name: "总收入",
        current: incomeActual,
        previous: lastPeriodIncome,
        budget: incomeBudget,
        unit: "元",
      },
      {
        name: "总支出",
        current: expenseActual,
        previous: lastPeriodExpense,
        budget: expenseBudget,
        unit: "元",
      },
      {
        name: "结余",
        current: balanceActual,
        previous: lastPeriodBalance,
        budget: balanceBudget,
        unit: "元",
      },
      {
        name: "预算执行率",
        current: (expenseActual / expenseBudget) * 100,
        previous: 94.2,
        budget: 100,
        unit: "%",
      },
    ];
  }, [financeAccounts]);

  const anomalyColumns: Column<AuditReport["anomalies"][number]>[] = [
    {
      key: "type",
      title: "异常类型",
      dataIndex: "type",
      width: 120,
      render: (v) => (
        <Badge variant="warning" size="sm">
          {v as string}
        </Badge>
      ),
    },
    {
      key: "description",
      title: "问题描述",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      key: "severity",
      title: "风险等级",
      dataIndex: "severity",
      width: 100,
      align: "center",
      render: (v) => {
        const info = severityMap[v as string] || severityMap.low;
        return <Badge variant={info.variant} size="sm" dot>{info.label}</Badge>;
      },
    },
    {
      key: "related",
      title: "影响科目",
      dataIndex: "relatedInvoiceId",
      width: 120,
      render: (v) => <span className="text-xs text-slate-600">{(v as string) || "-"}</span>,
    },
    {
      key: "suggestion",
      title: "处理建议",
      dataIndex: "description",
      width: 180,
      render: () => (
        <span className="text-xs text-primary-600 flex items-center gap-1">
          <Info className="w-3 h-3" />
          建议核查后整改
        </span>
      ),
    },
  ];

  const bannerStatus = isGeneratingAuditReport
    ? "generating"
    : auditReport.id
    ? "generated"
    : "none";

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5 relative"
    >
      <AnimatePresence>
        {toast.show && (
          <m.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={cn(
              "fixed top-6 left-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3",
              toast.type === "success" && "bg-emerald-500 text-white",
              toast.type === "error" && "bg-rose-500 text-white",
              toast.type === "info" && "bg-primary-500 text-white"
            )}
          >
            {toast.type === "success" && <Check className="w-5 h-5" />}
            {toast.type === "error" && <X className="w-5 h-5" />}
            {toast.type === "info" && <Loader2 className="w-5 h-5 animate-spin" />}
            <span className="font-medium">{toast.message}</span>
          </m.div>
        )}
      </AnimatePresence>

      <Card
        className={cn(
          "border-2 overflow-hidden",
          bannerStatus === "generating" && "border-trust-300 bg-trust-50/30",
          bannerStatus === "generated" && "border-emerald-300 bg-emerald-50/30"
        )}
      >
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  bannerStatus === "generating" && "bg-trust-100",
                  bannerStatus === "generated" && "bg-emerald-100",
                  bannerStatus === "none" && "bg-slate-100"
                )}
              >
                {bannerStatus === "generating" ? (
                  <Loader2 className="w-7 h-7 text-trust-600 animate-spin" />
                ) : bannerStatus === "generated" ? (
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                ) : (
                  <FileSearch className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  审计报告生成中心
                  {(accepted || auditReport.status === "final") && (
                    <Badge variant="success" size="sm" dot>
                      <Check className="w-3 h-3" /> 已验收
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {bannerStatus === "generating"
                    ? "正在生成审计报告，请稍候..."
                    : bannerStatus === "generated"
                    ? `${auditReport.period}审计报告已生成 · 编号: ${auditReport.id}`
                    : "尚未生成审计报告"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                disabled={bannerStatus !== "generated"}
              >
                下载PDF
              </Button>
              {bannerStatus === "generated" && !accepted && auditReport.status !== "final" ? (
                <Button leftIcon={<UserCheck className="w-4 h-4" />} onClick={handleAccept}>
                  确认审计报告
                </Button>
              ) : (
                <Button
                  leftIcon={
                    bannerStatus === "generating" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )
                  }
                  onClick={handleGenerate}
                  disabled={bannerStatus === "generating"}
                >
                  {bannerStatus === "generating" ? "生成中..." : "生成审计报告"}
                </Button>
              )}
            </div>
          </div>

          {isGeneratingAuditReport && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-5"
            >
              <div className="grid grid-cols-5 gap-3 mb-4">
                {generateSteps.map((s) => {
                  const Icon = s.icon;
                  const done = auditGenerateStep > s.key;
                  const active = auditGenerateStep === s.key;
                  return (
                    <m.div
                      key={s.key}
                      animate={active ? { scale: 1.02 } : { scale: 1 }}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg transition-all",
                        done && "bg-emerald-50 border border-emerald-200",
                        active && "bg-trust-50 border border-trust-300 shadow-sm",
                        !done && !active && "bg-slate-50 border border-slate-200"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          done && "bg-emerald-500 text-white",
                          active && "bg-trust-500 text-white",
                          !done && !active && "bg-slate-200 text-slate-500"
                        )}
                      >
                        {done ? (
                          <Check className="w-4 h-4" />
                        ) : active ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          done && "text-emerald-700",
                          active && "text-trust-700",
                          !done && !active && "text-slate-500"
                        )}
                      >
                        {s.label}
                      </span>
                    </m.div>
                  );
                })}
              </div>
              <ProgressBar
                value={auditGenerateProgress}
                variant="trust"
                size="md"
                striped
                animatedStripes
                showLabel
              />
            </m.div>
          )}
        </CardContent>
      </Card>

      {bannerStatus === "generated" && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="lg:col-span-5">
              <CardHeader className="py-3 px-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary-600" />
                  报告基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 space-y-3">
                {[
                  { icon: Hash, label: "审计编号", value: auditReport.id },
                  { icon: Clock, label: "审计期间", value: auditReport.period },
                  { icon: FileText, label: "审计范围", value: auditReport.auditScope },
                  { icon: Building2, label: "审计机构", value: auditReport.auditAgency },
                  { icon: Users, label: "注册会计师", value: auditReport.auditor },
                  { icon: FileSearch, label: "审计类型", value: "年度审计" },
                  { icon: Calendar, label: "生成时间", value: auditReport.generatedAt },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <m.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * i }}
                      className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">
                          {item.value}
                        </p>
                      </div>
                    </m.div>
                  );
                })}
                <div className="pt-2">
                  <p className="text-xs text-slate-400 mb-2">审计结论</p>
                  <Badge variant={conclusion.variant} size="lg" dot>
                    {conclusion.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardHeader className="py-3 px-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  审计结论详情
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 space-y-4">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Badge variant={conclusion.variant} size="sm">
                      意见类型
                    </Badge>
                    <span className="text-slate-800">{conclusion.label}</span>
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {auditReport.auditOpinion}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    关键审计事项
                  </h4>
                  <div className="space-y-2">
                    {auditReport.recommendations.slice(0, 3).map((r, i) => (
                      <m.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">{r}</p>
                      </m.div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-end justify-between gap-6 pb-3 border-b border-slate-100 mb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-primary-100 border-2 border-primary-300 flex items-center justify-center mb-2">
                        <Building2 className="w-7 h-7 text-primary-600" />
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        审计机构
                      </div>
                      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent mt-1" />
                      <div className="text-[10px] text-slate-500 mt-1">公章</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-2">
                        <UserCheck className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        注册会计师
                      </div>
                      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mt-1" />
                      <div className="text-[10px] text-slate-500 mt-1">签名</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Link2 className="w-3.5 h-3.5 text-trust-500" />
                          <span className="text-xs font-semibold text-slate-600">
                            区块链存证哈希
                          </span>
                        </div>
                        <code className="block text-[11px] font-mono text-trust-700 bg-trust-50 px-2 py-1 rounded break-all">
                          0x{auditReport.id}
                          a1b2c3d4e5f67890abcdef1234567890abcdef12
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 px-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                异常项清单
                <Badge variant="warning" size="sm">
                  {auditReport.anomalies.length}项
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 px-4 pb-4">
              <DataTable
                columns={anomalyColumns}
                data={auditReport.anomalies}
                rowKey={(r) => r.type + r.description}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                财务指标对比
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {financialMetrics.map((metric, i) => {
                  const diffVsPrev =
                    metric.unit === "%"
                      ? metric.current - metric.previous
                      : metric.previous !== 0
                      ? ((metric.current - metric.previous) / metric.previous) * 100
                      : 0;
                  const diffVsBudget =
                    metric.unit === "%"
                      ? metric.current - metric.budget
                      : metric.budget !== 0
                      ? ((metric.current - metric.budget) / metric.budget) * 100
                      : 0;
                  const TrendIcon =
                    Math.abs(diffVsPrev) < 1 ? Minus : diffVsPrev > 0 ? TrendingUp : TrendingDown;
                  const trendColor =
                    Math.abs(diffVsPrev) < 1
                      ? "text-slate-500"
                      : metric.name === "总支出"
                      ? diffVsPrev < 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                      : diffVsPrev > 0
                      ? "text-emerald-600"
                      : "text-rose-600";
                  return (
                    <m.div
                      key={metric.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileHover={{ y: -2 }}
                      className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-slate-600">
                          {metric.name}
                        </span>
                        <div className={cn("flex items-center gap-1", trendColor)}>
                          <TrendIcon className="w-4 h-4" />
                          <span className="text-xs font-semibold">
                            {formatPercent(Math.abs(diffVsPrev))}
                          </span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-800 mb-3">
                        {metric.unit === "%"
                          ? formatPercent(metric.current)
                          : formatCurrency(metric.current)}
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">上期</span>
                          <span className="text-slate-600 font-medium">
                            {metric.unit === "%"
                              ? formatPercent(metric.previous)
                              : formatCurrency(metric.previous)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">预算</span>
                          <span className="text-slate-600 font-medium">
                            {metric.unit === "%"
                              ? formatPercent(metric.budget)
                              : formatCurrency(metric.budget)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-400">预算差异</span>
                          <span
                            className={cn(
                              "font-semibold",
                              Math.abs(diffVsBudget) < 5
                                ? "text-slate-600"
                                : diffVsBudget > 0
                                ? "text-rose-600"
                                : "text-emerald-600"
                            )}
                          >
                            {diffVsBudget >= 0 ? "+" : ""}
                            {formatPercent(diffVsBudget)}
                          </span>
                        </div>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </m.div>
      )}
    </m.div>
  );
}
