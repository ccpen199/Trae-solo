import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  Car,
  MapPin,
  CheckCircle2,
  FileText,
  GraduationCap,
  UserCheck,
  Briefcase,
  XCircle,
  Phone,
  MessageCircle,
  Star,
  Loader2,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle,
  User,
  Gift,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { get, post } from '@/lib/api';
import type { InterviewOrder, InterviewStatus } from '@shared/types';

const WORKER_ID = 'w-001';

type TabType = 'active' | 'employed' | 'failed';

const statusLabelMap: Record<InterviewStatus, string> = {
  pending: '预约成功',
  broker_assigned: '已分配经纪人',
  pickup_scheduled: '车接已安排',
  arrived: '已到达',
  documents_copied: '证件已复印',
  training_done: '培训完成',
  interviewing: '面试中',
  passed: '面试通过',
  failed: '未通过',
  employed: '已入职',
};

const flowSteps: { key: InterviewStatus; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: '预约成功', icon: CalendarCheck },
  { key: 'pickup_scheduled', label: '车接服务', icon: Car },
  { key: 'arrived', label: '到达签到', icon: MapPin },
  { key: 'documents_copied', label: '证件复印', icon: FileText },
  { key: 'training_done', label: '岗前培训', icon: GraduationCap },
  { key: 'passed', label: '面试通过', icon: UserCheck },
  { key: 'employed', label: '已入职', icon: Briefcase },
];

const getStepIndex = (status: InterviewStatus): number => {
  const idx = flowSteps.findIndex(s => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'broker_assigned') return 0;
  if (status === 'interviewing') return 5;
  if (status === 'failed') return 5;
  return 0;
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function InterviewProgress() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<InterviewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState<{ show: boolean; passed: boolean; orderId?: string }>({ show: false, passed: true });

  const tabs: { key: TabType; label: string }[] = [
    { key: 'active', label: '进行中' },
    { key: 'employed', label: '已入职' },
    { key: 'failed', label: '未通过' },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await get<InterviewOrder[]>(`/interviews?workerId=${WORKER_ID}`);
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filterOrders = () => {
    switch (activeTab) {
      case 'active':
        return orders.filter(o => !['employed', 'failed'].includes(o.status));
      case 'employed':
        return orders.filter(o => o.status === 'employed');
      case 'failed':
        return orders.filter(o => o.status === 'failed');
    }
  };

  const updateStatus = async (orderId: string, endpoint: string, body: Record<string, unknown>) => {
    try {
      const res = await post<InterviewOrder>(`/interviews/${orderId}/${endpoint}`, body);
      if (res.success && res.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.data! : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentOrders = filterOrders();
  const tabCounts = {
    active: orders.filter(o => !['employed', 'failed'].includes(o.status)).length,
    employed: orders.filter(o => o.status === 'employed').length,
    failed: orders.filter(o => o.status === 'failed').length,
  };

  const renderActiveCard = (order: InterviewOrder) => {
    const stepIdx = getStepIndex(order.status);
    const canArrive = ['pending', 'broker_assigned', 'pickup_scheduled'].includes(order.status);
    const canDocument = order.status === 'arrived';
    const canTraining = order.status === 'documents_copied';
    const canResult = ['training_done', 'interviewing'].includes(order.status);

    return (
      <div key={order.id} className="bg-white rounded-3xl shadow-card overflow-hidden mb-4 border border-gray-100">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-3.5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/70 mb-0.5">面试预约 #{order.id.slice(-6).toUpperCase()}</div>
              <h3 className="font-bold text-lg truncate">{order.jobTitle}</h3>
              <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                <Building2 size={12} />
                <span className="truncate">{order.factoryName}</span>
              </div>
              <div className="text-xs text-white/60 mt-1 tabular-nums">
                面试日期：{order.scheduledDate?.slice(0, 10)}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium">
                <Clock size={11} />
                {statusLabelMap[order.status]}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {order.brokerName && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-accent-50 to-orange-50 border border-accent-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-gray-900">{order.brokerName}</span>
                    <span className="text-[10px] bg-white text-accent-600 px-1.5 py-0.5 rounded border border-accent-200">专属经纪人</span>
                  </div>
                  {order.workerPhone && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone size={10} />
                      {order.workerPhone}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {order.workerPhone && (
                  <a href={`tel:${order.workerPhone}`} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-transform">
                    <Phone size={15} />电话联系
                  </a>
                )}
              </div>
            </div>
          )}

          {order.pickupInfo && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-cyan-50 border border-brand-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Car size={15} className="text-brand-500" />车接信息
                </h4>
                <span className="text-[10px] text-brand-600 bg-brand-100/70 px-2 py-0.5 rounded-full font-medium">免费接送</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-xl p-2.5 shadow-sm">
                  <div className="text-[10px] text-gray-400 mb-0.5">车牌号</div>
                  <div className="font-bold text-gray-900 text-sm tracking-wide">{order.pickupInfo.carPlate}</div>
                </div>
                <div className="bg-white rounded-xl p-2.5 shadow-sm">
                  <div className="text-[10px] text-gray-400 mb-0.5">司机姓名</div>
                  <div className="font-bold text-gray-900 text-sm">{order.pickupInfo.driverName}</div>
                </div>
              </div>
              <div className="space-y-2 mb-3 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <Clock size={12} className="text-accent-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{formatTime(order.pickupInfo.pickupTime)}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <span>{order.pickupInfo.pickupPoint}</span>
                </div>
              </div>
              <a href={`tel:${order.pickupInfo.driverPhone}`} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-transform">
                <Phone size={15} />联系司机
              </a>
            </div>
          )}

          {order.subsidy && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-accent-50 to-orange-50 border border-accent-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Gift size={12} className="text-accent-500" />稳岗补贴
                </span>
                <span className="text-sm font-bold text-accent-600">¥{order.subsidy.amount.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-1.5 border border-accent-100">
                <div className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (order.subsidy.daysCompleted / order.subsidy.daysRequired) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>已完成 <b className="text-accent-600">{order.subsidy.daysCompleted}</b> 天</span>
                <span>需 <b className="text-gray-700">{order.subsidy.daysRequired}</b> 天</span>
              </div>
              {order.subsidy.paidAt && (
                <div className="text-[10px] text-success-600 mt-1">已于 {order.subsidy.paidAt.slice(0, 10)} 发放</div>
              )}
            </div>
          )}

          {order.referralBonus && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-success-50 to-emerald-50 border border-success-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Wallet size={12} className="text-success-500" />推荐奖金
                </span>
                <span className="text-sm font-bold text-success-600">¥{order.referralBonus.amount.toLocaleString()}</span>
              </div>
              {order.referralBonus.triggered && <div className="text-[10px] text-success-600 mt-1">已触发</div>}
              {order.referralBonus.paidAt && <div className="text-[10px] text-success-600">已于 {order.referralBonus.paidAt.slice(0, 10)} 发放</div>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {canArrive && (
              <button onClick={() => updateStatus(order.id, 'arrived', { description: '已到达工厂门卫，完成身份登记签到', operator: order.workerName })} className="col-span-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                <MapPin size={18} />到达工厂签到
              </button>
            )}
            {canDocument && (
              <button onClick={() => updateStatus(order.id, 'check-document', { description: '证件复印完成', operator: order.workerName })} className="py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold shadow-md flex items-center justify-center gap-1.5 text-sm active:scale-[0.98] transition-all">
                <FileText size={16} />证件复印完成
              </button>
            )}
            {canTraining && (
              <button onClick={() => updateStatus(order.id, 'sign-training', { operator: order.workerName })} className="py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold shadow-md flex items-center justify-center gap-1.5 text-sm active:scale-[0.98] transition-all">
                <GraduationCap size={16} />培训签到
              </button>
            )}
            {canResult && (
              <>
                <button onClick={() => setShowResultModal({ show: true, passed: true, orderId: order.id })} className="py-3 rounded-2xl bg-gradient-to-r from-success-500 to-success-600 text-white font-bold shadow-md flex items-center justify-center gap-1.5 text-sm active:scale-[0.98] transition-all">
                  <CheckCircle2 size={16} />面试通过
                </button>
                <button onClick={() => setShowResultModal({ show: true, passed: false, orderId: order.id })} className="py-3 rounded-2xl bg-gradient-to-r from-danger-500 to-danger-600 text-white font-bold shadow-md flex items-center justify-center gap-1.5 text-sm active:scale-[0.98] transition-all">
                  <XCircle size={16} />未通过
                </button>
              </>
            )}
          </div>
        </div>

        {order.timeline.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <div className="text-xs font-bold text-gray-700 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-400" />时间线</span>
              <span className="text-[10px] text-gray-400">共{order.timeline.length}条</span>
            </div>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {[...order.timeline].reverse().map((event, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-brand-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{event.type}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">{formatTime(event.time)}</span>
                    </div>
                    {event.description && <p className="text-xs text-gray-500 leading-relaxed">{event.description}</p>}
                    {event.operator && <div className="text-[10px] text-brand-500 mt-0.5">操作人：{event.operator}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryCard = (order: InterviewOrder) => {
    const isEmployed = order.status === 'employed';
    return (
      <div key={order.id} className="bg-white rounded-2xl shadow-card p-4 mb-3 border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{order.jobTitle}</h3>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Building2 size={11} /><span className="truncate">{order.factoryName}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">面试日期：{order.scheduledDate?.slice(0, 10)}</div>
          </div>
          <div className={cn('px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 flex items-center gap-1', isEmployed ? 'bg-success-50 text-success-600 border border-success-100' : 'bg-danger-50 text-danger-600 border border-danger-100')}>
            {isEmployed ? <CheckCircle size={11} /> : <XCircle size={11} />}
            {statusLabelMap[order.status]}
          </div>
        </div>

        {order.brokerName && (
          <div className="mb-3 p-3 rounded-xl bg-accent-50 border border-accent-100 flex items-center gap-2">
            <User size={14} className="text-accent-500" />
            <span className="text-xs text-gray-700">经纪人：{order.brokerName}</span>
            {order.workerPhone && <span className="text-xs text-gray-400 ml-auto">{order.workerPhone}</span>}
          </div>
        )}

        {isEmployed && order.subsidy && (
          <div className="bg-gradient-to-r from-accent-50 to-orange-50 rounded-xl p-3 border border-accent-100 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><Gift size={12} className="text-accent-500" />稳岗补贴进度</span>
              <span className="text-[10px] text-accent-600 font-bold">¥{order.subsidy.amount.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-1.5 border border-accent-100">
              <div className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (order.subsidy.daysCompleted / order.subsidy.daysRequired) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>已完成 <b className="text-accent-600">{order.subsidy.daysCompleted}</b> 天</span>
              <span>还需 <b className="text-gray-700">{Math.max(0, order.subsidy.daysRequired - order.subsidy.daysCompleted)}</b> 天</span>
            </div>
            {order.subsidy.paidAt && <div className="text-[10px] text-success-600 mt-1">已于 {order.subsidy.paidAt.slice(0, 10)} 发放</div>}
          </div>
        )}

        {order.referralBonus && (
          <div className="p-3 rounded-xl bg-success-50 border border-success-100 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><Wallet size={12} className="text-success-500" />推荐奖金</span>
              <span className="text-sm font-bold text-success-600">¥{order.referralBonus.amount.toLocaleString()}</span>
            </div>
            {order.referralBonus.paidAt && <div className="text-[10px] text-success-600 mt-1">已于 {order.referralBonus.paidAt.slice(0, 10)} 发放</div>}
          </div>
        )}

        {order.timeline.length > 0 && (
          <div className="border-t border-gray-50 pt-3">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {[...order.timeline].reverse().slice(0, 5).map((event, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-brand-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-gray-700">{event.type}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums">{formatTime(event.time)}</span>
                    </div>
                    {event.description && <p className="text-[10px] text-gray-500">{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pb-8">
        <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 text-white px-4 pt-12 pb-20 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-8 w-56 h-56 bg-accent-400/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">面试进度</h1>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 border border-white/20 text-center">
                <div className="text-3xl font-black tabular-nums">{tabCounts.active}</div>
                <div className="text-xs text-white/70 mt-0.5">进行中</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 border border-white/20 text-center">
                <div className="text-3xl font-black text-success-200 tabular-nums">{tabCounts.employed}</div>
                <div className="text-xs text-white/70 mt-0.5">已入职</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 border border-white/20 text-center">
                <div className="text-3xl font-black text-warning-200 tabular-nums">{tabCounts.failed}</div>
                <div className="text-xs text-white/70 mt-0.5">未通过</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-14">
          <div className="bg-white rounded-2xl shadow-card p-1.5 grid grid-cols-3 gap-1.5 sticky top-2 z-30">
            {tabs.map(tab => {
              const count = tabCounts[tab.key];
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('py-3 rounded-xl text-sm font-bold transition-all duration-200', active ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25' : 'text-gray-500 hover:bg-gray-50')}>
                  <span>{tab.label}</span>
                  {count > 0 && <span className={cn('ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums', active ? 'bg-white/25' : 'bg-gray-100 text-gray-500')}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 mt-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-brand-500 animate-spin mb-3" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : currentOrders.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-card py-16 px-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                {activeTab === 'active' ? <CalendarCheck size={36} className="text-gray-300" /> : activeTab === 'employed' ? <CheckCircle size={36} className="text-gray-300" /> : <AlertCircle size={36} className="text-gray-300" />}
              </div>
              <h3 className="font-bold text-gray-800 mb-1.5">
                {activeTab === 'active' ? '暂无进行中的面试' : activeTab === 'employed' ? '暂无入职记录' : '暂无未通过记录'}
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                {activeTab === 'active' ? '去首页看看有什么热门岗位吧！' : '继续加油，一定能找到合适的工作！'}
              </p>
              <button onClick={() => navigate('/worker')} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold shadow-lg active:scale-[0.98] transition-transform">
                去找岗位
              </button>
            </div>
          ) : (
            activeTab === 'active'
              ? currentOrders.map(o => renderActiveCard(o))
              : currentOrders.map(o => renderHistoryCard(o))
          )}
        </div>
      </div>

      {showResultModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6">
            <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg', showResultModal.passed ? 'bg-gradient-to-br from-success-400 to-success-600 shadow-success-500/30' : 'bg-gradient-to-br from-danger-400 to-danger-600 shadow-danger-500/30')}>
              {showResultModal.passed ? <CheckCircle2 size={36} className="text-white" /> : <XCircle size={36} className="text-white" />}
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{showResultModal.passed ? '确认面试通过？' : '确认面试未通过？'}</h3>
            <p className="text-center text-sm text-gray-500 leading-relaxed mb-5">
              {showResultModal.passed ? '确认通过后将进入入职办理流程。' : '此操作不可撤销，请如实反馈面试结果。'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResultModal({ show: false, passed: true })} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={() => {
                if (showResultModal.orderId) {
                  updateStatus(showResultModal.orderId, 'result', { passed: showResultModal.passed, remark: showResultModal.passed ? '面试通过' : '面试未通过', operator: '工人操作' });
                  if (showResultModal.passed) navigate('/worker/onboarding');
                }
                setShowResultModal({ show: false, passed: true });
              }} className={cn('flex-1 py-3 rounded-2xl text-white font-bold shadow-lg active:scale-[0.98] transition-all', showResultModal.passed ? 'bg-gradient-to-r from-success-500 to-success-600 shadow-success-500/25' : 'bg-gradient-to-r from-danger-500 to-danger-600 shadow-danger-500/25')}>
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
