import { useEffect, useState } from 'react';
import { Activity, Plus, FileText, CheckCircle, Lightbulb, Leaf, Zap, DollarSign, TrendingUp, Clock, Calendar, Target, ChevronRight, X } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  startDate?: string;
  completedDate?: string;
  actualSavings?: number;
}

interface Report {
  id: string;
  date: string;
  period: string;
  overallScore: number;
  previousScore?: number;
  items: { category: string; score: number; description: string; benchmark: number }[];
  recommendations: Recommendation[];
  estimatedSavings: number;
  actualSavingsToDate: number;
  status: 'draft' | 'generated' | 'in_implementation' | 'completed';
  totalKwh: number;
  peakKwh: number;
  valleyKwh: number;
  flatKwh: number;
}

const generateMockReport = (id: string, date: string): Report => ({
  id,
  date,
  period: `${dayjs(date).subtract(1, 'month').format('YYYY年MM月')}`,
  overallScore: Math.floor(Math.random() * 25) + 70,
  previousScore: Math.floor(Math.random() * 20) + 65,
  items: [
    { category: '用电效率', score: 75, description: '空调系统可优化运行时间', benchmark: 80 },
    { category: '峰谷用电', score: 82, description: '谷时用电比例良好', benchmark: 75 },
    { category: '设备能效', score: 70, description: '部分设备老化，建议更新', benchmark: 78 },
    { category: '照明系统', score: 85, description: '已更换LED灯具，效果良好', benchmark: 80 },
    { category: '功率因数', score: 78, description: '功率因数0.88，建议提升至0.9以上', benchmark: 85 },
  ],
  recommendations: [
    { id: '1', title: '调整空调温度设置', description: '将夏季空调温度从24℃调整为26℃，预计每月节省5%电费', impact: 'high', category: '空调', status: 'in_progress', progress: 60, startDate: '2026-06-01', actualSavings: 320 },
    { id: '2', title: '错峰生产安排', description: '将部分生产工序转移至谷时(23:00-7:00)进行，可降低高峰电费开支', impact: 'high', category: '生产', status: 'pending', progress: 0 },
    { id: '3', title: '更换节能设备', description: '部分老旧设备能效较低，建议列入下季度更新计划', impact: 'medium', category: '设备', status: 'completed', progress: 100, startDate: '2026-05-10', completedDate: '2026-05-28', actualSavings: 850 },
    { id: '4', title: '优化照明控制', description: '公共区域安装人体感应开关，避免无效照明', impact: 'low', category: '照明', status: 'completed', progress: 100, startDate: '2026-05-01', completedDate: '2026-05-15', actualSavings: 180 },
    { id: '5', title: '功率因数补偿', description: '安装无功补偿装置，将功率因数提升至0.92以上', impact: 'medium', category: '电气', status: 'pending', progress: 0 },
  ],
  estimatedSavings: 1800 + Math.floor(Math.random() * 500),
  actualSavingsToDate: 1350,
  status: 'in_implementation',
  totalKwh: 12580 + Math.floor(Math.random() * 2000),
  peakKwh: 5200,
  valleyKwh: 3800,
  flatKwh: 3580,
});

const mockReports: Report[] = [
  generateMockReport('r1', '2026-06-01'),
  generateMockReport('r2', '2026-05-01'),
  generateMockReport('r3', '2026-04-01'),
];

export default function EfficiencyReport() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<Report>(mockReports[0]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Report[]>('/energy/efficiency');
        if (res.length > 0) {
          setReports(res);
          setCurrent(res[0]);
        }
      } catch {
        setReports(mockReports);
        setCurrent(mockReports[0]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post<Report>('/energy/efficiency/generate');
      setReports((prev) => [res, ...prev]);
      setCurrent(res);
    } catch {
      const newReport = generateMockReport('r' + Date.now(), dayjs().format('YYYY-MM-DD'));
      setReports((prev) => [newReport, ...prev]);
      setCurrent(newReport);
    } finally {
      setGenerating(false);
    }
  };

  const updateRecommendationStatus = (recId: string, status: Recommendation['status']) => {
    const updatedRecs = current.recommendations.map((r) =>
      r.id === recId
        ? {
            ...r,
            status,
            progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
            startDate: status !== 'pending' ? dayjs().format('YYYY-MM-DD') : r.startDate,
            completedDate: status === 'completed' ? dayjs().format('YYYY-MM-DD') : r.completedDate,
            actualSavings: status === 'completed' ? Math.floor(Math.random() * 500) + 100 : r.actualSavings,
          }
        : r
    );
    const updatedReport = { ...current, recommendations: updatedRecs };
    setCurrent(updatedReport);
    setReports((prev) => prev.map((r) => (r.id === current.id ? updatedReport : r)));
  };

  const scoreChange = current.overallScore - (current.previousScore || 0);
  const completedRecs = current.recommendations.filter((r) => r.status === 'completed').length;
  const totalRecs = current.recommendations.length;
  const implementationRate = Math.round((completedRecs / totalRecs) * 100);

  const impactColor = (i: string) => (i === 'high' ? 'text-csg-red' : i === 'medium' ? 'text-csg-amber' : 'text-csg-green');
  const impactBadge = (i: string) => (i === 'high' ? 'badge-red' : i === 'medium' ? 'badge-amber' : 'badge-green');
  const scoreColor = (s: number) => (s >= 80 ? 'text-csg-green' : s >= 60 ? 'text-csg-amber' : 'text-csg-red');
  const statusBadge = (s: string) => {
    if (s === 'completed') return 'badge-green';
    if (s === 'in_progress') return 'badge-amber';
    return 'badge-gray';
  };
  const statusLabel = (s: string) => {
    if (s === 'completed') return '已完成';
    if (s === 'in_progress') return '进行中';
    return '待开始';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Activity size={28} className="text-csg-green" />
          <div>
            <h1 className="page-title">能效诊断</h1>
            <p className="page-desc">全面评估用电效率，追踪优化建议落地效果</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTimeline(true)} className="btn-outline flex items-center gap-1.5">
            <Clock size={16} /> 实施进度
          </button>
          <button onClick={handleGenerate} disabled={generating} className="btn-secondary flex items-center gap-1.5">
            <Plus size={16} />
            {generating ? '生成中...' : '生成新报告'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {reports.slice(0, 6).map((r) => (
          <button
            key={r.id}
            onClick={() => setCurrent(r)}
            className={`px-4 py-2 rounded-lg text-sm border whitespace-nowrap flex-shrink-0 ${current.id === r.id ? 'border-csg-green bg-csg-green/10 text-csg-green' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
          >
            <FileText size={14} className="inline mr-1.5" />
            {r.period} · {r.overallScore}分
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">综合能效评分</span>
              <span className={`stat-value ${scoreColor(current.overallScore)}`}>{current.overallScore}</span>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${current.overallScore >= 80 ? 'bg-csg-green/10' : current.overallScore >= 60 ? 'bg-csg-amber/10' : 'bg-csg-red/10'}`}>
              <Target size={20} className={scoreColor(current.overallScore)} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp size={12} className={scoreChange >= 0 ? 'text-csg-green' : 'text-csg-red'} />
            <span className={scoreChange >= 0 ? 'text-csg-green' : 'text-csg-red'}>
              {scoreChange >= 0 ? '+' : ''}{scoreChange} 分 vs 上月
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">诊断周期</span>
              <span className="stat-value">{current.period}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-csg-navy/10 flex items-center justify-center">
              <Calendar size={20} className="text-csg-navy" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            用电总量 {current.totalKwh.toLocaleString()} kWh
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">优化建议</span>
              <span className="stat-value">{completedRecs}/{totalRecs}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-csg-amber/10 flex items-center justify-center">
              <Lightbulb size={20} className="text-csg-amber" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-csg-green rounded-full transition-all" style={{ width: `${implementationRate}%` }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">实施率 {implementationRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">已节省电费</span>
              <span className="stat-value text-csg-green">¥{current.actualSavingsToDate.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-csg-green/10 flex items-center justify-center">
              <DollarSign size={20} className="text-csg-green" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            目标 ¥{current.estimatedSavings.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">能效评分趋势</h3>
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" strokeWidth="14" className="text-gray-200 dark:text-gray-700" stroke="currentColor" />
              <circle
                cx="80" cy="80" r="70" fill="none" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${(current.overallScore / 100) * 440} 440`}
                className={scoreColor(current.overallScore)}
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${scoreColor(current.overallScore)}`}>{current.overallScore}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">综合评分</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-csg-green" />
              <span className="text-gray-600 dark:text-gray-300">优秀 ≥80</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-csg-amber" />
              <span className="text-gray-600 dark:text-gray-300">良好 60-79</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-csg-red" />
              <span className="text-gray-600 dark:text-gray-300">需改善 &lt;60</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">各项指标得分</h3>
          <div className="space-y-4">
            {current.items.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-200">{item.category}</span>
                    <span className="text-xs text-gray-400">基准 {item.benchmark}分</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${scoreColor(item.score)}`}>{item.score} 分</span>
                    <span className={`text-xs ${item.score >= item.benchmark ? 'text-csg-green' : 'text-csg-amber'}`}>
                      {item.score >= item.benchmark ? '✓ 达标' : `${item.benchmark - item.score}分差距`}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-gray-300 dark:bg-gray-600 rounded-full"
                    style={{ width: `${item.benchmark}%` }}
                  />
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${item.score >= 80 ? 'bg-csg-green' : item.score >= 60 ? 'bg-csg-amber' : 'bg-csg-red'}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">优化建议与落地追踪</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-csg-green">预计年节省 ¥{current.estimatedSavings.toLocaleString()}</span>
          </div>
        </div>
        <div className="space-y-3">
          {current.recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                rec.status === 'completed'
                  ? 'bg-csg-green/5 dark:bg-csg-green/10 border-csg-green/20'
                  : rec.status === 'in_progress'
                  ? 'bg-csg-amber/5 dark:bg-csg-amber/10 border-csg-amber/20'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }`}
              onClick={() => setSelectedRec(rec)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  rec.status === 'completed' ? 'bg-csg-green/20' : rec.status === 'in_progress' ? 'bg-csg-amber/20' : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                  {rec.status === 'completed' ? (
                    <CheckCircle size={20} className="text-csg-green" />
                  ) : rec.status === 'in_progress' ? (
                    <Clock size={20} className="text-csg-amber" />
                  ) : (
                    <Lightbulb size={20} className="text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white">{rec.title}</span>
                    <span className={impactBadge(rec.impact)}>
                      {rec.impact === 'high' ? '高影响' : rec.impact === 'medium' ? '中影响' : '低影响'}
                    </span>
                    <span className="badge-blue">{rec.category}</span>
                    <span className={statusBadge(rec.status)}>{statusLabel(rec.status)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {rec.startDate && <span>开始: {rec.startDate}</span>}
                    {rec.completedDate && <span>完成: {rec.completedDate}</span>}
                    {rec.actualSavings && <span className="text-csg-green">已节省 ¥{rec.actualSavings}</span>}
                    {rec.status !== 'completed' && (
                      <span>进度 {rec.progress}%</span>
                    )}
                  </div>
                  {rec.status !== 'completed' && (
                    <div className="mt-2 w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${rec.status === 'in_progress' ? 'bg-csg-amber' : 'bg-gray-400'}`}
                        style={{ width: `${rec.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight size={20} className="text-gray-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <DollarSign size={18} className="text-csg-green mb-1" />
          <span className="stat-label">预计年节省</span>
          <span className="stat-value text-csg-green">¥{current.estimatedSavings.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <Leaf size={18} className="text-blue-500 mb-1" />
          <span className="stat-label">预计碳减排</span>
          <span className="stat-value">{(current.estimatedSavings * 0.0009).toFixed(1)} 吨</span>
        </div>
        <div className="stat-card">
          <Zap size={18} className="text-csg-amber mb-1" />
          <span className="stat-label">预计节电</span>
          <span className="stat-value">{Math.round(current.estimatedSavings / 0.7)} kWh</span>
        </div>
      </div>

      {selectedRec && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">建议详情</h3>
              <button onClick={() => setSelectedRec(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{selectedRec.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRec.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">影响程度</p>
                  <p className={`font-semibold ${impactColor(selectedRec.impact)}`}>
                    {selectedRec.impact === 'high' ? '高影响' : selectedRec.impact === 'medium' ? '中影响' : '低影响'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">分类</p>
                  <p className="font-semibold text-csg-navy dark:text-white">{selectedRec.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">当前状态</p>
                  <p className="font-semibold">{statusLabel(selectedRec.status)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">实施进度</p>
                  <p className="font-semibold">{selectedRec.progress}%</p>
                </div>
              </div>
              {selectedRec.status !== 'completed' && (
                <div className="flex gap-2 pt-2">
                  {selectedRec.status === 'pending' && (
                    <button
                      onClick={() => { updateRecommendationStatus(selectedRec.id, 'in_progress'); setSelectedRec(null); }}
                      className="btn-secondary flex-1"
                    >
                      开始实施
                    </button>
                  )}
                  {selectedRec.status === 'in_progress' && (
                    <button
                      onClick={() => { updateRecommendationStatus(selectedRec.id, 'completed'); setSelectedRec(null); }}
                      className="btn-secondary flex-1 bg-csg-green hover:bg-csg-green/90"
                    >
                      标记完成
                    </button>
                  )}
                  <button onClick={() => setSelectedRec(null)} className="btn-outline flex-1">
                    关闭
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTimeline && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">能效提升全流程时间线</h3>
              <button onClick={() => setShowTimeline(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              {[
                { date: current.date, title: '诊断报告生成', desc: `完成${current.period}用电数据分析，生成能效诊断报告`, status: 'completed' },
                { date: dayjs(current.date).add(1, 'day').format('YYYY-MM-DD'), title: '优化建议评审', desc: '管理团队评审优化建议，确定实施优先级', status: 'completed' },
                { date: dayjs(current.date).add(3, 'day').format('YYYY-MM-DD'), title: '项目立项', desc: `确立${completedRecs}项优化措施，分配责任人与预算`, status: 'completed' },
                { date: dayjs(current.date).add(7, 'day').format('YYYY-MM-DD'), title: '实施阶段', desc: `已完成${completedRecs}项，进行中${current.recommendations.filter(r => r.status === 'in_progress').length}项`, status: current.recommendations.some(r => r.status !== 'completed') ? 'in_progress' : 'completed' },
                { date: dayjs(current.date).add(30, 'day').format('YYYY-MM-DD'), title: '效果验证', desc: `预计节省 ¥${current.estimatedSavings.toLocaleString()}，已验证 ¥${current.actualSavingsToDate.toLocaleString()}`, status: 'pending' },
                { date: dayjs(current.date).add(35, 'day').format('YYYY-MM-DD'), title: '流程闭环', desc: '总结优化经验，更新能效基准，启动下一轮诊断', status: 'pending' },
              ].map((event, i) => (
                <div key={i} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-1.5 w-5 h-5 rounded-full border-4 ${
                    event.status === 'completed' ? 'bg-csg-green border-csg-green/30' :
                    event.status === 'in_progress' ? 'bg-csg-amber border-csg-amber/30' :
                    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`} />
                  <div className={`p-4 rounded-lg ${
                    event.status === 'completed' ? 'bg-csg-green/5 dark:bg-csg-green/10' :
                    event.status === 'in_progress' ? 'bg-csg-amber/5 dark:bg-csg-amber/10' :
                    'bg-gray-50 dark:bg-gray-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{event.title}</span>
                      <span className={`text-xs ${statusBadge(event.status)}`}>
                        {event.status === 'completed' ? '已完成' : event.status === 'in_progress' ? '进行中' : '待开始'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{event.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
