import { motion } from "framer-motion";
import {
  CalendarClock,
  MapPin,
  Route,
  Clock,
  Car,
  CircleDollarSign,
  User,
  GripVertical,
  CalendarPlus2,
  RefreshCw,
  Navigation,
} from "lucide-react";

interface ShiftTask {
  id: string;
  time: string;
  address: string;
  product: string;
  inspector: string;
  priority?: "high" | "normal";
}

const weekDays = [
  { date: "6/16", day: "周二", isToday: false },
  { date: "6/17", day: "周三", isToday: false },
  { date: "6/18", day: "周四", isToday: false },
  { date: "6/19", day: "周五", isToday: true },
  { date: "6/20", day: "周六", isToday: false },
  { date: "6/21", day: "周日", isToday: false },
  { date: "6/22", day: "周一", isToday: false },
];

const scheduleData: (ShiftTask | null)[][] = [
  [
    { id: "s1", time: "09:00", address: "静安区南京西路", product: "Hermès Birkin", inspector: "王建国", priority: "high" },
    { id: "s2", time: "14:00", address: "徐汇区衡山路", product: "LV Speedy 30", inspector: "王建国" },
  ],
  [
    { id: "s3", time: "10:30", address: "浦东陆家嘴", product: "Cartier Santos", inspector: "陈小雅" },
    { id: "s4", time: "15:00", address: "长宁区古北", product: "Rolex Datejust", inspector: "陈小雅" },
    { id: "s5", time: "17:30", address: "普陀区长寿路", product: "Gucci 酒神包", inspector: "刘志强", priority: "high" },
  ],
  [
    { id: "s6", time: "09:30", address: "虹口区北外滩", product: "Dior Lady Dior", inspector: "孙美玲" },
    { id: "s7", time: "13:00", address: "杨浦区五角场", product: "Prada 杀手包", inspector: "刘志强" },
  ],
  [
    { id: "s8", time: "08:30", address: "闵行区七宝", product: "AP Royal Oak", inspector: "张伟德", priority: "high" },
    { id: "s9", time: "11:00", address: "徐汇区衡山路", product: "Hermès Kelly 28", inspector: "王建国" },
    { id: "s10", time: "14:30", address: "静安区南京西路", product: "Chanel Boy", inspector: "陈小雅" },
    { id: "s11", time: "17:00", address: "浦东陆家嘴", product: "PP Aquanaut", inspector: "张伟德", priority: "high" },
  ],
  [
    { id: "s12", time: "10:00", address: "黄浦区淮海路", product: "BV 云朵包", inspector: "周晓燕" },
    { id: "s13", time: "15:30", address: "长宁区中山公园", product: "Tiffany 六爪钻戒", inspector: "孙美玲" },
  ],
  [
    { id: "s14", time: "11:00", address: "松江区大学城", product: "Coach 托特包", inspector: "吴建军" },
  ],
  [
    { id: "s15", time: "09:30", address: "嘉定区南翔", product: "Omega 海马", inspector: "赵文博" },
    { id: "s16", time: "13:30", address: "宝山区万达", product: "Fendi Peekaboo", inspector: "周晓燕" },
  ],
];

const routeData = [
  {
    inspector: "张伟德",
    color: "#C9A962",
    distance: "18.6km",
    duration: "1h 45min",
    profit: "¥12,800",
    points: [
      { x: 18, y: 30, label: "七宝" },
      { x: 35, y: 25, label: "虹桥" },
      { x: 55, y: 55, label: "徐家汇" },
      { x: 72, y: 42, label: "人民广场" },
    ],
  },
  {
    inspector: "王建国",
    color: "#2BA179",
    distance: "12.4km",
    duration: "1h 10min",
    profit: "¥8,600",
    points: [
      { x: 60, y: 20, label: "静安寺" },
      { x: 70, y: 35, label: "南京西路" },
      { x: 82, y: 50, label: "陆家嘴" },
    ],
  },
  {
    inspector: "陈小雅",
    color: "#E74C3C",
    distance: "9.2km",
    duration: "55min",
    profit: "¥6,200",
    points: [
      { x: 40, y: 65, label: "古北" },
      { x: 52, y: 72, label: "漕河泾" },
      { x: 65, y: 80, label: "莘庄" },
    ],
  },
];

const priorityColor = (p?: string) =>
  p === "high"
    ? "border-coral-500/40 bg-coral-500/10"
    : "border-gold-500/20 bg-ink-850/80";

export default function CityNetworkPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 xl:col-span-3"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <CalendarClock className="h-5 w-5 text-gold-500" />
              检测师排班周视图
            </h2>
            <p className="mt-1 text-xs text-ink-400">拖拽卡片调整排班顺序，点击请假/调班按钮</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 text-xs font-medium text-ink-300 hover:border-gold-500/30 hover:text-gold-500 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              本周
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500/20 to-gold-600/20 px-3 py-2 text-xs font-semibold text-gold-400 ring-1 ring-gold-500/30 hover:from-gold-500 hover:to-gold-600 hover:text-ink-950 transition-all">
              <CalendarPlus2 className="h-3.5 w-3.5" />
              批量排班
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, di) => (
            <div key={d.date} className="flex flex-col">
              <div
                className={`mb-2 rounded-lg p-2 text-center ${
                  d.isToday
                    ? "bg-gradient-to-br from-gold-500/20 to-transparent ring-1 ring-gold-500/40"
                    : "bg-ink-850/60"
                }`}
              >
                <p className={`text-[11px] ${d.isToday ? "text-gold-400" : "text-ink-500"}`}>{d.day}</p>
                <p
                  className={`text-sm font-bold ${
                    d.isToday ? "gold-text" : "text-ink-200"
                  }`}
                >
                  {d.date}
                </p>
              </div>

              <div className="space-y-1.5 min-h-[320px]">
                {scheduleData[di].map((task, ti) => (
                  task && (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: di * 0.03 + ti * 0.04 }}
                      className={`group relative cursor-grab active:cursor-grabbing rounded-lg border p-2.5 transition-all hover:shadow-gold-sm ${priorityColor(
                        task.priority
                      )}`}
                      whileHover={{ y: -2 }}
                    >
                      <GripVertical className="absolute left-1 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="pl-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold ${
                              task.priority === "high" ? "text-coral-400" : "text-gold-400"
                            }`}
                          >
                            {task.time}
                          </span>
                          {task.priority === "high" && (
                            <span className="rounded bg-coral-500/20 px-1.5 py-0.5 text-[9px] font-bold text-coral-400">
                              高价值
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-ink-100">{task.product}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-ink-400">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {task.address}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[10px] text-forest-400">
                            <User className="h-2.5 w-2.5" />
                            {task.inspector}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="rounded bg-ink-800 px-1 py-0.5 text-[9px] text-ink-300 hover:bg-coral-500/20 hover:text-coral-400">
                              请假
                            </button>
                            <button className="rounded bg-ink-800 px-1 py-0.5 text-[9px] text-ink-300 hover:bg-gold-500/20 hover:text-gold-400">
                              调班
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 xl:col-span-2"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <Route className="h-5 w-5 text-forest-400" />
              上门路线优化
            </h2>
            <p className="mt-1 text-xs text-ink-400">3位检测师今日任务路线 · AI智能规划</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl border border-forest-500/30 bg-forest-500/10 px-3 py-1.5 text-xs font-semibold text-forest-400 hover:bg-forest-500/20 transition-colors">
            <Navigation className="h-3.5 w-3.5" />
            重新规划
          </button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-forest-900/20 via-ink-850 to-ink-900">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,169,98,0.08) 1px, transparent 1px, transparent calc(100% - 1px), rgba(201,169,98,0.08) calc(100% - 1px), rgba(201,169,98,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.08) 1px, transparent 1px, transparent calc(100% - 1px), rgba(201,169,98,0.08) calc(100% - 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {routeData.map((route, ri) => (
              <g key={ri}>
                <polyline
                  fill="none"
                  stroke={route.color}
                  strokeWidth="0.8"
                  strokeDasharray="2,1.5"
                  opacity="0.7"
                  points={route.points.map((p) => `${p.x},${p.y}`).join(" ")}
                />
                {route.points.map((p, pi) => (
                  pi > 0 && (
                    <motion.line
                      key={pi}
                      x1={route.points[pi - 1].x}
                      y1={route.points[pi - 1].y}
                      x2={p.x}
                      y2={p.y}
                      stroke={route.color}
                      strokeWidth="0.4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3 + ri * 0.15 + pi * 0.1, duration: 0.8 }}
                    />
                  )
                ))}
                {route.points.map((p, pi) => (
                  <g key={`pt-${pi}`}>
                    <circle cx={p.x} cy={p.y} r="1.8" fill={route.color} stroke="#0A0A0F" strokeWidth="0.6" />
                    <text
                      x={p.x}
                      y={p.y - 3}
                      fontSize="2.4"
                      fill={route.color}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </g>
            ))}
          </svg>

          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
            {routeData.map((route) => (
              <div
                key={route.inspector}
                className="flex items-center gap-2 rounded-lg bg-ink-900/85 px-2.5 py-1.5 text-[10px] backdrop-blur-sm"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <span className="font-medium text-ink-100">{route.inspector}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {routeData.map((route, i) => (
            <motion.div
              key={route.inspector}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-850/60 p-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1"
                style={{
                  backgroundColor: `${route.color}15`,
                  borderColor: `${route.color}40`,
                }}
              >
                <Navigation className="h-5 w-5" style={{ color: route.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-semibold text-ink-100">
                  {route.inspector}
                  <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[9px] text-ink-400">
                    {route.points.length}个任务点
                  </span>
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-400">
                  <span className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {route.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {route.duration}
                  </span>
                  <span className="ml-auto flex items-center gap-1 font-semibold text-jade-400">
                    <CircleDollarSign className="h-3 w-3" />
                    {route.profit}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
