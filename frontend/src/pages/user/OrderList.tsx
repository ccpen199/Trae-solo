import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
  ArrowRight,
  Clock,
  RotateCcw,
  Star,
  CreditCard,
  XCircle,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { ORDER_CATEGORIES, ORDER_STATUS } from '../../constants';
import type { Order, OrderStatus as OrderStatusType } from '../../types';
import Empty from '../../components/ui/Empty';
import Button from '../../components/ui/Button';

const categoryIconMap: Record<string, React.FC<{ className?: string }>> = {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
};

type TabKey = 'all' | OrderStatusType;

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'accepted', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const CANCEL_REASONS = [
  '不想要了',
  '信息填错了',
  '骑手太慢',
  '价格不合适',
  '其他原因',
] as const;

const initialOrders: Order[] = [
  {
    id: '1',
    orderNo: 'SP202406170001',
    category: 'buy',
    status: 'delivering',
    userId: 'u1',
    title: '帮我买奶茶',
    description: '一杯珍珠奶茶，少糖少冰',
    pickupAddress: '北京市朝阳区三里屯SOHO奶茶店',
    pickupLocation: { lat: 39.93, lng: 116.45 },
    pickupName: '商家',
    pickupPhone: '010-88888888',
    deliveryAddress: '北京市朝阳区望京SOHO T1 1201室',
    deliveryLocation: { lat: 39.99, lng: 116.47 },
    deliveryName: '张三',
    deliveryPhone: '138****8888',
    weight: 0.5,
    goodsValue: 30,
    tip: 2,
    distance: 3.2,
    duration: 25,
    deliveryFee: 12,
    totalAmount: 14,
    payStatus: 'paid',
    payMethod: 'wechat',
    paidAt: '2024-06-17T10:30:00Z',
    acceptedAt: '2024-06-17T10:32:00Z',
    pickedUpAt: '2024-06-17T10:45:00Z',
    createdAt: '2024-06-17T10:28:00Z',
    updatedAt: '2024-06-17T10:45:00Z',
  },
  {
    id: '2',
    orderNo: 'SP202406160002',
    category: 'send',
    status: 'pending',
    userId: 'u1',
    title: '帮我送文件',
    description: '合同文件，注意保密',
    pickupAddress: '北京市海淀区中关村软件园二期 8号楼',
    pickupLocation: { lat: 40.04, lng: 116.29 },
    pickupName: '张三',
    pickupPhone: '138****8888',
    deliveryAddress: '北京市西城区金融街7号英蓝国际金融中心',
    deliveryLocation: { lat: 39.91, lng: 116.36 },
    deliveryName: '李四',
    deliveryPhone: '139****9999',
    weight: 0.3,
    distance: 12.5,
    duration: 45,
    deliveryFee: 28,
    totalAmount: 28,
    payStatus: 'unpaid',
    createdAt: '2024-06-16T15:20:00Z',
    updatedAt: '2024-06-16T15:20:00Z',
  },
  {
    id: '3',
    orderNo: 'SP202406150003',
    category: 'fetch',
    status: 'completed',
    userId: 'u1',
    title: '帮我取快递',
    pickupAddress: '北京市朝阳区望京SOHO T3 快递柜B23',
    pickupLocation: { lat: 39.99, lng: 116.47 },
    deliveryAddress: '北京市朝阳区望京SOHO T1 1201室',
    deliveryLocation: { lat: 39.99, lng: 116.47 },
    deliveryName: '张三',
    deliveryPhone: '138****8888',
    weight: 2.5,
    distance: 0.5,
    duration: 10,
    deliveryFee: 6,
    totalAmount: 6,
    payStatus: 'paid',
    payMethod: 'balance',
    paidAt: '2024-06-15T09:10:00Z',
    acceptedAt: '2024-06-15T09:12:00Z',
    pickedUpAt: '2024-06-15T09:25:00Z',
    completedAt: '2024-06-15T09:35:00Z',
    createdAt: '2024-06-15T09:08:00Z',
    updatedAt: '2024-06-15T09:35:00Z',
  },
  {
    id: '4',
    orderNo: 'SP202406140004',
    category: 'errand',
    status: 'cancelled',
    userId: 'u1',
    title: '帮我排队',
    pickupAddress: '北京市朝阳区朝阳大悦城',
    pickupLocation: { lat: 39.92, lng: 116.51 },
    deliveryAddress: '北京市朝阳区朝阳大悦城',
    deliveryLocation: { lat: 39.92, lng: 116.51 },
    deliveryName: '张三',
    deliveryPhone: '138****8888',
    distance: 0,
    duration: 60,
    deliveryFee: 20,
    totalAmount: 20,
    payStatus: 'refunded',
    cancelReason: '用户主动取消',
    cancelBy: 'user',
    cancelledAt: '2024-06-14T14:30:00Z',
    createdAt: '2024-06-14T14:15:00Z',
    updatedAt: '2024-06-14T14:30:00Z',
  },
];

interface CancelSheetProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string, customReason: string) => void;
}

function CancelSheet({ visible, orderId, onClose, onConfirm }: CancelSheetProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handleConfirm = () => {
    if (!selectedReason) return;
    const reason = selectedReason === '其他原因' ? (customReason.trim() || '其他原因') : selectedReason;
    onConfirm(orderId, reason, customReason.trim());
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedReason('');
      setCustomReason('');
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-200 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">取消订单</h3>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3">请选择取消原因</p>
          <div className="space-y-2">
            {CANCEL_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${
                  selectedReason === reason
                    ? 'bg-brand-50 border-2 border-brand-500 text-brand-700'
                    : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedReason === reason ? 'border-brand-500' : 'border-gray-300'
                  }`}
                >
                  {selectedReason === reason && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                {reason}
              </button>
            ))}
          </div>

          {selectedReason === '其他原因' && (
            <div className="mt-3">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="请输入取消原因（选填）"
                maxLength={100}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{customReason.length}/100</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            放弃
          </Button>
          <Button variant="danger" fullWidth onClick={handleConfirm} disabled={!selectedReason}>
            确认取消
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'warning';
}

function Toast({ visible, message, type }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 text-white'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
        )}
        {message}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  onCancel: (orderId: string) => void;
}

function OrderCard({ order, onClick, onCancel }: OrderCardProps) {
  const category = ORDER_CATEGORIES.find((c) => c.key === order.category);
  const status = ORDER_STATUS[order.status];
  const Icon = category ? categoryIconMap[category.iconName] : ShoppingBag;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const isInProgress = ['accepted', 'picked_up', 'delivering'].includes(order.status);

  const getActionButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => onCancel(order.id)}
            >
              取消订单
            </Button>
            {order.payStatus === 'unpaid' && (
              <Button size="sm" variant="primary" icon={<CreditCard className="w-4 h-4" />}>
                去支付
              </Button>
            )}
          </>
        );
      case 'accepted':
      case 'picked_up':
      case 'delivering':
        return (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => onCancel(order.id)}
            >
              申请取消
            </Button>
            <Button size="sm" variant="primary" icon={<RotateCcw className="w-4 h-4" />}>
              再次下单
            </Button>
          </>
        );
      case 'completed':
        return (
          <>
            <Button size="sm" variant="secondary" icon={<Star className="w-4 h-4" />}>
              评价
            </Button>
            <Button size="sm" variant="primary" icon={<RotateCcw className="w-4 h-4" />}>
              再次下单
            </Button>
          </>
        );
      case 'cancelled':
        return (
          <Button size="sm" variant="primary" icon={<RotateCcw className="w-4 h-4" />}>
            再次下单
          </Button>
        );
      default:
        return null;
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{order.orderNo}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${status.color}15`, color: status.color }}
          >
            {status.name}
          </span>
          {order.status === 'cancelled' && order.payStatus === 'refunded' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600">
              已退款
            </span>
          )}
          {order.status === 'cancelled' && order.payStatus === 'paid' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
              退款处理中
            </span>
          )}
          {isInProgress && order.payStatus === 'refunded' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
              退款处理中
            </span>
          )}
        </div>
      </div>

      {order.status === 'cancelled' && order.cancelReason && (
        <div className="mb-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-400">取消原因：</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {order.cancelReason}
          </span>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        {category && (
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${category.color}15` }}
          >
            {Icon && <Icon className="w-5 h-5" style={{ color: category.color }} />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 mb-1">{order.title}</p>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </div>
            <p className="flex-1 truncate">{order.pickupAddress}</p>
          </div>
          <div className="flex items-center justify-center my-0.5">
            <ArrowRight className="w-3 h-3 text-gray-300" />
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            </div>
            <p className="flex-1 truncate">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(order.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2" onClick={handleActionClick}>
          <span className="text-base font-bold text-brand-600">¥{order.totalAmount.toFixed(2)}</span>
          <div className="flex items-center gap-2">
            {getActionButtons()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'warning' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter((order) => {
        if (activeTab === 'accepted') {
          return ['accepted', 'picked_up', 'delivering'].includes(order.status);
        }
        return order.status === activeTab;
      });

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleCreateOrder = () => {
    navigate('/order/create');
  };

  const handleCancelClick = (orderId: string) => {
    setCancellingOrderId(orderId);
    setCancelSheetVisible(true);
  };

  const handleCancelConfirm = (orderId: string, reason: string, customReason: string) => {
    const finalReason = reason === '其他原因' && customReason ? customReason : reason;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const wasPaid = order.payStatus === 'paid';
        return {
          ...order,
          status: 'cancelled' as OrderStatusType,
          cancelReason: finalReason,
          cancelBy: 'user' as const,
          cancelledAt: new Date().toISOString(),
          payStatus: wasPaid ? 'refunded' : order.payStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const order = orders.find((o) => o.id === orderId);
    if (order?.payStatus === 'paid') {
      showToast('订单已取消，退款将在1-3个工作日到账', 'warning');
    } else {
      showToast('订单已取消', 'success');
    }
  };

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-30 bg-gray-50 -mx-4 px-4 pt-0 pb-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-3 -mx-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Empty
            type="orders"
            title="暂无订单"
            description="您还没有相关订单，去创建一个吧"
            action={
              <Button variant="primary" onClick={handleCreateOrder} icon={<ShoppingBag className="w-4 h-4" />}>
                立即下单
              </Button>
            }
          />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order.id)}
              onCancel={handleCancelClick}
            />
          ))
        )}
      </div>

      <CancelSheet
        visible={cancelSheetVisible}
        orderId={cancellingOrderId}
        onClose={() => setCancelSheetVisible(false)}
        onConfirm={handleCancelConfirm}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </div>
  );
}
