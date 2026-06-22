import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Image,
  Palette,
  Heart,
  MapPin,
  FileText,
  Settings,
  ChevronRight,
  Crown,
  Clock,
  Camera,
  Sparkles,
  MessageCircle,
  Shield,
  Building2,
  Factory,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Avatar } from '@/components/ui/Avatar';
import { currentUser } from '@/mock/data/user';
import { orders } from '@/mock/data/orders';
import { communityWorks } from '@/mock/data/community';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: ShoppingBag, label: '我的订单', path: '/orders', key: 'orders' },
  { icon: Image, label: '我的照片', path: '/user/photos', key: 'photos' },
  { icon: Palette, label: '我的作品', path: '/user/works', key: 'works' },
  { icon: MapPin, label: '收货地址', path: '/user/addresses', key: 'addresses' },
  { icon: Shield, label: '账户安全', path: '/user/security', key: 'security' },
  { icon: Building2, label: '企业中心', path: '/user/enterprise', key: 'enterprise' },
  { icon: Heart, label: '我的收藏', path: '/user/favorites', key: 'favorites' },
  { icon: FileText, label: '发票管理', path: '/user/invoices', key: 'invoices' },
  { icon: Settings, label: '账号设置', path: '/user/settings', key: 'settings' },
];

const quickActions = [
  { icon: Camera, label: '上传照片', path: '/user/photos/upload', color: 'bg-brand-500' },
  { icon: Palette, label: '开始创作', path: '/editor', color: 'bg-forest-500' },
  { icon: ShoppingBag, label: '我的订单', path: '/orders', color: 'bg-gold-500' },
  { icon: Factory, label: '工厂工单', path: '/orders', color: 'bg-darkroom-500' },
];

export default function UserCenterPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [activeMenu, setActiveMenu] = useState('overview');

  const recentOrders = orders.slice(0, 3);
  const myWorks = communityWorks.slice(0, 4);

  const displayUser = currentUser;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand-400 to-brand-600 relative">
            <div className="absolute inset-0 bg-grain opacity-20" />
          </div>
          <CardContent className="relative -mt-10">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src={displayUser.avatar}
                alt={displayUser.nickname}
                size="xl"
                className="ring-4 ring-white shadow-medium"
              />
              <div className="mt-3">
                <h3 className="font-display font-semibold text-lg text-paper-900">
                  {displayUser.nickname}
                </h3>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <Tag variant="gold" size="sm" className="gap-1">
                    <Crown className="w-3 h-3" />
                    {displayUser.levelName}
                  </Tag>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="py-2">
                <p className="font-display font-semibold text-lg text-paper-900">
                  {displayUser.stats.totalOrders}
                </p>
                <p className="text-xs text-paper-500">订单数</p>
              </div>
              <div className="py-2 border-x border-paper-100">
                <p className="font-display font-semibold text-lg text-brand-500">
                  {displayUser.stats.points}
                </p>
                <p className="text-xs text-paper-500">积分</p>
              </div>
              <div className="py-2">
                <p className="font-display font-semibold text-lg text-paper-900">
                  {displayUser.stats.coupons}
                </p>
                <p className="text-xs text-paper-500">优惠券</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveMenu(item.key);
                  navigate(item.path);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  activeMenu === item.key
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-paper-600 hover:bg-paper-50 hover:text-paper-900'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-paper-400" />
              </button>
            ))}
          </nav>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              hoverable
              className="cursor-pointer"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="flex flex-col items-center text-center py-6">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3',
                    action.color
                  )}
                >
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-paper-700">
                  {action.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/orders')}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-paper-900 mb-1">订单管理</h3>
                  <p className="text-sm text-paper-500 mb-3">查看所有订单、追踪生产进度</p>
                  <div className="flex items-center gap-2">
                    <Tag variant="brand" size="sm">待付款 {displayUser.stats.totalOrders}</Tag>
                    <Tag variant="gold" size="sm">进行中 2</Tag>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-paper-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card hoverable className="cursor-pointer" onClick={() => navigate('/orders')}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-darkroom-50 flex items-center justify-center flex-shrink-0">
                  <Factory className="w-6 h-6 text-darkroom-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-paper-900 mb-1">生产工单</h3>
                  <p className="text-sm text-paper-500 mb-3">按订单号查看胶片冲洗、装帧、物流节点</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-paper-500">
                      <Search className="w-3 h-3" />
                      输入订单号查询
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-paper-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-500" />
                最近订单
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/orders')}
              >
                查看全部
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-paper-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 p-4 hover:bg-paper-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.previewImage}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-white bg-paper-100"
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-paper-900 truncate">
                        {order.items.map((i) => i.productName).join('、')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-paper-500">
                      {order.orderNo} · {order.createdAt}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-brand-500">
                      ¥{order.payableAmount.toFixed(2)}
                    </p>
                    <Tag
                      variant={
                        order.status === 'completed'
                          ? 'success'
                          : order.status === 'shipped'
                            ? 'gold'
                            : 'brand'
                      }
                      size="sm"
                      className="mt-1"
                    >
                      {order.statusText}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                我的作品
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/user/works')}
              >
                查看全部
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {myWorks.map((work) => (
                <div
                  key={work.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/work/${work.id}`)}
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-paper-100">
                    <img
                      src={work.coverUrl}
                      alt={work.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium truncate">
                        {work.title}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-paper-500">
                      <Heart className="w-3 h-3" />
                      {work.likesCount}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-paper-500">
                      <MessageCircle className="w-3 h-3" />
                      {work.commentsCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
