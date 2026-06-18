import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer as RC,
} from "recharts";
import {
  TrendUp,
  Users,
  Database,
  Handshake,
  Coins,
  Ticket,
  Clock,
  ArrowUpRight,
  Warning,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const statCards = [
  { key: "todayTransaction", label: "今日交易量", icon: TrendUp, suffix: "笔" },
  { key: "activeUsers", label: "活跃用户", icon: Users, suffix: "人" },
  { key: "totalDeposits", label: "存证总量", icon: Database, suffix: "条" },
  { key: "partners", label: "合作方数量", icon: Handshake, suffix: "家" },
  { key: "totalValue", label: "权益总估值", icon: Coins, suffix: "元" },
  { key: "todayRedemption", label: "今日核销数", icon: Ticket, suffix: "笔" },
];

const statusColors = {
  success: "bg-emerald-400",
  pending: "bg-gold-400",
  failed: "bg-risk",
};

const statusTexts = {
  success: "成功",
  pending: "处理中",
  failed: "失败",
};

const levelColors = {
  red: "bg-risk",
  yellow: "bg-warn",
  green: "bg-emerald-400",
};

const levelTexts = {
  red: "紧急",
  yellow: "关注",
  green: "正常",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toLocaleString();
}

export default function Dashboard() {
  const { dashboard } = useAppStore();
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollOffset((prev) => (prev + 1) % dashboard.transactionList.length);
    }, 800);
    return () => clearInterval(interval);
  }, [dashboard.transactionList.length]);

  return (
    <div className="relative z-10 p-6 min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto"
      >
        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold mb-8 gold-gradient-text font-display"
        >
          数据总览
        </motion.h1>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
        >
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            const value = dashboard.stats[card.key as keyof typeof dashboard.stats];
            return (
              <motion.div
                key={card.key}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="glass-card glass-card-hover p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-glow-gold rounded-full -translate-y-8 translate-x-8 opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gold-300/80 text-sm">{card.label}</span>
                    <div className="w-9 h-9 rounded-lg bg-gold-500/15 flex items-center justify-center">
                      <Icon size={18} className="text-gold-400" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gold-200 font-mono">
                      {formatNumber(value)}
                    </span>
                    <span className="text-xs text-gold-300/60">{card.suffix}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight size={12} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400">
                      +{(Math.random() * 10 + 2).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        >
          <motion.div
            variants={itemVariants}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gold-200">7日交易量趋势</h3>
              <span className="text-xs text-gold-300/60">单位：笔</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.volume7d} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DCBC62" stopOpacity={0.5} />
                      <stop offset="50%" stopColor="#C9A962" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#B8943F" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,169,98,0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(201,169,98,0.4)"
                    tick={{ fill: "rgba(201,169,98,0.6)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(201,169,98,0.4)"
                    tick={{ fill: "rgba(201,169,98,0.6)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,22,40,0.95)",
                      border: "1px solid rgba(201,169,98,0.3)",
                      borderRadius: "8px",
                      color: "#F4E8C8",
                      fontFamily: "Space Grotesk",
                    }}
                    labelStyle={{ color: "#C9A962" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#DCBC62"
                    strokeWidth={2.5}
                    fill="url(#goldGradient)"
                    dot={{ r: 4, fill: "#DCBC62", stroke: "#0A1628", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#F4E8C8" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gold-200">实时交易流</h3>
              <div className="flex items-center gap-2">
                <span className="status-dot pulse bg-emerald-400" />
                <span className="text-xs text-gold-300/60">实时更新中</span>
              </div>
            </div>
            <div className="h-72 overflow-hidden relative">
              <motion.div
                animate={{ y: -scrollOffset * 52 }}
                transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
              >
                {[...dashboard.transactionList, ...dashboard.transactionList].map((tx, idx) => (
                  <div
                    key={`${tx.id}-${idx}`}
                    className="flex items-center justify-between py-3 border-b border-gold-500/10 last:border-0"
                    style={{ height: 52 }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "status-dot",
                          statusColors[tx.status]
                        )}
                      />
                      <div>
                        <div className="text-sm text-gold-100 font-medium">
                          {tx.action}
                        </div>
                        <div className="text-xs text-gold-300/50">
                          {tx.party}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-gold-300">
                        +{tx.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gold-300/50">{tx.time}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-space-900/80 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gold-200 mb-4">权益健康度</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dashboard.radarData}>
                  <PolarGrid stroke="rgba(201,169,98,0.15)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#C9A962", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: "rgba(201,169,98,0.5)", fontSize: 10 }}
                    axisLine={false}
                    tickCount={5}
                  />
                  <Radar
                    name="健康度"
                    dataKey="value"
                    stroke="#DCBC62"
                    fill="#DCBC62"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,22,40,0.95)",
                      border: "1px solid rgba(201,169,98,0.3)",
                      borderRadius: "8px",
                      color: "#F4E8C8",
                      fontFamily: "Space Grotesk",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Warning size={20} className="text-gold-400" />
              <h3 className="text-lg font-semibold text-gold-200">过期预警</h3>
            </div>
            <div className="space-y-3">
              {dashboard.expiringSoon.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-space-900/50 border border-gold-500/10 hover:border-gold-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.level === "red" && "bg-risk/15",
                        item.level === "yellow" && "bg-warn/15",
                        item.level === "green" && "bg-emerald-500/15"
                      )}
                    >
                      <Clock
                        size={18}
                        className={cn(
                          item.level === "red" && "text-risk",
                          item.level === "yellow" && "text-warn",
                          item.level === "green" && "text-emerald-400"
                        )}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gold-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-gold-300/50">
                        到期日：{item.expireDate}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-gold-300">
                      ¥{item.value}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          levelColors[item.level]
                        )}
                      />
                      <span className="text-xs text-gold-300/60">
                        {item.daysLeft}天后 · {levelTexts[item.level]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
