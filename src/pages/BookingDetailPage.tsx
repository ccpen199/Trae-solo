import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  Download,
  Share2,
  XCircle,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Hotel,
  Phone,
  Mail,
  FileText,
  Shield,
  Info,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { bookingApi, itineraryApi } from '../services/api';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import {
  cn,
  formatCurrency,
  formatDate,
  calculateNights,
} from '../components/lib/utils';
import { BookingOrder, OrderStatus, Currency, Hotel as HotelType } from '@shared/types';
import { getHotelById } from '@shared/mock';

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [booking, setBooking] = useState<BookingOrder | null>(null);
  const [hotel, setHotel] = useState<HotelType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddToItineraryModal, setShowAddToItineraryModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<string>('');
  const [newItineraryName, setNewItineraryName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/bookings/${id}` } });
      return;
    }
    if (id) {
      loadBooking(id);
      loadItineraries();
    }
  }, [isAuthenticated, id]);

  const loadBooking = async (bookingId: string) => {
    setIsLoading(true);
    try {
      const data = await bookingApi.getById(bookingId);
      setBooking(data as BookingOrder);
      const hotelData = getHotelById((data as BookingOrder).hotelId);
      setHotel(hotelData || null);
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItineraries = async () => {
    try {
      const data = await itineraryApi.getMyItineraries();
      setItineraries(data as any[]);
    } catch (error) {
      console.error('Failed to load itineraries:', error);
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<
      OrderStatus,
      { label: string; variant: any; icon: any; description: string }
    > = {
      [OrderStatus.PENDING_PAYMENT]: {
        label: '待支付',
        variant: 'warning',
        icon: Clock,
        description: '请在规定时间内完成支付，订单将自动保留',
      },
      [OrderStatus.CONFIRMED]: {
        label: '已确认',
        variant: 'success',
        icon: CheckCircle,
        description: '预订已确认，酒店已为您保留房间',
      },
      [OrderStatus.CANCELLED]: {
        label: '已取消',
        variant: 'danger',
        icon: XCircle,
        description: '此预订已取消',
      },
      [OrderStatus.CHECKED_IN]: {
        label: '已入住',
        variant: 'primary',
        icon: Hotel,
        description: '您已入住酒店，祝您入住愉快',
      },
      [OrderStatus.CHECKED_OUT]: {
        label: '已退房',
        variant: 'info',
        icon: CheckCircle,
        description: '您已完成此次入住，期待再次光临',
      },
      [OrderStatus.NO_SHOW]: {
        label: '未入住',
        variant: 'default',
        icon: AlertCircle,
        description: '未按预订时间入住',
      },
    };
    return (
      configs[status] || {
        label: '未知状态',
        variant: 'default',
        icon: Info,
        description: '',
      }
    );
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      await bookingApi.cancel(booking.id, cancelReason);
      setShowCancelModal(false);
      await loadBooking(booking.id);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAddToItinerary = async () => {
    if (!booking) return;
    try {
      if (newItineraryName) {
        const newItinerary = await itineraryApi.create({
          name: newItineraryName,
          bookings: [booking.id],
        });
        console.log('Created new itinerary:', newItinerary);
      } else if (selectedItinerary) {
        await itineraryApi.addBooking(selectedItinerary, booking.id);
      }
      setShowAddToItineraryModal(false);
      setNewItineraryName('');
      setSelectedItinerary('');
    } catch (error) {
      console.error('Failed to add to itinerary:', error);
    }
  };

  const handleDownloadVoucher = () => {
    if (!booking) return;
    const content = `
预订确认单
========================================
订单号: ${booking.orderNumber}
确认号: ${booking.confirmationNumber || 'N/A'}
预订状态: ${getStatusConfig(booking.status).label}

酒店信息
----------------------------------------
酒店名称: ${booking.hotelName}
房型: ${booking.roomTypeName}

入住信息
----------------------------------------
入住日期: ${formatDate(booking.checkInDate)}
退房日期: ${formatDate(booking.checkOutDate)}
入住晚数: ${booking.nights} 晚
入住人数: ${booking.guestCount.adults} 成人 ${booking.guestCount.children || 0} 儿童

入住人信息
----------------------------------------
${booking.guestInfo.map((g, i) => `${i + 1}. ${g.lastName}${g.firstName} | ${g.email} | ${g.phone}`).join('\n')}

价格明细
----------------------------------------
房费总价: ${formatCurrency(booking.pricing.roomTotal.amount, booking.pricing.roomTotal.currency)}
税费: ${formatCurrency(booking.pricing.taxes.amount.amount, booking.pricing.taxes.amount.currency)}
费用: ${formatCurrency(booking.pricing.fees.amount.amount, booking.pricing.fees.amount.currency)}
优惠: -${formatCurrency(booking.pricing.discounts.amount.amount, booking.pricing.discounts.amount.currency)}
========================================
订单总价: ${formatCurrency(booking.pricing.grandTotal.amount, booking.pricing.grandTotal.currency)}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `确认单_${booking.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareBooking = () => {
    if (!booking) return;
    const shareData = {
      title: `${booking.hotelName} - 预订确认`,
      text: `我已预订 ${booking.hotelName} ${booking.roomTypeName}，${formatDate(booking.checkInDate)} 至 ${formatDate(booking.checkOutDate)}，共 ${booking.nights} 晚。`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      handleCopyToClipboard(window.location.href, 'share');
    }
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud-50">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/bookings')}>
              <ChevronLeft className="w-5 h-5 mr-1" />
              返回订单列表
            </Button>
            <Skeleton variant="text" width={200} height={32} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton variant="rectangular" className="w-full h-64 rounded-xl mb-6" />
                  <SkeletonText lines={4} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <SkeletonText lines={8} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-graphite-300 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-graphite-900 mb-2">
              订单不存在
            </h2>
            <p className="text-graphite-500 mb-6">
              您访问的订单可能已被删除或不存在
            </p>
            <Button onClick={() => navigate('/bookings')}>返回订单列表</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const nights = calculateNights(booking.checkInDate, booking.checkOutDate);

  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />

      <main className="flex-1">
        <div className="bg-gradient-to-r from-deep-blue to-deep-blue-light text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => navigate('/bookings')}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                返回订单列表
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-display font-bold">
                    {booking.hotelName}
                  </h1>
                  <Badge variant={statusConfig.variant} size="md" dot>
                    <StatusIcon className="w-3.5 h-3.5 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-cloud-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {hotel?.address.city}, {hotel?.address.country}
                </p>
                <p className="text-cloud-300 text-sm mt-1">
                  {statusConfig.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-cloud-200 mb-1">订单总价</p>
                <p className="text-3xl font-display font-bold">
                  {formatCurrency(
                    booking.pricing.grandTotal.amount,
                    booking.pricing.grandTotal.currency
                  )}
                </p>
                <p className="text-cloud-300 text-sm">含税费及服务费</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {hotel && (
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-5 gap-1 h-48">
                    <div className="col-span-3 relative">
                      <img
                        src={hotel.thumbnail}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {hotel.images.slice(0, 4).map((img, i) => (
                      <div key={i} className="relative">
                        <img
                          src={img}
                          alt={`${hotel.name} ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-deep-blue" />
                    入住信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-graphite-500 mb-1">入住日期</p>
                      <p className="font-semibold text-graphite-900">
                        {formatDate(booking.checkInDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-graphite-500 mb-1">退房日期</p>
                      <p className="font-semibold text-graphite-900">
                        {formatDate(booking.checkOutDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-graphite-500 mb-1">入住晚数</p>
                      <p className="font-semibold text-graphite-900">
                        {nights} 晚
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-graphite-500 mb-1">入住人数</p>
                      <p className="font-semibold text-graphite-900 flex items-center gap-1">
                        <Users className="w-4 h-4 text-deep-blue" />
                        {booking.guestCount.adults} 成人
                        {booking.guestCount.children > 0 &&
                          ` ${booking.guestCount.children} 儿童`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-cloud-200">
                    <p className="text-sm text-graphite-500 mb-2">房型</p>
                    <p className="text-lg font-semibold text-graphite-900">
                      {booking.roomTypeName}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="primary">
                        {booking.channelCode || 'StayGlobal'}
                      </Badge>
                      {booking.pricing.discounts.breakdown.length > 0 && (
                        <Badge variant="accent">
                          已优惠{' '}
                          {formatCurrency(
                            booking.pricing.discounts.amount.amount,
                            booking.pricing.discounts.amount.currency
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-deep-blue" />
                    入住人信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {booking.guestInfo.map((guest, index) => (
                    <div
                      key={index}
                      className="p-4 bg-cloud-50 rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-graphite-900">
                            {guest.lastName} {guest.firstName}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-graphite-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {guest.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {guest.phone}
                            </span>
                          </div>
                          {guest.specialRequests && (
                            <p className="mt-2 text-sm text-graphite-500">
                              备注: {guest.specialRequests}
                            </p>
                          )}
                        </div>
                        <Badge variant="default">入住人 {index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {booking.specialRequests && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-deep-blue" />
                      特殊要求
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-graphite-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                      {booking.specialRequests}
                    </p>
                    <p className="text-xs text-graphite-500 mt-2">
                      * 特殊请求将尽量安排，但需视酒店供应情况而定
                    </p>
                  </CardContent>
                </Card>
              )}

              {booking.confirmationNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-deep-blue" />
                      预订确认信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-deep-blue/5 rounded-xl">
                        <p className="text-sm text-graphite-500 mb-1">订单号</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold text-graphite-900">
                            {booking.orderNumber}
                          </p>
                          <button
                            onClick={() =>
                              handleCopyToClipboard(booking.orderNumber!, 'order')
                            }
                            className="text-deep-blue hover:text-deep-blue-light transition-colors"
                          >
                            {copiedField === 'order' ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-deep-blue/5 rounded-xl">
                        <p className="text-sm text-graphite-500 mb-1">酒店确认号</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold text-graphite-900">
                            {booking.confirmationNumber}
                          </p>
                          <button
                            onClick={() =>
                              handleCopyToClipboard(
                                booking.confirmationNumber!,
                                'confirm'
                              )
                            }
                            className="text-deep-blue hover:text-deep-blue-light transition-colors"
                          >
                            {copiedField === 'confirm' ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-graphite-500 mt-4">
                      * 办理入住时请出示此确认号及有效身份证件
                    </p>
                  </CardContent>
                </Card>
              )}

              {hotel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hotel className="w-5 h-5 text-deep-blue" />
                      酒店政策
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-graphite-500 mb-1">入住时间</p>
                        <p className="font-medium text-graphite-900">
                          {hotel.policies.checkInTime} 后
                        </p>
                      </div>
                      <div>
                        <p className="text-graphite-500 mb-1">退房时间</p>
                        <p className="font-medium text-graphite-900">
                          {hotel.policies.checkOutTime} 前
                        </p>
                      </div>
                      <div>
                        <p className="text-graphite-500 mb-1">取消政策</p>
                        <p className="font-medium text-graphite-900">
                          {booking.cancellationDeadline
                            ? `在 ${formatDate(booking.cancellationDeadline)} 前可免费取消`
                            : '视预订条款而定'}
                        </p>
                      </div>
                      <div>
                        <p className="text-graphite-500 mb-1">支付方式</p>
                        <p className="font-medium text-graphite-900">
                          {hotel.policies.paymentMethods.join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">价格明细</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-graphite-600">
                        房费 ({booking.nights} 晚)
                      </span>
                      <span className="font-medium text-graphite-900">
                        {formatCurrency(
                          booking.pricing.roomTotal.amount,
                          booking.pricing.roomTotal.currency
                        )}
                      </span>
                    </div>

                    {booking.pricing.taxes.breakdown.length > 0 && (
                      <div className="border-t border-cloud-200 pt-2 mt-2">
                        <p className="text-sm text-graphite-500 mb-1">税费</p>
                        {booking.pricing.taxes.breakdown.map((tax, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-graphite-500">{tax.name}</span>
                            <span className="text-graphite-700">
                              {formatCurrency(
                                tax.amount.amount,
                                tax.amount.currency
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {booking.pricing.fees.breakdown.length > 0 && (
                      <div className="border-t border-cloud-200 pt-2 mt-2">
                        <p className="text-sm text-graphite-500 mb-1">费用</p>
                        {booking.pricing.fees.breakdown.map((fee, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-graphite-500">{fee.name}</span>
                            <span className="text-graphite-700">
                              {formatCurrency(
                                fee.amount.amount,
                                fee.amount.currency
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {booking.pricing.discounts.breakdown.length > 0 && (
                      <div className="border-t border-cloud-200 pt-2 mt-2">
                        <p className="text-sm text-graphite-500 mb-1">优惠</p>
                        {booking.pricing.discounts.breakdown.map(
                          (discount, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-coral-orange">
                                {discount.name}
                                {discount.code && ` (${discount.code})`}
                              </span>
                              <span className="text-coral-orange font-medium">
                                -
                                {formatCurrency(
                                  discount.amount.amount,
                                  discount.amount.currency
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t-2 border-deep-blue/20 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-graphite-900">
                        订单总价
                      </span>
                      <span className="text-2xl font-display font-bold text-coral-orange">
                        {formatCurrency(
                          booking.pricing.grandTotal.amount,
                          booking.pricing.grandTotal.currency
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-graphite-500 text-right mt-1">
                      支付状态: {booking.paymentStatus === 'paid' ? '已支付' : booking.paymentStatus === 'unpaid' ? '待支付' : booking.paymentStatus === 'refunded' ? '已退款' : '部分退款'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">订单操作</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownloadVoucher}
                  >
                    下载确认单
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full"
                    leftIcon={<Share2 className="w-4 h-4" />}
                    onClick={handleShareBooking}
                  >
                    分享行程
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowAddToItineraryModal(true)}
                  >
                    添加到行程
                  </Button>

                  {booking.status === OrderStatus.PENDING_PAYMENT && (
                    <Button
                      variant="primary"
                      className="w-full"
                      leftIcon={<CreditCard className="w-4 h-4" />}
                      onClick={() => bookingApi.pay(booking.id)}
                    >
                      立即支付
                    </Button>
                  )}

                  {(booking.status === OrderStatus.CONFIRMED ||
                    booking.status === OrderStatus.PENDING_PAYMENT) && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowCancelModal(true)}
                    >
                      取消预订
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate(`/hotels/${booking.hotelId}`)}
                  >
                    查看酒店详情
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gold-foil/5 to-gold-foil/10 border-gold-foil/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gold-foil flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-graphite-900">安全保障</p>
                      <p className="text-sm text-graphite-600 mt-1">
                        您的预订信息经过加密保护，确保个人信息安全。如需协助，请联系客服。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="取消预订"
        description="请确认您要取消此预订。根据取消政策，可能会产生取消费用。"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
            >
              再想想
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              isLoading={isCancelling}
            >
              确认取消
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">取消政策</p>
                <p className="text-sm text-amber-700 mt-1">
                  {booking.cancellationDeadline
                    ? `在 ${formatDate(booking.cancellationDeadline)} 前取消可获得全额退款，逾期取消将收取首晚房费。`
                    : '此预订不可退款。'}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              取消原因 (可选)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="请告诉我们您的取消原因，帮助我们改进服务"
              className="input-field h-24 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddToItineraryModal}
        onClose={() => setShowAddToItineraryModal(false)}
        title="添加到行程"
        description="将此预订添加到现有行程，或创建新的行程计划"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddToItineraryModal(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleAddToItinerary}
              disabled={!selectedItinerary && !newItineraryName}
            >
              确认添加
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              选择现有行程
            </label>
            <select
              value={selectedItinerary}
              onChange={(e) => {
                setSelectedItinerary(e.target.value);
                if (e.target.value) setNewItineraryName('');
              }}
              className="input-field"
            >
              <option value="">-- 请选择 --</option>
              {itineraries.map((itin) => (
                <option key={itin.id} value={itin.id}>
                  {itin.name} ({itin.bookings.length} 个预订)
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cloud-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-graphite-500">或</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              创建新行程
            </label>
            <input
              type="text"
              value={newItineraryName}
              onChange={(e) => {
                setNewItineraryName(e.target.value);
                if (e.target.value) setSelectedItinerary('');
              }}
              placeholder="输入行程名称，如：欧洲夏日之旅"
              className="input-field"
            />
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
};

export default BookingDetailPage;
