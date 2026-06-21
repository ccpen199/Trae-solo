import { motion } from 'framer-motion';
import { User, Settings, Camera, Phone, Calendar, Award, Gem, ShoppingBag, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';

export default function UserProfile() {
  const { user } = useAuthStore();

  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid lg:grid-cols-4 gap-6"
      >
        <Card className="lg:col-span-1">
          <Card.Content className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-ink-gradient flex items-center justify-center border-4 border-gold-400 mx-auto">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gold-300" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold-500 text-white flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="font-serif text-xl font-bold text-jade-700 mb-1">
              {user?.nickname || '藏家小王'}
            </h2>
            <Badge variant="default" className="mb-3">普通会员</Badge>
            <p className="text-sm text-jade-500 mb-6">ID: {user?.id || 'user_001'}</p>

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-gold-200 mb-4">
              <div className="text-center">
                <p className="font-serif text-xl font-bold text-jade-700">12</p>
                <p className="text-xs text-jade-500">鉴定订单</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-xl font-bold text-jade-700">8</p>
                <p className="text-xs text-jade-500">我的藏品</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-xl font-bold text-jade-700">238</p>
                <p className="text-xs text-jade-500">积分</p>
              </div>
            </div>

            <nav className="space-y-1 text-left">
              {[
                { icon: User, label: '个人资料', active: true },
                { icon: ShoppingBag, label: '我的订单' },
                { icon: Gem, label: '我的藏品' },
                { icon: Award, label: '鉴定证书' },
                { icon: Settings, label: '账号设置' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors',
                      item.active ? 'bg-gold-50 text-gold-600' : 'text-jade-600 hover:bg-rice-100',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                );
              })}
            </nav>
          </Card.Content>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>基本信息</Card.Title>
              <Button variant="ghost" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />}>编辑</Button>
            </Card.Header>
            <Card.Content>
              <EmptyState
                icon={<User className="w-10 h-10 text-gold-500" />}
                title="个人资料编辑功能"
                description="您可以在这里编辑和完善您的个人信息"
              />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>账号信息</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gold-100">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-jade-400" />
                    <span className="text-jade-600">绑定手机号</span>
                  </div>
                  <span className="font-medium text-jade-700">{user?.phone || '138****8888'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gold-100">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-jade-400" />
                    <span className="text-jade-600">注册时间</span>
                  </div>
                  <span className="font-medium text-jade-700">2024年1月1日</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Tag variant="outline">实名认证</Tag>
                  </div>
                  <Badge variant="warning">未认证</Badge>
                </div>
              </div>
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
