import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Hotel,
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  Shield,
  Wallet,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { cn, formatCurrency, formatDate } from '../../components/lib/utils';
import { adminApi } from '../../services/api';
import { Currency, HotelStatus, ApplicationStatus } from '@shared/types';

interface HotelApplication {
  id: string;
  hotelName: string;
  city: string;
  starRating: number;
  contactPerson: string;
  submittedAt: string;
  status: ApplicationStatus;
}

const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHotels: 0,
    todayOrders: 0,
    todayGMV: 0,
    newUsers: 0,
  });
  const [recentApplications, setRecentApplications] = useState<HotelApplication[]>([]);
  const [pendingCounts, setPendingCounts] = useState({
    pendingHotels: 0,
    pendingGDPR: 0,
    pendingCommissions: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      try {
        const hotelsData = await adminApi.hotels.getAll() as any;
        if (hotelsData) {
          const allHotels = Array.isArray(hotelsData) ? hotelsData : (hotelsData.items || []);
          const pendingHotels = allHotels.filter((h: any) => 
            h.status === HotelStatus.PENDING_REVIEW || h.status === 'PENDING_REVIEW'
          ).length;
          setStats(prev => ({ ...prev, totalHotels: allHotels.length }));
          setPendingCounts(prev => ({ ...prev, pendingHotels }));
        }
      } catch (error) {
        console.warn('Failed to load hotels data, using mock data');
      }

      try {
        const commissionsData = await adminApi.commissions.getDashboard() as any;
        if (commissionsData) {
          setStats(prev => ({
            ...prev,
            todayOrders: commissionsData.todayOrders || 0,
            todayGMV: commissionsData.todayGMV || 0,
            newUsers: commissionsData.newUsers || 0,
          }));
          setPendingCounts(prev => ({
            ...prev,
            pendingCommissions: commissionsData.pendingSettlements || 0,
          }));
        }
      } catch (error) {
        console.warn('Failed to load commissions dashboard, using mock data');
      }

      try {
        const pendingHotels = await adminApi.hotels.getPending() as any;
        const apps = Array.isArray(pendingHotels) ? pendingHotels : (pendingHotels.items || []);
        setRecentApplications(apps.slice(0, 5).map((h: any) => ({
          id: h.id,
          hotelName: h.name || h.legalName,
          city: h.address?.city || '-',
          starRating: h.starRating || h.propertyDetails?.starRating || 0,
          contactPerson: h.contactPerson?.name || '-',
          submittedAt: h.submittedAt || h.createdAt,
          status: ApplicationStatus.UNDER_REVIEW,
        })));
      } catch (error) {
        console.warn('Failed to load pending hotels, using mock data');
        setRecentApplications(getMockRecentApplications());
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setStats({
        totalHotels: 156,
        todayOrders: 328,
        todayGMV: 456800,
        newUsers: 89,
      });
      setPendingCounts({
        pendingHotels: 12,
        pendingGDPR: 8,
        pendingCommissions: 5,
      });
      setRecentApplications(getMockRecentApplications());
      setIsLoading(false);
    }
  };

  const getMockRecentApplications = (): HotelApplication[] => {
    return [
      {
        id: 'app-001',
        hotelName: '巴黎塞纳河精品酒店',
        city: '巴黎',
        starRating: 4,
        contactPerson: 'Pierre Dubois',
        submittedAt: '2025-06-18T10:30:00Z',
        status: ApplicationStatus.UNDER_REVIEW,
      },
      {
        id: 'app-002',
        hotelName: '京都岚山温泉旅馆',
        city: '京都',
        starRating: 5,
        contactPerson: '山田太郎',
        submittedAt: '2025-06-17T14:20:00Z',
        status: ApplicationStatus.SUBMITTED,
      },
      {
        id: 'app-003',
        hotelName: '纽约时代广场万豪',
        city: '纽约',
        starRating: 4,
        contactPerson: 'John Smith',
        submittedAt: '2025-06-17T09:15:00Z',
        status: ApplicationStatus.UNDER_REVIEW,
      },
      {
        id: 'app-004',
        hotelName: '三亚亚龙湾海景度假酒店',
        city: '三亚',
        starRating: 5,
        contactPerson: '李明',
        submittedAt: '2025-06-16T16:45:00Z',
        status: ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
      },
      {
        id: 'app-005',
        hotelName: '伦敦白金汉精品酒店',
        city: '伦敦',
        starRating: 4,
        contactPerson: 'James Wilson',
        submittedAt: '2025-06-16T11:00:00Z',
        status: ApplicationStatus.SUBMITTED,
      },
    ];
  };

  const weeklyGMV = [
    { day: '周一', gmv: 320000 },
    { day: '周二', gmv: 380000 },
    { day: '周三', gmv: 420000 },
    { day: '周四', gmv: 390000 },
    { day: '周五', gmv: 520000 },
    { day: '周六', gmv: 580000 },
    { day: '周日', gmv: 450000 },
  ];

  const maxGMV = Math.max(...weeklyGMV.map(d => d.gmv));

  const statCards = [
    {
      title: '总酒店数',
      value: stats.totalHotels,
      unit: '家',
      icon: Hotel,
      trend: '+5.2%',
      trendUp: true,
      color: 'text-deep-blue',
      bgColor: 'bg-deep-blue/10',
    },
    {
      title: '今日订单数',
      value: stats.todayOrders,
      unit: '单',
      icon: ShoppingCart,
      trend: '+12.8%',
      trendUp: true,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: '今日GMV',
      value: formatCurrency(stats.todayGMV, Currency.CNY),
      unit: '',
      icon: DollarSign,
      trend: '+8.3%',
      trendUp: true,
      color: 'text-gold-foil',
      bgColor: 'bg-gold-foil/10',
    },
    {
      title: '新增用户数',
      value: stats.newUsers,
      unit: '人',
      icon: Users,
      trend: '-3.5%',
      trendUp: false,
      color: 'text-coral-orange',
      bgColor: 'bg-coral-orange/10',
    },
  ];

  const reminders = [
    { id: 1, type: 'pending_hotels', title: '待审核酒店', icon: Building2, variant: 'warning' as const, count: pendingCounts.pendingHotels, path: '/admin/hotel-review' },
    { id: 2, type: 'pending_gdpr', title: '待处理GDPR请求', icon: Shield, variant: 'info' as const, count: pendingCounts.pendingGDPR, path: '/admin/gdpr' },
    { id: 3, type: 'pending_commissions', title: '待结算佣金', icon: Wallet, variant: 'primary' as const, count: pendingCounts.pendingCommissions, path: '/admin/commissions' },
  ];

  const getStatusConfig = (status: ApplicationStatus) => {
    const configs: Record<ApplicationStatus, { label: string; variant: any }> = {
      [ApplicationStatus.DRAFT]: { label: '草稿', variant: 'default' },
      [ApplicationStatus.SUBMITTED]: { label: '已提交', variant: 'primary' },
      [ApplicationStatus.UNDER_REVIEW]: { label: '审核中', variant: 'warning' },
      [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: { label: '需补充信息', variant: 'accent' },
      [ApplicationStatus.APPROVED]: { label: '已通过', variant: 'success' },
      [ApplicationStatus.REJECTED]: { label: '已拒绝', variant: 'danger' },
    };
    return configs[status] || configs[ApplicationStatus.SUBMITTED];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={cn(
              'w-3.5 h-3.5',
              i < rating ? 'text-gold-foil fill-gold-foil' : 'text-cloud-300 fill-cloud-300'
            )}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">仪表盘</h1>
          <p className="text-graphite-500 mt-1">欢迎回来，查看平台运营概况</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md" dot>
            运营正常
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} hoverable>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-graphite-500 mb-1">{card.title}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-display font-bold text-graphite-900">
                        {card.value}
                      </span>
                      {card.unit && (
                        <span className="text-sm text-graphite-500">{card.unit}</span>
                      )}
                    </div>
                  </div>
                  <div className={cn('p-3 rounded-xl', card.bgColor)}>
                    <Icon className={cn('w-6 h-6', card.color)} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  {card.trendUp ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    card.trendUp ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {card.trend}
                  </span>
                  <span className="text-xs text-graphite-400">较昨日</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">本周GMV趋势</CardTitle>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              查看详情
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {weeklyGMV.map((item, index) => {
                const heightPercent = (item.gmv / maxGMV) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-graphite-600">
                        ¥{(item.gmv / 10000).toFixed(0)}万
                      </span>
                      <div className="w-full bg-cloud-100 rounded-t-lg overflow-hidden" style={{ height: '160px' }}>
                        <div
                          className="w-full bg-gradient-to-t from-deep-blue to-deep-blue-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${heightPercent}%`, marginTop: 'auto' }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-graphite-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-cloud-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-deep-blue" />
                <span className="text-xs text-graphite-600">GMV</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-graphite-400" />
                <span className="text-xs text-graphite-600">周总计: ¥306万</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600">周环比: +12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">待处理事项</CardTitle>
            <Badge variant="accent" size="sm">
              {reminders.reduce((sum, r) => sum + r.count, 0)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const Icon = reminder.icon;
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-cloud-50 rounded-xl hover:bg-cloud-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        reminder.variant === 'warning' && 'bg-amber-100 text-amber-600',
                        reminder.variant === 'info' && 'bg-sky-100 text-sky-600',
                        reminder.variant === 'danger' && 'bg-red-100 text-red-600',
                        reminder.variant === 'primary' && 'bg-deep-blue/10 text-deep-blue',
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-graphite-700">{reminder.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={reminder.variant === 'warning' ? 'warning' : reminder.variant === 'info' ? 'info' : 'primary'} size="sm">
                        {reminder.count}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-graphite-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">最近酒店入驻申请</CardTitle>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            查看全部
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">酒店名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">城市</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">星级</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">联系人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">申请日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => {
                  const statusConfig = getStatusConfig(app.status);
                  return (
                    <tr key={app.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-graphite-900">{app.hotelName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">{app.city}</span>
                      </td>
                      <td className="py-3 px-4">
                        {renderStars(app.starRating)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">{app.contactPerson}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">
                          {formatDate(app.submittedAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
