import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  Leaf,
  Trees,
  Recycle,
  Zap,
  Medal,
  FilePlus2,
  Trophy,
  Crown,
  Award,
} from "lucide-react";

const monthlyBarOption = {
  backgroundColor: "transparent",
  grid: { top: 40, right: 30, bottom: 30, left: 55 },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(15, 15, 24, 0.95)",
    borderColor: "rgba(201, 169, 98, 0.3)",
    textStyle: { color: "#D7D7E0" },
    axisPointer: { type: "cross", lineStyle: { color: "rgba(201,169,98,0.3)" } },
  },
  xAxis: {
    type: "category",
    data: ["1月", "2月", "3月", "4月", "5月", "6月"],
    axisLine: { lineStyle: { color: "rgba(93, 93, 110, 0.4)" } },
    axisLabel: { color: "#86869B", fontSize: 11 },
    axisTick: { show: false },
  },
  yAxis: [
    {
      type: "value",
      name: "碳减排(t)",
      nameTextStyle: { color: "#86869B", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(93, 93, 110, 0.15)" } },
      axisLabel: { color: "#86869B", fontSize: 11 },
    },
  ],
  series: [
    {
      name: "月度碳减排",
      type: "bar",
      barWidth: 26,
      data: [45.2, 52.8, 68.4, 75.6, 89.2, 102.8],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#2BA179" },
            { offset: 1, color: "rgba(43, 161, 121, 0.15)" },
          ],
        },
      },
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: "rgba(43, 161, 121, 0.5)" } },
    },
    {
      name: "累计趋势",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { color: "#C9A962", width: 3, shadowColor: "rgba(201,169,98,0.4)", shadowBlur: 8 },
      itemStyle: { color: "#C9A962", borderColor: "#0A0A0F", borderWidth: 2 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(201, 169, 98, 0.25)" },
            { offset: 1, color: "rgba(201, 169, 98, 0.01)" },
          ],
        },
      },
      data: [45.2, 98, 166.4, 242, 331.2, 434],
    },
  ],
  legend: {
    show: true,
    top: 0,
    right: 0,
    textStyle: { color: "#86869B", fontSize: 11 },
    itemWidth: 12,
    itemHeight: 6,
  },
};

const roseOption = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(15, 15, 24, 0.95)",
    borderColor: "rgba(201, 169, 98, 0.3)",
    textStyle: { color: "#D7D7E0" },
    formatter: "{b}\n减排占比: {d}%",
  },
  legend: {
    orient: "vertical",
    right: 10,
    top: "center",
    textStyle: { color: "#86869B", fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: "pie",
      radius: ["15%", "72%"],
      center: ["35%", "50%"],
      roseType: "area",
      itemStyle: {
        borderColor: "#0A0A0F",
        borderWidth: 3,
        borderRadius: 6,
      },
      label: {
        show: true,
        formatter: "{c}t",
        color: "#D7D7E0",
        fontSize: 10,
        fontWeight: "bold",
      },
      labelLine: { lineStyle: { color: "rgba(201,169,98,0.4)" } },
      data: [
        { value: 156, name: "奢侈品箱包", itemStyle: { color: "#C9A962" } },
        { value: 128, name: "高端腕表", itemStyle: { color: "#2BA179" } },
        { value: 68, name: "珠宝首饰", itemStyle: { color: "#E74C3C" } },
        { value: 48, name: "设计师服装", itemStyle: { color: "#F39C12" } },
        { value: 24, name: "配饰鞋履", itemStyle: { color: "#4FC498" } },
        { value: 10, name: "其他品类", itemStyle: { color: "#5A5A6E" } },
      ],
    },
  ],
};

const ecoRanking = [
  { rank: 1, name: "陈*瑜", items: 28, carbon: 2348, avatar: "C" },
  { rank: 2, name: "李*明", items: 24, carbon: 2156, avatar: "L" },
  { rank: 3, name: "王*华", items: 22, carbon: 1980, avatar: "W" },
  { rank: 4, name: "张*宇", items: 20, carbon: 1842, avatar: "Z" },
  { rank: 5, name: "刘*雯", items: 19, carbon: 1680, avatar: "L" },
  { rank: 6, name: "赵*琪", items: 17, carbon: 1528, avatar: "Z" },
  { rank: 7, name: "孙*丽", items: 16, carbon: 1420, avatar: "S" },
  { rank: 8, name: "周*伟", items: 15, carbon: 1352, avatar: "Z" },
  { rank: 9, name: "吴*婷", items: 14, carbon: 1248, avatar: "W" },
  { rank: 10, name: "郑*峰", items: 13, carbon: 1156, avatar: "Z" },
];

const rankIcon = (r: number) => {
  if (r === 1) return <Crown className="h-4 w-4 text-gold-500 fill-gold-500" />;
  if (r === 2) return <Trophy className="h-4 w-4 text-ink-300 fill-ink-300" />;
  if (r === 3) return <Award className="h-4 w-4 text-amberLux-500 fill-amberLux-500" />;
  return <span className="text-xs font-bold text-ink-500">{r}</span>;
};

export default function EcoMetricsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-forest-500/20 bg-gradient-to-br from-forest-900/60 via-ink-900 to-gold-900/30 p-8"
      >
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-forest-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />

        <div className="relative mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1">
            <Leaf className="h-4 w-4 text-gold-500" />
            <span className="text-xs font-semibold text-gold-400">可持续发展数据中心</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-100">环保贡献大屏</h1>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "累计节省碳排放量", value: 434.5, suffix: "吨", icon: Leaf, color: "text-forest-400", glow: "from-forest-500/40" },
            { label: "等效植树棵树", value: 24138, suffix: "棵", icon: Trees, color: "text-jade-400", glow: "from-jade-500/30" },
            { label: "累计回收件数", value: 12846, suffix: "件", icon: Recycle, color: "text-gold-400", glow: "from-gold-500/30" },
            { label: "累计节省电量", value: 182.3, suffix: "万度", icon: Zap, color: "text-amberLux-500", glow: "from-amberLux-500/30" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/70 p-5 backdrop-blur-sm"
              >
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.glow} to-transparent blur-2xl`} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-400">{stat.label}</p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800/60 ring-1 ring-white/[0.06]">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`font-display text-4xl font-bold tracking-tight ${stat.color}`}
                    >
                      {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                    </motion.span>
                    <span className="text-sm font-medium text-ink-400">{stat.suffix}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-3"
        >
          <h2 className="mb-4 font-display text-lg font-bold text-ink-100">月度碳减排趋势</h2>
          <ReactECharts option={monthlyBarOption} style={{ height: 320 }} notMerge lazyUpdate />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
        >
          <h2 className="mb-4 font-display text-lg font-bold text-ink-100">品类减排占比</h2>
          <ReactECharts option={roseOption} style={{ height: 320 }} notMerge lazyUpdate />
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <Medal className="h-5 w-5 text-gold-500" />
              月度环保贡献榜单 TOP10
            </h2>
            <span className="text-xs text-ink-400">2026年6月</span>
          </div>

          <div className="space-y-2">
            {ecoRanking.map((u, i) => (
              <motion.div
                key={u.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`flex items-center gap-4 rounded-xl p-3 transition-all ${
                  i < 3
                    ? "bg-gradient-to-r from-gold-500/[0.08] to-transparent border border-gold-500/20"
                    : "hover:bg-ink-850/60"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {rankIcon(u.rank)}
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ring-2 ${
                    i < 3
                      ? "bg-gradient-to-br from-gold-500 to-gold-700 text-ink-950 ring-gold-500/30"
                      : "bg-ink-800 text-ink-300 ring-white/[0.06]"
                  }`}
                >
                  {u.avatar}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-100">{u.name}</p>
                  <p className="text-xs text-ink-500">回收 {u.items} 件 · 减碳 {u.carbon} kg</p>
                </div>

                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-800 sm:w-32">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(u.carbon / 2348) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
                    className={`h-full rounded-full ${
                      i === 0
                        ? "bg-gradient-to-r from-gold-400 to-gold-600"
                        : i === 1
                        ? "bg-gradient-to-r from-ink-300 to-ink-400"
                        : i === 2
                        ? "bg-gradient-to-r from-amberLux-400 to-amberLux-500"
                        : "bg-gradient-to-r from-forest-400 to-forest-500"
                    }`}
                  />
                </div>

                <p className="hidden w-20 text-right font-display text-sm font-bold text-forest-400 sm:block">
                  {(u.carbon / 1000).toFixed(2)}t
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
        >
          <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
            <FilePlus2 className="h-5 w-5 text-forest-400" />
            证书批量生成
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-ink-850/60 p-4">
              <p className="text-xs text-ink-400">待生成证书订单</p>
              <p className="mt-1 font-display text-2xl font-bold gold-text">1,248 张</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">生成范围</label>
              <select className="w-full rounded-xl border border-white/[0.08] bg-ink-850 px-4 py-2.5 text-sm text-ink-100 outline-none focus:border-gold-500/40">
                <option>全部已完成订单</option>
                <option>仅高价值订单（{'>'}5万）</option>
                <option>指定日期范围</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">证书样式</label>
              <div className="grid grid-cols-3 gap-2">
                {["经典款", "环保款", "尊享款"].map((s, i) => (
                  <button
                    key={s}
                    className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                      i === 0
                        ? "border-gold-500/50 bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/40"
                        : "border-white/[0.08] bg-ink-850 text-ink-400 hover:border-gold-500/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-300">
                <span>含防伪二维码</span>
                <span className="inline-flex h-5 w-9 items-center rounded-full bg-forest-500 p-0.5">
                  <span className="ml-auto h-4 w-4 rounded-full bg-ink-900" />
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="flex-1 rounded-xl border border-white/[0.08] bg-ink-850 py-2.5 text-sm font-medium text-ink-200 hover:border-gold-500/30 hover:text-gold-500 transition-colors">
                预览样式
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-forest-500 to-forest-600 py-2.5 text-sm font-bold text-ink-100 shadow-gold-sm hover:from-forest-400 hover:to-forest-500 transition-all">
                <FilePlus2 className="h-4 w-4" />
                批量生成
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
