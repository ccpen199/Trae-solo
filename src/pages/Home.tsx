import { useState } from 'react';
import { ArrowRight, ShieldCheck, Clock, Star, Sparkles, Baby, ChefHat, ClipboardList, MapPin, Phone, Zap, Shield, BadgeCheck, CircleDollarSign, Timer, Navigation, ChevronRight, HandHeart, LayoutDashboard, Building2, FileSearch, ScanLine, Flame, FileText, Mic, BarChart3, Gift, CheckCircle, AlertTriangle, UserCheck, Eye, Users, Award, TrendingUp, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import QuickOrderForm from '@/components/QuickOrderForm';
import { useAppStore, serviceTypeList } from '@/store';
import type { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

const today = new Date().toISOString().split('T')[0];

function getStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { className: string; label: string }> = {
    pending: { className: 'badge-gray', label: '待派单' },
    assigned: { className: 'badge-blue', label: '待接单' },
    accepted: { className: 'badge-blue', label: '已接单' },
    departing: { className: 'badge-orange', label: '已出发' },
    arrived: { className: 'badge-orange', label: '已到达' },
    servicing: { className: 'badge-orange', label: '服务中' },
    completed: { className: 'badge-green', label: '已完成' },
    cancelled: { className: 'badge-gray', label: '已取消' },
    compensated: { className: 'badge-red', label: '已赔付' },
  };
  return map[status];
}

const ongoingStatuses: OrderStatus[] = ['pending', 'assigned', 'accepted', 'departing', 'arrived', 'servicing'];

function OrderNodeTimeline({ order }: { order: Order }) {
  const nodes = order.nodes || [];
  if (nodes.length === 0) return null;

  return (
    <div className="mt-3 space-y-0">
      {nodes.map((node, i) => {
        const isDone = i < nodes.length - 1 || order.status === 'completed' || order.status === 'compensated';
        const isCurrent = !isDone;
        return (
          <div key={node.id} className="flex items-start gap-2">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                isDone ? 'bg-primary-500 text-white' : isCurrent ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300' : 'bg-gray-100 text-gray-400'
              )}>
                {isDone ? <CheckCircle className="w-2.5 h-2.5" /> : <span className="text-[7px]">{i + 1}</span>}
              </div>
              {i < nodes.length - 1 && <div className={cn('w-0.5 h-3', isDone ? 'bg-primary-300' : 'bg-gray-200')} />}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-[10px] font-medium', isDone ? 'text-secondary-700' : isCurrent ? 'text-primary-600' : 'text-gray-400')}>
                  {node.node_label}
                </span>
                <span className="text-[9px] text-secondary-400">{node.node_time.slice(11, 16)}</span>
              </div>
              {node.remark && <p className="text-[9px] text-secondary-400">{node.remark}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待派单',
  assigned: '已派单',
  accepted: '已接单',
  departing: '出发中',
  arrived: '已到达',
  servicing: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  compensated: '已赔付',
};

function RecentOrders() {
  const orders = useAppStore((state) => state.orders);
  const advanceOrderStatus = useAppStore((state) => state.advanceOrderStatus);
  const navigate = useNavigate();
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const recentOrders = orders.slice(0, 4);

  const handleAdvance = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvancingId(id);
    await new Promise((r) => setTimeout(r, 500));
    advanceOrderStatus(id);
    setAdvancingId(null);
  };

  if (recentOrders.length === 0) return null;

  return (
    <div className="mt-5 card p-4 border border-primary-100 bg-gradient-to-br from-white to-primary-50/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <ClipboardList className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-secondary-800">履约追踪 · 最近订单</h3>
            <p className="text-[9px] text-secondary-400">实时查看派单号/阿姨确认/节点通知</p>
          </div>
        </div>
        <Link to="/orders" className="text-[10px] text-primary-600 font-medium hover:text-primary-700 flex items-center gap-0.5">
          全部 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {recentOrders.map((order) => {
          const Icon = serviceIconMap[order.service_type];
          const canAdvance = !['completed', 'cancelled', 'compensated'].includes(order.status);
          const hasComp = !!order.compensation;
          const hasQA = !!order.qa_record;
          const isAdvancing = advancingId === order.id;
          return (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="p-2.5 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-secondary-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-secondary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-secondary-800 truncate">
                      {order.service_type_label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-mono">
                      #{order.id.toString().slice(-6)}
                    </span>
                    {order.worker_name && (
                      <span className="text-[9px] text-green-600 flex items-center gap-0.5">
                        <UserCheck className="w-2 h-2" />{order.worker_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] flex-wrap">
                    <span className="text-secondary-500 flex items-center gap-0.5">
                      <Clock className="w-2 h-2" />{order.start_time.slice(5, 16)}
                    </span>
                    {hasComp && (
                      <span className="text-red-600 flex items-center gap-0.5">
                        <CircleDollarSign className="w-2 h-2" />
                        赔付¥{order.compensation?.refund_amount || 0}
                      </span>
                    )}
                    {hasQA && (
                      <span className={cn(
                        'flex items-center gap-0.5',
                        order.qa_record?.review_conclusion === 'pass' ? 'text-green-600' : 'text-orange-600'
                      )}>
                        <BadgeCheck className="w-2 h-2" />
                        合规{order.qa_record?.compliance_rate}%
                      </span>
                    )}
                    {order.insurance && (
                      <span className="text-green-600 flex items-center gap-0.5">
                        <Shield className="w-2 h-2" />
                        已承保
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0',
                    ['completed'].includes(order.status) ? 'bg-green-100 text-green-700' :
                    ['cancelled', 'compensated'].includes(order.status) ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {statusLabelMap[order.status]}
                  </span>
                  {canAdvance && (
                    <button
                      onClick={(e) => handleAdvance(order.id, e)}
                      disabled={isAdvancing}
                      className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors disabled:opacity-50"
                      title="推进状态"
                    >
                      {isAdvancing ? (
                        <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrendingUp className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {order.nodes && order.nodes.length > 0 && (
                <div className="mt-2 pl-9 space-y-0.5">
                  {order.nodes.slice(-4).map((n, ni) => {
                    const isLast = ni === Math.min(order.nodes!.length, 4) - 1;
                    const isDone = !isLast || order.status === 'completed' || order.status === 'compensated';
                    return (
                      <div key={n.id} className="flex items-center gap-1.5">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          isDone ? 'bg-green-500' : 'bg-blue-500 ring-2 ring-blue-100'
                        )} />
                        <span className={cn('text-[9px]', isDone ? 'text-secondary-600' : 'text-blue-600 font-medium')}>
                          {n.node_label}
                        </span>
                        <span className="text-[8px] text-secondary-400">{n.node_time.slice(5, 16)}</span>
                        {n.remark && <span className="text-[8px] text-secondary-300 truncate">· {n.remark.slice(0, 15)}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-1.5 pl-9 flex-wrap">
                {order.insurance ? (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-green-50 text-green-600 flex items-center gap-0.5">
                    <Shield className="w-2 h-2" />保险{order.insurance.status === 'active' ? '生效中' : '已过期'} · 保额{(order.insurance.coverage_amount / 10000).toFixed(0)}万
                  </span>
                ) : (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-secondary-50 text-secondary-400">保险待承保</span>
                )}
                {order.is_overtime && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-red-50 text-red-600 flex items-center gap-0.5">
                    <CircleDollarSign className="w-2 h-2" />超时{order.overtime_minutes}min · 赔付已触发
                  </span>
                )}
                {!order.is_overtime && canAdvance && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-orange-50 text-orange-600 flex items-center gap-0.5">
                    <CircleDollarSign className="w-2 h-2" />爽约自动赔付保障
                  </span>
                )}
                {hasQA && (
                  <Link
                    to={`/orders/${order.id}#qa-record`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 flex items-center gap-0.5 hover:bg-blue-100"
                  >
                    <FileText className="w-2 h-2" />质检详情
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OngoingOrderCard({ order }: { order: Order }) {
  const Icon = serviceIconMap[order.service_type];
  const badge = getStatusBadge(order.status);
  const advanceOrderStatus = useAppStore((state) => state.advanceOrderStatus);
  const navigate = useNavigate();
  const [advancing, setAdvancing] = useState(false);
  const canAdvance = !['completed', 'cancelled', 'compensated'].includes(order.status);
  const canClaim = ['accepted', 'departing', 'arrived', 'servicing'].includes(order.status) || order.is_overtime;

  const handleAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvancing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    advanceOrderStatus(order.id);
    setAdvancing(false);
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.worker_phone) {
      window.location.href = `tel:${order.worker_phone}`;
    }
  };

  return (
    <div className="card-hover p-5 block">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
              {order.address_name && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary-100 text-secondary-500">{order.address_name}</span>
              )}
            </div>
            <p className="text-xs text-secondary-400">#{order.id} · 履约单据</p>
          </div>
        </div>
        <span className={badge.className}>{badge.label}</span>
      </div>

      <div className="space-y-1 text-xs mb-3">
        <div className="flex items-center gap-2 text-secondary-600">
          <Clock className="w-3 h-3 text-secondary-400" />
          <span>{order.start_time} · {order.duration_hours}h</span>
        </div>
        {order.worker_name && (
          <div className="flex items-center gap-2 text-secondary-600">
            <User className="w-3 h-3 text-secondary-400" />
            <span>{order.worker_name}</span>
            {order.worker_score && (
              <span className="text-yellow-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-500" />{order.worker_score}</span>
            )}
            {order.distance_km && <span className="text-secondary-400">· {order.distance_km}km</span>}
          </div>
        )}
        <div className="flex items-center gap-2 text-secondary-600">
          <MapPin className="w-3 h-3 text-secondary-400" />
          <span className="truncate">{order.address}</span>
        </div>
      </div>

      {order.is_overtime && (
        <div className="mb-3 flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full bg-red-50 text-red-600 w-fit">
          <AlertTriangle className="w-3 h-3" />超时{order.overtime_minutes}分钟 · 已触发自动赔付
        </div>
      )}

      {order.insurance && (
        <div className="mb-3 flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full bg-green-50 text-green-600 w-fit">
          <Shield className="w-3 h-3" />保单{order.insurance.policy_no.slice(-8)} · 保障中
        </div>
      )}

      <OrderNodeTimeline order={order} />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-lg font-bold text-primary-600">¥{order.amount}</p>
        <div className="flex items-center gap-1.5">
          {order.worker_phone && (
            <button
              onClick={handleCall}
              className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
            >
              <Phone className="w-2.5 h-2.5" />
              联系
            </button>
          )}
          {canAdvance && (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-medium hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              {advancing ? (
                <span className="inline-block w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrendingUp className="w-2.5 h-2.5" />
              )}
              推进
            </button>
          )}
          {canClaim && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
              className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <CircleDollarSign className="w-2.5 h-2.5" />
              赔付
            </button>
          )}
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-medium hover:bg-primary-100 transition-colors flex items-center gap-1"
          >
            详情
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletedOrderCard({ order }: { order: Order }) {
  const Icon = serviceIconMap[order.service_type];
  const badge = getStatusBadge(order.status);
  const hasCompensation = !!order.compensation;
  const hasQA = !!order.qa_record;

  return (
    <Link to={`/orders/${order.id}`} className="card-hover p-5 block">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
            <p className="text-xs text-secondary-400">#{order.id} · {order.address_name}</p>
          </div>
        </div>
        <span className={badge.className}>{badge.label}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-secondary-600 mb-2">
        <Clock className="w-3 h-3 text-secondary-400" />
        <span>{order.start_time}</span>
        {order.worker_name && (
          <>
            <span className="text-secondary-300">|</span>
            <span>{order.worker_name}</span>
            {order.worker_score && (
              <span className="text-yellow-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-500" />{order.worker_score}</span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {hasCompensation && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
            <Gift className="w-2.5 h-2.5" />赔付¥{order.compensation!.refund_amount}+券¥{order.compensation!.coupon_amount}
          </span>
        )}
        {hasQA && (
          <span className={cn(
            'text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1',
            order.qa_record!.review_conclusion === 'pass' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          )}>
            <UserCheck className="w-2.5 h-2.5" />
            质检{order.qa_record!.review_conclusion === 'pass' ? '通过' : '不通过'} · 合规{order.qa_record!.compliance_rate}%
          </span>
        )}
        {order.qa_record?.complaint_count === 0 && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">零投诉</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-lg font-bold text-primary-600">¥{order.amount}</p>
        <span className="text-xs text-primary-600 font-medium flex items-center gap-0.5">
          查看详情 <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  const orders = useAppStore((state) => state.orders);
  const getHomeStats = useAppStore((state) => state.getHomeStats);
  const stats = getHomeStats();
  const ongoingOrders = orders.filter(o => ongoingStatuses.includes(o.status)).slice(0, 2);
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'compensated' || o.status === 'cancelled').slice(0, 3);

  const guarantees = [
    { icon: BadgeCheck, title: '三证实名认证', desc: '身份证+健康证+无犯罪记录，OCR自动识别+人工复核双重保障', tag: '强管控', link: '/worker/profile' as const },
    { icon: CircleDollarSign, title: '爽约全额赔付', desc: '阿姨迟到超30分钟或未上门，全额返现+30元补偿券，24小时自动到账', tag: '零风险', link: '/orders' as const },
    { icon: Navigation, title: '1km智能派单', desc: '基于地理位置热力图调度，1km内优先派单，评分最高阿姨优先', tag: '极速匹配', link: '/admin/dispatch' as const },
    { icon: Shield, title: '全程保险保障', desc: '每单投保家政服务责任险，人身+财产双重保障，最高赔付50万元', tag: '安心服务', link: '/admin/insurance' as const },
  ];

  const compensationRules = [
    { condition: '阿姨迟到超过30分钟', refund: '100%全额退款', coupon: '+30元补偿券' },
    { condition: '阿姨未按约定上门', refund: '100%全额退款', coupon: '+30元补偿券' },
    { condition: '服务质量不达标', refund: '免费重新服务或退款', coupon: '+20元补偿券' },
    { condition: '服务过程造成损失', refund: '保险理赔', coupon: '最高50万元' },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <section className="relative overflow-hidden gradient-mesh">
        <div className="absolute inset-0 opacity-[0.03] noise-bg pointer-events-none" />
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5 animate-fade-up stagger-1">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                今日实时运营数据 · {today}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 leading-tight">
                三证强管控
                <br />
                <span className="text-primary-500">1km热力调度</span>
              </h1>
              <p className="text-sm text-secondary-600 leading-relaxed">
                基于地理位置热力图的智能派单系统，三证OCR+人工复核双重认证，
                爽约自动赔付+全程保险保障，给您最可信赖的家政服务体验。
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/dispatch" className="card p-4 bg-white/90 backdrop-blur-sm hover:ring-2 hover:ring-blue-200 transition-all block">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-secondary-500">今日已派单</span>
                  </div>
                  <p className="text-2xl font-bold text-secondary-800">{stats.todayDispatched}<span className="text-xs font-normal text-secondary-400 ml-1">单</span></p>
                  <p className="text-[10px] text-green-600 mt-0.5 flex items-center gap-0.5">↑ 12% 较昨日 <span className="text-secondary-400">→ 调度中心</span></p>
                </Link>
                <Link to="/orders" className="card p-4 bg-white/90 backdrop-blur-sm hover:ring-2 hover:ring-green-200 transition-all block">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <CircleDollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-secondary-500">赔付到账率</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.payoutRate}<span className="text-xs font-normal text-green-400 ml-1">%</span></p>
                  <p className="text-[10px] text-green-600 mt-0.5 flex items-center gap-0.5">24h自动到账 <span className="text-secondary-400">→ 赔付记录</span></p>
                </Link>
                <Link to="/admin/insurance" className="card p-4 bg-white/90 backdrop-blur-sm hover:ring-2 hover:ring-purple-200 transition-all block">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs text-secondary-500">保险承保率</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.insuranceRate}<span className="text-xs font-normal text-purple-400 ml-1">%</span></p>
                  <p className="text-[10px] text-secondary-500 mt-0.5 flex items-center gap-0.5">每单自动投保 <span className="text-secondary-400">→ 保险SaaS</span></p>
                </Link>
                <Link to="/admin/workers" className="card p-4 bg-white/90 backdrop-blur-sm hover:ring-2 hover:ring-orange-200 transition-all block">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Timer className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-xs text-secondary-500">1km平均到达</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.avgArriveKm}<span className="text-xs font-normal text-orange-400 ml-1">km</span></p>
                  <p className="text-[10px] text-secondary-500 mt-0.5 flex items-center gap-0.5">热力优先调度 <span className="text-secondary-400">→ 阿姨审核</span></p>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { icon: FileText, label: '服务SOP库', desc: '保洁/育婴/做饭', to: '/admin/sop', color: 'text-teal-600 bg-teal-50 hover:bg-teal-100 border-teal-200', steps: ['选择服务类型', '查看标准步骤', '按SOP执行'] },
                  { icon: Mic, label: '录音转文字', desc: '关键词合规质检', to: '/admin/qa', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200', steps: ['录音采集', 'ASR转文字', '关键词命中'] },
                  { icon: BarChart3, label: '差评根因聚类', desc: '词云+饼图+趋势', to: '/admin/qa', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200', steps: ['差评归集', '根因聚类', '处置建议'] },
                  { icon: Building2, label: '企业批量采购', desc: '物业/公寓服务包', to: '/enterprise', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200', steps: ['选择套餐', '批量下单', '统一结算'] },
                  { icon: Shield, label: '保险SaaS中心', desc: '4款产品/自动出单', to: '/admin/insurance', color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200', steps: ['选择险种', '自动出单', '理赔申请'] },
                  { icon: UserCheck, label: '阿姨三证审核', desc: 'OCR+人工复核', to: '/admin/workers', color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200', steps: ['OCR识别', '人工复核', '审核通过'] },
                ].map((entry, i) => {
                  const Icon = entry.icon;
                  return (
                    <Link key={i} to={entry.to} className={cn('flex flex-col gap-1.5 p-2.5 rounded-lg border transition-colors', entry.color)}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold leading-tight">{entry.label}</p>
                          <p className="text-[8px] opacity-70 leading-tight truncate">{entry.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[7px] opacity-60">
                        {entry.steps.map((step, si) => (
                          <span key={si} className="flex items-center gap-0.5">
                            <span className="w-3 h-3 rounded-full bg-current/20 flex items-center justify-center text-[6px] font-bold">{si + 1}</span>
                            <span className="truncate">{step}</span>
                            {si < entry.steps.length - 1 && <span className="opacity-40">→</span>}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <a href="#quick-order" className="btn-primary inline-flex items-center gap-2">
                  立即预约
                  <ArrowRight className="w-5 h-5" />
                </a>
                <Link to="/orders" className="btn-secondary inline-flex items-center gap-2">
                  我的订单
                  <ClipboardList className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-200 to-primary-300 border-2 border-white flex items-center justify-center text-[10px] font-medium text-primary-700">
                        阿{i}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary-800">{stats.workerCount}+认证阿姨</p>
                    <p className="text-[10px] text-secondary-400">平均评分 {stats.avgWorkerScore}分</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="quick-order" className="relative animate-fade-up stagger-2">
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-40 animate-float" />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-secondary-200 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }} />
              <div className="relative card p-5 md:p-6 border-2 border-primary-100">
                <QuickOrderForm />
              </div>
            </div>

            <RecentOrders />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">选择您需要的服务</h2>
          <p className="text-secondary-500">三大核心服务，满足您的家庭需求</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {serviceTypeList.map((service, index) => {
            const Icon = serviceIconMap[service.type];
            return (
              <div key={service.type} className={cn('card-hover p-8 animate-fade-up', `stagger-${index + 1}`)}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-5">
                  <Icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-secondary-800 mb-2">{service.label}</h3>
                <p className="text-secondary-500 mb-4">{service.description}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary-600">¥{service.price}</span>
                    <span className="text-sm text-secondary-400">/小时</span>
                  </div>
                  <a href="#quick-order" className="text-primary-600 font-medium text-sm flex items-center gap-1 hover:text-primary-700">
                    立即预约 <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-secondary-900 mb-3">四重服务保障</h2>
            <p className="text-secondary-500">每一单都让您安心、放心</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {guarantees.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.link} className={cn('card p-6 text-center animate-fade-up hover:border-primary-200 transition-colors', `stagger-${index + 1}`)}>
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary-500" />
                  </div>
                  <span className="badge-orange text-xs mb-2 inline-block">{item.tag}</span>
                  <h3 className="text-lg font-bold text-secondary-800 mb-2">{item.title}</h3>
                  <p className="text-secondary-500 text-sm leading-relaxed">{item.desc}</p>
                  <span className="text-primary-600 text-xs font-medium mt-3 inline-flex items-center gap-1">
                    查看详情 <Eye className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-4">
            <CircleDollarSign className="w-4 h-4" />
            爽约自动赔付
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">不满意？全额赔付</h2>
          <p className="text-secondary-500 max-w-2xl mx-auto">平台承诺爽约自动赔付，全额返现+补偿券，24小时内自动到账，让您下单零风险</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">赔付保障计划</h3>
                  <p className="text-primary-100 text-sm">平台先行垫付，保障您的每一分钱</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-100">最高赔付</p>
                  <p className="text-3xl font-bold">50万</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {compensationRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-cream-100 hover:bg-primary-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-800">{rule.condition}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-primary-600 font-bold">{rule.refund}</p>
                      <p className="text-xs text-secondary-500">{rule.coupon}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-start gap-3">
                  <Timer className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 text-sm">赔付时效</p>
                    <p className="text-yellow-700 text-sm mt-1">申请提交后24小时内自动审核到账，无需人工跟进。平台先行垫付，保障您的权益。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">我的订单</h2>
            <p className="text-secondary-500 mt-1">实时追踪服务进度，全程可视化</p>
          </div>
          <Link to="/orders" className="text-primary-600 font-medium hover:text-primary-700 inline-flex items-center gap-1">
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {ongoingOrders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-primary-600 mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              进行中的订单
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {ongoingOrders.map((order) => (
                <OngoingOrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {completedOrders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-secondary-600 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              已完成 / 已赔付
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {completedOrders.map((order) => (
                <CompletedOrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-secondary-500 mb-4">暂无订单，快去下单吧~</p>
            <a href="#quick-order" className="btn-primary inline-flex items-center gap-2">
              立即下单
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </section>

      <section className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">3秒完成预约</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">选服务、选地址、选时间，三步即可完成下单。爽约全额赔付，让您无忧体验。</p>
          <a href="#quick-order" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-full font-bold text-lg hover:bg-primary-50 hover:shadow-lg transition-all active:scale-95">
            <Zap className="w-5 h-5" />
            立即下单体验
          </a>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary-900 mb-3">多端业务入口</h2>
          <p className="text-secondary-500">从不同角色视角体验平台完整能力</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-hover p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <HandHeart className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">阿姨端</h3>
                <p className="text-xs text-secondary-500">阿姨接单工作台</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link to="/worker/profile" className="flex items-start gap-2 text-sm hover:bg-orange-50 p-2 rounded-lg transition-colors">
                <ScanLine className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">三证OCR识别+人工复核</p>
                  <p className="text-xs text-secondary-400">身份证/健康证/无犯罪记录 · 4步审核流程</p>
                </div>
                <ChevronRight className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/worker/scoring" className="flex items-start gap-2 text-sm hover:bg-orange-50 p-2 rounded-lg transition-colors">
                <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">服务评分动态加权</p>
                  <p className="text-xs text-secondary-400">准时率40% · 好评50% · 投诉10%</p>
                </div>
                <ChevronRight className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/worker" className="flex items-start gap-2 text-sm hover:bg-orange-50 p-2 rounded-lg transition-colors">
                <Flame className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">地理位置热力图调度</p>
                  <p className="text-xs text-secondary-400">1km内优先派单 · Canvas实时渲染</p>
                </div>
                <ChevronRight className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
              </Link>
            </div>
            <Link to="/worker" className="mt-4 flex items-center gap-1 text-orange-600 text-sm font-medium group-hover:gap-2 transition-all">
              进入阿姨端 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card-hover p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">管理后台</h3>
                <p className="text-xs text-secondary-500">运营管理中枢</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link to="/admin/workers" className="flex items-start gap-2 text-sm hover:bg-teal-50 p-2 rounded-lg transition-colors">
                <Shield className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">三证人工复核审核</p>
                  <p className="text-xs text-secondary-400">OCR结果确认 · 通过/驳回 · 审核队列</p>
                </div>
                <ChevronRight className="w-3 h-3 text-teal-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/admin/insurance" className="flex items-start gap-2 text-sm hover:bg-teal-50 p-2 rounded-lg transition-colors">
                <Shield className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">保险SaaS集成</p>
                  <p className="text-xs text-secondary-400">4款保险产品 · 自动投保/出单/理赔</p>
                </div>
                <ChevronRight className="w-3 h-3 text-teal-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/admin/sop" className="flex items-start gap-2 text-sm hover:bg-teal-50 p-2 rounded-lg transition-colors">
                <FileText className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">SOP标准文档库</p>
                  <p className="text-xs text-secondary-400">保洁/育婴/做饭3类SOP · 步骤详情</p>
                </div>
                <ChevronRight className="w-3 h-3 text-teal-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/admin/qa" className="flex items-start gap-2 text-sm hover:bg-teal-50 p-2 rounded-lg transition-colors">
                <Mic className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">录音转文字+差评根因聚类</p>
                  <p className="text-xs text-secondary-400">关键词合规检测 · 词云+饼图+趋势</p>
                </div>
                <ChevronRight className="w-3 h-3 text-teal-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/admin/dispatch" className="flex items-start gap-2 text-sm hover:bg-teal-50 p-2 rounded-lg transition-colors">
                <Navigation className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">调度热力图中心</p>
                  <p className="text-xs text-secondary-400">实时Canvas热力图 · 1km优先派单</p>
                </div>
                <ChevronRight className="w-3 h-3 text-teal-400 mt-1 flex-shrink-0" />
              </Link>
            </div>
            <Link to="/admin" className="mt-4 flex items-center gap-1 text-teal-600 text-sm font-medium group-hover:gap-2 transition-all">
              进入管理后台 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card-hover p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">企业客户</h3>
                <p className="text-xs text-secondary-500">批量采购服务包</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link to="/enterprise" className="flex items-start gap-2 text-sm hover:bg-purple-50 p-2 rounded-lg transition-colors">
                <Building2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">物业/公寓定制化服务包</p>
                  <p className="text-xs text-secondary-400">3档套餐 · 保洁+育婴+做饭灵活组合</p>
                </div>
                <ChevronRight className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/enterprise/orders" className="flex items-start gap-2 text-sm hover:bg-purple-50 p-2 rounded-lg transition-colors">
                <ClipboardList className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">批量订单管理</p>
                  <p className="text-xs text-secondary-400">次数卡模式 · 一键消耗下单</p>
                </div>
                <ChevronRight className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
              </Link>
              <Link to="/enterprise/billing" className="flex items-start gap-2 text-sm hover:bg-purple-50 p-2 rounded-lg transition-colors">
                <CircleDollarSign className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-secondary-700 font-medium">企业账单中心</p>
                  <p className="text-xs text-secondary-400">月度账单汇总 · 发票申请</p>
                </div>
                <ChevronRight className="w-3 h-3 text-purple-400 mt-1 flex-shrink-0" />
              </Link>
            </div>
            <Link to="/enterprise" className="mt-4 flex items-center gap-1 text-purple-600 text-sm font-medium group-hover:gap-2 transition-all">
              进入企业端 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-secondary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">暖</span>
              </div>
              <div>
                <p className="text-lg font-bold">暖心到家</p>
                <p className="text-secondary-300 text-sm">让每一个家都温暖如初</p>
              </div>
            </div>
            <div className="text-secondary-300 text-sm text-center md:text-right">
              <p>客服电话：400-888-8888</p>
              <p>服务时间：08:00 - 22:00</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-secondary-700 text-center text-secondary-400 text-sm">
            © 2026 暖心到家 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
