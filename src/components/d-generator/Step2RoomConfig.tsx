import { Room, RoomType, useDGeneratorStore } from '@/store/dGeneratorStore';
import { Edit3, DoorOpen, Maximize2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const roomTypeOptions: { value: RoomType; label: string; icon: string }[] = [
  { value: 'living', label: '客厅', icon: '🛋️' },
  { value: 'master', label: '主卧', icon: '🛏️' },
  { value: 'second', label: '次卧', icon: '🛏️' },
  { value: 'kitchen', label: '厨房', icon: '🍳' },
  { value: 'bathroom', label: '卫生间', icon: '🚿' },
  { value: 'dining', label: '餐厅', icon: '🍽️' },
  { value: 'study', label: '书房', icon: '📚' },
  { value: 'balcony', label: '阳台', icon: '🌿' },
];

function RoomCard({ room }: { room: Room }) {
  const { updateRoom } = useDGeneratorStore();
  const typeInfo = roomTypeOptions.find((t) => t.value === room.type) || roomTypeOptions[0];

  return (
    <div className="bg-white rounded-card border border-wood-200 p-4 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeInfo.icon}</span>
          <h4 className="font-semibold text-carbon-800">{room.name}</h4>
        </div>
        <div className="relative">
          <select
            value={room.type}
            onChange={(e) => {
              const val = e.target.value as RoomType;
              const info = roomTypeOptions.find((t) => t.value === val);
              updateRoom(room.id, { type: val, name: info?.label || room.name });
            }}
            className="appearance-none pr-8 pl-3 py-1.5 rounded-lg border border-wood-200 bg-ivory-50 text-sm text-carbon-700 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400 cursor-pointer"
          >
            {roomTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-carbon-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-1 text-xs text-carbon-500 mb-1.5">
            <Maximize2 className="w-3 h-3" />
            尺寸 (米)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="1"
                max="20"
                value={room.width}
                onChange={(e) => updateRoom(room.id, { width: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-wood-200 bg-ivory-50 text-sm text-carbon-800 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-carbon-400">宽</span>
            </div>
            <span className="text-carbon-400">×</span>
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="1"
                max="20"
                value={room.height}
                onChange={(e) => updateRoom(room.id, { height: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-wood-200 bg-ivory-50 text-sm text-carbon-800 focus:outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-carbon-400">深</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-carbon-500 mb-1.5">
              <DoorOpen className="w-3 h-3" />
              门数量
            </label>
            <div className="flex items-center border border-wood-200 rounded-lg overflow-hidden">
              <button
                onClick={() => updateRoom(room.id, { doors: Math.max(0, room.doors - 1) })}
                className="px-3 py-2 bg-ivory-50 hover:bg-wood-100 text-carbon-600 transition-colors"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-medium text-carbon-800 bg-white">{room.doors}</span>
              <button
                onClick={() => updateRoom(room.id, { doors: Math.min(10, room.doors + 1) })}
                className="px-3 py-2 bg-ivory-50 hover:bg-wood-100 text-carbon-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-carbon-500 mb-1.5">
              <Edit3 className="w-3 h-3" />
              窗数量
            </label>
            <div className="flex items-center border border-wood-200 rounded-lg overflow-hidden">
              <button
                onClick={() => updateRoom(room.id, { windows: Math.max(0, room.windows - 1) })}
                className="px-3 py-2 bg-ivory-50 hover:bg-wood-100 text-carbon-600 transition-colors"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-medium text-carbon-800 bg-white">{room.windows}</span>
              <button
                onClick={() => updateRoom(room.id, { windows: Math.min(10, room.windows + 1) })}
                className="px-3 py-2 bg-ivory-50 hover:bg-wood-100 text-carbon-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-wood-100">
          <p className="text-xs text-carbon-500">
            面积: <span className="font-semibold text-carbon-700">{(room.width * room.height).toFixed(1)} m²</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function FloorPlanPreview({ rooms }: { rooms: Room[] }) {
  const scale = 35;
  const padding = 30;

  const positions = [
    { x: 0, y: 0, id: 'r1' },
    { x: 5, y: 0, id: 'r2' },
    { x: 0, y: 6, id: 'r3' },
    { x: 3.5, y: 6, id: 'r4' },
    { x: 6, y: 4.5, id: 'r5' },
  ];

  return (
    <div className="bg-white rounded-card border border-wood-200 p-5 shadow-card">
      <h3 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
        <Maximize2 className="w-4 h-4 text-terracotta-500" />
        平面预览
      </h3>
      <div className="bg-ivory-50 rounded-lg p-4 overflow-auto">
        <svg viewBox="0 0 420 380" className="w-full h-auto">
          <defs>
            <pattern id="fpGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E8E4DD" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="420" height="380" fill="url(#fpGrid)" rx="8" />

          {rooms.map((room, idx) => {
            const pos = positions.find((p) => p.id === room.id) || positions[idx % positions.length];
            const w = room.width * scale;
            const h = room.height * scale;
            const x = padding + pos.x * scale;
            const y = padding + pos.y * scale;

            return (
              <g key={room.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="#FBF2ED"
                  stroke="#B88537"
                  strokeWidth="2.5"
                  rx="2"
                />
                <text
                  x={x + w / 2}
                  y={y + h / 2 - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#555452"
                  fontWeight="600"
                >
                  {room.name}
                </text>
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#9A9489"
                >
                  {room.width}×{room.height}m
                </text>

                {Array.from({ length: Math.min(room.windows, 2) }).map((_, wi) => (
                  <rect
                    key={`w-${wi}`}
                    x={x + 8 + wi * (w / 3)}
                    y={y - 4}
                    width={Math.min(w / 4, 20)}
                    height="6"
                    fill="#7A9CA9"
                    rx="1"
                  />
                ))}

                {Array.from({ length: Math.min(room.doors, 1) }).map((_, di) => (
                  <g key={`d-${di}`}>
                    <rect
                      x={x + w - 14 - di * 20}
                      y={y + h - 2}
                      width="14"
                      height="4"
                      fill="#DE8F69"
                      rx="1"
                    />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-[#7A9CA9]"></span>
            <span className="text-carbon-500">窗户</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-[#DE8F69]"></span>
            <span className="text-carbon-500">门</span>
          </div>
        </div>
        <p className="text-carbon-500">
          总面积: <span className="font-semibold text-terracotta-600">
            {rooms.reduce((s, r) => s + r.width * r.height, 0).toFixed(1)} m²
          </span>
        </p>
      </div>
    </div>
  );
}

export default function Step2RoomConfig() {
  const { rooms, setStep } = useDGeneratorStore();

  return (
    <div className="flex flex-col h-full p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-carbon-800 mb-1">房间配置</h2>
        <p className="text-carbon-500">AI 已识别 {rooms.length} 个房间，可调整参数后继续</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 space-y-4 overflow-auto pr-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-0 space-y-4">
            <FloorPlanPreview rooms={rooms} />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-2.5 rounded-btn border border-wood-300 text-carbon-700 hover:bg-wood-50 transition-colors font-medium"
              >
                ← 上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className={cn(
                  'flex-1 px-6 py-2.5 rounded-btn font-medium transition-all shadow-lg',
                  'bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white hover:from-terracotta-600 hover:to-terracotta-700 shadow-terracotta-500/20'
                )}
              >
                下一步 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
