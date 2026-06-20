import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Shield, Check, X, ChevronLeft, ChevronRight,
  Wifi, Coffee, Dumbbell, Utensils, Car, Waves, Wind,
  Clock, Users, Calendar, Info, TrendingUp, Heart,
  Share2, Download, Crown, AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { hotelApi, comparisonApi, bookingApi } from '../services/api';
import { useSearchStore, selectSearchParams, selectPricingDetails } from '../store/searchStore';
import { useAuthStore, selectIsAuthenticated, selectMember } from '../store/authStore';
import { cn, formatCurrency, formatDateRange, calculateNights } from '../components/lib/utils';
import { Hotel, RoomType, RatePlan, Currency, OrderStatus } from '@shared/types';

const HotelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useSearchStore(selectSearchParams);
  const pricingDetails = useSearchStore(selectPricingDetails);
  const calculatePrice = useSearchStore((state) => state.calculatePrice);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const member = useAuthStore(selectMember);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<Record<string, RatePlan[]>>({});
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedRatePlan, setSelectedRatePlan] = useState<RatePlan | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const locationState = location.state as any;
  const checkIn = locationState?.checkIn || searchParams.checkIn;
  const checkOut = locationState?.checkOut || searchParams.checkOut;
  const adults = locationState?.adults || searchParams.adults;
  const children = locationState?.children || searchParams.children;
  const rooms = locationState?.rooms || searchParams.rooms;
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;

  useEffect(() => {
    if (id) {
      loadHotelData();
    }
  }, [id]);

  useEffect(() => {
    if (selectedRoomType && selectedRatePlan && checkIn && checkOut) {
      loadPricing();
    }
  }, [selectedRoomType, selectedRatePlan, checkIn, checkOut]);

  const loadHotelData = async () => {
    setIsLoading(true);
    try {
      const [hotelDetailData, comparisonData] = await Promise.all([
        hotelApi.getById(id!),
        comparisonApi.compare({ hotelId: id, checkIn, checkOut, adults, children, rooms }),
      ]) as [any, any];
      
      setHotel(hotelDetailData.hotel as Hotel);
      
      const roomsWithRates = hotelDetailData.roomTypes || [];
      setRoomTypes(roomsWithRates as RoomType[]);
      
      const ratesMap: Record<string, RatePlan[]> = {};
      roomsWithRates.forEach((room: any) => {
        ratesMap[room.id] = room.ratePlans || [];
      });
      setRatePlans(ratesMap);
      
      setComparisonData(comparisonData);

      if (roomsWithRates.length > 0) {
        const firstRoom = roomsWithRates[0];
        setSelectedRoomType(firstRoom as RoomType);
        const rates = ratesMap[firstRoom.id] || [];
        if (rates.length > 0) {
          setSelectedRatePlan(rates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load hotel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoomRates = async (roomTypeId: string) => {
    if (!ratePlans[roomTypeId]) {
      try {
        const rates = await hotelApi.getRatePlans(id!, roomTypeId) as RatePlan[];
        setRatePlans(prev => ({ ...prev, [roomTypeId]: rates }));
      } catch (error) {
        console.error('Failed to load rate plans:', error);
      }
    }
  };

  const loadPricing = async () => {
    if (!selectedRoomType || !selectedRatePlan) return;
    
    try {
      await calculatePrice({
        hotelId: id,
        roomTypeId: selectedRoomType.id,
        ratePlanId: selectedRatePlan.id,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        channelCode: searchParams.channelCode,
        memberTier: member?.tier,
      });
    } catch (error) {
      console.error('Failed to calculate price:', error);
    }
  };

  const handleSelectRoom = async (room: RoomType) => {
    setSelectedRoomType(room);
    setSelectedRatePlan(null);
    await loadRoomRates(room.id);
    const rates = ratePlans[room.id] || await hotelApi.getRatePlans(id!, room.id) as RatePlan[];
    if (rates.length > 0) {
      setSelectedRatePlan(rates[0]);
    }
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedRoomType || !selectedRatePlan) return;
    
    setIsBooking(true);
    try {
      const response = await bookingApi.create({
        hotelId: id!,
        roomTypeId: selectedRoomType.id,
        ratePlanId: selectedRatePlan.id,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        guestInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+8613800138000',
        },
        specialRequests: 'High floor, non-smoking room',
      }) as any;
      
      setBookingSuccess(response.id);
      setShowBookingModal(false);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const facilityIcons: Record<string, React.ReactNode> = {
    'Free WiFi': <Wifi className="w-5 h-5" />,
    'Breakfast Included': <Coffee className="w-5 h-5" />,
    'Fitness Center': <Dumbbell className="w-5 h-5" />,
    'Restaurant': <Utensils className="w-5 h-5" />,
    'Parking': <Car className="w-5 h-5" />,
    'Swimming Pool': <Waves className="w-5 h-5" />,
    'Air Conditioning': <Wind className="w-5 h-5" />,
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-5 h-5',
              i < Math.floor(rating) ? 'text-gold-foil fill-gold-foil' : 'text-cloud-300'
            )}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Skeleton variant="rectangular" height={400} className="rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonText lines={2} />
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="rectangular" height={300} />
            </div>
            <div className="space-y-6">
              <Skeleton variant="rectangular" height={400} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!hotel) {
    return (
      <>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-graphite-400 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-graphite-900 mb-2">酒店不存在</h2>
            <p className="text-graphite-500 mb-6">请检查您访问的链接是否正确</p>
            <Button variant="primary" onClick={() => navigate('/search')}>
              返回搜索
            </Button>
          </div>
        </div>
      </>
    );
  }

  const memberDiscount = member?.tier === 'GOLD' ? 0.10 : member?.tier === 'SILVER' ? 0.05 : 0;

  return (
    <>
      {bookingSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-elevated flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>预订成功！订单号: {bookingSuccess}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 ml-4"
              onClick={() => navigate(`/bookings/${bookingSuccess}`)}
            >
              查看订单
            </Button>
          </div>
        )}

        <div className="relative bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              返回搜索结果
            </button>
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {hotel.tags?.map((tag) => (
                    <Badge key={tag} variant="gold" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  {hotel.isVIPAccess && (
                    <Badge variant="gold" size="sm">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP Access
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                  {hotel.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/80">
                  <div className="flex items-center gap-1">
                    {renderStars(hotel.starRating)}
                    <span className="ml-1">{hotel.starRating}星酒店</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{hotel.address.city}, {hotel.address.country}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-gold-foil fill-gold-foil" />
                    <span className="font-bold">{hotel.overallRating.toFixed(1)}</span>
                    <span className="text-white/60">({hotel.reviewCount}条评价)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20">
                  <Heart className="w-5 h-5 mr-2" />
                  收藏
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20">
                  <Share2 className="w-5 h-5 mr-2" />
                  分享
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-floating">
            <img
              src={hotel.images[currentImageIndex] || hotel.thumbnail}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentImageIndex(Math.min(hotel.images.length - 1, currentImageIndex + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 right-4 flex gap-1">
              {hotel.images.slice(0, 6).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
            <div className="absolute bottom-4 left-4 flex gap-2">
              {hotel.images.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    'w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
                    i === currentImageIndex ? 'border-white' : 'border-transparent'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {hotel.images.length > 4 && (
                <button className="w-12 h-12 rounded-lg bg-black/50 text-white text-xs flex items-center justify-center">
                  +{hotel.images.length - 4}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {checkIn && checkOut && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-deep-blue" />
                      您的预订信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-graphite-500">入住日期</p>
                        <p className="font-semibold text-graphite-900">{checkIn}</p>
                      </div>
                      <div>
                        <p className="text-sm text-graphite-500">退房日期</p>
                        <p className="font-semibold text-graphite-900">{checkOut}</p>
                      </div>
                      <div>
                        <p className="text-sm text-graphite-500">入住时长</p>
                        <p className="font-semibold text-graphite-900">{nights} 晚</p>
                      </div>
                      <div>
                        <p className="text-sm text-graphite-500">旅客</p>
                        <p className="font-semibold text-graphite-900">
                          {adults}成人{children > 0 ? `, ${children}儿童` : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>酒店简介</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-graphite-600 leading-relaxed">
                    {hotel.description || `${hotel.name} 是一家${hotel.starRating}星级豪华酒店，位于${hotel.address.city}市中心黄金地段。酒店提供现代化的客房设施、周到的服务和丰富的餐饮选择，是您商务出行和休闲度假的理想选择。`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>酒店设施</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {hotel.facilities.slice(0, 8).map((facility) => (
                      <div key={facility} className="flex items-center gap-3 p-4 bg-cloud-50 rounded-xl">
                        <div className="text-deep-blue">
                          {facilityIcons[facility] || <Check className="w-5 h-5" />}
                        </div>
                        <span className="text-sm text-graphite-700">{facility}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>选择房型</span>
                    <span className="text-sm font-normal text-graphite-500">
                      {roomTypes.length} 种房型可选
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roomTypes.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={cn(
                        'p-6 rounded-2xl border-2 cursor-pointer transition-all',
                        selectedRoomType?.id === room.id
                          ? 'border-deep-blue bg-deep-blue/5'
                          : 'border-cloud-200 hover:border-cloud-300 hover:bg-cloud-50'
                      )}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={room.images[0] || hotel.thumbnail}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-display font-bold text-graphite-900">
                              {room.name}
                            </h3>
                            {selectedRoomType?.id === room.id && (
                              <Badge variant="primary">已选择</Badge>
                            )}
                          </div>
                          <p className="text-sm text-graphite-500 mb-3">
                            {room.description || `宽敞的${room.name}，配备现代化设施，让您享受舒适的住宿体验。`}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-graphite-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              最多 {room.maxOccupancy} 人
                            </span>
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4 text-emerald-500" />
                              {room.area}㎡
                            </span>
                            {room.amenities.slice(0, 4).map((amenity) => (
                              <span key={amenity} className="flex items-center gap-1">
                                <Check className="w-4 h-4 text-emerald-500" />
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {selectedRoomType?.id === room.id && ratePlans[room.id] && (
                        <div className="mt-6 pt-6 border-t border-cloud-200">
                          <h4 className="font-semibold text-graphite-900 mb-4">选择价格方案</h4>
                          <div className="space-y-3">
                            {ratePlans[room.id]?.map((rate) => (
                              <div
                                key={rate.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRatePlan(rate);
                                }}
                                className={cn(
                                  'p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4',
                                  selectedRatePlan?.id === rate.id
                                    ? 'border-coral-orange bg-coral-orange/5'
                                    : 'border-cloud-200 hover:border-cloud-300'
                                )}
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-graphite-900 capitalize">
                                      {rate.channel}
                                    </span>
                                    {rate.includesBreakfast && (
                                      <Badge variant="info" size="sm">含早餐</Badge>
                                    )}
                                    {rate.isRefundable && (
                                      <Badge variant="success" size="sm">免费取消</Badge>
                                    )}
                                    <Badge variant="primary" size="sm">
                                      {rate.paymentType === 'PREPAY' ? '预付' : '到店付'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-graphite-500">
                                    {rate.isRefundable ? '入住前1天免费取消' : '不可取消'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {rate.originalPrice && (
                                    <div className="text-sm text-graphite-400 line-through">
                                      {formatCurrency(rate.originalPrice.amount, rate.originalPrice.currency)}
                                    </div>
                                  )}
                                  <div className="text-2xl font-display font-bold text-coral-orange">
                                    {formatCurrency(
                                      memberDiscount > 0
                                        ? rate.price.amount * (1 - memberDiscount)
                                        : rate.price.amount,
                                      rate.price.currency
                                    )}
                                  </div>
                                  <div className="text-xs text-graphite-500">每间房每晚</div>
                                  {memberDiscount > 0 && (
                                    <Badge variant="accent" size="sm" className="mt-1">
                                      会员省{Math.round(memberDiscount * 100)}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {comparisonData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-deep-blue" />
                      多渠道比价
                      <Badge variant="accent" size="sm">
                        已对比 {comparisonData.summary?.channelsCompared || 5} 个渠道
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      {comparisonData.channelSummary &&
                        Object.entries(comparisonData.channelSummary).map(([channel, data]: [string, any]) => (
                          <div
                            key={channel}
                            className={cn(
                              'p-4 rounded-xl text-center border-2 transition-all',
                              data.isBestPrice
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-cloud-200'
                            )}
                          >
                            <p className="text-sm text-graphite-500 capitalize mb-1">{channel}</p>
                            <p className="text-lg font-bold text-graphite-900">
                              {data.averagePrice && formatCurrency(data.averagePrice.amount, data.averagePrice.currency)}
                            </p>
                            {data.isBestPrice && (
                              <Badge variant="success" size="sm" className="mt-2">最优价格</Badge>
                            )}
                          </div>
                        ))}
                    </div>
                    <div className="p-4 bg-cloud-50 rounded-xl">
                      <p className="text-sm text-graphite-600">
                        <Info className="w-4 h-4 inline mr-1" />
                        综合评分算法：价格占35%，用户评分占25%，取消灵活度占20%，位置权重占20%。
                        我们为您推荐性价比最高的选择。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>酒店政策</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-graphite-900 mb-2">入住须知</h4>
                      <ul className="space-y-2 text-sm text-graphite-600">
                        <li className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-deep-blue mt-0.5 flex-shrink-0" />
                          <span>入住时间: {hotel.policies?.checkInTime || '14:00'} 后</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-deep-blue mt-0.5 flex-shrink-0" />
                          <span>退房时间: {hotel.policies?.checkOutTime || '12:00'} 前</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-deep-blue mt-0.5 flex-shrink-0" />
                          <span>{hotel.policies?.childrenPolicy || '欢迎儿童入住，部分房型可免费加床'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{hotel.policies?.petPolicy || '不可携带宠物'}</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-graphite-900 mb-2">支付方式</h4>
                      <ul className="space-y-2 text-sm text-graphite-600">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          信用卡 (Visa, MasterCard, AmEx)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          支付宝 / 微信支付
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          银联卡
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          现金 (到店支付)
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>价格明细</span>
                      <Badge variant="success" size="sm" dot>
                        免费取消
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pricingDetails ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-graphite-600">
                            {selectedRoomType?.name} x {rooms} 间 x {nights} 晚
                          </span>
                          <span className="text-graphite-900">
                            {formatCurrency(pricingDetails.roomTotal?.amount || 0, pricingDetails.roomTotal?.currency || Currency.CNY)}
                          </span>
                        </div>
                        {pricingDetails.discounts?.length > 0 && (
                          <div className="border-t border-cloud-200 pt-4 space-y-2">
                            {pricingDetails.discounts.map((discount: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm text-emerald-600">
                                <span>- {discount.description}</span>
                                <span>-{formatCurrency(discount.amount?.amount || 0, discount.amount?.currency || Currency.CNY)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {pricingDetails.taxes?.length > 0 && (
                          <div className="border-t border-cloud-200 pt-4 space-y-2">
                            {pricingDetails.taxes.map((tax: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm text-graphite-600">
                                <span>{tax.description}</span>
                                <span>+{formatCurrency(tax.amount?.amount || 0, tax.amount?.currency || Currency.CNY)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {pricingDetails.fees?.length > 0 && (
                          <div className="border-t border-cloud-200 pt-4 space-y-2">
                            {pricingDetails.fees.map((fee: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm text-graphite-600">
                                <span>{fee.description}</span>
                                <span>+{formatCurrency(fee.amount?.amount || 0, fee.amount?.currency || Currency.CNY)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="border-t-2 border-deep-blue pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-graphite-900">总计</span>
                            <div className="text-right">
                              <div className="text-2xl font-display font-bold text-coral-orange">
                                {formatCurrency(pricingDetails.grandTotal?.amount || 0, pricingDetails.grandTotal?.currency || Currency.CNY)}
                              </div>
                              <div className="text-xs text-graphite-500">含税费及服务费</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-graphite-500">
                        <p>请选择房型和价格方案</p>
                        <p className="text-sm mt-1">以查看完整价格明细</p>
                      </div>
                    )}
                    
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="mt-6"
                      disabled={!selectedRatePlan}
                      onClick={handleBook}
                    >
                      立即预订
                    </Button>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-graphite-600">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span>安全支付，信息加密保护</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-graphite-600">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>即时确认，预订成功立即发邮件</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">联系方式</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-deep-blue mt-0.5 flex-shrink-0" />
                      <span className="text-graphite-600">
                        {hotel.address.street}, {hotel.address.city}, {hotel.address.state} {hotel.address.postalCode}, {hotel.address.country}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-graphite-500">电话:</span>
                      <span className="text-graphite-900">{hotel.contact.phone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-graphite-500">邮箱:</span>
                      <span className="text-graphite-900">{hotel.contact.email}</span>
                    </p>
                    {hotel.contact.website && (
                      <p className="flex items-center gap-2">
                        <span className="text-graphite-500">官网:</span>
                        <a href={hotel.contact.website} target="_blank" className="text-deep-blue hover:underline">
                          {hotel.contact.website}
                        </a>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="确认预订"
        description="请确认以下预订信息"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowBookingModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={confirmBooking}
              isLoading={isBooking}
            >
              确认支付
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex gap-4">
            <img
              src={selectedRoomType?.images[0] || hotel.thumbnail}
              alt={selectedRoomType?.name}
              className="w-32 h-24 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-display font-bold text-graphite-900">{hotel.name}</h3>
              <p className="text-graphite-600">{selectedRoomType?.name}</p>
              <p className="text-sm text-graphite-500 mt-1">
                {formatDateRange(checkIn, checkOut)} · {rooms}间房
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-cloud-50 rounded-xl">
            <div>
              <p className="text-sm text-graphite-500">渠道</p>
              <p className="font-medium capitalize">{selectedRatePlan?.channel}</p>
            </div>
            <div>
              <p className="text-sm text-graphite-500">支付方式</p>
              <p className="font-medium">{selectedRatePlan?.paymentType === 'PREPAY' ? '在线预付' : '到店支付'}</p>
            </div>
            <div>
              <p className="text-sm text-graphite-500">取消政策</p>
              <p className={cn(
                'font-medium',
                selectedRatePlan?.isRefundable ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {selectedRatePlan?.isRefundable ? '免费取消' : '不可取消'}
              </p>
            </div>
            <div>
              <p className="text-sm text-graphite-500">早餐</p>
              <p className="font-medium">
                {selectedRatePlan?.includesBreakfast ? '含双早' : '不含早餐'}
              </p>
            </div>
          </div>
          {pricingDetails && (
            <div className="border-t border-cloud-200 pt-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">总价</span>
                <span className="text-2xl font-display font-bold text-coral-orange">
                  {formatCurrency(pricingDetails.grandTotal?.amount || 0, pricingDetails.grandTotal?.currency || Currency.CNY)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="请先登录"
        description="登录后即可完成预订，享受会员专属权益"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLoginModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={() => navigate('/login')}>
              去登录
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-deep-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-deep-blue" />
          </div>
          <p className="text-graphite-600 mb-4">
            登录后还可享受:
          </p>
          <ul className="text-left space-y-2 text-sm text-graphite-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              会员专属折扣 (最高9折)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              积分累积，可兑换免费住宿
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              VIP房型锁定、延迟退房
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              专属客服支持
            </li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default HotelDetailPage;
