import { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Calendar, Clock, Sparkles, Baby, ChefHat, ChevronDown, Zap, Shield, CircleDollarSign, CheckCircle, Navigation, Users, Star, FileCheck, Timer, Award, AlertTriangle, Phone, Flame, Gift, Receipt } from 'lucide-react';
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

function addMinutes(timeStr: string, minutes: number) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export default function QuickOrderForm() {
  const addresses = useAppStore((state) => state.addresses);
  const selectedAddress = useAppStore((state) => state.selectedAddress);
  const setSelectedAddress = useAppStore((state) => state.setSelectedAddress);
  const getDispatchInfo = useAppStore((state) => state.getDispatchInfo);
  const getDispatchQueue = useAppStore((state) => state.getDispatchQueue);
  const addOrder = useAppStore((state) => state.addOrder);
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState<ServiceType>('cleaning');
  const [dateOffset, setDateOffset] = useState(1);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(3);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showFeeDetail, setShowFeeDetail] = useState(false);
  const [showCompensationRule, setShowCompensationRule] = useState(false);
  const [showConfirmDetail, setShowConfirmDetail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(0);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const currentService = serviceTypeList.find((s) => s.type === serviceType)!;
  const dateStr = getDateStr(dateOffset);
  const baseFee = currentService.price * duration;
  const insuranceFee = 2;
  const totalFee = baseFee + insuranceFee;

  const dispatchInfo = selectedAddress ? getDispatchInfo(selectedAddress.id) : undefined;
  const nearbyWorkers = dispatchInfo?.nearby_workers_count ?? 7;
  const avgScore = dispatchInfo?.avg_score ?? 4.8;
  const avgArriveMinutes = dispatchInfo?.avg_arrive_minutes ?? 25;
  const heatLevel = dispatchInfo?.heat_level ?? 'medium';
  const workerDistribution = dispatchInfo?.worker_distribution ?? [
    { distance: '500m内', count: 2 },
    { distance: '1km内', count: 3 },
    { distance: '2km内', count: 1 },
    { distance: '3km内', count: 1 },
  ];

  const heatLevelLabel = {
    high: { text: '高热力区', cls: 'text-red-600 bg-red-50' },
    medium: { text: '中热力区', cls: 'text-orange-600 bg-orange-50' },
    low: { text: '低热力区', cls: 'text-blue-600 bg-blue-50' },
  };

  const dispatchQueue = useMemo(() => {
    if (!selectedAddress) return [];
    const queue = getDispatchQueue(selectedAddress.id, serviceType);
    return queue;
  }, [selectedAddress, serviceType]);

  const timeline = useMemo(() => [
    { label: '预计派单', time: addMinutes(time, 3), desc: `${nearbyWorkers}位阿姨待命中`, icon: Navigation },
    { label: '预计接单', time: addMinutes(time, 8), desc: '平均5分钟内接单', icon: CheckCircle },
    { label: '预计出发', time: addMinutes(time, 15), desc: '阿姨从服务点出发', icon: MapPin },
    { label: '预计到达', time: addMinutes(time, 15 + avgArriveMinutes), desc: `平均${avgArriveMinutes}分钟到达`, icon: Users },
    { label: '服务结束', time: addMinutes(time, 15 + avgArriveMinutes + duration * 60), desc: `服务${duration}小时后完成`, icon: Star },
  ], [time, duration, nearbyWorkers, avgArriveMinutes]);

  const handleSubmit = () => {
    if (!selectedAddress) return;
    setSubmitting(true);

    const newOrderId = Date.now();
    const policyNo = `JZ${dateStr.replace(/-/g, '')}${String(newOrderId).slice(-6)}`;
    const startTimeStr = `${dateStr} ${time}`;
    const targetWorkerId = selectedWorkerId ?? dispatchQueue[0]?.id ?? 101;
    const chosenWorker = dispatchQueue.find(w => w.id === targetWorkerId) || dispatchQueue[0];

    const genOrderNodes = (): import('@/types').ServiceNode[] => {
      const d = dateStr;
      const addMin = (t: string, min: number) => {
        const [h, m] = t.split(':').map(Number);
        const total = h * 60 + m + min;
        const nh = Math.floor(total / 60) % 24;
        const nm = total % 60;
        return `${d} ${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
      };
      const assignRemark = selectedWorkerId
        ? `用户手动指定阿姨：${chosenWorker?.real_name || ''}`
        : '热力图匹配1km内最优阿姨（动态加权评分第一）';
      return [
        { id: 1, order_id: newOrderId, node_type: 'order_created' as const, node_label: '订单创建', node_time: addMin(time, -1), remark: '3秒快速下单完成' },
        { id: 2, order_id: newOrderId, node_type: 'assigned' as const, node_label: selectedWorkerId ? '人工指定派单' : '系统派单', node_time: addMin(time, 2), remark: assignRemark },
      ];
    };

    const genDispatchRecords = (): import('@/types').DispatchRecord[] => {
      const d = dateStr;
      const addMin = (min: number) => {
        const [h, m] = time.split(':').map(Number);
        const total = h * 60 + m + min;
        const nh = Math.floor(total / 60) % 24;
        const nm = total % 60;
        return `${d} ${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
      };
      const recs: import('@/types').DispatchRecord[] = [
        {
          id: 1,
          order_id: newOrderId,
          worker_id: targetWorkerId,
          worker_name: chosenWorker?.real_name || '待指派',
          action: selectedWorkerId ? 'manual_reassign' : 'system_assign',
          action_label: selectedWorkerId ? '用户指定派单' : '热力图派单',
          action_time: addMin(-58),
          operator: selectedWorkerId ? '用户手动指定' : '调度热力系统',
          reason: selectedWorkerId ? '用户在派单队列中主动选择此阿姨' : '1km优先+动态加权综合匹配',
          dispatch_method: selectedWorkerId ? 'manual' : 'heatmap_1km',
          weighted_score: chosenWorker?.weighted_score || avgScore * 20,
          distance_km: chosenWorker?.distance_km || (dispatchInfo ? dispatchInfo.worker_distribution[0]?.count ? 0.5 : 1.0 : 0.8),
          satisfaction_rate: chosenWorker?.satisfaction_rate,
          complaint_rate: chosenWorker?.complaint_rate,
        },
        {
          id: 2,
          order_id: newOrderId,
          worker_id: targetWorkerId,
          worker_name: chosenWorker?.real_name || '待指派',
          action: 'dispatch_audit',
          action_label: '调度复核',
          action_time: addMin(-55),
          operator: '调度员-李伟',
          reason: `复核通过：三证齐全+综合评分${(chosenWorker?.weighted_score || avgScore * 20).toFixed(1)}达标，${chosenWorker?.distance_km || 0.8}km符合1km优先条件`,
          dispatch_method: 'weighted_score',
          weighted_score: chosenWorker?.weighted_score || avgScore * 20,
          distance_km: chosenWorker?.distance_km || 0.8,
          satisfaction_rate: chosenWorker?.satisfaction_rate,
          complaint_rate: chosenWorker?.complaint_rate,
        },
      ];
      return recs;
    };

    const newOrder: import('@/types').Order = {
      id: newOrderId,
      user_id: 1,
      worker_id: targetWorkerId,
      service_type: serviceType,
      service_type_label: currentService.label,
      address: selectedAddress.detail,
      address_name: selectedAddress.name,
      lng: selectedAddress.lng,
      lat: selectedAddress.lat,
      start_time: startTimeStr,
      duration_hours: duration,
      status: 'assigned',
      status_label: '待接单',
      amount: totalFee,
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      nodes: genOrderNodes(),
      dispatch_records: genDispatchRecords(),
      insurance: {
        policy_no: policyNo,
        product_name: '家政服务责任险',
        coverage_amount: 500000,
        premium: insuranceFee,
        status: 'active',
      },
      worker_name: chosenWorker?.real_name || '匹配中...',
      worker_avatar: chosenWorker?.avatar || '',
      worker_phone: chosenWorker?.phone || '待确认',
      worker_score: chosenWorker ? Math.round(chosenWorker.weighted_score / 20 * 10) / 10 : avgScore,
      distance_km: chosenWorker?.distance_km || (dispatchInfo ? dispatchInfo.worker_distribution[0]?.count ? 0.5 : 1.0 : 0.8),
    };

    setTimeout(() => {
      addOrder(newOrder);
      setSubmitting(false);
      setOrderId(newOrderId);
      setOrderSuccess(true);
    }, 1000);
  };

  if (orderSuccess) {
    const createdOrder = useAppStore.getState().orders.find(o => o.id === orderId);
    const realNodes = createdOrder?.nodes || [];
    const realInsurance = createdOrder?.insurance;

    return <OrderSuccessView
      orderId={orderId}
      order={createdOrder || null}
      realNodes={realNodes}
      realInsurance={realInsurance || null}
      currentService={currentService}
      selectedAddress={selectedAddress}
      totalFee={totalFee}
      duration={duration}
      time={time}
      dateStr={dateStr}
      navigate={navigate}
      onReset={() => setOrderSuccess(false)}
    />;
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

        <div className="rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 p-4 border border-primary-100">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowConfirmDetail(!showConfirmDetail)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-secondary-800">下单确认信息</span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform', showConfirmDetail && 'rotate-180')} />
          </div>

          {showConfirmDetail && (
            <div className="mt-3 space-y-3 animate-fade-up">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-2.5 border border-primary-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Navigation className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-[10px] text-secondary-500">可派阿姨</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <p className="text-lg font-bold text-primary-600">{nearbyWorkers}<span className="text-xs text-secondary-400 font-normal ml-0.5">人</span></p>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full mb-0.5', heatLevelLabel[heatLevel].cls)}>
                      {heatLevelLabel[heatLevel].text}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-primary-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[10px] text-secondary-500">平均评分</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <p className="text-lg font-bold text-yellow-600">{avgScore.toFixed(1)}<span className="text-xs text-secondary-400 font-normal ml-0.5">/5</span></p>
                    <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mb-0.5">
                      动态加权
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2.5 border border-primary-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] text-secondary-500">阿姨距离分布</span>
                  </div>
                  <span className="text-[10px] text-secondary-400">1km内优先派单</span>
                </div>
                <div className="space-y-1">
                  {workerDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-secondary-500 w-12">{item.distance}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all"
                          style={{ width: `${(item.count / nearbyWorkers) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-secondary-600 font-medium w-6 text-right">{item.count}人</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-2.5 border border-primary-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-[10px] text-secondary-500">评分权重（动态加权）</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5"><span className="text-secondary-600">准时率</span><span className="text-primary-600 font-medium">40%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-primary-500 rounded-full" style={{ width: '40%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5"><span className="text-secondary-600">客户好评</span><span className="text-yellow-600 font-medium">50%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{ width: '50%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5"><span className="text-secondary-600">投诉率</span><span className="text-red-600 font-medium">10%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-red-400 rounded-full" style={{ width: '10%' }} /></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2.5 border border-green-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] text-secondary-500">保险承保</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-secondary-700">家政服务责任险 · 保额<span className="font-bold text-green-600">50万</span></p>
                  <span className="text-[10px] text-green-600 font-medium">¥{insuranceFee}/单</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2.5 border border-red-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <CircleDollarSign className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] text-secondary-500">爽约赔付规则</span>
                </div>
                <div className="space-y-0.5 text-[10px] text-secondary-600">
                  <p>迟到&gt;30min → 全额退款+30元券</p>
                  <p>未上门 → 全额退款+30元券</p>
                  <p>不达标 → 免费重做或退款</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-primary-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Timer className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-[10px] text-secondary-500 font-medium">预计履约节点</span>
                </div>
                <div className="space-y-0">
                  {timeline.map((node, i) => {
                    const NodeIcon = node.icon;
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                            i === 0 ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-500'
                          )}>
                            <NodeIcon className="w-3 h-3" />
                          </div>
                          {i < timeline.length - 1 && <div className="w-0.5 h-4 bg-gray-200" />}
                        </div>
                        <div className="pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-secondary-800">{node.label}</span>
                            <span className="text-[10px] text-primary-600 font-medium">{node.time}</span>
                          </div>
                          <p className="text-[10px] text-secondary-400">{node.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {dispatchQueue.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-secondary-800">动态加权派单队列</h3>
                  <p className="text-[9px] text-secondary-400">距离40%+好评50%+投诉率10% 综合排序</p>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary-100 text-secondary-600">
                共{dispatchQueue.length}位
              </span>
            </div>
            <div className="space-y-1.5">
              {dispatchQueue.map((w, i) => {
                const isTop = i === 0;
                const isSelected = selectedWorkerId === w.id;
                const satColor = w.satisfaction_rate && w.satisfaction_rate >= 97 ? 'text-green-600' : w.satisfaction_rate && w.satisfaction_rate >= 93 ? 'text-yellow-600' : 'text-orange-600';
                const complColor = w.complaint_rate && w.complaint_rate <= 1 ? 'text-green-600' : w.complaint_rate && w.complaint_rate <= 2.5 ? 'text-yellow-600' : 'text-red-600';
                return (
                  <div
                    key={w.id}
                    className={cn(
                      'flex items-center gap-2.5 p-2 rounded-xl transition-colors',
                      isSelected ? 'bg-primary-50 border-2 border-primary-300 ring-2 ring-primary-100' :
                      isTop ? 'bg-orange-50 border border-orange-100' : 'bg-cream-100 border border-transparent hover:border-gray-200'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={w.avatar} alt={w.real_name} className="w-9 h-9 rounded-full bg-secondary-100" />
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white',
                        isSelected ? 'bg-primary-500' :
                        isTop ? 'bg-orange-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-secondary-300'
                      )}>
                        {isSelected ? '✓' : i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-secondary-800">{w.real_name}</span>
                        {isTop && !isSelected && <span className="text-[8px] px-1 py-0 rounded bg-orange-200 text-orange-700 font-medium">优先派单</span>}
                        {isSelected && <span className="text-[8px] px-1 py-0 rounded bg-primary-200 text-primary-700 font-medium">已选</span>}
                        <span className="text-[9px] text-secondary-400">·{w.experience_years}年</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px]">
                        <span className="text-blue-600">{w.distance_km}km</span>
                        <span className="text-secondary-300">|</span>
                        <span className={satColor}>好评{w.satisfaction_rate}%</span>
                        <span className="text-secondary-300">|</span>
                        <span className={complColor}>投诉{w.complaint_rate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-orange-600">{(w.weighted_score || 90).toFixed(1)}</p>
                        <p className="text-[8px] text-secondary-400">综合分</p>
                      </div>
                      <button
                        onClick={() => setSelectedWorkerId(isSelected ? null : w.id!)}
                        className={cn(
                          'text-[9px] px-1.5 py-1 rounded-md font-medium transition-colors',
                          isSelected ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                        )}
                      >
                        {isSelected ? '取消' : '选择'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 grid grid-cols-3 gap-1.5 text-[9px]">
              <div className="text-center px-1.5 py-1 rounded-md bg-blue-50">
                <p className="text-blue-600 font-bold text-[11px]">40%</p>
                <p className="text-secondary-500">距离权重</p>
              </div>
              <div className="text-center px-1.5 py-1 rounded-md bg-green-50">
                <p className="text-green-600 font-bold text-[11px]">50%</p>
                <p className="text-secondary-500">好评权重</p>
              </div>
              <div className="text-center px-1.5 py-1 rounded-md bg-red-50">
                <p className="text-red-600 font-bold text-[11px]">10%</p>
                <p className="text-secondary-500">投诉权重</p>
              </div>
            </div>
          </div>
        )}

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

const nodeIconMap: Record<string, typeof CheckCircle> = {
  order_created: Zap,
  assigned: Navigation,
  accepted: CheckCircle,
  departing: MapPin,
  arrived: Navigation,
  servicing: Sparkles,
  completed: CheckCircle,
};

function OrderSuccessView({
  orderId,
  order,
  realNodes,
  realInsurance,
  currentService,
  selectedAddress,
  totalFee,
  duration,
  time,
  dateStr,
  navigate,
  onReset,
}: {
  orderId: number;
  order: import('@/types').Order | null;
  realNodes: import('@/types').ServiceNode[];
  realInsurance: import('@/types').InsuranceInfo | null;
  currentService: { label: string; price: number };
  selectedAddress: import('@/types').Address | null;
  totalFee: number;
  duration: number;
  time: string;
  dateStr: string;
  navigate: (path: string) => void;
  onReset: () => void;
}) {
  const advanceOrderStatus = useAppStore((state) => state.advanceOrderStatus);
  const [liveOrder, setLiveOrder] = useState(order);
  const [autoAdvancing, setAutoAdvancing] = useState(true);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoAdvancing || !liveOrder) return;
    if (['completed', 'cancelled', 'compensated'].includes(liveOrder.status)) {
      setAutoAdvancing(false);
      return;
    }
    autoTimerRef.current = setTimeout(() => {
      const updated = advanceOrderStatus(orderId);
      if (updated) {
        setLiveOrder(updated);
      } else {
        setAutoAdvancing(false);
      }
    }, 2000);
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [liveOrder, autoAdvancing, orderId, advanceOrderStatus]);

  const displayNodes = liveOrder?.nodes || realNodes;
  const displayStatus = liveOrder?.status || order?.status;
  const displayInsurance = liveOrder?.insurance || realInsurance;

  const statusLabelMap: Record<string, string> = {
    assigned: '已派单 · 等待阿姨接单',
    accepted: '阿姨已接单 · 准备出发',
    departing: '阿姨已出发 · 正在赶来',
    arrived: '阿姨已到达 · 即将开始服务',
    servicing: '服务进行中',
    completed: '服务已完成',
  };

  return (
    <div className="py-4 animate-fade-up">
      <div className="text-center mb-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-secondary-800">下单成功！履约单据已生成</h3>
        <p className="text-[10px] text-secondary-500 mt-0.5">订单号 #{orderId}</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-full text-xs mx-auto w-fit',
          displayStatus === 'completed' ? 'bg-green-50 text-green-700' : 'bg-primary-50 text-primary-700'
        )}>
          <Navigation className="w-3.5 h-3.5" />
          {displayStatus ? (statusLabelMap[displayStatus] || '处理中') : '派单中...'}
          {autoAdvancing && displayStatus !== 'completed' && (
            <span className="inline-block w-2.5 h-2.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <FileCheck className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs font-bold text-secondary-800">履约单据</span>
            <span className="text-[9px] text-secondary-400 ml-auto">{displayNodes.length}个节点已记录</span>
          </div>
          <div className="space-y-0">
            {displayNodes.map((node, i) => {
              const isDone = i < displayNodes.length - 1 || displayStatus === 'completed';
              const isCurrent = !isDone && i === displayNodes.length - 1;
              const Icon = nodeIconMap[node.node_type] || CheckCircle;
              return (
                <div key={node.id} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                      isDone ? 'bg-primary-500 text-white' : isCurrent ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300 animate-pulse' : 'bg-gray-100 text-gray-400'
                    )}>
                      <Icon className="w-3 h-3" />
                    </div>
                    {i < displayNodes.length - 1 && (
                      <div className={cn('w-0.5 h-5', isDone ? 'bg-primary-300' : 'bg-gray-200')} />
                    )}
                  </div>
                  <div className="pb-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[11px] font-medium', isDone ? 'text-secondary-800' : isCurrent ? 'text-primary-600' : 'text-gray-400')}>
                        {node.node_label}
                      </span>
                      {isCurrent && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 animate-pulse">当前</span>}
                      {isDone && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-secondary-400">
                      <span>{node.node_time.slice(11, 16)}</span>
                      {node.remark && <span>· {node.remark}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {displayInsurance && (
          <div className="card p-3 bg-gradient-to-br from-green-50 to-blue-50 border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-800">保险已自动承保</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-200 text-green-800 ml-auto">生效中</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className="bg-white/80 rounded-lg p-1.5">
                <p className="text-secondary-400">保单号</p>
                <p className="font-mono text-secondary-800 font-medium truncate">{displayInsurance.policy_no.slice(-10)}</p>
              </div>
              <div className="bg-white/80 rounded-lg p-1.5">
                <p className="text-secondary-400">保额</p>
                <p className="font-bold text-green-700">{(displayInsurance.coverage_amount / 10000).toFixed(0)}万</p>
              </div>
              <div className="bg-white/80 rounded-lg p-1.5">
                <p className="text-secondary-400">保费</p>
                <p className="font-bold text-secondary-700">¥{displayInsurance.premium}/单</p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-3 bg-gradient-to-r from-red-50 to-orange-50 border-red-100">
          <div className="flex items-start gap-2">
            <CircleDollarSign className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-800">爽约赔付保障已激活</p>
              <p className="text-[10px] text-red-600 mt-0.5">
                迟到&gt;30min/未上门 → 全额退款+30元券 · 24h自动到账
              </p>
            </div>
          </div>
        </div>

        <div className="card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Receipt className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs font-bold text-secondary-800">费用明细</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-secondary-600">
              <span>{currentService.label} × {duration}小时</span>
              <span>¥{totalFee - 2}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" />家政服务责任险</span>
              <span>¥2</span>
            </div>
            <div className="flex justify-between font-bold text-secondary-800 pt-1 border-t border-dashed border-gray-200">
              <span>合计</span>
              <span className="text-primary-600">¥{totalFee}</span>
            </div>
          </div>
        </div>

        {selectedAddress && (
          <div className="card p-3">
            <div className="flex items-start gap-2 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-secondary-800">{selectedAddress.name}</p>
                <p className="text-secondary-500">{selectedAddress.detail}</p>
                <p className="text-secondary-400 mt-0.5">{dateStr} {time} · {duration}小时</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => navigate(`/orders/${orderId}`)} className="btn-primary text-sm flex-1">
          查看履约单据
        </button>
        <button onClick={onReset} className="btn-secondary text-sm flex-1">
          继续下单
        </button>
      </div>
    </div>
  );
}
