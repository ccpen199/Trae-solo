import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Footprints, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store";

const TARGET = 6000;
const WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const WEEK_DATA = [3200, 5800, 4100, 7200, 5600, 6300, 4280];
const CONVERSION = [
  { steps: 1000, coins: 50 },
  { steps: 3000, coins: 150 },
  { steps: 6000, coins: 300 },
  { steps: 10000, coins: 800 },
];

export default function Steps() {
  const { addCoins } = useAppStore();
  const [steps, setSteps] = useState(4280);
  const [syncing, setSyncing] = useState(false);

  const pct = Math.min(steps / TARGET, 1);
  const R = 90;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct);

  useEffect(() => {
    const task = useAppStore.getState().tasks.find((t) => t.id === "t-step");
    if (task) setSteps(task.progress);
  }, []);

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    const added = Math.floor(Math.random() * 1000) + 500;
    const newSteps = steps + added;
    setSteps(newSteps);

    const matched = [...CONVERSION].reverse().find((c) => newSteps >= c.steps);
    if (matched && newSteps >= matched.steps) {
      addCoins(matched.coins, `步数兑换 · ${matched.steps}步`);
    }

    setTimeout(() => setSyncing(false), 800);
  };

  const maxWeek = Math.max(...WEEK_DATA);

  return (
    <div className="min-h-screen px-5 pt-10 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center">
          <svg width="220" height="220" className="-rotate-90">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            <motion.circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <Footprints className="h-5 w-5 text-gold-400 mb-1" />
            <span className="font-display text-4xl font-bold text-white">{steps.toLocaleString()}</span>
            <span className="mt-1 text-xs text-white/40">目标 {TARGET.toLocaleString()} 步</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex justify-center"
      >
        <button
          onClick={handleSync}
          disabled={syncing}
          className="gold-btn flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          同步步数
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mt-6 p-5"
      >
        <p className="mb-4 text-sm font-semibold text-white/80">本周步数</p>
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {WEEK_DATA.map((v, i) => {
            const h = Math.max((v / maxWeek) * 100, 8);
            const isToday = i === WEEK_DATA.length - 1;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.06 }}
                  className={`w-full rounded-t-md ${isToday ? "bg-gold-gradient" : "bg-night-500"}`}
                  style={{ minHeight: 4 }}
                />
                <span className={`text-xs ${isToday ? "text-gold-400 font-semibold" : "text-white/30"}`}>
                  {WEEK_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card mt-4 p-5"
      >
        <p className="mb-3 text-sm font-semibold text-white/80">步数兑换规则</p>
        <div className="space-y-0">
          <div className="flex items-center justify-between border-b border-white/8 py-3">
            <span className="text-xs text-white/40">步数</span>
            <span className="text-xs text-white/40">金币</span>
          </div>
          {CONVERSION.map((row) => (
            <div key={row.steps} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/70">{row.steps.toLocaleString()} 步</span>
              <span className="gold-text text-sm font-bold">+{row.coins} 币</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
