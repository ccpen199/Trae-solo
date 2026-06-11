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
  const { sleepRecords, setSleepRecords, setLoading } = useHealthStore();

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
    ];
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
      const maxNoiseIdx = r.noiseLevel.indexOf(Math.max(...r.noiseLevel));
      return {
        date: r.date.slice(5),
        quality: r.qualityScore,
        noise: r.noiseLevelAvg,
        hasAnomaly: r.noiseLevelAvg > 50,
        anomalyHour: maxNoiseIdx < 0 ? "" : `${23 - r.noiseLevel.length + maxNoiseIdx + 1}:00`,
      };
    }).reverse(),
  [sleepRecords]);

  const suggestions = useMemo(() => {
    if (!lastNight) return [];
    const items = [];
    const deepPct = lastNight.deepSleep / (lastNight.totalTime || 1);
    const remPct = lastNight.remSleep / (lastNight.totalTime || 1);
    if (deepPct < 0.2) items.push({ icon: <Brain className="w-5 h-5 text-sleep-deep" />, title: "深睡比例偏低", desc: "建议睡前1小时避免蓝光，保持卧室温度18-22°C" });
    if (lastNight.awakeTime > 30) items.push({ icon: <AlertTriangle className="w-5 h-5 text-sleep-awake" />, title: "夜间清醒时间过长", desc: "避免睡前摄入咖啡因，尝试冥想放松助眠" });
    if (lastNight.noiseLevelAvg > 50) items.push({ icon: <Volume2 className="w-5 h-5 text-warning-amber-500" />, title: "噪音水平较高", desc: "噪音较高时段对应浅睡增加，建议使用白噪音或耳塞" });
    if (remPct < 0.15) items.push({ icon: <TrendingDown className="w-5 h-5 text-sleep-rem" />, title: "REM睡眠不足", desc: "REM有助于记忆巩固，建议保持规律作息时间" });
    if (items.length === 0) items.push({ icon: <Star className="w-5 h-5 text-vital-green-400" />, title: "睡眠质量良好", desc: "继续保持当前的睡眠习惯" });
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
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">睡眠质量趋势</h3>
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
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">环境噪音关联</h3>
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
        {noiseData.some((d) => d.hasAnomaly) && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-amber-500/10 border border-warning-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-warning-amber-500 shrink-0" />
            <span className="text-xs text-warning-amber-500">检测到噪音异常时段（&gt;50dB），可能影响深睡质量</span>
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
