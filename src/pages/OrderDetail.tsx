import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles, Baby, ChefHat, MapPin, Clock, Phone, User,
  ArrowLeft, AlertTriangle, MessageCircle, ShieldCheck,
  FileText, Receipt, ChevronDown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrderProgressBar from '@/components/OrderProgressBar';
import { useAppStore } from '@/store';
import type { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

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

const compensationReasons = [
  '阿姨迟到超过30分钟',
  '服务质量不满意',
  '阿姨未按约定时间上门',
  '服务态度问题',
  '物品损坏',
  '其他原因',
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const order = orders.find((o) => o.id === Number(id)) as Order | undefined;

  const [showCompensation, setShowCompensation] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [compensationDesc, setCompensationDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">订单不存在</h1>
          <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            返回订单列表
          </Link>
        </div>
      </div>
    );
  }

  const Icon = serviceIconMap[order.service_type];
  const badge = getStatusBadge(order.status);
  const canCompensate = order.status === 'completed' || order.status === 'arrived' || order.status === 'servicing';

  const handleSubmitCompensation = () => {
    if (!selectedReason) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setShowCompensation(false);
      alert('赔付申请已提交，客服将在24小时内与您联系');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回订单列表
        </button>

        <div className="card p-6 md:p-8 mb-6 animate-fade-up">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Icon className="w-7 h-7 text-primary-500" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-secondary-900">{order.service_type_label}</h1>
                  <span className={badge.className}>{badge.label}</span>
                </div>
                <p className="text-sm text-secondary-500 mt-1">订单号 #{order.id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary-500">订单金额</p>
              <p className="text-2xl font-bold text-primary-600">¥{order.amount}</p>
            </div>
          </div>

          <OrderProgressBar status={order.status} />
        </div>

        {order.worker_name && (
          <div className="card p-6 mb-6 animate-fade-up stagger-1">
            <h2 className="text-lg font-bold text-secondary-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              服务人员
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-secondary-800 text-lg">{order.worker_name}</p>
                <p className="text-secondary-500 text-sm">{order.worker_phone}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">已实名认证</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${order.worker_phone}`}
                  className="w-11 h-11 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <button className="w-11 h-11 rounded-full bg-secondary-50 text-secondary-600 flex items-center justify-center hover:bg-secondary-100 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 mb-6 animate-fade-up stagger-2">
          <h2 className="text-lg font-bold text-secondary-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            服务信息
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-secondary-500">服务地址</p>
                <p className="text-secondary-800">{order.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-secondary-500">服务时间</p>
                <p className="text-secondary-800">{order.start_time}</p>
                <p className="text-secondary-600 text-sm">服务时长 {order.duration_hours} 小时</p>
              </div>
            </div>
            {order.remark && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-500">服务备注</p>
                  <p className="text-secondary-800">{order.remark}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 mb-6 animate-fade-up stagger-3">
          <h2 className="text-lg font-bold text-secondary-800 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-500" />
            费用明细
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-secondary-600">
              <span>{order.service_type_label} × {order.duration_hours}小时</span>
              <span>¥{order.amount}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="font-medium text-secondary-800">实付金额</span>
              <span className="text-xl font-bold text-primary-600">¥{order.amount}</span>
            </div>
          </div>
        </div>

        {canCompensate && (
          <div className="card p-6 mb-6 animate-fade-up stagger-4">
            <button
              onClick={() => setShowCompensation(!showCompensation)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-secondary-800">申请售后赔付</p>
                  <p className="text-sm text-secondary-500">服务不满意？我们为您保障权益</p>
                </div>
              </div>
              <ChevronDown className={cn('w-5 h-5 text-secondary-400 transition-transform', showCompensation && 'rotate-180')} />
            </button>

            {showCompensation && (
              <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-up">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 mb-2 block">赔付原因</label>
                    <div className="space-y-2">
                      {compensationReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setSelectedReason(reason)}
                          className={cn(
                            'w-full p-3 rounded-xl border-2 text-left transition-all',
                            selectedReason === reason
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-primary-200 text-secondary-700'
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-700 mb-2 block">详细描述（选填）</label>
                    <textarea
                      value={compensationDesc}
                      onChange={(e) => setCompensationDesc(e.target.value)}
                      placeholder="请描述具体情况，以便我们更好地为您处理"
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">赔付保障说明</p>
                        <p className="text-yellow-700 mt-1">
                          我们将在24小时内审核您的申请，根据情况提供现金退款或服务券补偿。
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmitCompensation}
                    disabled={!selectedReason || submitting}
                    className={cn(
                      'btn-primary w-full',
                      (!selectedReason || submitting) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        提交中...
                      </span>
                    ) : '提交赔付申请'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-secondary-400 text-sm py-6">
          下单时间：{order.created_at}
        </p>
      </div>
    </div>
  );
}
