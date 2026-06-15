import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  FileCheck,
  ArrowRight,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { api } from '../../utils/api';
import { cn } from '../../lib/utils';

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  totalOrders: number;
  completedOrders: number;
  totalCreators: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingReviews: number;
  pendingSettlements: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  badge?: string;
}

function StatCard({ title, value, icon: Icon, color, trend, subtitle, badge }: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-zinc-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-zinc-600 text-xs mt-1">{subtitle}</p>}
          {badge && (
            <span className="inline-flex mt-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
              {badge}
            </span>
          )}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              <TrendingUp
                className={cn(
                  'w-4 h-4',
                  !trend.isPositive && 'rotate-180'
                )}
              />
              <span>{trend.value}% 较上周</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            color
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  badge?: string;
  badgeColor?: string;
}

function QuickAction({ title, description, icon: Icon, onClick, badge, badgeColor }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left hover:border-primary-500/50 hover:bg-zinc-900/80 transition-all duration-300 group w-full"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{title}</h3>
            {badge && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full', badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response: any = await api.admin.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary-600/20 to-accent-600/20 border border-primary-500/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">欢迎回来，管理员 👋</h2>
            <p className="text-zinc-400">
              以下是平台的最新数据概览，祝您工作愉快！
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg text-zinc-400">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="总课程数"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          color="bg-blue-500/20 text-blue-400"
          subtitle={`已发布 ${stats?.publishedCourses || 0}`}
        />
        <StatCard
          title="总订单数"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="bg-purple-500/20 text-purple-400"
          subtitle={`已完成 ${stats?.completedOrders || 0}`}
        />
        <StatCard
          title="总创作者"
          value={stats?.totalCreators || 0}
          icon={Users}
          color="bg-green-500/20 text-green-400"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="总收入"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          color="bg-yellow-500/20 text-yellow-400"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="今日收入"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={TrendingUp}
          color="bg-emerald-500/20 text-emerald-400"
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="待审核"
          value={stats?.pendingReviews || 0}
          icon={AlertCircle}
          color="bg-red-500/20 text-red-400"
          badge={stats?.pendingReviews && stats.pendingReviews > 0 ? '待处理' : ''}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">快捷入口</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="审核中心"
            description="处理待审核的课程、视频、用户资料等内容"
            icon={FileCheck}
            onClick={() => navigate('/admin/review')}
            badge={stats?.pendingReviews && stats.pendingReviews > 0 ? `${stats.pendingReviews} 条待审` : undefined}
            badgeColor="bg-red-500/20 text-red-400"
          />
          <QuickAction
            title="订单管理"
            description="查看和管理所有订单，处理争议订单"
            icon={ShoppingCart}
            onClick={() => navigate('/admin/orders')}
          />
          <QuickAction
            title="财务分账"
            description="查看平台收入、交易记录和待结算金额"
            icon={Wallet}
            onClick={() => navigate('/admin/finance')}
          />
        </div>
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">待结算概览</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-zinc-500 text-sm">待结算金额</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(stats?.pendingSettlements || 0)}
              </p>
              <p className="text-zinc-600 text-sm mt-1">
                预计将在 3 个工作日内完成结算
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">平台健康度</h3>
          <div className="space-y-4">
            {[
              { label: '课程审核通过率', value: 85, color: 'bg-green-500' },
              { label: '订单完成率', value: 92, color: 'bg-blue-500' },
              { label: '用户满意度', value: 4.8, color: 'bg-yellow-500', isStars: true },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">{item.label}</span>
                  <span className="text-white font-medium">
                    {item.isStars ? `${item.value} 分` : `${item.value}%`}
                  </span>
                </div>
                {!item.isStars && (
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000', item.color)}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
