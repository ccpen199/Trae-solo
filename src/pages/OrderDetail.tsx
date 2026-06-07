import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Clock,
  Truck,
  CheckCircle,
  Package,
  Thermometer,
  Flower2,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import { api } from '@/utils/api';
import type { Order, OrderItem, LogisticsNode } from '../../shared/types';

const mockOrder: Order & { items: OrderItem[] } = {
  id: 'ORD202401001',
  userId: 1,
  shopId: 1,
  shopName: '繁花似锦花店',
  totalAmount: 599,
  status: 'delivering',
  recipientName: '张三',
  recipientPhone: '13800138000',
  recipientAddress: '北京市朝阳区建国路88号SOHO现代城A座1201',
  recipientLat: 39.9042,
  recipientLng: 116.4074,
  deliveryType: 'instant',
  expectedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  riderId: 1,
  riderName: '李师傅',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: 1,
      orderId: 'ORD202401001',
      productId: 1,
      productName: '浪漫红玫瑰束 99朵',
      productImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=200&h=200&fit=crop',
      quantity: 1,
      price: 599,
    },
  ],
};

const mockLogistics: LogisticsNode[] = [
  {
    id: 1,
    orderId: 'ORD202401001',
    type: 'sorting',
    name: '订单已提交',
    lat: 39.9042,
    lng: 116.4074,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 2,
    orderId: 'ORD202401001',
    type: 'sorting',
    name: '商家已接单，正在备货',
    lat: 39.9142,
    lng: 116.4174,
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 3,
    orderId: 'ORD202401001',
    type: 'cold-chain',
    name: '商品出库，进入冷链配送',
    lat: 39.9142,
    lng: 116.4174,
    temperature: 4,
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 4,
    orderId: 'ORD202401001',
    type: 'rider',
    name: '骑手已取货',
    lat: 39.9142,
    lng: 116.4174,
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 5,
    orderId: 'ORD202401001',
    type: 'rider',
    name: '骑手正在配送中',
    lat: 39.9072,
    lng: 116.4124,
    temperature: 5,
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'current',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'text-warmgold bg-warmgold-50' },
  paid: { label: '已付款', color: 'text-sprout bg-sprout-50' },
  accepted: { label: '已接单', color: 'text-sprout bg-sprout-50' },
  preparing: { label: '备货中', color: 'text-warmgold bg-warmgold-50' },
  picked: { label: '已取货', color: 'text-sprout bg-sprout-50' },
  delivering: { label: '配送中', color: 'text-sprout bg-sprout-50' },
  completed: { label: '已完成', color: 'text-sprout bg-sprout-50' },
  cancelled: { label: '已取消', color: 'text-gray-500 bg-gray-100' },
  refunded: { label: '已退款', color: 'text-gray-500 bg-gray-100' },
};

const logisticsIcon: Record<string, any> = {
  sorting: Package,
  rider: Truck,
  'cold-chain': Thermometer,
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<(Order & { items: OrderItem[] }) | null>(mockOrder);
  const [logistics, setLogistics] = useState<LogisticsNode[]>(mockLogistics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      if (id) {
        const [orderData, logisticsData] = await Promise.all([
          api.orders.get(id),
          api.orders.getLogistics(id),
        ]);
        if (orderData) setOrder(orderData);
        if (logisticsData && logisticsData.length > 0) {
          setLogistics(logisticsData as LogisticsNode[]);
        }
      }
    } catch (error) {
      console.log('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!order?.expectedDeliveryTime) return '';
    const diff = new Date(order.expectedDeliveryTime).getTime() - Date.now();
    if (diff <= 0) return '即将送达';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `预计 ${minutes} 分钟后送达`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `预计 ${hours} 小时 ${mins} 分钟后送达`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">订单不存在</p>
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-rose text-white rounded-btn"
            >
              返回订单列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 py-3 text-gray-600 hover:text-rose transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-rose to-rose-600 text-white rounded-card p-6 mb-6 animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {order.status === 'delivering' ? (
                  <Truck className="h-6 w-6" />
                ) : order.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Clock className="h-6 w-6" />
                )}
                <h1 className="text-xl font-serif font-bold">{status.label}</h1>
              </div>
              {order.status === 'delivering' && (
                <p className="text-white/80 text-sm">{getTimeRemaining()}</p>
              )}
              {order.riderName && (
                <p className="text-white/80 text-sm mt-1">骑手：{order.riderName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">订单号</p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-1">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-rose" />
              物流追踪
            </h2>
            <div className="relative">
              {logistics.map((node, index) => {
                const Icon = logisticsIcon[node.type] || Package;
                const isCurrent = node.status === 'current';
                const isCompleted = node.status === 'completed';
                const isLast = index === logistics.length - 1;

                return (
                  <div key={node.id} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          isCurrent
                            ? 'bg-rose text-white shadow-lg shadow-rose/30'
                            : isCompleted
                            ? 'bg-sprout text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-16 ${
                            isCompleted ? 'bg-sprout' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`font-medium ${
                              isCurrent ? 'text-rose' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            {node.name}
                          </p>
                          {node.temperature !== undefined && (
                            <p className="text-sm text-sprout mt-1 flex items-center gap-1">
                              <Thermometer className="h-3 w-3" />
                              冷链温度 {node.temperature}°C
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{formatDate(node.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-2">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose" />
              收货信息
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-800">
                  {order.recipientName}
                </span>
                <span className="text-gray-500">{order.recipientPhone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">{order.recipientAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {order.deliveryType === 'instant' ? '立即送' : '预约送'}
                  {' · '}
                  预计 {formatDate(order.expectedDeliveryTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-3">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Flower2 className="h-5 w-5 text-rose" />
              商品信息
            </h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-btn flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{item.productName}</h3>
                    <p className="text-sm text-gray-500 truncate mb-2">{order.shopName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-rose font-semibold">¥{item.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-4">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
              费用明细
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">商品总价</span>
                <span className="text-gray-800">¥{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">配送费</span>
                <span className="text-sprout">免运费</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">实付金额</span>
                  <span className="text-2xl font-bold text-rose">¥{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-5">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
              订单信息
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">订单编号</span>
                <span className="text-gray-800 font-mono">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">下单时间</span>
                <span className="text-gray-800">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">配送方式</span>
                <span className="text-gray-800">
                  {order.deliveryType === 'instant' ? '2小时极速达' : '预约配送'}
                </span>
              </div>
              {order.actualDeliveryTime && (
                <div className="flex justify-between">
                  <span className="text-gray-500">送达时间</span>
                  <span className="text-gray-800">{formatDate(order.actualDeliveryTime)}</span>
                </div>
              )}
            </div>
          </div>

          {order.status === 'delivering' && order.riderName && order.riderId && (
            <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sprout-100 rounded-full flex items-center justify-center">
                    <Truck className="h-6 w-6 text-sprout" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{order.riderName}</p>
                    <p className="text-sm text-gray-500">骑手正在为您配送</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-sprout text-white rounded-btn font-medium hover:bg-sprout-600 transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  联系骑手
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
