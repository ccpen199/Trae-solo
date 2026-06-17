import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  ChevronRight, TrendingUp, TrendingDown, Wallet, FileText, FileCheck,
  Link as LinkIcon, BarChart3, Clock, AlertTriangle, CheckCircle2,
  Loader2, Eye, ArrowRight, ScanLine, Filter
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card, CardContent, CardHeader, CardTitle, CountUp, DataTable,
  ProgressBar, Badge, Button
} from "@/components/ui";
import { cn, formatCurrency, formatPercent, formatDate } from "@/utils";
import type { FinanceAccount } from "@/types";

const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const incomeData = [150000, 160000, 155000, 170000, 165000, 180000, 0, 0, 0, 0, 0, 0];
const expenseData = [120000, 130000, 125000, 140000, 135000, 150000, 0, 0, 0, 0, 0, 0];

type AuditBannerState = "pending" | "generating" | "passed" | "qualified" | "adverse";
type FilterMode = "all" | "abnormal" | "reconciled";

interface SubModuleCard { key: string; title: string; icon: any; color: string; to: string; enterText: string; }
interface TodoItemRow { id: string; item: string; module: string; status: string; statusColor: string; action: string; deadline?: string; btnText: string; btnTo: string; progress?: number; }

const subModuleCards: SubModuleCard[] = [
  { key: "invoice", title: "票据管理", icon: FileText, color: "primary", to: "/finance/invoices", enterText: "前往复核→" },
  { key: "audit", title: "审计报告", icon: FileCheck, color: "emerald", to: "/finance/audit", enterText: "查看报告→" },
  { key: "voucher", title: "凭证追溯", icon: LinkIcon, color: "trust", to: "/finance/voucher-trace", enterText: "追溯链路→" },
  { key: "execute", title: "财务执行率", icon: BarChart3, color: "amber", to: "#execution-table", enterText: "查看明细→" },
];

const todoItems: TodoItemRow[] = [
  { id: "1", item: "发票 #IN202506003", module: "票据管理", status: "OCR识别中", statusColor: "info", action: "等待识别", btnText: "查看详情", btnTo: "/finance/invoices?id=IN202506003", progress: 78 },
  { id: "2", item: "发票 #IN202506005", module: "票据管理", status: "待人工复核", statusColor: "warning", action: "复核凭证", deadline: "6月18日", btnText: "立即复核", btnTo: "/finance/invoices?id=IN202506005&action=review" },
  { id: "3", item: "6月审计报告", module: "审计报告", status: "待生成", statusColor: "secondary", action: "生成审计报告", deadline: "6月20日", btnText: "开始生成", btnTo: "/finance/audit?action=generate" },
  { id: "4", item: "凭证明细账匹配", module: "凭证追溯", status: "3张凭证待匹配", statusColor: "warning", action: "匹配票据", deadline: "6月19日", btnText: "立即匹配", btnTo: "/finance/voucher-trace?action=match" },
];

const colorMap: Record<string, { bg: string; text: string; border: string; ring: string; }> = {
  primary: { bg: "bg-primary-100", text: "text-primary-600", border: "border-l-primary-500", ring: "ring-primary-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-l-emerald-500", ring: "ring-emerald-200" },
  trust: { bg: "bg-trust-100", text: "text-trust-600", border: "border-l-trust-500", ring: "ring-trust-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-600", border: "border-l-amber-500", ring: "ring-amber-200" },
};

export default function FinanceOverview() {
  const navigate = useNavigate();
  const { financeAccounts, invoices, vouchers } = useAppStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["acc001", "acc006"]));
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const auditBannerState: AuditBannerState = "pending";

  const totalIncome = useMemo(() => invoices.filter(i => i.type === "income").reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalExpense = useMemo(() => invoices.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0), [invoices]);
  const balance = totalIncome - totalExpense;

  const toggleNode = (id: string) => setExpandedNodes(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const flattenAccounts = (accounts: FinanceAccount[]): FinanceAccount[] => {
    const result: FinanceAccount[] = [];
    const traverse = (nodes: FinanceAccount[]) => nodes.forEach(node => {
      result.push(node); if (node.children) traverse(node.children);
    });
    traverse(accounts); return result;
  };

  const getVoucherCountByAccount = (accountId: string) =>
    vouchers.reduce((cnt, v) => cnt + v.entries.filter(e => e.accountId === accountId).length, 0);

  const getInvoiceCoverage = (accountId: string) => {
    const vouchersOfAccount = vouchers.filter(v => v.entries.some(e => e.accountId === accountId));
    if (vouchersOfAccount.length === 0) return 100;
    const matched = vouchersOfAccount.filter(v => v.relatedInvoiceIds.length > 0).length;
    return Math.round((matched / vouchersOfAccount.length) * 100);
  };

  const trendOption = useMemo(() => ({
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["收入", "支出"], top: 0 },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: months },
    yAxis: [
      { type: "value", name: "收入(元)", position: "left" },
      { type: "value", name: "支出(元)", position: "right" },
    ],
    series: [
      { name: "收入", type: "line", yAxisIndex: 0, smooth: true, data: incomeData, itemStyle: { color: "#10B981" }, areaStyle: { color: "rgba(16, 185, 129, 0.1)" } },
      { name: "支出", type: "line", yAxisIndex: 1, smooth: true, data: expenseData, itemStyle: { color: "#2563EB" }, areaStyle: { color: "rgba(37, 99, 235, 0.1)" } },
    ],
  }), []);

  const getStatusBadge = (rate: number) => {
    if (rate > 100) return <Badge variant="danger" dot>超支</Badge>;
    if (rate >= 80) return <Badge variant="warning" dot>预警</Badge>;
    return <Badge variant="success" dot>正常</Badge>;
  };

  const getAuditBanner = () => {
    const states: Record<AuditBannerState, { bg: string; border: string; icon: any; iconColor: string; text: string; btn?: React.ReactNode; }> = {
      pending: { bg: "bg-slate-50", border: "border-slate-200", icon: Clock, iconColor: "text-slate-500", text: "本月审计报告还未生成 · 建议15日前完成", btn: <Button size="sm" onClick={() => navigate("/finance/audit?action=generate")} variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>立即生成</Button> },
      generating: { bg: "bg-primary-50", border: "border-primary-200", icon: Loader2, iconColor: "text-primary-600 animate-spin", text: "审计报告生成中，当前进度 68% · 异常检测阶段" },
      passed: { bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-600", text: "6月审计报告已通过，包含 2 项低风险异常", btn: <Button size="sm" onClick={() => navigate("/finance/audit")} className="bg-emerald-600 text-white hover:bg-emerald-700" rightIcon={<Eye className="w-3.5 h-3.5" />}>查看报告</Button> },
      qualified: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, iconColor: "text-amber-600", text: "6月审计报告有保留意见，存在 5 项需关注问题", btn: <Button size="sm" onClick={() => navigate("/finance/audit")} className="bg-amber-600 text-white hover:bg-amber-700" rightIcon={<Eye className="w-3.5 h-3.5" />}>查看报告</Button> },
      adverse: { bg: "bg-rose-50", border: "border-rose-200", icon: AlertTriangle, iconColor: "text-rose-600", text: "6月审计报告否定意见，存在 3 项重大异常", btn: <Button size="sm" onClick={() => navigate("/finance/audit")} variant="danger" rightIcon={<Eye className="w-3.5 h-3.5" />}>立即处理</Button> },
    };
    const s = states[auditBannerState];
    const Icon = s.icon;
    return (
      <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-center justify-between px-4 py-3 rounded-lg border", s.bg, s.border)}>
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5 flex-shrink-0", s.iconColor)} />
          <span className="text-sm font-medium text-slate-700">{s.text}</span>
        </div>
        {s.btn}
      </m.div>
    );
  };

  const tableData = useMemo(() => {
    const flat = flattenAccounts(financeAccounts).filter(a => !a.children);
    if (filterMode === "abnormal") return flat.filter(a => {
      const rate = a.budget > 0 ? (a.actual / a.budget) * 100 : 0;
      return rate > 100 || getInvoiceCoverage(a.id) < 80;
    });
    if (filterMode === "reconciled") return flat.filter(a => getInvoiceCoverage(a.id) >= 95 && (a.budget > 0 ? (a.actual / a.budget) * 100 : 0) <= 100);
    return flat;
  }, [financeAccounts, filterMode, vouchers]);

  const columns = [
    { key: "name", title: "科目名称", dataIndex: "name" as const, sortable: true },
    { key: "budget", title: "预算", dataIndex: "budget" as const, align: "right" as const, sortable: true, render: (v: number) => formatCurrency(v) },
    { key: "actual", title: "实际", dataIndex: "actual" as const, align: "right" as const, sortable: true, render: (v: number) => formatCurrency(v) },
    { key: "rate", title: "执行率", dataIndex: "budget" as const, align: "right" as const, sortable: true, render: (_: number, r: FinanceAccount) => formatPercent(r.budget > 0 ? (r.actual / r.budget) * 100 : 0) },
    { key: "voucherCount", title: "关联凭证数", dataIndex: "id" as const, align: "center" as const, render: (id: string) => { const c = getVoucherCountByAccount(id); return <Link to={`/finance/voucher-trace?accountId=${id}`} className="text-primary-600 hover:text-primary-700 font-medium hover:underline">{c} 张</Link>; } },
    { key: "coverage", title: "票据覆盖率", dataIndex: "id" as const, align: "center" as const, render: (id: string) => { const cov = getInvoiceCoverage(id); return (<div className="w-28 mx-auto"><ProgressBar value={cov} variant={cov < 80 ? "danger" : cov < 90 ? "warning" : "success"} size="sm" showLabel={false} /><span className={cn("text-xs font-medium mt-1 block", cov < 80 ? "text-rose-600" : "text-slate-600")}>{formatPercent(cov)}</span></div>); } },
    { key: "status", title: "状态", dataIndex: "budget" as const, align: "center" as const, render: (_: number, r: FinanceAccount) => getStatusBadge(r.budget > 0 ? (r.actual / r.budget) * 100 : 0) },
  ];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string; }) => (
    <Card hoverable>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <CountUp end={value} format="currency" className={cn("text-3xl mt-2", color)} />
          </div>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", color.replace("text-", "bg-").replace("600", "100"))}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TreeNode = ({ node, level = 0 }: { node: FinanceAccount; level?: number; }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const rate = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;
    const isOverBudget = rate > 100;
    return (
      <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        <div className={cn("flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-50", level === 0 && "font-semibold")} style={{ paddingLeft: `${level * 16 + 12}px` }} onClick={() => hasChildren && toggleNode(node.id)}>
          {hasChildren ? (<m.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="mr-1"><ChevronRight className="w-4 h-4 text-slate-500" /></m.div>) : <span className="w-5" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={cn("text-sm truncate", node.type === "income" ? "text-emerald-700" : "text-primary-700")}>{node.name}</span>
              <span className="text-xs text-slate-500 ml-2">{formatPercent(rate)}</span>
            </div>
            <ProgressBar value={Math.min(rate, 100)} variant={isOverBudget ? "danger" : "primary"} size="sm" showAnimation={false} className="mt-1" />
          </div>
        </div>
        {hasChildren && (<m.div initial={{ height: 0, opacity: 0 }} animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">{node.children!.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}</m.div>)}
      </m.div>
    );
  };

  const renderSubModuleCard = (card: SubModuleCard, i: number) => {
    const colors = colorMap[card.color];
    const Icon = card.icon;
    const coreMetrics: any[] = [
      { key: "invoice", metrics: [{ label: "票据总数", value: 156, big: true }, { label: "待OCR", value: 8 }, { label: "待复核", value: 12 }, { label: "已通过", value: 136 }] },
      { key: "audit", metrics: [{ label: "最近报告", value: "6月10日", big: true }, { label: "异常项", value: 2 }, { label: "距下次审计", value: "23天" }] },
      { key: "voucher", metrics: [{ label: "内账凭证", value: 89, big: true }, { label: "外账凭证", value: 67 }, { label: "待审核", value: 5 }, { label: "匹配率", value: 92, suffix: "%" }] },
      { key: "execute", metrics: [{ label: "整体执行率", value: 83, suffix: "%", big: true }, { label: "超支科目", value: 2 }, { label: "预警科目", value: 4 }] },
    ];
    const data = coreMetrics[i];
    const badges = data.metrics.filter(met => !met.big).map((met, idx) => (
      <Badge key={idx} variant={idx === 0 ? "warning" : idx === 1 ? "danger" : "primary"} size="sm">{met.label} {met.value}{met.suffix || ""}</Badge>
    ));
    return (
      <m.div variants={item} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Link to={card.to} className="block h-full">
          <Card className={cn("h-full border-l-4", colors.border, "hover:shadow-lg transition-shadow duration-300")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors.bg)}><Icon className={cn("w-5 h-5", colors.text)} /></div>
                  <span className="font-semibold text-slate-800">{card.title}</span>
                </div>
                <span className={cn("text-xs font-medium flex items-center gap-0.5", colors.text)}>{card.enterText}<ArrowRight className="w-3 h-3" /></span>
              </div>
              {data.metrics.filter(met => met.big).map((met, idx) => (
                <div key={idx} className="mb-3">
                  {data.key === "execute" && met.suffix === "%" ? (
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 36 36" className="w-14 h-14">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <m.circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${met.value}, 100`} strokeLinecap="round" style={{ transformOrigin: "center" }} />
                        <text x="18" y="21.5" textAnchor="middle" className="fill-slate-800 font-bold text-[9px]">{met.value}%</text>
                      </svg>
                      <div><span className="text-2xl font-bold text-slate-800">{met.value}{met.suffix}</span><p className="text-xs text-slate-500">{met.label}</p></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">{met.label}</p>
                      <p className="text-2xl font-bold text-slate-800">{met.value}{met.suffix || ""}</p>
                    </>
                  )}
                </div>
              ))}
              {data.key === "audit" && <div className="mb-3"><Badge variant="success" size="md" dot>审计结论：通过</Badge></div>}
              <div className="flex flex-wrap gap-1.5">{badges}</div>
            </CardContent>
          </Card>
        </Link>
      </m.div>
    );
  };

  const filterTabs: { key: FilterMode; label: string; icon?: any; }[] = [
    { key: "all", label: "全部科目" },
    { key: "abnormal", label: "异常科目", icon: AlertTriangle },
    { key: "reconciled", label: "已完成对账" },
  ];

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <m.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <m.div variants={item}><StatCard title="年度总收入" value={totalIncome} icon={TrendingUp} color="text-emerald-600" /></m.div>
        <m.div variants={item}><StatCard title="年度总支出" value={totalExpense} icon={TrendingDown} color="text-primary-600" /></m.div>
        <m.div variants={item}><StatCard title="年度结余" value={balance} icon={Wallet} color={balance >= 0 ? "text-emerald-600" : "text-rose-600"} /></m.div>
      </m.div>

      <m.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subModuleCards.map((card, i) => renderSubModuleCard(card, i))}
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">科目导航</CardTitle></CardHeader>
            <CardContent className="p-3 space-y-1 max-h-[420px] overflow-y-auto">
              {financeAccounts.map(node => <TreeNode key={node.id} node={node} />)}
            </CardContent>
          </Card>

          <m.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="overflow-hidden border-l-4 border-l-primary-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"><ScanLine className="w-4 h-4 text-primary-600" /></div>
                    <span className="font-semibold text-sm text-slate-800">外账识别统计</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <m.circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="96.2, 100" strokeLinecap="round" />
                      </svg>
                      <div>
                        <p className="text-xl font-bold text-emerald-600">96.2%</p>
                        <p className="text-xs text-slate-500">平均置信度</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-800">128</p>
                      <p className="text-xs text-slate-500">本月识别量</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <Badge variant="danger" size="sm">失败 3</Badge>
                      <Badge variant="warning" size="sm">人工复核 15%</Badge>
                    </div>
                    <Link to="/finance/invoices" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center">进入<ArrowRight className="w-3 h-3 ml-0.5" /></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">月度收支趋势</CardTitle></CardHeader>
            <CardContent><ReactECharts option={trendOption} style={{ height: "280px" }} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">待办闭环追踪</CardTitle>
              <Badge variant="warning" size="sm">4 项待处理</Badge>
            </CardHeader>
            <CardContent className="px-2">
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />
                <AnimatePresence>
                  {todoItems.map((todo, idx) => (
                    <m.div key={todo.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }} className="relative pl-10 pr-2 py-3">
                      <div className={cn("absolute left-2.5 top-4 w-3 h-3 rounded-full ring-4",
                        todo.statusColor === "warning" ? "bg-amber-500 ring-amber-100" :
                        todo.statusColor === "danger" ? "bg-rose-500 ring-rose-100" :
                        todo.statusColor === "info" ? "bg-trust-500 ring-trust-100" :
                        todo.statusColor === "success" ? "bg-emerald-500 ring-emerald-100" :
                        "bg-slate-400 ring-slate-100"
                      )} />
                      <div className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm text-slate-800">{todo.item}</span>
                              <Badge variant="secondary" size="sm">{todo.module}</Badge>
                              <Badge variant={todo.statusColor as any} size="sm" dot>{todo.status}{todo.progress ? ` (${todo.progress}%)` : ""}</Badge>
                            </div>
                            {todo.progress !== undefined && <ProgressBar value={todo.progress} variant="trust" size="sm" className="mt-1.5 mb-2 w-40" />}
                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span>待办：{todo.action}</span>
                              {todo.deadline && <span className="text-amber-600">截止：{todo.deadline}</span>}
                            </div>
                          </div>
                          <Link to={todo.btnTo}><Button size="sm" variant="outline">{todo.btnText}<ChevronRight className="w-3.5 h-3.5 ml-0.5" /></Button></Link>
                        </div>
                      </div>
                    </m.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {getAuditBanner()}

          <Card id="execution-table">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">科目执行情况</CardTitle>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                {filterTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = filterMode === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setFilterMode(tab.key)} className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      active ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    )}>
                      {Icon && <Icon className="w-3.5 h-3.5" />}{tab.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable<FinanceAccount> columns={columns} data={tableData} rowKey="id" pagination={{ current: 1, pageSize: 8, total: tableData.length, onChange: () => { } }} />
            </CardContent>
          </Card>
        </div>
      </div>
    </m.div>
  );
}
