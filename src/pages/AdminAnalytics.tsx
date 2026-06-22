import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ChevronRight,
  Users,
  ClipboardList,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Eye,
  Newspaper,
  Phone,
  MapPin,
  AlertTriangle,
  Tag,
  Layers,
  Activity,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const overviewStats = [
  { label: '累计用户数', value: '128,650', change: '+12.5%', trend: 'up', icon: Users, color: 'from-gov-500 to-gov-600' },
  { label: '今日工单', value: '856', change: '+8.3%', trend: 'up', icon: ClipboardList, color: 'from-warm-500 to-warm-600' },
  { label: '按时办结率', value: '96.8%', change: '+2.1%', trend: 'up', icon: FileCheck, color: 'from-green-500 to-green-600' },
  { label: '群众满意度', value: '98.5%', change: '-0.3%', trend: 'down', icon: Users, color: 'from-purple-500 to-purple-600' },
];

const categoryStats = [
  { name: '城市管理', value: 342, percent: 32, color: 'bg-gov-500' },
  { name: '社会保障', value: 256, percent: 24, color: 'bg-warm-500' },
  { name: '政务咨询', value: 189, percent: 18, color: 'bg-blue-500' },
  { name: '民政服务', value: 128, percent: 12, color: 'bg-green-500' },
  { name: '环境保护', value: 96, percent: 9, color: 'bg-purple-500' },
  { name: '其他', value: 53, percent: 5, color: 'bg-gray-400' },
];

const weeklyData = [
  { day: '周一', value: 120 },
  { day: '周二', value: 145 },
  { day: '周三', value: 168 },
  { day: '周四', value: 132 },
  { day: '周五', value: 185 },
  { day: '周六', value: 96 },
  { day: '周日', value: 88 },
];

const hotspotClusters = [
  {
    id: 'h1',
    keyword: '暴雨防汛',
    articleCount: 12,
    sources: ['盐城日报', '盐城发布', '中国天气网', '江苏新闻'],
    sentiment: -0.35,
    riskLevel: 'high' as const,
    trend: 'up' as const,
    latestTitle: '市防指启动防汛Ⅲ级应急响应',
  },
  {
    id: 'h2',
    keyword: '医保缴费',
    articleCount: 8,
    sources: ['盐城医保局', '盐城发布', '现代快报'],
    sentiment: 0.15,
    riskLevel: 'low' as const,
    trend: 'stable' as const,
    latestTitle: '2026年度城乡居民医保缴费标准公布',
  },
  {
    id: 'h3',
    keyword: '学区划分',
    articleCount: 15,
    sources: ['盐城教育发布', '盐城晚报', '家长帮', '今日头条'],
    sentiment: -0.62,
    riskLevel: 'critical' as const,
    trend: 'up' as const,
    latestTitle: '亭湖区学区调整方案征求意见引发热议',
  },
  {
    id: 'h4',
    keyword: '公积金提取',
    articleCount: 6,
    sources: ['市住房公积金中心', '盐城发布'],
    sentiment: 0.45,
    riskLevel: 'low' as const,
    trend: 'down' as const,
    latestTitle: '公积金提取实现"零跑腿"网上办',
  },
];

const opinionData = [
  { time: '6/15', positive: 65, negative: 12, neutral: 23 },
  { time: '6/16', positive: 58, negative: 18, neutral: 24 },
  { time: '6/17', positive: 52, negative: 25, neutral: 23 },
  { time: '6/18', positive: 60, negative: 20, neutral: 20 },
  { time: '6/19', positive: 70, negative: 15, neutral: 15 },
  { time: '6/20', positive: 55, negative: 28, neutral: 17 },
  { time: '6/21', positive: 62, negative: 22, neutral: 16 },
];

const riskLevelConfig = {
  low: { label: '低风险', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', bar: 'bg-green-500', percent: 25 },
  medium: { label: '中风险', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200', bar: 'bg-yellow-500', percent: 50 },
  high: { label: '高风险', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', bar: 'bg-orange-500', percent: 75 },
  critical: { label: '极高风险', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', bar: 'bg-red-500', percent: 95 },
};

const tagResults = [
  { article: '市防指启动防汛Ⅲ级应急响应', autoTags: ['应急', '防汛', '政策'], category: '应急预警', confidence: 0.95 },
  { article: '2026年度城乡居民医保缴费标准公布', autoTags: ['医保', '缴费', '民生'], category: '民生政策', confidence: 0.92 },
  { article: '亭湖区学区调整方案征求意见', autoTags: ['教育', '学区', '争议'], category: '民生政策', confidence: 0.88 },
  { article: '盐城黄海湿地迎来候鸟迁徙高峰', autoTags: ['生态', '湿地', '文化'], category: '文化', confidence: 0.85 },
];

const hotServices = [
  { rank: 1, name: '社保查询', count: 5820, growth: '+15%' },
  { rank: 2, name: '预约挂号', count: 4320, growth: '+22%' },
  { rank: 3, name: '身份证办理', count: 3890, growth: '+8%' },
  { rank: 4, name: '违章查询', count: 3560, growth: '+12%' },
  { rank: 5, name: '电费缴纳', count: 3210, growth: '+5%' },
  { rank: 6, name: '公积金查询', count: 2890, growth: '+18%' },
];

const recentActivities = [
  { type: '工单', title: '亭湖区路灯维修工单已完成', time: '5分钟前', user: '城管局张工' },
  { type: '新闻', title: '《暴雨防范指南》已发布', time: '15分钟前', user: '应急管理局' },
  { type: '用户', title: '新用户注册 +128', time: '1小时前', user: '系统' },
  { type: '服务', title: '医保异地就医备案功能上线', time: '2小时前', user: '医保局' },
  { type: '工单', title: '噪音扰民诉求已受理', time: '3小时前', user: '环保局' },
];

const categoryIcons: Record<string, any> = {
  工单: ClipboardList,
  新闻: Newspaper,
  用户: Users,
  服务: FileCheck,
};

export default function AdminAnalytics() {
  const [opinions, setOpinions] = useState(opinionData);
  const maxWeekly = Math.max(...weeklyData.map((d) => d.value));
  const maxCategory = Math.max(...categoryStats.map((c) => c.value));
  const currentRiskDistribution = { low: 62, medium: 23, high: 12, critical: 3 };
  const sentimentAvg = -0.08;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">数据统计</span>
      </nav>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-gov-600" />
          数据统计与舆情监测
        </h1>
        <p className="section-subtitle">平台运营数据、工单处理、舆情风险与热点事件监测</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="card p-5 animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br', item.color, 'flex items-center justify-center shadow-md')}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                  item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
                )}>
                  {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              舆情风险等级分布
            </h3>
            <span className={cn(
              'chip',
              sentimentAvg < -0.3 ? 'bg-red-100 text-red-700' :
              sentimentAvg < 0 ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            )}>
              整体情感值 {sentimentAvg > 0 ? '+' : ''}{sentimentAvg.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-24">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <path d="M 10 95 A 90 90 0 0 1 190 95" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                <path d="M 10 95 A 90 90 0 0 1 71 14" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" />
                <path d="M 71 14 A 90 90 0 0 1 129 14" fill="none" stroke="#eab308" strokeWidth="16" strokeLinecap="round" />
                <path d="M 129 14 A 90 90 0 0 1 171 55" fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="round" />
                <path d="M 171 55 A 90 90 0 0 1 190 95" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">62%</p>
                  <p className="text-xs text-gray-500">低风险</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(currentRiskDistribution) as [keyof typeof riskLevelConfig, number][]).map(([level, count]) => {
              const config = riskLevelConfig[level];
              return (
                <div key={level} className={cn('p-3 rounded-xl text-center border', config.bg, config.border)}>
                  <p className={cn('text-xl font-bold', config.color)}>{count}%</p>
                  <p className={cn('text-xs font-medium', config.color)}>{config.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gov-600" />
            7日舆情情感趋势
          </h3>
          <div className="space-y-3">
            {opinions.map((d, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-10 flex-shrink-0">{d.time}</span>
                <div className="flex-1 flex h-6 rounded-lg overflow-hidden bg-gray-100">
                  <div className="bg-green-400 transition-all" style={{ width: `${d.positive}%` }} />
                  <div className="bg-gray-300 transition-all" style={{ width: `${d.neutral}%` }} />
                  <div className="bg-red-400 transition-all" style={{ width: `${d.negative}%` }} />
                </div>
                <div className="flex items-center gap-2 text-xs flex-shrink-0 w-24 justify-end">
                  <span className="text-green-600">{d.positive}%</span>
                  <span className="text-red-500">{d.negative}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" />正面</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300" />中性</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" />负面</span>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-warm-500" />
            热点事件聚类分析
          </h3>
          <span className="text-xs text-gray-500">基于多源报道自动聚合</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {hotspotClusters.map((cluster) => {
            const risk = riskLevelConfig[cluster.riskLevel];
            return (
              <div key={cluster.id} className={cn('p-5 rounded-2xl border-2 transition-all hover:shadow-md', risk.bg, risk.border)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className={cn('w-5 h-5', risk.color)} />
                      <h4 className="font-bold text-gray-900 text-base">{cluster.keyword}</h4>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1">{cluster.latestTitle}</p>
                  </div>
                  <span className={cn('chip flex-shrink-0', risk.bg, risk.color, 'border', risk.border)}>
                    {risk.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <span>{cluster.articleCount} 篇报道</span>
                  <span>{cluster.sources.length} 个信源</span>
                  <span className={cn('font-medium', cluster.sentiment < -0.3 ? 'text-red-600' : cluster.sentiment < 0 ? 'text-yellow-600' : 'text-green-600')}>
                    情感值 {cluster.sentiment > 0 ? '+' : ''}{cluster.sentiment.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cluster.sources.map((src, idx) => (
                    <span key={idx} className="chip bg-white/80 text-gray-700 border border-gray-200">{src}</span>
                  ))}
                </div>
                <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', risk.bar)} style={{ width: `${risk.percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900">近7日工单趋势</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-t from-gov-500 to-gov-400" />
                工单数量
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 md:gap-4 h-56">
            {weeklyData.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex items-end justify-center h-48">
                  <div
                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-gov-500 to-gov-400 hover:from-gov-600 hover:to-gov-500 transition-all group relative"
                    style={{ height: `${(d.value / maxWeekly) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gov-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.value} 件
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-6">工单分类占比</h3>
          <div className="space-y-4">
            {categoryStats.map((cat, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-700">{cat.name}</span>
                  <span className="text-gray-500 font-medium">{cat.value} 件</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', cat.color)}
                    style={{ width: `${(cat.value / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gov-600" />
            稿件自动打标结果
          </h3>
          <span className="text-xs text-gray-500">AI 自动识别政策/民生/文化分类</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3 font-medium">稿件标题</th>
                <th className="px-4 py-3 font-medium">自动标签</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">置信度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tagResults.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-xs truncate">{item.article}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.autoTags.map((tag, tidx) => (
                        <span key={tidx} className="chip bg-gov-100 text-gov-700">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('chip',
                      item.category === '应急预警' ? 'bg-red-100 text-red-700' :
                      item.category === '民生政策' ? 'bg-warm-100 text-warm-700' :
                      'bg-green-100 text-green-700'
                    )}>{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', item.confidence > 0.9 ? 'bg-green-500' : 'bg-yellow-500')} style={{ width: `${item.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-gov-600" />
            热门服务排行
          </h3>
          <div className="space-y-3">
            {hotServices.map((s) => (
              <div key={s.rank} className="flex items-center gap-4 py-2">
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                  s.rank === 1 && 'bg-yellow-100 text-yellow-700',
                  s.rank === 2 && 'bg-gray-100 text-gray-600',
                  s.rank === 3 && 'bg-warm-100 text-warm-700',
                  s.rank > 3 && 'bg-gray-50 text-gray-500',
                )}>
                  {s.rank}
                </span>
                <span className="flex-1 font-medium text-gray-800">{s.name}</span>
                <span className="text-sm text-gray-500">{s.count.toLocaleString()} 次</span>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{s.growth}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 text-gov-600" />
            最近动态
          </h3>
          <div className="space-y-1">
            {recentActivities.map((act, idx) => {
              const Icon = categoryIcons[act.type] || ClipboardList;
              return (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gov-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gov-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{act.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.user}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
