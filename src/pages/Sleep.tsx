import { useEffect, useState, useMemo } from "react";
import { Moon, Clock, Brain, Star, Volume2, Lightbulb, AlertTriangle, TrendingDown } from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import ProgressRing from "../components/ui/ProgressRing";
import { useHealthStore } from "../store/useHealthStore";
import { api } from "../utils/api";
import type { SleepRecord } from "../../shared/types";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart, Bar,
} from "recharts";

type Range = "7d" | "30d";

const STAGE_COLORS = { deep: "#1E3A8A", light: "#60A5FA", rem: "#7C3AED", awake: "#6B7280" };
const STAGE_LABELS = { deep: "深睡", light: "浅睡", rem: "REM", awake: "清醒" };

export function Sleep() {
  const [range, setRange] = useState<Range>("7d");
  const { sleepRecords, setSleepRecords, setLoading, loading } = useHealthStore();

  useEffect(() => {
    setLoading("sleep", true);
    api.health.sleep(range)
      .then((data) => setSleepRecords(data as SleepRecord[]))
      .catch(console.error)
      .finally(() => setLoading("sleep", false));
  }, [range, setSleepRecords, setLoading]);

  const lastNight = sleepRecords[0];

  const stages = useMemo(() => {
    if (!lastNight) return [];
    const total = lastNight.totalTime || 1;
    return [
      { key: "deep" as const, value: lastNight.deepSleep, pct: Math.round((lastNight.deepSleep / total) * 100) },
      { key: "light" as const, value: lastNight.lightSleep, pct: Math.round((lastNight.lightSleep / total) * 100) },
      { key: "rem" as const, value: lastNight.remSleep, pct: Math.round((lastNight.remSleep / total) * 100) },
      { key: "awake" as const, value: lastNight.awakeTime, pct: Math.round((lastNight.awakeTime / total) * 100) },
    ].filter((s) => s.pct > 0);
  }, [lastNight]);

  const trendData = useMemo(() =>
    sleepRecords.map((r) => ({
      date: r.date.slice(5),
      quality: r.qualityScore,
    })).reverse(),
  [sleepRecords]);

  const avgQuality = useMemo(() => {
    if (!trendData.length) return 0;
    return Math.round(trendData.reduce((s, d) => s + d.quality, 0) / trendData.length);
  }, [trendData]);

  const noiseData = useMemo(() =>
    sleepRecords.map((r) => {
      const noises = r.noiseLevel && r.noiseLevel.length > 0 ? r.noiseLevel : [30, 35, 32];
      const maxNoiseIdx = noises.indexOf(Math.max(...noises));
      return {
        date: r.date.slice(5),
        quality: r.qualityScore,
        noise: Math.round(r.noiseLevelAvg || 35),
        hasAnomaly: (r.noiseLevelAvg || 35) > 50,
        anomalyHour: maxNoiseIdx < 0 ? "" : `${String(23 - noises.length + maxNoiseIdx + 1).padStart(2, "0")}:00`,
      };
    }).reverse(),
  [sleepRecords]);

  const maxNoiseDay = useMemo(() => {
    if (!noiseData.some((d) => d.hasAnomaly)) return null;
    return noiseData.find((d) => d.hasAnomaly) || null;
  }, [noiseData]);

  const suggestions = useMemo(() => {
    if (!lastNight) {
      return [{ icon: <Moon className="w-5 h-5 text-deep-sea-200/50" />, title: "暂无睡眠数据", desc: "连接设备并等待首次睡眠同步后，即可获得个性化睡眠改善建议。" }];
    }
    const items = [];
    const total = lastNight.totalTime || 1;
    const deepPct = lastNight.deepSleep / total;
    const remPct = lastNight.remSleep / total;

    if (lastNight.totalTime < 360) {
      items.push({ icon: <Clock className="w-5 h-5 text-alert-red-400" />, title: "睡眠时长不足", desc: `昨晚仅睡眠 ${Math.floor(lastNight.totalTime / 60)} 小时 ${lastNight.totalTime % 60} 分钟，建议保证 7-9 小时睡眠。` });
    }
    if (deepPct < 0.15) {
      items.push({ icon: <Brain className="w-5 h-5 text-sleep-deep" />, title: "深睡比例偏低", desc: "深睡仅占总睡眠 " + Math.round(deepPct * 100) + "%，建议睡前1小时避免蓝光，保持卧室温度18-22°C。" });
    }
    if (lastNight.awakeTime > 40) {
      items.push({ icon: <AlertTriangle className="w-5 h-5 text-sleep-awake" />, title: "夜间清醒次数偏多", desc: "清醒时长 " + lastNight.awakeTime + " 分钟，避免睡前摄入咖啡因，尝试冥想放松助眠。" });
    }
    if (lastNight.noiseLevelAvg > 50) {
      items.push({ icon: <Volume2 className="w-5 h-5 text-warning-amber-500" />, title: "环境噪音偏高", desc: "平均噪音 " + Math.round(lastNight.noiseLevelAvg) + " dB，超过 50 dB 可能干扰深睡，建议使用白噪音或耳塞。" });
    }
    if (remPct < 0.15) {
      items.push({ icon: <TrendingDown className="w-5 h-5 text-sleep-rem" />, title: "REM 睡眠不足", desc: "REM 有助于记忆巩固，建议保持规律作息，避免熬夜打断 REM 周期。" });
    }
    if (lastNight.qualityScore < 60) {
      items.push({ icon: <Star className="w-5 h-5 text-warning-amber-400" />, title: "整体质量偏低", desc: "质量评分 " + lastNight.qualityScore + " 分，建议提前 30 分钟上床，减少睡前屏幕暴露。" });
    }
    if (items.length === 0) {
      items.push({ icon: <Star className="w-5 h-5 text-vital-green-400" />, title: "睡眠质量良好", desc: "昨晚质量评分 " + lastNight.qualityScore + " 分，各阶段比例合理，继续保持规律作息。" });
    }
    return items;
  }, [lastNight]);

  const fmt = (m: number) => `${Math.floor(m / 60)}h${m % 60}m`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="w-7 h-7 text-vital-green-400" />
          <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">睡眠分析</h1>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-deep-sea-600/50 border border-vital-green-500/20">
          {(["7d", "30d"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r ? "bg-vital-green-500/20 text-vital-green-400" : "text-deep-sea-200/60 hover:text-deep-sea-200"}`}>
              {r === "7d" ? "7天" : "30天"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="总时长" value={lastNight ? fmt(lastNight.totalTime) : "--"} icon={<Clock className="w-5 h-5" />} />
        <StatCard title="深睡时长" value={lastNight ? fmt(lastNight.deepSleep) : "--"} icon={<Moon className="w-5 h-5" />} status={lastNight && lastNight.deepSleep < 60 ? "warning" : "normal"} />
        <StatCard title="REM时长" value={lastNight ? fmt(lastNight.remSleep) : "--"} icon={<Brain className="w-5 h-5" />} />
        <StatCard title="质量评分" value={lastNight?.qualityScore ?? "--"} unit="分" icon={<Star className="w-5 h-5" />} status={lastNight && lastNight.qualityScore < 60 ? "warning" : "normal"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-deep-sea-100">睡眠分期</h3>
            <ProgressRing value={lastNight?.qualityScore ?? 0} size={48} thickness={4} />
          </div>
          {!lastNight ? (
            <div className="h-48 flex flex-col items-center justify-center text-deep-sea-200/40">
              <Moon className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">暂无睡眠数据</p>
            </div>
          ) : (
            <>
              <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                {stages.map((s) => s.pct > 0 && (
                  <div key={s.key} style={{ width: `${s.pct}%`, backgroundColor: STAGE_COLORS[s.key] }} className="transition-all duration-500" />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {stages.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: STAGE_COLORS[s.key] }} />
                    <div>
                      <p className="text-xs text-deep-sea-200/60">{STAGE_LABELS[s.key]}</p>
                      <p className="text-sm font-din text-deep-sea-100">{s.pct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">睡眠质量趋势</h3>
          {trendData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-deep-sea-200/40">
              <Moon className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">暂无趋势数据</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#81B4FE", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#81B4FE", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 12, color: "#E8F0FE" }} />
                  <ReferenceLine y={avgQuality} stroke="#00E5A0" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: `均值 ${avgQuality}`, fill: "#00E5A0", fontSize: 11, position: "right" }} />
                  <Area type="monotone" dataKey="quality" stroke="#00E5A0" fill="url(#qGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">环境噪音关联</h3>
        {noiseData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-deep-sea-200/40">
            <Volume2 className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">暂无噪音关联数据</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={noiseData}>
                <defs>
                  <linearGradient id="nGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#81B4FE", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="q" domain={[0, 100]} tick={{ fill: "#81B4FE", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <YAxis yAxisId="n" orientation="right" tick={{ fill: "#FFBE0B", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 12, color: "#E8F0FE" }} />
                <ReferenceLine yAxisId="n" y={50} stroke="#FFBE0B" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Area yAxisId="q" type="monotone" dataKey="quality" stroke="#00E5A0" fill="url(#nGrad)" strokeWidth={2} />
                <Bar yAxisId="n" dataKey="noise" fill="#FFBE0B" fillOpacity={0.5} radius={[4, 4, 0, 0]} barSize={16} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {maxNoiseDay && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-warning-amber-500/10 border border-warning-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-warning-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-warning-amber-500">
                {maxNoiseDay.date} 检测到噪音异常，平均 {maxNoiseDay.noise} dB，
                {maxNoiseDay.anomalyHour && <span>最高时段约 {maxNoiseDay.anomalyHour}，</span>}
                该时段可能出现浅睡比例上升，建议使用白噪音设备或耳塞改善。
              </span>
            </div>
          </div>
        )}
        {!maxNoiseDay && noiseData.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-vital-green-500/10 border border-vital-green-500/20">
            <Star className="w-4 h-4 text-vital-green-400 shrink-0" />
            <span className="text-xs text-vital-green-400">近 {range === "7d" ? "7" : "30"} 天环境噪音整体在正常范围，睡眠环境良好。</span>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-vital-green-400" />
          <h3 className="text-lg font-semibold text-deep-sea-100">睡眠改善建议</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-deep-sea-600/40 border border-vital-green-500/10 hover:border-vital-green-500/30 transition-colors">
              <div className="mt-0.5 shrink-0">{s.icon}</div>
              <div>
                <p className="text-sm font-medium text-deep-sea-100">{s.title}</p>
                <p className="text-xs text-deep-sea-200/70 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
