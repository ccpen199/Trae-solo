import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  Share2,
  Download,
  Clock,
  Hotel,
  ChevronRight,
  Globe,
  Lock,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Heart,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { itineraryApi } from '../services/api';
import { formatDate, formatCurrency, formatDateRange } from '../components/lib/utils';
import { Itinerary, BookingOrder } from '@shared/types';

interface SharedItineraryData {
  itinerary: Itinerary;
  bookings: BookingOrder[];
  owner: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

const SharedItineraryPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SharedItineraryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedItinerary(token);
    }
  }, [token]);

  const loadSharedItinerary = async (shareToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itineraryApi.getShared(shareToken);
      setData(result as SharedItineraryData);
    } catch (err: any) {
      setError(err.message || '该行程链接无效或已过期');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data) return;

    const content = `
${data.itinerary.name}
${'='.repeat(40)}
分享者: ${data.owner.lastName}${data.owner.firstName}
创建时间: ${formatDate(data.itinerary.createdAt)}

行程概览
${'-'.repeat(40)}
预订数量: ${data.bookings.length} 个
到访城市: ${new Set(data.bookings.map((b) => b.hotelName?.split(', ').pop())).size} 个

行程详情
${'-'.repeat(40)}

${data.bookings
  .sort(
    (a, b) =>
      new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
  )
  .map(
    (booking, index) => `
${index + 1}. ${booking.hotelName}
   ${booking.roomTypeName}
   ${formatDateRange(booking.checkInDate, booking.checkOutDate)}
   ${booking.guestCount.adults} 成人
   ${booking.hotelName ? '' : ''}
   价格: ${formatCurrency(
     booking.pricing.grandTotal.amount,
     booking.pricing.grandTotal.currency
   )}

`
  )
  .join('')}

--
此行程由 StayGlobal 分享
https://stayglobal.com
`.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.itinerary.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddToMyItineraries = () => {
    navigate('/login', { state: { from: `/itinerary/shared/${token}` } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud-50">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <Skeleton variant="text" width={300} height={40} />
                <SkeletonText lines={2} />
              </CardContent>
            </Card>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton variant="rectangular" className="w-32 h-24 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width={200} />
                      <Skeleton variant="text" width={150} />
                      <Skeleton variant="text" width={100} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-display font-bold text-graphite-900 mb-3">
              行程链接无效
            </h1>
            <p className="text-graphite-500 mb-8">
              {error || '您访问的行程链接不存在或已被取消分享。'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button variant="primary" onClick={() => navigate('/')}>
                返回首页
              </Button>
              <Button variant="outline" onClick={() => navigate('/search')}>
                搜索酒店
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { itinerary, bookings, owner } = data;

  const sortedBookings = [...bookings].sort(
    (a, b) =>
      new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
  );

  const totalNights = sortedBookings.reduce(
    (sum, b) => sum + (b.nights || 0),
    0
  );

  const totalCost = sortedBookings.reduce(
    (sum, b) => sum + b.pricing.grandTotal.amount,
    0
  );

  const cities = new Set(
    sortedBookings.map((b) => b.hotelName?.split(', ').pop() || '')
  );

  const startDate = sortedBookings[0]?.checkInDate;
  const endDate = sortedBookings[sortedBookings.length - 1]?.checkOutDate;

  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />

      <main className="flex-1">
        <div className="bg-gradient-to-r from-deep-blue via-deep-blue-light to-deep-blue text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-cloud-200 mb-4">
              <Globe className="w-4 h-4" />
              <span className="text-sm">这是一个公开分享的行程</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {itinerary.name}
            </h1>

            {itinerary.description && (
              <p className="text-cloud-200 mb-6 max-w-2xl">
                {itinerary.description}
              </p>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <img
                  src={
                    owner.avatar ||
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
                  }
                  alt={owner.firstName}
                  className="w-10 h-10 rounded-full border-2 border-white/30"
                />
                <div>
                  <p className="font-medium">
                    {owner.lastName}
                    {owner.firstName}
                  </p>
                  <p className="text-sm text-cloud-300">分享的行程</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-cloud-200 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">预订数量</span>
                </div>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-cloud-200 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">到访城市</span>
                </div>
                <p className="text-2xl font-bold">{cities.size}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-cloud-200 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">总晚数</span>
                </div>
                <p className="text-2xl font-bold">{totalNights}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-cloud-200 mb-1">
                  <Hotel className="w-4 h-4" />
                  <span className="text-sm">总花费</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    totalCost,
                    bookings[0]?.pricing.grandTotal.currency || 'CNY'
                  )}
                </p>
              </div>
            </div>

            {startDate && endDate && (
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl inline-block">
                <p className="text-cloud-200 text-sm mb-1">行程时间</p>
                <p className="font-semibold">
                  {formatDateRange(startDate, endDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              variant="primary"
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyLink}
            >
              {copied ? '链接已复制' : '复制分享链接'}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
            >
              下载行程单
            </Button>
            <Button
              variant="outline"
              leftIcon={<Heart className="w-4 h-4" />}
              onClick={handleAddToMyItineraries}
            >
              保存到我的行程
            </Button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-graphite-900 mb-6">
              行程详情
            </h2>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-deep-blue/20" />

              <div className="space-y-6">
                {sortedBookings.map((booking, index) => (
                  <div key={booking.id} className="relative pl-16">
                    <div className="absolute left-4 w-5 h-5 bg-white border-4 border-deep-blue rounded-full transform -translate-x-1/2" />

                    <Card className="card-hover overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-48 h-40 md:h-auto relative">
                            <img
                              src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop`}
                              alt={booking.hotelName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3">
                              <Badge variant="primary" size="sm">
                                第 {index + 1} 站
                              </Badge>
                            </div>
                          </div>

                          <div className="flex-1 p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-display font-bold text-graphite-900 mb-1">
                                  {booking.hotelName}
                                </h3>
                                <p className="text-graphite-500 mb-4">
                                  {booking.roomTypeName}
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-deep-blue" />
                                    <span className="text-graphite-600">
                                      {formatDateRange(
                                        booking.checkInDate,
                                        booking.checkOutDate
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-deep-blue" />
                                    <span className="text-graphite-600">
                                      {booking.guestCount.adults} 成人
                                      {booking.guestCount.children > 0 &&
                                        ` ${booking.guestCount.children} 儿童`}
                                    </span>
                                  </div>
                                </div>

                                {booking.specialRequests && (
                                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                    <p className="text-sm text-amber-800">
                                      <span className="font-medium">特殊要求: </span>
                                      {booking.specialRequests}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <p className="text-sm text-graphite-500 mb-1">
                                  预订总价
                                </p>
                                <p className="text-2xl font-display font-bold text-coral-orange">
                                  {formatCurrency(
                                    booking.pricing.grandTotal.amount,
                                    booking.pricing.grandTotal.currency
                                  )}
                                </p>
                                <p className="text-xs text-graphite-500">
                                  含税费及服务费
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-cloud-200">
                              {booking.status === 'CONFIRMED' && (
                                <Badge variant="success" size="sm" dot>
                                  已确认
                                </Badge>
                              )}
                              {booking.confirmationNumber && (
                                <Badge variant="info" size="sm">
                                  确认号: {booking.confirmationNumber}
                                </Badge>
                              )}
                              {booking.channelCode && (
                                <Badge variant="secondary" size="sm">
                                  渠道: {booking.channelCode}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-deep-blue/5 via-white to-deep-blue/5 border-deep-blue/10">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-display font-bold text-graphite-900 mb-3">
                    喜欢这个行程？
                  </h3>
                  <p className="text-graphite-600 mb-6">
                    加入 StayGlobal，创建属于您的精彩旅程。享受会员专属价格、
                    灵活取消政策和贴心服务。
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={() => navigate('/register')}
                    >
                      免费注册
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate('/search')}
                    >
                      搜索酒店
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-deep-blue">800K+</p>
                    <p className="text-sm text-graphite-500">酒店选择</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-deep-blue">200+</p>
                    <p className="text-sm text-graphite-500">国家地区</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-deep-blue">4.9</p>
                    <p className="text-sm text-graphite-500">用户评分</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SharedItineraryPage;
