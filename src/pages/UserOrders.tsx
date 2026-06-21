import { motion } from 'framer-motion';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; icon: typeof Clock }> = {
  pending: { label: '待接单', variant: 'warning', icon: Clock },
  accepted: { label: '已接单', variant: 'info', icon: FileText },
  appraising: { label: '鉴定中', variant: 'info', icon: Clock },
  completed: { label: '已完成', variant: 'success', icon: CheckCircle2 },
  disputed: { label: '纠纷中', variant: 'error', icon: AlertCircle },
};

const orders = [
  {
    id: 'ORD20240115001',
    artworkName: '清乾隆青花缠枝莲纹赏瓶',
    category: '陶瓷',
    expert: '张明清',
    price: 500,
    status: 'completed',
    date: '2024-01-15',
  },
  {
    id: 'ORD20240112002',
    artworkName: '和田白玉籽料观音挂件',
    category: '玉器',
    expert: '李玉山',
    price: 300,
    status: 'appraising',
    date: '2024-01-12',
  },
  {
    id: 'ORD20240110003',
    artworkName: '齐白石虾趣图立轴',
    category: '书画',
    expert: '王书远',
    price: 800,
    status: 'pending',
    date: '2024-01-10',
  },
];

export default function UserOrders() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">我的订单</h1>
            <p className="text-jade-500">查看您的所有鉴定订单</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Filter className="w-4 h-4" />}>筛选</Button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { label: '全部订单', count: 12 },
            { label: '待接单', count: 2 },
            { label: '鉴定中', count: 3 },
            { label: '已完成', count: 6 },
            { label: '纠纷中', count: 1 },
          ].map((tab) => (
            <button
              key={tab.label}
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600"
            >
              {tab.label}
              <Badge variant="default" className="ml-2">{tab.count}</Badge>
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <Card>
            <Card.Content>
              <EmptyState
                icon={<ShoppingBag className="w-12 h-12 text-gold-500" />}
                title="暂无订单"
                description="您还没有任何鉴定订单"
                action={{ label: '立即鉴定', onClick: () => {} }}
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card hoverable>
                    <Card.Content>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-jade-500">订单号：</span>
                          <span className="font-mono text-sm text-jade-700">{order.id}</span>
                        </div>
                        <Badge variant={status.variant} dot>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-20 h-20 rounded-md bg-rice-100 flex items-center justify-center flex-shrink-0 border border-gold-200">
                          <ShoppingBag className="w-8 h-8 text-gold-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-lg font-semibold text-jade-700 mb-1 line-clamp-1">{order.artworkName}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-jade-500">
                            <Tag variant="outline">{order.category}</Tag>
                            <span>鉴定专家：{order.expert}</span>
                            <span>下单时间：{order.date}</span>
                          </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1">
                          <span className="font-serif text-xl font-bold text-gold-600">¥{order.price}</span>
                          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                            查看详情
                          </Button>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
