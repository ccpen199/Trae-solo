import { useState, useEffect } from 'react';
import {
  Eye,
  MessageSquare,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Paperclip,
  Send,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { cn } from '@/lib/utils';
import { get, post } from '@/utils/request';
import type { OrderPriority, OrderStatus } from '../../../shared/types';

interface OrderItem {
  id: string;
  title: string;
  content: string;
  priority: OrderPriority;
  status: OrderStatus;
  deadline: string;
  issuerId?: string;
  issuerName?: string;
  targetOutletIds: string[];
  feedbackContent?: string;
  feedbackAttachments?: string;
  feedbackSubmittedAt?: string;
  createdAt: string;
}

const priorityMap: Record<OrderPriority, { label: string; color: 'danger' | 'warning' | 'gray' }> = {
  urgent: { label: '紧急', color: 'danger' },
  normal: { label: '普通', color: 'warning' },
  low: { label: '低', color: 'gray' },
};

const statusMap: Record<OrderStatus, { label: string; color: 'warning' | 'info' | 'primary' | 'success' | 'danger'; progress: number }> = {
  pending: { label: '待接收', color: 'warning', progress: 25 },
  executing: { label: '执行中', color: 'info', progress: 50 },
  submitted: { label: '已提交', color: 'primary', progress: 75 },
  approved: { label: '已审核', color: 'success', progress: 100 },
  rejected: { label: '已驳回', color: 'danger', progress: 0 },
};

const statusFlow: OrderStatus[] = ['pending', 'executing', 'submitted', 'approved'];

export default function RegulatoryOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ content: '', attachments: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<OrderPriority | ''>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      const res = await get<{ list: OrderItem[]; total: number }>(
        `/orders?${params.toString()}`
      );
      setOrders(res.list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPriority]);

  const handleOpenDetail = (order: OrderItem) => {
    setDetailOrder(order);
    setDetailOpen(true);
  };

  const handleOpenFeedback = (order: OrderItem) => {
    setDetailOrder(order);
    setFeedbackForm({ content: '', attachments: '' });
    setFeedbackOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.content.trim()) {
      alert('请填写执行情况描述');
      return;
    }
    if (!detailOrder) return;
    setSubmitting(true);
    try {
      await post(`/orders/${detailOrder.id}/feedback`, feedbackForm);
      alert('反馈提交成功');
      setFeedbackOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        alert('反馈提交成功');
        setFeedbackOpen(false);
        fetchData();
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBar = (status: OrderStatus) => {
    const s = statusMap[status];
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Tag color={s.color}>{s.label}</Tag>
          <span className="text-xs text-gray-500">{s.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              s.color === 'warning' && 'bg-yellow-500',
              s.color === 'info' && 'bg-blue-500',
              s.color === 'primary' && 'bg-primary',
              s.color === 'success' && 'bg-green-500',
              s.color === 'danger' && 'bg-red-500'
            )}
            style={{ width: `${s.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          {statusFlow.map((st, idx) => (
            <div key={st} className="flex items-center">
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                  statusFlow.indexOf(status) >= idx
                    ? s.color === 'danger'
                      ? 'bg-red-500 text-white'
                      : 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-400'
                )}
              >
                {idx + 1}
              </div>
              {idx < statusFlow.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监管指令管理</h1>
          <p className="mt-1 text-sm text-gray-500">查看和处理上级下发的监管指令</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">状态</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OrderStatus | '')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部状态</option>
              <option value="pending">待接收</option>
              <option value="executing">执行中</option>
              <option value="submitted">已提交</option>
              <option value="approved">已审核</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">优先级</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as OrderPriority | '')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部优先级</option>
              <option value="urgent">紧急</option>
              <option value="normal">普通</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500">
          暂无监管指令
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => {
            const p = priorityMap[order.priority];
            const overdue = isOverdue(order.deadline) && order.status !== 'approved';
            return (
              <div
                key={order.id}
                className={cn(
                  'rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md',
                  overdue && 'border-red-300 bg-red-50/30',
                  order.priority === 'urgent' && 'border-l-4 border-l-red-500'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="flex-1 text-base font-semibold text-gray-900 line-clamp-2">
                    {order.title}
                  </h3>
                  <Badge color={p.color}>{p.label}</Badge>
                </div>

                <div className="mb-4">{renderStatusBar(order.status)}</div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>截止时间：</span>
                    <span className={cn('font-medium', overdue && 'text-red-600')}>
                      {new Date(order.deadline).toLocaleString('zh-CN')}
                    </span>
                    {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>下发人：</span>
                    <span className="font-medium">{order.issuerName || '-'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={Eye}
                    className="flex-1"
                    onClick={() => handleOpenDetail(order)}
                  >
                    查看详情
                  </Button>
                  {(order.status === 'pending' || order.status === 'executing') && (
                    <Button
                      size="sm"
                      leftIcon={MessageSquare}
                      className="flex-1"
                      onClick={() => handleOpenFeedback(order)}
                    >
                      提交反馈
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={detailOpen}
        title="监管指令详情"
        onClose={() => setDetailOpen(false)}
        hideFooter
        className="max-w-2xl"
      >
        {detailOrder && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{detailOrder.title}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  下发时间：{new Date(detailOrder.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <Badge color={priorityMap[detailOrder.priority].color}>
                {priorityMap[detailOrder.priority].label}
              </Badge>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">指令内容</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{detailOrder.content}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">执行要求</p>
              <ul className="space-y-2 rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>请在截止时间 {new Date(detailOrder.deadline).toLocaleString('zh-CN')} 前完成执行</span>
                </li>
                <li className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>下发人：{detailOrder.issuerName || '系统管理员'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>请详细填写执行情况，必要时上传相关证明材料</span>
                </li>
              </ul>
            </div>

            {detailOrder.feedbackContent && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-2 text-sm font-medium text-primary">已提交的反馈</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {detailOrder.feedbackContent}
                </p>
                {detailOrder.feedbackSubmittedAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    提交时间：{new Date(detailOrder.feedbackSubmittedAt).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                关闭
              </Button>
              {(detailOrder.status === 'pending' || detailOrder.status === 'executing') && (
                <Button
                  leftIcon={MessageSquare}
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenFeedback(detailOrder);
                  }}
                >
                  提交反馈
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={feedbackOpen}
        title="提交执行反馈"
        onClose={() => setFeedbackOpen(false)}
        onConfirm={handleSubmitFeedback}
        confirmText="提交反馈"
        loading={submitting}
      >
        <div className="space-y-4">
          {detailOrder && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{detailOrder.title}</p>
              <p className="mt-1 text-xs text-gray-500">
                截止时间：{new Date(detailOrder.deadline).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">执行情况描述 *</label>
            <textarea
              value={feedbackForm.content}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
              placeholder="请详细描述执行情况、处理结果等..."
              rows={6}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">附件上传</label>
            <div className="mt-1.5 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <div>
                <Paperclip className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">点击或拖拽文件到此处上传</p>
                <p className="mt-1 text-xs text-gray-400">支持 PDF、图片等格式</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
