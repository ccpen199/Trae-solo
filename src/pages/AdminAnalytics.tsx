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
  const maxWeekly = Math.max(...weeklyData.map((d) => d.value));
  const maxCategory = Math.max(...categoryStats.map((c) => c.value));

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
          数据统计
        </h1>
        <p className="section-subtitle">平台运营数据、工单处理情况、用户行为分析</p>
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
            <MapPin className="w-5 h-5 text-gov-600" />
            区域服务热度
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: '亭湖区', value: 38.2, color: 'from-gov-500 to-gov-600' },
              { name: '盐都区', value: 28.6, color: 'from-warm-500 to-warm-600' },
              { name: '城南新区', value: 18.4, color: 'from-green-500 to-green-600' },
              { name: '开发区', value: 8.8, color: 'from-purple-500 to-purple-600' },
              { name: '大丰区', value: 4.5, color: 'from-blue-500 to-blue-600' },
              { name: '其他', value: 1.5, color: 'from-gray-500 to-gray-600' },
            ].map((area, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{area.name}</span>
                  <span className="text-lg font-bold text-gray-900">{area.value}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full bg-gradient-to-r', area.color)} style={{ width: `${area.value * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
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
  );
}
