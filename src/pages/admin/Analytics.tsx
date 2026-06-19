import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { Users, Shirt, BookOpen, Smartphone, Scale, Wallet, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockAnalytics } from "@/data/mockData";

type TabKey = "user" | "category" | "operation";

const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "user", label: "用户分析", icon: Users },
  { key: "category", label: "品类分析", icon: Shirt },
  { key: "operation", label: "运营分析", icon: BarChart3 },
];

const greenGradient = (opacity = 1) => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(16, 185, 129, ${opacity})` },
    { offset: 1, color: `rgba(16, 185, 129, 0.1)` },
  ],
});

const tealGradient = (opacity = 1) => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(20, 184, 166, ${opacity})` },
    { offset: 1, color: `rgba(20, 184, 166, 0.1)` },
  ],
});

const cyanGradient = (opacity = 1) => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(6, 182, 212, ${opacity})` },
    { offset: 1, color: `rgba(6, 182, 212, 0.1)` },
  ],
});

const emeraldGradient = (opacity = 1) => ({
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(52, 211, 153, ${opacity})` },
    { offset: 1, color: `rgba(52, 211, 153, 0.1)` },
  ],
});

const commonAxisStyle = {
  axisLine: { lineStyle: { color: "#E5E7EB" } },
  axisLabel: { color: "#6B7280", fontSize: 12 },
  splitLine: { lineStyle: { color: "#F3F4F6", type: "dashed" } },
};

const userFrequencyOption = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 50, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: "category",
    data: mockAnalytics.userFrequency.map((f) => f.range),
    ...commonAxisStyle,
  },
  yAxis: { type: "value", ...commonAxisStyle },
  series: [
    {
      type: "bar",
      data: mockAnalytics.userFrequency.map((f) => f.count),
      barWidth: "50%",
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: greenGradient(0.8),
      },
      emphasis: { itemStyle: { color: greenGradient(1) } },
    },
  ],
};

const userActivityOption = {
  tooltip: { trigger: "axis" },
  legend: { data: ["订单数", "回收量(kg)"], top: 0, textStyle: { color: "#6B7280" } },
  grid: { left: 50, right: 50, top: 40, bottom: 30 },
  xAxis: {
    type: "category",
    data: mockAnalytics.orderTrend.map((o) => o.date.slice(5)),
    boundaryGap: false,
    ...commonAxisStyle,
  },
  yAxis: [
    { type: "value", name: "订单数", ...commonAxisStyle },
    { type: "value", name: "kg", ...commonAxisStyle },
  ],
  series: [
    {
      name: "订单数",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      data: mockAnalytics.orderTrend.map((o) => o.count),
      lineStyle: { width: 3, color: "#10B981" },
      itemStyle: { color: "#10B981" },
      areaStyle: { color: greenGradient() },
    },
    {
      name: "回收量(kg)",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      yAxisIndex: 1,
      data: mockAnalytics.orderTrend.map((o) => o.kg),
      lineStyle: { width: 3, color: "#14B8A6" },
      itemStyle: { color: "#14B8A6" },
      areaStyle: { color: tealGradient() },
    },
  ],
};

const userRepurchaseOption = {
  tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
  legend: { orient: "vertical", right: 10, top: "center", textStyle: { color: "#6B7280" } },
  series: [
    {
      type: "pie",
      radius: ["45%", "70%"],
      center: ["35%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: "bold" },
      },
      data: [
        { value: 160, name: "复购用户(10次+)", itemStyle: { color: "#10B981" } },
        { value: 356, name: "活跃用户(6-10次)", itemStyle: { color: "#14B8A6" } },
        { value: 1120, name: "普通用户(2-5次)", itemStyle: { color: "#06B6D4" } },
        { value: 1820, name: "新用户(首次)", itemStyle: { color: "#34D399" } },
      ],
    },
  ],
};

const categoryVolumeOption = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  legend: { data: ["订单数", "占比(%)"], top: 0, textStyle: { color: "#6B7280" } },
  grid: { left: 50, right: 50, top: 40, bottom: 30 },
  xAxis: {
    type: "category",
    data: mockAnalytics.categoryDistribution.map((c) => c.category),
    ...commonAxisStyle,
  },
  yAxis: [
    { type: "value", name: "订单数", ...commonAxisStyle },
    { type: "value", name: "%", max: 100, ...commonAxisStyle },
  ],
  series: [
    {
      name: "订单数",
      type: "bar",
      data: mockAnalytics.categoryDistribution.map((c) => c.count),
      barWidth: "40%",
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: greenGradient(0.8),
      },
    },
    {
      name: "占比(%)",
      type: "line",
      smooth: true,
      yAxisIndex: 1,
      symbol: "circle",
      symbolSize: 8,
      data: mockAnalytics.categoryDistribution.map((c) => c.percentage),
      lineStyle: { width: 3, color: "#F97316" },
      itemStyle: { color: "#F97316" },
    },
  ],
};

const categoryPriceOption = {
  tooltip: { trigger: "axis" },
  legend: { data: ["衣物均价", "图书均价", "手机均价"], top: 0, textStyle: { color: "#6B7280" } },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: {
    type: "category",
    data: ["1月", "2月", "3月", "4月", "5月", "6月"],
    boundaryGap: false,
    ...commonAxisStyle,
  },
  yAxis: { type: "value", ...commonAxisStyle },
  series: [
    {
      name: "衣物均价",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      data: [2.3, 2.4, 2.5, 2.5, 2.6, 2.7],
      lineStyle: { width: 2.5, color: "#10B981" },
      itemStyle: { color: "#10B981" },
      areaStyle: { color: greenGradient(0.4) },
    },
    {
      name: "图书均价",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      data: [1.0, 1.1, 1.1, 1.2, 1.2, 1.3],
      lineStyle: { width: 2.5, color: "#14B8A6" },
      itemStyle: { color: "#14B8A6" },
      areaStyle: { color: tealGradient(0.4) },
    },
    {
      name: "手机均价",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      data: [1200, 1250, 1320, 1380, 1450, 1520],
      lineStyle: { width: 2.5, color: "#06B6D4" },
      itemStyle: { color: "#06B6D4" },
      areaStyle: { color: cyanGradient(0.4) },
    },
  ],
};

const phoneBrandOption = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 80, right: 30, top: 20, bottom: 30 },
  xAxis: { type: "value", ...commonAxisStyle },
  yAxis: {
    type: "category",
    data: ["魅族", "三星", "荣耀", "vivo", "OPPO", "小米", "华为", "Apple"].reverse(),
    ...commonAxisStyle,
  },
  series: [
    {
      type: "bar",
      data: [45, 89, 156, 234, 278, 356, 489, 623].reverse(),
      barWidth: "60%",
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: (params: { dataIndex: number }) => {
          const colors = ["#34D399", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9", "#06B6D4", "#14B8A6", "#10B981"];
          return colors[params.dataIndex];
        },
      },
      label: {
        show: true,
        position: "right",
        color: "#4B5563",
        fontWeight: 600,
      },
    },
  ],
};

const regionOption = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 60, right: 30, top: 20, bottom: 30 },
  xAxis: { type: "value", ...commonAxisStyle },
  yAxis: {
    type: "category",
    data: mockAnalytics.regionDistribution.map((r) => r.region).reverse(),
    ...commonAxisStyle,
  },
  series: [
    {
      type: "bar",
      data: mockAnalytics.regionDistribution.map((r) => r.count).reverse(),
      barWidth: "60%",
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: (params: { dataIndex: number }) => {
          const colors = ["#34D399", "#6EE7B7", "#10B981", "#14B8A6", "#06B6D4"];
          return colors[params.dataIndex % colors.length];
        },
      },
      label: {
        show: true,
        position: "right",
        color: "#4B5563",
        fontWeight: 600,
      },
    },
  ],
};

const channelOption = {
  tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
  legend: { orient: "vertical", right: 10, top: "center", textStyle: { color: "#6B7280" } },
  series: [
    {
      type: "pie",
      radius: "65%",
      center: ["35%", "50%"],
      roseType: "radius",
      itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: "bold" },
      },
      data: [
        { value: 4820, name: "微信小程序", itemStyle: { color: "#10B981" } },
        { value: 2650, name: "支付宝小程序", itemStyle: { color: "#14B8A6" } },
        { value: 1820, name: "APP", itemStyle: { color: "#06B6D4" } },
        { value: 1280, name: "H5", itemStyle: { color: "#34D399" } },
        { value: 980, name: "线下推广", itemStyle: { color: "#F97316" } },
      ],
    },
  ],
};

const qualityEfficiencyOption = {
  tooltip: { trigger: "axis" },
  legend: { data: ["质检完成数", "平均质检时长(分钟)"], top: 0, textStyle: { color: "#6B7280" } },
  grid: { left: 50, right: 50, top: 40, bottom: 30 },
  xAxis: {
    type: "category",
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    boundaryGap: false,
    ...commonAxisStyle,
  },
  yAxis: [
    { type: "value", name: "件数", ...commonAxisStyle },
    { type: "value", name: "分钟", ...commonAxisStyle },
  ],
  series: [
    {
      name: "质检完成数",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      data: [156, 178, 192, 185, 210, 165, 142],
      lineStyle: { width: 3, color: "#10B981" },
      itemStyle: { color: "#10B981" },
      areaStyle: { color: greenGradient() },
    },
    {
      name: "平均质检时长(分钟)",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      yAxisIndex: 1,
      data: [8.5, 8.2, 7.8, 7.5, 7.2, 8.8, 9.1],
      lineStyle: { width: 3, color: "#F97316" },
      itemStyle: { color: "#F97316" },
    },
  ],
};

const payoutTimingOption = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 50, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: "category",
    data: ["<1小时", "1-2小时", "2-4小时", "4-8小时", "8-24小时", ">24小时"],
    ...commonAxisStyle,
  },
  yAxis: { type: "value", ...commonAxisStyle },
  series: [
    {
      type: "bar",
      data: [2340, 3820, 2650, 1820, 980, 420],
      barWidth: "55%",
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: (params: { dataIndex: number }) => {
          const opacity = [0.95, 0.85, 0.7, 0.55, 0.4, 0.25];
          return {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(16, 185, 129, ${opacity[params.dataIndex]})` },
              { offset: 1, color: `rgba(16, 185, 129, 0.1)` },
            ],
          };
        },
      },
    },
  ],
};

const userStats = [
  { label: "活跃用户", value: mockAnalytics.overview.activeUsers, suffix: "人", icon: Users, color: "from-eco-500 to-eco-600" },
  { label: "累计用户", value: 5280, suffix: "人", icon: Users, color: "from-teal-500 to-emerald-600" },
  { label: "本月新增", value: 856, suffix: "人", icon: TrendingUp, color: "from-cyan-500 to-teal-600" },
  { label: "复购率", value: 31.2, suffix: "%", icon: Wallet, color: "from-emerald-500 to-green-600" },
];

const categoryStats = [
  { label: "衣物回收量", value: 24350, suffix: "kg", icon: Shirt, color: "from-eco-500 to-eco-600" },
  { label: "图书回收量", value: 12560, suffix: "kg", icon: BookOpen, color: "from-teal-500 to-emerald-600" },
  { label: "手机回收量", value: 2026, suffix: "台", icon: Smartphone, color: "from-cyan-500 to-teal-600" },
  { label: "品类均价", value: 97.8, suffix: "元", icon: Scale, color: "from-emerald-500 to-green-600" },
];

const operationStats = [
  { label: "覆盖区域", value: 5, suffix: "个行政区", icon: BarChart3, color: "from-eco-500 to-eco-600" },
  { label: "合作渠道", value: 8, suffix: "个", icon: Users, color: "from-teal-500 to-emerald-600" },
  { label: "质检效率", value: 92.5, suffix: "%", icon: TrendingUp, color: "from-cyan-500 to-teal-600" },
  { label: "24h打款率", value: 88.3, suffix: "%", icon: Wallet, color: "from-emerald-500 to-green-600" },
];

const ChartCard = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("card p-5", className)}>
    <h4 className="font-semibold text-neutral-800 mb-4">{title}</h4>
    {children}
  </div>
);

const StatCard = ({ label, value, suffix, icon: Icon, color }: { label: string; value: number; suffix: string; icon: typeof Users; color: string }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-neutral-800">
          {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value.toLocaleString()}
          <span className="text-base font-normal text-neutral-400 ml-1">{suffix}</span>
        </p>
      </div>
      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabKey>("user");
  const stats = activeTab === "user" ? userStats : activeTab === "category" ? categoryStats : operationStats;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-2 flex items-center gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200",
              activeTab === key
                ? "bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-card"
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {activeTab === "user" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="用户回收频次分布">
            <ReactECharts option={userFrequencyOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="用户活跃度趋势">
            <ReactECharts option={userActivityOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="用户复购率分布" className="lg:col-span-2">
            <ReactECharts option={userRepurchaseOption} style={{ height: 320 }} />
          </ChartCard>
        </div>
      )}

      {activeTab === "category" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="各品类回收量对比">
            <ReactECharts option={categoryVolumeOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="各品类均价趋势">
            <ReactECharts option={categoryPriceOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="手机品牌回收排行" className="lg:col-span-2">
            <ReactECharts option={phoneBrandOption} style={{ height: 360 }} />
          </ChartCard>
        </div>
      )}

      {activeTab === "operation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="地域订单分布">
            <ReactECharts option={regionOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="渠道来源分布">
            <ReactECharts option={channelOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="质检效率趋势">
            <ReactECharts option={qualityEfficiencyOption} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="打款时效分布">
            <ReactECharts option={payoutTimingOption} style={{ height: 320 }} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
