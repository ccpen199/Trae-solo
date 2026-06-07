import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { api } from '@/utils/api';
import type { Order } from '../../shared/types';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待付款', color: 'text-warmgold bg-warmgold-50', icon: Clock },
  paid: { label: '已付款', color: 'text-sprout bg-sprout-50', icon: CheckCircle },
  accepted: { label: '已接单', color: 'text-sprout bg-sprout-50', icon: CheckCircle },
  preparing: { label: '备货中', color: 'text-warmgold bg-warmgold-50', icon: Package },
  picked: { label: '已取货', color: 'text-sprout bg-sprout-50', icon: Truck },
  delivering: { label: '配送中', color: 'text-sprout bg-sprout-50', icon: Truck },
  completed: { label: '已完成', color: 'text-sprout bg-sprout-50', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-gray-500 bg-gray-100', icon: XCircle },
  refunded: { label: '已退款', color: 'text-gray-500 bg-gray-100', icon: RefreshCw },
};

const mockOrders: Order[] = [
  {
    id: 'ORD202401001',
    userId: 1,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 599,
    status: 'delivering',
    recipientName: '张三',
    recipientPhone: '13800138000',
    recipientAddress: '北京市朝阳区建国路88号',
    recipientLat: 39.9042,
    recipientLng: 116.4074,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 1,
        orderId: 'ORD202401001',
        productId: 1,
        productName: '浪漫红玫瑰束 99朵',
        productImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&h=100&fit=crop',
        quantity: 1,
        price: 599,
      },
    ],
  },
  {
    id: 'ORD202401002',
    userId: 1,
    shopId: 2,
    shopName: '花语时光',
    totalAmount: 199,
    status: 'completed',
    recipientName: '李四',
    recipientPhone: '13900139000',
    recipientAddress: '北京市海淀区中关村大街1号',
    recipientLat: 39.9842,
    recipientLng: 116.3074,
    deliveryType: 'next-day',
    expectedDeliveryTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actualDeliveryTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 2,
        orderId: 'ORD202401002',
        productId: 3,
        productName: '向日葵混搭花束',
        productImage: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=100&h=100&fit=crop',
        quantity: 1,
        price: 199,
      },
    ],
  },
  {
    id: 'ORD202401003',
    userId: 1,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 268,
    status: 'preparing',
    recipientName: '王五',
    recipientPhone: '13700137000',
    recipientAddress: '北京市西城区金融街15号',
    recipientLat: 39.9142,
    recipientLng: 116.3574,
    deliveryType: 'next-day',
    expectedDeliveryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 3,
        orderId: 'ORD202401003',
        productId: 2,
        productName: '粉色康乃馨花束',
        productImage: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=100&h=100&fit=crop',
        quantity: 1,
        price: 268,
      },
    ],
  },
  {
    id: 'ORD202401004',
    userId: 1,
    shopId: 3,
    shopName: '馨香花苑',
    totalAmount: 358,
    status: 'cancelled',
    recipientName: '赵六',
    recipientPhone: '13600136000',
    recipientAddress: '北京市东城区王府井大街88号',
    recipientLat: 39.9242,
    recipientLng: 116.4174,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 4,
        orderId: 'ORD202401004',
        productId: 5,
        productName: '永生花音乐盒',
        productImage: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=100&h=100&fit=crop',
        quantity: 1,
        price: 358,
      },
    ],
  },
];

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'processing', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.orders.list();
      if (response && response.items && response.items.length > 0) {
        setOrders(response.items);
      }
    } catch (error) {
      console.log('Using mock orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'processing') {
      return ['paid', 'accepted', 'preparing', 'picked', 'delivering'].includes(order.status);
    }
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'completed') return order.status === 'completed';
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

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
        <h1 className="text-2xl font-serif font-bold text-gray-800 mb-6 animate-fade-in-up">
          我的订单
        </h1>

        <div className="bg-white rounded-card shadow-sm border border-gray-100 mb-6 animate-fade-in-up overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-center font-medium transition-colors relative ${activeTab === tab.key ? 'text-rose' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose" />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const staggerClass = `animate-stagger-${Math.min((index % 5) + 1, 5)}`;

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className={`block bg-white rounded-card shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${staggerClass}`}
                >
                  <div className="p-4 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">订单号：{order.id}</span>
                        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-btn flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {order.items && order.items.length > 0 && (
                      <div className="flex gap-4 mb-4">
                        <img
                          src={order.items[0].productImage}
                          alt={order.items[0].productName}
                          className="w-20 h-20 object-cover rounded-btn flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">
                            {order.items[0].productName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate mb-2">
                            {order.shopName}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-rose font-semibold">
                              ¥{order.items[0].price.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">
                              x{order.items[0].quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.items && order.items.length > 1 && (
                      <p className="text-sm text-gray-500 mb-4">
                        等共 {order.items.length} 件商品
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-sm text-gray-500">
                        {order.deliveryType === 'instant' ? '立即送' : '预约送'}
                        {' · '}
                        {order.recipientAddress}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          共 <span className="text-rose font-semibold text-lg">¥{order.totalAmount.toFixed(2)}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-card shadow-sm border border-gray-100 animate-fade-in-up">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-semibold text-gray-600 mb-2">
              暂无订单
            </h3>
            <p className="text-gray-400 mb-6">快去挑选心仪的鲜花吧</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
            >
              去逛逛
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
