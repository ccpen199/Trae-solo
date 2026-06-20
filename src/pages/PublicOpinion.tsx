import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Share2,
  ThumbsUp,
  AlertCircle,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import type { HotTopic, SpreadNode, SpreadLink } from '@shared/types';
import { cn } from '@/lib/utils';

export default function PublicOpinion() {
  const [heatIndex, setHeatIndex] = useState(72.5);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('up');
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [totalMentions, setTotalMentions] = useState(128654);
  const [positiveRate, setPositiveRate] = useState(68.3);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

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

  const heatTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: [45, 52, 48, 60, 58, 68, 72],
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

  const sentimentOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['60%', '85%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: positiveRate, name: '正面', itemStyle: { color: '#10b981' } },
          { value: 100 - positiveRate - 20, name: '中性', itemStyle: { color: '#6b7280' } },
          { value: 20, name: '负面', itemStyle: { color: '#ef4444' } },
        ],
      },
    ],
  };

  const spreadNodes: SpreadNode[] = [
    { id: 'n1', name: '新闻首发', type: 'source', value: 100 },
    { id: 'n2', name: '本地论坛A', type: 'relay', value: 75 },
    { id: 'n3', name: '本地论坛B', type: 'relay', value: 65 },
    { id: 'n4', name: '微信公众号', type: 'relay', value: 85 },
    { id: 'n5', name: '微博大V', type: 'relay', value: 70 },
    { id: 'n6', name: '抖音号', type: 'relay', value: 90 },
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

  const nodeTypeColors: Record<string, string> = {
    source: '#ef4444',
    relay: '#3b82f6',
    comment: '#6b7280',
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
            <p className="text-sm text-slate-500">舆情热度指数</p>
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> :
               trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> :
               <Activity className="w-3.5 h-3.5" />}
              {trend === 'up' ? '上升' : trend === 'down' ? '下降' : '平稳'}
            </div>
          </div>
          <div className="h-32 -mt-4">
            <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">今日热度指数</p>
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
          <div className="h-20">
            <ReactECharts option={heatTrendOption} style={{ height: '100%', width: '100%' }} />
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
          <div className="space-y-2">
            {['source', 'relay', 'comment'].map((type) => {
              const count = spreadNodes.filter(n => n.type === type).length;
              const labels: Record<string, string> = { source: '源头节点', relay: '传播节点', comment: '讨论节点' };
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: nodeTypeColors[type] }}></div>
                    <span className="text-slate-600">{labels[type]}</span>
                  </div>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-slate-900">热点话题TOP10</h3>
          </div>
          <div className="space-y-3">
            {hotTopics.slice(0, 10).map((topic, index) => (
              <div
                key={topic.topic}
                onClick={() => setSelectedTopic(topic.topic)}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors',
                  selectedTopic === topic.topic
                    ? 'bg-primary-50'
                    : 'hover:bg-slate-50'
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold',
                  index < 3 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{topic.topic}</p>
                  <p className="text-xs text-slate-400 mt-0.5">热度 {topic.heat.toLocaleString()}</p>
                </div>
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  topic.trend > 0 ? 'text-red-500' : topic.trend < 0 ? 'text-green-500' : 'text-slate-400'
                )}>
                  {topic.trend > 0 ? <TrendingUp className="w-3 h-3" /> :
                   topic.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  {topic.trend > 0 ? '+' : ''}{topic.trend}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600" />
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
                  <line
                    key={index}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="text-slate-300"
                  />
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

                const size = 8 + (node.value / 100) * 16;

                return (
                  <g key={node.id}>
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
                      className="text-xs fill-slate-600"
                      style={{ fontSize: '10px' }}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded text-xs text-slate-500">
              {selectedTopic ? `话题：${selectedTopic}` : '点击左侧话题查看传播路径'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
