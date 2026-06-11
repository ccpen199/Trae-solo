import { useState, useEffect } from "react";
import {
  Dumbbell, MapPin, Flame, Gauge, Check, Circle,
  Bike, Waves, Mountain, Footprints, Timer, Calendar, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import HeatmapCalendar from "../components/ui/HeatmapCalendar";
import ProgressRing from "../components/ui/ProgressRing";
import { useHealthStore } from "../store/useHealthStore";
import { api } from "../utils/api";
import type { ExerciseRecord, DailyPlan } from "../../shared/types";

const typeIcons: Record<string, React.ReactNode> = {
  running: <Footprints className="w-5 h-5" />,
  cycling: <Bike className="w-5 h-5" />,
  swimming: <Waves className="w-5 h-5" />,
  hiking: <Mountain className="w-5 h-5" />,
};

const intensityColor = { low: "bg-vital-green-500", medium: "bg-warning-amber-500", high: "bg-alert-red-500" };
const intensityLabel = { low: "低", medium: "中", high: "高" };
const heartZoneColor = ["text-vital-green-400", "text-warning-amber-400", "text-alert-red-400", "text-purple-400", "text-pink-400"];

export function Fitness() {
  const { exerciseRecords, exercisePlan, setExerciseRecords, setExercisePlan, loading, hrvTrend } = useHealthStore();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [detailExpanded, setDetailExpanded] = useState(false);

  useEffect(() => {
    api.health.exercise(range).then(setExerciseRecords).catch(console.error);
    api.health.currentPlan().then(setExercisePlan).catch(console.error);
  }, [range, setExerciseRecords, setExercisePlan]);

  const stats = exerciseRecords.reduce(
    (acc, r) => ({
      count: acc.count + 1,
      distance: acc.distance + r.distance,
      calories: acc.calories + r.calories,
      totalDuration: acc.totalDuration + r.duration,
    }),
    { count: 0, distance: 0, calories: 0, totalDuration: 0 }
  );

  const avgPace = stats.count > 0 && stats.distance > 0
    ? (stats.totalDuration / stats.distance).toFixed(2)
    : "--";

  const heatmapData = exerciseRecords.map((r) => ({
    date: new Date(r.startTime),
    value: Math.min(100, (r.duration / 45) * 100),
  }));

  const planCompletionRate = exercisePlan?.completionRate ?? 0;
  const recentHrvAvg = hrvTrend.length > 0
    ? Math.round(hrvTrend.slice(-7).reduce((s, d) => s + d.hrv, 0) / Math.min(hrvTrend.length, 7))
    : 55;
  const recommendation = stats.count === 0
    ? `暂无运动数据。基于当前身体恢复状态（HRV约 ${recentHrvAvg} ms），建议从低强度有氧开始，逐步建立运动习惯。`
    : planCompletionRate >= 70
    ? `基于近${range === "7d" ? "7" : "30"}天 ${stats.count} 次运动记录和 ${Math.round(planCompletionRate)}% 的计划完成率，配合 HRV 恢复指数良好（${recentHrvAvg} ms），本周可适当增加有氧训练强度。`
    : planCompletionRate >= 40
    ? `近${range === "7d" ? "7" : "30"}天完成率 ${Math.round(planCompletionRate)}%，HRV ${recentHrvAvg} ms，建议保持当前训练节奏，优先保证动作质量和恢复时间。`
    : `近${range === "7d" ? "7" : "30"}天完成率仅 ${Math.round(planCompletionRate)}%，建议简化本周计划，优先建立每日 30 分钟低强度运动习惯。`;

  const adaptiveReasoning = stats.count === 0
    ? "当前缺乏历史运动数据，推荐采用循序渐进策略，避免过度训练。"
    : recentHrvAvg >= 50
    ? `近 ${range === "7d" ? "7" : "30"} 天 HRV 指数均值 ${recentHrvAvg} ms（来源：${Math.min(hrvTrend.length, 7)} 条记录），自主神经恢复良好。`
    : `HRV 偏低（均值 ${recentHrvAvg} ms，来源：${Math.min(hrvTrend.length, 7)} 条记录），提示身体可能处于疲劳状态。`;

  const completedExercises = exercisePlan?.dailyPlans.reduce(
    (sum, d) => sum + d.exercises.filter((e) => e.completed).length, 0
  ) ?? 0;
  const totalExercises = exercisePlan?.dailyPlans.reduce(
    (sum, d) => sum + d.exercises.length, 0
  ) ?? 0;

  const handleComplete = async (planId: string, dayIdx: number, exerciseId: string) => {
    setCompletingId(exerciseId);
    try {
      const updated = await api.health.completeExercise(planId, dayIdx, exerciseId) as any;
      if (updated) setExercisePlan(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingId(null);
    }
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">运动健康</h1>
        <div className="flex gap-1 p-1 rounded-xl bg-deep-sea-600/50 border border-vital-green-500/10">
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                range === r
                  ? "bg-vital-green-500/20 text-vital-green-400 shadow-md shadow-vital-green-500/10"
                  : "text-deep-sea-200/60 hover:text-deep-sea-100"
              }`}
            >
              {r === "7d" ? "7天" : "30天"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本周运动次数" value={stats.count} unit="次"
          icon={<Dumbbell className="w-5 h-5" />}
          trend={stats.count >= 3 ? { value: 12, isUp: true } : undefined}
        />
        <StatCard
          title="总距离" value={stats.distance.toFixed(1)} unit="km"
          icon={<MapPin className="w-5 h-5" />}
        />
        <StatCard
          title="总卡路里" value={stats.calories} unit="kcal"
          icon={<Flame className="w-5 h-5" />}
          status={stats.calories > 2000 ? "warning" : "normal"}
        />
        <StatCard
          title="平均配速" value={avgPace} unit="min/km"
          icon={<Gauge className="w-5 h-5" />}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-deep-sea-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-vital-green-400" /> 运动计划推荐
          </h3>
          <ProgressRing value={exercisePlan?.completionRate ?? 0} size={48} thickness={4} label="完成率" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {exercisePlan?.dailyPlans.map((day: DailyPlan, dayIdx: number) => (
            <div
              key={day.day}
              className={`rounded-xl p-3 border transition-all ${
                day.completed
                  ? "bg-vital-green-500/10 border-vital-green-500/30"
                  : "bg-deep-sea-600/40 border-vital-green-500/10 hover:border-vital-green-500/30"
              }`}
            >
              <p className="text-deep-sea-200/70 text-xs mb-2">{day.dayName}</p>
              {day.exercises.map((ex) => (
                <div key={ex.id} className="space-y-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${intensityColor[ex.intensity]}`} />
                    <span className={`text-sm ${day.completed ? "line-through text-deep-sea-200/40" : "text-deep-sea-100"}`}>
                      {ex.name}
                    </span>
                    {ex.completed && <Check className="w-3.5 h-3.5 text-vital-green-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-deep-sea-200/50">
                    <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" />{ex.duration}分</span>
                    <span>{intensityLabel[ex.intensity]}</span>
                  </div>
                  {!ex.completed && (
                    <button
                      onClick={() => handleComplete(exercisePlan.id, dayIdx, ex.id)}
                      disabled={completingId === ex.id}
                      className="w-full py-1 text-xs rounded-lg bg-vital-green-500/15 text-vital-green-400 hover:bg-vital-green-500/25 transition-colors disabled:opacity-40"
                    >
                      {completingId === ex.id ? "完成中..." : "完成"}
                    </button>
                  )}
                </div>
              ))}
              {!day.exercises.length && (
                <div className="flex items-center justify-center py-4 text-deep-sea-200/30">
                  <Circle className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
        {exercisePlan?.dailyPlans.length === 0 && (
          <div className="mb-4 p-3 rounded-lg bg-warning-amber-500/10 border border-warning-amber-500/20">
            <p className="text-xs text-warning-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              尚未生成本周计划，正在初始化运动方案...
            </p>
          </div>
        )}
        {recommendation && (
          <p className="mt-4 text-sm text-deep-sea-200/60 bg-deep-sea-600/30 rounded-lg p-3 border border-vital-green-500/5">
            💡 {recommendation}
          </p>
        )}
        {adaptiveReasoning && (
          <p className="mt-2 text-xs text-deep-sea-200/40 px-1">
            📊 {adaptiveReasoning}
          </p>
        )}
        <button
          onClick={() => setDetailExpanded(!detailExpanded)}
          className="mt-3 text-xs text-vital-green-400/60 hover:text-vital-green-400 flex items-center gap-1 transition-colors"
        >
          {detailExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {detailExpanded ? "收起依据明细" : "展开依据明细"}
        </button>
        {detailExpanded && (
          <div className="mt-3 p-3 rounded-lg bg-deep-sea-700/40 border border-vital-green-500/10 space-y-2">
            <h4 className="text-xs font-semibold text-deep-sea-100 mb-2">推荐依据数据来源</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2 rounded bg-deep-sea-600/30">
                <p className="text-deep-sea-200/50 mb-1">运动完成率</p>
                <p className="text-vital-green-400 font-din text-lg">{Math.round(planCompletionRate)}%</p>
                <p className="text-deep-sea-200/40 mt-1">已完成 {completedExercises}/{totalExercises} 项</p>
              </div>
              <div className="p-2 rounded bg-deep-sea-600/30">
                <p className="text-deep-sea-200/50 mb-1">HRV 恢复指数</p>
                <p className="text-vital-green-400 font-din text-lg">{recentHrvAvg} ms</p>
                <p className="text-deep-sea-200/40 mt-1">来源：{Math.min(hrvTrend.length, 7)} 条近 7 天记录</p>
              </div>
              <div className="p-2 rounded bg-deep-sea-600/30">
                <p className="text-deep-sea-200/50 mb-1">运动次数</p>
                <p className="text-vital-green-400 font-din text-lg">{stats.count} 次</p>
                <p className="text-deep-sea-200/40 mt-1">范围：近 {range === "7d" ? "7" : "30"} 天</p>
              </div>
            </div>
            <div className="text-xs text-deep-sea-200/30 pt-1 border-t border-deep-sea-400/10">
              推荐逻辑：完成率 ≥ 70% + HRV ≥ 50ms → 增加强度 | 完成率 40-70% → 维持 | 完成率 &lt; 40% → 降低强度
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">完成率追踪</h3>
        <HeatmapCalendar data={heatmapData} month={new Date()} />
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-deep-sea-100 mb-4">最近运动记录</h3>
        <div className="space-y-3">
          {exerciseRecords.slice(0, 8).map((rec: ExerciseRecord) => (
            <div
              key={rec.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-deep-sea-600/40 border border-vital-green-500/10 hover:border-vital-green-500/25 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-vital-green-500/10 flex items-center justify-center text-vital-green-400 shrink-0">
                {typeIcons[rec.type] ?? <Dumbbell className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-deep-sea-100 font-medium text-sm">{rec.type}</span>
                  <span className="text-deep-sea-200/40 text-xs">{fmtDate(rec.startTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-deep-sea-200/60">
                  <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" />{rec.duration}分</span>
                  <span>{rec.distance}km</span>
                  <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-alert-red-400" />{rec.calories}kcal</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {rec.heartRateZones.slice(0, 5).map((z, i) => (
                  <span key={z.zone} className={`text-xs font-din ${heartZoneColor[i]}`}>
                    Z{i + 1}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {exerciseRecords.length === 0 && (
            <div className="text-center py-8 text-deep-sea-200/40">
              <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>暂无运动记录</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
