import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Share2,
  ThumbsUp,
  BarChart3,
  Activity,
  Clock,
  FileText,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Filter,
  RefreshCw,
  Gauge,
  PieChart,
  Network,
  ChevronRight,
  MessageCircle,
  Minus,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import type { HotTopic, SpreadNode, SpreadLink } from '@shared/types';
import { cn } from '@/lib/utils';

interface DisposalRecord {
  id: string;
  topic: string;
  measure: string;
  time: string;
  department: string;
  effect: 'excellent' | 'good' | 'normal' | 'poor';
  heatBefore: number;
  heatAfter: number;
}

interface KeywordItem {
  word: string;
  weight: number;
  trend: 'up' | 'down' | 'stable';
}

export default function PublicOpinion() {
  const [heatIndex, setHeatIndex] = useState(72.5);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('up');
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [totalMentions, setTotalMentions] = useState(128654);
  const [positiveRate, setPositiveRate] = useState(68.3);
  const [selectedTopic, setSelectedTopic] = useState<string | null>('徐州地铁4号线开通');
  const [trendRange, setTrendRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadOpinionData();
  }, []);

  const loadOpinionData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/public-opinion/summary');
      const data = await res.json();
      if (data.success) {
        setHeatIndex(data.data.heatIndex);
        setTrend(data.data.trend);
        setHotTopics(data.data.hotTopics);
        setTotalMentions(data.data.totalMentions);
        setPositiveRate(data.data.positiveRate);
      }
    } catch (e) {
      setHotTopics([
        { topic: '徐州地铁4号线开通', heat: 9856, trend: 25.3 },
        { topic: '2024高考政策解读', heat: 8542, trend: 18.7 },
        { topic: '老旧小区改造进展', heat: 7235, trend: -5.2 },
        { topic: '汉文化旅游节', heat: 6890, trend: 32.1 },
        { topic: '营商环境优化', heat: 5672, trend: 12.5 },
        { topic: '一刻钟便民生活圈', heat: 4532, trend: 8.9 },
        { topic: '社区食堂建设', heat: 3876, trend: -2.3 },
        { topic: '人才引进政策', heat: 3421, trend: 15.6 },
        { topic: '医保政策调整', heat: 2987, trend: -8.4 },
        { topic: '安全生产检查', heat: 2543, trend: 5.1 },
      ]);
    }
  };

  const trendData = useMemo(() => {
    if (trendRange === '24h') {
      return {
        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '当前'],
        data: [28, 18, 15, 22, 48, 65, 72, 68, 75, 82, 78, 72, 72.5],
      };
    }
    if (trendRange === '7d') {
      return {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        data: [45, 52, 48, 60, 58, 68, 72],
      };
    }
    return {
      labels: ['第1周', '第2周', '第3周', '第4周'],
      data: [52, 58, 65, 72],
    };
  }, [trendRange]);

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 0.5, color: '#f59e0b' },
              { offset: 1, color: '#ef4444' },
            ],
          },
        },
        progress: {
          show: true,
          width: 18,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, '#e5e7eb']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}',
          fontSize: 36,
          fontWeight: 'bold',
          color: '#1f2937',
          offsetCenter: [0, '10%'],
        },
        data: [{ value: heatIndex }],
      },
    ],
  };

  const heatTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.labels,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      max: 100,
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: trendData.data,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: '#ef4444',
            type: 'dashed',
            width: 1.5,
          },
          data: [
            {
              yAxis: 75,
              label: {
                formatter: '预警阈值 75',
                color: '#ef4444',
                fontSize: 10,
                position: 'insideEndTop',
              },
            },
          ],
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.25)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
            ],
          },
        },
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
      },
    ],
  };

  const sourceOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '2%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#6b7280' } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
        data: [
          { value: 420, name: '微博', itemStyle: { color: '#ef4444' } },
          { value: 315, name: '抖音', itemStyle: { color: '#111827' } },
          { value: 198, name: '微信', itemStyle: { color: '#22c55e' } },
          { value: 156, name: '论坛', itemStyle: { color: '#3b82f6' } },
          { value: 125, name: '新闻', itemStyle: { color: '#8b5cf6' } },
          { value: 89, name: '其他', itemStyle: { color: '#94a3b8' } },
        ],
      },
    ],
  };

  const sentimentOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '2%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#6b7280' } },
    series: [
      {
        type: 'pie',
        radius: ['58%', '82%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `{a|${positiveRate}%}\n{b|正面占比}`;
          },
          rich: {
            a: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#10b981',
              lineHeight: 30,
            },
            b: {
              fontSize: 11,
              color: '#6b7280',
              lineHeight: 16,
            },
          },
        },
        emphasis: { label: { show: true } },
        data: [
          { value: positiveRate, name: '正面', itemStyle: { color: '#10b981' } },
          { value: 100 - positiveRate - 20, name: '中性', itemStyle: { color: '#6b7280' } },
          { value: 20, name: '负面', itemStyle: { color: '#ef4444' } },
        ],
      },
    ],
  };

  const disposalCompareOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    legend: { top: '0%', right: '0%', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10, color: '#6b7280' } },
    xAxis: {
      type: 'category',
      data: ['地铁4号线', '高考政策', '老旧小区', '汉文化节', '营商环境'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10, interval: 0 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      {
        name: '处置前热度',
        type: 'bar',
        data: [98, 85, 72, 69, 57],
        itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
        barWidth: 14,
      },
      {
        name: '处置后热度',
        type: 'bar',
        data: [45, 38, 52, 28, 22],
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        barWidth: 14,
      },
    ],
  };

  const spreadNodes: SpreadNode[] = [
    { id: 'n1', name: '新闻首发', type: 'source', value: 100 },
    { id: 'n2', name: '本地论坛A', type: 'relay', value: 75 },
    { id: 'n3', name: '本地论坛B', type: 'relay', value: 65 },
    { id: 'n4', name: '微信公众号', type: 'relay', value: 85 },
    { id: 'n5', name: '微博大V', type: 'relay', value: 70 },
    { id: 'n6', name: '抖音政务号', type: 'relay', value: 90 },
    { id: 'n7', name: '用户评论1', type: 'comment', value: 30 },
    { id: 'n8', name: '用户评论2', type: 'comment', value: 25 },
    { id: 'n9', name: '用户评论3', type: 'comment', value: 20 },
    { id: 'n10', name: '用户评论4', type: 'comment', value: 35 },
    { id: 'n11', name: '二次传播', type: 'relay', value: 45 },
    { id: 'n12', name: '网友讨论', type: 'comment', value: 28 },
  ];

  const spreadLinks: SpreadLink[] = [
    { source: 'n1', target: 'n2', value: 50 },
    { source: 'n1', target: 'n3', value: 40 },
    { source: 'n1', target: 'n4', value: 60 },
    { source: 'n1', target: 'n6', value: 55 },
    { source: 'n2', target: 'n5', value: 35 },
    { source: 'n4', target: 'n7', value: 20 },
    { source: 'n4', target: 'n8', value: 18 },
    { source: 'n5', target: 'n9', value: 15 },
    { source: 'n6', target: 'n10', value: 25 },
    { source: 'n3', target: 'n11', value: 30 },
    { source: 'n11', target: 'n12', value: 22 },
  ];

  const disposalRecords: DisposalRecord[] = [
    {
      id: 'd1',
      topic: '徐州地铁4号线开通',
      measure: '官方权威发布，联动媒体澄清不实信息',
      time: '2024-06-20 14:30',
      department: '市委宣传部',
      effect: 'excellent',
      heatBefore: 9856,
      heatAfter: 4520,
    },
    {
      id: 'd2',
      topic: '汉文化旅游节',
      measure: '多平台正面宣传，引导舆论走向',
      time: '2024-06-19 16:00',
      department: '市文化广电和旅游局',
      effect: 'excellent',
      heatBefore: 6890,
      heatAfter: 2810,
    },
    {
      id: 'd3',
      topic: '营商环境优化',
      measure: '召开新闻发布会，解读政策细节',
      time: '2024-06-19 10:00',
      department: '市发改委',
      effect: 'good',
      heatBefore: 5672,
      heatAfter: 2230,
    },
    {
      id: 'd4',
      topic: '老旧小区改造进展',
      measure: '发布官方通报，回应市民关切',
      time: '2024-06-18 15:20',
      department: '市住建局',
      effect: 'normal',
      heatBefore: 7235,
      heatAfter: 5210,
    },
  ];

  const keywords: KeywordItem[] = [
    { word: '地铁4号线', weight: 98, trend: 'up' },
    { word: '高考政策', weight: 85, trend: 'up' },
    { word: '汉文化节', weight: 78, trend: 'up' },
    { word: '营商环境', weight: 72, trend: 'stable' },
    { word: '老旧小区', weight: 68, trend: 'down' },
    { word: '便民生活圈', weight: 58, trend: 'stable' },
    { word: '社区食堂', weight: 52, trend: 'down' },
    { word: '人才引进', weight: 48, trend: 'up' },
    { word: '医保政策', weight: 45, trend: 'down' },
    { word: '安全生产', weight: 42, trend: 'stable' },
    { word: '文明城市', weight: 38, trend: 'stable' },
    { word: '智慧交通', weight: 35, trend: 'up' },
    { word: '绿色发展', weight: 32, trend: 'stable' },
    { word: '乡村振兴', weight: 28, trend: 'up' },
    { word: '科技创新', weight: 25, trend: 'stable' },
  ];

  const nodeTypeColors: Record<string, string> = {
    source: '#ef4444',
    relay: '#3b82f6',
    comment: '#6b7280',
  };

  const nodeTypeLabels: Record<string, string> = {
    source: '源头节点',
    relay: '传播节点',
    comment: '讨论节点',
  };

  const keyNodeIds = ['n5', 'n6'];

  const effectColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    normal: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-red-100 text-red-700',
  };

  const effectLabels: Record<string, string> = {
    excellent: '效果显著',
    good: '效果良好',
    normal: '效果一般',
    poor: '效果较差',
  };

  const getKeywordSize = (weight: number) => {
    if (weight >= 80) return 'text-xl font-bold';
    if (weight >= 60) return 'text-lg font-semibold';
    if (weight >= 40) return 'text-base font-medium';
    return 'text-sm';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="舆情分析中心"
        description="舆情热度监测、传播路径溯源与热点话题追踪"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary-600" />
              <p className="text-sm text-slate-500">舆情热度指数</p>
            </div>
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> :
               trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> :
               <Activity className="w-3.5 h-3.5" />}
              {trend === 'up' ? '+5.8%' : trend === 'down' ? '-2.3%' : '0.5%'}
            </div>
          </div>
          <div className="h-32 -mt-4">
            <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>同比 +12.5%</span>
            <span>环比 +5.8%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总提及量</p>
              <p className="text-2xl font-bold text-slate-900">{totalMentions.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              +18.2%
            </div>
            <span>较昨日</span>
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '72%' }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>昨日 108,800</span>
            <span>今日 128,654</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">正面舆情占比</p>
              <p className="text-2xl font-bold text-green-600">{positiveRate}%</p>
            </div>
          </div>
          <div className="h-24">
            <ReactECharts option={sentimentOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">传播节点数</p>
              <p className="text-2xl font-bold text-slate-900">{spreadNodes.length}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {['source', 'relay', 'comment'].map((type) => {
              const count = spreadNodes.filter(n => n.type === type).length;
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: nodeTypeColors[type] }}></div>
                    <span className="text-slate-600">{nodeTypeLabels[type]}</span>
                  </div>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">热度趋势</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTrendRange(range)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    trendRange === range
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {range === '24h' ? '24小时' : range === '7d' ? '7天' : '30天'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ReactECharts option={heatTrendOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-slate-900">来源拆分</h3>
          </div>
          <div className="h-56">
            <ReactECharts option={sourceOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">热点话题TOP10</h3>
            </div>
            <button className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
              <RefreshCw className="w-3 h-3" />
              刷新
            </button>
          </div>
          <div className="space-y-2.5">
            {hotTopics.slice(0, 10).map((topic, index) => (
              <div
                key={topic.topic}
                onClick={() => setSelectedTopic(topic.topic)}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors',
                  selectedTopic === topic.topic
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-slate-50 border border-transparent'
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                  index < 3 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{topic.topic}</p>
                  <p className="text-xs text-slate-400 mt-0.5">热度 {topic.heat.toLocaleString()}</p>
                </div>
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium flex-shrink-0',
                  topic.trend > 0 ? 'text-red-500' : topic.trend < 0 ? 'text-green-500' : 'text-slate-400'
                )}>
                  {topic.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> :
                   topic.trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {topic.trend > 0 ? '+' : ''}{topic.trend}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">传播路径溯源</h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                源头节点
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                传播节点
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                讨论节点
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-yellow-400 ring-offset-1"></div>
                关键节点
              </span>
            </div>
          </div>
          <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 600 320">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                </marker>
              </defs>

              {spreadLinks.map((link, index) => {
                const sourceNode = spreadNodes.find(n => n.id === link.source);
                const targetNode = spreadNodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                const positions: Record<string, { x: number; y: number }> = {
                  n1: { x: 80, y: 160 },
                  n2: { x: 200, y: 80 },
                  n3: { x: 200, y: 240 },
                  n4: { x: 200, y: 160 },
                  n5: { x: 350, y: 80 },
                  n6: { x: 350, y: 240 },
                  n7: { x: 480, y: 100 },
                  n8: { x: 480, y: 160 },
                  n9: { x: 480, y: 50 },
                  n10: { x: 480, y: 280 },
                  n11: { x: 350, y: 160 },
                  n12: { x: 480, y: 220 },
                };

                const src = positions[link.source];
                const tgt = positions[link.target];
                if (!src || !tgt) return null;

                return (
                  <g key={index}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke="#cbd5e1"
                      strokeWidth={1 + (link.value / 100) * 2}
                      strokeDasharray="4 2"
                    />
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 5}
                      textAnchor="middle"
                      className="fill-slate-400"
                      style={{ fontSize: '9px' }}
                    >
                      转发 {link.value}
                    </text>
                  </g>
                );
              })}

              {spreadNodes.map((node) => {
                const positions: Record<string, { x: number; y: number }> = {
                  n1: { x: 80, y: 160 },
                  n2: { x: 200, y: 80 },
                  n3: { x: 200, y: 240 },
                  n4: { x: 200, y: 160 },
                  n5: { x: 350, y: 80 },
                  n6: { x: 350, y: 240 },
                  n7: { x: 480, y: 100 },
                  n8: { x: 480, y: 160 },
                  n9: { x: 480, y: 50 },
                  n10: { x: 480, y: 280 },
                  n11: { x: 350, y: 160 },
                  n12: { x: 480, y: 220 },
                };
                const pos = positions[node.id];
                if (!pos) return null;

                const isKeyNode = keyNodeIds.includes(node.id);
                const size = 8 + (node.value / 100) * 14;

                return (
                  <g key={node.id}>
                    {isKeyNode && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={size + 10}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      >
                        <animate attributeName="r" values={`${size + 8};${size + 14};${size + 8}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size}
                      fill={nodeTypeColors[node.type]}
                      className="cursor-pointer transition-all hover:opacity-80"
                      opacity="0.9"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size + 4}
                      fill="none"
                      stroke={nodeTypeColors[node.type]}
                      strokeWidth="2"
                      opacity="0.3"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + size + 14}
                      textAnchor="middle"
                      className="fill-slate-600"
                      style={{ fontSize: '10px' }}
                    >
                      {node.name}
                    </text>
                    {isKeyNode && (
                      <text
                        x={pos.x}
                        y={pos.y - size - 6}
                        textAnchor="middle"
                        className="fill-yellow-600"
                        style={{ fontSize: '9px', fontWeight: 'bold' }}
                      >
                        ★ 关键节点
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="px-2 py-1 bg-white/80 backdrop-blur-sm rounded text-xs text-slate-500">
                {selectedTopic ? `话题：${selectedTopic}` : '点击左侧话题查看传播路径'}
              </div>
              <div className="flex items-center gap-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Network className="w-3 h-3" />
                  传播层级：4层
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  总转发：{spreadLinks.reduce((s, l) => s + l.value, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-slate-900">热点关键词云</h3>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl min-h-40">
          {keywords.map((kw, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
              style={{ opacity: 0.5 + (kw.weight / 100) * 0.5 }}
            >
              <span className={cn(
                getKeywordSize(kw.weight),
                kw.weight >= 80 && 'text-red-600',
                kw.weight >= 60 && kw.weight < 80 && 'text-orange-600',
                kw.weight >= 40 && kw.weight < 60 && 'text-blue-600',
                kw.weight < 40 && 'text-slate-600'
              )}>
                {kw.word}
              </span>
              {kw.trend !== 'stable' && (
                <span className={cn(
                  'text-xs',
                  kw.trend === 'up' ? 'text-red-500' : 'text-green-500'
                )}>
                  {kw.trend === 'up' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">处置记录</h3>
            </div>
            <button className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
              全部记录 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {disposalRecords.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-medium text-slate-800 truncate">{record.topic}</p>
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded flex-shrink-0',
                        effectColors[record.effect]
                      )}>
                        {effectLabels[record.effect]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-xs text-slate-600 line-clamp-1">{record.measure}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {record.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.time.slice(5, 16)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-red-500 line-through">{record.heatBefore}</span>
                      <ArrowDownRight className="w-3 h-3 text-green-500" />
                      <span className="text-green-600 font-medium">{record.heatAfter}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      下降 {Math.round((1 - record.heatAfter / record.heatBefore) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">处置前后热度对比</h3>
            </div>
          </div>
          <div className="h-64">
            <ReactECharts option={disposalCompareOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-green-50">
              <div className="text-lg font-bold text-green-600">54.2%</div>
              <div className="text-xs text-slate-500 mt-0.5">平均降幅</div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50">
              <div className="text-lg font-bold text-blue-600">{disposalRecords.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">处置事件</div>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50">
              <div className="text-lg font-bold text-purple-600">5</div>
              <div className="text-xs text-slate-500 mt-0.5">联动部门</div>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-50">
              <div className="text-lg font-bold text-orange-600">2.3h</div>
              <div className="text-xs text-slate-500 mt-0.5">响应时效</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
