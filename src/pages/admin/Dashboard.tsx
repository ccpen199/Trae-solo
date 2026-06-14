import { motion } from "framer-motion";
import { BarChart3, Users, UserPlus, Coins, Wallet } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ComposedChart, Line, ResponsiveContainer,
} from "recharts";
import { dashboardMetrics } from "@/mock";

const { dau, dauTrend, newUsers, coinIssued, withdrawalAmount, taskROI, ltvDistribution, adRevenue } = dashboardMetrics;

const kpis = [
  { label: "DAU", value: dau.toLocaleString(), change: +12.5, icon: Users },
  { label: "新增用户", value: newUsers.toLocaleString(), change: +8.3, icon: UserPlus },
  { label: "金币发放", value: `${(coinIssued / 1e6).toFixed(2)}M`, change: -2.1, icon: Coins },
  { label: "提现金额", value: `¥${withdrawalAmount.toLocaleString()}`, change: +15.7, icon: Wallet },
];

const maxRetention = Math.max(...taskROI.map((t) => t.retention7d));
const maxConversion = Math.max(...taskROI.map((t) => t.conversionRate));

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-night-900 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-gold-400" />
          <h1 className="font-display text-2xl font-bold text-white">数据看板</h1>
        </div>
        <span className="text-xs text-white/30">
          最后更新：{new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="card flex items-center gap-4 px-5 py-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-night-600">
              <kpi.icon className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">{kpi.label}</p>
              <p className="gold-text font-display text-xl font-bold">{kpi.value}</p>
              <span className={`text-xs font-medium ${kpi.change >= 0 ? "text-emerald" : "text-coral"}`}>
                {kpi.change >= 0 ? "+" : ""}{kpi.change}% 较昨日
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/70">DAU 趋势</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dauTrend}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "rgba(255,255,255,0.5)" }} itemStyle={{ color: "#FBBF24" }} />
              <Area type="monotone" dataKey="value" stroke="#FBBF24" strokeWidth={2.5} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/70">LTV 分布</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ltvDistribution} layout="vertical" barCategoryGap="20%">
              <defs>
                <linearGradient id="ltuGoldGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="segment" width={110} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "rgba(255,255,255,0.5)" }} itemStyle={{ color: "#FBBF24" }} />
              <Bar dataKey="avgLtv" fill="url(#ltuGoldGrad)" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card mt-5 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white/70">任务 ROI</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs text-white/35">
              <th className="pb-3 font-medium">任务名称</th>
              <th className="pb-3 font-medium">获客成本</th>
              <th className="pb-3 font-medium">7日留存率</th>
              <th className="pb-3 font-medium">变现转化率</th>
            </tr>
          </thead>
          <tbody>
            {taskROI.map((row) => {
              const isBestRetention = row.retention7d === maxRetention;
              const isBestConversion = row.conversionRate === maxConversion;
              return (
                <tr key={row.taskId} className="border-b border-white/5">
                  <td className="py-3 text-white/80">{row.taskName}</td>
                  <td className="py-3 text-white/60">¥{row.costPerUser.toFixed(2)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-night-600">
                        <div
                          className={`h-full rounded-full ${isBestRetention ? "bg-emerald" : "bg-gold-400"}`}
                          style={{ width: `${row.retention7d * 100}%` }}
                        />
                      </div>
                      <span className={isBestRetention ? "text-emerald" : "text-white/50"}>
                        {(row.retention7d * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-night-600">
                        <div
                          className={`h-full rounded-full ${isBestConversion ? "bg-emerald" : "bg-gold-400"}`}
                          style={{ width: `${row.conversionRate * 100}%` }}
                        />
                      </div>
                      <span className={isBestConversion ? "text-emerald" : "text-white/50"}>
                        {(row.conversionRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="card mt-5 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white/70">广告收入 & eCPM</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={adRevenue}>
            <defs>
              <linearGradient id="barGoldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "rgba(255,255,255,0.5)" }} />
            <Bar yAxisId="left" dataKey="revenue" fill="url(#barGoldGrad)" radius={[4, 4, 0, 0]} barSize={18} />
            <Line yAxisId="right" type="monotone" dataKey="ecpm" stroke="#00C853" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
