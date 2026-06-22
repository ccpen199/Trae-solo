import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import PriceTag from '@/components/common/PriceTag';
import EmptyState from '@/components/common/EmptyState';
import { orders } from '@/mock/data/orders';
import { cn } from '@/lib/utils';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  CreditCard,
  RefreshCw,
  Eye,
  ShoppingCart,
  ChevronRight,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const statusTabs = [
  { id: 'all', label: '全部', icon: FileText },
  { id: 'pending', label: '待支付', icon: CreditCard },
  { id: 'producing', label: '生产中', icon: Package },
  { id: 'shipped', label: '待收货', icon: Truck },
  { id: 'completed', label: '已完成', icon: CheckCircle },
  { id: 'cancelled', label: '已取消', icon: XCircle },
];

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-gold-50', text: 'text-gold-600', icon: 'text-gold-500' },
  producing: { bg: 'bg-brand-50', text: 'text-brand-600', icon: 'text-brand-500' },
  shipped: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
  completed: { bg: 'bg-forest-50', text: 'text-forest-600', icon: 'text-forest-500' },
  cancelled: { bg: 'bg-paper-100', text: 'text-paper-500', icon: 'text-paper-400' },
};

const statusLabels: Record<string, string> = {
  pending: '待支付',
  producing: '生产中',
  shipped: '待收货',
  completed: '已完成',
  cancelled: '已取消',
};

export default function OrderListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(order => order.status === activeTab);

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleBuyAgain = (orderId: string) => {
    alert('已添加到购物车');
    navigate('/cart');
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('确定要取消这个订单吗？')) {
      alert('订单已取消');
    }
  };

  const handlePay = (orderId: string) => {
    navigate('/checkout');
  };

  const handleConfirmReceive = (orderId: string) => {
    if (confirm('确认已收到商品吗？')) {
      alert('确认收货成功');
    }
  };

  const handleViewLogistics = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'producing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  return (
    <div className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-paper-900">
              我的订单
            </h1>
            <p className="text-paper-500 mt-1">
              共 {orders.length} 个订单
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            leftIcon={<ShoppingCart className="h-4 w-4" />}
          >
            去购物
          </Button>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-paper-200 px-6">
              <TabsList className="border-b-0 bg-transparent p-0 -mb-px">
                {statusTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'relative px-5 py-3 text-sm font-medium border-b-2 border-transparent',
                        isActive
                          ? 'text-brand-600 border-brand-500'
                          : 'text-paper-500 hover:text-paper-700'
                      )}
                    >
                      <Icon className="h-4 w-4 mr-1.5" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={<Package className="h-16 w-16" />}
                    title="暂无订单"
                    description="快去挑选心仪的商品吧"
                    action={
                      <Button onClick={() => navigate('/')}>
                        去购物
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-paper-100">
                  {filteredOrders.map(order => {
                    const statusInfo = statusColors[order.status] || statusColors.producing;
                    const statusLabel = statusLabels[order.status] || order.statusText;

                    return (
                      <div key={order.id} className="p-6">
                        {/* 订单头部 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-paper-500">
                              订单号：<span className="font-mono text-paper-700">{order.orderNo}</span>
                            </span>
                            <span className="text-sm text-paper-400">
                              {order.createdAt}
                            </span>
                          </div>
                          <div className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                            statusInfo.bg,
                            statusInfo.text
                          )}>
                            <span className={statusInfo.icon}>
                              {getStatusIcon(order.status)}
                            </span>
                            {statusLabel}
                          </div>
                        </div>

                        {/* 商品列表 */}
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-4 flex-wrap">
                              {order.items.slice(0, 3).map(item => (
                                <div
                                  key={item.productId + item.materialId}
                                  className="flex gap-3 flex-1 min-w-[200px]"
                                >
                                  <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-paper-100">
                                    <img
                                      src={item.previewImage}
                                      alt={item.templateName || item.productName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-paper-900 text-sm truncate">
                                      {item.templateName || item.productName}
                                    </h4>
                                    <p className="text-xs text-paper-500 mt-0.5">
                                      {item.productName} · {item.materialName}
                                    </p>
                                    <p className="text-xs text-paper-400">
                                      {item.spec}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <PriceTag price={item.unitPrice} size="xs" />
                                      <span className="text-xs text-paper-400">
                                        ×{item.quantity}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="flex items-center text-sm text-paper-500">
                                  还有 {order.items.length - 3} 件商品
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 订单金额 */}
                          <div className="text-right flex-shrink-0 min-w-[140px]">
                            <p className="text-xs text-paper-500 mb-1">共 {order.items.length} 件商品</p>
                            <div className="flex items-baseline justify-end gap-1">
                              <span className="text-sm text-paper-500">实付</span>
                              <PriceTag price={order.payableAmount} size="md" />
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(order.id)}
                            leftIcon={<Eye className="h-4 w-4" />}
                          >
                            查看详情
                          </Button>

                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-darkroom-600 hover:text-darkroom-700 hover:bg-darkroom-50"
                              >
                                取消订单
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handlePay(order.id)}
                                leftIcon={<CreditCard className="h-4 w-4" />}
                              >
                                去付款
                              </Button>
                            </>
                          )}

                          {order.status === 'producing' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewLogistics(order.id)}
                              leftIcon={<Package className="h-4 w-4" />}
                            >
                              查看物流
                            </Button>
                          )}

                          {order.status === 'shipped' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewLogistics(order.id)}
                                leftIcon={<Truck className="h-4 w-4" />}
                              >
                                查看物流
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmReceive(order.id)}
                                leftIcon={<ShieldCheck className="h-4 w-4" />}
                              >
                                确认收货
                              </Button>
                            </>
                          )}

                          {order.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleBuyAgain(order.id)}
                              leftIcon={<RefreshCw className="h-4 w-4" />}
                            >
                              再次购买
                            </Button>
                          )}

                          {order.status === 'cancelled' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleBuyAgain(order.id)}
                              leftIcon={<ShoppingCart className="h-4 w-4" />}
                            >
                              重新购买
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            {filteredOrders.length > 0 && (
              <CardFooter className="flex justify-center border-t border-paper-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={5}
                  onPageChange={setCurrentPage}
                />
              </CardFooter>
            )}
          </Tabs>
        </Card>
    </div>
  );
}
