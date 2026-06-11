import { useState } from "react";
import {
  Lock,
  Shield,
  TrendingUp,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Download,
  Eye,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface FundOverview {
  totalAssets: number;
  availableAmount: number;
  frozenAmount: number;
  todayInflow: number;
  todayOutflow: number;
  supervisionStatus: "normal" | "warning" | "frozen";
}

interface FundTx {
  id: string;
  type: "inflow" | "outflow" | "freeze" | "unfreeze";
  amount: number;
  balanceAfter: number;
  relatedContract: string;
  counterparty: string;
  status: "completed" | "processing" | "failed";
  createdDate: string;
  remark: string;
}

const TYPE_LABEL: Record<string, { label: string; color: string; icon: typeof DollarSign }> = {
  inflow: { label: "资金划入", color: "text-emerald-600 bg-emerald-50", icon: ArrowDownRight },
  outflow: { label: "资金划出", color: "text-rose-600 bg-rose-50", icon: ArrowUpRight },
  freeze: { label: "资金冻结", color: "text-amber-600 bg-amber-50", icon: Lock },
  unfreeze: { label: "资金解冻", color: "text-brand-600 bg-brand-50", icon: Shield },
};

export default function FundSupervision() {
  const [tab, setTab] = useState<"overview" | "tx">("overview");
  const { data: overview } = useApi<FundOverview>("/api/finance/fund/overview");
  const { data: txs } = useApi<FundTx[]>("/api/finance/fund/transactions");
  const trendData = [
    { date: "06-04", balance: 850000 },
    { date: "06-05", balance: 920000 },
    { date: "06-06", balance: 880000 },
    { date: "06-07", balance: 1050000 },
    { date: "06-08", balance: 1120000 },
    { date: "06-09", balance: 1080000 },
    { date: "06-10", balance: 1256800 },
  ];

  const statusBadge = (s: FundTx["status"]) => {
    if (s === "completed") return <span className="tag-success"><CheckCircle2 className="w-3 h-3" />成功</span>;
    if (s === "processing") return <span className="tag-warning"><Clock className="w-3 h-3" />处理中</span>;
    return <span className="tag-danger"><XCircle className="w-3 h-3" />失败</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { k: "overview", l: "资金总览", icon: Lock },
          { k: "tx", l: "交易流水", icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.k
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-brand-500"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                l: "监管资金总额",
                v: overview?.totalAssets || 0,
                sub: "由光大银行监管",
                c: "from-brand-500 to-brand-700",
                icon: Lock,
              },
              {
                l: "可用余额",
                v: overview?.availableAmount || 0,
                sub: "可用于划转",
                c: "from-emerald-500 to-emerald-700",
                icon: DollarSign,
              },
              {
                l: "冻结金额",
                v: overview?.frozenAmount || 0,
                sub: "履约/质押中",
                c: "from-amber-500 to-amber-700",
                icon: Shield,
              },
              {
                l: "今日净额",
                v: (overview?.todayInflow || 0) - (overview?.todayOutflow || 0),
                sub: `划入${formatMoney(overview?.todayInflow || 0)} / 划出${formatMoney(overview?.todayOutflow || 0)}`,
                c: "from-gold-500 to-gold-600",
                icon: TrendingUp,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className={`relative bg-gradient-to-br ${s.c} text-white rounded-xl2 shadow-card p-5 overflow-hidden`}>
                  <div className="absolute right-3 top-3 opacity-20">
                    <Icon className="w-14 h-14" />
                  </div>
                  <div className="text-sm/relaxed opacity-90">{s.l}</div>
                  <div className="text-2xl font-bold mt-1">{formatMoney(s.v)}</div>
                  <div className="text-xs opacity-75 mt-1">{s.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <h3 className="section-title">
                <TrendingUp className="w-5 h-5 text-brand-500" /> 近7日资金余额走势
              </h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A843" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#D4A843" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                    <Tooltip
                      formatter={(v: number) => formatMoney(v)}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#D4A843" strokeWidth={2.5} fill="url(#balGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">
                <Shield className="w-5 h-5 text-brand-500" /> 监管状态
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-700">监管账户状态正常</div>
                    <div className="text-xs text-emerald-600/80">托管行：中国光大银行 · 实时对账</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { l: "资金存管", v: "光大银行专用账户" },
                    { l: "监管频率", v: "T+0 实时监控" },
                    { l: "对账周期", v: "每日自动对账" },
                    { l: "审计机制", v: "季度第三方审计" },
                    { l: "保险保障", v: "存款保险 50万/户" },
                  ].map((i) => (
                    <div key={i.l} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-slate-500">{i.l}</span>
                      <span className="font-medium text-slate-700">{i.v}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-secondary w-full mt-2">
                  <Building2 className="w-4 h-4" /> 查看银行存管报告
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "tx" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex gap-1">
              {[
                { k: "all", l: "全部" },
                { k: "inflow", l: "划入" },
                { k: "outflow", l: "划出" },
                { k: "freeze", l: "冻结" },
              ].map((f) => (
                <button key={f.k} className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 text-slate-600 transition">
                  {f.l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9 w-56" placeholder="搜索合同号/对手方" />
              </div>
              <button className="btn-secondary text-sm">
                <Download className="w-4 h-4" /> 导出
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">流水号</th>
                  <th className="text-left py-3 px-4 font-medium">类型</th>
                  <th className="text-left py-3 px-4 font-medium">金额</th>
                  <th className="text-left py-3 px-4 font-medium">变动后余额</th>
                  <th className="text-left py-3 px-4 font-medium">关联合同</th>
                  <th className="text-left py-3 px-4 font-medium">对手方</th>
                  <th className="text-left py-3 px-4 font-medium">时间</th>
                  <th className="text-left py-3 px-4 font-medium">状态</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(txs || []).map((t) => {
                  const meta = TYPE_LABEL[t.type];
                  const Icon = meta.icon;
                  return (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{t.id}</td>
                      <td className="py-3 px-4">
                        <span className={`${meta.color} tag`}>
                          <Icon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${t.type === "inflow" || t.type === "unfreeze" ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === "inflow" || t.type === "unfreeze" ? "+" : "-"}{formatMoney(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatMoney(t.balanceAfter)}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{t.relatedContract}</td>
                      <td className="py-3 px-4 text-slate-700">{t.counterparty}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(t.createdDate)}</td>
                      <td className="py-3 px-4">{statusBadge(t.status)}</td>
                      <td className="py-3 px-4">
                        <button className="btn-ghost text-xs px-2 py-1 text-brand-500">
                          <Eye className="w-3.5 h-3.5" /> 凭证
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
