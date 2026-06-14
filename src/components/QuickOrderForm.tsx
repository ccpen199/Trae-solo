import { useState } from 'react';
import { MapPin, Calendar, Clock, Sparkles, Baby, ChefHat, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, serviceTypeList } from '@/store';
import type { ServiceType } from '@/types';

const iconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

export default function QuickOrderForm() {
  const addresses = useAppStore((state) => state.addresses);
  const selectedAddress = useAppStore((state) => state.selectedAddress);
  const setSelectedAddress = useAppStore((state) => state.setSelectedAddress);
  const addOrder = useAppStore((state) => state.addOrder);

  const [serviceType, setServiceType] = useState<ServiceType>('cleaning');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(3);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentService = serviceTypeList.find((s) => s.type === serviceType)!;

  const handleSubmit = () => {
    if (!selectedAddress) return;
    setSubmitting(true);

    const newOrder = {
      id: Date.now(),
      user_id: 1,
      service_type: serviceType,
      service_type_label: currentService.label,
      address: selectedAddress.detail,
      lng: selectedAddress.lng,
      lat: selectedAddress.lat,
      start_time: `${date} ${time}`,
      duration_hours: duration,
      status: 'pending' as const,
      status_label: '待派单',
      amount: currentService.price * duration,
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    setTimeout(() => {
      addOrder(newOrder);
      setSubmitting(false);
      alert('下单成功！我们将尽快为您匹配合适的阿姨');
    }, 800);
  };

  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-secondary-800">3秒快速下单</h2>
          <p className="text-sm text-secondary-500">选择服务，即刻预约</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-secondary-700 mb-2 block">选择服务类型</label>
          <div className="grid grid-cols-3 gap-3">
            {serviceTypeList.map((item) => {
              const Icon = iconMap[item.type];
              const isSelected = serviceType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => setServiceType(item.type)}
                  className={cn(
                    'flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-200 text-secondary-600'
                  )}
                >
                  <Icon className={cn('w-6 h-6', isSelected ? 'text-primary-500' : '')} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <label className="text-sm font-medium text-secondary-700 mb-2 block">服务地址</label>
          <button
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="w-full input-field flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-secondary-800 truncate">{selectedAddress?.name}</p>
                <p className="text-sm text-secondary-500 truncate">{selectedAddress?.detail}</p>
              </div>
            </div>
            <ChevronDown className={cn('w-5 h-5 text-secondary-400 transition-transform', showAddressDropdown && 'rotate-180')} />
          </button>

          {showAddressDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden animate-fade-up">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setShowAddressDropdown(false);
                  }}
                  className={cn(
                    'w-full p-4 text-left flex items-start gap-3 hover:bg-secondary-50 transition-colors border-b border-gray-100 last:border-b-0',
                    selectedAddress?.id === addr.id && 'bg-primary-50'
                  )}
                >
                  <MapPin className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-secondary-800">{addr.name}</p>
                      {addr.is_default && <span className="badge-orange">默认</span>}
                    </div>
                    <p className="text-sm text-secondary-500 truncate">{addr.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-secondary-700 mb-2 block flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              服务日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-secondary-700 mb-2 block flex items-center gap-1">
              <Clock className="w-4 h-4" />
              开始时间
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-secondary-700 mb-2 block">
            服务时长：<span className="text-primary-600 font-bold">{duration} 小时</span>
          </label>
          <input
            type="range"
            min="1"
            max="8"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-xs text-secondary-400 mt-1">
            <span>1小时</span>
            <span>4小时</span>
            <span>8小时</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-cream-100 rounded-xl">
          <div>
            <p className="text-sm text-secondary-500">预估费用</p>
            <p className="text-2xl font-bold text-primary-600">
              ¥{currentService.price * duration}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedAddress}
            className={cn(
              'btn-primary min-w-32 flex items-center justify-center gap-2',
              submitting && 'opacity-70 cursor-not-allowed'
            )}
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>立即下单</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
