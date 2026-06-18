import { useState } from 'react';
import { BarChart3, MessageSquareWarning, TrendingUp, PieChart, GitCompare, Building2, Calendar } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { RadarChart } from '@/components/charts/RadarChart';

const scoreTrend = [
  { date: '1月', 蒙牛: 88, 伊利: 87, 光明: 84 },
  { date: '2月', 蒙牛: 89, 伊利: 86, 光明: 85 },
  { date: '3月', 蒙牛: 90, 伊利: 87, 光明: 85 },
  { date: '4月', 蒙牛: 91, 伊利: 88, 光明: 84 },
  { date: '5月', 蒙牛: 91, 伊利: 89, 光明: 83 },
  { date: '6月', 蒙牛: 92, 伊利: 87, 光明: 84 },
];

const complaintData = [
  { name: '周一', 蒙牛: 4, 伊利: 5, 光明: 3 },
  { name: '周二', 蒙牛: 5, 伊利: 4, 光明: 4 },
  { name: '周三', 蒙牛: 3, 伊利: 6, 光明: 2 },
  { name: '周四', 蒙牛: 4, 伊利: 5, 光明: 3 },
  { name: '周五', 蒙牛: 3, 伊利: 4, 光明: 5 },
  { name: '周六', 蒙牛: 2, 伊利: 3, 光明: 2 },
  { name: '周日', 蒙牛: 2, 伊利: 4, 光明: 3 },
];

const radarData = [
  { dimension: '产品质量', 蒙牛: 94, 伊利: 88, 光明: 85 },
  { dimension: '服务体验', 蒙牛: 88, 伊利: 86, 光明: 82 },
  { dimension: '品牌信誉', 蒙牛: 92, 伊利: 89, 光明: 84 },
  { dimension: '价格公道', 蒙牛: 86, 伊利: 84, 光明: 88 },
  { dimension: '创新能力', 蒙牛: 89, 伊利: 85, 光明: 80 },
];

const sentimentDistribution = [
  { name: '正面', value: 72, color: '#10B981' },
  { name: '中性', value: 20, color: '#F59E0B' },
  { name: '负面', value: 8, color: '#EF4444' },
];

const topComplaints = [
  { category: '产品包装', count: 8, trend: 'down', change: -2 },
  { category: '物流配送', count: 6, trend: 'stable', change: 0 },
  { category: '售后服务', count: 4, trend: 'down', change: -3 },
  { category: '产品质量', count: 3, trend: 'stable', change: 0 },
  { category: '价格问题', count: 2, trend: 'up', change: 1 },
];

export function ReputationBoard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            舆情看板
          </h1>
          <p className="text-slate-400 text-sm">实时监控品牌声誉数据，洞察市场反馈</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                timeRange === range
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-slate-400 hover:text-white hover:bg-surface-light'
              }`}
            >
              {range === '7d' ? '近7天' : range === '30d' ? '近30天' : range === '90d' ? '近90天' : '近1年'}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <ScoreRing score={92} size={72} strokeWidth={6} showLabel={false} />
          <div>
            <div className="text-2xl font-bold text-white">92</div>
            <div className="text-sm text-slate-400">综合声誉评分</div>
            <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +2 较上月
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareWarning className="w-4 h-4 text-warning" />
            <span className="text-sm text-slate-400">本月投诉</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">23</div>
          <div className="text-xs text-primary">↓ 17.9% 较上月</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-primary" />
            <span className="text-sm text-slate-400">正面声量占比</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">72%</div>
          <div className="text-xs text-primary">↑ 3.2% 较上月</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-accent" />
            <span className="text-sm text-slate-400">竞品对比排名</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">No.1</div>
          <div className="text-xs text-slate-500">乳制品行业</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">声誉评分趋势</h3>
          <LineChart
            data={scoreTrend}
            series={[
              { key: '蒙牛', color: '#10B981', name: '蒙牛乳业' },
              { key: '伊利', color: '#6366F1', name: '伊利集团' },
              { key: '光明', color: '#F59E0B', name: '光明乳业' },
            ]}
            height={280}
          />
        </div>

        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">周投诉量对比</h3>
          <BarChart
            data={complaintData}
            series={[
              { key: '蒙牛', color: '#10B981', name: '蒙牛乳业' },
              { key: '伊利', color: '#6366F1', name: '伊利集团' },
              { key: '光明', color: '#F59E0B', name: '光明乳业' },
            ]}
            height={280}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            竞品维度对比
          </h3>
          <RadarChart
            data={radarData}
            series={[
              { key: '蒙牛', color: '#10B981', name: '蒙牛乳业' },
              { key: '伊利', color: '#6366F1', name: '伊利集团' },
              { key: '光明', color: '#F59E0B', name: '光明乳业' },
            ]}
            height={320}
          />
        </div>

        <div className="card p-5">
          <h3 className="font-serif font-semibold text-white mb-4">情感分布</h3>
          <div className="space-y-4">
            {sentimentDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-medium text-white">{item.value}%</span>
                </div>
                <div className="h-2.5 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">总声量：128,450 条</p>
            <div className="flex gap-4 text-xs">
              <span className="text-primary">正面 92,484</span>
              <span className="text-warning">中性 25,690</span>
              <span className="text-danger">负面 10,276</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Complaints */}
      <div className="card p-5">
        <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-warning" />
          投诉类型统计
        </h3>
        <div className="space-y-3">
          {topComplaints.map((item) => (
            <div key={item.category} className="flex items-center gap-4">
              <span className="text-sm text-slate-300 w-24">{item.category}</span>
              <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-warning to-warning/60 rounded-full"
                  style={{ width: `${(item.count / 8) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-white w-10 text-right">{item.count}</span>
              <span className="text-xs">
                {item.trend === 'down' && <span className="text-primary">↓ {Math.abs(item.change)}</span>}
                {item.trend === 'up' && <span className="text-danger">↑ {item.change}</span>}
                {item.trend === 'stable' && <span className="text-slate-500">持平</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReputationBoard;
