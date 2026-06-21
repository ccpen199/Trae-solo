import { motion } from 'framer-motion';
import { Gem, Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

const collections = [
  {
    id: '1',
    name: '清乾隆青花缠枝莲纹赏瓶',
    category: '陶瓷',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop'],
    status: '已鉴定',
    addedAt: '2024-01-15',
  },
  {
    id: '2',
    name: '和田白玉籽料观音挂件',
    category: '玉器',
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop'],
    status: '鉴定中',
    addedAt: '2024-01-12',
  },
  {
    id: '3',
    name: '齐白石虾趣图立轴',
    category: '书画',
    images: ['https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=300&h=300&fit=crop'],
    status: '待鉴定',
    addedAt: '2024-01-10',
  },
];

export default function UserCollections() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">我的藏品</h1>
            <p className="text-jade-500">管理您的私人藏品</p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>添加藏品</Button>
        </div>

        <Card className="mb-6">
          <Card.Content className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
              <input type="text" placeholder="搜索我的藏品..." className="input-field pl-11" />
            </div>
            <div className="flex gap-2">
              {['全部', '陶瓷', '玉器', '书画', '其他'].map((cat) => (
                <button
                  key={cat}
                  className="px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600"
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card.Content>
        </Card>

        {collections.length === 0 ? (
          <Card>
            <Card.Content>
              <EmptyState
                icon={<Gem className="w-12 h-12 text-gold-500" />}
                title="暂无藏品"
                description="添加您的第一件藏品开始管理"
                action={{ label: '添加藏品', onClick: () => {} }}
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card hoverable className="overflow-hidden h-full flex flex-col">
                  <div className="relative">
                    <Card.Image src={item.images[0]} alt={item.name} aspectRatio="square" />
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={
                          item.status === '已鉴定' ? 'success' : item.status === '鉴定中' ? 'info' : 'warning'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <Card.Content className="flex-1 flex flex-col">
                    <h3 className="font-serif text-base font-semibold text-jade-700 mb-2 line-clamp-1">{item.name}</h3>
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <Badge variant="default">{item.category}</Badge>
                      <span className="text-jade-500 text-xs">{item.addedAt}</span>
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
