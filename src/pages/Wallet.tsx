import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";
import { useAppStore } from "@/store";
import { transactions } from "@/mock";

const tiers = [
  { min: 0, max: 5000, rate: 0.0008, label: "0~5,000", display: "1000币=¥0.8", pct: 30 },
  { min: 5000, max: 20000, rate: 0.001, label: "5千~2万", display: "1000币=¥1.0", pct: 55 },
  { min: 20000, max: 50000, rate: 0.0012, label: "2万~5万", display: "1000币=¥1.2", pct: 78 },
  { min: 50000, max: Infinity, rate: 0.0015, label: "5万+", display: "1000币=¥1.5", pct: 100 },
];

const txIcon: Record<string, React.ElementType> = {
  earn: ArrowDownLeft,
  withdraw: ArrowUpRight,
  commission: Users,
};

function cashEquivalent(b: number) {
  return tiers.reduce((a, t) => {
    const u = Math.min(t.max, b);
    if (u > t.min) a += (u - t.min) * t.rate;
    return a;
  }, 0);
}

function activeTier(b: number) {
  return tiers.find((t) => b >= t.min && b < t.max) ?? tiers[tiers.length - 1];
}

export default function Wallet() {
  const { user, withdraw } = useAppStore();
  const [amt, setAmt] = useState(0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const tier = activeTier(user.coinBalance);
  const cash = cashEquivalent(user.coinBalance);

  const handleWithdraw = useCallback(() => {
    if (amt <= 0) return;
    const coins = Math.round(amt / tier.rate);
    const ok = withdraw(coins);
    setToast({ msg: ok ? "提现成功" : "余额不足", ok });
    if (ok) setAmt(0);
    setTimeout(() => setToast(null), 2000);
  }, [amt, tier.rate, withdraw]);

  return (
    <div className="min-h-screen pb-6">
      <div className="relative overflow-hidden rounded-b-3xl bg-night-800 px-5 pt-12 pb-8">
        <div className="absolute inset-0 bg-gold-gradient-radial animate-glow opacity-50" />
        <div className="relative flex flex-col items-center">
          <Coins className="h-10 w-10 text-gold-400 mb-2" />
          <span className="gold-text font-display text-4xl font-bold">
            {user.coinBalance.toLocaleString()}
          </span>
          <p className="mt-1 text-sm text-white/40">≈ ¥{cash.toFixed(2)}</p>
        </div>
      </div>

      <div className="px-5 mt-5">
        <p className="text-sm font-semibold text-white/70 mb-3">阶梯汇率</p>
        <div className="space-y-2">
          {tiers.map((t) => {
            const on = tier.rate === t.rate;
            return (
              <div key={t.label} className="flex items-center gap-3">
                <span className={`text-xs w-20 shrink-0 ${on ? "text-gold-300" : "text-white/40"}`}>
                  {t.label}
                </span>
                <div className="flex-1 h-6 rounded-full bg-night-700 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${on ? "bg-gold-gradient shadow-gold" : "bg-gold-400/20"}`}
                  />
                  <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${on ? "text-night-900" : "text-white/50"}`}>
                    {t.display}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6">
        <p className="text-sm font-semibold text-white/70 mb-3">提现</p>
        <div className="card p-4">
          <div className="flex gap-2 mb-3">
            {[5, 10, 20, 50].map((v) => (
              <button
                key={v}
                onClick={() => setAmt(v)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${amt === v ? "bg-gold-gradient text-night-900" : "bg-night-600 text-white/60"}`}
              >
                ¥{v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-night-700 rounded-xl px-4 py-3 mb-3">
            <span className="text-white/40 text-sm">¥</span>
            <input
              type="number"
              value={amt || ""}
              onChange={(e) => setAmt(Number(e.target.value))}
              placeholder="输入金额"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleWithdraw}
            className="gold-btn w-full flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zM14.87 13.13c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.82 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
            </svg>
            提现至微信
          </motion.button>
        </div>
      </div>

      <div className="px-5 mt-6">
        <p className="text-sm font-semibold text-white/70 mb-3">交易记录</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.map((tx) => {
            const Icon = txIcon[tx.type];
            const isEarn = tx.type === "earn" || tx.type === "commission";
            return (
              <div key={tx.id} className="card flex items-center gap-3 p-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isEarn ? "bg-emerald/15 text-emerald" : "bg-coral/15 text-coral"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm text-white/80">{tx.description}</p>
                    {tx.status === "intercepted" && (
                      <span className="chip shrink-0 bg-coral/20 text-coral">已拦截</span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 mt-0.5">
                    {new Date(tx.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${isEarn ? "text-emerald" : "text-coral"}`}>
                  {isEarn ? "+" : "-"}{tx.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "累计收入", value: user.totalEarned.toLocaleString(), suffix: "币" },
          { label: "已提现", value: `¥${user.totalWithdrawn.toFixed(1)}`, suffix: "" },
          { label: "待提现", value: `¥${cash.toFixed(1)}`, suffix: "" },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <p className="text-xs text-white/40">{s.label}</p>
            <p className="gold-text text-lg font-bold font-display mt-1">{s.value}</p>
            {s.suffix && <p className="text-xs text-white/30">{s.suffix}</p>}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-medium shadow-lg ${toast.ok ? "bg-emerald text-night-900" : "bg-coral text-white"}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
