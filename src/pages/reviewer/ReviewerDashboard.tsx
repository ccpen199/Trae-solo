import { Link } from 'react-router-dom';
import { FileText, Award, ClipboardList, TrendingUp, Clock, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

const stats = [
  { label: '已完成报告', value: 42, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  { label: '进行中任务', value: 3, icon: ClipboardList, color: 'text-warning', bg: 'bg-warning/10' },
  { label: '本月奖励', value: '¥8,650', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  { label: '质量评分', value: 94, icon: Award, color: 'text-primary', bg: 'bg-primary/10' },
];

const monthlyData = [
  { name: '1月', 报告数: 5, 奖励: 980 },
  { name: '2月', 报告数: 7, 奖励: 1420 },
  { name: '3月', 报告数: 6, 奖励: 1150 },
  { name: '4月', 报告数: 8, 奖励: 1680 },
  { name: '5月', 报告数: 9, 奖励: 1890 },
  { name: '6月', 报告数: 7, 奖励: 1530 },
];

const qualityData = [
  { date: '1月', 评分: 91 },
  { date: '2月', 评分: 92 },
  { date: '3月', 评分: 93 },
  { date: '4月', 评分: 92 },
  { date: '5月', 评分: 94 },
  { date: '6月', 评分: 94 },
];

const recentTasks = [
  { id: 1, title: '2025Q2液态奶品质评测', target: '伊利集团', deadline: '2025-06-25', reward: 680, status: 'assigned' },
  { id: 2, title: '婴幼儿奶粉安全指标评测', target: '飞鹤乳业', deadline: '2025-06-30', reward: 850, status: 'assigned' },
  { id: 3, title: '功能饮料用户满意度调查', target: '东鹏特饮', deadline: '2025-07-05', reward: 520, status: 'open' },
];

const recentReports = [
  { id: 101, title: '蒙牛乳业综合可信评价报告', score: 92, status: 'published', date: '2025-06-10' },
  { id: 102, title: '农夫山泉水源品质评测', score: 89, status: 'approved', date: '2025-06-05' },
  { id: 103, title: '海天酱油添加剂安全分析', score: 85, status: 'cross_validating', date: '2025-06-02' },
];

export function ReviewerDashboard() {
  return (
    <div className="p-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white mb-1">欢迎回来，评测员张明</h1>
        <p className="text-slate-400 text-sm">今天是 2025年6月17日 · 您已累计完成 42 份评测报告</p>
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
                <TrendingUp className="w-4 h-4 text-primary" />
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
          <h3 className="font-serif font-semibold text-white mb-4">月度报告与奖励</h3>
          <BarChart
            data={monthlyData}
            series={[
              { key: '报告数', color: '#10B981', name: '报告数' },
              { key: '奖励', color: '#6366F1', name: '奖励(¥)' },
            ]}
            height={260}
          />
        </div>
        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">质量评分趋势</h3>
          <LineChart
            data={qualityData}
            series={[{ key: '评分', color: '#10B981', name: '质量分' }]}
            height={260}
          />
        </div>
      </div>

      {/* Quality Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 flex flex-col items-center justify-center">
          <ScoreRing score={94} size={120} strokeWidth={10} label="质量评分" />
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning/10 text-warning text-sm border border-warning/30">
              <Star className="w-4 h-4" />
              S级评测员
            </div>
            <p className="text-xs text-slate-500 mt-2">距离下一等级还差 230 积分</p>
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-white">近期任务</h3>
            <Link to="/reviewer/tasks" className="text-sm text-primary hover:text-primary-dark">查看全部</Link>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded bg-surface-light/30 hover:bg-surface-light/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{task.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{task.target}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      截止 {task.deadline}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">¥{task.reward}</div>
                  <StatusBadge status={task.status as any} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-semibold text-white">近期报告</h3>
          <Link to="/reviewer/reports" className="text-sm text-primary hover:text-primary-dark">查看全部</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-light/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">报告标题</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase w-20">评分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase w-24">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase w-24">日期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentReports.map((r) => (
                <tr key={r.id} className="hover:bg-surface-light/20">
                  <td className="px-4 py-3">
                    <Link to={`/report/${r.id}`} className="text-sm text-white hover:text-primary">{r.title}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${r.score >= 85 ? 'text-primary' : r.score >= 70 ? 'text-warning' : 'text-danger'}`}>{r.score}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status as any} /></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReviewerDashboard;
