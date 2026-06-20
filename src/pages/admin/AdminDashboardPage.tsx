import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { Package, TrendingUp, CircleDollarSign, Users, Trophy } from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";

const trendOption = {
  backgroundColor: "transparent",
  grid: { top: 40, right: 20, bottom: 30, left: 50 },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(15, 15, 24, 0.95)",
    borderColor: "rgba(201, 169, 98, 0.3)",
    textStyle: { color: "#D7D7E0" },
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["06-08", "06-09", "06-10", "06-11", "06-12", "06-13", "06-14", "06-15", "06-16", "06-17", "06-18", "06-19"],
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
      name: "订单量",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { color: "#C9A962", width: 3, shadowColor: "rgba(201, 169, 98, 0.5)", shadowBlur: 8 },
      itemStyle: { color: "#C9A962", borderColor: "#0A0A0F", borderWidth: 2 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(201, 169, 98, 0.35)" },
            { offset: 1, color: "rgba(201, 169, 98, 0.01)" },
          ],
        },
      },
      data: [58, 72, 85, 102, 93, 118, 135, 126, 148, 165, 142, 178],
    },
    {
      name: "完成回收",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 5,
      lineStyle: { color: "#2BA179", width: 2.5 },
      itemStyle: { color: "#2BA179", borderColor: "#0A0A0F", borderWidth: 2 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(43, 161, 121, 0.25)" },
            { offset: 1, color: "rgba(43, 161, 121, 0.01)" },
          ],
        },
      },
      data: [42, 58, 67, 80, 75, 96, 110, 102, 124, 138, 118, 152],
    },
  ],
  legend: {
    show: true,
    top: 0,
    right: 0,
    textStyle: { color: "#86869B", fontSize: 11 },
    itemWidth: 12,
    itemHeight: 2,
  },
};

const cityHeatData = [
  ["上海", 328, 94, 2856],
  ["北京", 276, 91, 2512],
  ["深圳", 214, 88, 2034],
  ["广州", 189, 86, 1786],
  ["杭州", 156, 92, 1542],
  ["成都", 138, 84, 1298],
  ["南京", 112, 90, 1056],
  ["武汉", 98, 85, 896],
  ["苏州", 87, 89, 812],
  ["重庆", 76, 82, 728],
];

const getHeatColor = (val: number, max: number) => {
  const ratio = val / max;
  if (ratio > 0.8) return "bg-gold-500/30 text-gold-400 ring-gold-500/40";
  if (ratio > 0.6) return "bg-forest-500/25 text-forest-400 ring-forest-500/35";
  if (ratio > 0.4) return "bg-jade-500/20 text-jade-400 ring-jade-500/30";
  if (ratio > 0.2) return "bg-ink-700/60 text-ink-300 ring-ink-600/50";
  return "bg-ink-800/40 text-ink-400 ring-ink-700/30";
};

const topOrders = [
  { id: 1, no: "RS202606150001", product: "Hermès Birkin 30 Epsom", price: 128000, city: "上海", inspector: "王建国" },
  { id: 2, no: "RS202606140018", product: "Rolex Daytona 116500LN", price: 268000, city: "北京", inspector: "李明辉" },
  { id: 3, no: "RS202606130007", product: "Patek Philippe Nautilus 5711", price: 688000, city: "深圳", inspector: "张伟德" },
  { id: 4, no: "RS202606120023", product: "Chanel Classic Flap Jumbo", price: 96000, city: "杭州", inspector: "陈小雅" },
  { id: 5, no: "RS202606110031", product: "LV Capucines MM", price: 58500, city: "上海", inspector: "刘志强" },
  { id: 6, no: "RS202606100015", product: "Cartier Santos Large", price: 42800, city: "广州", inspector: "赵文博" },
  { id: 7, no: "RS202606090009", product: "Dior Lady Dior Medium", price: 38500, city: "成都", inspector: "孙美玲" },
  { id: 8, no: "RS202606080027", product: "AP Royal Oak 15500ST", price: 328000, city: "北京", inspector: "李明辉" },
  { id: 9, no: "RS202606070012", product: "Gucci Dionysus Medium", price: 18800, city: "南京", inspector: "周晓燕" },
  { id: 10, no: "RS202606060034", product: "Prada Galleria Medium", price: 22600, city: "武汉", inspector: "吴建军" },
];

const inspectorRanking = [
  { rank: 1, name: "张伟德", orders: 58, accuracy: 99.2, score: 98, city: "深圳" },
  { rank: 2, name: "李明辉", orders: 52, accuracy: 98.8, score: 96, city: "北京" },
  { rank: 3, name: "王建国", orders: 49, accuracy: 98.5, score: 95, city: "上海" },
  { rank: 4, name: "陈小雅", orders: 45, accuracy: 97.9, score: 93, city: "杭州" },
  { rank: 5, name: "刘志强", orders: 42, accuracy: 97.6, score: 91, city: "上海" },
];

const pieOption = {
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
    right: 10,
    top: "center",
    textStyle: { color: "#86869B", fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: "pie",
      radius: ["45%", "72%"],
      center: ["35%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: "#0A0A0F",
        borderWidth: 3,
        borderRadius: 4,
      },
      label: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 6,
        itemStyle: { shadowBlur: 16, shadowColor: "rgba(201, 169, 98, 0.4)" },
      },
      data: [
        { value: 428, name: "腕表", itemStyle: { color: "#C9A962" } },
        { value: 356, name: "箱包", itemStyle: { color: "#2BA179" } },
        { value: 218, name: "珠宝", itemStyle: { color: "#E74C3C" } },
        { value: 142, name: "配饰", itemStyle: { color: "#F39C12" } },
        { value: 87, name: "鞋履", itemStyle: { color: "#4FC498" } },
        { value: 53, name: "其他", itemStyle: { color: "#5A5A6E" } },
      ],
    },
  ],
};

const rankBadgeColor = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-gold-sm";
  if (rank === 2) return "bg-gradient-to-br from-ink-300 to-ink-400 text-ink-950";
  if (rank === 3) return "bg-gradient-to-br from-amberLux-500 to-amberLux-400 text-ink-950";
  return "bg-ink-700 text-ink-300";
};

export default function AdminDashboardPage() {
  const maxOrders = Math.max(...cityHeatData.map((c) => c[1] as number));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          title="今日新增订单"
          value={178}
          icon={Package}
          trend={12.5}
          trendLabel="较昨日"
          gradientFrom="from-ink-850"
          gradientTo="to-forest-900/60"
        />
        <KpiCard
          title="今日完成回收"
          value={152}
          icon={TrendingUp}
          trend={8.3}
          trendLabel="较昨日"
          gradientFrom="from-ink-850"
          gradientTo="to-forest-800/50"
        />
        <KpiCard
          title="今日交易额"
          value={2856780}
          prefix="¥"
          icon={CircleDollarSign}
          trend={15.7}
          trendLabel="较昨日"
          gradientFrom="from-ink-850"
          gradientTo="to-gold-900/40"
        />
        <KpiCard
          title="今日新增用户"
          value={428}
          icon={Users}
          trend={-3.2}
          trendLabel="较昨日"
          gradientFrom="from-ink-850"
          gradientTo="to-coral-500/10"
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-100">订单量趋势</h2>
            <div className="flex gap-1 rounded-xl bg-ink-850 p-1 text-xs">
              {["今日", "本周", "本月"].map((t, i) => (
                <button
                  key={t}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    i === 1
                      ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30"
                      : "text-ink-400 hover:text-ink-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ReactECharts option={trendOption} style={{ height: 320 }} notMerge lazyUpdate />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
        >
          <h2 className="mb-4 font-display text-lg font-bold text-ink-100">城市服务热力</h2>
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ink-850 text-ink-300">
                  <th className="px-3 py-2 text-left font-semibold">城市</th>
                  <th className="px-3 py-2 text-center font-semibold">订单量</th>
                  <th className="px-3 py-2 text-center font-semibold">响应率</th>
                  <th className="px-3 py-2 text-right font-semibold">月交易额(万)</th>
                </tr>
              </thead>
              <tbody>
                {cityHeatData.map(([city, orders, rate, amount], i) => (
                  <motion.tr
                    key={city as string}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.03 }}
                    className="border-t border-white/[0.04]"
                  >
                    <td className="px-3 py-2.5 font-medium text-ink-100">{city}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${getHeatColor(
                          orders as number,
                          maxOrders
                        )}`}
                      >
                        {orders}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-jade-400 font-medium">{rate}%</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gold-400">
                      {((amount as number) / 100).toFixed(1)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-100">高价值订单TOP10</h2>
            <Trophy className="h-5 w-5 text-gold-500" />
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {topOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 + i * 0.03 }}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-ink-850/60 p-3 transition-all hover:border-gold-500/30 hover:bg-ink-850"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                    i < 3 ? "bg-gold-500/15 text-gold-400" : "bg-ink-800 text-ink-400"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-100">{order.product}</p>
                  <p className="mt-0.5 truncate text-[10px] text-ink-500">
                    {order.no} · {order.city} · {order.inspector}
                  </p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="font-display text-sm font-bold gold-text">
                    ¥{(order.price / 10000).toFixed(1)}万
                  </span>
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-100">检测师绩效榜</h2>
            <Users className="h-5 w-5 text-forest-400" />
          </div>
          <div className="space-y-3">
            {inspectorRanking.map((ins, i) => (
              <motion.div
                key={ins.rank}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.27 + i * 0.05 }}
                className="rounded-xl border border-white/[0.04] bg-ink-850/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankBadgeColor(
                      ins.rank
                    )}`}
                  >
                    {ins.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink-100">{ins.name}</p>
                      <span className="text-[10px] text-ink-500">{ins.city}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ins.score}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-forest-400 to-gold-400"
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-ink-400">
                      <span>鉴定 {ins.orders} 单</span>
                      <span className="text-jade-400">准确率 {ins.accuracy}%</span>
                    </div>
                  </div>
                </div>
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
          <h2 className="mb-4 font-display text-lg font-bold text-ink-100">品类回收占比</h2>
          <ReactECharts option={pieOption} style={{ height: 300 }} notMerge lazyUpdate />
        </motion.div>
      </div>
    </div>
  );
}
