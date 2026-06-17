import { useState } from "react";
import {
  LineChart,
  Plus,
  Clock,
  TrendingUp,
  Target,
  Lightbulb,
  Calendar,
  Award,
  BarChart3,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { TrainingRecord } from "../../shared/types";

const radarLabels = ["基础指令", "社交礼仪", "日常习惯", "户外活动", "情绪管理"];

const mockRadarData = [
  { label: "基础指令", value: 78 },
  { label: "社交礼仪", value: 52 },
  { label: "日常习惯", value: 65 },
  { label: "户外活动", value: 48 },
  { label: "情绪管理", value: 70 },
];

const monthlyTrend = [
  { week: "第1周", value: 45, sessions: 3 },
  { week: "第2周", value: 58, sessions: 4 },
  { week: "第3周", value: 52, sessions: 3 },
  { week: "第4周", value: 72, sessions: 5 },
];

export default function Training() {
  const { trainingRecords, weeklyReport, pets, currentUser, addTrainingRecord } =
    useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    petId: pets[0]?.id || "",
    trainingType: "",
    date: new Date().toISOString().slice(0, 10),
    duration: 15,
    improvement: 15,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.petId || !form.trainingType) return;

    const record: TrainingRecord = {
      id: "t" + Date.now(),
      petId: form.petId,
      userId: currentUser.id,
      trainingType: form.trainingType,
      date: form.date,
      duration: form.duration,
      improvement: form.improvement,
      notes: form.notes,
    };
    addTrainingRecord(record);
    setShowForm(false);
    setForm({
      petId: pets[0]?.id || "",
      trainingType: "",
      date: new Date().toISOString().slice(0, 10),
      duration: 15,
      improvement: 15,
      notes: "",
    });
  };

  const radarPoints = mockRadarData
    .map((d, i) => {
      const angle = (Math.PI * 2 * i) / mockRadarData.length - Math.PI / 2;
      const r = (d.value / 100) * 90;
      const x = 110 + r * Math.cos(angle);
      const y = 110 + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const maxTrend = Math.max(...monthlyTrend.map((m) => m.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-display text-warm-brown flex items-center gap-2">
            <LineChart className="w-8 h-8 text-brand-mint" />
            训练追踪
          </h1>
          <p className="text-warm-gray mt-1">记录每一次训练，见证毛孩子的成长</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-mint to-brand-mint-light text-white rounded-2xl font-medium shadow-mint-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          记录训练
        </button>
      </div>

      {weeklyReport && (
        <div className="bg-gradient-to-br from-white via-cream-50 to-brand-mint/5 rounded-3xl shadow-soft p-6 animate-slide-up border border-cream-200/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-mint flex items-center justify-center shadow-soft">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display text-warm-brown">
                本周训练周报
              </h2>
              <p className="text-xs text-warm-gray flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {weeklyReport.weekStart} ~ {weeklyReport.weekEnd}
              </p>
            </div>
            <span className="ml-auto px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange-dark text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              自动生成
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-warm-gray text-sm mb-1">
                <Clock className="w-4 h-4 text-brand-orange" />
                总时长
              </div>
              <p className="text-2xl font-display text-warm-brown">
                {weeklyReport.totalDuration}
                <span className="text-sm font-normal text-warm-gray ml-1">分钟</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-warm-gray text-sm mb-1">
                <Target className="w-4 h-4 text-brand-mint" />
                训练次数
              </div>
              <p className="text-2xl font-display text-warm-brown">
                {weeklyReport.totalSessions}
                <span className="text-sm font-normal text-warm-gray ml-1">次</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-warm-gray text-sm mb-1">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
                平均改善分
              </div>
              <p className="text-2xl font-display text-warm-brown">
                {weeklyReport.averageImprovement}
                <span className="text-sm font-normal text-warm-gray ml-1">分</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2 text-warm-gray text-sm mb-1">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                完成率
              </div>
              <p className="text-2xl font-display text-warm-brown">
                {Math.round((weeklyReport.totalSessions / 7) * 100)}
                <span className="text-sm font-normal text-warm-gray ml-1">%</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <h3 className="text-sm font-medium text-warm-brown mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-mint" />
                分类能力雷达
              </h3>
              <div className="flex justify-center">
                <svg viewBox="0 0 220 220" className="w-56 h-56">
                  {[0.25, 0.5, 0.75, 1].map((scale) => (
                    <polygon
                      key={scale}
                      points={radarLabels
                        .map((_, i) => {
                          const angle =
                            (Math.PI * 2 * i) / radarLabels.length -
                            Math.PI / 2;
                          const r = scale * 90;
                          return `${110 + r * Math.cos(angle)},${
                            110 + r * Math.sin(angle)
                          }`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#FFE4CC"
                      strokeWidth="1"
                    />
                  ))}
                  {radarLabels.map((_, i) => {
                    const angle =
                      (Math.PI * 2 * i) / radarLabels.length - Math.PI / 2;
                    return (
                      <line
                        key={i}
                        x1="110"
                        y1="110"
                        x2={110 + 90 * Math.cos(angle)}
                        y2={110 + 90 * Math.sin(angle)}
                        stroke="#FFE4CC"
                        strokeWidth="1"
                      />
                    );
                  })}
                  <polygon
                    points={radarPoints}
                    fill="url(#radarGradient)"
                    fillOpacity="0.4"
                    stroke="#FF8A5B"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF8A5B" />
                      <stop offset="100%" stopColor="#4ECDC4" />
                    </linearGradient>
                  </defs>
                  {mockRadarData.map((d, i) => {
                    const angle =
                      (Math.PI * 2 * i) / mockRadarData.length - Math.PI / 2;
                    const r = 108;
                    const x = 110 + r * Math.cos(angle);
                    const y = 110 + r * Math.sin(angle);
                    return (
                      <text
                        key={i}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-warm-gray"
                        style={{ fontSize: "10px" }}
                      >
                        {d.label}
                      </text>
                    );
                  })}
                  {mockRadarData.map((d, i) => {
                    const angle =
                      (Math.PI * 2 * i) / mockRadarData.length - Math.PI / 2;
                    const r = (d.value / 100) * 90;
                    const x = 110 + r * Math.cos(angle);
                    const y = 110 + r * Math.sin(angle);
                    return (
                      <circle
                        key={`p-${i}`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#FF8A5B"
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <h3 className="text-sm font-medium text-warm-brown mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent-sunny" />
                训练建议
              </h3>
              <div className="space-y-3">
                {weeklyReport.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-cream-50 to-cream-100/50"
                  >
                    <div
                      className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                        i % 2 === 0 ? "bg-brand-orange" : "bg-brand-mint"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm text-warm-brown leading-relaxed">
                      {s}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft p-6 animate-stagger-1">
        <h2 className="text-xl font-display text-warm-brown flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-brand-orange/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-orange-dark" />
          </div>
          月度改善趋势
        </h2>
        <div className="relative h-64 px-4 pt-4">
          <div className="absolute inset-y-0 left-12 right-4 flex flex-col justify-between py-2">
            {[100, 75, 50, 25, 0].map((v) => (
              <div key={v} className="flex items-center gap-3">
                <span className="w-8 text-xs text-warm-gray text-right">{v}</span>
                <div className="flex-1 border-t border-dashed border-cream-200" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 left-16 right-6 top-6 bottom-10 flex items-end justify-around">
            {monthlyTrend.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-16 max-w-[60px] rounded-t-2xl bg-gradient-to-t from-brand-mint to-brand-mint-light shadow-soft transition-all hover:shadow-hover hover:-translate-y-1 duration-300 relative group cursor-pointer"
                    style={{ height: `${(m.value / maxTrend) * 180}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-warm-brown text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {m.value}分 · {m.sessions}次
                    </div>
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-brand-orange shadow-soft" />
                  </div>
                </div>
                <span className="text-xs text-warm-gray font-medium">
                  {m.week}
                </span>
              </div>
            ))}
          </div>
          <svg
            className="absolute inset-0 left-16 right-6 top-6 bottom-10 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {(() => {
              const points = monthlyTrend.map((m, i) => {
                const x = (i / (monthlyTrend.length - 1)) * 100;
                const y = 100 - (m.value / maxTrend) * 90 - 5;
                return `${x},${y}`;
              });
              return (
                <polyline
                  points={points.join(" ")}
                  fill="none"
                  stroke="#FF8A5B"
                  strokeWidth="0.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="0"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })()}
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft p-6 animate-stagger-2">
        <h2 className="text-xl font-display text-warm-brown flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-brand-mint/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-brand-mint-dark" />
          </div>
          训练记录列表
          <span className="ml-auto text-sm font-normal text-warm-gray">
            共 {trainingRecords.length} 条记录
          </span>
        </h2>
        <div className="space-y-3">
          {trainingRecords.map((r, idx) => {
            const pet = pets.find((p) => p.id === r.petId);
            return (
              <div
                key={r.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cream-50 to-white border border-cream-200/50 hover:shadow-soft transition-all group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {pet && (
                  <img
                    src={pet.avatar}
                    alt={pet.name}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-warm-brown truncate">
                      {r.trainingType}
                    </p>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-brand-orange/10 text-brand-orange-dark font-medium">
                      +{r.improvement}
                    </span>
                  </div>
                  <p className="text-xs text-warm-gray flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {r.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.duration}分钟
                    </span>
                    {pet && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {pet.name}
                      </span>
                    )}
                  </p>
                  {r.notes && (
                    <p className="text-sm text-warm-gray mt-1.5 line-clamp-1">
                      {r.notes}
                    </p>
                  )}
                </div>
                <TrendingUp className="w-5 h-5 text-brand-mint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-brown/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-hover animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-cream-200 bg-gradient-to-r from-brand-mint/5 to-cream-50">
              <h2 className="text-xl font-display text-warm-brown flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-mint" />
                记录训练
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-xl hover:bg-white text-warm-gray transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-warm-brown">宠物</label>
                <select
                  value={form.petId}
                  onChange={(e) => setForm({ ...form, petId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 outline-none transition-all text-warm-brown bg-white"
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-warm-brown">
                  训练项目
                </label>
                <input
                  type="text"
                  value={form.trainingType}
                  onChange={(e) =>
                    setForm({ ...form, trainingType: e.target.value })
                  }
                  placeholder="如：基础指令-坐下"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 outline-none transition-all text-warm-brown"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-warm-brown">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 outline-none transition-all text-warm-brown"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-warm-brown">
                    时长（分钟）
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 outline-none transition-all text-warm-brown"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-warm-brown">
                    改善分
                  </label>
                  <span className="text-sm text-brand-mint-dark font-semibold">
                    +{form.improvement}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={form.improvement}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      improvement: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-brand-mint"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-warm-brown">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="记录训练过程中的表现..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 outline-none transition-all text-warm-brown resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-cream-200 text-warm-gray font-medium hover:bg-cream-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-mint to-brand-mint-light text-white font-medium shadow-mint-soft hover:shadow-hover transition-all"
                >
                  保存记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
