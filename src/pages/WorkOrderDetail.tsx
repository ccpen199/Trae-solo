import { useState } from 'react';
import {
  MapPin,
  User,
  Clock,
  Wrench,
  Phone,
  FileText,
  Star,
  Camera,
  MessageSquare,
  Send,
  ChevronDown,
} from 'lucide-react';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Timeline from '@/components/Timeline';
import Button from '@/components/Button';
import Tabs, { TabPanel } from '@/components/Tabs';
import { cn } from '@/lib/utils';

interface WorkOrder {
  id: string;
  user_id: string;
  user_name: string;
  account_no: string;
  address: string;
  phone?: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'dispatched' | 'in_progress' | 'completed' | 'closed';
  assignee: string | null;
  grid_area: string;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
  images: string[];
  evaluation: {
    rating: number;
    comment: string;
    evaluatedAt: string;
  } | null;
  warning_id: string | null;
}

interface WorkOrderDetailProps {
  open: boolean;
  onClose: () => void;
  order: WorkOrder | null;
  onStatusUpdate?: (orderId: string, status: string) => void;
  onEvaluate?: (orderId: string, rating: number, comment: string) => boolean | Promise<boolean>;
}

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: '待派单' },
  dispatched: { variant: 'info', label: '已派单' },
  in_progress: { variant: 'info', label: '处理中' },
  completed: { variant: 'success', label: '已完成' },
  closed: { variant: 'default', label: '已关闭' },
};

const priorityConfig: Record<string, { color: string; label: string; bg: string; text: string }> = {
  low: { color: 'bg-green-500', label: '低', bg: 'bg-green-50', text: 'text-green-700' },
  medium: { color: 'bg-blue-500', label: '中', bg: 'bg-blue-50', text: 'text-blue-700' },
  high: { color: 'bg-amber-500', label: '高', bg: 'bg-amber-50', text: 'text-amber-700' },
  urgent: { color: 'bg-red-500', label: '紧急', bg: 'bg-red-50', text: 'text-red-700' },
};

const typeLabels: Record<string, string> = {
  repair: '维修',
  install: '安装',
  inspection: '安检',
  leak: '泄漏',
  meter: '表具',
  other: '其他',
};

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function generateTimelineItems(order: WorkOrder) {
  const items: Array<{ id: string; title: string; description?: string; time?: string; status: 'completed' | 'current' | 'pending' }> = [];

  items.push({
    id: 'created',
    title: '工单创建',
    description: `用户 ${order.user_name} 提交报修申请`,
    time: order.created_at ? formatDateTime(order.created_at) : undefined,
    status: 'completed',
  });

  if (order.dispatched_at || order.status !== 'pending') {
    items.push({
      id: 'dispatched',
      title: '工单派发',
      description: order.assignee ? `已派单给 ${order.assignee}` : '系统自动派单',
      time: order.dispatched_at ? formatDateTime(order.dispatched_at) : undefined,
      status: order.status === 'pending' ? 'pending' : 'completed',
    });
  } else {
    items.push({
      id: 'dispatched',
      title: '工单派发',
      description: '等待派单人员分配',
      status: 'pending',
    });
  }

  if (order.status === 'in_progress' || order.status === 'completed' || order.status === 'closed') {
    items.push({
      id: 'in_progress',
      title: '处理中',
      description: order.assignee ? `${order.assignee} 正在处理` : '维修人员正在处理',
      status: order.status === 'in_progress' ? 'current' : 'completed',
    });
  } else if (order.status === 'dispatched') {
    items.push({
      id: 'in_progress',
      title: '处理中',
      description: '等待维修人员开始处理',
      status: 'pending',
    });
  }

  if (order.completed_at || order.status === 'completed' || order.status === 'closed') {
    items.push({
      id: 'completed',
      title: '工单完成',
      description: '维修处理完成',
      time: order.completed_at ? formatDateTime(order.completed_at) : undefined,
      status: order.status === 'completed' || order.status === 'closed' ? 'completed' : 'pending',
    });
  }

  if (order.status === 'closed') {
    items.push({
      id: 'closed',
      title: '工单关闭',
      description: '工单已关闭归档',
      status: 'completed',
    });
  }

  return items;
}

export default function WorkOrderDetail({
  open,
  onClose,
  order,
  onStatusUpdate,
  onEvaluate,
}: WorkOrderDetailProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  if (!order) return null;

  const status = statusConfig[order.status];
  const priority = priorityConfig[order.priority];
  const timelineItems = generateTimelineItems(order);

  const handleStatusChange = async (newStatus: string) => {
    setShowStatusDropdown(false);
    onStatusUpdate?.(order.id, newStatus);
  };

  const handleSubmitEvaluation = async () => {
    if (!onEvaluate) return;

    setSubmittingEvaluation(true);
    const success = onEvaluate(order.id, rating, comment);
    if (success) {
      setComment('');
    }
    setSubmittingEvaluation(false);
  };

  const nextStatusOptions = (() => {
    switch (order.status) {
      case 'pending':
        return [{ key: 'dispatched', label: '派单' }];
      case 'dispatched':
        return [{ key: 'in_progress', label: '开始处理' }];
      case 'in_progress':
        return [{ key: 'completed', label: '完成工单' }];
      case 'completed':
        return [{ key: 'closed', label: '关闭工单' }];
      default:
        return [];
    }
  })();

  const tabItems = [
    { key: 'detail', label: '工单详情' },
    { key: 'timeline', label: '处理进度' },
    { key: 'evaluation', label: '评价' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="工单详情"
      size="xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            工单编号：<span className="font-mono font-medium text-gray-700">{order.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              关闭
            </Button>
            {nextStatusOptions.length > 0 && (
              <div className="relative">
                <Button
                  icon={ChevronDown}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  变更状态
                </Button>
                {showStatusDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-20">
                    {nextStatusOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleStatusChange(opt.key)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-800">{order.title}</h2>
              <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', priority.bg, priority.text)}>
                {priority.label}优先级
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge variant={status.variant} icon>
                {status.label}
              </StatusBadge>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
                {typeLabels[order.type] || order.type}
              </span>
              <span className="text-sm text-gray-400">
                所属片区：{order.grid_area}
              </span>
            </div>
          </div>
        </div>

        <Tabs items={tabItems} defaultActiveKey="detail">
          <TabPanel tabKey="detail">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-500" />
                    用户信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">姓名</span>
                      <span className="text-sm font-medium text-gray-800">{order.user_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">户号</span>
                      <span className="text-sm font-medium text-gray-800 font-mono">{order.account_no}</span>
                    </div>
                    {order.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">联系电话</span>
                        <div className="flex items-center gap-1 text-sm font-medium text-primary-600">
                          <Phone className="w-3.5 h-3.5" />
                          {order.phone}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-500 flex-shrink-0">地址</span>
                      <div className="flex items-start gap-1 text-sm text-gray-700 text-right">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{order.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary-500" />
                    派单信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">派单人员</span>
                      <span className="text-sm font-medium text-gray-800">
                        {order.assignee || '待分配'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">创建时间</span>
                      <span className="text-sm text-gray-700">
                        {order.created_at ? formatDateTime(order.created_at) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">派单时间</span>
                      <span className="text-sm text-gray-700">
                        {order.dispatched_at ? formatDateTime(order.dispatched_at) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">完成时间</span>
                      <span className="text-sm text-gray-700">
                        {order.completed_at ? formatDateTime(order.completed_at) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  故障描述
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{order.description}</p>
              </div>

              {order.images && order.images.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary-500" />
                    现场照片
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {order.images.map((img, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`现场照片 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="flex flex-col items-center text-gray-400"><Camera class="w-8 h-8 mb-1" /><span class="text-xs">图片</span></div>';
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-500" />
                  处理记录
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">系统</span>
                        <span className="text-xs text-gray-400">
                          {order.created_at ? formatDateTime(order.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">工单创建成功，等待分配处理人员</p>
                    </div>
                  </div>

                  {order.dispatched_at && (
                    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {order.assignee || '系统派单'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(order.dispatched_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">工单已派发，等待维修人员接单处理</p>
                      </div>
                    </div>
                  )}

                  {order.status === 'in_progress' && (
                    <div className="flex gap-3 p-3 bg-white rounded-lg border border-primary-200 bg-primary-50/30">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {order.assignee || '维修人员'}
                          </span>
                          <span className="text-xs text-primary-600 font-medium">处理中</span>
                        </div>
                        <p className="text-sm text-gray-600">维修人员正在现场处理故障</p>
                      </div>
                    </div>
                  )}

                  {order.completed_at && (
                    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {order.assignee || '维修人员'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(order.completed_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">维修处理完成，等待用户确认</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel tabKey="timeline">
            <div className="py-4">
              <Timeline items={timelineItems} />
            </div>
          </TabPanel>

          <TabPanel tabKey="evaluation">
            <div className="space-y-6">
              {order.evaluation ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">用户评价</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-5 h-5',
                            i < order.evaluation!.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-amber-600 ml-2">
                      {order.evaluation.rating}.0
                    </span>
                    <span className="text-sm text-gray-500">分</span>
                  </div>
                  {order.evaluation.comment && (
                    <p className="text-sm text-gray-600 mt-3 bg-white/60 rounded-lg p-3">
                      "{order.evaluation.comment}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    评价时间：{formatDateTime(order.evaluation.evaluatedAt)}
                  </p>
                </div>
              ) : order.status === 'completed' ? (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">提交评价</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      服务评分
                    </label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        const isFilled = (hoverRating || rating) >= starValue;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                'w-8 h-8 transition-colors',
                                isFilled
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-300'
                              )}
                            />
                          </button>
                        );
                      })}
                      <span className="text-sm text-gray-500 ml-2">
                        {rating} 星
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      评价内容
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="请输入您的评价和建议..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none bg-white"
                    />
                  </div>
                  <Button
                    icon={Send}
                    onClick={handleSubmitEvaluation}
                    loading={submittingEvaluation}
                  >
                    提交评价
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">工单完成后可进行评价</p>
                </div>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </Modal>
  );
}
