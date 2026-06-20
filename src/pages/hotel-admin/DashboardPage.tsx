import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
  DollarSign,
  Percent,
  BedDouble,
  Clock,
  AlertCircle,
  Star,
  ChevronRight,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { cn, formatCurrency, formatDate } from '../../components/lib/utils';
import { hotelAdminApi, bookingApi } from '../../services/api';
import { BookingOrder, OrderStatus, Currency } from '@shared/types';

const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<BookingOrder[]>([]);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    occupancyRate: 0,
    avgPrice: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const hotelId = 'hotel-paris-001';
      
      try {
        const dashboardData = await hotelAdminApi.inventory.getDashboard(hotelId) as any;
        if (dashboardData) {
          setStats({
            todayOrders: dashboardData.todayOrders || 12,
            todayRevenue: dashboardData.todayRevenue || 8560,
            occupancyRate: dashboardData.occupancyRate || 78,
            avgPrice: dashboardData.avgPrice || 1280,
          });
        }
      } catch (error) {
        console.warn('Failed to load dashboard stats, using mock data');
        setStats({
          todayOrders: 12,
          todayRevenue: 8560,
          occupancyRate: 78,
          avgPrice: 1280,
        });
      }

      try {
        const bookingsData = await hotelAdminApi.bookings.getAll(hotelId, { page: 1, pageSize: 5 }) as any;
        setRecentBookings(bookingsData.items || []);
      } catch (error) {
        console.warn('Failed to load bookings, using mock data');
        setRecentBookings(getMockRecentBookings());
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockRecentBookings = (): BookingOrder[] => {
    return [
      {
        id: 'booking-001',
        orderNumber: 'SG202506150001',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-002',
        roomTypeName: '行政套房',
        ratePlanId: 'rate-room-paris-002-stayglobal',
        checkInDate: '2025-06-15',
        checkOutDate: '2025-06-20',
        nights: 5,
        guestCount: { adults: 2, children: 0, infants: 0 },
        guestInfo: [
          { firstName: '伟', lastName: '张', email: 'zhang.wei@example.com', phone: '+86 138 0000 0001' },
        ],
        pricing: {
          roomTotal: { amount: 7900, currency: Currency.EUR },
          taxes: { amount: { amount: 869, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 790, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 7979, currency: Currency.EUR },
        },
        status: OrderStatus.CONFIRMED,
        channelCode: 'stayglobal',
        paymentStatus: 'paid',
        confirmationNumber: 'SG-20250615-789456',
        createdAt: '2025-03-15T10:30:00Z',
        updatedAt: '2025-03-15T10:35:00Z',
      },
      {
        id: 'booking-002',
        orderNumber: 'SG202506160002',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-001',
        roomTypeName: '豪华客房',
        ratePlanId: 'rate-room-paris-001-stayglobal',
        checkInDate: '2025-06-16',
        checkOutDate: '2025-06-18',
        nights: 2,
        guestCount: { adults: 1, children: 0, infants: 0 },
        guestInfo: [
          { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@example.com', phone: '+1 212 555 0101' },
        ],
        pricing: {
          roomTotal: { amount: 1780, currency: Currency.EUR },
          taxes: { amount: { amount: 195.8, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 1975.8, currency: Currency.EUR },
        },
        status: OrderStatus.PENDING_PAYMENT,
        channelCode: 'booking.com',
        paymentStatus: 'unpaid',
        createdAt: '2025-03-16T09:15:00Z',
        updatedAt: '2025-03-16T09:15:00Z',
      },
      {
        id: 'booking-003',
        orderNumber: 'SG202506140003',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-001',
        roomTypeName: '豪华客房',
        ratePlanId: 'rate-room-paris-001-stayglobal',
        checkInDate: '2025-06-14',
        checkOutDate: '2025-06-17',
        nights: 3,
        guestCount: { adults: 2, children: 1, infants: 0 },
        guestInfo: [
          { firstName: '明', lastName: '李', email: 'liming@example.com', phone: '+86 139 0000 0002' },
        ],
        pricing: {
          roomTotal: { amount: 2670, currency: Currency.EUR },
          taxes: { amount: { amount: 293.7, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 267, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 2696.7, currency: Currency.EUR },
        },
        status: OrderStatus.CHECKED_IN,
        channelCode: 'stayglobal',
        paymentStatus: 'paid',
        confirmationNumber: 'SG-20250614-456123',
        createdAt: '2025-03-10T14:20:00Z',
        updatedAt: '2025-06-14T15:00:00Z',
      },
      {
        id: 'booking-004',
        orderNumber: 'SG202506130004',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-003',
        roomTypeName: '皇家套房',
        ratePlanId: 'rate-room-paris-003-stayglobal',
        checkInDate: '2025-06-13',
        checkOutDate: '2025-06-15',
        nights: 2,
        guestCount: { adults: 2, children: 0, infants: 0 },
        guestInfo: [
          { firstName: 'Alex', lastName: 'Chen', email: 'alex.chen@example.com', phone: '+852 9123 4567' },
        ],
        pricing: {
          roomTotal: { amount: 9000, currency: Currency.EUR },
          taxes: { amount: { amount: 990, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 9990, currency: Currency.EUR },
        },
        status: OrderStatus.CHECKED_OUT,
        channelCode: 'expedia',
        paymentStatus: 'paid',
        confirmationNumber: 'SG-20250613-789456',
        createdAt: '2025-03-05T11:45:00Z',
        updatedAt: '2025-06-15T12:00:00Z',
      },
      {
        id: 'booking-005',
        orderNumber: 'SG202506180005',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-002',
        roomTypeName: '行政套房',
        ratePlanId: 'rate-room-paris-002-stayglobal',
        checkInDate: '2025-06-18',
        checkOutDate: '2025-06-22',
        nights: 4,
        guestCount: { adults: 2, children: 0, infants: 0 },
        guestInfo: [
          { firstName: '美', lastName: '王', email: 'wangmei@example.com', phone: '+86 137 0000 0003' },
        ],
        specialRequests: '蜜月旅行，希望能有小惊喜',
        pricing: {
          roomTotal: { amount: 6320, currency: Currency.EUR },
          taxes: { amount: { amount: 695.2, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 632, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 6383.2, currency: Currency.EUR },
        },
        status: OrderStatus.CONFIRMED,
        channelCode: 'stayglobal',
        paymentStatus: 'paid',
        confirmationNumber: 'SG-20250618-123789',
        createdAt: '2025-03-18T16:30:00Z',
        updatedAt: '2025-03-18T16:35:00Z',
      },
    ];
  };

  const weeklyOccupancy = [
    { day: '周一', rate: 65 },
    { day: '周二', rate: 72 },
    { day: '周三', rate: 78 },
    { day: '周四', rate: 82 },
    { day: '周五', rate: 90 },
    { day: '周六', rate: 95 },
    { day: '周日', rate: 75 },
  ];

  const reminders = [
    { id: 1, type: 'pending_order', title: '3个待确认订单', icon: Clock, variant: 'warning' as const, count: 3 },
    { id: 2, type: 'pending_review', title: '12条待审核评价', icon: Star, variant: 'info' as const, count: 12 },
    { id: 3, type: 'low_inventory', title: '2个房型库存紧张', icon: AlertCircle, variant: 'danger' as const, count: 2 },
    { id: 4, type: 'guest_message', title: '5条客人消息', icon: MessageSquare, variant: 'primary' as const, count: 5 },
  ];

  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { label: string; variant: any }> = {
      [OrderStatus.PENDING_PAYMENT]: { label: '待支付', variant: 'warning' },
      [OrderStatus.CONFIRMED]: { label: '已确认', variant: 'success' },
      [OrderStatus.CANCELLED]: { label: '已取消', variant: 'danger' },
      [OrderStatus.CHECKED_IN]: { label: '已入住', variant: 'primary' },
      [OrderStatus.CHECKED_OUT]: { label: '已退房', variant: 'info' },
      [OrderStatus.NO_SHOW]: { label: '未入住', variant: 'default' },
    };
    return configs[status] || configs[OrderStatus.CONFIRMED];
  };

  const statCards = [
    {
      title: '今日订单数',
      value: stats.todayOrders,
      unit: '单',
      icon: CalendarDays,
      trend: '+12%',
      trendUp: true,
      color: 'text-deep-blue',
      bgColor: 'bg-deep-blue/10',
    },
    {
      title: '今日营收',
      value: formatCurrency(stats.todayRevenue, Currency.EUR),
      unit: '',
      icon: DollarSign,
      trend: '+8.5%',
      trendUp: true,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: '入住率',
      value: `${stats.occupancyRate}%`,
      unit: '',
      icon: Percent,
      trend: '+5.2%',
      trendUp: true,
      color: 'text-gold-foil',
      bgColor: 'bg-gold-foil/10',
    },
    {
      title: '平均房价',
      value: formatCurrency(stats.avgPrice, Currency.EUR),
      unit: '/晚',
      icon: BedDouble,
      trend: '-2.1%',
      trendUp: false,
      color: 'text-coral-orange',
      bgColor: 'bg-coral-orange/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">仪表盘</h1>
          <p className="text-graphite-500 mt-1">欢迎回来，查看今日酒店运营概况</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md" dot>
            营业中
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
            <CardTitle className="text-lg">本周入住趋势</CardTitle>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              查看详情
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {weeklyOccupancy.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-graphite-600">{item.rate}%</span>
                    <div className="w-full bg-cloud-100 rounded-t-lg overflow-hidden" style={{ height: `${item.rate}%` }}>
                      <div
                        className={cn(
                          'w-full rounded-t-lg transition-all duration-500',
                          item.rate >= 90 ? 'bg-emerald-500' :
                          item.rate >= 70 ? 'bg-deep-blue' :
                          'bg-gold-foil'
                        )}
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-graphite-500">{item.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-cloud-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-deep-blue" />
                <span className="text-xs text-graphite-600">入住率</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-graphite-400" />
                <span className="text-xs text-graphite-600">周平均: 79.6%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">待处理提醒</CardTitle>
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
                    <ChevronRight className="w-4 h-4 text-graphite-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">最近订单</CardTitle>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
            查看全部
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">客人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">房型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">入住日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const statusConfig = getStatusConfig(booking.status);
                  const guest = booking.guestInfo?.[0];
                  return (
                    <tr key={booking.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-deep-blue">{booking.orderNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-graphite-900">
                            {guest ? `${guest.lastName}${guest.firstName}` : '未知客人'}
                          </p>
                          <p className="text-xs text-graphite-500">{guest?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">{booking.roomTypeName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">
                          {formatDate(booking.checkInDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-graphite-900">
                          {formatCurrency(booking.pricing?.grandTotal?.amount || 0, booking.pricing?.grandTotal?.currency || Currency.EUR)}
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
