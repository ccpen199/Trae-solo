import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Baby, ChefHat, MapPin, Clock, Phone, ChevronLeft, ArrowLeft, Navigation, AlertTriangle, Star, Shield, FileText, Mic, BarChart3, Users, CheckCircle, CircleDollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Empty from '@/components/Empty';
import { useAppStore } from '@/store';
import type { Order, OrderStatus } from '@/types';
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

function MiniStatusHint({ status }: { status: OrderStatus }) {
  const hints: Partial<Record<OrderStatus, { icon: typeof Navigation; text: string; cls: string }>> = {
    pending: { icon: Navigation, text: '正在匹配1km内阿姨...', cls: 'text-primary-600 bg-primary-50' },
    assigned: { icon: Navigation, text: '等待阿姨接单确认', cls: 'text-blue-600 bg-blue-50' },
    accepted: { icon: Navigation, text: '阿姨已接单，请保持畅通', cls: 'text-blue-600 bg-blue-50' },
    departing: { icon: Navigation, text: '阿姨已出发，正在赶来', cls: 'text-orange-600 bg-orange-50' },
    arrived: { icon: Navigation, text: '阿姨已到达服务地址', cls: 'text-orange-600 bg-orange-50' },
    servicing: { icon: Navigation, text: '服务进行中', cls: 'text-orange-600 bg-orange-50' },
  };
  const hint = hints[status];
  if (!hint) return null;
  const Icon = hint.icon;
  return (
    <div className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mt-3 w-fit', hint.cls)}>
      <Icon className="w-3 h-3" />
      {hint.text}
    </div>
  );
}

function NodeTimeline({ status }: { status: OrderStatus }) {
  const nodes = [
    { key: 'pending', label: '派单', doneStatuses: ['assigned', 'accepted', 'departing', 'arrived', 'servicing', 'completed', 'compensated'] },
    { key: 'accepted', label: '接单', doneStatuses: ['departing', 'arrived', 'servicing', 'completed', 'compensated'] },
    { key: 'departing', label: '出发', doneStatuses: ['arrived', 'servicing', 'completed', 'compensated'] },
    { key: 'arrived', label: '到达', doneStatuses: ['servicing', 'completed', 'compensated'] },
    { key: 'servicing', label: '服务中', doneStatuses: ['completed', 'compensated'] },
    { key: 'completed', label: '完成', doneStatuses: [] as OrderStatus[] },
  ];

  const timeMap: Partial<Record<OrderStatus, string>> = {
    pending: '3分钟内',
    assigned: '5分钟内',
    accepted: '10分钟内',
    departing: '20分钟内',
    arrived: '即将开始',
    servicing: '进行中',
    completed: '已结束',
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-0.5">
        {nodes.map((node, i) => {
          const isDone = node.doneStatuses.includes(status);
          const isActive = node.key === status || (node.key === 'pending' && status === 'pending') || (node.key === 'completed' && (status === 'completed' || status === 'compensated'));
          const isCurrent = node.key === status;
          return (
            <div key={node.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all',
                  isDone ? 'bg-primary-500 text-white' : isCurrent ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300' : 'bg-gray-100 text-gray-400'
                )}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={cn('text-[9px] mt-0.5', isDone || isCurrent ? 'text-secondary-700 font-medium' : 'text-gray-400')}>
                  {node.label}
                </span>
              </div>
              {i < nodes.length - 1 && (
                <div className={cn('h-0.5 flex-1 -mt-3', isDone ? 'bg-primary-400' : 'bg-gray-200')} />
              )}
            </div>
          );
        })}
      </div>
      {timeMap[status] && (
        <p className="text-[10px] text-secondary-400 mt-1 text-right">预计 {timeMap[status]}</p>
      )}
    </div>
  );
}

function CompletedOrderDetail({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const rating = 4.8;
  const punctuality = 95;
  const satisfaction = 92;
  const complaintCount = 0;
  const hasQACheck = true;
  const hasRecording = true;
  const recordingText = '阿姨准时到达，服务态度很好，厨房和卫生间清洁很仔细，客户表示满意。';
  const rootCause = complaintCount > 0 ? '沟通不畅' : '无差评';

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs text-secondary-500 hover:text-primary-600"
      >
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          服务评分与质量回溯
        </span>
        <ChevronLeft className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 animate-fade-up">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <Star className="w-4 h-4 text-yellow-500 mx-auto mb-0.5 fill-yellow-500" />
              <p className="text-sm font-bold text-yellow-700">{rating}</p>
              <p className="text-[9px] text-yellow-600">综合评分</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-green-700">{punctuality}%</p>
              <p className="text-[9px] text-green-600">准时率</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <Shield className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-blue-700">{satisfaction}%</p>
              <p className="text-[9px] text-blue-600">满意度</p>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-lg p-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-secondary-500">投诉次数</span>
              <span className={cn('font-medium', complaintCount === 0 ? 'text-green-600' : 'text-red-600')}>
                {complaintCount}次
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1">
              <span className="text-secondary-500">差评根因</span>
              <span className={cn('font-medium', complaintCount === 0 ? 'text-green-600' : 'text-red-600')}>
                {rootCause}
              </span>
            </div>
          </div>

          {hasQACheck && (
            <div className="bg-primary-50 rounded-lg p-2">
              <div className="flex items-center gap-1.5 text-[10px] text-primary-700 font-medium mb-1">
                <FileText className="w-3 h-3" />
                质检复查
              </div>
              <p className="text-[10px] text-primary-600">录音转文字质检已通过 · 关键词合规率 98%</p>
            </div>
          )}

          {hasRecording && (
            <div className="bg-cream-100 rounded-lg p-2">
              <div className="flex items-center gap-1.5 text-[10px] text-secondary-700 font-medium mb-1">
                <Mic className="w-3 h-3" />
                录音转文字摘要
              </div>
              <p className="text-[10px] text-secondary-600 leading-relaxed">{recordingText}</p>
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
  return (
    <div className="mt-3 flex items-center gap-2">
      <Link
        to={`/orders/${order.id}`}
        className="flex-1 text-center py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
      >
        追踪详情
      </Link>
      {['accepted', 'departing', 'arrived', 'servicing'].includes(order.status) && (
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
              const isCompleted = order.status === 'completed' || order.status === 'compensated';

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
                          <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
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
                        </div>
                      )}
                    </div>
                  </Link>

                  {isOngoing && (
                    <>
                      <MiniStatusHint status={order.status} />
                      <NodeTimeline status={order.status} />
                      <OngoingActions order={order} />
                    </>
                  )}

                  {isCompleted && (
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
