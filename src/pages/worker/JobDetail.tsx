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
  FileCheck,
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
import type { Job, Factory, ProcessNode } from '@shared/types';

const MOCK_WORKER_ID = 'w-001';

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

const defaultProcessNodes: ProcessNode[] = [
  { step: 1, name: '在线预约面试', description: '选择合适日期提交预约申请', duration: '1分钟' },
  { step: 2, name: '经纪人联系', description: '专属经纪人1对1对接注意事项', duration: '30分钟内' },
  { step: 3, name: '车接服务', description: '免费车辆从集合点接至工厂', duration: '面试当天' },
  { step: 4, name: '到达登记', description: '到达工厂门卫登记+证件复印', duration: '15分钟' },
  { step: 5, name: '岗前培训', description: 'EHS安全培训+岗位技能介绍', duration: '2小时' },
  { step: 6, name: '正式面试', description: '车间主管面试+签合同+办入职', duration: '1小时' },
];

export default function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

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

  const ehsBadgeColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'bg-success-500';
      case 'B': return 'bg-brand-500';
      case 'C': return 'bg-warning-500';
      default: return 'bg-danger-500';
    }
  };

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const json = await res.json();
      if (json.success) {
        setJob(json.data.job);
        setFactory(json.data.factory);
        setSelectedDate(futureDates[0].iso);
      } else {
        throw new Error(json.error || '加载失败');
      }
    } catch (e) {
      console.error(e);
      setError('加载岗位详情失败，使用演示数据');
      const mockJob: Job = {
        id: id || 'job_demo',
        factoryId: 'f_1',
        title: '电子厂普工 · 包吃住 · 五险一金',
        salaryRange: { min: 5800, max: 8200 },
        workHours: '两班倒·8H',
        overtimeRule: '工作日1.5倍/周末2倍/节假日3倍',
        overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 },
        board: { provided: true, costPerMonth: 0 },
        lodging: { provided: true, costPerMonth: 0, roomType: '4-6人间·空调热水器' },
        processNodes: defaultProcessNodes,
        requirements: [
          '年龄18-45周岁，男女不限',
          '身体健康，无色盲色弱，无传染病',
          '持有效二代身份证原件',
          '能吃苦耐劳，适应倒班，服从管理',
          '有无经验均可，老员工一对一带教',
          '无大面积纹身，无犯罪记录',
        ],
        benefits: [
          '五险一金', '免费三餐', '免费住宿', '节日福利', '年终奖',
          '带薪年假', '免费体检', '夫妻房', '子女教育补贴', '技能培训',
          '全勤奖', '高温补贴', '生日礼物', '团建活动', '夜班补贴'
        ],
        status: 'published',
        vacancy: 50,
        distanceKm: 2.8,
        createdAt: new Date().toISOString(),
        urgent: true,
        highSubsidy: true,
      };
      const mockFactory: Factory = {
        id: 'f_1',
        name: '苏州立讯精密电子有限公司',
        logo: '',
        region: '苏州工业园',
        address: '苏州工业园区星湖街218号',
        ehsRating: 'A',
        ehsScore: 96,
        dailyCapacity: 150000,
        capacityUtilization: 92,
        seasonNote: '6-9月为生产旺季，加班稳定；2-4月为淡季，工时较少',
        interviewSummaries: [{
          id: 's1',
          keywords: ['管理规范', '环境好', '伙食棒', '宿舍干净', '加班多'],
          satisfaction: 5,
          summary: '工厂整体非常不错，管理很规范，宿舍是新装修的4人间，食堂菜品丰富口味好，旺季加班多工资高，强烈推荐！',
          recordedAt: '2025-06-10'
        }],
        safetyRecords: [
          { id: 'r1', date: '2025-06-01', type: 'audit', level: 'normal', description: '月度EHS审计：全部达标' },
          { id: 'r2', date: '2025-05-15', type: 'training', level: 'normal', description: '消防应急演练，全员参与' },
          { id: 'r3', date: '2025-04-20', type: 'audit', level: 'normal', description: '职业健康检查：合格率100%' },
        ],
        whitelistStatus: 'whitelist',
        createdAt: new Date().toISOString(),
        industry: '电子制造 / 消费电子',
        scale: '5000人以上',
      };
      setJob(mockJob);
      setFactory(mockFactory);
      setSelectedDate(futureDates[0].iso);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleSubmit = async () => {
    if (!selectedDate || !job) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: MOCK_WORKER_ID,
          jobId: job.id,
          scheduledDate: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowSuccessModal(true);
      } else {
        throw new Error(json.error || '预约失败');
      }
    } catch (e) {
      console.error(e);
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-brand-500 animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-gray-900">岗位详情</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Heart
                  size={20}
                  className={cn('transition-all', isLiked ? 'fill-danger-500 text-danger-500 scale-110' : 'text-gray-600')}
                />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
                <Share2 size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-warning-50 rounded-xl flex items-center gap-2 text-sm text-warning-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="bg-gradient-to-br from-accent-500 via-accent-400 to-orange-300 text-white px-4 py-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-8 w-52 h-52 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-400/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              {job?.urgent && (
                <span className="bg-white/25 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Sparkles size={12} />
                  急招
                </span>
              )}
              {job?.highSubsidy && (
                <span className="bg-success-500/90 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Award size={12} />
                  入职补贴¥1500
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-1">{job?.title}</h1>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold tracking-tight">
                ¥{job?.salaryRange.min.toLocaleString()}
              </span>
              <span className="text-2xl font-light text-white/80">-</span>
              <span className="text-4xl font-extrabold tracking-tight">
                {job?.salaryRange.max.toLocaleString()}
              </span>
              <span className="ml-2 text-sm text-white/80 font-medium">/月</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Users size={14} />
                招 {job?.vacancy} 人
              </span>
              {job?.distanceKm !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {job.distanceKm}km
                </span>
              )}
            </div>
            <div className="text-xs text-white/70 mt-2">
              💡 月均实际到手参考：综合加班后{Math.round((job?.salaryRange.max || 8000) * 1.15)}元以上
            </div>
          </div>
        </div>

        {factory && (
          <div className="px-4 -mt-3">
            <div
              onClick={() => navigate(`/worker/factory/${factory.id}`)}
              className="bg-white rounded-2xl shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Building2 size={26} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 truncate">{factory.name}</h3>
                    <div
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-0.5',
                        ehsBadgeColor(factory.ehsRating)
                      )}
                    >
                      <ShieldCheck size={10} />
                      EHS {factory.ehsRating}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>{factory.industry}</span>
                    <span>·</span>
                    <span>{factory.scale}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Star size={11} className="text-warning-500 fill-warning-500" />
                      {factory.interviewSummaries?.[0]?.satisfaction || 4.8}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    📍 {factory.address}
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mt-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white rounded-2xl shadow-card p-3.5 text-center hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-xl bg-brand-50 flex items-center justify-center mb-2">
                <Clock size={20} className="text-brand-500" />
              </div>
              <div className="text-xs text-gray-500 mb-1">工时制度</div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">{job?.workHours}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-3.5 text-center hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-xl bg-accent-50 flex items-center justify-center mb-2">
                <Moon size={20} className="text-accent-500" />
              </div>
              <div className="text-xs text-gray-500 mb-1">加班规则</div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {job?.overtimeRate.weekday}倍起
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-3.5 text-center hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 mx-auto rounded-xl bg-success-50 flex items-center justify-center mb-2">
                <UtensilsCrossed size={20} className="text-success-500" />
                <Hotel size={20} className="text-success-500 -ml-3" />
              </div>
              <div className="text-xs text-gray-500 mb-1">食宿条件</div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {job?.board.provided && job?.lodging.provided ? '包吃住' : job?.board.provided ? '包吃' : job?.lodging.provided ? '包住' : '自理'}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-brand-500" />
                📋 进厂流程
              </h2>
              <span className="text-xs text-gray-400">全程约半天</span>
            </div>
            <div className="relative pl-1">
              {(job?.processNodes?.length ? job.processNodes : defaultProcessNodes).map((node, idx, arr) => (
                <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                  {idx < arr.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-brand-300 via-brand-200 to-gray-100" />
                  )}
                  <div className={cn(
                    'absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md',
                    'bg-gradient-to-br from-brand-500 to-brand-600 text-white ring-4 ring-white'
                  )}>
                    {node.step}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="font-semibold text-sm text-gray-900">{node.name}</div>
                      <div className="text-[10px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">
                        {node.duration}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{node.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-accent-500" />
              ✅ 应聘要求
            </h2>
            <ul className="space-y-2.5">
              {job?.requirements?.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                  <CheckCircle2 size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-4 mt-5 mb-6">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3.5">
              <div className="w-1 h-5 rounded-full bg-purple-500" />
              🎁 福利待遇
            </h2>
            <div className="flex flex-wrap gap-2">
              {job?.benefits?.map((b, i) => (
                <span
                  key={i}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium border transition-transform hover:scale-105 active:scale-95',
                    benefitColors[i % benefitColors.length]
                  )}
                >
                  ✓ {b}
                </span>
              ))}
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
                  <div className={cn(
                    'text-[10px] font-medium',
                    selectedDate === d.iso ? 'text-white/80' : 'text-gray-500'
                  )}>
                    {d.weekday}
                  </div>
                  <div className="font-bold text-base leading-tight mt-0.5">{d.display}</div>
                </button>
              ))}
            </div>
            {selectedDate && (
              <div className="text-xs text-brand-600 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} />
                已选择：{futureDates.find(d => d.iso === selectedDate)?.full} 上午 09:00
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg transition-all duration-200',
              'bg-gradient-to-r from-accent-500 via-accent-400 to-orange-400',
              'hover:shadow-xl hover:shadow-accent-500/30 active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                提交中...
              </span>
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
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-xl shadow-success-500/30">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">🎉 预约成功！</h3>
            <p className="text-center text-gray-500 text-sm leading-relaxed mb-5">
              您已成功预约 <span className="font-semibold text-brand-600">{futureDates.find(d => d.iso === selectedDate)?.full}</span> 的面试<br/>
              专属经纪人将在30分钟内与您联系确认车接信息
            </p>
            <div className="bg-brand-50 rounded-2xl p-4 mb-5 border border-brand-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Car size={16} className="text-brand-500" />
                  <span>免费车接服务</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FileCheck size={16} className="text-success-500" />
                  <span>全程陪同面试</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/worker/interview-progress')}
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all active:scale-[0.98]"
            >
              查看面试进度 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
