import { useState, useEffect } from 'react';
import {
  Shirt,
  Plus,
  Search,
  Clock,
  MapPin,
  Edit,
  Check,
  Truck,
  Package,
} from 'lucide-react';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { laundryApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LaundryOrder {
  id: string;
  orderNumber: string;
  clothingType: string;
  processType: string;
  quantity: number;
  address: string;
  status: string;
  price: number;
  createdAt: string;
}

const statusFlow = [
  'pending_pickup',
  'picked_up',
  'quality_check',
  'processing',
  'ready_delivery',
  'delivered',
];

const statusLabels: Record<string, string> = {
  pending_pickup: '待取件',
  picked_up: '已取件',
  quality_check: '质检中',
  processing: '处理中',
  ready_delivery: '待配送',
  delivered: '已送达',
};

const clothingTypes = [
  { value: 'shirt', label: '衬衫' },
  { value: 'tshirt', label: 'T恤' },
  { value: 'pants', label: '裤子' },
  { value: 'coat', label: '外套' },
  { value: 'dress', label: '连衣裙' },
  { value: 'suit', label: '西装' },
  { value: 'bedding', label: '床上用品' },
];

const processTypes = [
  { value: 'wash', label: '普通清洗' },
  { value: 'dry', label: '干洗' },
  { value: 'iron', label: '熨烫' },
  { value: 'wash_iron', label: '洗熨一体' },
];

export default function LaundryList() {
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newOrder, setNewOrder] = useState({
    clothingType: 'shirt',
    processType: 'wash',
    quantity: 1,
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await laundryApi.getAll();
      if (result.success && result.data) {
        setOrders(result.data as LaundryOrder[]);
      } else {
        setOrders([
          {
            id: '1',
            orderNumber: 'LD20240115001',
            clothingType: '衬衫',
            processType: '洗熨一体',
            quantity: 3,
            address: 'A栋101室',
            status: 'processing',
            price: 45,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            orderNumber: 'LD20240115002',
            clothingType: '西装',
            processType: '干洗',
            quantity: 1,
            address: 'B栋203室',
            status: 'pending_pickup',
            price: 80,
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            orderNumber: 'LD20240115003',
            clothingType: '床上用品',
            processType: '普通清洗',
            quantity: 2,
            address: 'C栋305室',
            status: 'delivered',
            price: 120,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newOrder.address.trim()) errors.address = '请输入取件地址';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    try {
      const result = await laundryApi.create(newOrder);
      if (result.success) {
        setShowCreateModal(false);
        setNewOrder({
          clothingType: 'shirt',
          processType: 'wash',
          quantity: 1,
          address: '',
        });
        setFormErrors({});
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      setShowCreateModal(false);
      loadOrders();
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      try {
        const result = await laundryApi.updateStatus(orderId, nextStatus);
        if (result.success) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, status: nextStatus } : o
            )
          );
        }
      } catch (error) {
        console.error('Failed to update status:', error);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: nextStatus } : o
          )
        );
      }
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedOrder || !newPrice) return;
    try {
      const result = await laundryApi.updatePrice(
        selectedOrder.id,
        parseFloat(newPrice)
      );
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? { ...o, price: parseFloat(newPrice) }
              : o
          )
        );
        setShowPriceModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Failed to update price:', error);
      setShowPriceModal(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'pending_pickup':
        return 'pending';
      case 'picked_up':
      case 'quality_check':
      case 'processing':
        return 'processing';
      case 'ready_delivery':
        return 'info';
      case 'delivered':
        return 'completed';
      default:
        return 'info';
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      title: '订单号',
      render: (item: LaundryOrder) => (
        <span className="font-medium text-sky-600">{item.orderNumber}</span>
      ),
    },
    {
      key: 'clothingType',
      title: '衣物类型',
      render: (item: LaundryOrder) => (
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">{item.clothingType}</span>
        </div>
      ),
    },
    {
      key: 'processType',
      title: '服务类型',
      render: (item: LaundryOrder) => (
        <span className="text-slate-600">{item.processType}</span>
      ),
    },
    {
      key: 'quantity',
      title: '数量',
      render: (item: LaundryOrder) => (
        <span className="text-slate-700">{item.quantity}件</span>
      ),
    },
    {
      key: 'address',
      title: '地址',
      render: (item: LaundryOrder) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 text-sm">{item.address}</span>
        </div>
      ),
    },
    {
      key: 'price',
      title: '价格',
      render: (item: LaundryOrder) => (
        <span className="font-medium text-slate-800">¥{item.price}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (item: LaundryOrder) => (
        <StatusBadge
          status={
            (getStatusBadgeType(item.status) as 'pending' | 'processing') ||
            'pending'
          }
          text={statusLabels[item.status]}
        />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (item: LaundryOrder) => (
        <div className="flex items-center gap-2">
          {item.status !== 'delivered' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(item.id, item.status);
              }}
              className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
              title="推进状态"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(item);
              setNewPrice(item.price.toString());
              setShowPriceModal(true);
            }}
            className="p-1.5 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
            title="修改价格"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">洗衣服务</h1>
          <p className="text-slate-500 text-sm mt-1">管理洗衣订单</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建订单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订单号或地址..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部状态</option>
            {statusFlow.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {statusFlow.map((status, index) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <div
              key={status}
              className="bg-white rounded-xl border border-slate-100 p-4 text-center"
            >
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-1">{statusLabels[status]}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-center mb-6 overflow-x-auto pb-2">
          <div className="flex items-center">
            {statusFlow.map((status, index) => (
              <div key={status} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      index <= 2
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs text-slate-500 mt-2 whitespace-nowrap">
                    {statusLabels[status]}
                  </span>
                </div>
                {index < statusFlow.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-2',
                      index < 2 ? 'bg-sky-500' : 'bg-slate-200'
                    )}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <DataTable columns={columns} data={filteredOrders} loading={loading} />
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormErrors({});
        }}
        title="创建洗衣订单"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                衣物类型
              </label>
              <select
                value={newOrder.clothingType}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, clothingType: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {clothingTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                服务类型
              </label>
              <select
                value={newOrder.processType}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, processType: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {processTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              数量
            </label>
            <input
              type="number"
              value={newOrder.quantity}
              onChange={(e) =>
                setNewOrder({
                  ...newOrder,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
              min="1"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              取件地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newOrder.address}
              onChange={(e) =>
                setNewOrder({ ...newOrder, address: e.target.value })
              }
              placeholder="请输入取件地址"
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                formErrors.address ? 'border-red-300' : 'border-slate-200 bg-slate-50'
              )}
            />
            {formErrors.address && (
              <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormErrors({});
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateOrder}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              创建订单
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPriceModal}
        onClose={() => {
          setShowPriceModal(false);
          setSelectedOrder(null);
        }}
        title="修改订单价格"
        size="sm"
      >
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-slate-500">订单号</p>
            <p className="font-semibold text-slate-800">
              {selectedOrder?.orderNumber}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              新价格 (元)
            </label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowPriceModal(false);
                setSelectedOrder(null);
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpdatePrice}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
