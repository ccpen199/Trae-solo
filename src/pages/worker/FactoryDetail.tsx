import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  TrendingUp,
  Factory as FactoryIcon,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Star,
  Sparkles,
  Loader2,
  Clock,
  AlertOctagon
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import JobCard from '@/components/JobCard';
import EhsBadge from '@/components/ui/EhsBadge';
import WhitelistBadge from '@/components/ui/WhitelistBadge';
import type { Factory, Job, SafetyRecord, InterviewSummary } from '@shared/types';

const keywordColors = [
  'bg-brand-50 text-brand-600',
  'bg-accent-50 text-accent-600',
  'bg-success-50 text-success-600',
  'bg-purple-50 text-purple-600',
  'bg-pink-50 text-pink-600',
  'bg-cyan-50 text-cyan-600',
];

const safetyIcon = (type: SafetyRecord['type']) => {
  switch (type) {
    case 'incident': return AlertOctagon;
    case 'audit': return FileCheck;
    case 'training': return Activity;
  }
};

const safetyColor = (level: SafetyRecord['level']) => {
  switch (level) {
    case 'major': return { icon: 'text-danger-500', bg: 'bg-danger-50', dot: 'bg-danger-500' };
    case 'minor': return { icon: 'text-warning-500', bg: 'bg-warning-50', dot: 'bg-warning-500' };
    default: return { icon: 'text-success-500', bg: 'bg-success-50', dot: 'bg-success-500' };
  }
};

const safetyTypeLabel = (type: SafetyRecord['type']) => {
  switch (type) {
    case 'incident': return '事故记录';
    case 'audit': return '安全审计';
    case 'training': return '安全培训';
  }
};

export default function FactoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [jobs, setJobs] = useState<(Job & { factory?: Factory })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [fRes, jRes] = await Promise.all([
        get<Factory>(`/factories/${id}`),
        get<Job[]>(`/jobs?factoryId=${id}`),
      ]);

      if (fRes.success && fRes.data) {
        setFactory(fRes.data);
      } else {
        throw new Error(fRes.error || '加载工厂详情失败');
      }

      if (jRes.success && jRes.data) {
        const enriched = jRes.data.map((j: Job) => ({
          ...j,
          factory: fRes.data,
        }));
        setJobs(enriched);
      }
    } catch (e) {
      console.error(e);
      setError('加载工厂详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!factory || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <AlertTriangle size={48} className="text-danger-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-2">工厂不存在</h2>
        <p className="text-sm text-gray-500 mb-4">{error || '该工厂可能已下架'}</p>
        <button onClick={() => navigate('/worker')} className="px-6 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-4 pt-12 pb-16 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

          <div className="relative">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-5 border border-white/20 active:scale-95 transition-transform">
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white/25 backdrop-blur border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 size={40} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="text-xl font-bold leading-tight truncate">{factory.name}</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <EhsBadge rating={factory.ehsRating} size="sm" />
                  <WhitelistBadge status={factory.whitelistStatus} />
                </div>
                <div className="text-xs text-white/80 mt-2 flex items-center gap-1.5">
                  <span>{factory.industry}</span>
                  <span>·</span>
                  <span>{factory.scale}</span>
                </div>
                <div className="text-xs text-white/70 mt-1 flex items-center gap-1">
                  <MapPin size={12} className="flex-shrink-0" />
                  {factory.region} · {factory.address}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-10">
          <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
            <div className="flex items-center gap-5">
              <div className={cn(
                'w-28 h-28 rounded-3xl flex flex-col items-center justify-center shadow-lg',
                factory.ehsRating === 'A' && 'bg-gradient-to-br from-success-400 to-success-600',
                factory.ehsRating === 'B' && 'bg-gradient-to-br from-brand-400 to-brand-600',
                factory.ehsRating === 'C' && 'bg-gradient-to-br from-warning-400 to-warning-600',
                factory.ehsRating === 'D' && 'bg-gradient-to-br from-danger-400 to-danger-600'
              )}>
                <ShieldCheck size={28} className="text-white mb-1" />
                <div className="text-4xl font-black text-white tabular-nums tracking-tight">{factory.ehsScore}</div>
                <div className="text-[10px] text-white/90 font-medium">分</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-bold text-gray-900">EHS安全评级</h2>
                  <EhsBadge rating={factory.ehsRating} score={factory.ehsScore} size="sm" showScore />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="text-lg font-bold text-success-600 tabular-nums">
                      {factory.safetyRecords.filter(r => r.level === 'normal').length}
                    </div>
                    <div className="text-[10px] text-gray-500">达标项</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="text-lg font-bold text-warning-600 tabular-nums">
                      {factory.safetyRecords.filter(r => r.level === 'minor').length}
                    </div>
                    <div className="text-[10px] text-gray-500">轻微</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="text-lg font-bold text-danger-600 tabular-nums">
                      {factory.safetyRecords.filter(r => r.level === 'major').length}
                    </div>
                    <div className="text-[10px] text-gray-500">重大</div>
                  </div>
                </div>
              </div>
            </div>

            {factory.safetyRecords.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                  <Clock size={14} className="text-brand-500" />
                  安全记录
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {factory.safetyRecords.map(record => {
                    const Icon = safetyIcon(record.type);
                    const sc = safetyColor(record.level);
                    return (
                      <div key={record.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', sc.bg)}>
                          <Icon size={18} className={sc.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-800">{safetyTypeLabel(record.type)}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                              <span className="text-[10px] text-gray-400 tabular-nums">{record.date.slice(0, 10)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{record.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-3xl shadow-card p-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-accent-500" />
              真实产能数据
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-2xl p-4 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
                    <FactoryIcon size={16} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">日均产量</span>
                </div>
                <div className="text-2xl font-black text-brand-700 tabular-nums">
                  {factory.dailyCapacity.toLocaleString()}
                  <span className="text-sm font-semibold ml-0.5">件</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-accent-50 to-accent-100/50 rounded-2xl p-4 border border-accent-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center shadow-sm">
                    <TrendingUp size={16} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">产能利用率</span>
                </div>
                <div className="text-2xl font-black text-accent-700 tabular-nums">
                  {factory.capacityUtilization}
                  <span className="text-sm font-semibold ml-0.5">%</span>
                </div>
              </div>
            </div>

            {factory.seasonNote && (
              <div className="bg-gradient-to-br from-warning-50 via-accent-50 to-orange-50 rounded-2xl p-4 border border-warning-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-warning-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <AlertTriangle size={14} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 mb-1">淡旺季说明</div>
                    <p className="text-xs text-gray-600 leading-relaxed">{factory.seasonNote}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {factory.interviewSummaries.length > 0 && (
          <div className="px-4 mt-5">
            <div className="bg-white rounded-3xl shadow-card p-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-purple-500" />
                员工访谈录音摘要
              </h2>
              <div className="space-y-4">
                {factory.interviewSummaries.map((summary: InterviewSummary, si: number) => (
                  <div key={summary.id} className={cn(si > 0 && 'pt-4 border-t border-gray-100')}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={14} className={cn(s <= summary.satisfaction ? 'text-warning-400 fill-warning-400' : 'text-gray-200')} />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900 tabular-nums">{summary.satisfaction}.0</span>
                      <span className="text-xs text-gray-400">满意度</span>
                      <span className="ml-auto text-[10px] text-gray-400 tabular-nums">{summary.recordedAt.slice(0, 10)}</span>
                    </div>

                    {summary.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {summary.keywords.map((k, ki) => (
                          <span key={ki} className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', keywordColors[ki % keywordColors.length])}>
                            {k}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 leading-relaxed">{summary.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-success-500" />
                在招岗位
              </h2>
              <span className="text-xs text-brand-500 font-medium bg-brand-50 px-2.5 py-1 rounded-full">
                共 {jobs.length} 个
              </span>
            </div>
            <div className="space-y-3">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} onFactoryClick={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
