import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  IdCard,
  MonitorCog,
  CheckCircle2,
  Circle,
  Clock,
  Gift,
  Wallet,
  Users,
  Building2,
  CalendarDays,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Share2,
  Briefcase,
  ChevronRight,
  Coins,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { InterviewOrder } from '@shared/types';

const MOCK_WORKER_ID = 'w-001';

interface ReferralBonus {
  id: string;
  referrerName: string;
  referrerPhone: string;
  factoryName: string;
  jobTitle: string;
  amount: number;
  daysRequired: number;
  daysCompleted: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<InterviewOrder[]>([]);
  const [referrals, setReferrals] = useState<ReferralBonus[]>([]);
  const [stepIndex, setStepIndex] = useState(1);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawProcessing, setWithdrawProcessing] = useState(false);

  const onboardingSteps = [
    { key: 'document', icon: FileText, label: '证件复印', desc: '身份证+学历证复印件+照片' },
    { key: 'training', icon: GraduationCap, label: '岗前培训签到', desc: 'EHS安全+岗位技能培训' },
    { key: 'badge', icon: IdCard, label: '领工牌工服', desc: '领取工牌、工服、鞋柜钥匙' },
    { key: 'station', icon: MonitorCog, label: '分配工位', desc: '车间主管带往工位并介绍' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews?workerId=${MOCK_WORKER_ID}&status=employed`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setOrders(json.data);
      } else {
        throw new Error('no data');
      }
    } catch (e) {
      console.error(e);
      const mockOrders: InterviewOrder[] = [
        {
          id: 'iv_003_employed',
          workerId: MOCK_WORKER_ID,
          workerName: '张师傅',
          workerPhone: '138****8888',
          jobId: 'job_3',
          jobTitle: '仓库分拣员 · 五险一金',
          factoryId: 'f_3',
          factoryName: '苏州博世汽车零部件',
          brokerId: 'b_1',
          brokerName: '王经理',
          scheduledDate: '2025-06-10',
          status: 'employed',
          timeline: [],
          subsidy: {
            triggered: true,
            amount: 1500,
            daysRequired: 7,
            daysCompleted: 3,
            paidAt: undefined,
          },
          createdAt: '2025-06-08T10:00:00Z',
        },
      ];
      setOrders(mockOrders);

      const mockReferrals: ReferralBonus[] = [
        {
          id: 'ref_001',
          referrerName: '李大哥',
          referrerPhone: '139****1234',
          factoryName: '苏州立讯精密电子',
          jobTitle: '电子厂普工',
          amount: 800,
          daysRequired: 7,
          daysCompleted: 7,
          status: 'paid',
          createdAt: '2025-05-01',
          paidAt: '2025-05-15',
        },
        {
          id: 'ref_002',
          referrerName: '王姐',
          referrerPhone: '137****5678',
          factoryName: '昆山仁宝科技',
          jobTitle: '品检QC · 长白班',
          amount: 1000,
          daysRequired: 7,
          daysCompleted: 4,
          status: 'pending',
          createdAt: '2025-06-12',
        },
        {
          id: 'ref_003',
          referrerName: '表弟小明',
          referrerPhone: '136****9012',
          factoryName: '吴江某包装厂',
          jobTitle: '包装工',
          amount: 600,
          daysRequired: 7,
          daysCompleted: 1,
          status: 'pending',
          createdAt: '2025-06-15',
        },
      ];
      setReferrals(mockReferrals);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentOrder = orders.find(o => o.status === 'employed');
  const subsidy = currentOrder?.subsidy;
  const daysCompleted = subsidy?.daysCompleted ?? 3;
  const daysRequired = subsidy?.daysRequired ?? 7;
  const subsidyProgress = Math.min(100, (daysCompleted / daysRequired) * 100);
  const remainingDays = Math.max(0, daysRequired - daysCompleted);

  const today = new Date();
  const payDate = new Date(today);
  payDate.setDate(payDate.getDate() + remainingDays);
  const payDateStr = `${payDate.getMonth() + 1}月${payDate.getDate()}日`;

  const handleStepAction = (idx: number) => {
    if (idx === stepIndex) {
      setStepIndex(Math.min(onboardingSteps.length - 1, idx + 1));
    }
  };

  const handleWithdraw = async () => {
    if (!subsidy || subsidyProgress < 100) return;
    setWithdrawProcessing(true);
    setTimeout(() => {
      setWithdrawProcessing(false);
      setWithdrawSuccess(true);
    }, 1500);
  };

  const totalEarned = referrals
    .filter(r => r.status === 'paid')
    .reduce((s, r) => s + r.amount, 0);

  const totalPending = referrals
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-accent-500 via-accent-400 to-orange-400 text-white px-4 pt-12 pb-20 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-10 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/30 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">入职 & 补贴中心</h1>
            </div>

            {currentOrder ? (
              <div className="bg-white/15 backdrop-blur-md rounded-3xl p-5 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
                      <Building2 size={11} />
                      当前入职工厂
                    </div>
                    <h2 className="text-lg font-bold">{currentOrder.factoryName}</h2>
                    <p className="text-sm text-white/80 mt-0.5">{currentOrder.jobTitle}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-success-500/90 text-xs font-bold shadow-md flex items-center gap-1">
                    <CheckCircle size={12} />
                    在职中
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success-400 to-success-500 flex items-center justify-center shadow-md">
                        <Gift size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-white/70">稳岗补贴</div>
                        <div className="text-xs text-white/60">在岗满{daysRequired}天自动发放</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black tabular-nums tracking-tight">
                        ¥{(subsidy?.amount || 1500).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-white/70 mb-1.5">
                      <span className="font-medium">已完成 <b className="text-white">{daysCompleted}</b> 天</span>
                      <span className="font-medium">还需 <b className="text-white">{remainingDays}</b> 天</span>
                      <span className="font-medium">{Math.round(subsidyProgress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-accent-500 via-accent-400 to-orange-300 rounded-full shadow-inner transition-all duration-700 relative"
                        style={{ width: `${subsidyProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-white/80 flex items-center gap-1">
                      <CalendarDays size={11} />
                      预计发放：<b className="text-white">{payDateStr}</b>
                    </div>
                    {subsidyProgress >= 100 && !subsidy?.paidAt ? (
                      <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-4 py-1.5 rounded-xl bg-white text-accent-600 text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Wallet size={12} />
                        立即提现
                      </button>
                    ) : subsidy?.paidAt ? (
                      <span className="px-3 py-1 rounded-xl bg-success-500/90 text-xs font-bold shadow-md">
                        ✓ 已发放
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/60 flex items-center gap-1">
                        <Clock size={10} />
                        倒计时中
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/15 backdrop-blur rounded-2xl p-8 text-center border border-white/20">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                  <Briefcase size={32} className="text-white/80" />
                </div>
                <h3 className="font-bold text-lg mb-1">暂无入职记录</h3>
                <p className="text-xs text-white/70 mb-4">完成面试后即可查看入职进度和补贴</p>
                <button
                  onClick={() => navigate('/worker/home')}
                  className="px-5 py-2.5 rounded-xl bg-white text-accent-600 text-sm font-bold shadow-md active:scale-95 transition-transform"
                >
                  去找岗位
                </button>
              </div>
            )}
          </div>
        </div>

        {currentOrder && (
          <div className="px-4 -mt-10">
            <div className="bg-white rounded-3xl shadow-card p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-brand-500" />
                  📋 入职确认步骤
                </h2>
                <span className="text-[10px] text-brand-500 bg-brand-50 px-2 py-1 rounded-full font-bold">
                  {stepIndex + 1}/{onboardingSteps.length}
                </span>
              </div>

              <div className="space-y-1">
                {onboardingSteps.map((step, idx) => {
                  const done = idx < stepIndex;
                  const current = idx === stepIndex;
                  return (
                    <div key={step.key} className="relative flex items-start gap-4 pb-5 last:pb-0">
                      {idx < onboardingSteps.length - 1 && (
                        <div
                          className={cn(
                            'absolute left-[17px] top-10 w-0.5 h-[calc(100%-12px)]',
                            done ? 'bg-gradient-to-b from-success-400 to-success-500' : 'bg-gray-100'
                          )}
                        />
                      )}

                      <div
                        onClick={() => handleStepAction(idx)}
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all cursor-pointer',
                          done && 'bg-gradient-to-br from-success-400 to-success-500 text-white shadow-md shadow-success-500/30',
                          current && 'bg-gradient-to-br from-accent-400 to-accent-500 text-white shadow-md shadow-accent-500/30 ring-4 ring-accent-100 animate-pulse',
                          !done && !current && 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {done ? <CheckCircle2 size={18} /> : <step.icon size={16} />}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h3 className={cn(
                            'font-bold text-sm',
                            done ? 'text-success-600' : current ? 'text-gray-900' : 'text-gray-400'
                          )}>
                            {step.label}
                            {done && <span className="ml-1 text-[10px] font-normal">✓ 已完成</span>}
                            {current && <span className="ml-1 text-[10px] font-normal text-accent-500 bg-accent-50 px-1.5 py-0.5 rounded-full">进行中</span>}
                          </h3>
                        </div>
                        <p className={cn(
                          'text-xs leading-relaxed',
                          done || current ? 'text-gray-500' : 'text-gray-300'
                        )}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mt-5">
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-purple-500" />
                💰 补贴 & 奖金概览
              </h2>
            </div>

            <div className="px-5 pb-5 grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-4 border border-accent-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Coins size={14} className="text-accent-500" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">稳岗补贴</span>
                </div>
                <div className="text-2xl font-black text-accent-600 tabular-nums">
                  ¥{subsidyProgress >= 100 ? (subsidy?.amount || 1500).toLocaleString() : '---'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {subsidyProgress >= 100 ? '已达成，可提现' : `还差${remainingDays}天`}
                </div>
              </div>
              <div className="bg-gradient-to-br from-success-50 to-emerald-50 rounded-2xl p-4 border border-success-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users size={14} className="text-success-500" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">推荐奖金</span>
                </div>
                <div className="text-2xl font-black text-success-600 tabular-nums">
                  ¥{(totalEarned + totalPending).toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  已到账 ¥{totalEarned.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-5">
          <div className="bg-white rounded-3xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-success-500" />
                🤝 推荐奖金记录
              </h2>
              <button className="text-xs text-brand-500 font-medium bg-brand-50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-brand-100 transition-colors">
                <Share2 size={11} />
                去推荐
              </button>
            </div>

            {referrals.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
                  <Users size={26} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">暂无推荐记录</p>
                <p className="text-xs text-gray-400 mt-1">推荐工友入职即可获得现金奖励</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map(r => {
                  const progress = Math.min(100, (r.daysCompleted / r.daysRequired) * 100);
                  const paid = r.status === 'paid';
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        'rounded-2xl p-4 border transition-all',
                        paid
                          ? 'bg-success-50/50 border-success-100'
                          : 'bg-gray-50/50 border-gray-100 hover:border-brand-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-sm text-gray-900">{r.referrerName}</span>
                            <span className="text-[10px] text-gray-400 tabular-nums">{r.referrerPhone}</span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {r.factoryName} · {r.jobTitle}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                            入职日期：{r.createdAt}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={cn(
                            'text-xl font-black tabular-nums',
                            paid ? 'text-success-600' : 'text-accent-500'
                          )}>
                            ¥{r.amount.toLocaleString()}
                          </div>
                          {paid && r.paidAt && (
                            <div className="text-[10px] text-success-500 mt-0.5 flex items-center justify-end gap-0.5">
                              <CheckCircle size={10} />
                              {r.paidAt}到账
                            </div>
                          )}
                        </div>
                      </div>

                      {!paid && (
                        <>
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                            <span>在岗进度</span>
                            <span className="tabular-nums font-medium">
                              {r.daysCompleted}/{r.daysRequired}天 ({Math.round(progress)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                            <div
                              className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mt-5 mb-4">
          <button
            onClick={() => subsidyProgress >= 100 && setShowWithdrawModal(true)}
            disabled={subsidyProgress < 100}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all duration-300',
              subsidyProgress >= 100
                ? 'bg-gradient-to-r from-accent-500 via-accent-400 to-orange-400 text-white shadow-accent-500/30 hover:shadow-2xl active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Wallet size={20} />
            {subsidyProgress >= 100 ? `申请提现 ¥${(subsidy?.amount || 1500).toLocaleString()}` : `还需在岗 ${remainingDays} 天可提现`}
            {subsidyProgress >= 100 && <ArrowUpRight size={18} />}
          </button>

          <div className="mt-3 p-3 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-start gap-2">
            <AlertCircle size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-brand-700 leading-relaxed">
              <b>提现说明：</b>补贴将在确认提现后1-3个工作日内发放至您绑定的银行卡。推荐奖金在被推荐人满岗后次日自动发放。
            </div>
          </div>
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {!withdrawSuccess ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-xl shadow-accent-500/30">
                  <Wallet size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-1">确认提现补贴？</h3>
                <p className="text-center text-sm text-gray-500 mb-5">
                  提现金额将在 <b className="text-gray-700">1-3个工作日</b> 内到账
                </p>

                <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-2xl p-5 mb-5 border border-accent-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 font-medium">提现金额</span>
                    <Sparkles size={14} className="text-accent-500" />
                  </div>
                  <div className="text-5xl font-black text-center text-accent-600 tabular-nums tracking-tight mb-3">
                    ¥{(subsidy?.amount || 1500).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-accent-100/50 text-gray-500">
                    <span>收款账户</span>
                    <span className="text-gray-700 font-medium">工商银行 ****8888</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawProcessing}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-400 text-white font-bold shadow-lg shadow-accent-500/30 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {withdrawProcessing ? (
                      <><Loader2 size={16} className="animate-spin" />处理中...</>
                    ) : (
                      <>✓ 确认提现</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-xl shadow-success-500/30 animate-in zoom-in-95 fade-in duration-500">
                  <CheckCircle2 size={48} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">🎉 提现申请已提交！</h3>
                <p className="text-center text-sm text-gray-500 leading-relaxed mb-6">
                  补贴金额 <b className="text-accent-600">¥{(subsidy?.amount || 1500).toLocaleString()}</b><br/>
                  将在1-3个工作日内到账至您的银行卡
                </p>
                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-100">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-white" />
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="font-bold text-gray-800">预计到账时间</div>
                      <div className="tabular-nums">
                        {new Date(Date.now() + 86400000 * 2).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 前
                      </div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-300" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-success-50 border border-success-100">
                    <div className="w-8 h-8 rounded-lg bg-success-500 flex items-center justify-center flex-shrink-0">
                      <Coins size={16} className="text-white" />
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="font-bold text-gray-800">到账后可查看明细</div>
                      <div>可在"我的钱包"查看完整流水</div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-300" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawSuccess(false);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all"
                >
                  我知道了
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
