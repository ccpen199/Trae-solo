import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  ShieldAlert,
  ClipboardList,
  Search,
  SlidersHorizontal,
  Calendar,
  Plus,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

interface InspectionTask {
  id: number;
  orderNo: string;
  inspector: string;
  originalGrade: string;
  originalPrice: number;
  status: "pending" | "processing" | "completed";
  deviationRate: number;
  alertLevel: "high" | "medium" | "low" | "none";
}

const gaugeOption = {
  backgroundColor: "transparent",
  series: [
    {
      type: "gauge",
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 8,
      radius: "90%",
      center: ["50%", "58%"],
      splitNumber: 8,
      axisLine: {
        lineStyle: {
          width: 18,
          color: [
            [0.375, "#2BA179"],
            [0.625, "#C9A962"],
            [1, "#E74C3C"],
          ],
        },
      },
      pointer: {
        icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
        length: "62%",
        width: 10,
        offsetCenter: [0, "-10%"],
        itemStyle: { color: "#C9A962", shadowColor: "rgba(201,169,98,0.6)", shadowBlur: 10 },
      },
      axisTick: { show: false },
      splitLine: {
        length: 10,
        lineStyle: { color: "rgba(255,255,255,0.2)", width: 1 },
      },
      axisLabel: {
        color: "#86869B",
        fontSize: 10,
        distance: 24,
        formatter: (v: number) => `${v}%`,
      },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, "25%"],
        formatter: "{value}%",
        color: "#C9A962",
        fontSize: 32,
        fontFamily: "Playfair Display",
        fontWeight: "bold",
      },
      data: [{ value: 4.2, name: "偏差率" }],
    },
  ],
  graphic: [
    {
      type: "text",
      left: "center",
      top: "82%",
      style: {
        text: "综合偏差率",
        fill: "#86869B",
        fontSize: 12,
      },
    },
  ],
};

const mockTasks: InspectionTask[] = [
  { id: 1, orderNo: "RS202606150001", inspector: "王建国", originalGrade: "S级", originalPrice: 128000, status: "pending", deviationRate: 0, alertLevel: "none" },
  { id: 2, orderNo: "RS202606140008", inspector: "陈小雅", originalGrade: "A级", originalPrice: 58000, status: "completed", deviationRate: 6.8, alertLevel: "high" },
  { id: 3, orderNo: "RS202606130015", inspector: "张伟德", originalGrade: "S级", originalPrice: 268000, status: "completed", deviationRate: 1.2, alertLevel: "none" },
  { id: 4, orderNo: "RS202606120023", inspector: "刘志强", originalGrade: "B级", originalPrice: 22800, status: "processing", deviationRate: 3.5, alertLevel: "medium" },
  { id: 5, orderNo: "RS202606110031", inspector: "李明辉", originalGrade: "A级", originalPrice: 86500, status: "completed", deviationRate: 2.1, alertLevel: "low" },
  { id: 6, orderNo: "RS202606100009", inspector: "孙美玲", originalGrade: "S级", originalPrice: 156000, status: "pending", deviationRate: 0, alertLevel: "none" },
  { id: 7, orderNo: "RS202606090018", inspector: "周晓燕", originalGrade: "A级", originalPrice: 42800, status: "completed", deviationRate: 5.2, alertLevel: "high" },
  { id: 8, orderNo: "RS202606080034", inspector: "赵文博", originalGrade: "B级", originalPrice: 18500, status: "completed", deviationRate: 0.8, alertLevel: "none" },
];

const alertStyle = (level: string) => {
  switch (level) {
    case "high": return { label: "高预警", cls: "bg-coral-500/15 text-coral-400 ring-coral-500/40 animate-pulse-slow" };
    case "medium": return { label: "中预警", cls: "bg-amberLux-500/15 text-amberLux-500 ring-amberLux-500/40" };
    case "low": return { label: "低预警", cls: "bg-gold-500/15 text-gold-400 ring-gold-500/30" };
    default: return { label: "正常", cls: "bg-jade-500/15 text-jade-400 ring-jade-500/30" };
  }
};

const statusStyle = (s: string) => {
  if (s === "pending") return { label: "待复检", cls: "text-amberLux-500 bg-amberLux-500/10" };
  if (s === "processing") return { label: "复检中", cls: "text-gold-400 bg-gold-500/10" };
  return { label: "已完成", cls: "text-jade-400 bg-jade-500/10" };
};

export default function QualityInspectionPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);

  const openRecheckModal = (task: InspectionTask) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
        >
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
            <ShieldAlert className="h-5 w-5 text-coral-400" />
            整体偏差率预警
          </h2>
          <p className="mb-2 text-xs text-ink-400">阈值：3%黄色预警 · 5%红色报警</p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] mb-2">
            <span className="flex items-center gap-1 text-ink-300">
              <span className="h-2 w-8 rounded-full bg-jade-500" /> 安全区 0-3%
            </span>
            <span className="flex items-center gap-1 text-ink-300">
              <span className="h-2 w-8 rounded-full bg-gold-500" /> 预警区 3-5%
            </span>
            <span className="flex items-center gap-1 text-ink-300">
              <span className="h-2 w-8 rounded-full bg-coral-500" /> 报警区 {'>'}5%
            </span>
          </div>
          <ReactECharts option={gaugeOption} style={{ height: 260 }} notMerge lazyUpdate />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-3"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <ClipboardList className="h-5 w-5 text-gold-500" />
              待处理飞检任务
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "待复检总数", value: 24, color: "text-amberLux-500", bg: "bg-amberLux-500/10" },
              { label: "高风险预警", value: 3, color: "text-coral-400", bg: "bg-coral-500/10" },
              { label: "本周已复检", value: 58, color: "text-forest-400", bg: "bg-forest-500/10" },
              { label: "飞检覆盖率", value: 15, suffix: "%", color: "text-gold-400", bg: "bg-gold-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`rounded-xl border border-white/[0.06] ${stat.bg} p-4`}
              >
                <p className="text-xs text-ink-400">{stat.label}</p>
                <p className={`mt-2 font-display text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                  <span className="text-lg font-normal ml-0.5">{stat.suffix ?? ""}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-xs font-bold text-ink-950 shadow-gold-sm hover:from-gold-400 hover:to-gold-500 transition-all">
              <ShieldAlert className="h-4 w-4" />
              批量随机飞检（10%）
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2">
              <Calendar className="h-4 w-4 text-ink-400" />
              <span className="text-xs text-ink-200">近7天</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2">
              <SlidersHorizontal className="h-4 w-4 text-ink-400" />
              <select className="bg-transparent text-xs text-ink-200 outline-none">
                <option>全部偏差率</option>
                <option>高风险 {'>'}5%</option>
                <option>中风险 3-5%</option>
                <option>低风险 {'<'}3%</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 w-full sm:w-64">
            <Search className="h-4 w-4 text-ink-400" />
            <input placeholder="搜索订单号/检测师..." className="flex-1 bg-transparent text-xs text-ink-100 placeholder-ink-500 outline-none" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-850 text-ink-300 text-xs">
                <th className="px-4 py-3 text-left font-semibold">订单号</th>
                <th className="px-4 py-3 text-left font-semibold">原检测师</th>
                <th className="px-4 py-3 text-center font-semibold">原成色</th>
                <th className="px-4 py-3 text-right font-semibold">原估价</th>
                <th className="px-4 py-3 text-center font-semibold">复检状态</th>
                <th className="px-4 py-3 text-center font-semibold">偏差率</th>
                <th className="px-4 py-3 text-center font-semibold">预警级别</th>
                <th className="px-4 py-3 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockTasks.map((task, i) => {
                const alert = alertStyle(task.alertLevel);
                const status = statusStyle(task.status);
                return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    className="border-t border-white/[0.04] hover:bg-gold-500/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gold-400">{task.orderNo}</td>
                    <td className="px-4 py-3 font-medium text-ink-200">{task.inspector}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-md bg-gold-500/15 px-2 py-0.5 text-xs font-bold text-gold-400 ring-1 ring-gold-500/30">
                        {task.originalGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-semibold text-ink-100">
                      ¥{(task.originalPrice / 10000).toFixed(1)}万
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {task.deviationRate > 0 ? (
                        <span className={`font-display font-bold ${
                          task.deviationRate > 5 ? "text-coral-400" :
                          task.deviationRate > 3 ? "text-amberLux-500" : "text-jade-400"
                        }`}>
                          {task.deviationRate}%
                        </span>
                      ) : (
                        <span className="text-ink-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold ring-1 ${alert.cls}`}>
                        {task.alertLevel === "high" && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {alert.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openRecheckModal(task)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-forest-500/15 px-3 py-1.5 text-xs font-semibold text-forest-400 ring-1 ring-forest-500/30 hover:bg-forest-500/25 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        录入结果
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-gold-500/20 bg-ink-900 p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink-100">
                  <FileCheck className="h-5 w-5 text-gold-500" />
                  录入复检结果
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5 rounded-xl border border-gold-500/15 bg-ink-850 p-4">
                <p className="text-[10px] font-semibold text-gold-500 tracking-wider">{selectedTask.orderNo}</p>
                <p className="mt-1 text-sm font-medium text-ink-100">原检测师：{selectedTask.inspector}</p>
                <div className="mt-2 flex gap-4 text-xs text-ink-400">
                  <span>原成色：<span className="font-semibold text-gold-400">{selectedTask.originalGrade}</span></span>
                  <span>原估价：<span className="font-semibold text-ink-100">¥{selectedTask.originalPrice.toLocaleString()}</span></span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">复检成色等级</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["S级", "A级", "B级", "C级"].map((g, i) => (
                      <button
                        key={g}
                        className={`rounded-lg border py-2 text-sm font-bold transition-all ${
                          i === 1
                            ? "border-gold-500/50 bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/40"
                            : "border-white/[0.08] bg-ink-850 text-ink-400 hover:border-gold-500/30 hover:text-gold-400"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">复检估价（元）</label>
                  <input
                    defaultValue={Math.round(selectedTask.originalPrice * 0.94)}
                    className="w-full rounded-xl border border-white/[0.08] bg-ink-850 px-4 py-2.5 text-sm text-ink-100 outline-none focus:border-gold-500/40 font-display font-semibold"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">偏差原因说明</label>
                  <textarea
                    rows={3}
                    defaultValue="边角磨损程度较原评估严重，底部有轻微划痕未标注"
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-ink-850 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500/40"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-ink-850 py-2.5 text-sm font-medium text-ink-200 hover:border-gold-500/30 hover:text-gold-500 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-forest-500 to-forest-600 py-2.5 text-sm font-bold text-ink-100 shadow-gold-sm hover:from-forest-400 hover:to-forest-500 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    确认提交
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
