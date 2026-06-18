import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, FileText, MessageSquareWarning, Award, BarChart3, Eye, AlertTriangle } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

const stats = [
  { label: '综合评分', value: 92, icon: Award, color: 'text-primary', bg: 'bg-primary/10', trend: 'up', trendValue: 2 },
  { label: '行业排名', value: 'Top 3', icon: BarChart3, color: 'text-accent', bg: 'bg-accent/10', trend: 'up', trendValue: 1 },
  { label: '本月投诉', value: 23, icon: MessageSquareWarning, color: 'text-warning', bg: 'bg-warning/10', trend: 'down', trendValue: 5 },
  { label: '公开报告', value: 12, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', trend: 'up', trendValue: 2 },
];

const scoreTrend = [
  { date: '1月', 评分: 88 },
  { date: '2月', 评分: 89 },
  { date: '3月', 评分: 90 },
  { date: '4月', 评分: 91 },
  { date: '5月', 评分: 91 },
  { date: '6月', 评分: 92 },
];

const complaintTrend = [
  { name: '1月', 投诉数: 34 },
  { name: '2月', 投诉数: 31 },
  { name: '3月', 投诉数: 28 },
  { name: '4月', 投诉数: 26 },
  { name: '5月', 投诉数: 25 },
  { name: '6月', 投诉数: 23 },
];

const recentReports = [
  { id: 1, title: '蒙牛乳业综合可信评价报告', score: 92, status: 'published', date: '2025-06-10', views: 15680 },
  { id: 2, title: '蒙牛特仑苏产品专项评测', score: 94, status: 'published', date: '2025-05-20', views: 9870 },
  { id: 3, title: '蒙牛酸奶产品线评价', score: 88, status: 'approved', date: '2025-05-15', views: 5420 },
];

const pendingAppeals = [
  { id: 1, title: '关于数据抽样方法的异议', status: 'processing', date: '2025-06-12' },
  { id: 2, title: '服务体验评分偏低申诉', status: 'pending', date: '2025-06-15' },
];

const categoryRankings = [
  { name: '伊利集团', score: 87, rank: 1 },
  { name: '蒙牛乳业', score: 92, rank: 1 },
  { name: '光明乳业', score: 84, rank: 3 },
  { name: '三元食品', score: 82, rank: 4 },
  { name: '完达山', score: 80, rank: 5 },
];

export function BrandDashboard() {
  return (
    <div className="p-6">
      {/* Brand Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ScoreRing score={92} size={100} strokeWidth={8} />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-serif font-bold text-white">蒙牛乳业</h1>
              <StatusBadge status="approved" />
              <span className="badge bg-primary/10 text-primary border-primary/30">消费品牌 · 乳制品</span>
            </div>
            <p className="text-slate-400 text-sm mb-3">内蒙古蒙牛乳业（集团）股份有限公司 · 入驻于 2024-08-15</p>
            <div className="flex items-center gap-4">
              <TrendBadge trend="up" value={2} />
              <span className="text-sm text-slate-400">综合评分较上月提升 2 分</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/brand/reputation" className="btn btn-outline text-sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              舆情看板
            </Link>
            <Link to="/brand/appeal" className="btn btn-primary text-sm">
              <MessageSquareWarning className="w-4 h-4 mr-1" />
              申诉中心
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendBadge trend={stat.trend as any} value={stat.trendValue} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">评分趋势</h3>
          <LineChart
            data={scoreTrend}
            series={[{ key: '评分', color: '#10B981', name: '综合评分' }]}
            height={240}
          />
        </div>
        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">投诉趋势</h3>
          <BarChart
            data={complaintTrend}
            series={[{ key: '投诉数', color: '#F59E0B', name: '投诉数' }]}
            height={240}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-white">近期报告</h3>
            <Link to="/rankings/consumer" className="text-sm text-primary hover:text-primary-dark">查看全部</Link>
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center gap-4 p-3 rounded bg-surface-light/30 hover:bg-surface-light/50 transition-colors">
                <ScoreRing score={report.score} size={40} strokeWidth={4} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <Link to={`/report/${report.id}`} className="text-sm font-medium text-white hover:text-primary truncate block">
                    {report.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{report.date}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {report.views.toLocaleString()}
                    </span>
                  </div>
                </div>
                <StatusBadge status={report.status as any} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Appeals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                待处理申诉
              </h3>
              <Link to="/brand/appeal" className="text-sm text-primary hover:text-primary-dark">查看</Link>
            </div>
            <div className="space-y-2">
              {pendingAppeals.map((appeal) => (
                <div key={appeal.id} className="p-3 rounded bg-surface-light/30">
                  <p className="text-sm text-white truncate">{appeal.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">{appeal.date}</span>
                    <StatusBadge status={appeal.status as any} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Ranking */}
          <div className="card p-5">
            <h3 className="font-serif font-semibold text-white mb-4">行业排名</h3>
            <div className="space-y-2">
              {categoryRankings.map((item, idx) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-3 p-2 rounded ${
                    item.name === '蒙牛乳业' ? 'bg-primary/10 border border-primary/30' : ''
                  }`}
                >
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    item.rank === 1 ? 'bg-warning/20 text-warning' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {item.rank}
                  </span>
                  <span className={`flex-1 text-sm ${item.name === '蒙牛乳业' ? 'text-primary font-medium' : 'text-slate-300'}`}>
                    {item.name}
                    {item.name === '蒙牛乳业' && <span className="ml-1 text-xs">(我)</span>}
                  </span>
                  <span className="text-sm text-white">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandDashboard;
