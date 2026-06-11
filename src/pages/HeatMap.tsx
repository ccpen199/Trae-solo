import React, { useState, useMemo, useEffect } from 'react';
import { Users, Package, TrendingUp, TrendingDown, MapPin, Zap, Activity, BarChart3 } from 'lucide-react';
import { HeatMapCanvas, HeatMapMode, HeatMapDataPoint } from '@/components/charts/HeatMapCanvas';
import { cn } from '@/lib/utils';

const generateHeatMapData = (mode: HeatMapMode, count = 30): HeatMapDataPoint[] => {
  const areas = [
    '朝阳区国贸商圈', '海淀区中关村', '西城区金融街', '东城区王府井',
    '丰台区丽泽商务区', '通州区运河商务区', '大兴区亦庄', '昌平区回龙观',
    '石景山区鲁谷', '顺义区后沙峪', '房山区长阳', '门头沟区永定',
  ];

  return Array.from({ length: count }, (_, i) => ({
    x: 100 + Math.random() * 600,
    y: 100 + Math.random() * 350,
    value: Math.floor(Math.random() * 100) + 10,
    label: areas[i % areas.length],
    id: `${mode}-${Date.now()}-${i}`,
  }));
};

export default function HeatMap() {
  const [mode, setMode] = useState<HeatMapMode>('capacity');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [capacityData, setCapacityData] = useState<HeatMapDataPoint[]>(() => generateHeatMapData('capacity'));
  const [ordersData, setOrdersData] = useState<HeatMapDataPoint[]>(() => generateHeatMapData('orders'));

  const activeData = mode === 'capacity' ? capacityData : ordersData;

  useEffect(() => {
    const interval = setInterval(() => {
      setCapacityData(generateHeatMapData('capacity'));
      setOrdersData(generateHeatMapData('orders'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const totalValue = activeData.reduce((sum, d) => sum + d.value, 0);
    const avgValue = totalValue / activeData.length;
    const hotSpots = activeData.filter(d => d.value > 70).length;
    const coldSpots = activeData.filter(d => d.value < 30).length;

    return {
      total: Math.round(totalValue),
      avg: Math.round(avgValue),
      hotSpots,
      coldSpots,
      peakValue: Math.max(...activeData.map(d => d.value)),
    };
  }, [activeData]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-space-blue-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1 flex items-center gap-3">
              <Activity className="w-7 h-7 text-amber-accent-400" />
              实时热力监控大屏
            </h1>
            <p className="text-sm text-gray-400">
              实时监控城市配送运力与订单分布情况
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-space-blue-800 border border-space-blue-600 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-status-pulse" />
              <span className="text-sm text-gray-300">实时同步中</span>
            </div>
            <div className="text-sm text-gray-400 font-mono-code bg-space-blue-800 border border-space-blue-600 rounded-lg px-3 py-2">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMode('capacity')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      mode === 'capacity'
                        ? 'bg-success-500/20 text-success-400 border border-success-500/50'
                        : 'bg-space-blue-700 text-gray-400 border border-space-blue-600 hover:text-gray-200'
                    )}
                  >
                    <Users className="w-4 h-4" />
                    运力热力图
                  </button>
                  <button
                    onClick={() => setMode('orders')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      mode === 'orders'
                        ? 'bg-info-500/20 text-info-400 border border-info-500/50'
                        : 'bg-space-blue-700 text-gray-400 border border-space-blue-600 hover:text-gray-200'
                    )}
                  >
                    <Package className="w-4 h-4" />
                    订单热力图
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-accent-400" />
                    <span className="text-sm text-gray-400">热点区域:</span>
                    <span className="text-sm font-mono-code text-amber-accent-400 font-bold">{stats.hotSpots}</span>
                  </div>
                  <div className="w-px h-5 bg-space-blue-600" />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-info-400" />
                    <span className="text-sm text-gray-400">覆盖区域:</span>
                    <span className="text-sm font-mono-code text-info-400 font-bold">{activeData.length}</span>
                  </div>
                </div>
              </div>

              <HeatMapCanvas
                mode={mode}
                data={activeData}
                width={900}
                height={560}
                showTimeline={true}
                timelineStart={new Date(Date.now() - 12 * 60 * 60 * 1000)}
                timelineEnd={new Date()}
                onTimelineChange={setCurrentTime}
                className="border border-space-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">
                    {mode === 'capacity' ? '总运力指数' : '总订单量'}
                  </span>
                  <div className="p-2 bg-success-500/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-success-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-100 font-mono-code mb-2">
                  {stats.total.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-success-400" />
                  <span className="text-sm font-medium text-success-400">+12.5%</span>
                  <span className="text-xs text-gray-500">较昨日</span>
                </div>
              </div>

              <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">
                    {mode === 'capacity' ? '平均运力密度' : '平均订单密度'}
                  </span>
                  <div className="p-2 bg-info-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-info-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-100 font-mono-code mb-2">
                  {stats.avg}
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-success-400" />
                  <span className="text-sm font-medium text-success-400">+5.2%</span>
                  <span className="text-xs text-gray-500">较昨日</span>
                </div>
              </div>

              <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">热点区域数</span>
                  <div className="p-2 bg-amber-accent-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-accent-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-accent-400 font-mono-code mb-2">
                  {stats.hotSpots}
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-warning-400" />
                  <span className="text-sm font-medium text-warning-400">+3</span>
                  <span className="text-xs text-gray-500">较上小时</span>
                </div>
              </div>

              <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">峰值{mode === 'capacity' ? '运力' : '订单'}量</span>
                  <div className="p-2 bg-danger-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-danger-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-100 font-mono-code mb-2">
                  {stats.peakValue}
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-danger-400" />
                  <span className="text-sm font-medium text-danger-400">-2.1%</span>
                  <span className="text-xs text-gray-500">较昨日峰值</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
              <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-accent-400" />
                热门区域 TOP 5
              </h3>
              <div className="space-y-3">
                {activeData
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((point, index) => {
                    const percentage = (point.value / stats.peakValue) * 100;
                    return (
                      <div key={point.id} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-5 h-5 rounded flex items-center justify-center text-xs font-bold',
                              index === 0 ? 'bg-amber-accent-500 text-space-blue-900' :
                              index === 1 ? 'bg-gray-400 text-space-blue-900' :
                              index === 2 ? 'bg-amber-accent-700 text-space-blue-100' :
                              'bg-space-blue-600 text-gray-400'
                            )}>
                              {index + 1}
                            </span>
                            <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors truncate max-w-[140px]">
                              {point.label}
                            </span>
                          </div>
                          <span className="text-sm font-mono-code text-amber-accent-400 font-medium">
                            {point.value}
                          </span>
                        </div>
                        <div className="h-1.5 bg-space-blue-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              index === 0 ? 'bg-gradient-to-r from-amber-accent-600 to-amber-accent-400' :
                              index === 1 ? 'bg-gradient-to-r from-success-600 to-success-400' :
                              index === 2 ? 'bg-gradient-to-r from-info-600 to-info-400' :
                              'bg-gradient-to-r from-space-blue-500 to-space-blue-400'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
              <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-info-400" />
                区域分布概览
              </h3>
              <div className="space-y-2.5">
                {[
                  { name: '朝阳区', capacity: 85, orders: 92, color: 'bg-amber-accent-500' },
                  { name: '海淀区', capacity: 78, orders: 88, color: 'bg-success-500' },
                  { name: '西城区', capacity: 65, orders: 71, color: 'bg-info-500' },
                  { name: '东城区', capacity: 52, orders: 58, color: 'bg-warning-500' },
                  { name: '丰台区', capacity: 41, orders: 45, color: 'bg-danger-500' },
                ].map((region, index) => (
                  <div key={index} className="bg-space-blue-700/50 rounded-lg p-3 hover:bg-space-blue-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">{region.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-success-400" />
                          <span className="text-xs font-mono-code text-gray-300">{region.capacity}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-info-400" />
                          <span className="text-xs font-mono-code text-gray-300">{region.orders}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1 bg-space-blue-600 rounded-full overflow-hidden flex gap-0.5">
                      <div
                        className="h-full bg-success-500 rounded-l-full"
                        style={{ width: `${region.capacity / 2}%` }}
                      />
                      <div
                        className="h-full bg-info-500 rounded-r-full"
                        style={{ width: `${region.orders / 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-space-blue-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded bg-success-500" />
                  <span className="text-xs text-gray-400">运力</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded bg-info-500" />
                  <span className="text-xs text-gray-400">订单</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-accent-500/20 to-amber-accent-600/10 border border-amber-accent-500/30 rounded-xl p-5 shadow-card">
              <h3 className="text-lg font-semibold text-amber-accent-400 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                调度建议
              </h3>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-accent-500 mt-2 shrink-0" />
                  <span className="text-sm text-gray-300">
                    朝阳区国贸商圈运力紧张，建议增派 <span className="text-amber-accent-400 font-mono-code font-bold">5-8</span> 名骑手
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500 mt-2 shrink-0" />
                  <span className="text-sm text-gray-300">
                    海淀区中关村订单峰值预计在 <span className="text-success-400 font-mono-code font-bold">18:30</span> 出现
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info-500 mt-2 shrink-0" />
                  <span className="text-sm text-gray-300">
                    丰台区运力过剩，可调度 <span className="text-info-400 font-mono-code font-bold">3-5</span> 名骑手支援周边
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
