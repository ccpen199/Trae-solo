import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Moon,
  UtensilsCrossed,
  Hotel,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Users,
  Building2,
  Car,
  Handshake,
  Briefcase,
  Award,
  Sparkles,
  Share2,
  Heart,
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { get, post } from '@/lib/api';
import type { Job, Factory, Worker, InterviewOrder } from '@shared/types';
import EhsBadge from '@/components/ui/EhsBadge';
import WhitelistBadge from '@/components/ui/WhitelistBadge';

const WORKER_ID = 'w-001';

const benefitColors = [
  'bg-brand-50 text-brand-600 border-brand-100',
  'bg-accent-50 text-accent-600 border-accent-100',
  'bg-success-50 text-success-600 border-success-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-warning-50 text-warning-600 border-warning-100',
  'bg-pink-50 text-pink-600 border-pink-100',
  'bg-cyan-50 text-cyan-600 border-cyan-100',
  'bg-indigo-50 text-indigo-600 border-indigo-100',
];

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [factory, setFactory] = useState<Factory | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const futureDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      iso,
      display: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: i === 0 ? '今天' : i === 1 ? '明天' : weekdays[d.getDay()],
      full: `${d.getMonth() + 1}月${d.getDate()}日`,
    };
  });

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobRes, workerRes] = await Promise.all([
        get<{ job: Job; factory: Factory }>(`/jobs/${id}`),
        get<Worker>(`/workers/${WORKER_ID}`),
      ]);

      if (jobRes.success && jobRes.data) {
        setJob(jobRes.data.job);
        setFactory(jobRes.data.factory);
        setSelectedDate(futureDates[0].iso);
      } else {
        throw new Error(jobRes.error || '加载岗位详情失败');
      }

      if (workerRes.success && workerRes.data) {
        setWorker(workerRes.data);
      }
    } catch (e) {
      console.error(e);
      setError('加载岗位详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleSubmit = async () => {
    if (!selectedDate || !job || !worker) return;
    setIsSubmitting(true);
    try {
      const res = await post<InterviewOrder>('/interviews', {
        workerId: WORKER_ID,
        workerName: worker.name,
        workerPhone: worker.phone,
        jobId: job.id,
        factoryId: job.factoryId,
        scheduledDate: selectedDate,
      });
      if (res.success) {
        setShowSuccessModal(true);
      } else {
        throw new Error(res.error || '预约失败');
      }
    } catch (e) {
      console.error(e);
      setError('预约失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!job || !factory) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-danger-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-2">岗位不存在</h2>
        <p className="text-sm text-gray-500 mb-4">{error || '该岗位可能已下架'}</p>
        <button onClick={() => navigate('/worker')} className="px-6 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-gray-900">岗位详情</h1>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
                <Share2 size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-warning-50 rounded-xl flex items-center gap-2 text-sm text-warning-700">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <div className="bg-gradient-to-br from-accent-500 via-accent-400 to-orange-300 text-white px-4 py-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-8 w-52 h-52 bg-white/15 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              {job.urgent && (
                <span className="bg-white/25 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Sparkles size={12} />急招
                </span>
              )}
              {job.highSubsidy && (
                <span className="bg-success-500/90 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Award size={12} />入职补贴高
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-1">{job.title}</h1>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <Building2 size={14} />
              <span>{factory.name}</span>
              {job.distanceKm !== undefined && (
                <>
                  <span className="text-white/50">·</span>
                  <span className="flex items-center gap-0.5"><MapPin size={14} />{job.distanceKm < 1 ? `${Math.round(job.distanceKm * 1000)}m` : `${job.distanceKm.toFixed(1)}km`}</span>
                </>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-4xl font-extrabold tracking-tight">¥{job.salaryRange.min.toLocaleString()}</span>
              <span className="text-2xl font-light text-white/80">-</span>
              <span className="text-4xl font-extrabold tracking-tight">{job.salaryRange.max.toLocaleString()}</span>
              <span className="ml-2 text-sm text-white/80 font-medium">/月</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/90">
              <span className="flex items-center gap-1"><Users size={14} />招 {job.vacancy} 人</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-brand-500" />
              工时与加班
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><Clock size={12} className="text-brand-500" />工时制度</div>
                <div className="font-bold text-gray-900 text-sm">{job.workHours}</div>
              </div>
              <div className="bg-accent-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><Moon size={12} className="text-accent-500" />加班规则</div>
                <div className="font-bold text-gray-900 text-sm">{job.overtimeRule}</div>
              </div>
            </div>
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-2">加班费率</div>
              <div className="flex gap-3">
                <div className="flex-1 text-center">
                  <div className="text-lg font-black text-brand-600">{job.overtimeRate.weekday}x</div>
                  <div className="text-[10px] text-gray-400">工作日</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-black text-accent-600">{job.overtimeRate.weekend}x</div>
                  <div className="text-[10px] text-gray-400">周末</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-black text-danger-600">{job.overtimeRate.holiday}x</div>
                  <div className="text-[10px] text-gray-400">法定假日</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-success-500" />
              食宿条件
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn('rounded-xl p-3 border', job.board.provided ? 'bg-success-50 border-success-100' : 'bg-gray-50 border-gray-100')}>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><UtensilsCrossed size={12} className={job.board.provided ? 'text-success-500' : 'text-gray-400'} />餐饮</div>
                <div className="font-bold text-gray-900 text-sm">
                  {job.board.provided ? '提供' : '不提供'}
                </div>
                {job.board.provided && job.board.costPerMonth !== undefined && (
                  <div className="text-[10px] text-gray-400 mt-0.5">¥{job.board.costPerMonth}/月</div>
                )}
              </div>
              <div className={cn('rounded-xl p-3 border', job.lodging.provided ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100')}>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><Hotel size={12} className={job.lodging.provided ? 'text-purple-500' : 'text-gray-400'} />住宿</div>
                <div className="font-bold text-gray-900 text-sm">
                  {job.lodging.provided ? '提供' : '不提供'}
                </div>
                {job.lodging.provided && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {job.lodging.roomType && <span>{job.lodging.roomType}</span>}
                    {job.lodging.costPerMonth !== undefined && <span> · ¥{job.lodging.costPerMonth}/月</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-brand-500" />
              进厂流程
            </h2>
            {job.processNodes && job.processNodes.length > 0 ? (
              <div className="relative pl-1">
                {job.processNodes.map((node, idx, arr) => (
                  <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                    {idx < arr.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-brand-300 via-brand-200 to-gray-100" />
                    )}
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md bg-gradient-to-br from-brand-500 to-brand-600 text-white ring-4 ring-white">
                      {node.step}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="font-semibold text-sm text-gray-900">{node.name}</div>
                        <div className="text-[10px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">{node.duration}</div>
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed">{node.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">暂无流程信息</div>
            )}
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-accent-500" />
              应聘要求
            </h2>
            {job.requirements && job.requirements.length > 0 ? (
              <ul className="space-y-2.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <CheckCircle2 size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-sm text-gray-400">暂无特殊要求</div>
            )}
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-purple-500" />
              福利待遇
            </h2>
            {job.benefits && job.benefits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((b, i) => (
                  <span key={i} className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border', benefitColors[i % benefitColors.length])}>
                    {b}
                  </span>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-400">暂无福利信息</div>
            )}
          </div>
        </div>

        <div className="px-4 mt-5 mb-6">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-brand-500" />
              工厂信息
            </h2>
            <div
              onClick={() => navigate(`/worker/factory/${factory.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Building2 size={26} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-gray-900 truncate">{factory.name}</h3>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                  <EhsBadge rating={factory.ehsRating} score={factory.ehsScore} size="sm" showScore />
                  <WhitelistBadge status={factory.whitelistStatus} />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  产能利用率 <span className="font-bold text-accent-600">{factory.capacityUtilization}%</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-md mx-auto px-4 py-3.5">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <CalendarDays size={16} className="text-brand-500" />
                选择面试日期
              </span>
              <span className="text-xs text-gray-400">未来7天可预约</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {futureDates.map(d => (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={cn(
                    'flex-shrink-0 px-3.5 py-2.5 rounded-xl text-center transition-all duration-200 min-w-[68px]',
                    selectedDate === d.iso
                      ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                  )}
                >
                  <div className={cn('text-[10px] font-medium', selectedDate === d.iso ? 'text-white/80' : 'text-gray-500')}>{d.weekday}</div>
                  <div className="font-bold text-base leading-tight mt-0.5">{d.display}</div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg transition-all duration-200',
              'bg-gradient-to-r from-accent-500 via-accent-400 to-orange-400',
              'active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" />提交中...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Handshake size={20} />
                一键预约面试
                <span className="text-white/80 text-sm font-normal">（免费车接）</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-xl">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">预约成功！</h3>
            <p className="text-center text-gray-500 text-sm leading-relaxed mb-5">
              您已成功预约 <span className="font-semibold text-brand-600">{futureDates.find(d => d.iso === selectedDate)?.full}</span> 的面试<br/>
              专属经纪人将在30分钟内与您联系确认车接信息
            </p>
            <div className="bg-brand-50 rounded-2xl p-4 mb-5 border border-brand-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700"><Car size={16} className="text-brand-500" /><span>免费车接服务</span></div>
                <div className="flex items-center gap-2 text-gray-700"><Briefcase size={16} className="text-success-500" /><span>全程陪同面试</span></div>
              </div>
            </div>
            <button onClick={() => navigate('/worker/interview')} className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg active:scale-[0.98] transition-all">
              查看面试进度 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
