import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Clock,
  Hotel,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { cn, formatCurrency, formatDate, calculateNights } from '../../components/lib/utils';
import { hotelAdminApi } from '../../services/api';
import { BookingOrder, OrderStatus, Currency } from '@shared/types';

const BookingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadBookings();
  }, [activeTab, currentPage]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const hotelId = 'hotel-paris-001';
      let params: any = { page: currentPage, pageSize };
      
      if (activeTab !== 'all') {
        params.status = activeTab.toUpperCase();
      }

      try {
        const response = await hotelAdminApi.bookings.getAll(hotelId, params) as any;
        setBookings(response.items || []);
        setTotal(response.total || 0);
      } catch (error) {
        console.warn('Failed to load bookings, using mock data');
        const mockData = getMockBookings();
        setBookings(mockData);
        setTotal(mockData.length);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockBookings = (): BookingOrder[] => {
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
        specialRequests: '希望能安排高层艾菲尔铁塔景观的房间',
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
        cancellationDeadline: '2025-06-12T23:59:59Z',
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
      {
        id: 'booking-006',
        orderNumber: 'SG202506100006',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-001',
        roomTypeName: '豪华客房',
        ratePlanId: 'rate-room-paris-001-stayglobal',
        checkInDate: '2025-06-10',
        checkOutDate: '2025-06-12',
        nights: 2,
        guestCount: { adults: 2, children: 0, infants: 0 },
        guestInfo: [
          { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '+44 20 1234 5678' },
        ],
        pricing: {
          roomTotal: { amount: 1780, currency: Currency.EUR },
          taxes: { amount: { amount: 195.8, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 1975.8, currency: Currency.EUR },
        },
        status: OrderStatus.CANCELLED,
        channelCode: 'agoda',
        paymentStatus: 'refunded',
        createdAt: '2025-03-12T08:45:00Z',
        updatedAt: '2025-06-08T14:20:00Z',
      },
      {
        id: 'booking-007',
        orderNumber: 'SG202506190007',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-002',
        roomTypeName: '行政套房',
        ratePlanId: 'rate-room-paris-002-stayglobal',
        checkInDate: '2025-06-19',
        checkOutDate: '2025-06-21',
        nights: 2,
        guestCount: { adults: 2, children: 0, infants: 0 },
        guestInfo: [
          { firstName: '健', lastName: '林', email: 'linjian@example.com', phone: '+86 136 0000 0004' },
        ],
        pricing: {
          roomTotal: { amount: 3160, currency: Currency.EUR },
          taxes: { amount: { amount: 347.6, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 316, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 3191.6, currency: Currency.EUR },
        },
        status: OrderStatus.CONFIRMED,
        channelCode: 'stayglobal',
        paymentStatus: 'paid',
        confirmationNumber: 'SG-20250619-456789',
        createdAt: '2025-03-20T10:15:00Z',
        updatedAt: '2025-03-20T10:20:00Z',
      },
      {
        id: 'booking-008',
        orderNumber: 'SG202506170008',
        hotelId: 'hotel-paris-001',
        hotelName: 'Le Château Élysée',
        roomTypeId: 'room-paris-001',
        roomTypeName: '豪华客房',
        ratePlanId: 'rate-room-paris-001-stayglobal',
        checkInDate: '2025-06-17',
        checkOutDate: '2025-06-19',
        nights: 2,
        guestCount: { adults: 2, children: 0, infants: 0 },
        guestInfo: [
          { firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@example.com', phone: '+34 91 123 4567' },
        ],
        specialRequests: '需要安静的房间',
        pricing: {
          roomTotal: { amount: 1780, currency: Currency.EUR },
          taxes: { amount: { amount: 195.8, currency: Currency.EUR }, breakdown: [] },
          fees: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          discounts: { amount: { amount: 0, currency: Currency.EUR }, breakdown: [] },
          grandTotal: { amount: 1975.8, currency: Currency.EUR },
        },
        status: OrderStatus.PENDING_PAYMENT,
        channelCode: 'trip.com',
        paymentStatus: 'unpaid',
        createdAt: '2025-03-19T13:30:00Z',
        updatedAt: '2025-03-19T13:30:00Z',
      },
    ];
  };

  const tabs = [
    { id: 'all', label: '全部订单', status: 'all' },
    { id: 'PENDING_PAYMENT', label: '待确认', status: OrderStatus.PENDING_PAYMENT },
    { id: 'CONFIRMED', label: '已确认', status: OrderStatus.CONFIRMED },
    { id: 'CHECKED_IN', label: '已入住', status: OrderStatus.CHECKED_IN },
    { id: 'CHECKED_OUT', label: '已退房', status: OrderStatus.CHECKED_OUT },
    { id: 'CANCELLED', label: '已取消', status: OrderStatus.CANCELLED },
  ];

  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { label: string; variant: any; icon: any }> = {
      [OrderStatus.PENDING_PAYMENT]: { label: '待确认', variant: 'warning', icon: Clock },
      [OrderStatus.CONFIRMED]: { label: '已确认', variant: 'success', icon: CheckCircle },
      [OrderStatus.CANCELLED]: { label: '已取消', variant: 'danger', icon: XCircle },
      [OrderStatus.CHECKED_IN]: { label: '已入住', variant: 'primary', icon: LogIn },
      [OrderStatus.CHECKED_OUT]: { label: '已退房', variant: 'info', icon: LogOut },
      [OrderStatus.NO_SHOW]: { label: '未入住', variant: 'default', icon: XCircle },
    };
    return configs[status] || configs[OrderStatus.CONFIRMED];
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const guest = booking.guestInfo?.[0];
    const guestName = guest ? `${guest.lastName}${guest.firstName}`.toLowerCase() : '';
    return (
      booking.orderNumber?.toLowerCase().includes(query) ||
      guestName.includes(query) ||
      booking.roomTypeName?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  const handleCheckIn = async (bookingId: string) => {
    try {
      await hotelAdminApi.bookings.checkIn(bookingId);
      await loadBookings();
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      await hotelAdminApi.bookings.checkOut(bookingId);
      await loadBookings();
    } catch (error) {
      console.error('Failed to check out:', error);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('确定要取消此订单吗？')) return;
    try {
      await hotelAdminApi.bookings.updateStatus(bookingId, { status: OrderStatus.CANCELLED });
      await loadBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">订单管理</h1>
          <p className="text-graphite-500 mt-1">查看和管理酒店所有订单</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            导出订单
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-deep-blue text-white shadow-md'
                      : 'bg-cloud-50 text-graphite-600 hover:bg-cloud-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder="搜索订单号或客人姓名"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
              >
                筛选
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-cloud-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cloud-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">订单号</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">客人信息</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">房型</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">入住/退房</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">金额</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => {
                      const statusConfig = getStatusConfig(booking.status);
                      const StatusIcon = statusConfig.icon;
                      const guest = booking.guestInfo?.[0];
                      const nights = calculateNights(booking.checkInDate, booking.checkOutDate);

                      return (
                        <tr
                          key={booking.id}
                          className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-deep-blue">{booking.orderNumber}</p>
                              <p className="text-xs text-graphite-400">{booking.channelCode}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm text-graphite-900">
                                {guest ? `${guest.lastName}${guest.firstName}` : '未知客人'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-graphite-500">
                                <Users className="w-3 h-3" />
                                <span>
                                  {booking.guestCount?.adults || 0}成人
                                  {booking.guestCount?.children ? `, ${booking.guestCount.children}儿童` : ''}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <BedDouble className="w-4 h-4 text-deep-blue" />
                              <span className="text-sm text-graphite-700">{booking.roomTypeName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-graphite-700">{formatDate(booking.checkInDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-3.5 h-3.5 text-coral-orange" />
                                <span className="text-graphite-700">{formatDate(booking.checkOutDate)}</span>
                              </div>
                              <p className="text-xs text-graphite-400">共 {nights} 晚</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-semibold text-graphite-900">
                                {formatCurrency(
                                  booking.pricing?.grandTotal?.amount || 0,
                                  booking.pricing?.grandTotal?.currency || Currency.EUR
                                )}
                              </p>
                              <p className="text-xs text-graphite-400">
                                {booking.paymentStatus === 'paid' ? '已支付' : '未支付'}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={statusConfig.variant} size="sm" dot>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Eye className="w-4 h-4" />}
                              >
                                详情
                              </Button>
                              {booking.status === OrderStatus.CONFIRMED && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<LogIn className="w-4 h-4" />}
                                  onClick={() => handleCheckIn(booking.id)}
                                >
                                  入住
                                </Button>
                              )}
                              {booking.status === OrderStatus.CHECKED_IN && (
                                <Button
                                  variant="accent"
                                  size="sm"
                                  leftIcon={<LogOut className="w-4 h-4" />}
                                  onClick={() => handleCheckOut(booking.id)}
                                >
                                  退房
                                </Button>
                              )}
                              {(booking.status === OrderStatus.PENDING_PAYMENT || booking.status === OrderStatus.CONFIRMED) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleCancel(booking.id)}
                                >
                                  取消
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-cloud-100">
                <p className="text-sm text-graphite-500">
                  共 {total} 条订单，第 {currentPage} / {totalPages || 1} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                            currentPage === pageNum
                              ? 'bg-deep-blue text-white'
                              : 'text-graphite-600 hover:bg-cloud-100'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-cloud-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-graphite-400" />
              </div>
              <h3 className="text-lg font-medium text-graphite-900 mb-2">暂无订单</h3>
              <p className="text-sm text-graphite-500">
                {searchQuery ? '没有找到匹配的订单，请尝试其他搜索条件' : '当前没有订单数据'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
