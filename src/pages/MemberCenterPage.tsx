import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Coins,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Gift,
  Lock,
  CheckCircle,
  Star,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  User,
  Settings,
  Bell,
  Shield,
  FileText,
  Heart,
  Hotel,
  Download,
  Plus,
  Info,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { memberApi, bookingApi } from '../services/api';
import { useAuthStore, selectIsAuthenticated, selectUser } from '../store/authStore';
import {
  formatCurrency,
  formatDate,
  getMemberTierColor,
  getMemberTierLabel,
  getMemberTierBenefits,
  getProgressToNextTier,
  getNextTier,
} from '../components/lib/utils';
import { Member, PointsTransaction, MemberTier, BookingOrder } from '@shared/types';

const MemberCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'points' | 'benefits' | 'profile'>('overview');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/member' } });
      return;
    }
    loadMemberData();
  }, [isAuthenticated]);

  const loadMemberData = async () => {
    setIsLoading(true);
    try {
      const [memberData, transactionsData, bookingsData] = await Promise.all([
        memberApi.getMember(),
        memberApi.getTransactions(),
        bookingApi.getMyBookings(),
      ]);
      setMember(memberData as Member);
      setTransactions(transactionsData as PointsTransaction[]);
      setBookings(bookingsData as BookingOrder[]);
    } catch (error) {
      console.error('Failed to load member data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!member || !redeemAmount) return;
    setIsRedeeming(true);
    try {
      await memberApi.redeemPoints({
        amount: parseInt(redeemAmount),
        type: 'booking',
      });
      setShowRedeemModal(false);
      setRedeemAmount('');
      await loadMemberData();
    } catch (error) {
      console.error('Failed to redeem points:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'redeem':
        return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
      case 'expire':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Coins className="w-4 h-4 text-graphite-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-green-600';
      case 'redeem':
        return 'text-red-600';
      case 'expire':
        return 'text-amber-600';
      default:
        return 'text-graphite-600';
    }
  };

  if (!isAuthenticated) return null;

  const progress = member ? getProgressToNextTier(member.tierPoints, member.tier) : null;
  const nextTier = member ? getNextTier(member.tier) : null;
  const totalEarned = transactions
    .filter((t) => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRedeemed = Math.abs(
    transactions
      .filter((t) => t.type === 'redeem')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <>
      {member && (
          <div className="bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue text-white py-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold-foil rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral-orange rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-foil to-amber-500 p-1">
                    <img
                      src={user?.avatar}
                      alt={user?.firstName}
                      className="w-full h-full rounded-full object-cover border-4 border-white/20"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-gold-foil rounded-full p-1.5">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-display font-bold">
                      {user?.lastName}
                      {user?.firstName}
                    </h1>
                    <Badge
                      variant="gold"
                      size="md"
                      className={getMemberTierColor(member.tier)}
                    >
                      <Crown className="w-3.5 h-3.5 mr-1" />
                      {getMemberTierLabel(member.tier)}会员
                    </Badge>
                    {member.vipAccessEnabled && (
                      <Badge variant="accent" size="md">
                        <Star className="w-3.5 h-3.5 mr-1" />
                        VIP Access
                      </Badge>
                    )}
                  </div>
                  <p className="text-cloud-200 mb-4">
                    会员自 {formatDate(member.memberSince)}
                    {member.lateCheckoutHours > 0 && (
                      <span className="ml-4">
                        <Clock className="w-4 h-4 inline mr-1" />
                        可延迟退房至 {12 + member.lateCheckoutHours}:00
                      </span>
                    )}
                  </p>

                  {progress && nextTier && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-cloud-200">
                          升级至 {getMemberTierLabel(nextTier)}会员
                        </span>
                        <span className="text-sm font-medium">
                          {progress.current.toLocaleString()} /{' '}
                          {progress.required.toLocaleString()} 等级积分
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-gold-foil to-amber-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-cloud-300 mt-2">
                        再累积 {(progress.required - progress.current).toLocaleString()} 等级积分即可升级
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="text-right">
                    <p className="text-cloud-200 text-sm">可用积分</p>
                    <p className="text-3xl md:text-4xl font-display font-bold text-gold-foil">
                      {member.points.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="accent"
                      size="sm"
                      leftIcon={<Gift className="w-4 h-4" />}
                      onClick={() => setShowRedeemModal(true)}
                    >
                      积分兑换
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      leftIcon={<Settings className="w-4 h-4" />}
                    >
                      设置
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-2 mb-8 border-b border-cloud-200 pb-4">
            {[
              { id: 'overview', label: '概览', icon: TrendingUp },
              { id: 'points', label: '积分明细', icon: Coins },
              { id: 'benefits', label: '会员权益', icon: Gift },
              { id: 'profile', label: '个人资料', icon: User },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-deep-blue border border-cloud-200 border-b-white -mb-px'
                    : 'text-graphite-500 hover:text-graphite-700 hover:bg-cloud-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <SkeletonText lines={3} />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="p-6">
                  <SkeletonText lines={6} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && member && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-deep-blue/10 rounded-xl flex items-center justify-center">
                            <Coins className="w-6 h-6 text-deep-blue" />
                          </div>
                          <div>
                            <p className="text-sm text-graphite-500">可用积分</p>
                            <p className="text-2xl font-bold text-graphite-900">
                              {member.points.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <ArrowUpRight className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-graphite-500">累积积分</p>
                            <p className="text-2xl font-bold text-green-600">
                              +{totalEarned.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-coral-orange/10 rounded-xl flex items-center justify-center">
                            <Hotel className="w-6 h-6 text-coral-orange" />
                          </div>
                          <div>
                            <p className="text-sm text-graphite-500">预订次数</p>
                            <p className="text-2xl font-bold text-graphite-900">
                              {bookings.length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gold-foil/10 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-gold-foil" />
                          </div>
                          <div>
                            <p className="text-sm text-graphite-500">到访城市</p>
                            <p className="text-2xl font-bold text-graphite-900">
                              {new Set(bookings.map((b) => b.hotelName?.split(', ').pop())).size}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-deep-blue" />
                          近期积分变动
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                          onClick={() => setActiveTab('points')}
                        >
                          查看全部
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {transactions.slice(0, 5).map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-3 hover:bg-cloud-50 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    tx.type === 'earn'
                                      ? 'bg-green-50'
                                      : tx.type === 'redeem'
                                      ? 'bg-red-50'
                                      : 'bg-amber-50'
                                  }`}
                                >
                                  {getTransactionIcon(tx.type)}
                                </div>
                                <div>
                                  <p className="font-medium text-graphite-900">
                                    {tx.description}
                                  </p>
                                  <p className="text-xs text-graphite-500">
                                    {formatDate(tx.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <p
                                className={`font-semibold ${getTransactionColor(
                                  tx.type
                                )}`}
                              >
                                {tx.type === 'earn' ? '+' : ''}
                                {tx.amount.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-deep-blue" />
                          我的专属权益
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                          onClick={() => setActiveTab('benefits')}
                        >
                          查看全部
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          {member.benefits
                            .filter((b) => b.isActive)
                            .slice(0, 6)
                            .map((benefit) => (
                              <div
                                key={benefit.code}
                                className="p-4 bg-gradient-to-br from-cloud-50 to-white border border-cloud-100 rounded-xl"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <p className="font-medium text-graphite-900 text-sm">
                                    {benefit.name}
                                  </p>
                                </div>
                                <p className="text-xs text-graphite-500">
                                  {benefit.description}
                                </p>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-deep-blue" />
                        近期预订
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                        onClick={() => navigate('/bookings')}
                      >
                        查看全部
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {bookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-4 bg-cloud-50 rounded-xl hover:bg-cloud-100 transition-colors cursor-pointer"
                            onClick={() => navigate(`/bookings/${booking.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                  src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop`}
                                  alt={booking.hotelName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-graphite-900">
                                  {booking.hotelName}
                                </p>
                                <p className="text-sm text-graphite-500">
                                  {booking.roomTypeName} · {booking.nights} 晚
                                </p>
                                <p className="text-xs text-graphite-400">
                                  {formatDate(booking.checkInDate)} -{' '}
                                  {formatDate(booking.checkOutDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  booking.status === 'CONFIRMED'
                                    ? 'success'
                                    : booking.status === 'PENDING_PAYMENT'
                                    ? 'warning'
                                    : 'default'
                                }
                                size="sm"
                              >
                                {booking.status === 'CONFIRMED'
                                  ? '已确认'
                                  : booking.status === 'PENDING_PAYMENT'
                                  ? '待支付'
                                  : booking.status === 'CHECKED_OUT'
                                  ? '已完成'
                                  : '已取消'}
                              </Badge>
                              <p className="mt-2 font-semibold text-coral-orange">
                                {formatCurrency(
                                  booking.pricing.grandTotal.amount,
                                  booking.pricing.grandTotal.currency
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'points' && member && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-deep-blue" />
                        积分统计
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-deep-blue/5 rounded-xl">
                          <p className="text-sm text-graphite-500 mb-1">当前可用积分</p>
                          <p className="text-3xl font-bold text-deep-blue">
                            {member.points.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-6 bg-green-50 rounded-xl">
                          <p className="text-sm text-graphite-500 mb-1">累计获得积分</p>
                          <p className="text-3xl font-bold text-green-600">
                            +{totalEarned.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-6 bg-coral-orange/5 rounded-xl">
                          <p className="text-sm text-graphite-500 mb-1">累计兑换积分</p>
                          <p className="text-3xl font-bold text-coral-orange">
                            -{totalRedeemed.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-deep-blue" />
                        积分明细
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-cloud-200">
                              <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">
                                时间
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">
                                类型
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">
                                描述
                              </th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-graphite-500">
                                积分变动
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <tr
                                key={tx.id}
                                className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors"
                              >
                                <td className="py-4 px-4 text-sm text-graphite-600">
                                  {formatDate(tx.createdAt)}
                                </td>
                                <td className="py-4 px-4">
                                  <Badge
                                    variant={
                                      tx.type === 'earn'
                                        ? 'success'
                                        : tx.type === 'redeem'
                                        ? 'danger'
                                        : 'warning'
                                    }
                                    size="sm"
                                  >
                                    {tx.type === 'earn'
                                      ? '获得'
                                      : tx.type === 'redeem'
                                      ? '兑换'
                                      : '过期'}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 text-sm text-graphite-700">
                                  {tx.description}
                                </td>
                                <td
                                  className={`py-4 px-4 text-right font-semibold ${getTransactionColor(
                                    tx.type
                                  )}`}
                                >
                                  {tx.type === 'earn' ? '+' : ''}
                                  {tx.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'benefits' && member && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-deep-blue" />
                        {getMemberTierLabel(member.tier)}会员权益
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {member.benefits.map((benefit) => (
                          <div
                            key={benefit.code}
                            className={`p-5 rounded-xl border-2 transition-all ${
                              benefit.isActive
                                ? 'bg-gradient-to-br from-white to-cloud-50 border-deep-blue/20'
                                : 'bg-cloud-50 border-cloud-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  benefit.isActive
                                    ? 'bg-deep-blue/10 text-deep-blue'
                                    : 'bg-cloud-100 text-graphite-400'
                                }`}
                              >
                                {benefit.code.includes('vip') ? (
                                  <Star className="w-6 h-6" />
                                ) : benefit.code.includes('breakfast') ? (
                                  <Gift className="w-6 h-6" />
                                ) : benefit.code.includes('upgrade') ? (
                                  <TrendingUp className="w-6 h-6" />
                                ) : benefit.code.includes('points') ? (
                                  <Coins className="w-6 h-6" />
                                ) : benefit.code.includes('late') ? (
                                  <Clock className="w-6 h-6" />
                                ) : (
                                  <CheckCircle className="w-6 h-6" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-graphite-900">
                                    {benefit.name}
                                  </h3>
                                  {benefit.isActive ? (
                                    <Badge variant="success" size="sm">
                                      已开通
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" size="sm">
                                      <Lock className="w-3 h-3 mr-1" />
                                      未开通
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-graphite-600">
                                  {benefit.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {nextTier && (
                    <Card className="bg-gradient-to-br from-gold-foil/5 via-amber-50/50 to-gold-foil/10 border-gold-foil/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-gold-foil" />
                          升级至 {getMemberTierLabel(nextTier)}会员 解锁更多权益
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {getMemberTierBenefits(nextTier)
                            .slice(0, 6)
                            .map((benefit, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 p-3 bg-white/60 rounded-lg"
                              >
                                <Lock className="w-4 h-4 text-gold-foil" />
                                <span className="text-sm text-graphite-700">
                                  {benefit}
                                </span>
                              </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-white/80 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-graphite-600">
                              升级进度
                            </span>
                            <span className="text-sm font-medium">
                              {member.tierPoints.toLocaleString()} /{' '}
                              {progress?.required.toLocaleString()} 等级积分
                            </span>
                          </div>
                          <div className="w-full bg-cloud-100 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-gold-foil to-amber-500 h-3 rounded-full"
                              style={{ width: `${progress?.percent || 0}%` }}
                            />
                          </div>
                          <p className="text-sm text-graphite-500 mt-3">
                            通过预订酒店累积等级积分，每消费 1 {user?.preferredCurrency || 'CNY'} = 1 等级积分
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'profile' && user && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-deep-blue" />
                        个人资料
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-graphite-700 mb-1">
                              姓氏
                            </label>
                            <input
                              type="text"
                              defaultValue={user.lastName}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite-700 mb-1">
                              名字
                            </label>
                            <input
                              type="text"
                              defaultValue={user.firstName}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite-700 mb-1">
                              电子邮箱
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                defaultValue={user.email}
                                className="input-field pr-20"
                                readOnly
                              />
                              {user.isEmailVerified ? (
                                <Badge
                                  variant="success"
                                  size="sm"
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  已验证
                                </Badge>
                              ) : (
                                <Badge
                                  variant="warning"
                                  size="sm"
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  未验证
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite-700 mb-1">
                              手机号码
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                defaultValue={user.phone}
                                className="input-field pr-20"
                              />
                              {user.isPhoneVerified ? (
                                <Badge
                                  variant="success"
                                  size="sm"
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  已验证
                                </Badge>
                              ) : (
                                <Badge
                                  variant="warning"
                                  size="sm"
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  未验证
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-graphite-700 mb-1">
                              语言偏好
                            </label>
                            <select
                              defaultValue={user.locale}
                              className="input-field"
                            >
                              <option value="zh-CN">简体中文</option>
                              <option value="en-US">English</option>
                              <option value="ja-JP">日本語</option>
                              <option value="fr-FR">Français</option>
                              <option value="de-DE">Deutsch</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite-700 mb-1">
                              首选货币
                            </label>
                            <select
                              defaultValue={user.preferredCurrency}
                              className="input-field"
                            >
                              <option value="CNY">人民币 (CNY)</option>
                              <option value="USD">美元 (USD)</option>
                              <option value="EUR">欧元 (EUR)</option>
                              <option value="GBP">英镑 (GBP)</option>
                              <option value="JPY">日元 (JPY)</option>
                              <option value="AED">迪拉姆 (AED)</option>
                              <option value="SGD">新加坡元 (SGD)</option>
                              <option value="THB">泰铢 (THB)</option>
                            </select>
                          </div>
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-amber-900">
                                  账户安全提示
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                  建议您启用双重认证，定期更换密码，确保账户安全。
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-cloud-200">
                        <Button variant="outline">取消</Button>
                        <Button variant="primary">保存修改</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-deep-blue" />
                        通知设置
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {[
                        {
                          id: 'email_booking',
                          label: '预订确认邮件',
                          description: '预订成功后发送确认邮件',
                          defaultChecked: true,
                        },
                        {
                          id: 'email_reminder',
                          label: '入住提醒',
                          description: '入住前1天发送提醒邮件',
                          defaultChecked: true,
                        },
                        {
                          id: 'email_promotion',
                          label: '促销活动通知',
                          description: '接收会员专属优惠和促销信息',
                          defaultChecked: true,
                        },
                        {
                          id: 'email_points',
                          label: '积分变动通知',
                          description: '积分获得或兑换时发送通知',
                          defaultChecked: true,
                        },
                        {
                          id: 'sms_booking',
                          label: '短信预订提醒',
                          description: '重要预订信息通过短信通知',
                          defaultChecked: false,
                        },
                      ].map((setting) => (
                        <div
                          key={setting.id}
                          className="flex items-center justify-between p-4 bg-cloud-50 rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-graphite-900">
                              {setting.label}
                            </p>
                            <p className="text-sm text-graphite-500">
                              {setting.description}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={setting.defaultChecked}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-cloud-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-deep-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cloud-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deep-blue"></div>
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-deep-blue" />
                        隐私与数据
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="secondary"
                          className="justify-start"
                          leftIcon={<Download className="w-4 h-4" />}
                          onClick={() => navigate('/gdpr')}
                        >
                          <div className="text-left">
                            <p className="font-medium">下载我的数据</p>
                            <p className="text-xs text-graphite-500">
                              导出您的所有个人数据
                            </p>
                          </div>
                        </Button>
                        <Button
                          variant="secondary"
                          className="justify-start"
                          leftIcon={<FileText className="w-4 h-4" />}
                          onClick={() => navigate('/gdpr')}
                        >
                          <div className="text-left">
                            <p className="font-medium">数据主体权利</p>
                            <p className="text-xs text-graphite-500">
                              查看和行使您的GDPR权利
                            </p>
                          </div>
                        </Button>
                        <Button
                          variant="secondary"
                          className="justify-start"
                          leftIcon={<Heart className="w-4 h-4" />}
                        >
                          <div className="text-left">
                            <p className="font-medium">收藏酒店</p>
                            <p className="text-xs text-graphite-500">
                              管理您收藏的酒店
                            </p>
                          </div>
                        </Button>
                        <Button
                          variant="secondary"
                          className="justify-start"
                          leftIcon={<CreditCard className="w-4 h-4" />}
                        >
                          <div className="text-left">
                            <p className="font-medium">支付方式</p>
                            <p className="text-xs text-graphite-500">
                              管理您的支付卡片
                            </p>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

      <Modal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title="积分兑换"
        description="使用您的积分兑换住宿或其他服务"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRedeemModal(false)}
              disabled={isRedeeming}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleRedeemPoints}
              isLoading={isRedeeming}
              disabled={!redeemAmount || parseInt(redeemAmount) > (member?.points || 0)}
            >
              确认兑换
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-deep-blue/5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-graphite-600">当前可用积分</span>
              <span className="text-2xl font-bold text-deep-blue">
                {member?.points.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              兑换积分数量
            </label>
            <input
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              placeholder="请输入要兑换的积分数量"
              className="input-field"
              max={member?.points}
            />
            <p className="text-xs text-graphite-500 mt-1">
              100 积分 = 1 元人民币，最低兑换 10,000 积分
            </p>
          </div>

          {redeemAmount && parseInt(redeemAmount) > 0 && (
            <div className="p-4 bg-gold-foil/5 border border-gold-foil/20 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-graphite-600">可抵扣金额</span>
                <span className="text-xl font-bold text-gold-foil">
                  ¥{(parseInt(redeemAmount) / 100).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 text-sm">兑换说明</p>
                <p className="text-xs text-amber-700 mt-1">
                  积分兑换后将在下次预订时自动抵扣。积分一旦兑换不可退还。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MemberCenterPage;
