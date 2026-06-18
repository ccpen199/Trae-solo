import { Award, TrendingUp, AlertTriangle, Clock, CheckCircle2, Star } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

const scoreTrend = [
  { date: '1月', 评分: 91 },
  { date: '2月', 评分: 92 },
  { date: '3月', 评分: 93 },
  { date: '4月', 评分: 92 },
  { date: '5月', 评分: 94 },
  { date: '6月', 评分: 94 },
];

const dimensionScores = [
  { name: '数据准确性', score: 96 },
  { name: '报告完整性', score: 94 },
  { name: '分析深度', score: 92 },
  { name: '时效性', score: 93 },
  { name: '客观性', score: 95 },
];

const dimensionData = dimensionScores.map(d => ({ name: d.name, 评分: d.score }));

const deductionRecords = [
  { id: 1, date: '2025-06-08', report: '海天酱油添加剂安全分析报告', reason: '数据来源引用格式不规范', points: -2, type: 'minor' },
  { id: 2, date: '2025-05-20', report: '新东方教育服务质量评测', reason: '部分指标权重计算有误（已修正）', points: -3, type: 'minor' },
  { id: 3, date: '2025-04-15', report: '格力电器产品品质报告', reason: '报告被驳回，需补充抽检数据', points: -5, type: 'major' },
];

const achievements = [
  { id: 1, name: '新手评测员', desc: '完成首份评测报告', icon: Star, unlocked: true, date: '2025-01-15' },
  { id: 2, name: '月度之星', desc: '单月完成10份报告', icon: Award, unlocked: true, date: '2025-05-01' },
  { id: 3, name: '数据达人', desc: '连续30份报告零数据错误', icon: CheckCircle2, unlocked: true, date: '2025-06-01' },
  { id: 4, name: 'S级评测员', desc: '质量评分连续3月≥95', icon: TrendingUp, unlocked: false, date: null },
  { id: 5, name: '金牌评测', desc: '累计完成100份报告', icon: Award, unlocked: false, date: null },
];

const levelProgress = {
  currentLevel: 'S级评测员',
  nextLevel: 'SS级评测员',
  currentPoints: 4770,
  nextLevelPoints: 5000,
  reportsRequired: 15,
  reportsDone: 12,
};

export function QualityScore() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          质量评分详情
        </h1>
        <p className="text-slate-400 text-sm">您的评测质量评分由系统根据多维度指标自动计算</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Overall Score */}
        <div className="card p-6 flex flex-col items-center justify-center">
          <ScoreRing score={94} size={140} strokeWidth={12} label="综合评分" />
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium border border-warning/30 flex items-center gap-1">
              <Star className="w-4 h-4" />
              {levelProgress.currentLevel}
            </span>
          </div>
          <div className="mt-4 w-full">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>距离 {levelProgress.nextLevel}</span>
              <span>{levelProgress.currentPoints}/{levelProgress.nextLevelPoints} 积分</span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-warning to-primary rounded-full"
                style={{ width: `${(levelProgress.currentPoints / levelProgress.nextLevelPoints) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>还需完成 {levelProgress.reportsRequired - levelProgress.reportsDone} 份高质量报告</span>
            </div>
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-serif font-semibold text-white mb-4">维度评分</h3>
          <div className="space-y-3 mb-6">
            {dimensionScores.map((dim) => (
              <div key={dim.name} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-24">{dim.name}</span>
                <div className="flex-1 h-2.5 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dim.score >= 95 ? 'bg-primary' : dim.score >= 90 ? 'bg-primary/70' : 'bg-warning'
                    }`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-10 text-right">{dim.score}</span>
              </div>
            ))}
          </div>
          <BarChart
            data={dimensionData}
            series={[{ key: '评分', color: '#10B981' }]}
            height={180}
          />
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card p-6 mb-6">
        <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          评分趋势
        </h3>
        <LineChart
          data={scoreTrend}
          series={[{ key: '评分', color: '#10B981', name: '质量评分' }]}
          height={260}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deduction Records */}
        <div className="card p-6">
          <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            扣分记录
          </h3>
          <div className="space-y-3">
            {deductionRecords.map((record) => (
              <div key={record.id} className="p-4 bg-surface-light/30 rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-white text-sm">{record.report}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {record.date}
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${record.type === 'major' ? 'text-danger' : 'text-warning'}`}>
                    {record.points}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{record.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="card p-6">
          <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" />
            成就徽章
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((ach) => {
              const Icon = ach.icon;
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-md text-center transition-all ${
                    ach.unlocked
                      ? 'bg-gradient-to-br from-warning/15 to-primary/10 border border-warning/30'
                      : 'bg-surface-light/30 border border-slate-700/50 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    ach.unlocked ? 'bg-warning/20' : 'bg-slate-700'
                  }`}>
                    <Icon className={`w-5 h-5 ${ach.unlocked ? 'text-warning' : 'text-slate-500'}`} />
                  </div>
                  <div className={`text-sm font-medium ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>
                    {ach.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{ach.desc}</div>
                  {ach.unlocked && ach.date && (
                    <div className="text-xs text-primary mt-1.5">{ach.date}</div>
                  )}
                  {!ach.unlocked && (
                    <div className="text-xs text-slate-600 mt-1.5">未解锁</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityScore;
