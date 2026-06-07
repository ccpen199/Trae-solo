import { useEffect, useState } from 'react';
import { Gift, CheckCircle, ShoppingCart, X, Gift as GiftIcon, Zap, Coffee, ShoppingBag, Smartphone, Headphones, Watch, Package, Truck, Home, Clock, ChevronRight, Star, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import dayjs from 'dayjs';

interface MallItem {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  category: string;
  icon: string;
  imageUrl?: string;
}

interface RedemptionOrder {
  id: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemCategory: string;
  pointsCost: number;
  status: 'pending' | 'processed' | 'delivered' | 'cancelled';
  statusName: string;
  canConfirm: boolean;
  createdAt: string;
  confirmedAt?: string;
  statusHistory: Array<{
    status: string;
    time: string;
    description: string;
  }>;
}

const mockItems: MallItem[] = [
  { id: '1', name: '5元电费优惠券', description: '可抵扣电费账单时使用，满50元可用', pointsRequired: 500, stock: 999, category: '优惠券', icon: 'zap' },
  { id: '2', name: '10元电费优惠券', description: '可抵扣电费账单时使用，满100元可用', pointsRequired: 900, stock: 500, category: '优惠券', icon: 'zap' },
  { id: '3', name: '星巴克咖啡券', description: '中杯拿铁一杯', pointsRequired: 1200, stock: 200, category: '生活', icon: 'coffee' },
  { id: '4', name: '京东购物卡 50元', description: '全场通用电子购物卡', pointsRequired: 4500, stock: 100, category: '购物', icon: 'bag' },
  { id: '5', name: '智能插座', description: '支持远程控制、电量统计', pointsRequired: 3800, stock: 50, category: '数码', icon: 'plug' },
  { id: '6', name: '蓝牙耳机', description: '真无线立体声蓝牙耳机', pointsRequired: 8500, stock: 30, category: '数码', icon: 'headphones' },
  { id: '7', name: '运动手环', description: '心率监测、运动追踪', pointsRequired: 6000, stock: 40, category: '数码', icon: 'watch' },
  { id: '8', name: 'LED节能灯泡(5只装)', description: '5W节能LED灯泡，E27接口', pointsRequired: 1500, stock: 300, category: '家居', icon: 'light' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  zap: <Zap size={24} />,
  coffee: <Coffee size={24} />,
  bag: <ShoppingBag size={24} />,
  plug: <Smartphone size={24} />,
  headphones: <Headphones size={24} />,
  watch: <Watch size={24} />,
  light: <Gift size={24} />,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Package size={16} />,
  processed: <Truck size={16} />,
  delivered: <Home size={16} />,
  confirmed: <CheckCircle size={16} />,
  cancelled: <X size={16} />,
};

export default function PointsMall() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'mall' | 'orders'>('mall');
  const [items, setItems] = useState<MallItem[]>(mockItems);
  const [orders, setOrders] = useState<RedemptionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [showRedeem, setShowRedeem] = useState<MallItem | null>(null);
  const [showOrder, setShowOrder] = useState<RedemptionOrder | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<MallItem[]>('/smartlife/mall');
        setItems(Array.isArray(res) ? res.map(normalizeItem) : mockItems);
      } catch {
        setItems(mockItems);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get<any>('/smartlife/redemption-orders');
      if (res && res.list) {
        setOrders(res.list.map(normalizeOrder));
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  function normalizeItem(row: any): MallItem {
    return {
      id: String(row.id),
      name: String(row.name),
      description: String(row.description || ''),
      pointsRequired: Number(row.pointsRequired || row.points_required || 0),
      stock: Number(row.stock || 0),
      category: String(row.category || ''),
      icon: String(row.icon || 'gift'),
      imageUrl: row.imageUrl || row.image_url,
    };
  }

  function normalizeOrder(row: any): RedemptionOrder {
    return {
      id: String(row.id),
      itemId: String(row.itemId || row.item_id || ''),
      itemName: String(row.itemName || row.item_name || ''),
      itemDescription: String(row.itemDescription || row.item_description || ''),
      itemCategory: String(row.itemCategory || row.item_category || ''),
      pointsCost: Number(row.pointsCost || row.points_cost || 0),
      status: row.status || 'pending',
      statusName: String(row.statusName || row.status_name || ''),
      canConfirm: Boolean(row.canConfirm || row.can_confirm || false),
      createdAt: String(row.createdAt || row.created_at || ''),
      confirmedAt: row.confirmedAt || row.confirmed_at,
      statusHistory: Array.isArray(row.statusHistory || row.status_history) 
        ? (row.statusHistory || row.status_history).map((h: any) => ({
            status: String(h.status),
            time: String(h.time),
            description: String(h.description),
          }))
        : [],
    };
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleRedeem = async (item: MallItem) => {
    if (!user || user.pointsBalance < item.pointsRequired) return;
    setRedeeming(item.id);
    try {
      await api.post(`/smartlife/mall/${item.id}/redeem`);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: i.stock - 1 } : i));
      setShowRedeem(null);
      showToast('兑换成功！您可以在"我的订单"中查看进度');
      setActiveTab('orders');
    } catch (err: any) {
      showToast(err.message || '兑换失败，请重试', 'error');
    } finally {
      setRedeeming(null);
    }
  };

  const handleConfirmReceive = async (orderId: string) => {
    setConfirming(orderId);
    try {
      await api.post(`/smartlife/redemption-orders/${orderId}/confirm`);
      showToast('确认收货成功，获得10积分奖励！');
      loadOrders();
      setShowOrder(null);
    } catch (err: any) {
      showToast(err.message || '确认失败，请重试', 'error');
    } finally {
      setConfirming(null);
    }
  };

  const categories = ['all', ...new Set(items.map((i) => i.category))];
  const filteredItems = categoryFilter === 'all' ? items : items.filter((i) => i.category === categoryFilter);
  
  const statusOptions = ['all', 'pending', 'processed', 'delivered'];
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'pending': return '待处理';
      case 'processed': return '已发货';
      case 'delivered': return '已送达';
      case 'cancelled': return '已取消';
      case 'confirmed': return '已完成';
      default: return s;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return 'badge-amber';
      case 'processed': return 'badge-blue';
      case 'delivered': return 'badge-green';
      case 'confirmed': return 'badge-green';
      case 'cancelled': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processed: orders.filter(o => o.status === 'processed').length,
    delivered: orders.filter(o => o.status === 'delivered' && !o.confirmedAt).length,
    completed: orders.filter(o => o.confirmedAt).length,
  };

  if (loading && activeTab === 'mall') {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-csg-green text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <Gift size={28} className="text-purple-500" />
        <div>
          <h1 className="page-title">积分商城</h1>
          <p className="page-desc">使用积分兑换各类商品和服务，追踪兑换订单状态</p>
        </div>
      </div>

      <div className="card p-5 bg-gradient-to-r from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">我的积分</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{user?.pointsBalance?.toLocaleString() || 0}</p>
          </div>
          <Gift size={40} className="text-purple-400" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('mall')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'mall'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} />
            商品兑换
          </div>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package size={16} />
            我的订单
            {orderStats.pending + orderStats.processed + orderStats.delivered > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {orderStats.pending + orderStats.processed + orderStats.delivered}
              </span>
            )}
          </div>
        </button>
      </div>

      {activeTab === 'mall' && (
        <>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-4 py-2 rounded-lg text-sm ${categoryFilter === c ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                {c === 'all' ? '全部' : c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const canAfford = (user?.pointsBalance || 0) >= item.pointsRequired;
              return (
                <div key={item.id} className="card overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-purple-500 shadow-md">
                      {ICON_MAP[item.icon] || <GiftIcon size={32} />}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{item.pointsRequired} 积分</span>
                      <span className="text-xs text-gray-400">库存 {item.stock}</span>
                    </div>
                    <button
                      onClick={() => setShowRedeem(item)}
                      disabled={!canAfford || item.stock <= 0}
                      className={`w-full mt-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${canAfford && item.stock > 0 ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                    >
                      <ShoppingCart size={16} />
                      {item.stock <= 0 ? '已售罄' : !canAfford ? '积分不足' : '立即兑换'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
              <div className="text-2xl font-bold text-purple-600">{orderStats.total}</div>
              <div className="text-xs text-gray-500">全部订单</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
              <div className="text-2xl font-bold text-amber-600">{orderStats.pending}</div>
              <div className="text-xs text-gray-500">待处理</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <div className="text-2xl font-bold text-blue-600">{orderStats.processed}</div>
              <div className="text-xs text-gray-500">运输中</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-csg-green/5 to-csg-green/10">
              <div className="text-2xl font-bold text-csg-green">{orderStats.delivered}</div>
              <div className="text-xs text-gray-500">待收货</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-gray-500/5 to-gray-500/10">
              <div className="text-2xl font-bold text-gray-600">{orderStats.completed}</div>
              <div className="text-xs text-gray-500">已完成</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm ${statusFilter === s ? 'bg-csg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                {s === 'all' ? '全部' : statusLabel(s)}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="card p-12 text-center">
                  <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">暂无兑换订单</p>
                  <button onClick={() => setActiveTab('mall')} className="btn-primary mt-4">去兑换商品</button>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowOrder(order)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center text-purple-500">
                          {ICON_MAP[order.itemCategory === '优惠券' ? 'zap' : order.itemCategory === '生活' ? 'coffee' : order.itemCategory === '购物' ? 'bag' : 'gift'] || <GiftIcon size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{order.itemName}</h4>
                            <span className={statusBadge(order.confirmedAt ? 'confirmed' : order.status)}>
                              {order.confirmedAt ? '已完成' : statusLabel(order.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.itemDescription}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                            </span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">-{order.pointsCost} 积分</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.canConfirm && !order.confirmedAt && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirmReceive(order.id); }}
                            disabled={confirming === order.id}
                            className="btn-primary text-sm whitespace-nowrap"
                          >
                            {confirming === order.id ? '确认中...' : '确认收货'}
                          </button>
                        )}
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {showRedeem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">确认兑换</h3>
              <button onClick={() => setShowRedeem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-purple-500">
                {ICON_MAP[showRedeem.icon] || <GiftIcon size={24} />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{showRedeem.name}</h4>
                <p className="text-purple-600 dark:text-purple-400 font-bold">{showRedeem.pointsRequired} 积分</p>
              </div>
            </div>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">当前积分</span>
                <span className="font-semibold text-gray-900 dark:text-white">{user?.pointsBalance?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">兑换后剩余</span>
                <span className="font-semibold text-csg-green">{(user?.pointsBalance || 0) - showRedeem.pointsRequired}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <p>兑换后将在1-3个工作日内处理，电子券将发送至您的账户，实物商品将安排配送。</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRedeem(null)} className="btn-outline flex-1">取消</button>
              <button onClick={() => handleRedeem(showRedeem)} disabled={redeeming === showRedeem.id} className="btn-secondary flex-1 bg-purple-500 hover:bg-purple-600">
                {redeeming === showRedeem.id ? '处理中...' : '确认兑换'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">订单详情</h3>
              <button onClick={() => setShowOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center text-purple-500">
                {ICON_MAP[showOrder.itemCategory === '优惠券' ? 'zap' : showOrder.itemCategory === '生活' ? 'coffee' : showOrder.itemCategory === '购物' ? 'bag' : 'gift'] || <GiftIcon size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{showOrder.itemName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{showOrder.itemDescription}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">-{showOrder.pointsCost} 积分</span>
                  <span className={statusBadge(showOrder.confirmedAt ? 'confirmed' : showOrder.status)}>
                    {showOrder.confirmedAt ? '已完成' : statusLabel(showOrder.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={16} />
                订单进度
              </h5>
              <div className="space-y-4 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
                {showOrder.statusHistory.map((event, index) => {
                  const isLast = index === showOrder.statusHistory.length - 1;
                  return (
                    <div key={index} className="relative flex gap-4 pl-8">
                      <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isLast 
                          ? 'bg-csg-green text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {STATUS_ICONS[event.status] || <CheckCircle size={12} />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${isLast ? 'text-csg-green' : 'text-gray-900 dark:text-white'}`}>
                            {event.description}
                          </span>
                          <span className="text-xs text-gray-400">
                            {event.time ? dayjs(event.time).format('YYYY-MM-DD HH:mm') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">订单编号</span>
                <span className="text-gray-900 dark:text-white font-mono">#{showOrder.id.padStart(8, '0')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">下单时间</span>
                <span className="text-gray-900 dark:text-white">{dayjs(showOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
              </div>
              {showOrder.confirmedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">确认收货时间</span>
                  <span className="text-gray-900 dark:text-white">{dayjs(showOrder.confirmedAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
              )}
            </div>

            {showOrder.itemCategory === '优惠券' && showOrder.status === 'delivered' && !showOrder.confirmedAt && (
              <div className="p-4 bg-csg-green/5 dark:bg-csg-green/10 rounded-lg border border-csg-green/20 mb-5">
                <div className="flex items-start gap-2">
                  <Star size={16} className="text-csg-green mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-csg-green mb-1">优惠券已发放</p>
                    <p className="text-gray-600 dark:text-gray-300 text-xs">
                      您的优惠券已发放至账户，可在电费缴纳时使用。点击确认收货完成订单。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowOrder(null)} className="btn-outline flex-1">关闭</button>
              {showOrder.canConfirm && !showOrder.confirmedAt && (
                <button
                  onClick={() => handleConfirmReceive(showOrder.id)}
                  disabled={confirming === showOrder.id}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {confirming === showOrder.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {confirming === showOrder.id ? '确认中...' : '确认收货'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
