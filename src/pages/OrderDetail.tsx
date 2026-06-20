import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, MapPin, Package, Calendar, 
  Clock, Edit, Loader2, CheckCircle, Truck, 
  Printer, FileText, AlertCircle, XCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { StatusBadge } from '@/components/ui';
import { get as apiGet, put as apiPut } from '@/utils/api';
import type { Order, OrderStatus, PickupTask } from 'shared/types';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  status: OrderStatus;
  time: string;
  description: string;
  operator?: string;
}

const mockOrder: Order = {
  id: '1',
  orderNo: 'ORD202401150001',
  sender: {
    name: '张三',
    phone: '13800138001',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    address: '建国路88号SOHO现代城A座1201',
    fullAddress: '北京市朝阳区建国路88号SOHO现代城A座1201'
  },
  receiver: {
    name: '李四',
    phone: '13900139001',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    address: '陆家嘴金融中心B座2005',
    fullAddress: '上海市浦东新区陆家嘴金融中心B座2005'
  },
  itemType: '电子产品',
  estimatedWeight: 2.5,
  actualWeight: 2.8,
  appointmentTime: '2024-01-15T14:00:00Z',
  pickupCode: 'A1B2C3',
  status: 'picked',
  remark: '请小心轻放，内含电子设备',
  createdAt: '2024-01-15T09:30:00Z',
  updatedAt: '2024-01-15T14:30:00Z'
};

const mockTask: PickupTask = {
  id: 'task-1',
  taskNo: 'TK202401150001',
  orderId: '1',
  orderNo: 'ORD202401150001',
  courierId: 'courier-1',
  courierName: '王快递',
  outletId: 'outlet-1',
  pickupCode: 'A1B2C3',
  senderAddress: '北京市朝阳区建国路88号SOHO现代城A座1201',
  senderPhone: '13800138001',
  itemType: '电子产品',
  estimatedWeight: 2.5,
  actualWeight: 2.8,
  appointmentTime: '2024-01-15T14:00:00Z',
  status: 'picked',
  freight: 28.5,
  paymentMethod: 'wechat',
  weightCheckRule: 'tolerance',
  weightTolerance: 0.3,
  waybillNo: 'SF1234567890123',
  pickedAt: '2024-01-15T14:30:00Z',
  createdAt: '2024-01-15T09:35:00Z',
  synced: true
};

const mockTimeline: TimelineEvent[] = [
  {
    status: 'created',
    time: '2024-01-15T09:30:00Z',
    description: '订单已创建，等待分配快递员',
    operator: '系统'
  },
  {
    status: 'assigned',
    time: '2024-01-15T09:35:00Z',
    description: '订单已分配给快递员 王快递',
    operator: '系统自动分配'
  },
  {
    status: 'picked',
    time: '2024-01-15T14:30:00Z',
    description: '快递员已完成揽收，实际重量 2.8kg',
    operator: '王快递'
  }
];

const statusIcons: Record<OrderStatus, any> = {
  created: FileText,
  assigned: Truck,
  picked: CheckCircle,
  printed: Printer,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: XCircle
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [task, setTask] = useState<PickupTask | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Order>>({});

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const [orderData, taskData] = await Promise.all([
        apiGet<Order>(`/orders/${id}`),
        apiGet<PickupTask>(`/orders/${id}/task`)
      ]);
      setOrder(orderData);
      setTask(taskData);
      
      const timelineData = await apiGet<TimelineEvent[]>(`/orders/${id}/timeline`);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Fetch order detail error:', error);
      setOrder(mockOrder);
      setTask(mockTask);
      setTimeline(mockTimeline);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const handleEdit = () => {
    if (order) {
      setEditForm(order);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      if (id && editForm) {
        await apiPut(`/orders/${id}`, editForm);
        setOrder({ ...order, ...editForm } as Order);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update order error:', error);
      if (order && editForm) {
        setOrder({ ...order, ...editForm } as Order);
      }
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">订单不存在</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
              <p className="text-gray-500 mt-1">订单号：{order.orderNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} type="order" size="lg" />
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                编辑
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-700">
              <Edit className="w-5 h-5" />
              <span>正在编辑订单信息</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  寄件人信息
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">姓名</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.sender?.name || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          sender: { ...order.sender, name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{order.sender.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">手机号</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.sender?.phone || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          sender: { ...order.sender, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{order.sender.phone}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      寄件地址
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.sender?.fullAddress || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          sender: { ...order.sender, fullAddress: e.target.value, address: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{order.sender.fullAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-500" />
                  收件人信息
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">姓名</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.receiver?.name || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          receiver: { ...order.receiver, name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{order.receiver.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">手机号</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.receiver?.phone || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          receiver: { ...order.receiver, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{order.receiver.phone}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      收件地址
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.receiver?.fullAddress || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          receiver: { ...order.receiver, fullAddress: e.target.value, address: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{order.receiver.fullAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  物品信息
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">物品类型</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.itemType || ''}
                        onChange={(e) => setEditForm({ ...editForm, itemType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{order.itemType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">预估重量</label>
                    <p className="text-gray-900">{order.estimatedWeight}kg</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">实际重量</label>
                    <p className="text-gray-900">{order.actualWeight || '-'}kg</p>
                  </div>
                </div>
                {order.remark && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-500 mb-1">备注</label>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{order.remark}</p>
                  </div>
                )}
              </div>
            </div>

            {task && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-500" />
                    关联任务信息
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">任务单号</label>
                      <p className="text-blue-600 font-medium cursor-pointer hover:underline"
                         onClick={() => navigate(`/tasks/${task.id}`)}>
                        {task.taskNo}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">快递员</label>
                      <p className="text-gray-900">{task.courierName || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">运费</label>
                      <p className="text-gray-900">¥{task.freight?.toFixed(2) || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">运单号</label>
                      <p className="text-gray-900">{task.waybillNo || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-500" />
                  状态变更时间线
                </h2>
              </div>
              <div className="p-6">
                <div className="relative">
                  {timeline.map((event, index) => {
                    const Icon = statusIcons[event.status] || FileText;
                    const isLast = index === timeline.length - 1;
                    return (
                      <div key={index} className="relative pb-8 last:pb-0">
                        {!isLast && (
                          <div className="absolute left-[17px] top-8 w-0.5 h-full bg-gray-200" />
                        )}
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                            isLast ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={event.status} type="order" size="sm" />
                              <span className="text-sm text-gray-500">
                                {dayjs(event.time).format('YYYY-MM-DD HH:mm:ss')}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-900">{event.description}</p>
                            {event.operator && (
                              <p className="text-sm text-gray-500 mt-1">操作人：{event.operator}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">预约信息</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">预约时间</p>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        value={dayjs(editForm.appointmentTime).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          appointmentTime: new Date(e.target.value).toISOString() 
                        })}
                        className="mt-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">
                        {dayjs(order.appointmentTime).format('YYYY-MM-DD HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">取件码</p>
                    <p className="text-gray-900 font-mono font-medium text-lg">{order.pickupCode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">订单信息</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">创建时间</span>
                  <span className="text-gray-900">
                    {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">更新时间</span>
                  <span className="text-gray-900">
                    {dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
