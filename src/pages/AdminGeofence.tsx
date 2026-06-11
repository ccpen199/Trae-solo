import { useState } from "react";
import { Plus, X, MapPin } from "lucide-react";

const TYPES = ["配送区", "禁行区", "服务区"] as const;
type FenceType = (typeof TYPES)[number];

const TYPE_COLORS: Record<FenceType, { bg: string; border: string; badge: string }> = {
  "配送区": { bg: "bg-[#2EC4B6]/15", border: "border-[#2EC4B6]", badge: "bg-[#2EC4B6] text-white" },
  "禁行区": { bg: "bg-[#E63946]/15", border: "border-[#E63946]", badge: "bg-[#E63946] text-white" },
  "服务区": { bg: "bg-[#FFC857]/15", border: "border-[#FFC857]", badge: "bg-[#FFC857] text-[#1B3A5C]" },
};

const FENCES = [
  { id: 1, name: "北区宿舍配送范围", type: "配送区" as FenceType, x: 15, y: 10, w: 30, h: 25 },
  { id: 2, name: "图书馆安静区", type: "禁行区" as FenceType, x: 50, y: 30, w: 20, h: 20 },
  { id: 3, name: "学生活动中心", type: "服务区" as FenceType, x: 25, y: 55, w: 35, h: 20 },
  { id: 4, name: "东区食堂配送范围", type: "配送区" as FenceType, x: 65, y: 60, w: 25, h: 25 },
];

const MAP_LABELS = [
  { label: "北门", x: 50, y: 2 }, { label: "图书馆", x: 58, y: 38 },
  { label: "食堂", x: 75, y: 70 }, { label: "宿舍楼", x: 25, y: 20 },
  { label: "操场", x: 10, y: 70 }, { label: "活动中心", x: 40, y: 62 },
];

export default function AdminGeofence() {
  const [showForm, setShowForm] = useState(false);
  const [selectedFence, setSelectedFence] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">电子围栏配置</h1>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55d2b] transition-colors">
            <Plus size={14} />
            新建围栏
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-[#1B3A5C] mb-3">校园地图</h3>
              <div className="relative w-full h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                <div className="absolute inset-0" style={{
                  backgroundImage: "linear-gradient(rgba(27,58,92,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(27,58,92,0.06) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }} />
                {FENCES.map((fence) => {
                  const colors = TYPE_COLORS[fence.type];
                  return (
                    <div
                      key={fence.id}
                      onClick={() => setSelectedFence(fence.id === selectedFence ? null : fence.id)}
                      className={`absolute rounded-lg border-2 cursor-pointer transition-all ${colors.bg} ${colors.border} ${selectedFence === fence.id ? "ring-2 ring-offset-2 ring-[#FF6B35]" : ""}`}
                      style={{ left: `${fence.x}%`, top: `${fence.y}%`, width: `${fence.w}%`, height: `${fence.h}%` }}
                    >
                      <div className="absolute -top-5 left-1 text-xs font-medium text-[#1B3A5C] whitespace-nowrap">{fence.name}</div>
                    </div>
                  );
                })}
                {MAP_LABELS.map((m) => (
                  <div key={m.label} className="absolute flex items-center gap-1 text-xs text-gray-400" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                    <MapPin size={10} />
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-[#1B3A5C] mb-4">围栏列表</h3>
              <div className="space-y-3">
                {FENCES.map((fence) => {
                  const colors = TYPE_COLORS[fence.type];
                  return (
                    <div
                      key={fence.id}
                      onClick={() => setSelectedFence(fence.id === selectedFence ? null : fence.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedFence === fence.id ? "border-[#FF6B35] ring-1 ring-[#FF6B35]/30" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#1B3A5C]">{fence.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>{fence.type}</span>
                      </div>
                      <div className="text-xs text-gray-400">位置: ({fence.x}, {fence.y}) · 范围: {fence.w}×{fence.h}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C]">新建围栏</h3>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input placeholder="围栏名称" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <div className="flex gap-2">
                  {TYPES.map((t) => {
                    const c = TYPE_COLORS[t];
                    return (
                      <button key={t} className={`flex-1 py-2 rounded-lg text-sm font-medium ${c.badge}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="X坐标" type="number" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <input placeholder="Y坐标" type="number" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <input placeholder="宽度" type="number" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <input placeholder="高度" type="number" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
                <button className="w-full py-2.5 rounded-lg bg-[#FF6B35] text-white font-medium text-sm hover:bg-[#e55d2b] transition-colors">确认创建</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
