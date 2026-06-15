import { useEffect, useState } from 'react';
import { Eye, CheckCircle, PlayCircle, Clock, MapPin, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import type { ServiceOrder } from '../../../shared/types';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '待接单' },
  { key: 'matched', label: '已确认' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'disputed', label: '争议中' },
];

export default function OrderList() {
  const { 
    orders, 
    ordersLoading, 
    orderTotal, 
    activeTab, 
    setActiveTab, 
    currentOrder,
    fetchOrders, 
    fetchOrderDetail,
    acceptOrder,
    startOrder,
    completeOrder
  } = useWorkspaceStore();
  
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders({ status: activeTab === 'all' ? undefined : activeTab });
  }, [activeTab, fetchOrders]);

  const handleViewDetail = async (order: ServiceOrder) => {
    await fetchOrderDetail(order.id);
    setShowDetail(true);
  };

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await acceptOrder(orderId);
    } catch (error) {
      console.error('Failed to accept order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await startOrder(orderId);
    } catch (error) {
      console.error('Failed to start order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await completeOrder(orderId);
    } catch (error) {
      console.error('Failed to complete order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButton = (order: ServiceOrder) => {
    const isLoading = actionLoading === order.id;
    
    switch (order.status) {
      case 'published':
        return (
          <button
            onClick={() => handleAccept(order.id)}
            disabled={isLoading}
            className="btn-primary gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {isLoading ? '处理中...' : '接单'}
          </button>
        );
      case 'matched':
      case 'confirmed':
      case 'deposit_paid':
        return (
          <button
            onClick={() => handleStart(order.id)}
            disabled={isLoading}
            className="btn-accent gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            {isLoading ? '处理中...' : '开始服务'}
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => handleComplete(order.id)}
            disabled={isLoading}
            className="btn-primary gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {isLoading ? '处理中...' : '完成服务'}
          </button>
        );
      default:
        return null;
    }
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-75">
                ({tab.key === 'all' ? orderTotal : orders.filter(o => o.status === tab.key).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {ordersLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card p-12">
          <Empty />
          <p className="mt-4 text-center text-zinc-500">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="card p-5 transition-all hover:shadow-card-hover"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-zinc-900">{order.title}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {order.location || '远程服务'}
                        </span>
                        {order.serviceTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {order.serviceTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {order.description && (
                    <p className="line-clamp-2 text-sm text-zinc-600">{order.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-zinc-500">
                      分类: <span className="text-zinc-700">{order.category || '未分类'}</span>
                    </span>
                    <span className="text-zinc-500">
                      时长: <span className="text-zinc-700">{order.duration}分钟</span>
                    </span>
                    <span className="text-lg font-bold text-primary-600">¥{order.price}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  {getActionButton(order)}
                  <button
                    onClick={() => handleViewDetail(order)}
                    className="btn-secondary gap-2 px-4 py-2 text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    详情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">订单详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-semibold text-zinc-900">{currentOrder.title}</h4>
                  <StatusBadge status={currentOrder.status} className="mt-2" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">¥{currentOrder.price}</p>
                  <p className="text-sm text-zinc-500">定金: ¥{currentOrder.deposit}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">服务分类</p>
                  <p className="mt-1 font-medium text-zinc-900">{currentOrder.category || '未分类'}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">服务时长</p>
                  <p className="mt-1 font-medium text-zinc-900">{currentOrder.duration}分钟</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">服务地点</p>
                  <p className="mt-1 font-medium text-zinc-900">{currentOrder.location || '远程服务'}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">服务时间</p>
                  <p className="mt-1 font-medium text-zinc-900">{currentOrder.serviceTime || '待确认'}</p>
                </div>
              </div>

              {currentOrder.description && (
                <div>
                  <p className="text-sm font-medium text-zinc-700">需求描述</p>
                  <p className="mt-2 rounded-xl bg-zinc-50 p-4 text-zinc-600">{currentOrder.description}</p>
                </div>
              )}

              {currentOrder.requirements && (
                <div>
                  <p className="text-sm font-medium text-zinc-700">服务要求</p>
                  <p className="mt-2 rounded-xl bg-zinc-50 p-4 text-zinc-600">{currentOrder.requirements}</p>
                </div>
              )}

              {currentOrder.insurancePolicy && (
                <div>
                  <p className="text-sm font-medium text-zinc-700">保障方案</p>
                  <p className="mt-2 rounded-xl bg-primary-50 p-4 text-primary-700">{currentOrder.insurancePolicy}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowDetail(false)}
                  className="btn-secondary px-6 py-2.5"
                >
                  关闭
                </button>
                {getActionButton(currentOrder)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
