import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Baby, ChefHat, MapPin, Clock, Phone, ChevronLeft, ArrowLeft, Navigation, AlertTriangle, Star, Shield, FileText, Mic, BarChart3, Users, CheckCircle, CircleDollarSign, Gift, UserCheck, CalendarDays, Award, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, XCircle, Timer } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Empty from '@/components/Empty';
import { useAppStore } from '@/store';
import type { Order, OrderStatus, CompensationRecord, QARecordDetail } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

type FilterTab = 'all' | 'ongoing' | 'completed';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ongoing', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

function getStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { className: string; label: string }> = {
    pending: { className: 'badge-gray', label: '待派单' },
    assigned: { className: 'badge-blue', label: '待接单' },
    accepted: { className: 'badge-blue', label: '已接单' },
    departing: { className: 'badge-orange', label: '已出发' },
    arrived: { className: 'badge-orange', label: '服务中' },
    servicing: { className: 'badge-orange', label: '服务中' },
    completed: { className: 'badge-green', label: '已完成' },
    cancelled: { className: 'badge-gray', label: '已取消' },
    compensated: { className: 'badge-red', label: '已赔付' },
  };
  return map[status];
}

const ongoingStatuses: OrderStatus[] = ['pending', 'assigned', 'accepted', 'departing', 'arrived', 'servicing'];

function MiniStatusHint({ order }: { order: Order }) {
  const status = order.status;
  const hints: Partial<Record<OrderStatus, { icon: typeof Navigation; text: string; cls: string }>> = {
    pending: { icon: Navigation, text: '正在匹配1km内阿姨...', cls: 'text-primary-600 bg-primary-50' },
    assigned: { icon: Navigation, text: '等待阿姨接单确认', cls: 'text-blue-600 bg-blue-50' },
    accepted: { icon: Navigation, text: '阿姨已接单，请保持畅通', cls: 'text-blue-600 bg-blue-50' },
    departing: { icon: Navigation, text: '阿姨已出发，正在赶来', cls: 'text-orange-600 bg-orange-50' },
    arrived: { icon: Navigation, text: '阿姨已到达服务地址', cls: 'text-orange-600 bg-orange-50' },
    servicing: { icon: Navigation, text: '服务进行中', cls: 'text-orange-600 bg-orange-50' },
  };

  const overtimeHint = order.is_overtime
    ? { icon: AlertTriangle, text: `超时${order.overtime_minutes}分钟 · 已触发自动赔付`, cls: 'text-red-600 bg-red-50' }
    : null;

  const hint = overtimeHint || hints[status];
  if (!hint) return null;
  const Icon = hint.icon;
  return (
    <div className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mt-3 w-fit', hint.cls)}>
      <Icon className="w-3 h-3" />
      {hint.text}
    </div>
  );
}

function NodeTimeline({ order }: { order: Order }) {
  const nodes = order.nodes || [];

  if (nodes.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-secondary-500 font-medium">履约节点追踪</span>
        <span className="text-[10px] text-secondary-400">{nodes.length}个节点</span>
      </div>
      <div className="relative">
        <div className="flex items-start">
          {nodes.slice(0, 6).map((node, i) => {
            const isDone = i < nodes.length - 1 || order.status === 'completed' || order.status === 'compensated';
            const isLast = i === nodes.length - 1;
            return (
              <div key={node.id} className="flex-1 flex flex-col items-center relative">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold z-10 flex-shrink-0 transition-all',
                  isDone
                    ? 'bg-primary-500 text-white'
                    : 'bg-primary-100 text-primary-600 ring-2 ring-primary-300 animate-pulse-ring'
                )}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div className="text-center mt-1">
                  <p className={cn('text-[9px] font-medium leading-tight', isDone ? 'text-secondary-700' : 'text-primary-600')}>
                    {node.node_label}
                  </p>
                  <p className="text-[8px] text-secondary-400 mt-0.5">
                    {node.node_time.slice(11, 16)}
                  </p>
                </div>
                {!isLast && (
                  <div className={cn(
                    'absolute top-2.5 left-1/2 w-full h-0.5 -translate-y-1/2',
                    isDone ? 'bg-primary-400' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompensationCard({ compensation }: { compensation: CompensationRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 bg-red-50 rounded-xl p-3 border border-red-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
            <Gift className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-red-700">
              爽约自动赔付 · {compensation.status === 'paid' ? '已到账' : compensation.status === 'approved' ? '审核通过' : '处理中'}
            </p>
            <p className="text-[10px] text-red-500">{compensation.trigger_type === 'auto' ? '系统自动触发' : '人工申请'}</p>
          </div>
        </div>
        <ChevronLeft className={cn('w-3.5 h-3.5 text-red-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2.5 animate-fade-up">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-2 text-center">
              <CircleDollarSign className="w-4 h-4 text-green-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-green-600">¥{compensation.refund_amount}</p>
              <p className="text-[9px] text-green-500">全额退款</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <Gift className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-orange-600">¥{compensation.coupon_amount}</p>
              <p className="text-[9px] text-orange-500">补偿券</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-secondary-500">赔付原因</span>
              <span className="text-secondary-700 font-medium text-right">{compensation.reason_category}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-secondary-500">详细说明</span>
              <span className="text-secondary-600 text-right max-w-[60%]">{compensation.reason}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-secondary-500">补偿券码</span>
              <span className="text-primary-600 font-mono font-medium">{compensation.coupon_code}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-secondary-500">审核人</span>
              <span className="text-secondary-700">{compensation.auditor}</span>
            </div>
          </div>

          <div className="space-y-1">
            {compensation.created_at && (
              <div className="flex items-center gap-2 text-[10px]">
                <Clock className="w-3 h-3 text-secondary-400 flex-shrink-0" />
                <span className="text-secondary-500">申请时间：</span>
                <span className="text-secondary-600">{compensation.created_at}</span>
              </div>
            )}
            {compensation.approved_at && (
              <div className="flex items-center gap-2 text-[10px]">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-secondary-500">审核通过：</span>
                <span className="text-green-600">{compensation.approved_at}</span>
              </div>
            )}
            {compensation.paid_at && (
              <div className="flex items-center gap-2 text-[10px]">
                <CircleDollarSign className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-secondary-500">到账时间：</span>
                <span className="text-green-600 font-medium">{compensation.paid_at} · 24小时内极速到账</span>
              </div>
            )}
          </div>

          {compensation.description && (
            <p className="text-[10px] text-secondary-500 bg-white/60 rounded-lg p-2 leading-relaxed">
              {compensation.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CompletedOrderDetail({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const qa = order.qa_record;
  if (!qa) return null;

  const conclusionLabel = qa.review_conclusion === 'pass' ? '质检通过' : qa.review_conclusion === 'warning' ? '质检警告' : '质检不通过';
  const conclusionCls = qa.review_conclusion === 'pass' ? 'bg-green-100 text-green-700 border-green-200' : qa.review_conclusion === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200';

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors',
          conclusionCls,
          !expanded && 'hover:opacity-80'
        )}
      >
        <span className="flex items-center gap-2 text-xs font-bold">
          {qa.review_conclusion === 'pass' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          服务评分与质量回溯
          <span className="font-normal text-[10px]">{conclusionLabel}</span>
          <span className="font-normal text-[10px]">合规{qa.compliance_rate}%</span>
        </span>
        <ChevronLeft className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2.5 animate-fade-up">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <Star className="w-4 h-4 text-yellow-500 mx-auto mb-0.5 fill-yellow-500" />
              <p className="text-sm font-bold text-yellow-700">{qa.rating ?? 4.8}</p>
              <p className="text-[9px] text-yellow-600">客户评分</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-green-700">{qa.compliance_rate}%</p>
              <p className="text-[9px] text-green-600">质检合规率</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <Award className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-blue-700">{qa.complaint_count === 0 ? '0' : qa.complaint_count}</p>
              <p className="text-[9px] text-blue-600">投诉次数</p>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-secondary-700 font-medium">
              <BarChart3 className="w-3 h-3" />
              差评根因分析
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-secondary-500">根因分类</span>
                <span className={cn('font-medium', qa.complaint_count > 0 ? 'text-red-600' : 'text-green-600')}>
                  {qa.root_cause_category}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-secondary-500">具体原因</span>
                <span className="text-secondary-700 text-right max-w-[60%]">{qa.root_cause}</span>
              </div>
              {qa.root_cause_detail && (
                <div className="flex items-start justify-between text-[10px]">
                  <span className="text-secondary-500 flex-shrink-0">详细分析</span>
                  <p className="text-secondary-600 text-right max-w-[65%] leading-relaxed">{qa.root_cause_detail}</p>
                </div>
              )}
            </div>
          </div>

          {qa.keywords && qa.keywords.length > 0 && (
            <div className="bg-primary-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-primary-700 font-medium mb-1.5">
                <MessageSquare className="w-3 h-3" />
                关键词检测
                <span className="text-[9px] text-primary-500 font-normal">· 命中{qa.keywords.filter(k => k.hit).length}/{qa.keywords.length}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {qa.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full',
                      kw.hit ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {kw.hit ? '✓' : '○'} {kw.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-cream-100 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-secondary-700 font-medium mb-1.5">
              <Mic className="w-3 h-3" />
              录音转文字摘要
              <span className="text-[9px] text-secondary-400 font-normal">· 时长{Math.floor(qa.audio_duration / 60)}分钟</span>
            </div>
            <p className="text-[10px] text-secondary-600 leading-relaxed">{qa.transcript_summary}</p>
            {qa.transcript_full && (
              <details className="mt-1.5">
                <summary className="text-[9px] text-primary-600 cursor-pointer hover:text-primary-700">展开完整转写</summary>
                <p className="text-[9px] text-secondary-500 mt-1 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{qa.transcript_full}</p>
              </details>
            )}
          </div>

          {qa.qa_status === 'completed' && (
            <div className="bg-blue-50 rounded-lg p-2.5 space-y-1.5 border border-blue-100">
              <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-medium">
                <UserCheck className="w-3 h-3" />
                质检审计留痕
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="text-[10px]">
                  <span className="text-secondary-500">复查人：</span>
                  <span className="text-secondary-700 font-medium">{qa.reviewer}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-secondary-500">复查时间：</span>
                  <span className="text-secondary-700">{qa.review_time}</span>
                </div>
              </div>
              <div className="text-[10px]">
                <span className="text-secondary-500">质检结论：</span>
                <span className={cn(
                  'font-medium',
                  qa.review_conclusion === 'pass' ? 'text-green-600' : qa.review_conclusion === 'warning' ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {qa.review_conclusion === 'pass' ? '通过' : qa.review_conclusion === 'warning' ? '警告' : '不通过'}
                </span>
              </div>
              {qa.review_remark && (
                <div className="text-[10px] bg-white/60 rounded p-1.5 mt-1">
                  <span className="text-secondary-500">复查意见：</span>
                  <span className="text-secondary-600">{qa.review_remark}</span>
                </div>
              )}
            </div>
          )}

          <Link
            to={`/orders/${order.id}`}
            className="block text-center text-xs text-primary-600 font-medium hover:text-primary-700 pt-1"
          >
            查看完整订单详情 →
          </Link>
        </div>
      )}
    </div>
  );
}

function OngoingActions({ order }: { order: Order }) {
  const advanceOrderStatus = useAppStore((state) => state.advanceOrderStatus);
  const [advancing, setAdvancing] = useState(false);
  const canClaimCompensation = ['accepted', 'departing', 'arrived', 'servicing'].includes(order.status) || order.is_overtime;
  const canAdvance = order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'compensated';

  const handleAdvance = async () => {
    setAdvancing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    advanceOrderStatus(order.id);
    setAdvancing(false);
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <Link
        to={`/orders/${order.id}`}
        className="flex-1 text-center py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
      >
        追踪详情
      </Link>
      {canAdvance && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="flex-1 text-center py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
        >
          {advancing ? (
            <span className="inline-block w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-3 h-3" />
          )}
          {advancing ? '推进中...' : '推进状态'}
        </button>
      )}
      {canClaimCompensation && (
        <Link
          to={`/orders/${order.id}`}
          className="flex-1 text-center py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          申请赔付
        </Link>
      )}
    </div>
  );
}

export default function OrderList() {
  const orders = useAppStore((state) => state.orders);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return ongoingStatuses.includes(order.status);
    if (activeTab === 'completed') return order.status === 'completed' || order.status === 'compensated' || order.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="p-2 rounded-lg hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">我的订单</h1>
            <p className="text-secondary-500">查看和管理您的所有服务订单</p>
          </div>
        </div>

        <div className="card p-2 mb-6 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'text-secondary-600 hover:bg-secondary-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <Empty
            type="orders"
            action={
              <Link to="/" className="btn-primary inline-flex items-center gap-2">
                去下单
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const Icon = serviceIconMap[order.service_type];
              const badge = getStatusBadge(order.status);
              const isOngoing = ongoingStatuses.includes(order.status);
              const isCompleted = order.status === 'completed' || order.status === 'compensated' || order.status === 'cancelled';
              const hasCompensation = !!order.compensation;

              return (
                <div
                  key={order.id}
                  className="card p-6 animate-fade-up"
                >
                  <Link to={`/orders/${order.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          isOngoing ? 'bg-primary-50 text-primary-500' : isCompleted ? 'bg-green-50 text-green-500' : 'bg-secondary-50 text-secondary-500'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
                            {order.address_name && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary-100 text-secondary-500">
                                {order.address_name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary-500">订单号 #{order.id}</p>
                        </div>
                      </div>
                      <span className={badge.className}>{badge.label}</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-secondary-600">
                        <MapPin className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-secondary-600">
                        <Clock className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                        <span>{order.start_time} · {order.duration_hours}小时</span>
                      </div>
                      {order.worker_name && (
                        <div className="flex items-center gap-2 text-secondary-600">
                          <Phone className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                          <span>{order.worker_name} · {order.worker_phone}</span>
                          {order.worker_score && (
                            <span className="text-yellow-500 text-xs flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-500" />
                              {order.worker_score}
                            </span>
                          )}
                          {order.distance_km && (
                            <span className="text-secondary-400 text-xs">· {order.distance_km}km</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  {isOngoing && (
                    <>
                      <MiniStatusHint order={order} />
                      <NodeTimeline order={order} />
                      <OngoingActions order={order} />
                    </>
                  )}

                  {hasCompensation && (
                    <CompensationCard compensation={order.compensation!} />
                  )}

                  {(order.status === 'completed' || order.status === 'compensated') && order.qa_record && (
                    <CompletedOrderDetail order={order} />
                  )}

                  <Link to={`/orders/${order.id}`}>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-sm text-secondary-500">订单金额</span>
                        <p className="text-2xl font-bold text-primary-600">¥{order.amount}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary-600 font-medium">
                        查看详情
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
