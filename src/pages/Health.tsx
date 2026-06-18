import { useState } from "react";
import { motion } from "framer-motion";
import {
  Pulse,
  WarningCircle,
  Fire,
  ArrowsClockwise,
  Bell,
  BellSlash,
  ShieldWarning,
  ClockCounterClockwise,
  TrendUp,
  ChartBar,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const healthScore = 87.6;

const expiryTrend = [
  { day: "06-12", 紧急: 3.2, 警告: 5.8, 正常: 2.1 },
  { day: "06-13", 紧急: 2.8, 警告: 6.1, 正常: 1.9 },
  { day: "06-14", 紧急: 4.1, 警告: 5.3, 正常: 2.4 },
  { day: "06-15", 紧急: 3.6, 警告: 7.2, 正常: 1.7 },
  { day: "06-16", 紧急: 2.5, 警告: 6.8, 正常: 2.0 },
  { day: "06-17", 紧急: 3.9, 警告: 5.5, 正常: 2.3 },
  { day: "06-18", 紧急: 3.1, 警告: 6.4, 正常: 1.8 },
];

interface ExpiryItem {
  id: string;
  name: string;
  source: string;
  expiryDate: string;
  daysLeft: number;
  notify: boolean;
}

const expiryItems: ExpiryItem[] = [
  { id: "1", name: "航空延误险", source: "平安保险", expiryDate: "2026-06-20", daysLeft: 2, notify: true },
  { id: "2", name: "话费充值券", source: "中国电信", expiryDate: "2026-06-21", daysLeft: 3, notify: true },
  { id: "3", name: "信用卡积分", source: "招商银行", expiryDate: "2026-06-24", daysLeft: 6, notify: false },
  { id: "4", name: "会员权益卡", source: "星巴克咖啡", expiryDate: "2026-06-25", daysLeft: 7, notify: true },
  { id: "5", name: "流量包兑换", source: "中国电信", expiryDate: "2026-06-30", daysLeft: 12, notify: false },
  { id: "6", name: "出行优惠券", source: "中国东方航空", expiryDate: "2026-07-05", daysLeft: 17, notify: true },
];

interface AnomalyTx {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  time: string;
  level: "高" | "中" | "低";
  status: "未处理" | "已处理" | "已忽略";
}

const anomalyTxList: AnomalyTx[] = [
  { id: "1", orderId: "TXN-8F3A-2C91", type: "积分兑换", reason: "频率异常", time: "06-18 09:32", level: "高", status: "未处理" },
  { id: "2", orderId: "TXN-4D7B-1E56", type: "话费充值", reason: "金额异常", time: "06-18 08:15", level: "中", status: "未处理" },
  { id: "3", orderId: "TXN-2A9C-7F83", type: "保险兑付", reason: "重复兑换", time: "06-17 22:47", level: "高", status: "已处理" },
  { id: "4", orderId: "TXN-6E1D-3B24", type: "里程兑换", reason: "频率异常", time: "06-17 18:30", level: "低", status: "已忽略" },
  { id: "5", orderId: "TXN-5F8A-9D12", type: "优惠券核销", reason: "金额异常", time: "06-17 14:22", level: "中", status: "未处理" },
];

const activityData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  兑换量: i < 6 ? Math.floor(Math.random() * 20 + 5) : i < 12 ? Math.floor(Math.random() * 60 + 40) : i < 18 ? Math.floor(Math.random() * 80 + 60) : Math.floor(Math.random() * 30 + 15),
}));

const levelColor = { 高: "bg-risk/15 text-risk border-risk/30", 中: "bg-warn/15 text-warn border-warn/30", 低: "bg-gold-400/15 text-gold-300 border-gold-400/30" };
const statusColor = { 未处理: "bg-risk/15 text-risk", 已处理: "bg-insurance/15 text-insurance", 已忽略: "bg-gray-500/15 text-gray-400" };

function expiryLevel(days: number) {
  if (days <= 3) return { label: "紧急", cls: "bg-risk/15 text-risk border-risk/30" };
  if (days <= 7) return { label: "警告", cls: "bg-warn/15 text-warn border-warn/30" };
  return { label: "正常", cls: "bg-insurance/15 text-insurance border-insurance/30" };
}

function RingProgress({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(201,169,98,0.1)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700" />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9A962" />
          <stop offset="100%" stopColor="#8B7435" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Health() {
  const [items, setItems] = useState(expiryItems);

  const toggleNotify = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, notify: !it.notify } : it)));
  };

  const metrics = [
    {
      icon: Pulse,
      label: "综合健康度",
      value: `${healthScore}%`,
      color: "text-gold-300",
      extra: <RingProgress value={healthScore} />,
    },
    {
      icon: WarningCircle,
      label: "过期预警数",
      value: "42",
      color: "text-warn",
      sub: (
        <div className="flex gap-2 mt-1">
          <span className="text-[10px] text-risk">红 8</span>
          <span className="text-[10px] text-warn">黄 14</span>
          <span className="text-[10px] text-insurance">绿 20</span>
        </div>
      ),
    },
    {
      icon: Fire,
      label: "今日异常交易",
      value: "7",
      color: "text-risk",
      sub: <span className="text-[10px] text-gray-500">较昨日 +3</span>,
    },
    {
      icon: ArrowsClockwise,
      label: "兑换成功率",
      value: "96.8%",
      color: "text-insurance",
      sub: <span className="text-[10px] text-insurance">环比 +1.2%</span>,
    },
  ];

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold gold-gradient-text font-display">权益健康监控</h1>
          <p className="text-gray-400 mt-2 text-sm">过期率预警 · 兑换活跃度 · 异常交易告警</p>
        </motion.div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-space-700/50 flex items-center justify-center">
                    <Icon size={18} className={m.color} />
                  </div>
                  {m.extra && <div className="absolute right-4 top-4">{m.extra}</div>}
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-100 font-mono">{m.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.label}</div>
                  {m.sub}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={18} className="text-gold-400" />
            <h3 className="text-sm font-semibold text-gold-100">过期率趋势（近7天）</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={expiryTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,169,98,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(201,169,98,0.3)", borderRadius: "8px", color: "#E5E7EB", fontSize: "12px" }} labelStyle={{ color: "#C9A962" }} />
                <Line type="monotone" dataKey="紧急" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="警告" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="正常" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-5 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="col-span-3 glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <WarningCircle size={18} className="text-warn" />
              <h3 className="text-sm font-semibold text-gold-100">过期预警看板</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((it) => {
                const lv = expiryLevel(it.daysLeft);
                return (
                  <div key={it.id} className="flex items-center justify-between p-3 rounded-lg bg-space-800/40 border border-gold-400/5 hover:border-gold-400/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center">
                        <ShieldWarning size={14} className="text-gold-300" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-200">{it.name}</div>
                        <div className="text-xs text-gray-500">{it.source} · {it.expiryDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] border", lv.cls)}>
                        {lv.label} {it.daysLeft}天
                      </span>
                      <button onClick={() => toggleNotify(it.id)} className="p-1 rounded hover:bg-gold-400/10 transition-colors">
                        {it.notify ? <Bell size={14} className="text-gold-400" /> : <BellSlash size={14} className="text-gray-600" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-2 glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Fire size={18} className="text-risk" />
              <h3 className="text-sm font-semibold text-gold-100">异常交易告警</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {anomalyTxList.map((tx) => (
                <div key={tx.id} className="p-2.5 rounded-lg bg-space-800/40 border border-gold-400/5 hover:border-gold-400/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-300">{tx.orderId}</span>
                    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border", levelColor[tx.level])}>{tx.level}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-500">{tx.type} · {tx.reason}</span>
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px]", statusColor[tx.status])}>{tx.status}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                    <ClockCounterClockwise size={10} />{tx.time}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} className="text-gold-400" />
            <h3 className="text-sm font-semibold text-gold-100">兑换活跃度分析</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A962" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#C9A962" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,169,98,0.08)" vertical={false} />
                <XAxis dataKey="hour" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(201,169,98,0.3)", borderRadius: "8px", color: "#E5E7EB", fontSize: "12px" }} labelStyle={{ color: "#C9A962" }} />
                <Area type="monotone" dataKey="兑换量" stroke="#C9A962" strokeWidth={2} fill="url(#actGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
