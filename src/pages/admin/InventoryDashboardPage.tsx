import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { Package, Calendar, Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";

const donutOption = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(15, 15, 24, 0.95)",
    borderColor: "rgba(201, 169, 98, 0.3)",
    textStyle: { color: "#D7D7E0" },
    formatter: "{b}: {c}件 ({d}%)",
  },
  legend: {
    orient: "vertical",
    right: 0,
    top: "center",
    textStyle: { color: "#86869B", fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: "pie",
      radius: ["52%", "78%"],
      center: ["38%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: "#0A0A0F",
        borderWidth: 4,
        borderRadius: 6,
      },
      label: {
        show: true,
        position: "center",
        formatter: "{a|总在库}\n{b|384件}",
        rich: {
          a: { color: "#86869B", fontSize: 12, lineHeight: 22 },
          b: { color: "#C9A962", fontSize: 22, fontWeight: "bold", fontFamily: "Playfair Display" },
        },
      },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 6 },
      data: [
        { value: 142, name: "0-7天", itemStyle: { color: "#2BA179" } },
        { value: 98, name: "8-15天", itemStyle: { color: "#1DB954" } },
        { value: 68, name: "16-30天", itemStyle: { color: "#C9A962" } },
        { value: 48, name: "31-60天", itemStyle: { color: "#F39C12" } },
        { value: 28, name: ">60天", itemStyle: { color: "#E74C3C" } },
      ],
    },
  ],
};

const barOption = {
  backgroundColor: "transparent",
  grid: { top: 30, right: 20, bottom: 30, left: 50 },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(15, 15, 24, 0.95)",
    borderColor: "rgba(201, 169, 98, 0.3)",
    textStyle: { color: "#D7D7E0" },
    axisPointer: { type: "shadow" },
  },
  xAxis: {
    type: "category",
    data: ["1月", "2月", "3月", "4月", "5月", "6月"],
    axisLine: { lineStyle: { color: "rgba(93, 93, 110, 0.4)" } },
    axisLabel: { color: "#86869B", fontSize: 11 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: "rgba(93, 93, 110, 0.15)" } },
    axisLabel: { color: "#86869B", fontSize: 11 },
  },
  series: [
    {
      name: "拍卖渠道",
      type: "bar",
      stack: "total",
      barWidth: 22,
      itemStyle: { color: "#C9A962", borderRadius: [0, 0, 0, 0] },
      data: [18, 24, 32, 28, 38, 42],
    },
    {
      name: "翻新出售",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#2BA179" },
      data: [32, 38, 42, 48, 52, 58],
    },
    {
      name: "二手直售",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#4FC498" },
      data: [28, 32, 36, 42, 48, 52],
    },
    {
      name: "环保拆解",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#E74C3C", borderRadius: [4, 4, 0, 0] },
      data: [8, 12, 10, 14, 18, 16],
    },
  ],
  legend: {
    show: true,
    top: 0,
    right: 0,
    textStyle: { color: "#86869B", fontSize: 10 },
    itemWidth: 10,
    itemHeight: 8,
  },
};

const stagnantProducts = [
  { id: 1, name: "Chanel GST Grand Shopping Tote", brand: "Chanel", days: 98, cost: 28500, suggestion: "降价促销" },
  { id: 2, name: "Gucci Soho Disco Bag", brand: "Gucci", days: 76, cost: 8800, suggestion: "线下寄卖" },
  { id: 3, name: "Coach Swagger 27", brand: "Coach", days: 68, cost: 3200, suggestion: "环保拆解" },
  { id: 4, name: "Longchamp Le Pliage L", brand: "Longchamp", days: 62, cost: 1200, suggestion: "降价促销" },
  { id: 5, name: "MK Michael Kors Selma", brand: "Michael Kors", days: 54, cost: 2800, suggestion: "捆绑销售" },
  { id: 6, name: "Tory Burch Miller Crossbody", brand: "Tory Burch", days: 48, cost: 3500, suggestion: "常规周转" },
  { id: 7, name: "MCM Stark Backpack", brand: "MCM", days: 45, cost: 5200, suggestion: "常规周转" },
];

const suggestionColor = (s: string) => {
  if (s.includes("降价") || s.includes("拆解")) return "text-coral-400 bg-coral-500/10 ring-coral-500/30";
  if (s.includes("寄卖") || s.includes("捆绑")) return "text-gold-400 bg-gold-500/10 ring-gold-500/30";
  return "text-forest-400 bg-forest-500/10 ring-forest-500/30";
};

export default function InventoryDashboardPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard title="在库总量" value={384} suffix=" 件" icon={Package} trend={5.6} trendLabel="较上周" />
        <KpiCard title="平均在库天数" value={18} suffix=" 天" icon={Calendar} trend={-8.2} trendLabel="持续优化" />
        <KpiCard title="翻新率" value={72} suffix=" %" icon={Sparkles} trend={3.1} trendLabel="较上月" />
        <KpiCard title="本月毛利" value={867} suffix="K" prefix="¥" icon={TrendingUp} trend={12.4} trendLabel="同比增长" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
        >
          <h2 className="mb-4 font-display text-lg font-bold text-ink-100">在库年龄分布</h2>
          <ReactECharts option={donutOption} style={{ height: 280 }} notMerge lazyUpdate />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-3"
        >
          <h2 className="mb-4 font-display text-lg font-bold text-ink-100">处置渠道月度分布</h2>
          <ReactECharts option={barOption} style={{ height: 280 }} notMerge lazyUpdate />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <AlertTriangle className="h-5 w-5 text-coral-400" />
              滞销商品预警
            </h2>
            <p className="mt-1 text-xs text-ink-400">超30天未售出商品 · 红色高亮为超60天高风险</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 text-xs font-medium text-ink-300 hover:border-gold-500/30 hover:text-gold-500 transition-colors">
              <ArrowDownRight className="h-3.5 w-3.5" />
              导出报表
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-coral-500/20 to-coral-600/20 px-3 py-2 text-xs font-semibold text-coral-400 ring-1 ring-coral-500/30 hover:from-coral-500 hover:to-coral-600 hover:text-white transition-all">
              <ArrowUpRight className="h-3.5 w-3.5" />
              批量处置
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-850 text-ink-300 text-xs">
                <th className="px-4 py-3 text-left font-semibold">商品</th>
                <th className="px-4 py-3 text-left font-semibold">品牌</th>
                <th className="px-4 py-3 text-center font-semibold">在库天数</th>
                <th className="px-4 py-3 text-right font-semibold">库存成本</th>
                <th className="px-4 py-3 text-right font-semibold">建议处置方式</th>
              </tr>
            </thead>
            <tbody>
              {stagnantProducts.map((p, i) => {
                const highRisk = p.days > 60;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className={`border-t border-white/[0.04] transition-colors ${
                      highRisk ? "bg-coral-500/[0.04] hover:bg-coral-500/[0.08]" : "hover:bg-gold-500/[0.04]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            highRisk ? "bg-coral-500/15" : "bg-ink-800"
                          }`}
                        >
                          <Package
                            className={`h-4 w-4 ${highRisk ? "text-coral-400" : "text-ink-400"}`}
                          />
                        </div>
                        <span
                          className={`font-medium ${highRisk ? "text-coral-300" : "text-ink-100"}`}
                        >
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-300 font-medium">{p.brand}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${
                          highRisk
                            ? "bg-coral-500/20 text-coral-400 ring-coral-500/40"
                            : p.days > 45
                            ? "bg-amberLux-500/20 text-amberLux-500 ring-amberLux-500/40"
                            : "bg-gold-500/15 text-gold-400 ring-gold-500/30"
                        }`}
                      >
                        {p.days} 天
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gold-400 font-display">
                      ¥{p.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${suggestionColor(
                          p.suggestion
                        )}`}
                      >
                        {p.suggestion}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
