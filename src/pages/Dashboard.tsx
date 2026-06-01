import { useState, useEffect } from "react";
import { dashboard, contracts, revenues, assets, decisions } from "@/lib/api";
import type {
  DashboardOverview,
  Contract,
  Revenue,
  Asset,
  Decision,
  RecentActivity,
  AbnormalAlert,
  QueryLog,
} from "@/lib/api";
import {
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Users,
  RefreshCw,
  X,
  Eye,
  Clock,
  Megaphone,
  CheckCircle,
  Info,
  Shield,
  Activity,
  Save,
  Edit2,
  ChevronDown,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  house: "房屋", land: "土地", equipment: "设备", forest: "林地", water: "水面",
};

const STATUS_LABELS: Record<string, string> = {
  normal: "正常", transferred: "已转让", demolished: "已拆除", idle: "闲置",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  active: "生效中", expired: "已到期", pending: "待签署", terminated: "已终止",
};

const REVENUE_TYPE_LABELS: Record<string, string> = {
  receivable: "应收", received: "实收", arrears: "欠缴", reduction: "减免", distribution: "分配",
};

const DECISION_STATUS_LABELS: Record<string, string> = {
  pending: "待审议", voting: "表决中", published: "公示中", closed: "已结束",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  rental: "出租", contract: "承包", cooperative: "合作经营", idle: "闲置登记",
};

function formatWan(value: number) {
  return (value / 10000).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function daysRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const CATEGORY_CONFIG: Record<string, { label: string; cls: string; icon: typeof Building2 }> = {
  asset: { label: "资产", cls: "bg-blue-100 text-blue-700", icon: Building2 },
  contract: { label: "合同", cls: "bg-green-100 text-green-700", icon: FileText },
  revenue: { label: "收益", cls: "bg-amber-100 text-amber-700", icon: DollarSign },
  decision: { label: "决策", cls: "bg-purple-100 text-purple-700", icon: Megaphone },
};

type ActionModalMode =
  | { type: "contract"; data: Contract }
  | { type: "arrears"; data: Revenue & { lessee_name?: string } }
  | { type: "decision"; data: Decision }
  | { type: "asset"; data: Asset }
  | { type: "revenue_drill"; data: Revenue[]; title: string }
  | { type: "asset_drill"; data: Asset[]; title: string }
  | { type: "contract_drill"; data: Contract[]; title: string }
  | { type: "decision_list"; data: Decision[]; title: string };

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [expiring, setExpiring] = useState<Contract[]>([]);
  const [arrearsList, setArrearsList] = useState<(Revenue & { lessee_name?: string; contract_no?: string })[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{ type: string; month: string; total: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [abnormalAlerts, setAbnormalAlerts] = useState<AbnormalAlert[]>([]);
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionModal, setActionModal] = useState<ActionModalMode | null>(null);
  const [saving, setSaving] = useState(false);

  const [trendYear, setTrendYear] = useState(new Date().getFullYear());

  const [handleContractStatus, setHandleContractStatus] = useState("");
  const [handleContractRemark, setHandleContractRemark] = useState("");
  const [handleArrearsAction, setHandleArrearsAction] = useState("");
  const [handleArrearsAmount, setHandleArrearsAmount] = useState("");
  const [handleArrearsRemark, setHandleArrearsRemark] = useState("");
  const [handleDecisionStatus, setHandleDecisionStatus] = useState("");
  const [handleDecisionOpinion, setHandleDecisionOpinion] = useState("");
  const [handleDecisionObjection, setHandleDecisionObjection] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, ex, ar, rt, ra, aa, ql] = await Promise.all([
        dashboard.getOverview(),
        dashboard.getExpiringContracts(),
        dashboard.getArrearsRisk(),
        dashboard.getRevenueTrend(),
        dashboard.getRecentActivities(20),
        dashboard.getAbnormalAlerts(),
        dashboard.getQueryLogs(20),
      ]);
      setOverview(ov);
      setExpiring(ex);
      setArrearsList(ar);
      setRevenueTrend(rt);
      setRecentActivities(ra);
      setAbnormalAlerts(aa);
      setQueryLogs(ql);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const logQuery = async (queryType: string, queryParams: string) => {
    try {
      await dashboard.logQuery({ query_type: queryType, query_params: queryParams, queried_by: "监管人员" });
    } catch {}
  };

  const openContractHandle = (c: Contract) => {
    logQuery("handle_contract", `id=${c.id},no=${c.contract_no}`);
    setHandleContractStatus(c.status);
    setHandleContractRemark(c.remark || "");
    setActionModal({ type: "contract", data: c });
  };

  const openArrearsHandle = (r: Revenue & { lessee_name?: string }) => {
    logQuery("handle_arrears", `id=${r.id},amount=${r.amount}`);
    setHandleArrearsAction("");
    setHandleArrearsAmount("");
    setHandleArrearsRemark("");
    setActionModal({ type: "arrears", data: r });
  };

  const openDecisionHandle = (d: Decision) => {
    logQuery("handle_decision", `id=${d.id},topic=${d.topic}`);
    setHandleDecisionStatus(d.status);
    setHandleDecisionOpinion(d.handling_opinion || "");
    setHandleDecisionObjection(d.objection || "");
    setActionModal({ type: "decision", data: d });
  };

  const openAssetDetail = (a: Asset) => {
    logQuery("view_asset", `id=${a.id},name=${a.name}`);
    setActionModal({ type: "asset", data: a });
  };

  const saveContractHandle = async () => {
    if (!actionModal || actionModal.type !== "contract") return;
    setSaving(true);
    try {
      const c = actionModal.data;
      await contracts.update(c.id, { ...c, status: handleContractStatus, remark: handleContractRemark });
      setActionModal(null);
      await fetchData();
    } catch (err: any) {
      alert("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const saveArrearsHandle = async () => {
    if (!actionModal || actionModal.type !== "arrears") return;
    setSaving(true);
    try {
      const r = actionModal.data;
      if (handleArrearsAction === "record_received") {
        await revenues.create({
          asset_id: r.asset_id, contract_id: r.contract_id,
          type: "received", amount: Number(handleArrearsAmount) || r.amount,
          year: r.year, period: r.period,
          description: `欠缴补缴: ${handleArrearsRemark || r.description}`,
        });
      } else if (handleArrearsAction === "record_reduction") {
        await revenues.create({
          asset_id: r.asset_id, contract_id: r.contract_id,
          type: "reduction", amount: Number(handleArrearsAmount) || r.amount,
          year: r.year, period: r.period,
          description: `欠缴减免: ${handleArrearsRemark || r.description}`,
        });
      } else if (handleArrearsAction === "update_status") {
        await revenues.update(r.id, { description: `${r.description || ""} [催缴中] ${handleArrearsRemark}` });
      }
      setActionModal(null);
      await fetchData();
    } catch (err: any) {
      alert("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const saveDecisionHandle = async () => {
    if (!actionModal || actionModal.type !== "decision") return;
    setSaving(true);
    try {
      const d = actionModal.data;
      await decisions.update(d.id, {
        ...d,
        status: handleDecisionStatus,
        handling_opinion: handleDecisionOpinion,
        objection: handleDecisionObjection,
      });
      setActionModal(null);
      await fetchData();
    } catch (err: any) {
      alert("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const handleAlertAction = async (alert: AbnormalAlert) => {
    await logQuery(`${alert.type}_alert`, `id=${alert.id}`);
    if (alert.category === "contract") {
      try {
        const all = await contracts.list({});
        const c = all.find((x: Contract) => x.id === alert.id);
        if (c) openContractHandle(c);
      } catch {}
    } else if (alert.category === "revenue") {
      try {
        const all = await revenues.list({});
        const r = all.find((x: Revenue) => x.id === alert.id);
        if (r) openArrearsHandle(r as Revenue & { lessee_name?: string });
      } catch {}
    } else if (alert.category === "asset") {
      try {
        const all = await assets.list({});
        const a = all.find((x: Asset) => x.id === alert.id);
        if (a) openAssetDetail(a);
      } catch {}
    }
  };

  const openDrillRevenueByType = async (type: string, title: string, year?: number) => {
    await logQuery("drill_revenue", `type=${type},year=${year || "all"}`);
    try {
      const params: Record<string, string> = { type };
      if (year) params.year = String(year);
      const data = await revenues.list(params);
      setActionModal({ type: "revenue_drill", data, title });
    } catch {}
  };

  const openDrillAssetByType = async (assetType: string) => {
    await logQuery("drill_asset", `type=${assetType}`);
    try {
      const data = await assets.list({ type: assetType });
      setActionModal({ type: "asset_drill", data, title: `${TYPE_LABELS[assetType] || assetType}类资产明细` });
    } catch {}
  };

  const openDrillContractsByStatus = async (status: string, title: string) => {
    await logQuery("drill_contracts", `status=${status}`);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const data = await contracts.list(params);
      setActionModal({ type: "contract_drill", data, title });
    } catch {}
  };

  const openDrillDecisions = async (status: string, title: string) => {
    await logQuery("drill_decisions", `status=${status}`);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const data = await decisions.list(params);
      setActionModal({ type: "decision_list", data, title });
    } catch {}
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-lg">加载中...</div>;
  }

  const assetStats = overview?.assetStats;
  const contractStats = overview?.contractStats;
  const revenueStats = overview?.revenueStats;
  const decisionStats = overview?.decisionStats;
  const activeContracts = contractStats?.byStatus?.find((s) => s.status === "active")?.count ?? 0;
  const pendingDecisions = decisionStats?.byStatus?.filter((s) => s.status === "pending" || s.status === "voting").reduce((sum, s) => sum + s.count, 0) ?? 0;
  const publishedDecisions = decisionStats?.byStatus?.filter((s) => s.status === "published").reduce((sum, s) => sum + s.count, 0) ?? 0;

  const monthlyData = (() => {
    const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    const monthTotals = new Map<string, number>();
    months.forEach((m) => monthTotals.set(m, 0));
    revenueTrend.filter((r) => String(trendYear) === String(new Date().getFullYear()) || true).forEach((r) => {
      const month = r.month.padStart(2, "0");
      const prev = monthTotals.get(month) ?? 0;
      monthTotals.set(month, prev + r.total);
    });
    const entries = months.map((m) => [m, monthTotals.get(m) ?? 0] as [string, number]);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([month, total]) => ({ month, total, height: total > 0 ? (total / maxVal) * 100 : 0 }));
  })();

  const typeBreakdown = (() => {
    if (!assetStats?.byType) return [];
    const maxCount = Math.max(...assetStats.byType.map((b) => b.count), 1);
    return assetStats.byType.map((b) => ({ type: b.type, label: TYPE_LABELS[b.type] ?? b.type, count: b.count, width: (b.count / maxCount) * 100 }));
  })();

  const availableYears = (() => {
    const years = new Set(revenueTrend.map((r) => r.month?.slice(0, 4)).filter(Boolean));
    if (years.size === 0) years.add(String(new Date().getFullYear()));
    return Array.from(years).sort().reverse();
  })();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">监管看板</h1>
        <button onClick={fetchData} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <RefreshCw className="h-4 w-4" />刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-6 h-6 text-blue-600" />} label="资产总数" value={`${assetStats?.total ?? 0}`}
          sub={`估值 ${formatWan(assetStats?.totalValuation ?? 0)} 万元 | 闲置 ${assetStats?.idleCount ?? 0}`}
          bg="bg-blue-50" iconBg="bg-blue-100"
          onClick={async () => { await logQuery("view_all_assets", ""); try { const data = await assets.list({}); setActionModal({ type: "asset_drill", data, title: "全部资产台账" }); } catch {} }}
          onSubClick={async () => { await logQuery("view_idle_assets", ""); try { const data = await assets.list({ status: "idle" }); setActionModal({ type: "asset_drill", data, title: "闲置资产明细" }); } catch {} }}
          tooltip="含全部已登记资产，闲置指状态为「闲置」的资产"
        />
        <StatCard
          icon={<FileText className="w-6 h-6 text-green-600" />} label="活跃合同" value={`${activeContracts}`}
          sub={`共 ${contractStats?.total ?? 0} 份合同 | ${contractStats?.expiring ?? 0} 份即将到期`}
          bg="bg-green-50" iconBg="bg-green-100"
          onClick={() => openDrillContractsByStatus("active", "活跃合同明细")}
          onSubClick={() => openDrillContractsByStatus("", "全部合同明细")}
          tooltip="活跃=状态为「生效中」的合同；即将到期=90天内到期"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-amber-600" />} label="本年收益"
          value={`${formatWan(revenueStats?.totalReceived ?? 0)} 万元`}
          sub={`应收 ${formatWan(revenueStats?.totalReceivable ?? 0)} 万 | 欠缴 ${formatWan(revenueStats?.totalArrears ?? 0)} 万`}
          bg="bg-amber-50" iconBg="bg-amber-100"
          onClick={() => openDrillRevenueByType("received", "实收收益明细")}
          onSubClick={() => openDrillRevenueByType("receivable", "应收收益明细")}
          tooltip="应收/实收/欠缴分别对应收益流水中各类型合计"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />} label="欠缴风险"
          value={`${formatWan(revenueStats?.totalArrears ?? 0)} 万元`}
          sub={`减免 ${formatWan(revenueStats?.totalReduction ?? 0)} 万元`}
          bg="bg-red-50" iconBg="bg-red-100"
          onClick={() => openDrillRevenueByType("arrears", "欠缴记录明细")}
          tooltip="欠缴=类型为「欠缴」的收益合计；减免=类型为「减免」的收益合计"
        />
      </div>

      {abnormalAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-700">异常变动追踪</h2>
            <span className="ml-auto text-xs text-gray-400">{abnormalAlerts.length} 条预警</span>
          </div>
          <div className="divide-y divide-gray-50">
            {abnormalAlerts.map((alert, i) => (
              <div key={i} className={`px-4 py-3 flex items-start gap-3 ${alert.level === "critical" ? "bg-red-50/50" : "bg-amber-50/50"}`}>
                <span className={`mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${alert.level === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {alert.level === "critical" ? "严重" : "警告"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.detail}</p>
                </div>
                <button onClick={() => handleAlertAction(alert)} className="shrink-0 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                  <Edit2 className="h-3 w-3" />去处理
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-gray-700">即将到期合同</h2>
            </div>
            <button onClick={() => openDrillContractsByStatus("", "全部合同明细")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">查看全部合同 →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500">
                <th className="px-4 py-2 text-left font-medium">合同编号</th>
                <th className="px-4 py-2 text-left font-medium">资产</th>
                <th className="px-4 py-2 text-left font-medium">承租方</th>
                <th className="px-4 py-2 text-left font-medium">到期日</th>
                <th className="px-4 py-2 text-left font-medium">剩余</th>
                <th className="px-4 py-2 text-left font-medium">操作</th>
              </tr></thead>
              <tbody>
                {expiring.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">暂无即将到期合同</td></tr>
                ) : expiring.map((c, i) => {
                  const days = daysRemaining(c.end_date);
                  return (
                    <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-2 text-gray-700">{c.contract_no}</td>
                      <td className="px-4 py-2 text-gray-700">{c.asset_name ?? "-"}</td>
                      <td className="px-4 py-2 text-gray-700">{c.lessee_name}</td>
                      <td className="px-4 py-2 text-gray-700">{c.end_date}</td>
                      <td className="px-4 py-2"><span className={days <= 30 ? "text-red-600 font-medium" : days <= 90 ? "text-amber-600" : "text-gray-700"}>{days > 0 ? `${days} 天` : "已过期"}</span></td>
                      <td className="px-4 py-2">
                        <button onClick={() => openContractHandle(c)} className="inline-flex items-center gap-1 rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                          <Edit2 className="h-3 w-3" />履约处理
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-gray-700">欠缴记录</h2>
            </div>
            <button onClick={() => openDrillRevenueByType("arrears", "全部欠缴记录")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">查看全部欠缴 →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500">
                <th className="px-4 py-2 text-left font-medium">资产名称</th>
                <th className="px-4 py-2 text-left font-medium">承租方</th>
                <th className="px-4 py-2 text-left font-medium">欠缴金额</th>
                <th className="px-4 py-2 text-left font-medium">年度</th>
                <th className="px-4 py-2 text-left font-medium">操作</th>
              </tr></thead>
              <tbody>
                {arrearsList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">暂无欠缴记录</td></tr>
                ) : arrearsList.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2 text-gray-700">{a.asset_name ?? "-"}</td>
                    <td className="px-4 py-2 text-gray-700">{a.lessee_name ?? "-"}</td>
                    <td className="px-4 py-2 text-red-600 font-medium">¥{Number(a.amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-700">{a.year}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => openArrearsHandle(a)} className="inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors">
                        <Edit2 className="h-3 w-3" />欠缴处置
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-gray-700">收益趋势</h2>
              <div className="relative ml-2">
                <select
                  value={trendYear}
                  onChange={(e) => { setTrendYear(Number(e.target.value)); logQuery("switch_trend_year", `year=${e.target.value}`); }}
                  className="appearance-none rounded border border-gray-300 pl-2 pr-6 py-1 text-xs focus:border-blue-500 focus:outline-none"
                >
                  {availableYears.map((y) => <option key={y} value={y}>{y}年</option>)}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-2">
              {(["receivable", "received", "arrears", "reduction"] as const).map((t) => (
                <button key={t} onClick={() => openDrillRevenueByType(t, `${REVENUE_TYPE_LABELS[t]}明细`, trendYear)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  {REVENUE_TYPE_LABELS[t]} →
                </button>
              ))}
            </div>
          </div>
          {monthlyData.every((d) => d.total === 0) ? (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          ) : (
            <div className="flex items-end gap-2 h-52">
              {monthlyData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group" onClick={() => { logQuery("drill_month", `year=${trendYear},month=${d.month}`); openDrillRevenueByType("", `${trendYear}年${d.month}月收益明细`); }}>
                  {d.total > 0 && <span className="text-xs text-gray-500 mb-1 group-hover:text-blue-600">{formatWan(d.total)}万</span>}
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm min-h-[2px] transition-all group-hover:from-blue-600 group-hover:to-blue-400" style={{ height: `${d.height}%` }} />
                  <span className="text-xs text-gray-500 mt-1">{d.month.slice(-2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-gray-700">资产类型分布</h2>
          </div>
          {typeBreakdown.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {typeBreakdown.map((t) => (
                <div key={t.type} className="flex items-center gap-3 cursor-pointer group" onClick={() => openDrillAssetByType(t.type)}>
                  <span className="w-12 text-sm text-gray-600 text-right shrink-0">{t.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full flex items-center justify-end pr-2 group-hover:from-purple-600 group-hover:to-purple-400 transition-colors" style={{ width: `${t.width}%`, minWidth: t.count > 0 ? "2rem" : "0" }}>
                      <span className="text-xs text-white font-medium">{t.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100">查看→</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {pendingDecisions > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">待审议/表决中</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-purple-600">{pendingDecisions}</span>
                  <button onClick={() => openDrillDecisions("pending", "待审议议题")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">处理→</button>
                </div>
              </div>
            )}
            {publishedDecisions > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">公示中</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">{publishedDecisions}</span>
                  <button onClick={() => openDrillDecisions("published", "公示中议题")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">复查→</button>
                </div>
              </div>
            )}
            {decisionStats && decisionStats.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">全部议题</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-600">{decisionStats.total}</span>
                  <button onClick={() => openDrillDecisions("", "全部民主决策")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">查看→</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /><h2 className="font-semibold text-gray-700">资产变动记录</h2></div>
            <span className="text-xs text-gray-400">最近 20 条</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">暂无变动记录</div>
            ) : recentActivities.map((act, i) => {
              const cfg = CATEGORY_CONFIG[act.category] ?? CATEGORY_CONFIG.asset;
              const Icon = cfg.icon;
              return (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50/50 cursor-pointer"
                  onClick={async () => {
                    await logQuery("view_activity", `category=${act.category},id=${act.id}`);
                    if (act.category === "contract") {
                      try { const all = await contracts.list({}); const c = all.find((x: Contract) => x.id === act.id); if (c) openContractHandle(c); } catch {}
                    } else if (act.category === "revenue") {
                      try { const all = await revenues.list({}); const r = all.find((x: Revenue) => x.id === act.id); if (r) openArrearsHandle(r as Revenue & { lessee_name?: string }); } catch {}
                    } else if (act.category === "decision") {
                      try { const all = await decisions.list({}); const d = all.find((x: Decision) => x.id === act.id); if (d) openDecisionHandle(d); } catch {}
                    } else if (act.category === "asset") {
                      try { const all = await assets.list({}); const a = all.find((x: Asset) => x.id === act.id); if (a) openAssetDetail(a); } catch {}
                    }
                  }}
                >
                  <div className="mt-0.5 shrink-0"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}><Icon className="h-3 w-3" />{cfg.label}</span></div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-gray-800 truncate">{act.title}</p><p className="text-xs text-gray-500 truncate">{act.detail}</p></div>
                  <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">{act.time?.slice(0, 16)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-teal-500" /><h2 className="font-semibold text-gray-700">村民查询记录</h2></div>
            <span className="text-xs text-gray-400">公开公示 · 可复查</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {queryLogs.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">
                <p>暂无查询记录</p>
                <p className="text-xs mt-1 text-gray-300">监管人员在看板追溯处理时自动留痕</p>
                <p className="text-xs mt-2 text-gray-400 border-t border-gray-100 pt-2">
                  <strong>公开公示复查口径：</strong>村民可申请查看集体资产的权属登记、经营合同、收益流水和民主决策记录。
                  每次查看操作均留痕记录查询类型、参数、查询人和时间，供上级复查。
                </p>
              </div>
            ) : queryLogs.map((log) => (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700">{log.query_type}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{log.query_params}</span>
                <span className="text-xs text-gray-500">{log.queried_by}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">{log.created_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
          {queryLogs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
              <strong>公开公示复查口径：</strong>所有查询操作均自动留痕，支持上级复查村民/监管人员的查看行为。
              查询记录包括查询类型、参数、查询人和时间，确保信息公开过程可追溯。
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3"><Info className="w-4 h-4 text-gray-500" /><h3 className="text-sm font-semibold text-gray-600">统计口径说明</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-500">
          <div><p className="font-medium text-gray-600 mb-1">资产统计</p><p>资产总数：含全部已登记资产</p><p>闲置资产：状态为「闲置」的资产</p><p>估值：按登记时估值合计</p><p>类型分布：点击可下钻查看该类型资产</p></div>
          <div><p className="font-medium text-gray-600 mb-1">合同统计</p><p>活跃合同：状态为「生效中」的合同</p><p>即将到期：90天内到期的活跃合同</p><p>履约处理：可直接修改合同状态并留痕</p></div>
          <div><p className="font-medium text-gray-600 mb-1">收益统计</p><p>应收/实收/欠缴/减免：各类型合计</p><p>收益趋势：按月汇总，可切换年度</p><p>欠缴处置：可补录实收/减免/催缴</p></div>
          <div><p className="font-medium text-gray-600 mb-1">异常追踪与复查</p><p>严重：合同过期未处理、大额欠缴</p><p>警告：资产闲置、活跃合同无收款</p><p>查询留痕：所有追溯操作自动记录</p><p>公示复查：村民可申请查看并留痕</p></div>
        </div>
      </div>

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setActionModal(null)}>
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {actionModal.type === "contract" && "合同履约处理"}
                {actionModal.type === "arrears" && "欠缴处置"}
                {actionModal.type === "decision" && "议题处理"}
                {actionModal.type === "asset" && "资产详情"}
                {actionModal.type === "revenue_drill" && actionModal.title}
                {actionModal.type === "asset_drill" && actionModal.title}
                {actionModal.type === "contract_drill" && actionModal.title}
                {actionModal.type === "decision_list" && actionModal.title}
              </h2>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-auto flex-1 px-6 py-4">
              {actionModal.type === "contract" && (() => {
                const c = actionModal.data;
                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-medium text-gray-800">{c.contract_no} - {c.asset_name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>经营类型：{CONTRACT_TYPE_LABELS[c.type] || c.type}</p>
                        <p>承租方：{c.lessee_name}</p>
                        <p>起止日期：{c.start_date} ~ {c.end_date}</p>
                        <p>年租金：¥{Number(c.rent_amount).toLocaleString()}</p>
                        <p>付款周期：{c.payment_cycle}</p>
                        <p>当前状态：<span className="font-medium">{CONTRACT_STATUS_LABELS[c.status] || c.status}</span></p>
                      </div>
                      {c.remark && <p className="text-sm text-gray-500">备注：{c.remark}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">变更合同状态</label>
                      <select value={handleContractStatus} onChange={(e) => setHandleContractStatus(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="active">生效中</option>
                        <option value="expired">已到期</option>
                        <option value="terminated">已终止</option>
                        <option value="pending">待签署</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">处理意见</label>
                      <textarea value={handleContractRemark} onChange={(e) => setHandleContractRemark(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="请输入履约处理意见" />
                    </div>
                  </div>
                );
              })()}

              {actionModal.type === "arrears" && (() => {
                const r = actionModal.data;
                return (
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-medium text-red-800">欠缴金额：¥{Number(r.amount).toLocaleString()}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>资产：{r.asset_name || "-"}</p>
                        <p>年度：{r.year}</p>
                        <p>期间：{r.period}</p>
                        <p>说明：{r.description || "-"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">处置方式</label>
                      <select value={handleArrearsAction} onChange={(e) => setHandleArrearsAction(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">请选择处置方式</option>
                        <option value="record_received">补录实收（已补缴）</option>
                        <option value="record_reduction">减免处理</option>
                        <option value="update_status">标记催缴中</option>
                      </select>
                    </div>
                    {handleArrearsAction && handleArrearsAction !== "update_status" && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{handleArrearsAction === "record_received" ? "实收金额" : "减免金额"}</label>
                        <input type="number" value={handleArrearsAmount} onChange={(e) => setHandleArrearsAmount(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="请输入金额" />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">处置备注</label>
                      <textarea value={handleArrearsRemark} onChange={(e) => setHandleArrearsRemark(e.target.value)} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="请输入处置说明" />
                    </div>
                  </div>
                );
              })()}

              {actionModal.type === "decision" && (() => {
                const d = actionModal.data;
                return (
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-medium text-gray-800">{d.topic}</h3>
                      <p className="text-sm text-gray-600">{d.content || "-"}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>类型：{d.decision_type === "vote" ? "表决" : d.decision_type === "discussion" ? "讨论" : "公示"}</p>
                        <p>表决结果：{d.vote_result || "-"}</p>
                        {d.total_voters > 0 && <p>投票：{d.vote_count}/{d.total_voters}</p>}
                        <p>当前状态：{DECISION_STATUS_LABELS[d.status] || d.status}</p>
                      </div>
                      {(d.publish_start || d.publish_end) && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Megaphone className="h-3.5 w-3.5" />公示期：{d.publish_start || "—"} ~ {d.publish_end || "—"}
                        </div>
                      )}
                    </div>
                    {d.objection && (
                      <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                        <strong>异议记录：</strong>{d.objection}
                      </div>
                    )}
                    {d.handling_opinion && (
                      <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                        <strong>处理意见：</strong>{d.handling_opinion}
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">变更状态</label>
                      <select value={handleDecisionStatus} onChange={(e) => setHandleDecisionStatus(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="pending">待审议</option><option value="voting">表决中</option>
                        <option value="published">公示中</option><option value="closed">已结束</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">异议记录</label>
                      <textarea value={handleDecisionObjection} onChange={(e) => setHandleDecisionObjection(e.target.value)} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="如有异议请记录" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">处理意见</label>
                      <textarea value={handleDecisionOpinion} onChange={(e) => setHandleDecisionOpinion(e.target.value)} rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="请输入处理意见" />
                    </div>
                  </div>
                );
              })()}

              {actionModal.type === "asset" && (() => {
                const a = actionModal.data;
                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-medium text-gray-800">{a.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>类型：{TYPE_LABELS[a.type] || a.type}</p>
                        <p>位置：{a.location || "-"}</p>
                        <p>面积：{a.area} {a.area_unit}</p>
                        <p>估值：¥{Number(a.valuation).toLocaleString()}</p>
                        <p>权属：{a.ownership || "-"}</p>
                        <p>状态：{STATUS_LABELS[a.status] || a.status}</p>
                        <p>证书编号：{a.certificate_no || "-"}</p>
                      </div>
                      {a.photo_url && (
                        <div className="mt-2"><p className="text-sm text-gray-600 mb-1">权属材料：</p><a href={a.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm underline">查看照片/证书</a></div>
                      )}
                      {a.remark && <p className="text-sm text-gray-500 mt-2">备注：{a.remark}</p>}
                    </div>
                  </div>
                );
              })()}

              {actionModal.type === "revenue_drill" && (
                actionModal.data.length === 0 ? <p className="text-center text-gray-400 py-8">暂无数据</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-gray-500">
                      <th className="px-3 py-2 text-left font-medium">资产名称</th>
                      <th className="px-3 py-2 text-left font-medium">类型</th>
                      <th className="px-3 py-2 text-left font-medium">金额</th>
                      <th className="px-3 py-2 text-left font-medium">年度</th>
                      <th className="px-3 py-2 text-left font-medium">期间</th>
                      <th className="px-3 py-2 text-left font-medium">说明</th>
                    </tr></thead>
                    <tbody>
                      {actionModal.data.map((r, i) => (
                        <tr key={r.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-3 py-2 text-gray-700">{r.asset_name || "-"}</td>
                          <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.type === "arrears" ? "bg-red-100 text-red-700" : r.type === "received" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{REVENUE_TYPE_LABELS[r.type] || r.type}</span></td>
                          <td className="px-3 py-2 font-medium">¥{Number(r.amount).toLocaleString()}</td>
                          <td className="px-3 py-2 text-gray-700">{r.year}</td>
                          <td className="px-3 py-2 text-gray-700">{r.period}</td>
                          <td className="px-3 py-2 text-gray-500 truncate max-w-[150px]">{r.description || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {actionModal.type === "asset_drill" && (
                actionModal.data.length === 0 ? <p className="text-center text-gray-400 py-8">暂无数据</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-gray-500">
                      <th className="px-3 py-2 text-left font-medium">名称</th>
                      <th className="px-3 py-2 text-left font-medium">类型</th>
                      <th className="px-3 py-2 text-left font-medium">位置</th>
                      <th className="px-3 py-2 text-left font-medium">估值</th>
                      <th className="px-3 py-2 text-left font-medium">状态</th>
                    </tr></thead>
                    <tbody>
                      {actionModal.data.map((a, i) => (
                        <tr key={a.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-3 py-2 text-gray-700">{a.name}</td>
                          <td className="px-3 py-2 text-gray-700">{TYPE_LABELS[a.type] || a.type}</td>
                          <td className="px-3 py-2 text-gray-700">{a.location || "-"}</td>
                          <td className="px-3 py-2">{formatWan(Number(a.valuation))} 万元</td>
                          <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "idle" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {actionModal.type === "contract_drill" && (
                actionModal.data.length === 0 ? <p className="text-center text-gray-400 py-8">暂无数据</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-gray-500">
                      <th className="px-3 py-2 text-left font-medium">合同编号</th>
                      <th className="px-3 py-2 text-left font-medium">资产</th>
                      <th className="px-3 py-2 text-left font-medium">承租方</th>
                      <th className="px-3 py-2 text-left font-medium">年租金</th>
                      <th className="px-3 py-2 text-left font-medium">状态</th>
                      <th className="px-3 py-2 text-left font-medium">到期日</th>
                      <th className="px-3 py-2 text-left font-medium">操作</th>
                    </tr></thead>
                    <tbody>
                      {actionModal.data.map((c, i) => (
                        <tr key={c.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-3 py-2 text-gray-700">{c.contract_no}</td>
                          <td className="px-3 py-2 text-gray-700">{c.asset_name || "-"}</td>
                          <td className="px-3 py-2 text-gray-700">{c.lessee_name}</td>
                          <td className="px-3 py-2">¥{Number(c.rent_amount).toLocaleString()}</td>
                          <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{CONTRACT_STATUS_LABELS[c.status] || c.status}</span></td>
                          <td className="px-3 py-2 text-gray-700">{c.end_date}</td>
                          <td className="px-3 py-2"><button onClick={() => { setActionModal(null); setTimeout(() => openContractHandle(c), 100); }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">处理</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {actionModal.type === "decision_list" && (
                actionModal.data.length === 0 ? <p className="text-center text-gray-400 py-8">暂无数据</p> : (
                  <div className="space-y-3">
                    {actionModal.data.map((d) => (
                      <div key={d.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50/50 cursor-pointer" onClick={() => { setActionModal(null); setTimeout(() => openDecisionHandle(d), 100); }}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-800">{d.topic}</h4>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${d.status === "published" ? "bg-green-100 text-green-700" : d.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{DECISION_STATUS_LABELS[d.status] || d.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{d.content?.slice(0, 80)}{d.content && d.content.length > 80 ? "..." : ""}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                          {d.vote_result && <span>表决：{d.vote_result}</span>}
                          {(d.publish_start || d.publish_end) && <span>公示：{d.publish_start || "—"} ~ {d.publish_end || "—"}</span>}
                          {d.objection && <span className="text-red-500">有异议</span>}
                          {d.handling_opinion && <span className="text-green-500">已处理</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              {(actionModal.type === "contract" || actionModal.type === "arrears" || actionModal.type === "decision") && (
                <button onClick={actionModal.type === "contract" ? saveContractHandle : actionModal.type === "arrears" ? saveArrearsHandle : saveDecisionHandle} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Save className="h-4 w-4" />{saving ? "保存中..." : "保存处理"}
                </button>
              )}
              <button onClick={() => setActionModal(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg, iconBg, onClick, onSubClick, tooltip }: {
  icon: React.ReactNode; label: string; value: string; sub: string; bg: string; iconBg: string;
  onClick?: () => void; onSubClick?: () => void; tooltip?: string;
}) {
  return (
    <div className={`${bg} rounded-lg shadow p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow group`} onClick={onClick} title={tooltip}>
      <div className={`${iconBg} p-2 rounded-lg`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-gray-500">{label}</p>
          {tooltip && <span className="opacity-0 group-hover:opacity-100 transition-opacity" title={tooltip}><Info className="h-3.5 w-3.5 text-gray-400" /></span>}
        </div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 hover:text-blue-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); onSubClick?.(); }}>{sub}</p>
      </div>
    </div>
  );
}
