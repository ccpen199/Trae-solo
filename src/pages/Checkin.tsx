import { motion } from "framer-motion";
import { CalendarDays, Coins } from "lucide-react";
import { useAppStore } from "@/store";
import { checkinRewards } from "@/mock";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const TODAY = 10;
const CHECKED_DAYS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

export default function Checkin() {
  const { user } = useAppStore();
  const weekPos = user.checkinDays % 7;

  const juneDays: (number | null)[] = [];
  for (let d = 1; d <= 30; d++) juneDays.push(d);

  return (
    <div className="min-h-screen px-5 pb-8 pt-12">
      <div className="flex items-center gap-2 mb-6">
        <CalendarDays className="h-6 w-6 text-gold-400" />
        <h1 className="text-xl font-bold text-white/90">2026年6月</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {checkinRewards.map((r) => {
          const done = weekPos === 0 || r.day <= weekPos;
          const current = weekPos > 0 && r.day === weekPos + 1;
          return (
            <motion.div
              key={r.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: r.day * 0.06 }}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5 min-w-[52px] border ${
                done
                  ? "border-gold-400/30 bg-gold-400/15"
                  : current
                    ? "border-gold-400/50 bg-gold-400/10 animate-pulse"
                    : "border-white/5 bg-night-700/50"
              }`}
            >
              <span
                className={`text-xs ${done ? "text-gold-300" : current ? "text-gold-400" : "text-white/30"}`}
              >
                Day{r.day}
              </span>
              <div className="flex items-center gap-0.5">
                <Coins className={`h-3 w-3 ${done ? "text-gold-400" : "text-white/20"}`} />
                <span className={`text-xs font-bold ${done ? "gold-text" : "text-white/20"}`}>
                  {r.coins}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs text-white/30 py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {juneDays.map((day, i) => {
            const checked = CHECKED_DAYS.has(day!);
            const isToday = day === TODAY;
            return (
              <motion.div
                key={day}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 300 }}
                className="flex items-center justify-center py-2"
              >
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
                    checked
                      ? "bg-gold-gradient text-night-900 font-bold"
                      : isToday
                        ? "border-2 border-gold-400 text-gold-400"
                        : "border border-white/15 text-white/40"
                  }`}
                >
                  <span className="text-xs">{day}</span>
                  {isToday && (
                    <span className="absolute inset-0 rounded-full border-2 border-gold-400/50 animate-ping" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => window.alert("补签需消耗 200 金币")}
        className="ghost-btn w-full gap-2"
      >
        <Coins className="h-4 w-4" />
        补签 · 200金币
      </motion.button>
    </div>
  );
}
