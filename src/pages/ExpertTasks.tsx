import { motion } from 'framer-motion';
import { ClipboardList, Clock, User, Filter, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';

const tasks = [
  {
    id: 'TASK001',
    artworkName: '清乾隆青花缠枝莲纹赏瓶',
    category: '陶瓷',
    user: '藏友小王',
    price: 800,
    deadline: '2小时',
    status: 'bidding',
  },
  {
    id: 'TASK002',
    artworkName: '明代和田玉观音摆件',
    category: '玉器',
    user: '玉石爱好者',
    price: 500,
    deadline: '5小时',
    status: 'bidding',
  },
  {
    id: 'TASK003',
    artworkName: '齐白石虾趣图立轴',
    category: '书画',
    user: '书画藏家',
    price: 1200,
    deadline: '已接受',
    status: 'accepted',
  },
  {
    id: 'TASK004',
    artworkName: '宋代建窑兔毫盏',
    category: '陶瓷',
    user: '宋瓷爱好者',
    price: 600,
    deadline: '鉴定中',
    status: 'appraising',
  },
];

export default function ExpertTasks() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">任务大厅</h1>
            <p className="text-jade-500">浏览和接受鉴定任务</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Filter className="w-4 h-4" />}>筛选</Button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { label: '待竞价', count: 12, active: true },
            { label: '已接受', count: 5 },
            { label: '鉴定中', count: 3 },
            { label: '已完成', count: 42 },
          ].map((tab) => (
            <button
              key={tab.label}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                tab.active ? 'bg-gold-50 text-gold-600' : 'bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600',
              )}
            >
              {tab.label}
              <Badge variant={tab.active ? 'warning' : 'default'} className="ml-2">{tab.count}</Badge>
            </button>
          ))}
        </div>

        {tasks.length === 0 ? (
          <Card>
            <Card.Content>
              <EmptyState
                icon={<ClipboardList className="w-12 h-12 text-gold-500" />}
                title="暂无任务"
                description="当前没有可接受的鉴定任务"
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card hoverable>
                  <Card.Content>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-20 h-20 rounded-md bg-rice-100 flex items-center justify-center flex-shrink-0 border border-gold-200">
                        <ClipboardList className="w-8 h-8 text-gold-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Tag variant="outline">{task.category}</Tag>
                          <Badge
                            variant={
                              task.status === 'bidding' ? 'warning' :
                              task.status === 'accepted' ? 'info' :
                              'success'
                            }
                            dot
                          >
                            {task.status === 'bidding' ? '待竞价' : task.status === 'accepted' ? '已接受' : '鉴定中'}
                          </Badge>
                        </div>
                        <h3 className="font-serif text-lg font-semibold text-jade-700 mb-2 line-clamp-1">{task.artworkName}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-jade-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {task.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {task.deadline}
                          </span>
                          <span className="font-mono text-xs">ID: {task.id}</span>
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2">
                        <span className="font-serif text-xl font-bold text-gold-600">¥{task.price}</span>
                        <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                          {task.status === 'bidding' ? '参与竞价' : '查看详情'}
                        </Button>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function cn(...inputs: unknown[]) {
  return inputs.filter(Boolean).join(' ');
}
