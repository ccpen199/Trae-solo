import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  MapPin,
  Calendar,
  PieChart,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Clock,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney } from "@/utils/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface OverviewData {
  totalPaymentAmount: number;
  totalPaymentCount: number;
  totalUsers: number;
  avgAmount: number;
  yoyAmount: string;
  momAmount: string;
}

interface RegionRow {
  rank: number;
  province: string;
  amount: number;
  count: number;
  growth: number;
}

export default function DataCenter() {
  const [tab, setTab] = useState<"overview" | "region" | "trend" | "category">("overview");
  const { data: overview } = useApi<OverviewData>("/api/data/overview");
  const { data: region } = useApi<RegionRow[]>("/api/data/region");

  const monthTrend = [
    { month: "1月", 金额: 1250, 笔数: 86 },
    { month: "2月", 金额: 1080, 笔数: 72 },
    { month: "3月", 金额: 1420, 笔数: 95 },
    { month: "4月", 金额: 1380, 笔数: 92 },
    { month: "5月", 金额: 1680, 笔数: 118 },
    { month: "6月", 金额: 1920, 笔数: 135 },
  ];

  const dayTrend = [
    { date: "周一", 金额: 68, 笔数: 4.8 },
    { date: "周二", 金额: 72, 笔数: 5.1 },
    { date: "周三", 金额: 65, 笔数: 4.5 },
    { date: "周四", 金额: 78, 笔数: 5.6 },
    { date: "周五", 金额: 95, 笔数: 6.8 },
    { date: "周六", 金额: 120, 笔数: 8.5 },
    { date: "周日", 金额: 110, 笔数: 7.8 },
  ];

  const categoryData = [
    { name: "水费", value: 3520, color: "#0ea5e9" },
    { name: "电费", value: 5680, color: "#f59e0b" },
    { name: "燃气费", value: 2180, color: "#ef4444" },
    { name: "暖气费", value: 1650, color: "#f97316" },
    { name: "通讯费", value: 4250, color: "#10b981" },
    { name: "社保", value: 3890, color: "#8b5cf6" },
    { name: "其他", value: 1420, color: "#64748b" },
  ];

  const TabButton = ({ k, l, icon: Icon }: { k: typeof tab; l: string; icon: typeof BarChart3 }) => (
    <button
      onClick={() => setTab(k)}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
        tab === k ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-500"
      }`}
    >
      <Icon className="w-4 h-4" /> {l}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b border-slate-200">
          <TabButton k="overview" l="数据总览" icon={BarChart3} />
          <TabButton k="region" l="地域分析" icon={MapPin} />
          <TabButton k="trend" l="时段趋势" icon={Calendar} />
          <TabButton k="category" l="品类聚合" icon={PieChart} />
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto">
            <option>2026年6月</option>
            <option>2026年5月</option>
            <option>2026年Q2</option>
            <option>2026年全年</option>
          </select>
          <button className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> 导出报表
          </button>
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: "缴费总金额", v: overview?.totalPaymentAmount || 0, unit: "万元", sub: "同比", delta: overview?.yoyAmount || "+18.5%", up: true, icon: DollarSign, color: "text-brand-600 bg-brand-50" },
              { l: "缴费总笔数", v: overview?.totalPaymentCount || 0, unit: "万笔", sub: "环比", delta: overview?.momAmount || "+12.3%", up: true, icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
              { l: "活跃用户数", v: overview?.totalUsers || 0, unit: "万人", sub: "同比", delta: "+25.6%", up: true, icon: Users, color: "text-gold-600 bg-gold-50" },
              { l: "单笔均价", v: overview?.avgAmount || 0, unit: "元", sub: "同比", delta: "-3.2%", up: false, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-slate-500">{s.l}</div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-brand-800">{s.v.toLocaleString()}</span>
                        <span className="text-sm text-slate-500">{s.unit}</span>
                      </div>
                      <div className={`text-xs mt-2 flex items-center gap-1 ${s.up ? "text-emerald-600" : "text-rose-500"}`}>
                        {s.sub} {s.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />} {s.delta}
                      </div>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3 className="section-title">
              <TrendingUp className="w-5 h-5 text-brand-500" /> 近6个月缴费趋势
            </h3>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={monthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="金额" stroke="#1B3A5C" strokeWidth={3} dot={{ r: 4, fill: "#1B3A5C" }} />
                  <Line yAxisId="right" type="monotone" dataKey="笔数" stroke="#D4A843" strokeWidth={3} dot={{ r: 4, fill: "#D4A843" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === "region" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-1">
            <h3 className="section-title mb-1">
              <MapPin className="w-5 h-5" /> 省份缴费分布
            </h3>
            <p className="text-xs text-slate-500 mb-4">颜色越深表示缴费金额越高</p>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { p: "京", a: 92 }, { p: "沪", a: 88 }, { p: "粤", a: 95 }, { p: "浙", a: 78 }, { p: "苏", a: 82 },
                { p: "鲁", a: 65 }, { p: "川", a: 58 }, { p: "豫", a: 52 }, { p: "鄂", a: 48 }, { p: "湘", a: 45 },
                { p: "闽", a: 55 }, { p: "皖", a: 42 }, { p: "冀", a: 50 }, { p: "陕", a: 38 }, { p: "辽", a: 44 },
                { p: "赣", a: 35 }, { p: "渝", a: 40 }, { p: "吉", a: 32 }, { p: "黑", a: 30 }, { p: "晋", a: 36 },
                { p: "桂", a: 28 }, { p: "云", a: 25 }, { p: "贵", a: 22 }, { p: "甘", a: 18 }, { p: "琼", a: 15 },
              ].map((r) => (
                <div
                  key={r.p}
                  className="aspect-square flex items-center justify-center rounded text-xs font-medium text-white shadow-sm"
                  style={{
                    backgroundColor: `rgba(27, 58, 92, ${0.2 + r.a / 120})`,
                  }}
                >
                  {r.p}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>低</span>
              <div className="flex gap-0.5">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((op, i) => (
                  <div key={i} className="w-6 h-2" style={{ backgroundColor: `rgba(27,58,92,${op})` }} />
                ))}
              </div>
              <span>高</span>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="section-title">
              <Filter className="w-5 h-5" /> 省份排行榜（Top 10）
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium w-16">排名</th>
                    <th className="text-left py-2.5 px-4 font-medium">省份</th>
                    <th className="text-right py-2.5 px-4 font-medium">缴费金额（万元）</th>
                    <th className="text-right py-2.5 px-4 font-medium">缴费笔数（万笔）</th>
                    <th className="text-right py-2.5 px-4 font-medium">同比增长</th>
                  </tr>
                </thead>
                <tbody>
                  {(region || []).map((r) => (
                    <tr key={r.province} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                          r.rank <= 3 ? "bg-gold-gradient text-brand-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {r.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-brand-700">{r.province}</td>
                      <td className="py-2.5 px-4 text-right font-semibold">{r.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right">{r.count.toLocaleString()}</td>
                      <td className={`py-2.5 px-4 text-right font-medium ${r.growth >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {r.growth >= 0 ? "+" : ""}{r.growth}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "trend" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="section-title">
              <Calendar className="w-5 h-5" /> 周内缴费分布
            </h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={dayTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  <Legend />
                  <Bar dataKey="金额" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="笔数" fill="#D4A843" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">
              <Clock className="w-5 h-5" /> 时段高峰分析
            </h3>
            <div className="space-y-3 mt-2">
              {[
                { t: "08:00 - 10:00", p: 15, l: "早高峰" },
                { t: "10:00 - 12:00", p: 22, l: "最高峰" },
                { t: "12:00 - 14:00", p: 12, l: "午间次峰" },
                { t: "14:00 - 18:00", p: 18, l: "下午平稳" },
                { t: "18:00 - 22:00", p: 28, l: "晚间高峰" },
                { t: "22:00 - 08:00", p: 5, l: "夜间低谷" },
              ].map((s) => (
                <div key={s.t}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{s.t}</span>
                    <span className="text-slate-500 text-xs">{s.l} · {s.p}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
                      style={{ width: `${s.p * 3}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "category" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="section-title">
              <PieChart className="w-5 h-5" /> 缴费品类占比
            </h3>
            <div className="h-72">
              <ResponsiveContainer>
                <RePieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((e, idx) => (
                      <Cell key={idx} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} 万元`} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="section-title">
              <CreditCard className="w-5 h-5" /> 品类明细分析
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium">缴费品类</th>
                    <th className="text-right py-2.5 px-4 font-medium">金额（万元）</th>
                    <th className="text-right py-2.5 px-4 font-medium">占比</th>
                    <th className="text-right py-2.5 px-4 font-medium">笔数（万笔）</th>
                    <th className="text-right py-2.5 px-4 font-medium">均价</th>
                    <th className="text-right py-2.5 px-4 font-medium">同比</th>
                    <th className="text-right py-2.5 px-4 font-medium">趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((c, idx) => {
                    const total = categoryData.reduce((s, x) => s + x.value, 0);
                    const pct = (c.value / total) * 100;
                    const avg = c.value / (idx + 2);
                    const growth = [12, 18, -5, 8, 22, 15, -2][idx];
                    return (
                      <tr key={c.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-medium">
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold">{c.value.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right">{pct.toFixed(1)}%</td>
                        <td className="py-2.5 px-4 text-right">{(idx * 12 + 30).toFixed(0)}</td>
                        <td className="py-2.5 px-4 text-right">{formatMoney(avg * 10000 / ((idx + 2) * 10000))}</td>
                        <td className={`py-2.5 px-4 text-right font-medium ${growth >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {growth >= 0 ? "+" : ""}{growth}%
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="h-8 w-20 inline-flex items-end gap-0.5">
                            {[0.5, 0.7, 0.6, 0.8, 0.9, 1].map((h, i) => (
                              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 100}%`, backgroundColor: c.color }} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
