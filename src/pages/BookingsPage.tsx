import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ChevronRight, Download, Share2, XCircle, CheckCircle, AlertCircle, CreditCard, Hotel, Filter, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { bookingApi } from '../services/api';
import { useAuthStore, selectIsAuthenticated, selectUser } from '../store/authStore';
import { cn, formatCurrency, formatDate, calculateNights } from '../components/lib/utils';
import { BookingOrder, OrderStatus, Currency } from '@shared/types';

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/bookings' } });
      return;
    }
    loadBookings();
  }, [isAuthenticated, activeTab]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      let params: any = { page: 1, pageSize: 20 };
      if (activeTab !== 'all') {
        params.status = activeTab.toUpperCase();
      }
      const response = await bookingApi.getMyBookings(params) as any;
      setBookings(response.items || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { label: string; variant: any; icon: any }> = {
      [OrderStatus.PENDING_PAYMENT]: { label: '待支付', variant: 'warning', icon: Clock },
      [OrderStatus.CONFIRMED]: { label: '已确认', variant: 'success', icon: CheckCircle },
      [OrderStatus.PAID]: { label: '已支付', variant: 'success', icon: CreditCard },
      [OrderStatus.CANCELLED]: { label: '已取消', variant: 'danger', icon: XCircle },
      [OrderStatus.CHECKED_IN]: { label: '已入住', variant: 'primary', icon: Hotel },
      [OrderStatus.CHECKED_OUT]: { label: '已退房', variant: 'info', icon: CheckCircle },
      [OrderStatus.REFUNDED]: { label: '已退款', variant: 'info', icon: CreditCard },
      [OrderStatus.EXPIRED]: { label: '已过期', variant: 'default', icon: AlertCircle },
    };
    return configs[status] || configs[OrderStatus.CONFIRMED];
  };

  const tabs = [
    { id: 'all', label: '全部订单', count: bookings.length },
    { id: 'confirmed', label: '待出行', count: bookings.filter(b => b.status === OrderStatus.CONFIRMED || b.status === OrderStatus.PAID).length },
    { id: 'pending_payment', label: '待支付', count: bookings.filter(b => b.status === OrderStatus.PENDING_PAYMENT).length },
    { id: 'cancelled', label: '已取消', count: bookings.filter(b => b.status === OrderStatus.CANCELLED).length },
    { id: 'completed', label: '已完成', count: bookings.filter(b => b.status === OrderStatus.CHECKED_OUT).length },
  ];

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.hotelName?.toLowerCase().includes(query) ||
      booking.id.toLowerCase().includes(query) ||
      booking.roomTypeName?.toLowerCase().includes(query)
    );
  });

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('确定要取消此预订吗？')) return;
    
    try {
      await bookingApi.cancel(bookingId);
      await loadBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-deep-blue to-deep-blue-light text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              我的订单
            </h1>
            <p className="text-cloud-200">
              管理您的所有预订，查看行程详情，管理出行计划
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                    activeTab === tab.id
                      ? 'bg-deep-blue text-white shadow-lg'
                      : 'bg-white text-graphite-600 hover:bg-cloud-100 border border-cloud-200'
                  )}
                >
                  {tab.label}
                  <Badge variant={activeTab === tab.id ? 'accent' : 'default'} size="sm">
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索酒店名称或订单号"
                  className="input-field pl-10"
                />
                <Search className="w-5 h-5 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
              >
                筛选
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Skeleton variant="rectangular" className="w-full md:w-48 h-32 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <SkeletonText lines={2} />
                        <div className="flex gap-4">
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={100} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-6">
              {filteredBookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;
                const nights = booking.checkIn && booking.checkOut 
                  ? calculateNights(booking.checkIn, booking.checkOut) 
                  : 0;

                return (
                  <Card key={booking.id} className="overflow-hidden card-hover">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-64 h-48 md:h-auto relative">
                          <img
                            src={booking.hotelThumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
                            alt={booking.hotelName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge variant={statusConfig.variant} size="sm" dot>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-display font-bold text-graphite-900 mb-1">
                                {booking.hotelName || '酒店名称'}
                              </h3>
                              <p className="text-graphite-500 text-sm mb-4">
                                订单号: {booking.id}
                              </p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-graphite-500 mb-1">入住日期</p>
                                  <p className="font-medium text-graphite-900 flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-deep-blue" />
                                    {formatDate(booking.checkIn)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-graphite-500 mb-1">退房日期</p>
                                  <p className="font-medium text-graphite-900 flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-deep-blue" />
                                    {formatDate(booking.checkOut)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-graphite-500 mb-1">入住时长</p>
                                  <p className="font-medium text-graphite-900">
                                    {nights} 晚
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-graphite-500 mb-1">房型</p>
                                  <p className="font-medium text-graphite-900 flex items-center gap-1">
                                    <Users className="w-4 h-4 text-deep-blue" />
                                    {booking.roomTypeName || '豪华客房'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="primary" size="sm">
                                  {booking.channel || 'StayGlobal'}
                                </Badge>
                                {booking.ratePlan?.includesBreakfast && (
                                  <Badge variant="info" size="sm">含早餐</Badge>
                                )}
                                {booking.ratePlan?.isRefundable && (
                                  <Badge variant="success" size="sm">免费取消</Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-graphite-500 mb-1">订单总价</p>
                              <p className="text-2xl font-display font-bold text-coral-orange">
                                {formatCurrency(
                                  booking.totalAmount?.amount || 0,
                                  booking.totalAmount?.currency || Currency.CNY
                                )}
                              </p>
                              <p className="text-xs text-graphite-500">含税费及服务费</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-6 border-t border-cloud-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Download className="w-4 h-4" />}
                            >
                              下载确认单
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Share2 className="w-4 h-4" />}
                            >
                              分享行程
                            </Button>
                            {booking.status === OrderStatus.PENDING_PAYMENT && (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<CreditCard className="w-4 h-4" />}
                                onClick={() => bookingApi.pay(booking.id)}
                              >
                                立即支付
                              </Button>
                            )}
                            {(booking.status === OrderStatus.CONFIRMED || booking.status === OrderStatus.PAID) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                取消预订
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              rightIcon={<ChevronRight className="w-4 h-4" />}
                              onClick={() => navigate(`/bookings/${booking.id}`)}
                            >
                              查看详情
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-cloud-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-graphite-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-graphite-900 mb-2">
                暂无订单
              </h3>
              <p className="text-graphite-500 mb-8 max-w-md mx-auto">
                {searchQuery ? '没有找到匹配的订单，请尝试其他搜索条件' : '您还没有任何预订，立即开启您的旅程吧！'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="primary" size="lg" onClick={() => navigate('/search')}>
                  搜索酒店
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/itineraries')}>
                  查看行程
                </Button>
              </div>
            </div>
          )}
        </div>
    </>
  );
};

export default BookingsPage;
