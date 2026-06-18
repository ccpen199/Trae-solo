import { Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, MessageSquareWarning, CheckSquare, TrendingUp, Award, Eye, Clock, Calendar, Scale, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

const stats = [
  { label: '用户总数', value: '12,845', icon: Users, color: 'text-primary', bg: 'bg-primary/10', change: '+12%' },
  { label: '评测报告', value: '2,480', icon: FileText, color: 'text-accent', bg: 'bg-accent/10', change: '+8%' },
  { label: '注册品牌', value: '356', icon: Award, color: 'text-warning', bg: 'bg-warning/10', change: '+5%' },
  { label: '活跃评测员', value: '128', icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-400/10', change: '+15%' },
];

const reportTrend = [
  { date: '1月', 发布: 128, 审核: 35 },
  { date: '2月', 发布: 145, 审核: 42 },
  { date: '3月', 发布: 168, 审核: 38 },
  { date: '4月', 发布: 192, 审核: 51 },
  { date: '5月', 发布: 215, 审核: 46 },
  { date: '6月', 发布: 248, 审核: 58 },
];

const userGrowth = [
  { name: '1月', 用户: 520 },
  { name: '2月', 用户: 680 },
  { name: '3月', 用户: 850 },
  { name: '4月', 用户: 1120 },
  { name: '5月', 用户: 1380 },
  { name: '6月', 用户: 1650 },
];

const pendingReviews = [
  { id: 103, title: '海天酱油添加剂安全分析报告', reviewer: '张明', status: 'cross_validating', date: '2025-06-02' },
  { id: 104, title: '新东方教育服务质量评测', reviewer: '李华', status: 'reviewing', date: '2025-06-08' },
  { id: 105, title: '携程旅行用户满意度调查', reviewer: '王芳', status: 'submitted', date: '2025-06-12' },
];

const pendingAppeals = [
  { id: 1, brand: '蒙牛乳业', title: '关于数据抽样方法的异议', status: 'processing', date: '2025-06-12' },
  { id: 2, brand: '海天味业', title: '服务体验评分偏低申诉', status: 'pending', date: '2025-06-15' },
];

const categoryDistribution = [
  { name: '消费品牌', 报告数: 1240 },
  { name: '教育服务', 报告数: 520 },
  { name: '医疗健康', 报告数: 380 },
  { name: '旅游出行', 报告数: 340 },
];

export function AdminDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          管理面板
        </h1>
        <p className="text-slate-400 text-sm">系统运行概览与关键指标监控</p>
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
                <span className="text-xs text-primary flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/admin/plans" className="card p-5 hover:border-primary/30 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-medium text-white group-hover:text-primary">评测计划排期</div>
              <div className="text-xs text-slate-500">3个进行中计划</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/reviews" className="card p-5 hover:border-primary/30 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-white group-hover:text-primary">报告审核流</div>
              <div className="text-xs text-slate-500">5份待审核</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/appeals" className="card p-5 hover:border-primary/30 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-sm font-medium text-white group-hover:text-primary">品牌申诉通道</div>
              <div className="text-xs text-slate-500">2条待处理</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/weights" className="card p-5 hover:border-primary/30 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white group-hover:text-primary">权重配置</div>
              <div className="text-xs text-slate-500">4个领域权重</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">报告产出趋势</h3>
          <LineChart
            data={reportTrend}
            series={[
              { key: '发布', color: '#10B981', name: '已发布' },
              { key: '审核', color: '#F59E0B', name: '审核中' },
            ]}
            height={260}
          />
        </div>
        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">新用户增长</h3>
          <BarChart
            data={userGrowth}
            series={[{ key: '用户', color: '#6366F1', name: '新增用户' }]}
            height={260}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Reviews */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-white">待审核报告</h3>
            <Link to="/admin/reviews" className="text-sm text-primary hover:text-primary-dark">查看全部</Link>
          </div>
          <div className="space-y-3">
            {pendingReviews.map((review) => (
              <div key={review.id} className="flex items-center gap-4 p-3 rounded bg-surface-light/30 hover:bg-surface-light/50 transition-colors">
                <ScoreRing score={85} size={40} strokeWidth={4} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <Link to={`/report/${review.id}`} className="text-sm font-medium text-white hover:text-primary truncate block">
                    {review.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>评测员：{review.reviewer}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {review.date}
                    </span>
                  </div>
                </div>
                <StatusBadge status={review.status as any} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="card p-5">
            <h3 className="font-serif font-semibold text-white mb-4">领域报告分布</h3>
            <div className="space-y-3">
              {categoryDistribution.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-white font-medium">{cat.报告数}</span>
                  </div>
                  <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      style={{ width: `${(cat.报告数 / 1240) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Appeals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-white flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-warning" />
                待处理申诉
              </h3>
              <Link to="/admin/appeals" className="text-sm text-primary hover:text-primary-dark">处理</Link>
            </div>
            <div className="space-y-2">
              {pendingAppeals.map((appeal) => (
                <div key={appeal.id} className="p-3 rounded bg-surface-light/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{appeal.brand}</span>
                    <StatusBadge status={appeal.status as any} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{appeal.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewer Qualification */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                评测员资质复查
              </h3>
              <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded border border-warning/30">3人待复核</span>
            </div>
            <div className="space-y-2">
              {[
                { name: '赵强', field: '食品科学', score: 87, period: '2026-Q2', status: 'pending' },
                { name: '刘伟', field: '教育行业', score: 92, period: '2026-Q2', status: 'pending' },
                { name: '周明', field: '医疗健康', score: 78, period: '2026-Q2', status: 'pending' },
              ].map((r) => (
                <div key={r.name} className="p-3 rounded bg-surface-light/30 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.field} · 质量分 {r.score} · {r.period}</div>
                  </div>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">通过</button>
                    <button className="px-2 py-1 rounded text-xs bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20">拒绝</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
