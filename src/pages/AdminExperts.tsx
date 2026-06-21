import { motion } from 'framer-motion';
import { Award, Search, Check, X, User, Eye, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';

const pendingExperts = [
  {
    id: 'EXP001',
    name: '李明',
    category: '玉器鉴定',
    level: '省级',
    experience: '15年',
    submittedAt: '2024-01-15',
    credentials: ['国家文物鉴定委员会证书', '故宫博物院进修证明'],
  },
  {
    id: 'EXP002',
    name: '王华',
    category: '书画鉴定',
    level: '国家级',
    experience: '25年',
    submittedAt: '2024-01-14',
    credentials: ['中国书法家协会会员', '中央美术学院教授'],
  },
];

export default function AdminExperts() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">专家认证管理</h1>
            <p className="text-jade-500">审核和管理平台认证专家</p>
          </div>
        </div>

        <Card className="mb-6">
          <Card.Content className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
              <input type="text" placeholder="搜索专家姓名..." className="input-field pl-11" />
            </div>
            <div className="flex gap-2">
              {['全部', '待审核', '已通过', '已拒绝'].map((status) => (
                <button
                  key={status}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                    status === '待审核' ? 'bg-gold-50 text-gold-600' : 'bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600',
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" leftIcon={<Filter className="w-4 h-4" />}>更多筛选</Button>
          </Card.Content>
        </Card>

        {pendingExperts.length === 0 ? (
          <Card>
            <Card.Content>
              <EmptyState
                icon={<Award className="w-12 h-12 text-gold-500" />}
                title="暂无待审核申请"
                description="当前没有需要审核的专家认证申请"
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingExperts.map((expert, index) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card>
                  <Card.Content>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-ink-gradient flex items-center justify-center flex-shrink-0 border-2 border-gold-400">
                        <User className="w-8 h-8 text-gold-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-serif text-xl font-semibold text-jade-700">{expert.name}</h3>
                          <Tag variant="outline">{expert.category}</Tag>
                          <Badge variant="warning">待审核</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-jade-500 mb-2">
                          <span>申请级别：<span className="font-medium text-jade-700">{expert.level}</span></span>
                          <span>从业年限：<span className="font-medium text-jade-700">{expert.experience}</span></span>
                          <span>提交时间：<span className="font-medium text-jade-700">{expert.submittedAt}</span></span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-jade-500">资质证明：</span>
                          {expert.credentials.map((cred) => (
                            <Badge key={cred} variant="info">{cred}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 md:flex-col md:items-stretch">
                        <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>查看详情</Button>
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />}>通过</Button>
                          <Button variant="ghost" size="sm" leftIcon={<X className="w-3.5 h-3.5" />}>拒绝</Button>
                        </div>
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
