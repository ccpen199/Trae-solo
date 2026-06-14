import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, Coins, X } from "lucide-react";
import { useAppStore } from "@/store";
import { videos } from "@/mock";
import type { VideoItem } from "@/types";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Video() {
  const { addCoins } = useAppStore();
  const [videoList, setVideoList] = useState<VideoItem[]>(videos);
  const [watching, setWatching] = useState<VideoItem | null>(null);
  const [progress, setProgress] = useState(0);

  const totalAvailable = videoList.filter((v) => !v.watched).reduce((s, v) => s + v.coinReward, 0);

  const finishWatch = useCallback(() => {
    if (!watching) return;
    setVideoList((prev) =>
      prev.map((v) => (v.id === watching.id ? { ...v, watched: true } : v))
    );
    addCoins(watching.coinReward, `观看视频 · ${watching.title.slice(0, 10)}`);
    setWatching(null);
    setProgress(0);
  }, [watching, addCoins]);

  useEffect(() => {
    if (!watching) return;
    if (progress >= 100) {
      const t = setTimeout(finishWatch, 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProgress((p) => Math.min(p + 100 / 30, 100)), 100);
    return () => clearTimeout(t);
  }, [watching, progress, finishWatch]);

  const handlePlay = (video: VideoItem) => {
    if (video.watched) return;
    setWatching(video);
    setProgress(0);
  };

  return (
    <div className="min-h-screen px-5 pt-10 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-xl font-bold text-white/90">视频任务</h1>
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-gold-400" />
          <span className="gold-text text-sm font-bold">可赚 {totalAvailable} 币</span>
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {videoList.map((video, idx) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.35 }}
            className="card overflow-hidden"
          >
            <div
              className="relative aspect-video cursor-pointer overflow-hidden bg-night-700"
              onClick={() => handlePlay(video)}
            >
              <img
                src={video.cover}
                alt={video.title}
                className="h-full w-full object-cover"
              />
              {!video.watched && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-8 w-8 text-white/90 fill-white/90" />
                </div>
              )}
              {video.watched && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Check className="h-7 w-7 text-emerald" />
                  <span className="ml-1.5 text-sm font-medium text-emerald">已观看</span>
                </div>
              )}
              <span className="chip absolute bottom-1.5 left-1.5 bg-black/60 text-white/80 text-[10px]">
                {formatDuration(video.duration)}
              </span>
              <span className="chip absolute top-1.5 right-1.5 bg-gold-gradient text-night-900 text-[10px] font-bold">
                +{video.coinReward}
              </span>
            </div>
            <p className="line-clamp-2 px-3 py-2.5 text-xs text-white/70 leading-relaxed">
              {video.title}
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {watching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8"
            onClick={() => { setWatching(null); setProgress(0); }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              className="card w-full max-w-sm p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-3 top-3 text-white/40 hover:text-white/70"
                onClick={() => { setWatching(null); setProgress(0); }}
              >
                <X className="h-5 w-5" />
              </button>
              <Play className="mx-auto mb-4 h-10 w-10 text-gold-400" />
              <p className="mb-1 text-sm font-semibold text-white/90">正在观看</p>
              <p className="mb-5 text-xs text-white/50 line-clamp-1">{watching.title}</p>
              <div className="h-2 overflow-hidden rounded-full bg-night-600">
                <motion.div
                  className="h-full rounded-full bg-gold-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="mt-3 text-xs text-white/40">{Math.round(progress)}%</p>
              <p className="mt-4 text-xs text-gold-300">
                完成后获得 <span className="font-bold">{watching.coinReward}</span> 金币
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
