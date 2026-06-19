import type { AnalyticsData } from "@/store/useStore";

const greenGradient = (opacity = 1) => ({
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(16, 185, 129, ${opacity})` },
    { offset: 1, color: "rgba(16, 185, 129, 0.1)" },
  ],
});

const tealGradient = (opacity = 1) => ({
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(20, 184, 166, ${opacity})` },
    { offset: 1, color: "rgba(20, 184, 166, 0.1)" },
  ],
});

const cyanGradient = (opacity = 1) => ({
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(6, 182, 212, ${opacity})` },
    { offset: 1, color: "rgba(6, 182, 212, 0.1)" },
  ],
});

const commonAxisStyle = {
  axisLine: { lineStyle: { color: "#E5E7EB" } },
  axisLabel: { color: "#6B7280", fontSize: 12 },
  splitLine: { lineStyle: { color: "#F3F4F6", type: "dashed" } },
};

const greenColors = ["#10B981", "#14B8A6", "#06B6D4", "#34D399", "#0EA5E9", "#6EE7B7", "#059669", "#0D9488", "#0891B2", "#22D3EE"];

export function getUserFrequencyOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: "category",
      data: a.user.frequencyDistribution.map((f) => f.range),
      ...commonAxisStyle,
    },
    yAxis: { type: "value", ...commonAxisStyle },
    series: [
      {
        type: "bar",
        data: a.user.frequencyDistribution.map((f) => f.count),
        barWidth: "50%",
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: greenGradient(0.8),
        },
        emphasis: { itemStyle: { color: greenGradient(1) } },
      },
    ],
  };
}

export function getUserActivityTrendOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["活跃用户", "新增用户"], top: 0, textStyle: { color: "#6B7280" } },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: a.user.activityTrend.map((t) => t.date.slice(5)),
      boundaryGap: false,
      ...commonAxisStyle,
    },
    yAxis: [
      { type: "value", name: "活跃用户", ...commonAxisStyle },
      { type: "value", name: "新增用户", ...commonAxisStyle },
    ],
    series: [
      {
        name: "活跃用户",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        data: a.user.activityTrend.map((t) => t.activeUsers),
        lineStyle: { width: 3, color: "#10B981" },
        itemStyle: { color: "#10B981" },
        areaStyle: { color: greenGradient() },
      },
      {
        name: "新增用户",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        yAxisIndex: 1,
        data: a.user.activityTrend.map((t) => t.newUsers),
        lineStyle: { width: 3, color: "#14B8A6" },
        itemStyle: { color: "#14B8A6" },
        areaStyle: { color: tealGradient() },
      },
    ],
  };
}

export function getUserRepurchaseOption(a: AnalyticsData) {
  return {
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
        emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
        data: a.user.repurchaseDistribution.map((d, i) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: greenColors[i % greenColors.length] },
        })),
      },
    ],
  };
}

export function getCategoryMonthlyVolumeOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["衣物", "图书", "手机"], top: 0, textStyle: { color: "#6B7280" } },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: a.category.monthlyVolume.map((m) => m.month),
      ...commonAxisStyle,
    },
    yAxis: { type: "value", ...commonAxisStyle },
    series: [
      {
        name: "衣物",
        type: "bar",
        stack: "total",
        data: a.category.monthlyVolume.map((m) => m.clothing),
        itemStyle: { color: "#10B981" },
      },
      {
        name: "图书",
        type: "bar",
        stack: "total",
        data: a.category.monthlyVolume.map((m) => m.books),
        itemStyle: { color: "#14B8A6" },
      },
      {
        name: "手机",
        type: "bar",
        stack: "total",
        data: a.category.monthlyVolume.map((m) => m.phones),
        itemStyle: { color: "#06B6D4", borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

export function getCategoryPriceTrendOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["衣物均价(元/kg)", "图书均价(元/kg)", "手机均价(元/台)"], top: 0, textStyle: { color: "#6B7280" } },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: a.category.priceTrend.map((m) => m.month),
      boundaryGap: false,
      ...commonAxisStyle,
    },
    yAxis: { type: "value", ...commonAxisStyle },
    series: [
      {
        name: "衣物均价(元/kg)",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: a.category.priceTrend.map((m) => m.clothing),
        lineStyle: { width: 2.5, color: "#10B981" },
        itemStyle: { color: "#10B981" },
        areaStyle: { color: greenGradient(0.4) },
      },
      {
        name: "图书均价(元/kg)",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: a.category.priceTrend.map((m) => m.books),
        lineStyle: { width: 2.5, color: "#14B8A6" },
        itemStyle: { color: "#14B8A6" },
        areaStyle: { color: tealGradient(0.4) },
      },
      {
        name: "手机均价(元/台)",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: a.category.priceTrend.map((m) => m.phones),
        lineStyle: { width: 2.5, color: "#06B6D4" },
        itemStyle: { color: "#06B6D4" },
        areaStyle: { color: cyanGradient(0.4) },
      },
    ],
  };
}

export function getPhoneBrandRankOption(a: AnalyticsData) {
  const top10 = a.category.phoneBrandRank.slice(0, 10);
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 80, right: 30, top: 20, bottom: 30 },
    xAxis: { type: "value", ...commonAxisStyle },
    yAxis: {
      type: "category",
      data: top10.map((b) => b.brand).reverse(),
      ...commonAxisStyle,
    },
    series: [
      {
        type: "bar",
        data: top10.map((b) => b.count).reverse(),
        barWidth: "60%",
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: (params: { dataIndex: number }) => greenColors[params.dataIndex % greenColors.length],
        },
        label: { show: true, position: "right", color: "#4B5563", fontWeight: 600 },
      },
    ],
  };
}

export function getBookCategoryOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { color: "#6B7280" } },
    series: [
      {
        type: "pie",
        radius: "65%",
        center: ["35%", "50%"],
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
        data: a.category.bookCategoryDistribution.map((d, i) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: greenColors[i % greenColors.length] },
        })),
      },
    ],
  };
}

export function getClothingMaterialOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { color: "#6B7280" } },
    series: [
      {
        type: "pie",
        radius: "65%",
        center: ["35%", "50%"],
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
        data: a.category.clothingMaterialDistribution.map((d, i) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: greenColors[i % greenColors.length] },
        })),
      },
    ],
  };
}

export function getRegionTop10Option(a: AnalyticsData) {
  const top10 = a.operation.regionTop10.slice(0, 10);
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 100, right: 30, top: 20, bottom: 30 },
    xAxis: { type: "value", ...commonAxisStyle },
    yAxis: {
      type: "category",
      data: top10.map((r) => r.region).reverse(),
      ...commonAxisStyle,
    },
    series: [
      {
        type: "bar",
        data: top10.map((r) => r.count).reverse(),
        barWidth: "60%",
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: (params: { dataIndex: number }) => greenColors[params.dataIndex % greenColors.length],
        },
        label: { show: true, position: "right", color: "#4B5563", fontWeight: 600 },
      },
    ],
  };
}

export function getChannelSourceOption(a: AnalyticsData) {
  return {
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
        emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
        data: a.operation.channelSources.map((d, i) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: greenColors[i % greenColors.length] },
        })),
      },
    ],
  };
}

export function getQualityEfficiencyOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["质检完成数", "平均质检时长(分钟)"], top: 0, textStyle: { color: "#6B7280" } },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: a.operation.qualityEfficiencyTrend.map((q) => q.date),
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
        data: a.operation.qualityEfficiencyTrend.map((q) => q.completed),
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
        data: a.operation.qualityEfficiencyTrend.map((q) => q.avgDurationMinutes),
        lineStyle: { width: 3, color: "#F97316" },
        itemStyle: { color: "#F97316" },
      },
    ],
  };
}

export function getPayoutTimingOption(a: AnalyticsData) {
  const items = a.operation.payoutTimingDistribution;
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: "category",
      data: items.map((p) => p.timing),
      ...commonAxisStyle,
    },
    yAxis: { type: "value", ...commonAxisStyle },
    series: [
      {
        type: "bar",
        data: items.map((p) => p.count),
        barWidth: "55%",
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (params: { dataIndex: number }) => {
            const opacities = [0.95, 0.85, 0.7, 0.55, 0.4, 0.25];
            return {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(16, 185, 129, ${opacities[params.dataIndex] ?? 0.5})` },
                { offset: 1, color: "rgba(16, 185, 129, 0.1)" },
              ],
            };
          },
        },
      },
    ],
  };
}

export function getDonationDistributionOption(a: AnalyticsData) {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c}元 ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { color: "#6B7280" } },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
        data: a.donation.distribution.map((d, i) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: greenColors[i % greenColors.length] },
        })),
      },
    ],
  };
}
