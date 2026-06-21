import { motion } from 'framer-motion';
import { AlertTriangle, Search, Gavel, Eye, Filter, User, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';

const disputes = [
  {
    id: 'DISP001',
    orderId: 'ORD20240115001',
    artworkName: '清乾隆青花缠枝莲纹赏瓶',
    user: '藏友小王',
    expert: '张明清',
    reason: '鉴定结果与预期不符',
    status: 'pending',
    createdAt: '2024-01-16',
  },
  {
    id: 'DISP002',
    orderId: 'ORD20240110003',
    artworkName: '齐白石虾趣图立轴',
    user: '书画收藏者',
    expert: '王书远',
    reason: '证书信息有误',
    status: 'processing',
    createdAt: '2024-01-15',
  },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: '待处理', variant: 'warning' },
  processing: { label: '处理中', variant: 'info' },
  resolved: { label: '已解决', variant: 'success' },
  rejected: { label: '已驳回', variant: 'error' },
};

export default function AdminDisputes() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">纠纷仲裁</h1>
            <p className="text-jade-500">处理用户与专家之间的鉴定纠纷</p>
          </div>
        </div>

        <Card className="mb-6">
          <Card.Content className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
              <input type="text" placeholder="搜索订单号或纠纷ID..." className="input-field pl-11" />
            </div>
            <div className="flex gap-2">
              {['全部', '待处理', '处理中', '已解决', '已驳回'].map((status) => (
                <button
                  key={status}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                    status === '待处理' ? 'bg-gold-50 text-gold-600' : 'bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600',
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" leftIcon={<Filter className="w-4 h-4" />}>筛选</Button>
          </Card.Content>
        </Card>

        {disputes.length === 0 ? (
          <Card>
            <Card.Content>
              <EmptyState
                icon={<AlertTriangle className="w-12 h-12 text-gold-500" />}
                title="暂无纠纷"
                description="当前没有需要处理的纠纷案件"
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute, index) => {
              const status = statusMap[dispute.status];
              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card>
                    <Card.Content>
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <Tag variant="seal">纠纷 #{dispute.id}</Tag>
                          <Badge variant={status.variant} dot>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-jade-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{dispute.createdAt}</span>
                        </div>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-jade-700 mb-3">{dispute.artworkName}</h3>
                      <div className="grid md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-ink-gradient flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-gold-300" />
                          </div>
                          <span className="text-jade-500">申诉用户：</span>
                          <span className="font-medium text-jade-700">{dispute.user}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-ink-gradient flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-gold-300" />
                          </div>
                          <span className="text-jade-500">被诉专家：</span>
                          <span className="font-medium text-jade-700">{dispute.expert}</span>
                        </div>
                        <div className="md:col-span-2 text-sm">
                          <span className="text-jade-500">申诉原因：</span>
                          <span className="font-medium text-jade-700">{dispute.reason}</span>
                        </div>
                        <div className="md:col-span-2 text-sm">
                          <span className="text-jade-500">关联订单：</span>
                          <span className="font-mono text-jade-700">{dispute.orderId}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>查看详情</Button>
                        <Button variant="primary" size="sm" leftIcon={<Gavel className="w-3.5 h-3.5" />}>开始仲裁</Button>
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

function cn(...inputs: unknown[]) {
  return inputs.filter(Boolean).join(' ');
}
