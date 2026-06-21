import { motion } from 'framer-motion';
import { FileText, Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';

const templates = [
  {
    id: 'TPL001',
    name: '瓷器鉴定证书模板',
    category: '陶瓷',
    updatedAt: '2024-01-10',
    usage: 1280,
    status: 'active',
  },
  {
    id: 'TPL002',
    name: '玉器鉴定证书模板',
    category: '玉器',
    updatedAt: '2024-01-08',
    usage: 960,
    status: 'active',
  },
  {
    id: 'TPL003',
    name: '书画鉴定证书模板',
    category: '书画',
    updatedAt: '2024-01-05',
    usage: 780,
    status: 'active',
  },
];

export default function AdminTemplates() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">模板配置</h1>
            <p className="text-jade-500">管理鉴定证书模板和系统模板</p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>新建模板</Button>
        </div>

        <Card className="mb-6">
          <Card.Content className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
              <input type="text" placeholder="搜索模板..." className="input-field pl-11" />
            </div>
          </Card.Content>
        </Card>

        {templates.length === 0 ? (
          <Card>
            <Card.Content>
              <EmptyState
                icon={<FileText className="w-12 h-12 text-gold-500" />}
                title="暂无模板"
                description="创建您的第一个证书模板"
                action={{ label: '新建模板', onClick: () => {} }}
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, index) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card hoverable className="h-full flex flex-col">
                  <div className="aspect-[3/4] bg-rice-100 border-b border-gold-200 flex items-center justify-center">
                    <div className="text-center p-4">
                      <FileText className="w-12 h-12 text-gold-400 mx-auto mb-2" />
                      <p className="font-serif text-sm text-jade-500">证书预览</p>
                    </div>
                  </div>
                  <Card.Content className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Tag variant="outline">{tpl.category}</Tag>
                      <Badge variant="success" dot>{tpl.status === 'active' ? '启用中' : '已停用'}</Badge>
                    </div>
                    <h3 className="font-serif text-base font-semibold text-jade-700 mb-3 line-clamp-1">{tpl.name}</h3>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center justify-between text-xs text-jade-500">
                        <span>使用次数</span>
                        <span className="font-medium text-jade-700">{tpl.usage}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-jade-500">
                        <span>最后更新</span>
                        <span className="font-medium text-jade-700">{tpl.updatedAt}</span>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gold-200">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3 h-3" />}>预览</Button>
                        <Button variant="ghost" size="sm" leftIcon={<Edit2 className="w-3 h-3" />}>编辑</Button>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-3 h-3" />}>删除</Button>
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
