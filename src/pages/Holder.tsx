import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  CurrencyDollar,
  Lock,
  Alarm,
  Shield,
  Building,
  Airplane,
  SimCard,
  Eye,
  ArrowsClockwise,
  XCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

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

const accountIcons = {
  insurance: Shield,
  bank: Building,
  airline: Airplane,
  telecom: SimCard,
};

const accountGradients = {
  insurance: "from-emerald-500/30 via-emerald-500/10 to-transparent",
  bank: "from-blue-500/30 via-blue-500/10 to-transparent",
  airline: "from-purple-500/30 via-purple-500/10 to-transparent",
  telecom: "from-cyan-500/30 via-cyan-500/10 to-transparent",
};

const accountBorders = {
  insurance: "border-emerald-500/30",
  bank: "border-blue-500/30",
  airline: "border-purple-500/30",
  telecom: "border-cyan-500/30",
};

const accountGlows = {
  insurance: "shadow-glow-green",
  bank: "shadow-glow-blue",
  airline: "0 0 30px -5px rgba(124,58,237,0.45)",
  telecom: "0 0 30px -5px rgba(6,182,212,0.45)",
};

const accountTextColors = {
  insurance: "text-emerald-400",
  bank: "text-blue-400",
  airline: "text-purple-400",
  telecom: "text-cyan-400",
};

const statusConfig = {
  completed: { icon: CheckCircle, text: "已完成", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  processing: { icon: ArrowsClockwise, text: "处理中", color: "text-gold-400", bg: "bg-gold-500/15" },
  failed: { icon: XCircle, text: "失败", color: "text-risk", bg: "bg-risk/15" },
};

function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toLocaleString();
}

export default function Holder() {
  const { holder } = useAppStore();
  const total = holder.available + holder.frozen + holder.expiringSoon;
  const ringProgress = (holder.available / holder.totalValuation) * 100;

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
          我的资产
        </motion.h1>

        <motion.div variants={itemVariants} className="glass-card p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-glow-gold rounded-full -translate-y-32 -translate-x-32 opacity-60" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-glow-gold rounded-full translate-y-24 translate-x-24 opacity-40" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(201,169,98,0.12)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - ringProgress / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F4E8C8" />
                    <stop offset="50%" stopColor="#C9A962" />
                    <stop offset="100%" stopColor="#95752F" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gold-300/60 mb-1">总估值</span>
                <span className="text-2xl font-bold gold-gradient-text font-mono">
                  ¥{formatNumber(holder.totalValuation)}
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              <div className="p-5 rounded-xl bg-space-900/50 border border-gold-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gold-500/15 flex items-center justify-center">
                    <CurrencyDollar size={18} className="text-gold-400" />
                  </div>
                  <span className="text-sm text-gold-300/70">可用资产</span>
                </div>
                <div className="text-2xl font-bold text-gold-100 font-mono">
                  ¥{formatNumber(holder.available)}
                </div>
                <div className="text-xs text-gold-300/50 mt-1">
                  占比 {((holder.available / holder.totalValuation) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="p-5 rounded-xl bg-space-900/50 border border-gold-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Lock size={18} className="text-blue-400" />
                  </div>
                  <span className="text-sm text-gold-300/70">冻结资产</span>
                </div>
                <div className="text-2xl font-bold text-gold-100 font-mono">
                  ¥{formatNumber(holder.frozen)}
                </div>
                <div className="text-xs text-gold-300/50 mt-1">
                  占比 {((holder.frozen / holder.totalValuation) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="p-5 rounded-xl bg-space-900/50 border border-risk/20 col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-risk/15 flex items-center justify-center">
                    <Alarm size={18} className="text-risk" />
                  </div>
                  <span className="text-sm text-gold-300/70">即将过期</span>
                </div>
                <div className="text-2xl font-bold text-gold-100 font-mono">
                  ¥{formatNumber(holder.expiringSoon)}
                </div>
                <div className="text-xs text-risk mt-1">
                  请尽快使用，避免损失
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {holder.accounts.map((account) => {
            const Icon = accountIcons[account.color as keyof typeof accountIcons];
            const sparkData = account.trend.map((v, i) => ({ v, i }));
            return (
              <motion.div
                key={account.id}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className={cn(
                  "glass-card glass-card-hover p-5 relative overflow-hidden",
                  accountBorders[account.color as keyof typeof accountBorders]
                )}
                style={{
                  boxShadow:
                    account.color === "airline" || account.color === "telecom"
                      ? accountGlows[account.color as keyof typeof accountGlows]
                      : undefined,
                }}
              >
                <div
                  className={cn(
                    "absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 opacity-60 bg-gradient-to-br",
                    accountGradients[account.color as keyof typeof accountGradients]
                  )}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center bg-space-900/80 border",
                          accountBorders[account.color as keyof typeof accountBorders]
                        )}
                      >
                        <Icon
                          size={20}
                          className={accountTextColors[account.color as keyof typeof accountTextColors]}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gold-100">
                          {account.sourceName}
                        </div>
                        <div className="text-xs text-gold-300/50">{account.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gold-300/60">估值</span>
                      <span className="text-sm font-mono text-gold-200">
                        ¥{formatNumber(account.valuation)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-gold-300/50">账户余额</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gold-100 font-mono">
                        {account.balance.toLocaleString()}
                      </span>
                      <span className="text-xs text-gold-300/50">{account.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Alarm size={12} className="text-risk" />
                      <span className="text-xs text-risk">
                        {account.expireSoon.toLocaleString()} {account.unit}即将过期
                      </span>
                    </div>
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={
                              account.color === "insurance"
                                ? "#10B981"
                                : account.color === "bank"
                                ? "#3B82F6"
                                : account.color === "airline"
                                ? "#7C3AED"
                                : "#06B6D4"
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gold-200 mb-5">最近兑换记录</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-500/10">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gold-300/60">
                    订单号
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gold-300/60">
                    权益名称
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gold-300/60">
                    积分扣减
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gold-300/60">
                    现金
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gold-300/60">
                    状态
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gold-300/60">
                    时间
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gold-300/60">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {holder.exchangeRecords.map((record) => {
                  const StatusCfg = statusConfig[record.status];
                  const StatusIcon = StatusCfg.icon;
                  return (
                    <motion.tr
                      key={record.orderNo}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gold-500/5 hover:bg-gold-500/5 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-mono text-gold-300/80">
                        {record.orderNo}
                      </td>
                      <td className="py-4 px-4 text-sm text-gold-100">
                        {record.benefitName}
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-gold-300 text-right">
                        -{record.pointsDeducted.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-risk text-right">
                        {record.cash > 0 ? `¥${record.cash}` : "-"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs",
                            StatusCfg.bg,
                            StatusCfg.color
                          )}
                        >
                          <StatusIcon size={12} />
                          {StatusCfg.text}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gold-300/60">
                        {record.time}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors">
                          <Eye size={12} />
                          详情
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
