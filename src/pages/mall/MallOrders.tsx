import { useState } from 'react';
import {
  Search,
  Filter,
  Package,
  Truck,
  Store,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { mallOrders } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { MallOrder } from '@/types';

const statusMap = {
  pending: { label: '待处理', color: 'bg-neon-orange/20 text-neon-orange' },
  processing: { label: '处理中', color: 'bg-cyber-500/20 text-cyber-400' },
  shipped: { label: '配送中', color: 'bg-neon-purple/20 text-neon-purple' },
  delivered: { label: '已完成', color: 'bg-neon-green/20 text-neon-green' },
  cancelled: { label: '已取消', color: 'bg-dark-600 text-dark-300' },
};

const fulfillmentMap: Record<string, { label: string; icon: any }> = {
  pickup: { label: '到店自提', icon: Store },
  delivery: { label: '快递配送', icon: Truck },
};

const statusOptions = ['全部状态', '待处理', '处理中', '配送中', '已完成', '已取消'];
const fulfillmentOptions = ['全部方式', '到店自提', '快递配送'];

export default function MallOrders() {
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [selectedFulfillment, setSelectedFulfillment] = useState('全部方式');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOrders = mallOrders.filter((order) => {
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';
    const fulfillmentKey = selectedFulfillment === '全部方式' ? '' :
      Object.entries(fulfillmentMap).find(([, v]) => v.label === selectedFulfillment)?.[0] || '';

    const matchStatus = !statusKey || order.status === statusKey;
    const matchFulfillment = !fulfillmentKey || order.fulfillmentType === fulfillmentKey;
    const matchSearch = !searchText ||
      order.id.toLowerCase().includes(searchText.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchText.toLowerCase());

    return matchStatus && matchFulfillment && matchSearch;
  });

  const stats = {
    total: mallOrders.length,
    pending: mallOrders.filter((o) => o.status === 'pending').length,
    processing: mallOrders.filter((o) => o.status === 'processing').length,
    todayRevenue: mallOrders
      .filter((o) => o.status === 'delivered' || o.status === 'shipped')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">商城订单</h1>
          <p className="text-dark-400 mt-1">管理商城订单与履约</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Package className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">订单总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Clock className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">待处理</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Truck className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">处理中</p>
          </div>
          <p className="text-2xl font-bold text-cyber-400 font-orbitron">{stats.processing}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <CheckCircle className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">今日营收</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">
            ¥{stats.todayRevenue.toLocaleString()}
          </p>
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
              placeholder="搜索订单号/客户..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={selectedFulfillment}
            onChange={(e) => setSelectedFulfillment(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {fulfillmentOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      <div className="space-y-3">
        {filteredOrders.map((order: MallOrder) => {
          const statusInfo = statusMap[order.status];
          const fulfillmentInfo = fulfillmentMap[order.fulfillmentType];
          const FulfillmentIcon = fulfillmentInfo.icon;
          const isExpanded = expandedId === order.id;
          const currentStep = getStatusStep(order.status);

          return (
            <div
              key={order.id}
              className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-600/50"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-3 rounded-lg',
                      order.fulfillmentType === 'delivery'
                        ? 'bg-neon-purple/20'
                        : 'bg-cyber-500/20'
                    )}>
                      <FulfillmentIcon className={cn(
                        'w-5 h-5',
                        order.fulfillmentType === 'delivery'
                          ? 'text-neon-purple'
                          : 'text-cyber-400'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium">{order.id}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                          {fulfillmentInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
                        <span>{order.userName}</span>
                        <span>{formatDate(order.createdAt)}</span>
                        <span>{order.products.length} 件商品</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-neon-green font-orbitron">
                        ¥{order.totalAmount}
                      </p>
                      {order.pointsUsed > 0 && (
                        <p className="text-xs text-dark-500">积分抵扣: {order.pointsUsed}</p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-dark-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-dark-400" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-dark-700">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">商品明细</h4>
                      <div className="space-y-2">
                        {order.products.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-lg bg-dark-700/30"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-white">{item.productName}</p>
                              <p className="text-xs text-dark-400">
                                ¥{item.price} × {item.quantity}
                              </p>
                            </div>
                            <span className="text-sm text-white font-medium">
                              ¥{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">收货信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-dark-500" />
                          <span className="text-white">{order.userName}</span>
                        </div>
                        {order.fulfillmentType === 'delivery' && order.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-dark-500 mt-0.5" />
                            <span className="text-white">{order.address}</span>
                          </div>
                        )}
                        {order.fulfillmentType === 'pickup' && order.storeName && (
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-dark-500" />
                            <span className="text-white">{order.storeName}</span>
                          </div>
                        )}
                      </div>

                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <div className="pt-3">
                          <h4 className="text-sm font-medium text-dark-300 mb-3">订单进度</h4>
                          <div className="flex items-center">
                            {['下单', '处理', '配送', '完成'].map((step, index) => (
                              <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                                  index <= currentStep
                                    ? 'bg-neon-green text-black'
                                    : 'bg-dark-700 text-dark-500'
                                )}>
                                  {index <= currentStep ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                {index < 3 && (
                                  <div className={cn(
                                    'flex-1 h-1 mx-2',
                                    index < currentStep ? 'bg-neon-green' : 'bg-dark-700'
                                  )}></div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-dark-400">
                            <span>下单</span>
                            <span>处理中</span>
                            <span>配送中</span>
                            <span>完成</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-700 flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button className="flex items-center gap-2 h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors">
                          <Package className="w-4 h-4" />
                          确认订单
                        </button>
                        <button className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors ml-auto">
                          取消订单
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button className="flex items-center gap-2 h-9 px-4 bg-neon-purple hover:bg-neon-purple/80 text-white text-sm font-medium rounded-lg transition-colors">
                        <Truck className="w-4 h-4" />
                        发货
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button className="flex items-center gap-2 h-9 px-4 bg-neon-green hover:bg-neon-green/80 text-white text-sm font-medium rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        确认收货
                      </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <button className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors ml-auto">
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的订单</p>
        </div>
      )}
    </div>
  );
}
