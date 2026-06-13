import { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  Wallet,
  FileText,
  Receipt,
  Plus,
  X,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockSplitRules, mockSettlements } from "@/mock";
import type { SplitRule, SplitRuleType, SettlementDetail, SettlementStatus, TierConfig } from "@/types";

type TabKey = "rules" | "reports" | "settlements";

const tabs: { key: TabKey; label: string; icon: typeof Wallet }[] = [
  { key: "rules", label: "分账规则配置", icon: Wallet },
  { key: "reports", label: "对账报表", icon: FileText },
  { key: "settlements", label: "结算明细", icon: Receipt },
];

const splitTypeLabels: Record<SplitRuleType, string> = {
  fixed: "固定金额",
  percentage: "比例分成",
  tiered: "阶梯提成",
};

const statusConfig: Record<SettlementStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "待确认", className: "bg-ember-50 text-ember-600 border-ember-200", icon: Clock },
  confirmed: { label: "已确认", className: "bg-ink-50 text-ink-600 border-ink-200", icon: CheckCircle2 },
  paid: { label: "已结算", className: "bg-mint-50 text-mint-600 border-mint-200", icon: DollarSign },
};

const mockCouriers = [
  { id: "u-courier-001", name: "李大勇" },
  { id: "u-courier-002", name: "张小花" },
  { id: "u-courier-003", name: "王师傅" },
  { id: "u-courier-004", name: "赵小哥" },
];

interface NewRuleForm {
  ruleName: string;
  courierId: string;
  type: SplitRuleType;
  value: number;
  tierConfig: TierConfig[];
  effectiveDate: string;
  expireDate: string;
}

export default function Finance() {
  const [activeTab, setActiveTab] = useState<TabKey>("rules");
  const [splitRules, setSplitRules] = useState<SplitRule[]>(mockSplitRules);
  const [showModal, setShowModal] = useState(false);
  const [reportGranularity, setReportGranularity] = useState<"week" | "month">("week");

  const [form, setForm] = useState<NewRuleForm>({
    ruleName: "",
    courierId: mockCouriers[0].id,
    type: "fixed",
    value: 0,
    tierConfig: [
      { min: 0, max: 80, rate: 1.8 },
      { min: 81, max: 150, rate: 2.2 },
      { min: 151, max: 9999, rate: 2.8 },
    ],
    effectiveDate: new Date().toISOString().slice(0, 10),
    expireDate: "",
  });

  const settlements = useMemo(() => mockSettlements, []);

  const reportSummary = useMemo(() => {
    const totalOrders = settlements.reduce((s, d) => s + d.orderCount, 0);
    const totalBase = settlements.reduce((s, d) => s + d.baseAmount, 0);
    const totalSplit = settlements.reduce((s, d) => s + d.splitAmount, 0);
    const totalDeduction = settlements.reduce((s, d) => s + d.deduction, 0);
    const totalNet = settlements.reduce((s, d) => s + d.netAmount, 0);
    return { totalOrders, totalBase, totalSplit, totalDeduction, totalNet };
  }, [settlements]);

  const reportChartOption = useMemo(() => {
    const periods = settlements.map((s) => s.period.replace("2026年", ""));
    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(26, 35, 50, 0.95)",
        borderColor: "transparent",
        textStyle: { color: "#fff", fontSize: 12 },
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["分账金额", "扣款", "净额"],
        top: 0,
        right: 0,
        textStyle: { color: "#47506D", fontSize: 12 },
        itemWidth: 14,
        itemHeight: 8,
      },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: {
        type: "category",
        data: periods,
        axisLine: { lineStyle: { color: "#E8EAF0" } },
        axisLabel: { color: "#6B7390", fontSize: 11, rotate: 15 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#6B7390", fontSize: 11, formatter: "¥{value}" },
        splitLine: { lineStyle: { color: "#F5F6FA", type: "dashed" } },
      },
      series: [
        {
          name: "分账金额",
          type: "bar",
          data: settlements.map((s) => s.splitAmount),
          barWidth: 14,
          itemStyle: { color: "#5FD694", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "扣款",
          type: "bar",
          data: settlements.map((s) => s.deduction),
          barWidth: 14,
          itemStyle: { color: "#FCA5A5", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "净额",
          type: "line",
          data: settlements.map((s) => s.netAmount),
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { color: "#FF6B35", width: 3 },
          itemStyle: { color: "#FF6B35" },
        },
      ],
    };
  }, [settlements]);

  const reportDetails = useMemo(() => {
    return settlements.map((s) => ({
      ...s,
      expected: +(s.splitAmount + (Math.random() > 0.7 ? Math.random() * 30 : 0)).toFixed(2),
      diff: +(Math.random() > 0.7 ? Math.random() * 20 - 5 : 0).toFixed(2),
    }));
  }, [settlements]);

  const handleAddRule = () => {
    if (!form.ruleName.trim()) return;
    const newRule: SplitRule = {
      id: `sr-${Date.now()}`,
      courierId: form.courierId,
      courierName: mockCouriers.find((c) => c.id === form.courierId)?.name || "",
      ruleName: form.ruleName,
      type: form.type,
      value: form.type === "tiered" ? 0 : form.value,
      tierConfig: form.type === "tiered" ? form.tierConfig : undefined,
      effectiveDate: form.effectiveDate,
      expireDate: form.expireDate || undefined,
    };
    setSplitRules([newRule, ...splitRules]);
    setShowModal(false);
    setForm({
      ruleName: "",
      courierId: mockCouriers[0].id,
      type: "fixed",
      value: 0,
      tierConfig: [
        { min: 0, max: 80, rate: 1.8 },
        { min: 81, max: 150, rate: 2.2 },
        { min: 151, max: 9999, rate: 2.8 },
      ],
      effectiveDate: new Date().toISOString().slice(0, 10),
      expireDate: "",
    });
  };

  const updateTier = (index: number, field: keyof TierConfig, value: number) => {
    const newTiers = [...form.tierConfig];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setForm({ ...form, tierConfig: newTiers });
  };

  const addTier = () => {
    const last = form.tierConfig[form.tierConfig.length - 1];
    setForm({
      ...form,
      tierConfig: [...form.tierConfig, { min: last.max + 1, max: last.max + 100, rate: last.rate + 0.2 }],
    });
  };

  const removeTier = (index: number) => {
    if (form.tierConfig.length <= 2) return;
    setForm({ ...form, tierConfig: form.tierConfig.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-5 animate-slideUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-800">分账对账中心</h1>
          <p className="text-sm text-ink-400 mt-1">快递员分账规则、对账报表与结算明细管理</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-ink-50 rounded-xl w-fit border border-ink-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key
                ? "bg-white text-ink-800 shadow-sm"
                : "text-ink-500 hover:text-ink-700 hover:bg-white/60"
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "rules" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
              <div className="app-card p-4">
                <div className="text-xs text-ink-400">规则总数</div>
                <div className="mt-1 text-2xl font-bold text-ink-800">{splitRules.length}</div>
              </div>
              <div className="app-card p-4">
                <div className="text-xs text-ink-400">阶梯提成</div>
                <div className="mt-1 text-2xl font-bold text-ember-500">
                  {splitRules.filter((r) => r.type === "tiered").length}
                </div>
              </div>
              <div className="app-card p-4">
                <div className="text-xs text-ink-400">覆盖快递员</div>
                <div className="mt-1 text-2xl font-bold text-mint-600">
                  {new Set(splitRules.map((r) => r.courierId)).size}
                </div>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary ml-4">
              <Plus size={16} />
              新增规则
            </button>
          </div>

          <div className="app-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">规则名称</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">快递员</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">类型</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">规则值</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">生效日期</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">失效日期</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {splitRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-ink-800">{rule.ruleName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white text-xs font-bold">
                          {rule.courierName.charAt(0)}
                        </div>
                        <span className="text-sm text-ink-700">{rule.courierName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "chip border",
                          rule.type === "tiered"
                            ? "bg-ember-50 text-ember-600 border-ember-200"
                            : rule.type === "percentage"
                            ? "bg-mint-50 text-mint-600 border-mint-200"
                            : "bg-ink-50 text-ink-600 border-ink-200"
                        )}
                      >
                        {splitTypeLabels[rule.type]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {rule.type === "fixed" && (
                        <span className="text-sm font-semibold text-ink-800">¥{rule.value}/单</span>
                      )}
                      {rule.type === "percentage" && (
                        <span className="text-sm font-semibold text-ink-800">
                          {(rule.value * 100).toFixed(1)}%
                        </span>
                      )}
                      {rule.type === "tiered" && (
                        <div className="flex flex-col gap-0.5">
                          {rule.tierConfig?.map((t, i) => (
                            <span key={i} className="text-xs text-ink-600">
                              {t.min}-{t.max === 9999 ? "∞" : t.max}件: ¥{t.rate}/单
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-600">{rule.effectiveDate}</td>
                    <td className="px-5 py-4 text-sm text-ink-600">{rule.expireDate || "长期有效"}</td>
                    <td className="px-5 py-4">
                      {rule.expireDate && new Date(rule.expireDate) < new Date() ? (
                        <span className="chip bg-ink-100 text-ink-500">已失效</span>
                      ) : (
                        <span className="chip bg-mint-50 text-mint-600 border border-mint-200">生效中</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-5">
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">对账汇总</h2>
                <p className="text-xs text-ink-400 mt-1">本期对账数据概览</p>
              </div>
              <div className="relative">
                <select
                  value={reportGranularity}
                  onChange={(e) => setReportGranularity(e.target.value as typeof reportGranularity)}
                  className="input pr-8 appearance-none cursor-pointer w-32"
                >
                  <option value="week">按周</option>
                  <option value="month">按月</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[
                {
                  label: "订单总数",
                  value: reportSummary.totalOrders.toLocaleString(),
                  suffix: "单",
                  delta: "+8.4%",
                  up: true,
                  color: "text-ember-500",
                },
                {
                  label: "订单总额",
                  value: `¥${reportSummary.totalBase.toLocaleString()}`,
                  suffix: "",
                  delta: "+12.1%",
                  up: true,
                  color: "text-ink-700",
                },
                {
                  label: "分账金额",
                  value: `¥${reportSummary.totalSplit.toFixed(2)}`,
                  suffix: "",
                  delta: "+9.3%",
                  up: true,
                  color: "text-mint-600",
                },
                {
                  label: "扣款合计",
                  value: `¥${reportSummary.totalDeduction.toFixed(2)}`,
                  suffix: "",
                  delta: "-2.5%",
                  up: false,
                  color: "text-alert-500",
                },
                {
                  label: "结算净额",
                  value: `¥${reportSummary.totalNet.toFixed(2)}`,
                  suffix: "",
                  delta: "+10.2%",
                  up: true,
                  color: "text-ember-600",
                },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-xl bg-ink-50/60 border border-ink-100">
                  <div className="text-xs text-ink-400">{s.label}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</span>
                    <span className="text-sm text-ink-400">{s.suffix}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    {s.up ? (
                      <ArrowUpRight size={12} className="text-mint-600" />
                    ) : (
                      <ArrowDownRight size={12} className="text-alert-500" />
                    )}
                    <span className={s.up ? "text-mint-600" : "text-alert-500"}>{s.delta}</span>
                    <span className="text-ink-400">环比</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card p-5">
            <div className="mb-4">
              <h2 className="section-title">分账趋势图</h2>
              <p className="text-xs text-ink-400 mt-1">各周期分账金额、扣款与净额变化</p>
            </div>
            <ReactECharts option={reportChartOption} style={{ height: 320 }} notMerge />
          </div>

          <div className="app-card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <h2 className="section-title">对账明细</h2>
              <span className="chip bg-alert-50 text-alert-600 border border-alert-200">
                <AlertCircle size={12} />
                {reportDetails.filter((d) => Math.abs(d.diff) > 0).length} 条差异
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50/50 border-b border-ink-100">
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">周期</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">快递员</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">订单数</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">订单总额</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">系统分账</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">预期分账</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">差异</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">扣款</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">净额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {reportDetails.map((d) => (
                  <tr
                    key={d.id}
                    className={cn(
                      "hover:bg-ink-50/50 transition-colors",
                      Math.abs(d.diff) > 0 && "bg-alert-50/30"
                    )}
                  >
                    <td className="px-5 py-3 text-sm text-ink-700">{d.period}</td>
                    <td className="px-5 py-3 text-sm text-ink-700">{d.courierName}</td>
                    <td className="px-5 py-3 text-sm text-right text-ink-700">{d.orderCount}</td>
                    <td className="px-5 py-3 text-sm text-right text-ink-700">
                      ¥{d.baseAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-mint-600">
                      ¥{d.splitAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-ink-600">
                      ¥{d.expected.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-sm text-right font-bold",
                        d.diff > 0 ? "text-mint-600" : d.diff < 0 ? "text-alert-500" : "text-ink-400"
                      )}
                    >
                      {d.diff > 0 ? "+" : ""}
                      ¥{d.diff.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-alert-500">
                      -¥{d.deduction.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-ember-600">
                      ¥{d.netAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "settlements" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "待确认",
                count: settlements.filter((s) => s.status === "pending").length,
                total: settlements
                  .filter((s) => s.status === "pending")
                  .reduce((a, b) => a + b.netAmount, 0),
                className: "from-ember-400 to-ember-500",
                icon: Clock,
              },
              {
                label: "已确认",
                count: settlements.filter((s) => s.status === "confirmed").length,
                total: settlements
                  .filter((s) => s.status === "confirmed")
                  .reduce((a, b) => a + b.netAmount, 0),
                className: "from-ink-500 to-ink-700",
                icon: CheckCircle2,
              },
              {
                label: "已结算",
                count: settlements.filter((s) => s.status === "paid").length,
                total: settlements
                  .filter((s) => s.status === "paid")
                  .reduce((a, b) => a + b.netAmount, 0),
                className: "from-mint-500 to-mint-600",
                icon: TrendingUp,
              },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "stat-card bg-gradient-to-br",
                  s.className,
                  "shadow-card app-card-hover"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-90">{s.label}</div>
                  <s.icon size={18} className="opacity-80" />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold tracking-tight">{s.count}</span>
                  <span className="text-sm opacity-80">笔</span>
                </div>
                <div className="mt-2 text-sm opacity-90">
                  合计: ¥{s.total.toFixed(2)}
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
              </div>
            ))}
          </div>

          <div className="app-card overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-100">
              <h2 className="section-title">结算明细列表</h2>
              <p className="text-xs text-ink-400 mt-1">所有结算周期的明细记录</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50/50 border-b border-ink-100">
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">结算编号</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">结算周期</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">快递员</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">订单数</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">基础金额</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">分账金额</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">扣款</th>
                  <th className="text-right text-xs font-medium text-ink-500 px-5 py-3">净额</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-ink-500 px-5 py-3">支付时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {settlements.map((s: SettlementDetail) => {
                  const cfg = statusConfig[s.status];
                  return (
                    <tr key={s.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono text-ink-600">{s.id.toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink-700">{s.period}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-xs font-bold">
                            {s.courierName.charAt(0)}
                          </div>
                          <span className="text-sm text-ink-700">{s.courierName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-ink-700">{s.orderCount}</td>
                      <td className="px-5 py-3 text-sm text-right text-ink-600">
                        ¥{s.baseAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-mint-600">
                        +¥{s.splitAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-alert-500">
                        -¥{s.deduction.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-bold text-ember-600">
                        ¥{s.netAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("chip border", cfg.className)}>
                          <cfg.icon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink-500">
                        {s.paidAt ? new Date(s.paidAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-card-hover w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
              <h3 className="text-lg font-semibold text-ink-800">新增分账规则</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-400 hover:text-ink-700 transition-colors p-1 rounded-lg hover:bg-ink-50"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">规则名称</label>
                  <input
                    type="text"
                    value={form.ruleName}
                    onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
                    className="input"
                    placeholder="如：标准提成-张小花"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">关联快递员</label>
                  <select
                    value={form.courierId}
                    onChange={(e) => setForm({ ...form, courierId: e.target.value })}
                    className="input"
                  >
                    {mockCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">规则类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["fixed", "percentage", "tiered"] as SplitRuleType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        form.type === t
                          ? "border-ember-400 bg-ember-50 ring-2 ring-ember-500/20"
                          : "border-ink-200 hover:border-ink-300 bg-white"
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium",
                          form.type === t ? "text-ember-600" : "text-ink-700"
                        )}
                      >
                        {splitTypeLabels[t]}
                      </div>
                      <div className="text-xs text-ink-400 mt-1">
                        {t === "fixed" && "每单固定金额"}
                        {t === "percentage" && "按订单比例"}
                        {t === "tiered" && "按单量阶梯"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {form.type === "fixed" && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">每单提成金额（元）</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              )}

              {form.type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">分成比例（%）</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.value * 100}
                    onChange={(e) =>
                      setForm({ ...form, value: (parseFloat(e.target.value) || 0) / 100 })
                    }
                    className="input"
                  />
                </div>
              )}

              {form.type === "tiered" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink-700">阶梯配置</label>
                    <button onClick={addTier} className="btn-ghost text-xs py-1">
                      <Plus size={12} />
                      增加阶梯
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.tierConfig.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm text-ink-500 w-12">第{i + 1}档</span>
                        <input
                          type="number"
                          value={t.min}
                          onChange={(e) => updateTier(i, "min", parseInt(e.target.value) || 0)}
                          className="input flex-1"
                          placeholder="最小件数"
                        />
                        <span className="text-ink-400">-</span>
                        <input
                          type="number"
                          value={t.max === 9999 ? "" : t.max}
                          onChange={(e) =>
                            updateTier(i, "max", e.target.value ? parseInt(e.target.value) : 9999)
                          }
                          className="input flex-1"
                          placeholder="最大件数（留空为∞）"
                        />
                        <span className="text-ink-400">件</span>
                        <span className="text-ink-400 mx-1">¥</span>
                        <input
                          type="number"
                          step="0.1"
                          value={t.rate}
                          onChange={(e) => updateTier(i, "rate", parseFloat(e.target.value) || 0)}
                          className="input flex-1"
                          placeholder="单价"
                        />
                        <span className="text-ink-400">/单</span>
                        {form.tierConfig.length > 2 && (
                          <button
                            onClick={() => removeTier(i)}
                            className="p-2 text-ink-400 hover:text-alert-500 hover:bg-alert-50 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">生效日期</label>
                  <input
                    type="date"
                    value={form.effectiveDate}
                    onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">失效日期（选填）</label>
                  <input
                    type="date"
                    value={form.expireDate}
                    onChange={(e) => setForm({ ...form, expireDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-100 bg-ink-50/50">
              <button onClick={() => setShowModal(false)} className="btn-outline">
                取消
              </button>
              <button onClick={handleAddRule} className="btn-primary">
                <Plus size={16} />
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
