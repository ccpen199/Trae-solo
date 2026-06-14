import { useState } from 'react';
import { Package, Clock, CheckCircle2, Calendar, TrendingUp, History, Zap, Filter, ChevronDown, X, Sparkles, Baby, ChefHat, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import EnterpriseNavbar from '@/components/EnterpriseNavbar';
import { useEnterpriseStore } from '@/store/useEnterpriseStore';
import type { BatchOrder, ServiceType } from '@/types';
import { cn } from '@/lib/utils';

type OrderTab = 'active' | 'history';

const serviceIconMap: Record<ServiceType, typeof Sparkles> = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function EnterpriseOrders() {
  const enterprise = useEnterpriseStore((state) => state.enterprise);
  const batchOrders = useEnterpriseStore((state) => state.batchOrders);
  const servicePackages = useEnterpriseStore((state) => state.servicePackages);
  const consumeBatchOrder = useEnterpriseStore((state) => state.useBatchOrder);

  const [activeTab, setActiveTab] = useState<OrderTab>('active');
  const [selectedOrder, setSelectedOrder] = useState<BatchOrder | null>(null);
  const [showUseModal, setShowUseModal] = useState(false);

  const enterpriseOrders = enterprise
    ? batchOrders.filter((b) => b.enterprise_id === enterprise.id)
    : [];

  const activeOrders = enterpriseOrders.filter((b) => b.status === 'active');
  const historyOrders = enterpriseOrders.filter((b) => b.status !== 'active');

  const filteredOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const totalRemaining = activeOrders.reduce(
    (sum, o) => sum + (o.total_count - o.used_count),
    0
  );
  const totalUsed = enterpriseOrders.reduce((sum, o) => sum + o.used_count, 0);
  const totalAmount = enterpriseOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const handleUse = (order: BatchOrder) => {
    setSelectedOrder(order);
    setShowUseModal(true);
  };

  const confirmUse = () => {
    if (selectedOrder) {
      consumeBatchOrder(selectedOrder.id);
      setShowUseModal(false);
      setSelectedOrder(null);
    }
  };

  const getStatusConfig = (status: BatchOrder['status']) => {
    const map: Record<BatchOrder['status'], { label: string; className: string }> = {
      active: { label: '使用中', className: 'badge-green' },
      exhausted: { label: '已用完', className: 'badge-gray' },
      expired: { label: '已过期', className: 'badge-red' },
    };
    return map[status];
  };

  const getPackageByOrder = (order: BatchOrder) => {
    return servicePackages.find((p) => p.id === order.package_id);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <EnterpriseNavbar />

      <section className="relative overflow-hidden gradient-mesh">
        <div className="container mx-auto px-4 py-10">
          <div className="animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">服务包订单</h1>
            <p className="text-secondary-500">管理您已采购的企业服务包，查看使用记录</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="card p-5 animate-fade-up stagger-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-secondary-500 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">有效服务包</span>
                  </div>
                  <p className="text-3xl font-bold text-secondary-800">{activeOrders.length}</p>
                  <p className="text-sm text-secondary-500 mt-1">正在生效中</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="card p-5 animate-fade-up stagger-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-secondary-500 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">剩余次数</span>
                  </div>
                  <p className="text-3xl font-bold text-secondary-800">{totalRemaining}</p>
                  <p className="text-sm text-secondary-500 mt-1">可随时使用</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-soft">
                  <Zap className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="card p-5 animate-fade-up stagger-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-secondary-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">累计使用</span>
                  </div>
                  <p className="text-3xl font-bold text-secondary-800">{totalUsed}</p>
                  <p className="text-sm text-secondary-500 mt-1">累计采购 ¥{totalAmount.toLocaleString()}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-soft">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="card overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 md:px-6">
            <div className="flex">
              {[
                { key: 'active' as OrderTab, label: '使用中', icon: Package, count: activeOrders.length },
                { key: 'history' as OrderTab, label: '历史记录', icon: History, count: historyOrders.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 py-4 px-4 text-sm font-medium transition-colors relative border-b-2 -mb-px',
                      isActive
                        ? 'text-primary-600 border-primary-500'
                        : 'text-secondary-500 border-transparent hover:text-secondary-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <Link
              to="/enterprise"
              className="hidden md:flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 text-sm"
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5 md:p-6">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-secondary-300" />
                </div>
                <p className="text-secondary-500 mb-4">
                  {activeTab === 'active' ? '暂无使用中的服务包' : '暂无历史订单记录'}
                </p>
                {activeTab === 'active' && (
                  <Link to="/enterprise" className="btn-primary inline-flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    去采购服务包
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => {
                  const status = getStatusConfig(order.status);
                  const pkg = getPackageByOrder(order);
                  const percent = Math.round((order.used_count / order.total_count) * 100);
                  const remaining = order.total_count - order.used_count;
                  const Icon = pkg?.service_types[0] ? serviceIconMap[pkg.service_types[0]] : Package;

                  return (
                    <div
                      key={order.id}
                      className={cn('card-hover p-5 animate-fade-up', `stagger-${(index % 3) + 1}`)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn(
                            'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                            order.status === 'active'
                              ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-soft'
                              : 'bg-gray-100'
                          )}>
                            <Icon className={cn(
                              'w-7 h-7',
                              order.status === 'active' ? 'text-white' : 'text-gray-400'
                            )} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h3 className="font-bold text-secondary-800">{order.package_name}</h3>
                                <p className="text-xs text-secondary-400 mt-0.5">订单号 #{order.id}</p>
                              </div>
                              <span className={status.className}>{status.label}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                采购：{formatDate(order.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                到期：{formatDate(order.expire_at)}
                              </span>
                              <span className="font-medium text-secondary-700">
                                ¥{order.total_amount.toLocaleString()}
                              </span>
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-secondary-500">使用进度</span>
                                <span className="font-medium text-secondary-700">
                                  {order.used_count} / {order.total_count} 次
                                </span>
                              </div>
                              <div className="h-2.5 bg-secondary-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    order.status === 'active'
                                      ? 'bg-gradient-to-r from-primary-400 to-primary-600'
                                      : 'bg-gray-300'
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1.5">
                                <span className={cn(
                                  'font-medium',
                                  order.status === 'active' ? 'text-primary-600' : 'text-gray-400'
                                )}>
                                  剩余 {remaining} 次
                                </span>
                                <span className="text-secondary-400">已使用 {percent}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:w-36">
                          {order.status === 'active' && (
                            <button
                              onClick={() => handleUse(order)}
                              className="btn-primary !py-2.5 !px-4 text-sm flex items-center justify-center gap-1.5 flex-1"
                            >
                              <Zap className="w-4 h-4" />
                              立即使用
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn-secondary !py-2.5 !px-4 text-sm flex items-center justify-center gap-1.5 flex-1"
                          >
                            查看详情
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedOrder && !showUseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-secondary-800">服务包详情</h3>
                  <p className="text-xs text-secondary-500">订单号 #{selectedOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              <div>
                <h4 className="font-bold text-secondary-800 text-lg mb-2">{selectedOrder.package_name}</h4>
                <span className={cn(
                  'badge',
                  selectedOrder.status === 'active' ? 'badge-green' : selectedOrder.status === 'exhausted' ? 'badge-gray' : 'badge-red'
                )}>
                  {getStatusConfig(selectedOrder.status).label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary-500 mb-1">采购日期</p>
                  <p className="font-medium text-secondary-800">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 mb-1">到期日期</p>
                  <p className="font-medium text-secondary-800">{formatDate(selectedOrder.expire_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 mb-1">总次数</p>
                  <p className="font-medium text-secondary-800">{selectedOrder.total_count} 次</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 mb-1">采购金额</p>
                  <p className="font-medium text-secondary-800">¥{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-cream-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-secondary-700">使用情况</p>
                  <p className="text-sm text-secondary-500">
                    {selectedOrder.used_count} / {selectedOrder.total_count} 次
                  </p>
                </div>
                <div className="h-3 bg-secondary-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                    style={{ width: `${Math.round((selectedOrder.used_count / selectedOrder.total_count) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-600 font-medium">
                    剩余 {selectedOrder.total_count - selectedOrder.used_count} 次
                  </span>
                  <span className="text-secondary-500">
                    已使用 {Math.round((selectedOrder.used_count / selectedOrder.total_count) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-secondary-700 mb-3">使用记录</p>
                <div className="space-y-2">
                  {Array.from({ length: Math.min(selectedOrder.used_count, 5) }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-cream-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-700">服务 #{selectedOrder.id}-{idx + 1}</p>
                          <p className="text-xs text-secondary-400">
                            {new Date(Date.now() - (idx + 1) * 86400000 * 3).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">已完成</span>
                    </div>
                  ))}
                  {selectedOrder.used_count === 0 && (
                    <p className="text-center text-secondary-400 text-sm py-4">暂无使用记录</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary !py-2.5 !px-5"
              >
                关闭
              </button>
              {selectedOrder.status === 'active' && (
                <button
                  onClick={() => setShowUseModal(true)}
                  className="btn-primary !py-2.5 !px-5 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  立即使用
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showUseModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-secondary-800">确认使用服务</h3>
              <button
                onClick={() => {
                  setShowUseModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="bg-cream-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary-800">{selectedOrder.package_name}</h4>
                    <p className="text-xs text-secondary-500">剩余 {selectedOrder.total_count - selectedOrder.used_count} 次</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">服务地址</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入服务地址"
                  defaultValue="北京市朝阳区建国路88号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">预约时间</label>
                <input
                  type="datetime-local"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">备注信息</label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="请输入服务需求或特殊要求"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowUseModal(false);
                  setSelectedOrder(null);
                }}
                className="btn-secondary !py-2.5 !px-5"
              >
                取消
              </button>
              <button
                onClick={confirmUse}
                className="btn-primary !py-2.5 !px-5 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                确认下单
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-secondary-800 text-white py-10 mt-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-secondary-400 text-sm">
            © 2025 暖心到家 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
