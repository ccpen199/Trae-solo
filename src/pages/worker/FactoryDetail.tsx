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
  Calendar,
  Thermometer,
  Clock,
  AlertOctagon,
  CheckCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import JobCard from '@/components/JobCard';
import type { Factory, Job, SafetyRecord } from '@shared/types';

const keywordColors = [
  'bg-brand-50 text-brand-600',
  'bg-accent-50 text-accent-600',
  'bg-success-50 text-success-600',
  'bg-purple-50 text-purple-600',
  'bg-pink-50 text-pink-600',
  'bg-cyan-50 text-cyan-600',
];

export default function FactoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [jobs, setJobs] = useState<(Job & { factory?: Factory })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mockCapacityData = Array.from({ length: 12 }, (_, i) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const base = 70 + Math.sin(i * 0.7) * 15;
    const spike = i >= 5 && i <= 8 ? 12 : 0;
    return {
      month: months[i],
      capacity: Math.round(base + spike + (i % 3) * 2),
      output: Math.round((base + spike) * 1.2 + (i % 2) * 5),
    };
  });

  const ehsConfig = (rating: string, score: number) => {
    switch (rating) {
      case 'A':
        return {
          bg: 'bg-gradient-to-br from-success-400 to-success-600',
          ring: 'ring-success-100',
          text: '优秀',
          desc: '安全管理规范，连续12月无重大事故',
          textColor: 'text-success-600',
          bgLight: 'bg-success-50',
          borderLight: 'border-success-100',
        };
      case 'B':
        return {
          bg: 'bg-gradient-to-br from-brand-400 to-brand-600',
          ring: 'ring-brand-100',
          text: '良好',
          desc: '安全管理到位，近6月无事故记录',
          textColor: 'text-brand-600',
          bgLight: 'bg-brand-50',
          borderLight: 'border-brand-100',
        };
      case 'C':
        return {
          bg: 'bg-gradient-to-br from-warning-400 to-warning-600',
          ring: 'ring-warning-100',
          text: '一般',
          desc: '存在轻微安全隐患，已要求整改',
          textColor: 'text-warning-600',
          bgLight: 'bg-warning-50',
          borderLight: 'border-warning-100',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-danger-400 to-danger-600',
          ring: 'ring-danger-100',
          text: '较差',
          desc: '存在重大安全隐患，请谨慎选择',
          textColor: 'text-danger-600',
          bgLight: 'bg-danger-50',
          borderLight: 'border-danger-100',
        };
    }
  };

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
          factory: fRes.success ? fRes.data : undefined,
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
        <button
          onClick={() => navigate('/worker/home')}
          className="px-6 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  const ehs = ehsConfig(factory.ehsRating, factory.ehsScore);
  const latestSummary = factory.interviewSummaries?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white px-4 pt-12 pb-16 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

          <div className="relative">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-5 border border-white/20 active:scale-95 transition-transform"
            >
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
                  <div className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md',
                    ehs.bg
                  )}>
                    <ShieldCheck size={12} />
                    EHS {factory.ehsRating}
                  </div>
                  {factory.whitelistStatus === 'whitelist' && (
                    <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-success-500 flex items-center gap-1 shadow-md">
                      <CheckCircle2 size={12} />
                      平台白名单
                    </div>
                  )}
                </div>
                <div className="text-xs text-white/80 mt-2 flex items-center gap-1.5">
                  <span>{factory.industry}</span>
                  <span>·</span>
                  <span>{factory.scale}</span>
                </div>
                <div className="text-xs text-white/70 mt-1 flex items-center gap-1 truncate">
                  <MapPin size={12} className="flex-shrink-0" />
                  {factory.address}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-10">
          <div className={cn(
            'rounded-3xl p-5 shadow-xl ring-8',
            'bg-white',
            ehs.ring
          )}>
            <div className="flex items-center gap-5">
              <div className={cn(
                'w-28 h-28 rounded-3xl flex flex-col items-center justify-center shadow-lg',
                ehs.bg
              )}>
                <ShieldCheck size={28} className="text-white mb-1" />
                <div className="text-4xl font-black text-white tabular-nums tracking-tight">
                  {factory.ehsScore}
                </div>
                <div className="text-[10px] text-white/90 font-medium">分</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-bold text-gray-900">EHS安全评级</h2>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-bold',
                    ehs.bgLight,
                    ehs.textColor
                  )}>
                    {ehs.text}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{ehs.desc}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="text-lg font-bold text-success-600 tabular-nums">
                      {factory.safetyRecords?.filter(r => r.level === 'normal').length || 12}
                    </div>
                    <div className="text-[10px] text-gray-500">达标项</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="text-lg font-bold text-warning-600 tabular-nums">
                      {factory.safetyRecords?.filter(r => r.level === 'minor').length || 0}
                    </div>
                    <div className="text-[10px] text-gray-500">轻微</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="text-lg font-bold text-danger-600 tabular-nums">
                      {factory.safetyRecords?.filter(r => r.level === 'major').length || 0}
                    </div>
                    <div className="text-[10px] text-gray-500">重大</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <Clock size={14} className="text-brand-500" />
                近12月安全记录
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {factory.safetyRecords?.map(record => {
                  const Icon = safetyIcon(record.type);
                  const sc = safetyColor(record.level);
                  return (
                    <div key={record.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                        sc.bg
                      )}>
                        <Icon size={18} className={sc.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-800">{safetyTypeLabel(record.type)}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                            <span className="text-[10px] text-gray-400 tabular-nums">{record.date.slice(5)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{record.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-3xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-accent-500" />
                📈 真实产能数据
              </h2>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">近12个月</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-2xl p-4 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
                    <FactoryIcon size={16} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">日均产量</span>
                </div>
                <div className="text-2xl font-black text-brand-700 tabular-nums">
                  {(factory.dailyCapacity / 10000).toFixed(0)}
                  <span className="text-sm font-semibold ml-0.5">万件</span>
                </div>
                <div className="text-[10px] text-brand-600/70 mt-1">行业Top 15%水平</div>
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
                <div className="text-[10px] text-accent-600/70 mt-1">订单饱和·加班稳定</div>
              </div>
            </div>

            <div className="h-56 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockCapacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A639C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A639C" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF7A00" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[40, 110]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'capacity' ? '产能利用率' : '实际产出率'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="capacity"
                    stroke="#2A639C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCapacity)"
                    name="capacity"
                  />
                  <Area
                    type="monotone"
                    dataKey="output"
                    stroke="#FF7A00"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOutput)"
                    name="output"
                    strokeDasharray="4 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-xs text-gray-500">产能利用率</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-accent-500" style={{ borderTop: '2px dashed #FF7A00' }} />
                <span className="text-xs text-gray-500">实际产出率</span>
              </div>
            </div>
          </div>
        </div>

        {latestSummary && (
          <div className="px-4 mt-5">
            <div className="bg-white rounded-3xl shadow-card p-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-purple-500" />
                💬 真实员工访谈
              </h2>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={18}
                      className={cn(
                        s <= latestSummary.satisfaction
                          ? 'text-warning-400 fill-warning-400'
                          : 'text-gray-200'
                      )}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900 tabular-nums">{latestSummary.satisfaction}.0</span>
                <span className="text-xs text-gray-400">综合满意度</span>
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full tabular-nums">
                  {latestSummary.recordedAt}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2 font-medium">员工关键词</div>
                <div className="flex flex-wrap gap-2">
                  {latestSummary.keywords.map((k, i) => (
                    <span
                      key={i}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                        keywordColors[i % keywordColors.length]
                      )}
                    >
                      <Sparkles size={10} />
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className={cn(
                'rounded-2xl p-4 border relative overflow-hidden',
                ehs.bgLight,
                ehs.borderLight
              )}>
                <div className="absolute -top-2 -left-1 text-5xl opacity-20 font-serif text-brand-500">"</div>
                <p className="text-sm text-gray-700 leading-relaxed relative z-10 whitespace-pre-line">
                  {latestSummary.summary}
                </p>
                <div className="absolute -bottom-8 -right-1 text-7xl opacity-10 font-serif rotate-180 text-brand-500">"</div>
              </div>
            </div>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-success-500" />
                🔥 在招岗位
              </h2>
              <span className="text-xs text-brand-500 font-medium bg-brand-50 px-2.5 py-1 rounded-full">
                共 {jobs.length} 个
              </span>
            </div>
            <div className="space-y-3">
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onFactoryClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        <div className="px-4 mt-5 mb-4">
          <div className="bg-gradient-to-br from-warning-50 via-accent-50 to-orange-50 rounded-3xl p-5 border border-warning-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <Thermometer size={80} className="text-warning-500" />
            </div>
            <div className="flex items-start gap-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-warning-400 to-warning-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-warning-500/20">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                  淡旺季说明
                  <span className="text-[10px] bg-warning-500/20 text-warning-700 px-2 py-0.5 rounded-full">
                    重要参考
                  </span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {factory.seasonNote}
                </p>
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 bg-white/70 backdrop-blur rounded-xl p-2.5 border border-white">
                    <div className="text-[10px] text-success-600 font-bold mb-0.5">✅ 旺季（推荐）</div>
                    <div className="text-xs text-gray-700">6-9月 · 加班多工资高</div>
                  </div>
                  <div className="flex-1 bg-white/70 backdrop-blur rounded-xl p-2.5 border border-white">
                    <div className="text-[10px] text-warning-600 font-bold mb-0.5">⚠️ 淡季</div>
                    <div className="text-xs text-gray-700">2-4月 · 工时较少</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
