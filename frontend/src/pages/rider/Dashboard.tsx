import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  Package,
  Wallet,
  Star,
  Trophy,
  ChevronRight,
  MapPin,
  Navigation,
  ClipboardList,
  TrendingUp,
  Settings as SettingsIcon,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { riderApi, type RiderDashboard } from '../../services/rider.api';
import { RIDER_LEVELS, ORDER_CATEGORIES } from '../../constants';
import type { OrderCategory } from '../../types';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  return `${h}小时${m > 0 ? m + '分钟' : ''}`;
}

function getCategoryInfo(category: OrderCategory) {
  return ORDER_CATEGORIES.find((c) => c.key === category) || ORDER_CATEGORIES[0];
}

export default function RiderDashboard() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [dashboard, setDashboard] = useState<RiderDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const data = await riderApi.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleOnline() {
    try {
      await riderApi.toggleOnline(!isOnline);
      setIsOnline(!isOnline);
    } catch (error) {
      console.error('Failed to toggle online:', error);
    }
  }

  const currentLevel =
    RIDER_LEVELS.find((l) => l.level === (dashboard?.level || 1)) || RIDER_LEVELS[0];
  const nextLevel = RIDER_LEVELS.find((l) => l.level === (dashboard?.level || 1) + 1);
  const progress = nextLevel
    ? Math.min(
        100,
        ((dashboard?.totalOrders || 0) / nextLevel.minOrders) * 100
      )
    : 100;

  const quickActions = [
    {
      icon: MapPin,
      label: '抢单大厅',
      color: 'bg-accent-100 text-accent-600',
      onClick: () => navigate('/rider/hall'),
    },
    {
      icon: ClipboardList,
      label: '我的任务',
      color: 'bg-brand-100 text-brand-600',
      onClick: () => navigate('/rider/tasks'),
    },
    {
      icon: TrendingUp,
      label: '收入明细',
      color: 'bg-green-100 text-green-600',
      onClick: () => navigate('/rider/earnings'),
    },
    {
      icon: Wallet,
      label: '提现',
      color: 'bg-purple-100 text-purple-600',
      onClick: () => navigate('/rider/earnings'),
    },
    {
      icon: Trophy,
      label: '成长中心',
      color: 'bg-orange-100 text-orange-600',
      onClick: () => navigate('/rider/growth'),
    },
    {
      icon: SettingsIcon,
      label: '设置',
      color: 'bg-gray-100 text-gray-600',
      onClick: () => navigate('/rider/settings'),
    },
  ];

  const weeklyStats = dashboard?.weeklyStats || [
    { date: '周一', orders: 12, earnings: 180 },
    { date: '周二', orders: 15, earnings: 225 },
    { date: '周三', orders: 10, earnings: 150 },
    { date: '周四', orders: 18, earnings: 270 },
    { date: '周五', orders: 20, earnings: 300 },
    { date: '周六', orders: 25, earnings: 375 },
    { date: '周日', orders: 8, earnings: 120 },
  ];

  if (loading && !dashboard) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">今日</div>
          <div className="text-lg font-bold text-gray-900">
            {new Date().toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </div>
        <button
          onClick={handleToggleOnline}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-base transition-all
            ${
              isOnline
                ? 'bg-gradient-to-r from-accent-400 to-accent-500 text-white shadow-lg shadow-accent-500/30'
                : 'bg-gray-100 text-gray-500'
            }
          `}
        >
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5" />
              接单中
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              已休息
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center !p-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-brand-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboard?.todayOrders || 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">今日单量</div>
        </Card>
        <Card className="text-center !p-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-accent-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-accent-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{dashboard?.todayEarnings?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">今日收入</div>
        </Card>
        <Card className="text-center !p-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(dashboard?.rating || 5).toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">好评率</div>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-brand-500 to-brand-600 !border-none text-white overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-lg">{currentLevel.name}</div>
                <div className="text-xs text-white/70">
                  Lv.{dashboard?.level || 1}
                </div>
              </div>
            </div>
          </div>
          {nextLevel && (
            <button
              onClick={() => navigate('/rider/growth')}
              className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
            >
              等级权益
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {nextLevel && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/70">
                距 {nextLevel.name} 还需{' '}
                <span className="font-bold text-white">
                  {Math.max(0, nextLevel.minOrders - (dashboard?.totalOrders || 0))}
                </span>{' '}
                单
              </span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
          {currentLevel.benefits.slice(0, 3).map((b, i) => (
            <div
              key={i}
              className="text-xs text-white/80 flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-accent-400" />
              {b}
            </div>
          ))}
        </div>
      </Card>

      {dashboard?.currentOrder && (
        <Card
          className="!p-0 overflow-hidden cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/rider/tasks')}
        >
          <div className="bg-gradient-to-r from-accent-400 to-accent-500 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Navigation className="w-5 h-5" />
              进行中订单
            </div>
            <Tag color="yellow" size="sm" className="bg-white/20 text-white border-white/30">
              {getCategoryInfo(dashboard.currentOrder.category as OrderCategory).name}
            </Tag>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm text-gray-500">剩余距离</div>
                  <div className="font-bold text-gray-900">
                    {(dashboard.currentOrder.distance / 1000).toFixed(1)}km
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <div className="text-sm text-gray-500">预计时间</div>
                  <div className="font-bold text-gray-900">
                    ~{Math.ceil(dashboard.currentOrder.duration / 60)}分钟
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">收入</div>
                <div className="text-xl font-bold text-accent-600">
                  ¥{dashboard.currentOrder.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 line-clamp-1">
                  {dashboard.currentOrder.pickupAddress}
                </div>
              </div>
              <div className="w-0.5 h-4 bg-gray-200 ml-0.75" />
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 line-clamp-1">
                  {dashboard.currentOrder.deliveryAddress}
                </div>
              </div>
            </div>
            <button className="w-full mt-2 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              查看详情
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      <Card>
        <div className="text-base font-bold text-gray-900 mb-3">快捷入口</div>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors active:scale-95"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-bold text-gray-900">今日工作统计</div>
          <button
            onClick={() => navigate('/rider/earnings')}
            className="text-xs text-brand-600 flex items-center gap-0.5"
          >
            查看详情
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Clock className="w-5 h-5 mx-auto mb-1 text-brand-500" />
            <div className="text-lg font-bold text-gray-900">
              {formatDuration(dashboard?.onlineMinutes || 0)}
            </div>
            <div className="text-xs text-gray-500">在线时长</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Package className="w-5 h-5 mx-auto mb-1 text-accent-500" />
            <div className="text-lg font-bold text-gray-900">
              {dashboard?.todayOrders || 0}
            </div>
            <div className="text-xs text-gray-500">完成单量</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Wallet className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold text-gray-900">
              ¥{dashboard?.todayEarnings?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500">总收入</div>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`¥${value}`, '收入']}
              />
              <Bar
                dataKey="earnings"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFC107" />
                  <stop offset="100%" stopColor="#FFA000" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
