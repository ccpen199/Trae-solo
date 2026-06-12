import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Gift,
  History,
  ShoppingBag,
  ChevronRight,
  TrendingUp,
  Calendar,
  Star,
  Zap,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/UIComponents';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import {
  MemberLevelCard,
  BenefitCard,
  LevelComparison,
} from '@/components/business/MemberComponents';
import { useMemberStore } from '@/stores/memberStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn, formatCurrency } from '@/utils/common';

export default function MemberCenterPage() {
  const { profile, pointsTransactions, consults, fetchProfile, fetchPointsTransactions, fetchConsults, isLoading } = useMemberStore();
  const { appointments, fetchAppointments } = useBookingStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
    fetchPointsTransactions();
    fetchConsults();
    fetchAppointments();
  }, [fetchProfile, fetchPointsTransactions, fetchConsults, fetchAppointments]);

  const tabs = [
    { id: 'overview', label: '会员概览' },
    { id: 'points', label: '积分中心' },
    { id: 'orders', label: '我的订单' },
    { id: 'benefits', label: '等级权益' },
  ];

  const memberLevels = [
    { level: 1, name: '普通会员', minGrowth: 0 },
    { level: 2, name: '白银会员', minGrowth: 1000 },
    { level: 3, name: '黄金会员', minGrowth: 3000 },
    { level: 4, name: '铂金会员', minGrowth: 5000 },
    { level: 5, name: '钻石会员', minGrowth: 10000 },
  ];

  const nextLevel = memberLevels.find((l) => l.level === (profile?.level || 1) + 1);
  const progressToNext = nextLevel && profile
    ? ((profile.growthValue - memberLevels[profile.level - 1].minGrowth) / (nextLevel.minGrowth - memberLevels[profile.level - 1].minGrowth)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {profile && <MemberLevelCard profile={profile} />}

      <Card padded={false}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-6" />
        <div className="p-6">
          {activeTab === 'overview' && profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-3 gap-6">
                <Card>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                      <Star className="w-7 h-7 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">成长值</p>
                      <p className="text-2xl font-bold text-neutral-900">{profile.growthValue}</p>
                      {nextLevel && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          距{nextLevel.name}还差 {nextLevel.minGrowth - profile.growthValue}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent-100 flex items-center justify-center">
                      <Gift className="w-7 h-7 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">可用积分</p>
                      <p className="text-2xl font-bold text-neutral-900">{profile.points}</p>
                      <p className="text-xs text-primary-500 mt-0.5 cursor-pointer hover:underline">
                        去积分商城兑换 →
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-mint-100 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-mint-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">累计消费</p>
                      <p className="text-2xl font-bold text-neutral-900">{formatCurrency(profile.totalSpent)}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        会员时长 2年5个月
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {nextLevel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-primary-500" />
                      升级进度
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium text-neutral-900">{profile.levelName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-primary-600">{profile.growthValue}</span>
                        <span className="text-neutral-400"> / {nextLevel.minGrowth}</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-primary-500 to-mint-400 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {memberLevels.slice(profile.level - 1, profile.level + 2).map((level) => (
                        <div
                          key={level.level}
                          className={cn(
                            'text-center',
                            level.level === profile.level ? 'text-primary-600' : 'text-neutral-400'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold',
                              level.level <= profile.level
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-200 text-neutral-500'
                            )}
                          >
                            {level.level}
                          </div>
                          <p className="text-xs">{level.name}</p>
                          <p className="text-xs opacity-75">{level.minGrowth}+</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent-500" />
                      我的专属权益
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('benefits')}>
                      查看全部
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {profile.benefits
                      .filter((b) => b.minLevel <= profile.level)
                      .slice(0, 4)
                      .map((benefit) => (
                        <BenefitCard key={benefit.id} benefit={benefit} unlocked={true} />
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-5 h-5 text-primary-500" />
                    最近动态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pointsTransactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center',
                              tx.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                            )}
                          >
                            {tx.type === 'earn' ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{tx.reason}</p>
                            <p className="text-xs text-neutral-500">
                              {format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'font-semibold',
                            tx.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {tx.type === 'earn' ? '+' : '-'}{tx.amount} 积分
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'points' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">积分商城</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { name: '精致洗护服务', points: 1000, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20grooming%20service&image_size=square' },
                      { name: '驱虫服务', points: 500, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20deworming%20product&image_size=square' },
                      { name: '宠物益生菌', points: 300, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20probiotic%20supplement&image_size=square' },
                      { name: '营养卵磷脂', points: 400, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20lecithin%20supplement&image_size=square' },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -4 }}
                        className="bg-neutral-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-soft transition-all"
                      >
                        <img src={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                        <div className="p-3">
                          <h4 className="font-medium text-sm text-neutral-900 line-clamp-1">{item.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-primary-600 font-semibold flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {item.points}
                            </span>
                            <Button size="sm" variant="outline">兑换</Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">积分明细</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pointsTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center',
                              tx.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                            )}
                          >
                            {tx.type === 'earn' ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{tx.reason}</p>
                            <p className="text-xs text-neutral-500">
                              {format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'font-semibold text-lg',
                            tx.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <Card key={apt.id} hoverable>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          apt.status === 'completed' ? 'success' :
                          apt.status === 'cancelled' ? 'danger' :
                          apt.status === 'in_service' ? 'warning' : 'info'
                        }>
                          {apt.status === 'confirmed' ? '待服务' :
                           apt.status === 'completed' ? '已完成' :
                           apt.status === 'cancelled' ? '已取消' :
                           apt.status === 'in_service' ? '服务中' : apt.status}
                        </Badge>
                        <span className="text-sm text-neutral-400">{apt.orderNo}</span>
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(apt.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">
                          {apt.serviceId === 'srv_001' ? '精致洗护套餐' :
                           apt.serviceId === 'srv_002' ? '体内外驱虫服务' :
                           apt.serviceId === 'srv_003' ? '疫苗接种服务' : '服务预约'}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {apt.scheduledDate} {apt.startTime}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        查看详情
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'benefits' && profile && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    等级权益说明
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LevelComparison currentLevel={profile.level} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary-500" />
                    全部权益
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {profile.benefits.map((benefit) => (
                      <BenefitCard
                        key={benefit.id}
                        benefit={benefit}
                        unlocked={benefit.minLevel <= profile.level}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
