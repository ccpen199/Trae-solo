import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Bug,
  Syringe,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag, Avatar, AvatarGroup } from '@/components/common/BadgeTagAvatar';
import { Steps, Progress } from '@/components/common/UIComponents';
import { useBookingStore } from '@/stores/bookingStore';
import { usePetStore } from '@/stores/petStore';
import { cn, formatCurrency } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const categoryIcons: Record<string, React.ElementType> = {
  grooming: Scissors,
  deworming: Bug,
  vaccination: Syringe,
  checkup_basic: Stethoscope,
  checkup_deep: Stethoscope,
  dental: Stethoscope,
  surgery: Stethoscope,
  specialty: Stethoscope,
};

const categoryLabels: Record<string, string> = {
  grooming: '洗护美容',
  deworming: '驱虫服务',
  vaccination: '疫苗接种',
  checkup_basic: '基础体检',
  checkup_deep: '深度体检',
  dental: '口腔护理',
  surgery: '手术服务',
  specialty: '专科诊疗',
};

export default function BookingPage() {
  const navigate = useNavigate();
  const {
    step,
    selectedService,
    selectedStore,
    selectedStaff,
    selectedDate,
    selectedTime,
    services,
    stores,
    staff,
    timeSlots,
    isLoading,
    setStep,
    selectService,
    selectStore,
    selectStaff,
    selectDateTime,
    fetchServices,
    fetchStores,
    fetchAvailability,
    createAppointment,
    resetBooking,
  } = useBookingStore();
  const { currentPet } = usePetStore();

  useEffect(() => {
    fetchServices();
    fetchStores();
  }, [fetchServices, fetchStores]);

  useEffect(() => {
    if (selectedStore && selectedDate) {
      fetchAvailability(selectedStore.id, selectedDate);
    }
  }, [selectedStore, selectedDate, fetchAvailability]);

  const steps = [
    { id: '1', label: '选择服务', description: '服务项目' },
    { id: '2', label: '选择门店', description: '门店与人员' },
    { id: '3', label: '选择时间', description: '预约时段' },
    { id: '4', label: '确认预约', description: '信息核对' },
  ];

  const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const handleCreateAppointment = async () => {
    try {
      const apt = await createAppointment();
      navigate(`/orders/${apt.id}`);
      resetBooking();
    } catch (err) {
      console.error('Failed to create appointment:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        {step > 1 && (
          <Button variant="ghost" size="sm" onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <Steps steps={steps} currentStep={step - 1} />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择服务类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {services.map((service) => {
                  const Icon = categoryIcons[service.category] || Scissors;
                  const isSelected = selectedService?.id === service.id;

                  return (
                    <motion.div
                      key={service.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectService(service)}
                      className={cn(
                        'relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-card'
                          : 'border-neutral-200 bg-white hover:border-primary-200 hover:shadow-soft'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-7 h-7 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-neutral-900">{service.name}</h4>
                            {service.requiresVet && (
                              <Badge variant="warning" size="sm">需兽医</Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mb-2 line-clamp-2">
                            {service.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-primary-600">
                                {formatCurrency(service.basePrice)}
                              </span>
                              {service.originalPrice && (
                                <span className="text-sm text-neutral-400 line-through ml-2">
                                  {formatCurrency(service.originalPrice)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {service.durationMinutes}分钟
                            </span>
                          </div>
                        </div>
                      </div>
                      <Tag variant="mint" className="mt-3">
                        {categoryLabels[service.category]}
                      </Tag>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择门店</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stores.map((store) => {
                const isSelected = selectedStore?.id === store.id;
                const storeStaff = staff.filter((s) => s.storeId === store.id);

                return (
                  <motion.div
                    key={store.id}
                    whileHover={{ y: -2 }}
                    onClick={() => selectStore(store)}
                    className={cn(
                      'p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300',
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-200'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={`/local-placeholder.svg`}
                        alt={store.name}
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-neutral-900">{store.name}</h4>
                          {isSelected && (
                            <Badge variant="success">已选择</Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {store.address}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-sm text-amber-600">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {store.rating}
                          </span>
                          <span className="text-sm text-neutral-500">
                            营业时间：{store.businessHours[0].openTime} - {store.businessHours[0].closeTime}
                          </span>
                        </div>
                        {storeStaff.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-neutral-500">服务人员：</span>
                            <AvatarGroup
                              avatars={storeStaff.map((s) => ({
                                src: s.avatar,
                                name: s.name,
                              }))}
                              max={3}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {selectedStore && (
            <Card>
              <CardHeader>
                <CardTitle>选择服务人员（可选）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {staff
                    .filter((s) => s.storeId === selectedStore.id && s.services.includes(selectedService?.id || ''))
                    .map((member) => (
                      <motion.div
                        key={member.id}
                        whileHover={{ y: -2 }}
                        onClick={() => selectStaff(selectedStaff?.id === member.id ? null : member)}
                        className={cn(
                          'p-4 rounded-xl border-2 text-center cursor-pointer transition-all',
                          selectedStaff?.id === member.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-200'
                        )}
                      >
                        <Avatar
                          src={member.avatar}
                          name={member.name}
                          size="lg"
                          className="mx-auto mb-2"
                          style={{ borderColor: member.color }}
                        />
                        <p className="font-medium text-neutral-900">{member.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {member.role === 'veterinarian' ? '执业兽医' : member.role === 'groomer' ? '美容师' : '护理师'}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择日期</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {nextWeekDates.map((date) => {
                  const isSelected = selectedDate === format(date, 'yyyy-MM-dd');
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => selectDateTime(format(date, 'yyyy-MM-dd'), selectedTime || '')}
                      className={cn(
                        'flex-shrink-0 w-20 py-4 rounded-xl text-center transition-all duration-200',
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-50 hover:bg-primary-50'
                      )}
                    >
                      <p className="text-xs opacity-75">
                        {format(date, 'EEE', { locale: zhCN })}
                      </p>
                      <p className="text-2xl font-bold my-1">
                        {format(date, 'd')}
                      </p>
                      <p className="text-xs">
                        {format(date, 'MM月', { locale: zhCN })}
                      </p>
                      {isToday && (
                        <Badge variant={isSelected ? 'info' : 'primary'} size="sm" className="mt-2">
                          今天
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>选择时段</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => selectDateTime(selectedDate, slot.time)}
                      className={cn(
                        'py-3 rounded-xl font-medium transition-all duration-200',
                        selectedTime === slot.time
                          ? 'bg-primary-500 text-white shadow-md'
                          : slot.available
                          ? 'bg-neutral-50 hover:bg-primary-100 text-neutral-700'
                          : 'bg-neutral-100 text-neutral-300 cursor-not-allowed line-through'
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>确认预约信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPet && (
                <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                  <Avatar src={currentPet.avatar} name={currentPet.name} size="lg" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">{currentPet.name}</h4>
                    <p className="text-sm text-neutral-500">
                      {currentPet.breed} · {currentPet.weight}kg
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-500">服务项目</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-500">服务门店</span>
                  <span className="font-medium">{selectedStore?.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-500">服务人员</span>
                  <span className="font-medium">{selectedStaff?.name || '系统分配'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> 预约日期
                  </span>
                  <span className="font-medium">
                    {selectedDate && format(new Date(selectedDate), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 预约时间
                  </span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-500">服务时长</span>
                  <span className="font-medium">{selectedService?.durationMinutes}分钟</span>
                </div>
              </div>

              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-600">服务费用</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(selectedService?.basePrice || 0)}
                  </span>
                </div>
                <Progress value={100} color="primary" size="sm" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              重新选择
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleCreateAppointment}
              isLoading={isLoading}
            >
              确认预约并支付
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
