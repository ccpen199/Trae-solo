import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Layers,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  BarChart2,
  X,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useAdminStore } from '@/stores/useAdminStore';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import { mockBaoliaos } from '@/data/mockBaoliaos';
import { huizhouDistricts } from '@/utils/location';
import { cn } from '@/lib/utils';
import type { HeatmapData } from '@/types';

const timeRangeOptions = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '近7天' },
  { value: 'month', label: '近30天' },
  { value: 'custom', label: '自定义' },
];

const displayModeOptions = [
  { value: 'density', label: '密度热力图' },
  { value: 'sentiment', label: '情感分布图' },
];

const districtOptions = [
  { value: 'all', label: '全部区域' },
  ...huizhouDistricts.map((d) => ({ value: d.name, label: d.name })),
];

const hotKeywords = [
  { word: '交通拥堵', count: 1256 },
  { word: '环境污染', count: 987 },
  { word: '市政设施', count: 856 },
  { word: '旅游旺季', count: 743 },
  { word: '停车难', count: 654 },
  { word: '垃圾分类', count: 543 },
  { word: '道路损坏', count: 432 },
  { word: '噪音扰民', count: 398 },
  { word: '食品安全', count: 345 },
  { word: '公交出行', count: 298 },
];

function SkeletonMap() {
  return (
    <div className="bg-neutral-800/50 rounded-2xl p-6 border border-neutral-700/50 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-neutral-700 rounded w-32" />
        <div className="h-8 bg-neutral-700 rounded w-24" />
      </div>
      <div className="h-[500px] bg-neutral-700/50 rounded-xl" />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="bg-neutral-800/50 rounded-2xl p-6 border border-neutral-700/50 animate-pulse space-y-4">
      <div className="h-6 bg-neutral-700 rounded w-24" />
      <div className="h-24 bg-neutral-700/50 rounded-xl" />
      <div className="h-32 bg-neutral-700/50 rounded-xl" />
      <div className="h-40 bg-neutral-700/50 rounded-xl" />
    </div>
  );
}

function SentimentBadge({ type, count, total }: { type: 'positive' | 'neutral' | 'negative'; count: number; total: number }) {
  const config = {
    positive: { icon: Smile, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: '正面' },
    neutral: { icon: Meh, color: 'text-amber-400', bg: 'bg-amber-500/20', label: '中性' },
    negative: { icon: Frown, color: 'text-rose-400', bg: 'bg-rose-500/20', label: '负面' },
  };

  const { icon: Icon, color, bg, label } = config[type];
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', bg)}>
      <Icon className={cn('w-4 h-4', color)} />
      <div>
        <p className={cn('text-sm font-medium', color)}>{label}</p>
        <p className="text-xs text-neutral-400">{count} ({percentage}%)</p>
      </div>
    </div>
  );
}

export default function Heatmap() {
  const { fetchHeatmapData, heatmapData, fetchDailyStats, dailyStats } = useAdminStore();
  const { fetchBaoliaos, baoliaos } = useBaoliaoStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [displayMode, setDisplayMode] = useState<'density' | 'sentiment'>('density');
  const [selectedArea, setSelectedArea] = useState<HeatmapData | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHeatmapData(),
        fetchDailyStats(14),
        fetchBaoliaos(),
      ]);
      setTimeout(() => setLoading(false), 500);
    };

    loadData();
  }, [fetchHeatmapData, fetchDailyStats, fetchBaoliaos, timeRange, selectedDistrict]);

  const maxCount = useMemo(() => {
    return Math.max(...heatmapData.map((d) => d.count), 1);
  }, [heatmapData]);

  const getDensityColor = (count: number): string => {
    const ratio = count / maxCount;
    if (ratio < 0.25) return '#3b82f6';
    if (ratio < 0.5) return '#22c55e';
    if (ratio < 0.75) return '#eab308';
    return '#ef4444';
  };

  const getSentimentColor = (positive: number, neutral: number, negative: number): string => {
    const total = positive + neutral + negative;
    if (total === 0) return '#6b7280';
    const negRatio = negative / total;
    const posRatio = positive / total;
    if (negRatio > 0.5) return '#ef4444';
    if (posRatio > 0.5) return '#22c55e';
    return '#eab308';
  };

  const districtPaths: Record<string, string> = {
    '惠城区': 'M350,200 L450,180 L480,250 L400,320 L320,280 Z',
    '惠阳区': 'M300,350 L420,330 L450,420 L350,450 L280,400 Z',
    '惠东县': 'M480,200 L600,180 L650,300 L550,400 L460,320 Z',
    '博罗县': 'M180,120 L350,100 L380,200 L300,250 L150,220 Z',
    '龙门县': 'M100,50 L250,30 L280,130 L150,180 L80,120 Z',
    '仲恺区': 'M280,250 L380,230 L400,300 L320,340 L260,300 Z',
    '大亚湾区': 'M450,400 L550,380 L580,480 L480,500 L420,450 Z',
  };

  const mapOption = useMemo(() => {
    if (heatmapData.length === 0) return {};

    const data = heatmapData.map((item) => {
      const value = displayMode === 'density' ? item.count : item.negative;
      const color = displayMode === 'density'
        ? getDensityColor(item.count)
        : getSentimentColor(item.positive, item.neutral, item.negative);

      return {
        name: item.district,
        value,
        itemStyle: {
          areaColor: color,
          opacity: 0.7,
        },
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderColor: '#444',
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: (params: any) => {
          const item = heatmapData.find((d) => d.district === params.name);
          if (!item) return params.name;
          const total = item.positive + item.neutral + item.negative;
          return `
            <div style="padding: 4px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${item.district}</div>
              <div style="margin-bottom: 4px;">爆料总数: <span style="font-weight: bold; color: #0ea5e9;">${item.count}</span></div>
              <div style="margin-bottom: 4px;">正面: <span style="color: #22c55e;">${item.positive} (${total > 0 ? ((item.positive / total) * 100).toFixed(1) : 0}%)</span></div>
              <div style="margin-bottom: 4px;">中性: <span style="color: #eab308;">${item.neutral} (${total > 0 ? ((item.neutral / total) * 100).toFixed(1) : 0}%)</span></div>
              <div>负面: <span style="color: #ef4444;">${item.negative} (${total > 0 ? ((item.negative / total) * 100).toFixed(1) : 0}%)</span></div>
            </div>
          `;
        },
      },
      geo: {
        map: 'huizhou',
        roam: false,
        label: {
          show: true,
          color: '#fff',
          fontSize: 12,
        },
        itemStyle: {
          areaColor: '#1f2937',
          borderColor: '#374151',
          borderWidth: 2,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#374151',
          },
          label: {
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      },
      series: [
        {
          type: 'map',
          map: 'huizhou',
          data,
          animationDuration: 2000,
          animationEasing: 'cubicOut',
        },
      ],
    };
  }, [heatmapData, displayMode, maxCount]);

  const registerMap = (echarts: any) => {
    const features = huizhouDistricts.map((d) => ({
      type: 'Feature',
      properties: { name: d.name },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [d.center[1] - 0.1, d.center[0] + 0.1],
            [d.center[1] + 0.1, d.center[0] + 0.1],
            [d.center[1] + 0.1, d.center[0] - 0.1],
            [d.center[1] - 0.1, d.center[0] - 0.1],
            [d.center[1] - 0.1, d.center[0] + 0.1],
          ],
        ],
      },
    }));

    echarts.registerMap('huizhou', {
      type: 'FeatureCollection',
      features,
    });
  };

  const areaTrendOption = useMemo(() => {
    if (!selectedArea || dailyStats.length === 0) return {};

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dailyStats.slice(-7).map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#999', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999', fontSize: 10 },
      },
      series: [
        {
          name: '爆料数',
          type: 'line',
          smooth: true,
          data: dailyStats.slice(-7).map((d) => Math.floor(d.baoliaoCount * (0.5 + Math.random() * 1))),
          lineStyle: { color: '#0ea5e9', width: 2 },
          itemStyle: { color: '#0ea5e9' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(14, 165, 233, 0.3)' },
                { offset: 1, color: 'rgba(14, 165, 233, 0)' },
              ],
            },
          },
          animationDuration: 1500,
        },
      ],
    };
  }, [selectedArea, dailyStats]);

  const areaHotEvents = useMemo(() => {
    if (!selectedArea) return [];
    return mockBaoliaos
      .filter((b) => b.location.district === selectedArea.district)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [selectedArea]);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchHeatmapData(),
      fetchDailyStats(14),
    ]);
    setTimeout(() => setLoading(false), 300);
  };

  const maxKeywordCount = Math.max(...hotKeywords.map((k) => k.count));

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-[1800px] mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">舆情热力图</h1>
              <p className="text-neutral-400 mt-1">可视化展示各区域舆情分布与情感倾向</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="md" onClick={handleRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
                刷新
              </Button>
              <Button variant="secondary" size="md" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
                导出报告
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50 mb-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-400 text-sm">筛选条件:</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <Select
                  options={timeRangeOptions}
                  value={timeRange}
                  onChange={setTimeRange}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <Select
                  options={districtOptions}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-400" />
                <div className="flex bg-neutral-700/50 rounded-lg p-1">
                  {displayModeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDisplayMode(option.value as 'density' | 'sentiment')}
                      className={cn(
                        'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                        displayMode === option.value
                          ? 'bg-westlake-500 text-white'
                          : 'text-neutral-400 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {loading ? (
                <SkeletonMap />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-westlake-400" />
                      惠州舆情热力图
                    </h3>
                    <div className="flex items-center gap-4">
                      {displayMode === 'density' ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
                            <span className="text-xs text-neutral-400">低</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
                            <span className="text-xs text-neutral-400">中</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }} />
                            <span className="text-xs text-neutral-400">高</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                            <span className="text-xs text-neutral-400">极高</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Smile className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-neutral-400">正面</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Meh className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-neutral-400">中性</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Frown className="w-4 h-4 text-rose-400" />
                            <span className="text-xs text-neutral-400">负面</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <svg viewBox="50 0 650 550" className="w-full h-[500px]">
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {heatmapData.map((item) => {
                        const color = displayMode === 'density'
                          ? getDensityColor(item.count)
                          : getSentimentColor(item.positive, item.neutral, item.negative);
                        const isSelected = selectedArea?.district === item.district;
                        const path = districtPaths[item.district];
                        if (!path) return null;

                        return (
                          <g key={item.district}>
                            <motion.path
                              d={path}
                              fill={color}
                              fillOpacity={isSelected ? 0.9 : 0.6}
                              stroke={isSelected ? '#fff' : '#374151'}
                              strokeWidth={isSelected ? 3 : 1.5}
                              style={{ cursor: 'pointer' }}
                              filter={isSelected ? 'url(#glow)' : undefined}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                              whileHover={{ fillOpacity: 0.85, scale: 1.02 }}
                              onClick={() => setSelectedArea(item)}
                            />
                            <text
                              x={parseInt(path.split(' ')[0].slice(1)) + 60}
                              y={parseInt(path.split(' ')[1]) + 10}
                              fill="#fff"
                              fontSize="13"
                              fontWeight="500"
                              textAnchor="middle"
                              style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                            >
                              {item.district}
                            </text>
                            <text
                              x={parseInt(path.split(' ')[0].slice(1)) + 60}
                              y={parseInt(path.split(' ')[1]) + 30}
                              fill="rgba(255,255,255,0.8)"
                              fontSize="11"
                              textAnchor="middle"
                              style={{ pointerEvents: 'none' }}
                            >
                              {item.count} 条
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              {loading ? (
                <SkeletonPanel />
              ) : selectedArea ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{selectedArea.district}</h3>
                    <button
                      onClick={() => setSelectedArea(null)}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-neutral-700/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-400">爆料总数</span>
                      <span className="text-2xl font-bold text-white">{selectedArea.count}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <SentimentBadge type="positive" count={selectedArea.positive} total={selectedArea.count} />
                      <SentimentBadge type="neutral" count={selectedArea.neutral} total={selectedArea.count} />
                      <SentimentBadge type="negative" count={selectedArea.negative} total={selectedArea.count} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-400 mb-3">趋势分析</h4>
                    <ReactECharts
                      option={areaTrendOption}
                      style={{ height: '160px' }}
                      opts={{ renderer: 'canvas' }}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-neutral-400 mb-3">热点事件</h4>
                    <div className="space-y-2">
                      {areaHotEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-neutral-700/20 rounded-lg hover:bg-neutral-700/40 transition-colors cursor-pointer"
                        >
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                              index === 0 ? 'bg-rose-500 text-white' :
                              index === 1 ? 'bg-amber-500 text-white' :
                              index === 2 ? 'bg-sky-500 text-white' : 'bg-neutral-600 text-neutral-300'
                            )}
                          >
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium line-clamp-1">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-neutral-500">{event.categoryName}</span>
                              <span className="text-xs text-neutral-500">{event.views} 浏览</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50 text-center"
                >
                  <MapPin className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500">点击地图区域查看详细数据</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-violet-400" />
                  热点关键词
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hotKeywords.map((keyword, index) => {
                    const size = 12 + (keyword.count / maxKeywordCount) * 16;
                    const opacity = 0.5 + (keyword.count / maxKeywordCount) * 0.5;
                    const colors = ['text-sky-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-violet-400', 'text-cyan-400'];
                    const color = colors[index % colors.length];

                    return (
                      <motion.span
                        key={keyword.word}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className={cn('px-3 py-1.5 rounded-full bg-neutral-700/50 cursor-pointer hover:bg-neutral-600/50 transition-colors', color)}
                        style={{ fontSize: `${size}px` }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {keyword.word}
                        <span className="text-xs ml-1 opacity-70">({keyword.count})</span>
                      </motion.span>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出热力图数据报告"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-neutral-400">确认导出当前筛选条件下的热力图数据报告？</p>
          <div className="bg-neutral-700/30 rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-400">时间范围:</span>
              <span className="text-white">{timeRangeOptions.find((o) => o.value === timeRange)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">区域:</span>
              <span className="text-white">{districtOptions.find((o) => o.value === selectedDistrict)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">展示模式:</span>
              <span className="text-white">{displayModeOptions.find((o) => o.value === displayMode)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">数据总量:</span>
              <span className="text-white">{heatmapData.reduce((sum, d) => sum + d.count, 0)} 条爆料</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowExportModal(false)}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowExportModal(false);
              alert('报告已开始导出，请稍后查看下载文件。');
            }}
          >
            确认导出
          </Button>
        </div>
      </Modal>
    </div>
  );
}
