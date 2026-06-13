import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageSquare,
  MapPin,
  FileCheck,
  ChevronDown,
  Info,
} from 'lucide-react';
import { operationApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface JourneyStep {
  step: string;
  stepName: string;
  userCount: number;
  conversionRate: number;
  avgDuration: number;
  dropOffReason: string[];
}

interface JourneyFunnel {
  id: string;
  period: string;
  totalUsers: number;
  steps: JourneyStep[];
  overallConversion: number;
}

interface MarketOverview {
  summary: {
    totalProperties: number;
    onSaleProperties: number;
    avgPrice: number;
    avgGovPrice: number;
    avgSecondhandPrice: number;
    totalMonthlySales: number;
  };
  marketTrend: Array<{
    month: string;
    avgPrice: number;
    salesVolume: number;
  }>;
  districtStats: Array<{
    district: string;
    propertyCount: number;
    avgPrice: number;
    avgGovPrice: number;
    avgSecondhandPrice: number;
    avgSalesRate: number;
    totalMonthlySales: number;
  }>;
  propertyTypeStats: Array<{
    type: string;
    count: number;
    avgPrice: number;
  }>;
}

type TabType = 'funnel' | 'market' | 'sales';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabType>('funnel');
  const [funnelData, setFunnelData] = useState<JourneyFunnel | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [stepDetails, setStepDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [funnelRes, marketRes, detailsRes] = await Promise.all([
        operationApi.getJourneyFunnel(),
        operationApi.getMarketOverview(),
        operationApi.getJourneyDetails(),
      ]);

      if (funnelRes.success) {
        setFunnelData(funnelRes.data);
      }
      if (marketRes.success) {
        setMarketOverview(marketRes.data);
      }
      if (detailsRes.success) {
        setStepDetails(detailsRes.data);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { key: 'funnel', label: '用户转化漏斗', icon: BarChart3 },
    { key: 'market', label: '市场行情分析', icon: TrendingUp },
    { key: 'sales', label: '楼盘销售对比', icon: FileCheck },
  ];

  const stepIcons: Record<string, any> = {
    browse: Eye,
    favorite: Heart,
    consult: MessageSquare,
    visit: MapPin,
    subscribe: FileCheck,
  };

  const stepColors = [
    'from-blue-500 to-blue-600',
    'from-cyan-500 to-cyan-600',
    'from-green-500 to-green-600',
    'from-yellow-500 to-yellow-600',
    'from-orange-500 to-orange-600',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">运营数据分析</h1>
            <p className="text-indigo-100">
              全方位数据洞察，助力精准运营决策
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-8 h-8" />
          </div>
        </div>

        {funnelData && (
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div>
              <p className="text-indigo-200 text-sm">总访问用户</p>
              <p className="text-2xl font-bold mt-1">{funnelData.totalUsers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">最终认购</p>
              <p className="text-2xl font-bold mt-1">
                {funnelData.steps[funnelData.steps.length - 1]?.userCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">整体转化率</p>
              <p className="text-2xl font-bold mt-1">{funnelData.overallConversion}%</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">统计周期</p>
              <p className="text-2xl font-bold mt-1">{funnelData.period}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Funnel Tab */}
          {activeTab === 'funnel' && funnelData && (
            <div className="space-y-8">
              {/* Funnel Chart */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  用户置业路径漏斗
                </h3>

                <div className="space-y-3">
                  {funnelData.steps.map((step, idx) => {
                    const Icon = stepIcons[step.step] || Eye;
                    const widthPercent = (step.userCount / funnelData.totalUsers) * 100;
                    const isSelected = selectedStep === step.step;

                    return (
                      <div
                        key={step.step}
                        onClick={() => setSelectedStep(isSelected ? null : step.step)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 text-right">
                            <span className="text-sm font-medium text-gray-600">
                              {idx + 1}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'flex-1 h-14 rounded-lg bg-gradient-to-r relative overflow-hidden transition-all',
                              stepColors[idx % stepColors.length],
                              isSelected && 'ring-2 ring-offset-2 ring-indigo-500',
                            )}
                            style={{ width: `${widthPercent}%`, minWidth: '200px' }}
                          >
                            <div className="absolute inset-0 flex items-center px-4 text-white">
                              <Icon className="w-5 h-5 mr-2 flex-shrink-0" />
                              <span className="font-medium">{step.stepName}</span>
                            </div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="text-lg font-bold text-gray-900">
                              {step.userCount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {step.conversionRate.toFixed(1)}% 转化
                            </p>
                          </div>
                        </div>

                        {isSelected && stepDetails && stepDetails[step.step] && (
                          <div className="mt-3 ml-16 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600 mb-3">
                              {stepDetails[step.step].description}
                            </p>

                            {stepDetails[step.step].channels && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  来源渠道分布
                                </p>
                                <div className="space-y-2">
                                  {stepDetails[step.step].channels.map((ch: any, cidx: number) => (
                                    <div key={cidx} className="flex items-center gap-3">
                                      <span className="text-sm text-gray-600 w-20">
                                        {ch.name}
                                      </span>
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-indigo-500 rounded-full"
                                          style={{ width: `${ch.percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-sm text-gray-500 w-16 text-right">
                                        {ch.count.toLocaleString()} ({ch.percentage}%)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.dropOffReason && step.dropOffReason.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  主要流失原因
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {step.dropOffReason.map((reason, ridx) => (
                                    <span
                                      key={ridx}
                                      className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.avgDuration > 0 && (
                              <p className="text-sm text-gray-500 mt-3">
                                平均停留时长：{step.avgDuration} 天
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Funnel Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">浏览层</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    搜索引擎是最大流量来源，占比36%。首页和楼盘列表是访问量最高的页面。
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">兴趣层</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    价格是用户最关心的因素（35%），其次是地段和户型。建议优化价格展示。
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                    <h4 className="font-medium text-gray-900">转化层</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    到访到认购转化率24%，资金问题和竞品吸引是主要流失原因。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Market Tab */}
          {activeTab === 'market' && marketOverview && (
            <div className="space-y-6">
              {/* Market Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">在售均价</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {marketOverview.summary.avgPrice.toLocaleString()}
                    <span className="text-sm font-normal text-gray-400"> 元/㎡</span>
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">政府指导价</p>
                  <p className="text-2xl font-bold text-green-600">
                    {marketOverview.summary.avgGovPrice.toLocaleString()}
                    <span className="text-sm font-normal text-gray-400"> 元/㎡</span>
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">二手房均价</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {marketOverview.summary.avgSecondhandPrice.toLocaleString()}
                    <span className="text-sm font-normal text-gray-400"> 元/㎡</span>
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">月成交</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {marketOverview.summary.totalMonthlySales}
                    <span className="text-sm font-normal text-gray-400"> 套</span>
                  </p>
                </div>
              </div>

              {/* Price Trend */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">价格走势</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-end justify-between h-48 gap-2">
                    {marketOverview.marketTrend.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:opacity-80"
                          style={{
                            height: `${((item.avgPrice - 14000) / 4000) * 100}%`,
                            minHeight: '20px',
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">{item.month.slice(5)}</p>
                        <p className="text-xs font-medium text-gray-700">
                          {item.avgPrice.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* District Stats */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">各区域数据对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-gray-600 font-medium">区域</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">楼盘数</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">在售均价</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">政府指导价</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">二手房均价</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">去化率</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">月成交</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketOverview.districtStats.map((district, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{district.district}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{district.propertyCount}</td>
                          <td className="py-3 px-4 text-right text-blue-600 font-medium">
                            {district.avgPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {district.avgGovPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {district.avgSecondhandPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-gray-600">{district.avgSalesRate}%</span>
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${district.avgSalesRate}%` }}
                                />
                              </div>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {district.totalMonthlySales}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">楼盘销售对比分析</h3>
              <p className="text-gray-500 text-sm mb-6">
                接入政府公示价格、二手房挂牌均价、竞品楼盘去化率，全方位分析楼盘销售数据
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketOverview?.districtStats.slice(0, 6).map((district, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">{district.district}</h4>
                      <span className="text-sm text-gray-500">
                        {district.propertyCount} 个楼盘
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">在售均价</span>
                        <span className="font-medium text-blue-600">
                          {district.avgPrice.toLocaleString()} 元/㎡
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">政府指导价</span>
                        <span className="font-medium text-gray-700">
                          {district.avgGovPrice.toLocaleString()} 元/㎡
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">二手房均价</span>
                        <span className="font-medium text-orange-600">
                          {district.avgSecondhandPrice.toLocaleString()} 元/㎡
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">平均去化率</span>
                          <span className="font-medium text-green-600">
                            {district.avgSalesRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                            style={{ width: `${district.avgSalesRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm text-gray-500">月成交量</span>
                        <span className="font-medium text-purple-600">
                          {district.totalMonthlySales} 套
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Sources Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">数据来源说明</p>
                    <p className="text-sm text-gray-600 mt-1">
                      本平台数据接入多个权威数据源：政府房产局公示价格、二手房平台挂牌均价、
                      开发商备案去化数据等，确保数据真实可靠，为您的决策提供有力支撑。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
