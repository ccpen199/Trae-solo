import { useState } from 'react';
import {
  Search,
  Coins,
  ShoppingCart,
  Gift,
  Clock,
  Star,
  Tag,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
  CheckCircle,
  Package,
  QrCode,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { products, members, exchangeRecords } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { ExchangeRecord } from '@/types';

const categories = ['全部', '时长卡', '电竞周边', '赛事门票', '饮品', '零食'];

const exchangeStatusLabels: Record<ExchangeRecord['status'], { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: '已确认', color: 'bg-cyber-500/20 text-cyber-300' },
  fulfilled: { label: '已备货', color: 'bg-neon-purple/20 text-neon-purple' },
  redeemed: { label: '已核销', color: 'bg-neon-green/20 text-neon-green' },
  cancelled: { label: '已取消', color: 'bg-neon-red/20 text-neon-red' },
  expired: { label: '已过期', color: 'bg-gray-500/20 text-gray-400' },
};

const fulfillmentTypeLabels: Record<ExchangeRecord['fulfillmentType'], { label: string; icon: typeof Package }> = {
  pickup: { label: '到店自提', icon: MapPin },
  delivery: { label: '快递配送', icon: Truck },
  virtual: { label: '虚拟发放', icon: QrCode },
};

const orderStatusFilters = ['全部订单', '待确认', '已确认', '已备货', '已核销', '已取消', '已过期'];

export default function ExchangeCenter() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orderStatusFilter, setOrderStatusFilter] = useState('全部订单');
  const [redeemingOrderId, setRedeemingOrderId] = useState<string | null>(null);

  const currentMember = members[0];

  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === '全部' || product.category === selectedCategory;
    const matchSearch = !searchText ||
      product.name.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch && product.pointsCost > 0;
  });

  const filteredOrders = exchangeRecords
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((order) => {
      if (orderStatusFilter === '全部订单') return true;
      const statusMap: Record<string, ExchangeRecord['status']> = {
        '待确认': 'pending',
        '已确认': 'confirmed',
        '已备货': 'fulfilled',
        '已核销': 'redeemed',
        '已取消': 'cancelled',
        '已过期': 'expired',
      };
      return order.status === statusMap[orderStatusFilter];
    });

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
    );
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const totalPoints = cart.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product?.pointsCost || 0) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleOrderExpand = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuditStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      confirmed: '已确认',
      fulfilled: '已备货',
      redeemed: '已核销',
      cancelled: '已取消',
      expired: '已过期',
    };
    return map[status] || status;
  };

  const handleRedeem = (orderId: string) => {
    setRedeemingOrderId(orderId);
    setTimeout(() => {
      setRedeemingOrderId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">权益兑换中心</h1>
          <p className="text-dark-400 mt-1">使用积分兑换精选商品</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-neon-orange/30">
            <Coins className="w-5 h-5 text-neon-orange" />
            <span className="text-xl font-bold text-neon-orange font-orbitron">
              {currentMember.points.toLocaleString()}
            </span>
            <span className="text-sm text-dark-400">积分</span>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative p-3 rounded-xl bg-cyber-600 hover:bg-cyber-500 text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索商品..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'h-9 px-4 text-sm rounded-lg transition-colors',
                  selectedCategory === cat
                    ? 'bg-cyber-600 text-white'
                    : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-500/50 hover:-translate-y-1"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>

              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 text-xs bg-neon-purple/20 text-neon-purple rounded-full">
                  {product.category}
                </span>
              </div>

              {product.stock < 20 && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 text-xs bg-neon-red/20 text-neon-red rounded-full">
                    仅剩 {product.stock} 件
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 h-10">
                {product.name}
              </h3>

              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-neon-orange" />
                    <span className="text-lg font-bold text-neon-orange font-orbitron">
                      {product.pointsCost}
                    </span>
                  </div>
                  <p className="text-xs text-dark-500 line-through">¥{product.price}</p>
                </div>

                <button
                  onClick={() => addToCart(product.id)}
                  className="p-2 rounded-lg bg-cyber-600 hover:bg-cyber-500 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的商品</p>
        </div>
      )}

      <div className="pt-4 border-t border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyber-400" />
            <h2 className="text-xl font-bold text-white font-orbitron">兑换订单</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-300">
              {filteredOrders.length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50 mb-4">
          <Filter className="w-4 h-4 text-dark-400" />
          {orderStatusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setOrderStatusFilter(status)}
              className={cn(
                'h-8 px-3 text-xs rounded-lg transition-colors',
                orderStatusFilter === status
                  ? 'bg-cyber-600 text-white'
                  : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无兑换订单</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusInfo = exchangeStatusLabels[order.status];
              const fulfillmentInfo = fulfillmentTypeLabels[order.fulfillmentType];
              const FulfillmentIcon = fulfillmentInfo.icon;
              const isExpanded = expandedOrders.has(order.id);
              const isRedeeming = redeemingOrderId === order.id;
              const canRedeem = order.status === 'confirmed' || order.status === 'fulfilled';

              return (
                <div
                  key={order.id}
                  className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all hover:border-cyber-600/50"
                >
                  <button
                    onClick={() => toggleOrderExpand(order.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        statusInfo.color
                      )}>
                        <FulfillmentIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white">{order.productName}</p>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                            statusInfo.color
                          )}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-dark-400">
                            订单号: {order.id}
                          </span>
                          <span className="text-xs text-dark-400">
                            数量: x{order.quantity}
                          </span>
                          <span className="text-xs text-dark-400 flex items-center gap-1">
                            <FulfillmentIcon className="w-3 h-3" />
                            {fulfillmentInfo.label}
                          </span>
                          <span className="text-xs text-dark-500">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {order.redemptionCode && (
                            <span className="text-xs px-2 py-0.5 rounded bg-dark-900 text-cyber-300 font-mono">
                              核销码: {order.redemptionCode}
                            </span>
                          )}
                          {order.memberName && (
                            <span className="text-xs text-dark-400">
                              会员: {order.memberName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-neon-orange flex items-center justify-end gap-1">
                          <Coins className="w-3 h-3" />
                          -{order.pointsUsed.toLocaleString()}
                        </p>
                        {order.amountPaid !== undefined && order.amountPaid > 0 && (
                          <p className="text-xs text-dark-400 mt-0.5">
                            +¥{order.amountPaid}
                          </p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-dark-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-dark-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-dark-700/50 p-4 space-y-4 bg-dark-900/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.redemptionCode && (
                          <div className="p-3 rounded-lg bg-dark-800/50 border border-cyber-700/30">
                            <p className="text-xs text-dark-400 mb-1 flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              核销码
                            </p>
                            <p className="text-lg font-mono text-cyber-300 font-bold tracking-wider">
                              {order.redemptionCode}
                            </p>
                          </div>
                        )}
                        {order.fulfillmentType === 'pickup' && order.storeName && (
                          <div className="p-3 rounded-lg bg-dark-800/50 border border-cyber-700/30">
                            <p className="text-xs text-dark-400 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              自提门店
                            </p>
                            <p className="text-sm text-white">{order.storeName}</p>
                          </div>
                        )}
                        {order.fulfillmentType === 'delivery' && order.address && (
                          <div className="p-3 rounded-lg bg-dark-800/50 border border-cyber-700/30">
                            <p className="text-xs text-dark-400 mb-1 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              收货地址
                            </p>
                            <p className="text-sm text-white">{order.address}</p>
                          </div>
                        )}
                        {order.trackingNumber && (
                          <div className="p-3 rounded-lg bg-dark-800/50 border border-cyber-700/30">
                            <p className="text-xs text-dark-400 mb-1">快递单号</p>
                            <p className="text-sm text-white font-mono">{order.trackingNumber}</p>
                          </div>
                        )}
                        {order.operatorName && (
                          <div className="p-3 rounded-lg bg-dark-800/50 border border-cyber-700/30">
                            <p className="text-xs text-dark-400 mb-1">处理人</p>
                            <p className="text-sm text-white">{order.operatorName}</p>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-dark-800/50 border border-cyber-700/30">
                          <p className="text-xs text-dark-400 mb-1">商品类型</p>
                          <p className="text-sm text-white">
                            {order.productType === 'peripheral' && '电竞周边'}
                            {order.productType === 'time' && '时长卡'}
                            {order.productType === 'ticket' && '赛事门票'}
                            {order.productType === 'food' && '饮品零食'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          审计轨迹
                        </p>
                        <div className="space-y-0">
                          {order.auditTrail.map((log, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="mt-1">
                                  {idx === order.auditTrail.length - 1 ? (
                                    <div className="w-4 h-4 rounded-full bg-neon-green/20 flex items-center justify-center">
                                      <CheckCircle className="w-3 h-3 text-neon-green" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-dark-500 bg-dark-700" />
                                  )}
                                </div>
                                {idx < order.auditTrail.length - 1 && (
                                  <div className="w-px flex-1 bg-dark-600 my-1" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs px-2 py-0.5 rounded bg-gradient-to-r from-cyber-600/30 to-neon-purple/30 text-dark-100 border border-cyber-700/30">
                                      {getAuditStatusLabel(log.status)}
                                    </span>
                                    {log.operator && (
                                      <span className="text-xs text-dark-400">
                                        操作人: {log.operator}
                                      </span>
                                    )}
                                  </div>
                                  {log.note && (
                                    <p className="text-xs text-dark-300 mt-2">{log.note}</p>
                                  )}
                                  <p className="text-xs text-dark-500 mt-2">
                                    {formatDateTime(log.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {canRedeem && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleRedeem(order.id)}
                            disabled={isRedeeming}
                            className={cn(
                              'flex-1 h-10 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
                              isRedeeming
                                ? 'bg-dark-600 text-dark-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white shadow-lg shadow-cyber-500/20'
                            )}
                          >
                            {isRedeeming ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                核销中...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                确认核销
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4 rounded-xl bg-dark-800 border border-cyber-600/50 shadow-neon-blue/30 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-dark-700">
              <h3 className="text-xl font-bold text-white font-orbitron">兑换购物车</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 rounded-full hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-dark-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>购物车是空的</p>
                </div>
              ) : (
                cart.map((item) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;

                  return (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Coins className="w-3.5 h-3.5 text-neon-orange" />
                          <span className="text-sm text-neon-orange font-orbitron">
                            {product.pointsCost}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 rounded bg-dark-600 hover:bg-dark-500 text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-white text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 rounded bg-dark-600 hover:bg-dark-500 text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-dark-400 hover:text-neon-red transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 bg-dark-900/50 border-t border-dark-700">
                <div className="flex items-end justify-between mb-4">
                  <span className="text-dark-300">总计积分</span>
                  <div className="flex items-center gap-1">
                    <Coins className="w-5 h-5 text-neon-orange" />
                    <span className="text-2xl font-bold text-neon-orange font-orbitron">
                      {totalPoints.toLocaleString()}
                    </span>
                  </div>
                </div>

                {totalPoints > currentMember.points ? (
                  <div className="mb-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30">
                    <p className="text-sm text-neon-red">积分不足，还差 {totalPoints - currentMember.points} 积分</p>
                  </div>
                ) : null}

                <button
                  disabled={totalPoints > currentMember.points}
                  className={cn(
                    'w-full h-10 font-medium rounded-lg transition-all flex items-center justify-center gap-2',
                    totalPoints > currentMember.points
                      ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white'
                  )}
                >
                  <Gift className="w-4 h-4" />
                  确认兑换
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
