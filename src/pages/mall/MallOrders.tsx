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
  MapPin,
  ChevronRight,
  Boxes,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  FileBarChart,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Users,
  AlertTriangle,
  Minus,
  Phone,
} from 'lucide-react';
import { mallOrders, fulfillmentTracks, stockTransactions, biReports } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { MallOrder, FulfillmentTrack, StockTransaction, BIReport } from '@/types';

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

const fulfillmentStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待处理', color: 'text-neon-orange', icon: Clock },
  confirmed: { label: '已确认', color: 'text-cyber-400', icon: CheckCircle },
  picking: { label: '拣货中', color: 'text-cyber-400', icon: Boxes },
  picked: { label: '已拣货', color: 'text-neon-purple', icon: Package },
  packing: { label: '打包中', color: 'text-neon-purple', icon: Boxes },
  packed: { label: '已打包', color: 'text-neon-purple', icon: Package },
  shipping: { label: '配送中', color: 'text-neon-purple', icon: Truck },
  delivered: { label: '已签收', color: 'text-neon-green', icon: CheckCircle },
  pickup_ready: { label: '待取货', color: 'text-cyber-400', icon: Store },
  picked_up: { label: '已取货', color: 'text-neon-green', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-dark-500', icon: Minus },
};

const stockTypeMap: Record<string, { label: string; color: string; icon: any }> = {
  in: { label: '入库', color: 'text-neon-green bg-neon-green/10 border-neon-green/30', icon: ArrowDownToLine },
  out: { label: '出库', color: 'text-neon-red bg-neon-red/10 border-neon-red/30', icon: ArrowUpFromLine },
  adjust: { label: '调整', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: SlidersHorizontal },
  transfer_in: { label: '调拨入库', color: 'text-cyber-400 bg-cyber-500/10 border-cyber-500/30', icon: ArrowRightLeft },
  transfer_out: { label: '调拨出库', color: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30', icon: ArrowRightLeft },
  return: { label: '退货', color: 'text-neon-orange bg-neon-orange/10 border-neon-orange/30', icon: Package },
};

const biCategoryMap: Record<string, { label: string; color: string }> = {
  revenue: { label: '营收分析', color: 'text-neon-green' },
  operations: { label: '运营分析', color: 'text-cyber-400' },
  members: { label: '会员分析', color: 'text-neon-purple' },
  devices: { label: '设备分析', color: 'text-neon-orange' },
  inventory: { label: '库存分析', color: 'text-yellow-400' },
};

const statusOptions = ['全部状态', '待处理', '处理中', '配送中', '已完成', '已取消'];
const fulfillmentOptions = ['全部方式', '到店自提', '快递配送'];

const orderDetailTabs = [
  { key: 'fulfillment', label: '履约轨迹' },
  { key: 'stock', label: '库存流水' },
  { key: 'bi', label: 'BI报表口径' },
];

export default function MallOrders() {
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [selectedFulfillment, setSelectedFulfillment] = useState('全部方式');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});

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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const getTracksForOrder = (orderId: string) => {
    return fulfillmentTracks
      .filter((t) => t.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getLatestTrack = (orderId: string) => {
    const tracks = getTracksForOrder(orderId);
    return tracks.length > 0 ? tracks[0] : null;
  };

  const getFulfillmentSteps = (order: MallOrder) => {
    if (order.fulfillmentType === 'pickup') {
      return ['confirmed', 'picking', 'picked', 'pickup_ready', 'picked_up'];
    }
    return ['confirmed', 'picking', 'picked', 'packed', 'shipping', 'delivered'];
  };

  const getFulfillmentStepLabels = (order: MallOrder) => {
    if (order.fulfillmentType === 'pickup') {
      return ['订单确认', '拣货中', '备货完成', '待取货', '已取货'];
    }
    return ['订单确认', '拣货中', '已拣货', '已打包', '配送中', '已签收'];
  };

  const setOrderTab = (orderId: string, tab: string) => {
    setActiveTab({ ...activeTab, [orderId]: tab });
  };

  const getOrderTab = (orderId: string) => {
    return activeTab[orderId] || 'fulfillment';
  };

  const getStockForOrder = (order: MallOrder) => {
    return stockTransactions.filter((st) => {
      const productIds = order.products.map((p) => p.productId);
      return productIds.includes(st.productId);
    });
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
          const tracks = getTracksForOrder(order.id);
          const latestTrack = getLatestTrack(order.id);
          const fulfillmentSteps = getFulfillmentSteps(order);
          const fulfillmentStepLabels = getFulfillmentStepLabels(order);
          const completedTrackStatuses = new Set<string>(tracks.map((t) => t.status));
          const currentTab = getOrderTab(order.id);
          const relatedStock = getStockForOrder(order);

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
                        {latestTrack && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', fulfillmentStatusMap[latestTrack.status]?.color, 'bg-dark-800')}>
                            {fulfillmentStatusMap[latestTrack.status]?.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
                        <span>{order.userName}</span>
                        <span>{formatDate(order.createdAt)}</span>
                        <span>{order.products.length} 件商品</span>
                        {latestTrack?.trackingNumber && (
                          <span className="font-mono text-xs">单号: {latestTrack.trackingNumber}</span>
                        )}
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
                  <div className="flex gap-2 mt-4 mb-4 border-b border-dark-700">
                    {orderDetailTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderTab(order.id, tab.key);
                        }}
                        className={cn(
                          'px-4 py-2 text-sm font-medium transition-colors relative',
                          currentTab === tab.key
                            ? 'text-cyber-400'
                            : 'text-dark-400 hover:text-white'
                        )}
                      >
                        {tab.label}
                        {currentTab === tab.key && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {currentTab === 'fulfillment' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-dark-300">商品明细</h4>
                          <div className="space-y-2">
                            {order.products.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30 border border-dark-700/50"
                              >
                                <div className="w-10 h-10 rounded-lg bg-cyber-500/10 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-cyber-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-white font-medium">{item.productName}</p>
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
                          <h4 className="text-sm font-medium text-dark-300">收货/自提信息</h4>
                          <div className="p-3 rounded-lg bg-dark-900/50 border border-dark-700/50 space-y-3">
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
                              <>
                                <div className="flex items-center gap-2">
                                  <Store className="w-4 h-4 text-dark-500" />
                                  <span className="text-white">{order.storeName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-neon-green" />
                                  <span className="text-xs text-neon-green">备货状态: 已完成</span>
                                </div>
                              </>
                            )}
                            {latestTrack?.courierName && (
                              <div className="pt-2 border-t border-dark-700">
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-neon-purple" />
                                  <span className="text-white">{latestTrack.courierName}</span>
                                </div>
                                {latestTrack.courierPhone && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4 text-dark-500" />
                                    <span className="text-white">{latestTrack.courierPhone}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {latestTrack?.trackingNumber && (
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-dark-500" />
                                <span className="text-white font-mono text-sm">{latestTrack.trackingNumber}</span>
                              </div>
                            )}
                            {latestTrack?.location && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-dark-500 mt-0.5" />
                                <span className="text-dark-300 text-sm">{latestTrack.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {order.status !== 'cancelled' && (
                        <div>
                          <h4 className="text-sm font-medium text-dark-300 mb-3">履约进度</h4>
                          <div className="p-4 rounded-lg bg-dark-900/50 border border-dark-700/50">
                            <div className="flex items-center">
                              {fulfillmentStepLabels.map((label, index) => {
                                const stepKey = fulfillmentSteps[index];
                                const isCompleted = completedTrackStatuses.has(stepKey as string);
                                const isCurrent = !isCompleted && (index === 0 || completedTrackStatuses.has(fulfillmentSteps[index - 1] as string));
                                const StepIcon = fulfillmentStatusMap[stepKey]?.icon || CheckCircle;
                                return (
                                  <div key={label} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center">
                                      <div className={cn(
                                        'w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                                        isCompleted && 'bg-neon-green/20 border border-neon-green/50',
                                        isCurrent && 'bg-cyber-500/20 border border-cyber-500 animate-pulse',
                                        !isCompleted && !isCurrent && 'bg-dark-700 border border-dark-600'
                                      )}>
                                        <StepIcon className={cn(
                                          'w-4 h-4',
                                          isCompleted && 'text-neon-green',
                                          isCurrent && 'text-cyber-400',
                                          !isCompleted && !isCurrent && 'text-dark-500'
                                        )} />
                                      </div>
                                      <span className={cn(
                                        'text-xs mt-2 whitespace-nowrap',
                                        isCompleted && 'text-neon-green',
                                        isCurrent && 'text-cyber-400',
                                        !isCompleted && !isCurrent && 'text-dark-500'
                                      )}>
                                        {label}
                                      </span>
                                    </div>
                                    {index < fulfillmentSteps.length - 1 && (
                                      <div className={cn(
                                        'flex-1 h-0.5 mx-2 mb-6',
                                        isCompleted ? 'bg-neon-green/50' : 'bg-dark-700'
                                      )}></div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-cyber-400" />
                          履约轨迹时间轴
                        </h4>
                        {tracks.length === 0 ? (
                          <div className="p-6 rounded-lg bg-dark-900/50 border border-dark-700/50 text-center">
                            <Truck className="w-8 h-8 mx-auto mb-2 text-dark-600" />
                            <p className="text-sm text-dark-500">暂无履约轨迹</p>
                          </div>
                        ) : (
                          <div className="relative space-y-0">
                            {tracks.map((track, index) => {
                              const trackStatus = fulfillmentStatusMap[track.status] || fulfillmentStatusMap.pending;
                              const TrackIcon = trackStatus.icon;
                              const isLast = index === tracks.length - 1;
                              return (
                                <div key={track.id} className="relative flex gap-4 pb-4">
                                  {!isLast && (
                                    <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-cyber-500/50 to-dark-700" />
                                  )}
                                  <div className={cn(
                                    'relative z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                                    index === 0 && 'bg-neon-green/10 border-neon-green/30',
                                    index !== 0 && 'bg-dark-800 border-dark-700'
                                  )}>
                                    <TrackIcon className={cn('w-4 h-4', trackStatus.color)} />
                                  </div>
                                  <div className="flex-1 p-3 rounded-lg bg-dark-900/50 border border-dark-700/50">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={cn('text-sm font-medium', trackStatus.color)}>
                                            {trackStatus.label}
                                          </span>
                                          {track.fulfillmentType === 'same_city' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple">
                                              同城配送
                                            </span>
                                          )}
                                          {track.fulfillmentType === 'pickup' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-500/20 text-cyber-400">
                                              到店自提
                                            </span>
                                          )}
                                          {track.fulfillmentType === 'standard' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                                              标准快递
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-dark-400 mt-1">{track.description}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-dark-500 flex-wrap">
                                          {track.operatorName && (
                                            <span className="flex items-center gap-1">
                                              <User className="w-3 h-3" />
                                              {track.operatorName}
                                            </span>
                                          )}
                                          {track.courierName && (
                                            <span className="flex items-center gap-1">
                                              <Truck className="w-3 h-3" />
                                              {track.courierName}
                                            </span>
                                          )}
                                          {track.courierPhone && (
                                            <span className="flex items-center gap-1">
                                              <Phone className="w-3 h-3" />
                                              {track.courierPhone}
                                            </span>
                                          )}
                                          {track.location && (
                                            <span className="flex items-center gap-1">
                                              <MapPin className="w-3 h-3" />
                                              {track.location}
                                            </span>
                                          )}
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDateTime(track.createdAt)}
                                          </span>
                                        </div>
                                        {track.estimatedTime && (
                                          <p className="text-xs text-cyber-400 mt-2">{track.estimatedTime}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentTab === 'stock' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-dark-900/50 border border-dark-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-cyber-400" />
                            库存流水记录
                          </h4>
                          <span className="text-xs text-dark-500">共 {relatedStock.length} 条记录</span>
                        </div>
                        {relatedStock.length === 0 ? (
                          <div className="p-6 text-center">
                            <Boxes className="w-8 h-8 mx-auto mb-2 text-dark-600" />
                            <p className="text-sm text-dark-500">暂无相关库存流水</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-dark-700">
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">流水号</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">商品</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">类型</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">数量</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">变更前/后</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">关联单据</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">操作人</th>
                                  <th className="text-left py-2 px-3 text-dark-400 font-medium">时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {relatedStock.map((st: StockTransaction) => {
                                  const typeInfo = stockTypeMap[st.type] || stockTypeMap.adjust;
                                  const TypeIcon = typeInfo.icon;
                                  return (
                                    <tr key={st.id} className="border-b border-dark-700/50 hover:bg-dark-800/30">
                                      <td className="py-3 px-3">
                                        <span className="font-mono text-xs text-white">{st.id}</span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-4 h-4 text-dark-500" />
                                          <span className="text-white">{st.productName}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className={cn(
                                          'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border',
                                          typeInfo.color
                                        )}>
                                          <TypeIcon className="w-3 h-3" />
                                          {typeInfo.label}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className={cn(
                                          'font-medium',
                                          st.quantity > 0 ? 'text-neon-green' : 'text-neon-red'
                                        )}>
                                          {st.quantity > 0 ? '+' : ''}{st.quantity}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="text-dark-400">{st.beforeStock}</span>
                                        <ChevronRight className="w-3 h-3 inline mx-1 text-dark-600" />
                                        <span className="text-white">{st.afterStock}</span>
                                      </td>
                                      <td className="py-3 px-3">
                                        {st.referenceId ? (
                                          <span className="text-cyber-400 font-mono text-xs">{st.referenceId}</span>
                                        ) : (
                                          <span className="text-dark-500">-</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="text-dark-300">{st.operatorName}</span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="text-dark-400 text-xs">{formatDateTime(st.createdAt)}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-lg bg-dark-900/50 border border-dark-700/50">
                        <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2 mb-4">
                          <SlidersHorizontal className="w-4 h-4 text-cyber-400" />
                          库存类型说明
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          {Object.entries(stockTypeMap).map(([key, info]) => {
                            const TypeIcon = info.icon;
                            return (
                              <div key={key} className={cn('p-3 rounded-lg border flex items-center gap-2', info.color)}>
                                <TypeIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-medium">{info.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTab === 'bi' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gradient-to-r from-cyber-500/10 to-neon-purple/10 border border-cyber-500/30">
                        <h4 className="text-sm font-medium text-cyber-400 flex items-center gap-2 mb-2">
                          <FileBarChart className="w-4 h-4" />
                          订单数据 → BI报表 汇入口径说明
                        </h4>
                        <p className="text-xs text-dark-300 leading-relaxed">
                          商城订单数据会根据以下规则自动汇总到集团BI系统，
                          用于生成经营日报、周报、月报及各类分析报表，确保全集团数据口径统一。
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-dark-900/50 border border-dark-700/50">
                          <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-cyber-400" />
                            汇总规则
                          </h5>
                          <div className="space-y-2 text-xs text-dark-300">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />
                              <span>订单状态为 delivered/已完成 的会计入营收统计</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />
                              <span>订单创建时间归属到对应自然日，按下单时间统计</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />
                              <span>积分抵扣部分不计入实际营收，但计入订单金额</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />
                              <span>取消订单(cancelled)不计入订单数和营收</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />
                              <span>按门店(storeId)维度拆分归属到对应门店</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neon-green mt-0.5 flex-shrink-0" />
                              <span>商品维度统计：按商品类别、单品分别汇总销量</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-dark-900/50 border border-dark-700/50">
                          <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <FileBarChart className="w-4 h-4 text-neon-purple" />
                            关联BI报表示例
                          </h5>
                          <div className="space-y-3">
                            {biReports.slice(0, 3).map((report: BIReport) => {
                              const categoryInfo = biCategoryMap[report.category];
                              return (
                                <div key={report.id} className="p-3 rounded-lg bg-dark-800/50 border border-dark-700 hover:border-cyber-500/50 transition-colors cursor-pointer">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={cn('text-sm font-medium', categoryInfo?.color)}>
                                          {report.name}
                                        </span>
                                        {report.status === 'ready' && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-neon-green/20 text-neon-green">
                                            已生成
                                          </span>
                                        )}
                                        {report.status === 'generating' && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-cyber-500/20 text-cyber-400 animate-pulse">
                                            生成中
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {report.startDate} ~ {report.endDate}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {report.generatedBy}
                                        </span>
                                      </div>
                                    </div>
                                    <Download className="w-4 h-4 text-dark-500 hover:text-cyber-400 transition-colors" />
                                  </div>
                                  {report.summary && report.summary.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-700">
                                      {report.summary.slice(0, 4).map((item, idx) => (
                                        <div key={idx}>
                                          <p className="text-xs text-dark-500">{item.label}</p>
                                          <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-white">
                                              {item.value.toLocaleString()}{item.unit}
                                            </span>
                                            {item.trend !== undefined && (
                                              <span className={cn(
                                                'text-xs flex items-center',
                                                item.trend >= 0 ? 'text-neon-green' : 'text-neon-red'
                                              )}>
                                                {item.trend >= 0 ? (
                                                  <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                  <TrendingDown className="w-3 h-3" />
                                                )}
                                                {item.trend >= 0 ? '+' : ''}{item.trend}%
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-dark-900/50 border border-dark-700/50">
                        <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyber-400" />
                          数据指标映射
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-dark-700">
                                <th className="text-left py-2 px-3 text-dark-400 font-medium">BI指标</th>
                                <th className="text-left py-2 px-3 text-dark-400 font-medium">数据来源</th>
                                <th className="text-left py-2 px-3 text-dark-400 font-medium">计算规则</th>
                                <th className="text-left py-2 px-3 text-dark-400 font-medium">报表周期</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-dark-700/50">
                                <td className="py-3 px-3 text-white font-medium">订单数</td>
                                <td className="py-3 px-3 text-dark-300">商城订单表</td>
                                <td className="py-3 px-3 text-dark-400">status != cancelled 的订单数</td>
                                <td className="py-3 px-3 text-dark-400">日/周/月</td>
                              </tr>
                              <tr className="border-b border-dark-700/50">
                                <td className="py-3 px-3 text-white font-medium">营收金额</td>
                                <td className="py-3 px-3 text-dark-300">商城订单表</td>
                                <td className="py-3 px-3 text-dark-400">status = delivered 的 totalAmount 合计</td>
                                <td className="py-3 px-3 text-dark-400">日/周/月</td>
                              </tr>
                              <tr className="border-b border-dark-700/50">
                                <td className="py-3 px-3 text-white font-medium">客单价(AOV)</td>
                                <td className="py-3 px-3 text-dark-300">商城订单表</td>
                                <td className="py-3 px-3 text-dark-400">营收金额 / 有效订单数</td>
                                <td className="py-3 px-3 text-dark-400">日/周/月</td>
                              </tr>
                              <tr className="border-b border-dark-700/50">
                                <td className="py-3 px-3 text-white font-medium">商品销量</td>
                                <td className="py-3 px-3 text-dark-300">订单商品明细</td>
                                <td className="py-3 px-3 text-dark-400">按 productId 汇总 quantity</td>
                                <td className="py-3 px-3 text-dark-400">日/周/月</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-3 text-white font-medium">积分使用</td>
                                <td className="py-3 px-3 text-dark-300">商城订单表</td>
                                <td className="py-3 px-3 text-dark-400">pointsUsed 字段合计</td>
                                <td className="py-3 px-3 text-dark-400">日/周/月</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-dark-700 flex flex-wrap gap-2">
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
                    {(order.status === 'delivered' || order.status === 'shipped') && (
                      <button className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors">
                        <FileBarChart className="w-4 h-4" />
                        导出订单
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
