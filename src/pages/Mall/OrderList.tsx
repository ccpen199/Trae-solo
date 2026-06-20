import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  Star,
  RotateCcw,
  CreditCard,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Tabs, Button, message, Input } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { mockOrders, mockOrderItems } from '@/mocks/data/mall';
import type { Order, OrderItem, OrderStatus } from '@/types/entity';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  PENDING_PAYMENT: {
    label: '待付款',
    icon: CreditCard,
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
  },
  PAID: {
    label: '待发货',
    icon: Package,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
  },
  SHIPPED: {
    label: '待收货',
    icon: Truck,
    color: 'text-info-400',
    bgColor: 'bg-info-500/10',
  },
  DELIVERED: {
    label: '待评价',
    icon: Star,
    color: 'text-accent-400',
    bgColor: 'bg-accent-500/10',
  },
  COMPLETED: {
    label: '已完成',
    icon: CheckCircle2,
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
  },
  CANCELLED: {
    label: '已取消',
    icon: RotateCcw,
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-500/10',
  },
  REFUNDED: {
    label: '已退款',
    icon: RotateCcw,
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-500/10',
  },
};

const tabItems = [
  { key: 'all', label: '全部' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PAID', label: '待发货' },
  { key: 'SHIPPED', label: '待收货' },
  { key: 'DELIVERED', label: '待评价' },
  { key: 'COMPLETED', label: '已完成' },
];

function getOrderActions(status: OrderStatus) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return [
        { label: '取消订单', type: 'ghost' as const },
        { label: '去付款', type: 'primary' as const },
      ];
    case 'PAID':
      return [
        { label: '提醒发货', type: 'ghost' as const },
        { label: '申请退款', type: 'danger' as const },
      ];
    case 'SHIPPED':
      return [
        { label: '查看物流', type: 'ghost' as const },
        { label: '确认收货', type: 'primary' as const },
      ];
    case 'DELIVERED':
      return [
        { label: '申请售后', type: 'ghost' as const },
        { label: '去评价', type: 'accent' as const },
      ];
    case 'COMPLETED':
      return [
        { label: '申请售后', type: 'ghost' as const },
        { label: '再次购买', type: 'primary' as const },
      ];
    default:
      return [{ label: '查看详情', type: 'ghost' as const }];
  }
}

interface OrderCardProps {
  order: OrderWithItems;
  onActionClick: (action: string, order: OrderWithItems) => void;
  onItemClick: (item: OrderItem) => void;
}

function OrderCard({ order, onActionClick, onItemClick }: OrderCardProps) {
  const statusInfo = statusConfig[order.status] || statusConfig.CANCELLED;
  const StatusIcon = statusInfo.icon;
  const actions = getOrderActions(order.status);

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card mb-4 overflow-hidden"
    >
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">订单号：</span>
            <span className="text-sm text-white font-mono">{order.orderNo}</span>
          </div>
          <div className={cn('flex items-center gap-2', statusInfo.color)}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{statusInfo.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
          <span>下单时间：{new Date(order.createdAt).toLocaleString()}</span>
          <span>
            店铺：
            <span className="text-primary-400 cursor-pointer hover:underline">
              阳光优选生鲜店
            </span>
          </span>
        </div>
      </div>

      <div className="p-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.02] -mx-4 px-4 transition-colors"
          >
            <img
              src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.productId}`}
              alt={item.productName}
              className="w-20 h-20 rounded-lg bg-white/5 object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-white font-medium line-clamp-2 mb-1">
                {item.productName}
              </h3>
              <p className="text-xs text-neutral-500">规格：标准装</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-white font-mono">¥{item.price.toFixed(2)}</p>
              <p className="text-xs text-neutral-500">x{item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>共 {totalQuantity} 件商品</span>
            <span className="text-neutral-600">|</span>
            <span>
              实付：
              <span className="text-lg font-bold text-danger-400 font-mono">
                ¥{order.totalAmount.toFixed(2)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => onActionClick(action.label, order)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  action.type === 'primary' &&
                    'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500',
                  action.type === 'accent' &&
                    'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-400 hover:to-accent-500',
                  action.type === 'danger' &&
                    'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30',
                  action.type === 'ghost' &&
                    'bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function OrderList() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');

  const ordersWithItems: OrderWithItems[] = useMemo(() => {
    return mockOrders.map((order) => ({
      ...order,
      items: mockOrderItems.filter((item) => item.orderId === order.id),
    }));
  }, []);

  const filteredOrders = useMemo(() => {
    let result = ordersWithItems;

    if (activeTab !== 'all') {
      result = result.filter((order) => order.status === activeTab);
    }

    if (searchText) {
      result = result.filter(
        (order) =>
          order.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
          order.items.some((item) =>
            item.productName.toLowerCase().includes(searchText.toLowerCase())
          )
      );
    }

    return result;
  }, [ordersWithItems, activeTab, searchText]);

  const handleActionClick = (action: string, order: OrderWithItems) => {
    message.info(`${action} - 订单号：${order.orderNo}`);
  };

  const handleItemClick = (item: OrderItem) => {
    message.info(`查看商品：${item.productName}`);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="我的订单"
        subtitle="查看和管理您的所有订单"
        breadcrumb={[
          { title: '首页' },
          { title: '社区电商' },
          { title: '我的订单' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card mb-6"
        >
          <div className="p-4 border-b border-white/5">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="搜索订单号、商品名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="!pl-10 !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
              />
            </div>
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="!px-4"
          />
        </motion.div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <OrderCard
                  order={order}
                  onActionClick={handleActionClick}
                  onItemClick={handleItemClick}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
          >
            <EmptyState
              type="default"
              title="暂无订单"
              description={searchText ? '没有找到匹配的订单' : '您还没有任何订单，快去逛逛吧'}
              action={
                searchText
                  ? undefined
                  : {
                      label: '去购物',
                      onClick: () => message.info('跳转到商城首页'),
                    }
              }
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
