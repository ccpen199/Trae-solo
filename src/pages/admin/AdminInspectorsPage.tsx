import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Eye,
  CalendarClock,
  Shield,
  User,
  MapPin,
  Star,
  Award,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from "lucide-react";

interface Inspector {
  id: number;
  name: string;
  avatar: string;
  experience: number;
  region: string;
  deviationRate: number;
  passRate: number;
  totalOrders: number;
  monthlyOrders: number;
  score: number;
  level: "S" | "A" | "B";
  status: "online" | "offline" | "busy";
}

const mockInspectors: Inspector[] = [
  { id: 1, name: "张伟德", avatar: "张", experience: 12, region: "深圳/南山区", deviationRate: 0.8, passRate: 99.2, totalOrders: 3842, monthlyOrders: 58, score: 98, level: "S", status: "online" },
  { id: 2, name: "李明辉", avatar: "李", experience: 9, region: "北京/朝阳区", deviationRate: 1.2, passRate: 98.8, totalOrders: 2980, monthlyOrders: 52, score: 96, level: "S", status: "online" },
  { id: 3, name: "王建国", avatar: "王", experience: 8, region: "上海/静安区", deviationRate: 1.5, passRate: 98.5, totalOrders: 2650, monthlyOrders: 49, score: 95, level: "A", status: "busy" },
  { id: 4, name: "陈小雅", avatar: "陈", experience: 6, region: "杭州/西湖区", deviationRate: 2.1, passRate: 97.9, totalOrders: 1820, monthlyOrders: 45, score: 93, level: "A", status: "online" },
  { id: 5, name: "刘志强", avatar: "刘", experience: 7, region: "上海/浦东区", deviationRate: 2.4, passRate: 97.6, totalOrders: 2140, monthlyOrders: 42, score: 91, level: "A", status: "online" },
  { id: 6, name: "赵文博", avatar: "赵", experience: 5, region: "广州/天河区", deviationRate: 2.8, passRate: 97.2, totalOrders: 1560, monthlyOrders: 38, score: 89, level: "B", status: "offline" },
  { id: 7, name: "孙美玲", avatar: "孙", experience: 4, region: "成都/锦江区", deviationRate: 3.1, passRate: 96.8, totalOrders: 1280, monthlyOrders: 35, score: 87, level: "B", status: "online" },
  { id: 8, name: "周晓燕", avatar: "周", experience: 3, region: "南京/鼓楼区", deviationRate: 3.5, passRate: 96.2, totalOrders: 960, monthlyOrders: 32, score: 85, level: "B", status: "online" },
];

const levelStyle = (l: string) => {
  if (l === "S") return "bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-gold-sm";
  if (l === "A") return "bg-gradient-to-br from-forest-400 to-forest-600 text-ink-950";
  return "bg-gradient-to-br from-ink-400 to-ink-600 text-ink-950";
};

const statusStyle = (s: string) => {
  if (s === "online") return { dot: "bg-jade-500", label: "在线", cls: "text-jade-400" };
  if (s === "busy") return { dot: "bg-amberLux-500", label: "服务中", cls: "text-amberLux-500" };
  return { dot: "bg-ink-500", label: "离线", cls: "text-ink-500" };
};

const deviationColor = (d: number) =>
  d >= 3 ? "text-coral-400 bg-coral-500/15 ring-coral-500/30"
  : d >= 2 ? "text-amberLux-500 bg-amberLux-500/15 ring-amberLux-500/30"
  : "text-jade-400 bg-jade-500/15 ring-jade-500/30";

export default function AdminInspectorsPage() {
  const [keyword, setKeyword] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("全部");

  const filtered = mockInspectors.filter((ins) => {
    const matchKw = !keyword || ins.name.includes(keyword) || ins.region.includes(keyword);
    const matchLevel = filterLevel === "全部" || ins.level === filterLevel;
    return matchKw && matchLevel;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <User className="h-5 w-5 text-gold-500" />
              检测师团队
            </h2>
            <p className="mt-1 text-xs text-ink-400">
              共 {mockInspectors.length} 名检测师 · 在线 {mockInspectors.filter((i) => i.status !== "offline").length} 人
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-400" />
              <div className="flex rounded-xl border border-white/[0.08] bg-ink-850 p-1 text-xs">
                {["全部", "S级", "A级", "B级"].map((l) => (
                  <button
                    key={l}
                    onClick={() => setFilterLevel(l === "全部" ? "全部" : l.charAt(0))}
                    className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                      filterLevel === (l === "全部" ? "全部" : l.charAt(0))
                        ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30"
                        : "text-ink-400 hover:text-ink-200"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 w-full sm:w-64">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索姓名/区域..."
                className="flex-1 bg-transparent text-sm text-ink-100 placeholder-ink-500 outline-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-bold text-ink-950 shadow-gold-sm hover:from-gold-400 hover:to-gold-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              新增检测师
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((ins, i) => {
          const status = statusStyle(ins.status);
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-gold-500/15 bg-ink-900/60 p-5 transition-all hover:border-gold-500/30 hover:shadow-gold-sm"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-bold ring-2 ring-white/[0.08] ${levelStyle(
                        ins.level
                      )}`}
                    >
                      {ins.avatar}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${status.dot} ring-3 ring-ink-900`}
                    />
                    <div
                      className={`absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full ${levelStyle(
                        ins.level
                      )} ring-2 ring-ink-900 shadow-gold-sm`}
                    >
                      <Award className="h-3 w-3" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-ink-100">{ins.name}</h3>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${levelStyle(
                          ins.level
                        )}`}
                      >
                        {ins.level}级
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-400">
                      <MapPin className="h-3 w-3" />
                      {ins.region}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-medium ${status.cls}`}>{status.label}</p>
                  <div className="mt-1 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                    <span className="text-xs font-bold gold-text">{ins.score}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.04] bg-ink-850/60 p-3">
                <div className="text-center">
                  <p className="text-[10px] text-ink-500">从业</p>
                  <p className="mt-0.5 font-display text-sm font-bold text-ink-100">{ins.experience}年</p>
                </div>
                <div className="border-x border-white/[0.06] text-center">
                  <p className="text-[10px] text-ink-500">累计单</p>
                  <p className="mt-0.5 font-display text-sm font-bold text-forest-400">
                    {(ins.totalOrders / 1000).toFixed(1)}k
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-ink-500">本月单</p>
                  <p className="mt-0.5 font-display text-sm font-bold text-gold-400">{ins.monthlyOrders}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-ink-400">
                      <AlertTriangle className="h-3 w-3" />
                      当前偏差率
                    </span>
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 font-bold ring-1 ${deviationColor(
                        ins.deviationRate
                      )}`}
                    >
                      {ins.deviationRate}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ins.deviationRate < 2
                          ? "bg-gradient-to-r from-jade-400 to-jade-500"
                          : ins.deviationRate < 3
                          ? "bg-gradient-to-r from-amberLux-400 to-amberLux-500"
                          : "bg-gradient-to-r from-coral-400 to-coral-500"
                      }`}
                      style={{ width: `${Math.min(ins.deviationRate * 15, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-ink-400">
                      <CheckCircle2 className="h-3 w-3" />
                      飞检通过率
                    </span>
                    <span className="font-bold text-forest-400">{ins.passRate}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ins.passRate}%` }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-forest-400 via-jade-400 to-gold-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-4">
                <button className="flex items-center justify-center gap-1 rounded-lg bg-ink-850 py-2 text-[11px] font-medium text-ink-300 transition-colors hover:bg-gold-500/10 hover:text-gold-400">
                  <Eye className="h-3.5 w-3.5" />
                  详情
                </button>
                <button className="flex items-center justify-center gap-1 rounded-lg bg-ink-850 py-2 text-[11px] font-medium text-ink-300 transition-colors hover:bg-forest-500/10 hover:text-forest-400">
                  <CalendarClock className="h-3.5 w-3.5" />
                  排班
                </button>
                <button className="flex items-center justify-center gap-1 rounded-lg bg-ink-850 py-2 text-[11px] font-medium text-ink-300 transition-colors hover:bg-jade-500/10 hover:text-jade-400">
                  <Shield className="h-3.5 w-3.5" />
                  权限
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
