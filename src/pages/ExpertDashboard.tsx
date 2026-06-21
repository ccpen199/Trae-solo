import { motion } from 'framer-motion';
import { Gauge, FileCheck, Clock, TrendingUp, Star, Users, DollarSign, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function ExpertDashboard() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-700">专家工作台</h1>
              <Tag variant="gold">国家级专家</Tag>
            </div>
            <p className="text-jade-500">欢迎回来，张明清老师</p>
          </div>
          <Button variant="primary" leftIcon={<FileCheck className="w-4 h-4" />}>进入任务大厅</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: '本月鉴定', value: '42', icon: FileCheck, trend: '+12%' },
            { label: '待处理任务', value: '8', icon: Clock, trend: '紧急' },
            { label: '累计收入', value: '¥28,600', icon: DollarSign, trend: '+18%' },
            { label: '服务评分', value: '4.9', icon: Star, trend: '优秀' },
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
                      <Badge variant={item.trend.includes('+') ? 'success' : item.trend === '紧急' ? 'error' : 'info'}>
                        {item.trend}
                      </Badge>
                    </div>
                    <p className="text-sm text-jade-500 mb-1">{item.label}</p>
                    <p className="font-serif text-2xl font-bold text-jade-700">{item.value}</p>
                  </Card.Content>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>鉴定数据趋势</Card.Title>
            </Card.Header>
            <Card.Content>
              <EmptyState
                icon={<TrendingUp className="w-10 h-10 text-gold-500" />}
                title="数据图表"
                description="鉴定数据统计图表将在这里展示"
              />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>个人资质</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ink-gradient flex items-center justify-center border-2 border-gold-400">
                  <Award className="w-6 h-6 text-gold-300" />
                </div>
                <div>
                  <p className="font-medium text-jade-700">国家级鉴定专家</p>
                  <p className="text-sm text-jade-500">瓷器鉴定</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-jade-600">专业评分</span>
                    <span className="font-medium text-jade-700">98%</span>
                  </div>
                  <ProgressBar value={98} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-jade-600">响应速度</span>
                    <span className="font-medium text-jade-700">95%</span>
                  </div>
                  <ProgressBar value={95} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-jade-600">服务态度</span>
                    <span className="font-medium text-jade-700">99%</span>
                  </div>
                  <ProgressBar value={99} />
                </div>
              </div>
              <div className="pt-3 border-t border-gold-200">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-jade-400" />
                  <span className="text-jade-600">累计服务藏友：</span>
                  <span className="font-medium text-jade-700">1,280 位</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
