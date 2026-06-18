import { Link } from 'react-router-dom';
import {
  CheckCircle,
  CreditCard,
  Wrench,
  DoorOpen,
  MessageSquare,
  ShoppingBag,
  Gift,
  Bell,
  TrendingUp,
  Heart,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const quickActions = [
  { icon: CheckCircle, label: '签到', to: '/tasks', color: 'bg-green-100 text-green-600' },
  { icon: CreditCard, label: '缴费', to: '/property', color: 'bg-blue-100 text-blue-600' },
  { icon: Wrench, label: '报修', to: '/property', color: 'bg-orange-100 text-orange-600' },
  { icon: DoorOpen, label: '开门', to: '/property', color: 'bg-purple-100 text-purple-600' },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold">
          你好，{user?.nickname || '邻居'}
        </h2>
        <p className="mt-1 text-primary-100 text-sm">欢迎回到邻里数字社区</p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1" />
            <div className="text-lg font-bold">3,280</div>
            <div className="text-xs text-primary-100">今日步数</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1" />
            <div className="text-lg font-bold">12</div>
            <div className="text-xs text-primary-100">邻里互动</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Gift className="w-5 h-5 mx-auto mb-1" />
            <div className="text-lg font-bold">5</div>
            <div className="text-xs text-primary-100">优惠福利</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">邻里话题</h3>
          <Link to="/topics" className="text-sm text-primary-600 hover:underline">
            查看更多
          </Link>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  社区活动通知标题示例 {i}
                </h4>
                <p className="mt-1 text-xs text-gray-500 truncate">
                  话题内容预览文字，这里是话题的简要描述...
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {10 + i * 3}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {2 + i}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">邻里优选</h3>
          <Link to="/products" className="text-sm text-primary-600 hover:underline">
            查看更多
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <Link
              key={i}
              to={`/products/${i}`}
              className="flex-shrink-0 w-36 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-28 bg-gray-100" />
              <div className="p-2">
                <h4 className="text-xs font-medium text-gray-900 truncate">精选商品 {i}</h4>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-red-500">¥{(19.9 + i * 10).toFixed(0)}</span>
                  <span className="text-xs text-gray-400 line-through">¥{(49 + i * 10).toFixed(0)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">社区公告</h3>
          <Link to="/property" className="text-sm text-primary-600 hover:underline">
            查看更多
          </Link>
        </div>
        <div className="card space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Bell className="w-4 h-4 text-community-orange mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700">公告标题 {i}：关于社区设施维护的通知</p>
                <p className="text-xs text-gray-400 mt-0.5">2024-01-{10 + i}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
