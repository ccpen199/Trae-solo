import { motion } from 'framer-motion';
import { Gauge, Users, FileCheck, Award, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tag } from '@/components/ui/Tag';

export default function AdminDashboard() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700">管理后台</h1>
          <Tag variant="seal">管理员</Tag>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: '注册用户', value: '125,680', icon: Users, trend: '+15.2%', variant: 'success' as const },
            { label: '鉴定订单', value: '8,426', icon: FileCheck, trend: '+8.6%', variant: 'success' as const },
            { label: '认证专家', value: '218', icon: Award, trend: '+12', variant: 'info' as const },
            { label: '待审核', value: '36', icon: Clock, trend: '紧急', variant: 'error' as const },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card hoverable>
                  <Card.Content>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-md bg-gold-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gold-600" />
                      </div>
                      <Badge variant={item.variant}>{item.trend}</Badge>
                    </div>
                    <p className="text-sm text-jade-500 mb-1">{item.label}</p>
                    <p className="font-serif text-2xl font-bold text-jade-700">{item.value}</p>
                  </Card.Content>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>平台运营数据</Card.Title>
            </Card.Header>
            <Card.Content>
              <EmptyState
                icon={<TrendingUp className="w-10 h-10 text-gold-500" />}
                title="数据图表区域"
                description="平台运营数据图表将在这里展示"
              />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>待处理事项</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-3">
              {[
                { type: '专家认证', title: '李明 - 玉器鉴定专家申请', urgent: true },
                { type: '纠纷仲裁', title: '订单 #ORD20240115001 纠纷处理', urgent: true },
                { type: '专家认证', title: '王华 - 书画鉴定专家申请', urgent: false },
                { type: '内容审核', title: '知识库文章待审核 5 篇', urgent: false },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-md hover:bg-rice-100 transition-colors cursor-pointer">
                  <AlertTriangle className={cn('w-4 h-4 mt-0.5 flex-shrink-0', item.urgent ? 'text-cinnabar-500' : 'text-gold-500')} />
                  <div className="flex-1 min-w-0">
                    <Badge variant={item.urgent ? 'error' : 'warning'} className="mb-1">{item.type}</Badge>
                    <p className="text-sm text-jade-700 line-clamp-1">{item.title}</p>
                  </div>
                </div>
              ))}
            </Card.Content>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <Card.Title>本月收入</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-gold-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <p className="font-serif text-3xl font-bold text-jade-700">¥ 856,420</p>
                  <p className="text-sm text-jade-500">较上月增长 18.6%</p>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t border-gold-200">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-jade-600">鉴定服务费</span>
                    <span className="font-medium text-jade-700">¥ 528,600</span>
                  </div>
                  <ProgressBar value={62} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-jade-600">专家会员费</span>
                    <span className="font-medium text-jade-700">¥ 186,000</span>
                  </div>
                  <ProgressBar value={22} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-jade-600">API 调用费</span>
                    <span className="font-medium text-jade-700">¥ 141,820</span>
                  </div>
                  <ProgressBar value={16} />
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>专家分布</Card.Title>
            </Card.Header>
            <Card.Content>
              <EmptyState
                icon={<Award className="w-10 h-10 text-gold-500" />}
                title="专家分类统计"
                description="专家分类统计图表将在这里展示"
              />
            </Card.Content>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...inputs: unknown[]) {
  return inputs.filter(Boolean).join(' ');
}
