import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Footprints,
  PlayCircle,
  CalendarCheck,
  UserPlus,
  Clock,
  PartyPopper,
} from "lucide-react";
import { useAppStore } from "@/store";
import { banners } from "@/mock";
import type { TaskType } from "@/types";

const iconMap: Record<TaskType, React.ElementType> = {
  steps: Footprints,
  video: PlayCircle,
  checkin: CalendarCheck,
  invite: UserPlus,
  limited: Clock,
  holiday: PartyPopper,
};

const tabs = [
  { key: "all", label: "全部" },
  { key: "steps", label: "步数" },
  { key: "video", label: "视频" },
  { key: "checkin", label: "签到" },
  { key: "invite", label: "邀请" },
];

export default function Home() {
  const { user, tasks, todayEarned, activeTab, setActiveTab, checkin, completeTask } = useAppStore();
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedin = user.lastCheckin?.slice(0, 10) === new Date().toISOString().slice(0, 10);

  const filtered = activeTab === "all" ? tasks : tasks.filter((t) => t.type === activeTab);

  return (
    <div className="min-h-screen pb-6">
      <div className="relative overflow-hidden rounded-b-3xl bg-night-800 px-5 pt-12 pb-6">
        <div className="absolute inset-0 bg-gold-gradient-radial animate-glow opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">金币余额</p>
            <div className="mt-1 flex items-center gap-2">
              <Coins className="h-6 w-6 text-gold-400" />
              <span className="gold-text font-display text-3xl font-bold">
                {user.coinBalance.toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/40">
              今日 +<span className="text-gold-300">{todayEarned.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={checkin}
              disabled={isCheckedin}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                isCheckedin
                  ? "border-white/10 bg-night-700 text-white/30"
                  : "border-gold-400 bg-gold-gradient text-night-900 shadow-gold animate-glow"
              }`}
            >
              <CalendarCheck className="h-6 w-6" />
            </motion.button>
            <span className="text-xs text-white/50">
              {isCheckedin ? "已签到" : `${user.checkinDays}天`}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="relative h-28 overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={banners[bannerIdx].id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 bg-gradient-to-r ${banners[bannerIdx].gradient} flex items-center justify-between rounded-2xl px-5`}
            >
              <div>
                <p className="text-lg font-bold text-white">{banners[bannerIdx].title}</p>
                <p className="mt-1 text-xs text-white/70">{banners[bannerIdx].subtitle}</p>
              </div>
              <span className="chip bg-white/20 text-white">{banners[bannerIdx].tag}</span>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <span
                key={b.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === bannerIdx ? "w-5 bg-gold-400" : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-1 px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`relative flex-1 pb-2 text-sm font-medium transition-colors ${
              activeTab === t.key ? "text-gold-400" : "text-white/40"
            }`}
          >
            {t.label}
            {activeTab === t.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-gold-400"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3 px-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((task, idx) => {
            const Icon = iconMap[task.type];
            const pct = Math.min((task.progress / task.target) * 100, 100);
            const done = task.status === "completed";
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-600">
                    <Icon className="h-5 w-5 text-gold-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white/90">{task.title}</p>
                      {task.tag && (
                        <span className="chip shrink-0 bg-gold-400/15 text-gold-300">
                          {task.tag}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/40">{task.description}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-night-600">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className={`h-full rounded-full ${done ? "bg-emerald" : "bg-gold-gradient"}`}
                        />
                      </div>
                      <span className="text-xs text-white/30">
                        {task.progress}/{task.target}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="gold-text text-sm font-bold">+{task.coinReward}</span>
                    {done ? (
                      <button
                        onClick={() => completeTask(task.id)}
                        className="gold-btn !px-4 !py-1.5 !text-xs"
                      >
                        领取
                      </button>
                    ) : (
                      <span className="ghost-btn !px-3 !py-1.5 !text-xs">
                        {task.status === "in_progress" ? "进行中" : "去完成"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
