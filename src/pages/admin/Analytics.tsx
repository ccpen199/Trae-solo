import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { Users, Shirt, BookOpen, Smartphone, Scale, Wallet, TrendingUp, BarChart3, Heart, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import {
  getUserFrequencyOption,
  getUserActivityTrendOption,
  getUserRepurchaseOption,
  getCategoryMonthlyVolumeOption,
  getCategoryPriceTrendOption,
  getPhoneBrandRankOption,
  getBookCategoryOption,
  getClothingMaterialOption,
  getRegionTop10Option,
  getChannelSourceOption,
  getQualityEfficiencyOption,
  getPayoutTimingOption,
} from "./analytics/chartOptions";
import DonationTab from "./analytics/DonationTab";

type TabKey = "user" | "category" | "operation" | "donation";

const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "user", label: "用户分析", icon: Users },
  { key: "category", label: "品类分析", icon: Shirt },
  { key: "operation", label: "运营分析", icon: BarChart3 },
  { key: "donation", label: "公益追溯", icon: Heart },
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

const InsightBox = ({ children }: { children: React.ReactNode }) => (
  <div className="card p-5 lg:col-span-2">
    <div className="flex items-center gap-2 mb-3">
      <Lightbulb className="w-5 h-5 text-eco-500" />
      <h4 className="font-semibold text-neutral-800">核心洞察</h4>
    </div>
    <div className="flex flex-wrap gap-x-6 gap-y-2">{children}</div>
  </div>
);

const InsightItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-sm text-neutral-500">{label}</span>
    <span className="text-sm font-bold text-eco-600">{value}</span>
  </div>
);

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabKey>("user");
  const analytics = useStore((s) => s.analytics);

  if (!analytics) return null;

  const userStats = [
    { label: "活跃用户", value: analytics.user.monthlyActiveUsers, suffix: "人", icon: Users, color: "from-eco-500 to-eco-600" },
    { label: "累计用户", value: analytics.user.totalUsers, suffix: "人", icon: Users, color: "from-teal-500 to-emerald-600" },
    { label: "增长速率", value: analytics.user.userGrowthRate, suffix: "%", icon: TrendingUp, color: "from-cyan-500 to-teal-600" },
    { label: "复购率", value: analytics.user.repurchaseRate, suffix: "%", icon: Wallet, color: "from-emerald-500 to-green-600" },
  ];

  const categoryStats = [
    { label: "衣物回收量", value: analytics.category.stats.clothingKg, suffix: "kg", icon: Shirt, color: "from-eco-500 to-eco-600" },
    { label: "图书回收量", value: analytics.category.stats.booksKg, suffix: "kg", icon: BookOpen, color: "from-teal-500 to-emerald-600" },
    { label: "手机回收量", value: analytics.category.stats.phonesCount, suffix: "台", icon: Smartphone, color: "from-cyan-500 to-teal-600" },
    { label: "手机均价", value: analytics.category.stats.phonesAvgPrice, suffix: "元", icon: Scale, color: "from-emerald-500 to-green-600" },
  ];

  const fastPayout = analytics.operation.payoutTimingDistribution.find((p) => p.timing === "T+0");
  const fastPayoutRate = fastPayout
    ? ((fastPayout.count / analytics.operation.payoutTimingDistribution.reduce((s, p) => s + p.count, 0)) * 100).toFixed(1)
    : "0";
  const avgQualityDuration =
    analytics.operation.qualityEfficiencyTrend.reduce((s, q) => s + q.avgDurationMinutes, 0) /
    analytics.operation.qualityEfficiencyTrend.length;

  const operationStats = [
    { label: "覆盖区域", value: analytics.operation.regionTop10.length, suffix: "个", icon: BarChart3, color: "from-eco-500 to-eco-600" },
    { label: "合作渠道", value: analytics.operation.channelSources.length, suffix: "个", icon: Users, color: "from-teal-500 to-emerald-600" },
    { label: "平均质检时长", value: Number(avgQualityDuration.toFixed(1)), suffix: "分钟", icon: TrendingUp, color: "from-cyan-500 to-teal-600" },
    { label: "即时打款率", value: Number(fastPayoutRate), suffix: "%", icon: Wallet, color: "from-emerald-500 to-green-600" },
  ];

  const stats = activeTab === "user"
    ? userStats
    : activeTab === "category"
      ? categoryStats
      : operationStats;

  const activeRate = ((analytics.user.monthlyActiveUsers / analytics.user.totalUsers) * 100).toFixed(1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-2 flex items-center gap-1 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap",
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

      {activeTab !== "donation" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {activeTab === "user" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="用户回收频次分布">
              <ReactECharts option={getUserFrequencyOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
            <ChartCard title="用户活跃度30天趋势">
              <ReactECharts option={getUserActivityTrendOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
            <ChartCard title="复购率分布" className="lg:col-span-2">
              <ReactECharts option={getUserRepurchaseOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
          </div>
          <InsightBox>
            <InsightItem label="活跃用户占比" value={`${activeRate}%`} />
            <InsightItem label="复购率" value={`${analytics.user.repurchaseRate}%`} />
            <InsightItem label="人均回收" value={`${analytics.user.avgRecycleFrequency}次`} />
          </InsightBox>
        </>
      )}

      {activeTab === "category" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="各品类月度回收量堆叠图">
              <ReactECharts option={getCategoryMonthlyVolumeOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
            <ChartCard title="品类均价趋势">
              <ReactECharts option={getCategoryPriceTrendOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
            <ChartCard title="手机品牌回收Top10" className="lg:col-span-2">
              <ReactECharts option={getPhoneBrandRankOption(analytics)} style={{ height: 360 }} />
            </ChartCard>
            <ChartCard title="图书分类分布">
              <ReactECharts option={getBookCategoryOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
            <ChartCard title="衣物材质分布">
              <ReactECharts option={getClothingMaterialOption(analytics)} style={{ height: 320 }} />
            </ChartCard>
          </div>
          <InsightBox>
            <InsightItem label="衣物均价" value={`¥${analytics.category.stats.clothingAvgPrice}/kg`} />
            <InsightItem label="图书均价" value={`¥${analytics.category.stats.booksAvgPrice}/kg`} />
            <InsightItem label="手机均价" value={`¥${analytics.category.stats.phonesAvgPrice}/台`} />
            <InsightItem label="衣物总量" value={`${analytics.category.stats.clothingKg.toLocaleString()}kg`} />
            <InsightItem label="图书总量" value={`${analytics.category.stats.booksKg.toLocaleString()}kg`} />
            <InsightItem label="手机总量" value={`${analytics.category.stats.phonesCount.toLocaleString()}台`} />
          </InsightBox>
        </>
      )}

      {activeTab === "operation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="地域Top10">
            <ReactECharts option={getRegionTop10Option(analytics)} style={{ height: 360 }} />
          </ChartCard>
          <ChartCard title="渠道来源分布">
            <ReactECharts option={getChannelSourceOption(analytics)} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="质检效率周趋势">
            <ReactECharts option={getQualityEfficiencyOption(analytics)} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="打款时效分布">
            <ReactECharts option={getPayoutTimingOption(analytics)} style={{ height: 320 }} />
          </ChartCard>
        </div>
      )}

      {activeTab === "donation" && <DonationTab />}
    </div>
  );
}
