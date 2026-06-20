import { useState, useMemo } from 'react';
import { Map as MapIcon, AlertCircle, TrendingUp, TrendingDown, Minus, BarChart3, DollarSign, Users, Eye, ChevronRight, UserCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { mockRegionalLaborData } from '@shared/mock/data';
import { INDUSTRY_LIST } from '@shared/types';
import type { RegionalLaborData, IndustryType, TrendType } from '@shared/types';

interface RegionAggregatedData {
  region: string;
  heatIndex: number;
  demandCount: number;
  supplyCount: number;
  gapRatio: number;
  avgSalary: number;
  trend: TrendType;
  industry: IndustryType;
  warnings: RegionalLaborData[];
}

const AdminHeatmapContent = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | 'all'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<RegionalLaborData | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionAggregatedData | null>(null);

  const industryTabs: { key: IndustryType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    ...INDUSTRY_LIST.map(i => ({ key: i.key, label: i.label })),
  ];

  const timeRangeOptions: { key: 'today' | 'week' | 'month'; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
  ];

  const filteredData = useMemo(() => {
    return mockRegionalLaborData.filter(item => {
      if (selectedIndustry !== 'all' && item.industry !== selectedIndustry) {
        return false;
      }
      return true;
    });
  }, [selectedIndustry]);

  const regionAggregatedData = useMemo((): RegionAggregatedData[] => {
    const regionMap = new Map<string, RegionalLaborData[]>();
    filteredData.forEach(item => {
      if (!regionMap.has(item.region)) {
        regionMap.set(item.region, []);
      }
      regionMap.get(item.region)!.push(item);
    });

    return Array.from(regionMap.entries()).map(([region, items]) => {
      const avgHeatIndex = Math.round(items.reduce((acc, i) => acc + i.heatIndex, 0) / items.length);
      const totalDemand = items.reduce((acc, i) => acc + i.demandCount, 0);
      const totalSupply = items.reduce((acc, i) => acc + i.supplyCount, 0);
      const avgGapRatio = Number((items.reduce((acc, i) => acc + i.gapRatio, 0) / items.length).toFixed(2));
      const avgSalary = Math.round(items.reduce((acc, i) => acc + i.avgSalary, 0) / items.length);

      const highGapItems = items.filter(i => i.gapRatio > 0.3);
      const trend = highGapItems.length > items.length / 2 ? 'rising' : 'stable';

      return {
        region,
        heatIndex: avgHeatIndex,
        demandCount: totalDemand,
        supplyCount: totalSupply,
        gapRatio: avgGapRatio,
        avgSalary,
        trend,
        industry: items[0].industry,
        warnings: highGapItems,
      };
    });
  }, [filteredData]);

  const warnings = useMemo(() => {
    return filteredData
      .filter(item => item.gapRatio > 0.3)
      .sort((a, b) => b.gapRatio - a.gapRatio)
      .slice(0, 10);
  }, [filteredData]);

  const topRegionsByHeat = useMemo(() => {
    return [...regionAggregatedData]
      .sort((a, b) => b.heatIndex - a.heatIndex)
      .slice(0, 5);
  }, [regionAggregatedData]);

  const topGrowingIndustries = useMemo(() => {
    const industryMap = new Map<string, { demand: number; supply: number; growth: number }>();
    
    filteredData.forEach(item => {
      const existing = industryMap.get(item.industry) || { demand: 0, supply: 0, growth: 0 };
      industryMap.set(item.industry, {
        demand: existing.demand + item.demandCount,
        supply: existing.supply + item.supplyCount,
        growth: existing.growth + (item.trend === 'rising' ? 1 : item.trend === 'falling' ? -1 : 0),
      });
    });

    return Array.from(industryMap.entries())
      .map(([key, data]) => ({
        industry: key,
        label: INDUSTRY_LIST.find(i => i.key === key)?.label || key,
        ...data,
        growth: Math.round(data.growth / filteredData.filter(i => i.industry === key).length * 100),
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);
  }, [filteredData]);

  const supplyDemandTrend = useMemo(() => {
    const months = ['07月', '08月', '09月', '10月', '11月', '12月', '01月', '02月', '03月', '04月', '05月', '06月'];
    return months.map((month, index) => ({
      month,
      需求: Math.round(15000 + Math.sin(index * 0.5) * 3000 + Math.random() * 2000),
      供给: Math.round(12000 + Math.sin(index * 0.5 - 0.3) * 2500 + Math.random() * 1800),
    }));
  }, []);

  const avgSalaryByRegion = useMemo(() => {
    return regionAggregatedData
      .sort((a, b) => b.avgSalary - a.avgSalary)
      .slice(0, 8)
      .map(item => ({
        region: item.region,
        平均薪资: item.avgSalary,
      }));
  }, [regionAggregatedData]);

  const getHeatColor = (heatIndex: number) => {
    if (heatIndex >= 85) return '#FF5252';
    if (heatIndex >= 70) return '#FF8080';
    if (heatIndex >= 55) return '#FFB3B3';
    if (heatIndex >= 40) return '#4ECDC4';
    return '#A5E7DB';
  };

  const getTrendIcon = (trend: TrendType) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-accent-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-mint-500" />;
      default:
        return <Minus className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getTrendText = (trend: TrendType) => {
    switch (trend) {
      case 'rising':
        return '上升';
      case 'falling':
        return '下降';
      default:
        return '平稳';
    }
  };

  const handleViewWarningDetail = (warning: RegionalLaborData) => {
    setSelectedWarning(warning);
    setWarningModalOpen(true);
  };

  const provincePositions: Record<string, { x: number; y: number }> = {
    '北京': { x: 75, y: 25 },
    '上海': { x: 82, y: 45 },
    '广州': { x: 72, y: 68 },
    '深圳': { x: 70, y: 70 },
    '杭州': { x: 80, y: 50 },
    '成都': { x: 45, y: 55 },
    '武汉': { x: 65, y: 50 },
    '西安': { x: 48, y: 40 },
  };

  return (
    <PageLayout title="区域用工预警" subtitle="实时监控用工供需，提前预警缺口">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Card padding="md" className="flex-1 lg:w-[70%]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-primary-800">
                全国用工热力图
                {selectedRegion && (
                  <Badge variant="info" size="sm" className="ml-2">
                    当前: {selectedRegion}
                  </Badge>
                )}
              </h3>
              {selectedRegion && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedRegion(null)}>
                  返回全国
                </Button>
              )}
            </div>

            <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl overflow-hidden">
              <svg viewBox="0 0 100 80" className="w-full h-full">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d="M 20 15 Q 30 10 50 12 Q 70 10 85 18 Q 90 25 88 35 Q 92 45 85 55 Q 80 65 70 70 Q 60 75 50 72 Q 40 75 30 70 Q 20 65 15 55 Q 10 45 12 35 Q 10 25 20 15 Z"
                  fill="#F0F4F8"
                  stroke="#1E3A5F"
                  strokeWidth="0.5"
                  opacity="0.3"
                />

                {regionAggregatedData.map((regionData) => {
                  const pos = provincePositions[regionData.region];
                  if (!pos) return null;
                  
                  const size = Math.max(2, regionData.heatIndex / 15);
                  const isHovered = hoveredRegion?.region === regionData.region;
                  const isSelected = selectedRegion === regionData.region;

                  return (
                    <g
                      key={regionData.region}
                      onClick={() => setSelectedRegion(regionData.region)}
                      onMouseEnter={() => setHoveredRegion(regionData)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={size * (isHovered || isSelected ? 1.3 : 1)}
                        fill={getHeatColor(regionData.heatIndex)}
                        opacity={isHovered || isSelected ? 0.9 : 0.7}
                        filter={isHovered || isSelected ? 'url(#glow)' : undefined}
                        className="transition-all duration-300"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + size + 4}
                        textAnchor="middle"
                        fontSize="2.5"
                        fill="#1E3A5F"
                        fontWeight={isHovered || isSelected ? 'bold' : 'normal'}
                      >
                        {regionData.region}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {hoveredRegion && (
                <div
                  className="absolute bg-white rounded-xl shadow-lg p-3 z-10 min-w-[180px] animate-fade-in pointer-events-none"
                  style={{
                    left: `${provincePositions[hoveredRegion.region]?.x || 50}%`,
                    top: `${provincePositions[hoveredRegion.region]?.y || 50}%`,
                    transform: 'translate(-50%, -120%)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getHeatColor(hoveredRegion.heatIndex) }}
                    />
                    <span className="font-semibold text-neutral-800">{hoveredRegion.region}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">用工需求</span>
                      <span className="font-medium text-neutral-800">{hoveredRegion.demandCount.toLocaleString()} 人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">人才供给</span>
                      <span className="font-medium text-neutral-800">{hoveredRegion.supplyCount.toLocaleString()} 人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">缺口比例</span>
                      <span className={cn(
                        'font-medium',
                        hoveredRegion.gapRatio > 0.3 ? 'text-accent-500' : 'text-neutral-800'
                      )}>
                        {(hoveredRegion.gapRatio * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">平均薪资</span>
                      <span className="font-medium text-mint-600">¥{hoveredRegion.avgSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-md">
                <p className="text-xs font-medium text-neutral-600 mb-2">热力指数</p>
                <div className="flex items-center gap-1">
                  {[
                    { color: '#A5E7DB', label: '低' },
                    { color: '#4ECDC4', label: '较低' },
                    { color: '#FFB3B3', label: '中' },
                    { color: '#FF8080', label: '较高' },
                    { color: '#FF5252', label: '高' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-neutral-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card padding="md" className="w-full lg:w-[30%] flex flex-col">
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">行业筛选</p>
                <div className="flex flex-wrap gap-2">
                  {industryTabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedIndustry(tab.key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        selectedIndustry === tab.key
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">时间范围</p>
                <div className="flex gap-2">
                  {timeRangeOptions.map(option => (
                    <button
                      key={option.key}
                      onClick={() => setSelectedTimeRange(option.key)}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        selectedTimeRange === option.key
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif text-base font-semibold text-primary-800">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-accent-500" />
                  预警提醒
                </h4>
                <Badge variant="danger" size="sm">{warnings.length} 条</Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {warnings.map((warning) => (
                  <div
                    key={warning.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all hover:shadow-md',
                      warning.gapRatio > 0.4
                        ? 'bg-accent-50 border-accent-200'
                        : 'bg-accent-50/50 border-accent-100'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={cn(
                          'w-4 h-4 flex-shrink-0',
                          warning.gapRatio > 0.4 ? 'text-accent-500' : 'text-accent-400'
                        )} />
                        <span className="font-medium text-neutral-800 text-sm">{warning.region}</span>
                      </div>
                      {getTrendIcon(warning.trend)}
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <Badge variant="info" size="sm">
                        {INDUSTRY_LIST.find(i => i.key === warning.industry)?.label}
                      </Badge>
                      <span className="font-medium text-accent-500">
                        缺口 {(warning.gapRatio * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => handleViewWarningDetail(warning)}>
                      <Eye className="w-3 h-3 mr-1" />
                      查看详情
                    </Button>
                  </div>
                ))}

                {warnings.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-mint-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-mint-500" />
                    </div>
                    <p className="text-sm text-neutral-500">暂无用工预警</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="mb-4">
                <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  热门地区 TOP 5
                </h4>
                <div className="space-y-2">
                  {topRegionsByHeat.map((item, index) => (
                    <div key={item.region} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          index === 0 ? 'bg-accent-500' :
                          index === 1 ? 'bg-accent-400' :
                          index === 2 ? 'bg-mint-500' : 'bg-neutral-400'
                        )}>
                          {index + 1}
                        </span>
                        <span className="text-sm text-neutral-700">{item.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.heatIndex}%`,
                              backgroundColor: getHeatColor(item.heatIndex),
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-neutral-600 w-8">{item.heatIndex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">
                  <TrendingUp className="w-4 h-4 inline mr-1 text-accent-500" />
                  增长行业 TOP 5
                </h4>
                <div className="space-y-2">
                  {topGrowingIndustries.map((item, index) => (
                    <div key={item.industry} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          index === 0 ? 'bg-accent-500' :
                          index === 1 ? 'bg-accent-400' :
                          index === 2 ? 'bg-mint-500' : 'bg-neutral-400'
                        )}>
                          {index + 1}
                        </span>
                        <span className="text-sm text-neutral-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.growth > 0 ? (
                          <TrendingUp className="w-3 h-3 text-accent-500" />
                        ) : item.growth < 0 ? (
                          <TrendingDown className="w-3 h-3 text-mint-500" />
                        ) : (
                          <Minus className="w-3 h-3 text-neutral-500" />
                        )}
                        <span className={cn(
                          'text-xs font-medium',
                          item.growth > 0 ? 'text-accent-500' : item.growth < 0 ? 'text-mint-500' : 'text-neutral-500'
                        )}>
                          {item.growth > 0 ? '+' : ''}{item.growth}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <h3 className="font-serif text-lg font-semibold text-primary-800 mb-4">
              <Users className="w-5 h-5 inline mr-2" />
              供需趋势分析（近12个月）
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={supplyDemandTrend}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                  <XAxis dataKey="month" tick={{ fill: '#6C757D', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6C757D', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="需求" stroke="#1E3A5F" strokeWidth={2} fill="url(#colorDemand)" />
                  <Area type="monotone" dataKey="供给" stroke="#4ECDC4" strokeWidth={2} fill="url(#colorSupply)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-lg font-semibold text-primary-800 mb-4">
              <DollarSign className="w-5 h-5 inline mr-2" />
              各地区平均薪资
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgSalaryByRegion} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                  <XAxis type="number" tick={{ fill: '#6C757D', fontSize: 12 }} />
                  <YAxis dataKey="region" type="category" tick={{ fill: '#6C757D', fontSize: 12 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="平均薪资" fill="#FF6B6B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Modal
          isOpen={warningModalOpen}
          onClose={() => setWarningModalOpen(false)}
          title="用工预警详情"
          size="lg"
        >
          {selectedWarning && (
            <div className="space-y-6">
              <div className="p-4 bg-accent-50 rounded-xl border border-accent-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-accent-500" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-semibold text-neutral-800">
                        {selectedWarning.region} - {INDUSTRY_LIST.find(i => i.key === selectedWarning.industry)?.label}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="danger" size="sm">
                          缺口 {(selectedWarning.gapRatio * 100).toFixed(0)}%
                        </Badge>
                        <span className="text-sm text-neutral-500 flex items-center gap-1">
                          {getTrendIcon(selectedWarning.trend)}
                          {getTrendText(selectedWarning.trend)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">供需数据</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <Users className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                    <p className="text-2xl font-serif font-bold text-primary-600">
                      {selectedWarning.demandCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">用工需求</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <UserCheck className="w-6 h-6 text-mint-500 mx-auto mb-2" />
                    <p className="text-2xl font-serif font-bold text-mint-600">
                      {selectedWarning.supplyCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">人才供给</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <TrendingUp className="w-6 h-6 text-accent-500 mx-auto mb-2" />
                    <p className="text-2xl font-serif font-bold text-accent-600">
                      {(selectedWarning.gapRatio * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">缺口比例</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <DollarSign className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                    <p className="text-2xl font-serif font-bold text-primary-600">
                      ¥{selectedWarning.avgSalary.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">平均薪资</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">
                  城市供需明细
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">城市</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">需求人数</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">供给人数</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">缺口比例</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">平均薪资</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['市中心', '高新区', '开发区', '周边区县'].map((city, index) => {
                        const demand = Math.round(selectedWarning.demandCount * (0.4 - index * 0.08));
                        const supply = Math.round(selectedWarning.supplyCount * (0.45 - index * 0.1));
                        const gap = demand > 0 ? Math.round((demand - supply) / demand * 100) : 0;
                        const salary = Math.round(selectedWarning.avgSalary * (1 - index * 0.05));
                        
                        return (
                          <tr key={city} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="px-4 py-3 font-medium text-neutral-800">{selectedWarning.region} {city}</td>
                            <td className="px-4 py-3 text-neutral-700">{demand.toLocaleString()}</td>
                            <td className="px-4 py-3 text-neutral-700">{supply.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'font-medium',
                                gap > 30 ? 'text-accent-500' : gap > 15 ? 'text-accent-400' : 'text-neutral-600'
                              )}>
                                {gap > 0 ? '+' : ''}{gap}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-mint-600 font-medium">¥{salary.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-serif text-base font-semibold text-primary-800 mb-3">
                  趋势分析
                </h4>
                <div className="h-48 bg-neutral-50 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: '01月', 需求: 1200, 供给: 1000 },
                      { month: '02月', 需求: 1350, 供给: 1050 },
                      { month: '03月', 需求: 1500, 供给: 1100 },
                      { month: '04月', 需求: 1650, 供给: 1150 },
                      { month: '05月', 需求: 1800, 供给: 1200 },
                      { month: '06月', 需求: selectedWarning.demandCount, 供给: selectedWarning.supplyCount },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                      <XAxis dataKey="month" tick={{ fill: '#6C757D', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6C757D', fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="需求" stroke="#1E3A5F" strokeWidth={2} dot={{ fill: '#1E3A5F' }} />
                      <Line type="monotone" dataKey="供给" stroke="#4ECDC4" strokeWidth={2} dot={{ fill: '#4ECDC4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 bg-mint-50 rounded-xl border border-mint-200">
                <h4 className="font-serif text-base font-semibold text-mint-800 mb-3">
                  <ChevronRight className="w-4 h-4 inline mr-1" />
                  建议措施
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-medium text-neutral-800 text-sm mb-1">HR 端建议</p>
                    <ul className="text-xs text-neutral-600 space-y-1">
                      <li>• 加大该地区招聘推广力度</li>
                      <li>• 适当提高薪资待遇吸引力</li>
                      <li>• 与当地职校建立合作渠道</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-medium text-neutral-800 text-sm mb-1">人才端建议</p>
                    <ul className="text-xs text-neutral-600 space-y-1">
                      <li>• 重点推荐该地区岗位</li>
                      <li>• 提供入职奖金激励</li>
                      <li>• 安排免费技能培训</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setWarningModalOpen(false)}>
                  关闭
                </Button>
                <Button variant="primary">
                  生成处理报告
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

const AdminHeatmap = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminHeatmapContent />
    </ProtectedRoute>
  );
};

export default AdminHeatmap;
