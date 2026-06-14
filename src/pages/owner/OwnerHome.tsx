import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ShoppingBag,
  MessageCircle,
  HeartPulse,
  ChevronRight,
  Syringe,
  Bug,
  Stethoscope,
  Scissors,
  Star,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import { HealthScoreRing } from '@/components/business/HealthScoreRing';
import { PetCard, PetSelector, HealthReminder } from '@/components/business/PetCard';
import { usePetStore } from '@/stores/petStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useMemberStore } from '@/stores/memberStore';
import { cn, formatCurrency } from '@/utils/common';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const quickServices = [
  { icon: Scissors, label: '洗护美容', color: 'bg-purple-100 text-purple-600', path: '/booking', category: 'grooming' },
  { icon: Bug, label: '驱虫服务', color: 'bg-orange-100 text-orange-600', path: '/booking', category: 'deworming' },
  { icon: Syringe, label: '疫苗接种', color: 'bg-blue-100 text-blue-600', path: '/booking', category: 'vaccination' },
  { icon: Stethoscope, label: '健康体检', color: 'bg-primary-100 text-primary-600', path: '/booking', category: 'checkup_basic' },
];

export default function OwnerHome() {
  const navigate = useNavigate();
  const { pets, currentPet, fetchPets, setCurrentPet } = usePetStore();
  const { appointments, fetchAppointments } = useBookingStore();
  const { profile, fetchProfile } = useMemberStore();

  useEffect(() => {
    fetchPets();
    fetchAppointments();
    fetchProfile();
  }, [fetchPets, fetchAppointments, fetchProfile]);

  const upcomingAppointments = appointments.filter(
    (a) => a.status !== 'cancelled' && a.status !== 'completed'
  );

  const completedServices = appointments.filter((a) => a.status === 'completed');

  const healthReminders = currentPet
    ? [
        {
          type: 'deworming' as const,
          petName: currentPet.name,
          dueDate: '2026-06-20',
          daysLeft: differenceInDays(new Date('2026-06-20'), new Date()),
        },
        {
          type: 'vaccine' as const,
          petName: currentPet.name,
          dueDate: '2026-11-20',
          daysLeft: differenceInDays(new Date('2026-11-20'), new Date()),
        },
      ]
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-neutral-500">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
          <h1 className="font-display text-2xl font-bold text-neutral-900 mt-0.5">
            早上好，铲屎官 ☀️
          </h1>
        </div>
        {profile && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-mint-400 text-white px-4 py-2 rounded-full">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">{profile.levelName}</span>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <PetSelector
          pets={pets}
          selectedId={currentPet?.id || null}
          onSelect={(pet) => setCurrentPet(pet)}
        />
      </motion.div>

      {currentPet && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary-500 via-primary-600 to-mint-500 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex items-center gap-6">
              <HealthScoreRing score={currentPet.healthScore} size={140} strokeWidth={12} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-xl font-bold">{currentPet.name}</h3>
                  <Badge className="bg-white/20 border-0 text-white">{currentPet.breed}</Badge>
                </div>

                <p className="text-white/80 text-sm mb-4">
                  {currentPet.gender === 'male' ? '♂' : '♀'} · {currentPet.weight}kg · {currentPet.sterilization === 'yes' ? '已绝育' : '未绝育'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {currentPet.tags.map((tag) => (
                    <Tag key={tag} variant="neutral" className="bg-white/20 text-white border-white/30">
                      {tag}
                    </Tag>
                  ))}
                </div>

                {currentPet.chronicConditions.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/90 bg-white/10 rounded-lg px-3 py-2">
                    <HeartPulse className="w-4 h-4" />
                    <span>慢病管理中：{currentPet.chronicConditions.map(c => c.name).join('、')}</span>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/pets/${currentPet.id}`)}
                    className="bg-white/20 text-white hover:bg-white/30 border-0"
                  >
                    查看档案
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/booking')}
                    className="bg-white text-primary-600 hover:bg-white/90"
                  >
                    预约服务
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-neutral-900">快捷服务</h3>
          <button
            onClick={() => navigate('/booking')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            全部服务 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {quickServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.label}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(service.path)}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-soft border border-neutral-100 hover:shadow-card transition-all duration-300"
              >
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', service.color)}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-medium text-neutral-800">{service.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>健康提醒</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/health')}>
                  查看全部
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthReminders.length > 0 ? (
                healthReminders.map((reminder, index) => (
                  <HealthReminder key={index} {...reminder} />
                ))
              ) : (
                <div className="text-center py-8 text-neutral-400">
                  <HeartPulse className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>暂无健康提醒</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>我的积分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-primary-600">
                  {profile?.points || 0}
                </p>
                <p className="text-sm text-neutral-500 mt-1">可用积分</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => navigate('/member/points')}
                >
                  积分商城
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近预约</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-neutral-50 rounded-xl cursor-pointer hover:bg-primary-50 transition-colors"
                      onClick={() => navigate(`/orders/${apt.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-neutral-900">
                          {apt.serviceId === 'srv_001' ? '精致洗护' : apt.serviceId === 'srv_002' ? '驱虫服务' : '服务'}
                        </span>
                        <Badge variant="info">
                          {apt.status === 'confirmed' ? '待服务' : apt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {apt.scheduledDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.startTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-400 text-sm">
                  暂无预约
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate('/orders')}
              >
                查看全部预约
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>推荐门店</CardTitle>
              <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: '爱宠屋·直营中心店',
                  address: '北京市朝阳区建国路88号',
                  rating: 4.9,
                  distance: '1.2km',
                  image: '/local-placeholder.svg',
                },
                {
                  name: '爱宠屋·望京社区店',
                  address: '北京市朝阳区望京SOHO',
                  rating: 4.8,
                  distance: '3.5km',
                  image: '/local-placeholder.svg',
                },
              ].map((store, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 p-4 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-white hover:shadow-soft transition-all duration-300 border border-transparent hover:border-neutral-100"
                  onClick={() => navigate(`/booking/store/${'store_00' + (index + 1)}`)}
                >
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 truncate">{store.name}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {store.address}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {store.rating}
                      </span>
                      <span className="text-xs text-neutral-500">{store.distance}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>消费统计</CardTitle>
              <Badge variant="accent">本月</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-xl">
                <p className="text-2xl font-display font-bold text-primary-600">{completedServices.length}</p>
                <p className="text-sm text-neutral-500 mt-1">服务次数</p>
              </div>
              <div className="text-center p-4 bg-accent-50 rounded-xl">
                <p className="text-2xl font-display font-bold text-accent-600">
                  {formatCurrency(completedServices.reduce((sum, a) => sum + (a.paidAmount || 0), 0))}
                </p>
                <p className="text-sm text-neutral-500 mt-1">累计消费</p>
              </div>
              <div className="text-center p-4 bg-mint-50 rounded-xl">
                <p className="text-2xl font-display font-bold text-mint-600">
                  {formatCurrency(profile?.points || 0)}
                </p>
                <p className="text-sm text-neutral-500 mt-1">累计积分</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-display font-bold text-purple-600 flex items-center justify-center gap-1">
                  <TrendingUp className="w-5 h-5" />
                  3
                </p>
                <p className="text-sm text-neutral-500 mt-1">连续月份</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        onClick={() => navigate('/symptom-check')}
        className="bg-gradient-to-r from-accent-500 to-accent-400 rounded-2xl p-6 text-white cursor-pointer hover:shadow-float transition-shadow duration-300 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">宠物症状自查</h3>
              <p className="text-white/80 text-sm">AI智能分析，快速了解宠物健康状况</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-3 bg-white text-accent-600 hover:bg-white/90">
            立即自查
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
