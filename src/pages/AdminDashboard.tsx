import {
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  Eye,
  ChevronRight,
  MoreHorizontal,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { orders } from '@/mock/data/orders';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

const statCards = [
  {
    title: '今日订单数',
    value: '128',
    change: '+12.5%',
    changeType: 'up',
    icon: ShoppingCart,
    color: 'from-brand-400 to-brand-600',
  },
  {
    title: '今日销售额',
    value: '¥38,650',
    change: '+8.2%',
    changeType: 'up',
    icon: DollarSign,
    color: 'from-forest-400 to-forest-600',
  },
  {
    title: '今日新增用户',
    value: '56',
    change: '+23.1%',
    changeType: 'up',
    icon: Users,
    color: 'from-gold-400 to-gold-600',
  },
  {
    title: '待审核素材',
    value: '24',
    change: '-5.3%',
    changeType: 'down',
    icon: Clock,
    color: 'from-paper-400 to-paper-600',
  },
];

const salesData = [
  { day: '周一', value: 85 },
  { day: '周二', value: 72 },
  { day: '周三', value: 95 },
  { day: '周四', value: 68 },
  { day: '周五', value: 110 },
  { day: '周六', value: 145 },
  { day: '周日', value: 132 },
];

const hotProducts = [
  { rank: 1, name: '精装相册', sales: 256, amount: '¥32,768', trend: 'up' },
  { rank: 2, name: 'LOMO卡', sales: 189, amount: '¥5,670', trend: 'up' },
  { rank: 3, name: '马克杯', sales: 156, amount: '¥9,204', trend: 'down' },
  { rank: 4, name: '台历', sales: 134, amount: '¥6,566', trend: 'up' },
  { rank: 5, name: '手机壳', sales: 98, amount: '¥3,822', trend: 'down' },
];

const recentOrders = orders.slice(0, 5);

export default function AdminDashboard() {
  const { user } = useUserStore();

  const maxValue = Math.max(...salesData.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-paper-900">
            数据看板
          </h1>
          <p className="mt-1 text-sm text-paper-500">
            欢迎回来，今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            今日
          </Button>
          <Button variant="primary" size="sm">
            导出报表
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-paper-500">{card.title}</p>
                    <p className="mt-2 text-2xl font-display font-semibold text-paper-900">
                      {card.value}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {card.changeType === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-forest-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-darkroom-500" />
                      )}
                      <span
                        className={cn(
                          'text-sm font-medium',
                          card.changeType === 'up'
                            ? 'text-forest-500'
                            : 'text-darkroom-500'
                        )}
                      >
                        {card.change}
                      </span>
                      <span className="text-xs text-paper-400">较昨日</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
                      card.color
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-500" />
                销售趋势
              </CardTitle>
              <Tabs defaultValue="week">
                <TabsList>
                  <TabsTrigger value="week">本周</TabsTrigger>
                  <TabsTrigger value="month">本月</TabsTrigger>
                  <TabsTrigger value="year">本年</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {salesData.map((data, index) => {
                const heightPercent = (data.value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-brand-500 to-brand-300 rounded-t-lg transition-all duration-500 hover:from-brand-600 hover:to-brand-400 cursor-pointer relative group"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-paper-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ¥{data.value * 300}
                      </div>
                    </div>
                    <span className="text-xs text-paper-500">{data.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-paper-200 flex items-center justify-around">
              <div className="text-center">
                <p className="text-2xl font-display font-semibold text-paper-900">7</p>
                <p className="text-xs text-paper-500">统计天数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-semibold text-brand-500">¥28,400</p>
                <p className="text-xs text-paper-500">总销售额</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-semibold text-forest-500">707</p>
                <p className="text-xs text-paper-500">订单总数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-semibold text-gold-500">¥4,057</p>
                <p className="text-xs text-paper-500">日均销售</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                热门产品
              </CardTitle>
              <Button variant="ghost" size="sm">
                更多
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-paper-100">
              {hotProducts.map((product) => (
                <div
                  key={product.rank}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-paper-50 transition-colors cursor-pointer"
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                      product.rank === 1
                        ? 'bg-gold-100 text-gold-700'
                        : product.rank === 2
                          ? 'bg-paper-200 text-paper-700'
                          : product.rank === 3
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-paper-100 text-paper-500'
                    )}
                  >
                    {product.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-paper-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-paper-500">
                      销量 {product.sales} 件
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-paper-900">{product.amount}</p>
                    <div className="flex items-center justify-end gap-1">
                      {product.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-forest-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-darkroom-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-500" />
              最近订单
            </CardTitle>
            <Button variant="ghost" size="sm">
              查看全部
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-paper-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-paper-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-paper-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-paper-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-paper-900">
                        {order.orderNo}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={order.items[0]?.previewImage}
                          alt=""
                          className="w-10 h-10 rounded object-cover bg-paper-100"
                        />
                        <span className="text-sm text-paper-900 truncate max-w-32">
                          {order.items.map((i) => i.productName).join('、')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-paper-900">
                        ¥{order.payableAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Tag
                        variant={
                          order.status === 'completed'
                            ? 'success'
                            : order.status === 'shipped'
                              ? 'gold'
                              : order.status === 'producing'
                                ? 'brand'
                                : 'default'
                        }
                        size="sm"
                      >
                        {order.statusText}
                      </Tag>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-paper-500">
                        {order.createdAt}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
