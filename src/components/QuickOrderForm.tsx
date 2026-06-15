import { useState } from 'react';
import { MapPin, Calendar, Clock, Sparkles, Baby, ChefHat, ChevronDown, Zap, Shield, CircleDollarSign, CheckCircle, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore, serviceTypeList } from '@/store';
import type { ServiceType } from '@/types';

const iconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

const timeSlots = [
  { label: '上午', range: '09:00-12:00', time: '09:00', icon: '🌅' },
  { label: '下午', range: '14:00-17:00', time: '14:00', icon: '☀️' },
  { label: '晚上', range: '18:00-21:00', time: '18:00', icon: '🌙' },
];

const datePresets = [
  { label: '今天', offset: 0 },
  { label: '明天', offset: 1 },
  { label: '后天', offset: 2 },
];

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export default function QuickOrderForm() {
  const addresses = useAppStore((state) => state.addresses);
  const selectedAddress = useAppStore((state) => state.selectedAddress);
  const setSelectedAddress = useAppStore((state) => state.setSelectedAddress);
  const addOrder = useAppStore((state) => state.addOrder);
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState<ServiceType>('cleaning');
  const [dateOffset, setDateOffset] = useState(1);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(3);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showFeeDetail, setShowFeeDetail] = useState(false);
  const [showCompensationRule, setShowCompensationRule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(0);

  const currentService = serviceTypeList.find((s) => s.type === serviceType)!;
  const dateStr = getDateStr(dateOffset);
  const baseFee = currentService.price * duration;
  const insuranceFee = 2;
  const totalFee = baseFee + insuranceFee;

  const handleSubmit = () => {
    if (!selectedAddress) return;
    setSubmitting(true);

    const newOrderId = Date.now();
    const newOrder = {
      id: newOrderId,
      user_id: 1,
      service_type: serviceType,
      service_type_label: currentService.label,
      address: selectedAddress.detail,
      lng: selectedAddress.lng,
      lat: selectedAddress.lat,
      start_time: `${dateStr} ${time}`,
      duration_hours: duration,
      status: 'pending' as const,
      status_label: '待派单',
      amount: totalFee,
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    setTimeout(() => {
      addOrder(newOrder);
      setSubmitting(false);
      setOrderId(newOrderId);
      setOrderSuccess(true);
    }, 800);
  };

  if (orderSuccess) {
    return (
      <div className="text-center py-8 animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-secondary-800 mb-2">下单成功！</h3>
        <p className="text-secondary-500 mb-2">订单号 #{orderId}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm mb-6">
          <Navigation className="w-4 h-4" />
          正在匹配1km内阿姨，预计3分钟内派单
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`/orders/${orderId}`)} className="btn-primary text-sm">
            查看订单
          </button>
          <button onClick={() => setOrderSuccess(false)} className="btn-secondary text-sm">
            继续下单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-secondary-800">3秒快速下单</h2>
          <p className="text-xs text-secondary-500">选服务 → 选时间 → 确认下单</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-secondary-700 mb-2 block">① 选择服务类型</label>
          <div className="grid grid-cols-3 gap-2">
            {serviceTypeList.map((item) => {
              const Icon = iconMap[item.type];
              const isSelected = serviceType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => setServiceType(item.type)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-200 text-secondary-600'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isSelected ? 'text-primary-500' : '')} />
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[10px] text-secondary-400">¥{item.price}/h</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-secondary-700 mb-2 block">② 服务地址</label>
          <div className="relative">
            <button
              onClick={() => setShowAddressDropdown(!showAddressDropdown)}
              className="w-full input-field flex items-center justify-between text-left py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                {selectedAddress ? (
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-secondary-800 text-sm">{selectedAddress.name}</span>
                      {selectedAddress.is_default && <span className="badge-orange text-[10px] py-0 px-1.5">默认</span>}
                    </div>
                    <p className="text-xs text-secondary-500 truncate">{selectedAddress.detail}</p>
                  </div>
                ) : (
                  <span className="text-secondary-400 text-sm">请选择服务地址</span>
                )}
              </div>
              <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform flex-shrink-0', showAddressDropdown && 'rotate-180')} />
            </button>

            {showAddressDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setShowAddressDropdown(false);
                    }}
                    className={cn(
                      'w-full p-3 text-left flex items-start gap-2 hover:bg-secondary-50 transition-colors border-b border-gray-50 last:border-b-0',
                      selectedAddress?.id === addr.id && 'bg-primary-50'
                    )}
                  >
                    <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-secondary-800 text-sm">{addr.name}</span>
                        {addr.is_default && <span className="badge-orange text-[10px] py-0 px-1.5">默认</span>}
                      </div>
                      <p className="text-xs text-secondary-500 truncate">{addr.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-secondary-700 mb-2 block">③ 服务时间</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              {datePresets.map((preset) => (
                <button
                  key={preset.offset}
                  onClick={() => setDateOffset(preset.offset)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    dateOffset === preset.offset
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-secondary-600 hover:border-primary-200'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setTime(slot.time)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    time === slot.time
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-secondary-600 hover:border-primary-200'
                  )}
                >
                  <span className="mr-1">{slot.icon}</span>
                  {slot.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-xs text-secondary-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateStr}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-secondary-700 mb-1.5 block">
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
          <div className="flex justify-between text-[10px] text-secondary-400 mt-1">
            <span>1h</span><span>4h</span><span>8h</span>
          </div>
        </div>

        <div className="rounded-xl bg-cream-100 p-4 space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowFeeDetail(!showFeeDetail)}
          >
            <span className="text-xs text-secondary-500">费用明细</span>
            <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform', showFeeDetail && 'rotate-180')} />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-primary-600">¥{totalFee}</span>
              <span className="text-xs text-secondary-400 ml-1">含保险</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAddress}
              className={cn(
                'btn-primary text-sm min-w-28 flex items-center justify-center gap-2',
                submitting && 'opacity-70 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Zap className="w-4 h-4" />立即下单</>
              )}
            </button>
          </div>
          {showFeeDetail && (
            <div className="pt-2 border-t border-gray-200 space-y-1.5 text-xs animate-fade-up">
              <div className="flex justify-between text-secondary-600">
                <span>{currentService.label} × {duration}小时</span>
                <span>¥{baseFee}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>家政服务责任险</span>
                <span>¥{insuranceFee}</span>
              </div>
              <div className="flex justify-between font-bold text-secondary-800 pt-1.5 border-t border-gray-200">
                <span>合计</span>
                <span>¥{totalFee}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div
            className="flex items-center gap-2 text-xs text-secondary-500 cursor-pointer hover:text-primary-600"
            onClick={() => setShowCompensationRule(!showCompensationRule)}
          >
            <Shield className="w-3.5 h-3.5 text-primary-500" />
            <span className="font-medium">爽约全额赔付，赠30元补偿券</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showCompensationRule && 'rotate-180')} />
          </div>
          {showCompensationRule && (
            <div className="p-3 rounded-lg bg-primary-50 text-xs text-secondary-600 space-y-1 animate-fade-up">
              <p>• 阿姨迟到超30分钟 → 全额退款 + 30元补偿券</p>
              <p>• 阿姨未按约定上门 → 全额退款 + 30元补偿券</p>
              <p>• 服务质量不达标 → 免费重做或退款</p>
              <p>• 24小时内自动审核到账</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-secondary-400">
          <span className="flex items-center gap-1"><CircleDollarSign className="w-3 h-3" />爽约赔付</span>
          <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />1km派单</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />全程保险</span>
        </div>
      </div>
    </div>
  );
}
