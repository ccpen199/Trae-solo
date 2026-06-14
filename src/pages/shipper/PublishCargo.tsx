import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertTriangle,
  Thermometer,
  Ruler,
  Scale,
  Clock,
  User,
  Phone,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { calculatePrice } from '@/utils/pricing';
import { tempControlMap, difficultyMap, formatMoney, formatVolume, formatWeight, genOrderNo, formatTime } from '@/utils/format';
import type { CargoStop, CargoOrder, TempControl, LoadingDifficulty, InsuranceInfo } from '@/types';

interface StopForm {
  address: string;
  contactName: string;
  contactPhone: string;
}

const TEMP_CONTROLS: TempControl[] = ['NORMAL', 'FRESH', 'REFRIGERATED', 'DEEP_FREEZE'];
const DIFFICULTIES: LoadingDifficulty[] = ['LOW', 'MEDIUM', 'HIGH'];

function Stepper({ step }: { step: number }) {
  const steps = [
    { n: 1, label: '货物信息' },
    { n: 2, label: '配送信息' },
    { n: 3, label: '确认发布' },
  ];
  return (
    <div className="flex items-center gap-3 mb-8">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-sm font-display text-sm font-bold border transition-all ${
                  done
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : active
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-glow-orange-sm'
                      : 'bg-ink-800 border-ink-600 text-slate-500'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <div>
                <div className={`text-sm font-semibold ${active ? 'text-white' : done ? 'text-slate-300' : 'text-slate-500'}`}>
                  {s.label}
                </div>
                <div className="text-xs text-slate-600 font-mono">STEP 0{s.n}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-emerald-500/40' : 'bg-ink-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Slider({
  label,
  icon: Icon,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Icon className="w-4 h-4 text-orange-400" />
          {label}
        </div>
        <div className="font-display text-orange-400 font-bold">
          {value.toFixed(step < 1 ? 1 : 0)}
          <span className="text-xs text-slate-500 font-mono ml-1">{unit}</span>
        </div>
      </div>
      <div className="relative h-9 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-ink-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #EA580C 0%, #F97316 100%)',
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="absolute inset-x-0 w-full h-9 appearance-none bg-transparent cursor-pointer z-10"
          style={{
            WebkitAppearance: 'none',
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px; height: 18px; border-radius: 50%;
            background: #F97316;
            border: 2px solid #0F172A;
            box-shadow: 0 0 0 2px #F97316, 0 0 12px rgba(249,115,22,0.5);
            cursor: grab;
          }
          input[type=range]::-moz-range-thumb {
            width: 18px; height: 18px; border-radius: 50%;
            background: #F97316;
            border: 2px solid #0F172A;
            box-shadow: 0 0 0 2px #F97316;
            cursor: grab;
          }
        `}</style>
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-600 font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function StopCard({
  title,
  index,
  data,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  draggable,
  type,
}: {
  title: string;
  index: number;
  data: StopForm;
  onChange: (d: StopForm) => void;
  onRemove?: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  draggable?: boolean;
  type: 'pickup' | 'delivery';
}) {
  const color = type === 'pickup' ? 'text-orange-400' : 'text-cyan-400';
  const border = type === 'pickup' ? 'border-orange-500/30' : 'border-cyan-500/30';
  const bg = type === 'pickup' ? 'bg-orange-500/5' : 'bg-cyan-500/5';
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`industrial-card p-4 ${bg} ${border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {draggable && (
            <GripVertical className="w-4 h-4 text-slate-600 cursor-grab hover:text-slate-400" />
          )}
          <div className={`w-1.5 h-1.5 rounded-full ${type === 'pickup' ? 'bg-orange-500' : 'bg-cyan-500'} animate-pulse`} />
          <span className={`text-sm font-semibold ${color}`}>{title}</span>
          {draggable && <span className="hex-tag">#{index}</span>}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-2.5">
        <div className="flex items-start gap-2">
          <MapPin className={`w-4 h-4 mt-2.5 ${color} shrink-0`} />
          <input
            type="text"
            placeholder="详细地址..."
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className="input-industrial"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <User className={`w-4 h-4 ${color} shrink-0`} />
            <input
              type="text"
              placeholder="联系人"
              value={data.contactName}
              onChange={(e) => onChange({ ...data, contactName: e.target.value })}
              className="input-industrial"
            />
          </div>
          <div className="flex items-center gap-2">
            <Phone className={`w-4 h-4 ${color} shrink-0`} />
            <input
              type="tel"
              placeholder="联系电话"
              value={data.contactPhone}
              onChange={(e) => onChange({ ...data, contactPhone: e.target.value })}
              className="input-industrial"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublishCargo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { publishOrder, init } = useOrderStore();

  const [step, setStep] = useState(1);
  const [expandDetails, setExpandDetails] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [cargoName, setCargoName] = useState('生鲜果蔬');
  const [volume, setVolume] = useState(8.5);
  const [weight, setWeight] = useState(1500);
  const [tempControl, setTempControl] = useState<TempControl>('FRESH');
  const [loadingDifficulty, setLoadingDifficulty] = useState<LoadingDifficulty>('MEDIUM');
  const [cargoValue, setCargoValue] = useState(25000);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);

  const [pickup, setPickup] = useState<StopForm>({
    address: '上海市浦东新区张江高科技园区博云路2号',
    contactName: '仓库张主管',
    contactPhone: '13812345678',
  });
  const [deliveries, setDeliveries] = useState<StopForm[]>([
    { address: '上海市黄浦区南京东路300号恒基名人购物中心', contactName: '李经理', contactPhone: '13987654321' },
    { address: '上海市静安区南京西路1788号国际中心', contactName: '王主任', contactPhone: '13911112222' },
  ]);

  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [pickupEndDate, setPickupEndDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 4);
    return d.toISOString().slice(0, 16);
  });

  const stops: CargoStop[] = useMemo(() => {
    const result: CargoStop[] = [
      {
        seq: 1,
        type: 'PICKUP',
        address: pickup.address,
        contactName: pickup.contactName,
        contactPhone: pickup.contactPhone,
        lat: 31.2050 + Math.random() * 0.01 - 0.005,
        lng: 121.5970 + Math.random() * 0.01 - 0.005,
      },
    ];
    deliveries.forEach((d, i) => {
      result.push({
        seq: i + 2,
        type: 'DELIVERY',
        address: d.address,
        contactName: d.contactName,
        contactPhone: d.contactPhone,
        lat: 31.1773 + Math.random() * 0.15 - 0.05,
        lng: 121.3800 + Math.random() * 0.2 - 0.05,
      });
    });
    return result;
  }, [pickup, deliveries]);

  const insurance: InsuranceInfo = useMemo(() => ({
    enabled: insuranceEnabled,
    premium: insuranceEnabled ? +(cargoValue * 0.003).toFixed(2) : 0,
    coverage: insuranceEnabled ? cargoValue : 0,
    insurer: 'PICC',
    status: 'PENDING',
  }), [insuranceEnabled, cargoValue]);

  const orderForPricing = useMemo(() => ({
    volume,
    weight,
    tempControl,
    loadingDifficulty,
    cargoValue,
    stops,
    insurance,
    pickupTimeWindow: [new Date(pickupDate).toISOString(), new Date(pickupEndDate).toISOString()] as [string, string],
  }), [volume, weight, tempControl, loadingDifficulty, cargoValue, stops, insurance, pickupDate, pickupEndDate]);

  const price = useMemo(() => calculatePrice(orderForPricing), [orderForPricing]);

  const tempRange = useMemo(() => {
    if (tempControl === 'FRESH') return [2, 8] as [number, number];
    if (tempControl === 'REFRIGERATED') return [-22, -14] as [number, number];
    if (tempControl === 'DEEP_FREEZE') return [-35, -25] as [number, number];
    return undefined;
  }, [tempControl]);

  const canStep1 = cargoName.trim().length > 0 && cargoValue > 0;
  const canStep2 = pickup.address.trim() && deliveries.every((d) => d.address.trim()) && pickupDate < pickupEndDate;

  const addDelivery = () => {
    setDeliveries([...deliveries, { address: '', contactName: '', contactPhone: '' }]);
  };

  const removeDelivery = (i: number) => {
    if (deliveries.length <= 1) return;
    setDeliveries(deliveries.filter((_, idx) => idx !== i));
  };

  const handleDrop = (dropIdx: number) => {
    if (dragIndex === null || dragIndex === dropIdx) return;
    const arr = [...deliveries];
    const [moved] = arr.splice(dragIndex, 1);
    arr.splice(dropIdx, 0, moved);
    setDeliveries(arr);
    setDragIndex(null);
  };

  const handlePublish = () => {
    init();
    const orderNo = genOrderNo();
    const newOrder: CargoOrder = {
      id: `ord_${Date.now()}`,
      orderNo,
      shipperId: user?.id ?? 'shipper_demo',
      shipperName: user?.name ?? '货主用户',
      cargoName,
      volume,
      weight,
      tempControl,
      tempRange,
      loadingDifficulty,
      cargoValue,
      stops,
      pickupTimeWindow: [new Date(pickupDate).toISOString(), new Date(pickupEndDate).toISOString()],
      priceBreakdown: price,
      totalPrice: price.total,
      insurance: insuranceEnabled
        ? { ...insurance, policyNo: `PICC${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}` }
        : insurance,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };
    publishOrder(newOrder);
    navigate(`/shipper/orders/${newOrder.id}`);
  };

  const priceItems = [
    { label: '基础运费', value: price.basePrice, hint: '含里程、体积、温控、难度系数' },
    { label: '拥堵溢价', value: price.congestionPremium, hint: '基于实时路况测算' },
    { label: '夜间加成', value: price.nightSurcharge, hint: new Date(pickupDate).getHours() >= 22 || new Date(pickupDate).getHours() < 6 ? '22:00-06:00时段 +15%' : '非夜间时段' },
    { label: '多点配送', value: price.multiStopCoefficient, hint: `${deliveries.length}个送达点` },
    { label: '保险费', value: price.insuranceFee, hint: insuranceEnabled ? `货值 ¥${cargoValue.toLocaleString()} × 0.3%` : '未投保' },
  ];

  return (
    <div className="min-h-screen bg-grid-pattern bg-ink-950">
      <div className="flex gap-6 p-6 max-w-[1600px] mx-auto">
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">发布货源</h1>
              <span className="hex-tag"><Sparkles className="w-3 h-3 mr-1 inline" />智能计价</span>
            </div>
            <p className="text-sm text-slate-500 font-mono">填写以下信息，系统将实时计算最优报价</p>
          </div>

          <Stepper step={step} />

          <div className="industrial-card p-6 corner-brackets">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <Package className="w-4 h-4 mr-2 inline text-orange-400" />
                    货物名称
                  </label>
                  <input
                    type="text"
                    value={cargoName}
                    onChange={(e) => setCargoName(e.target.value)}
                    placeholder="例如：生鲜果蔬、电子配件、医药冷链"
                    className="input-industrial text-base py-2.5"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                  <Slider label="体积" icon={Ruler} value={volume} onChange={setVolume} min={0.5} max={60} step={0.1} unit="m³" />
                  <Slider label="重量" icon={Scale} value={weight} onChange={setWeight} min={50} max={20000} step={50} unit="kg" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      温控要求
                    </label>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {TEMP_CONTROLS.map((tc) => {
                      const cfg = tempControlMap[tc];
                      const active = tempControl === tc;
                      return (
                        <button
                          key={tc}
                          onClick={() => setTempControl(tc)}
                          className={`relative p-4 rounded-sm border transition-all text-left ${
                            active
                              ? 'border-orange-500 bg-orange-500/10 shadow-glow-orange-sm'
                              : 'border-ink-600 bg-ink-800/50 hover:border-slate-500 hover:bg-ink-800'
                          }`}
                        >
                          <div className="text-2xl mb-2">{cfg.icon}</div>
                          <div className={`text-sm font-semibold ${active ? 'text-orange-400' : 'text-slate-200'}`}>{cfg.label}</div>
                          <div className="text-xs text-slate-500 mt-1 font-mono">{tc}</div>
                          {active && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    装卸难度
                  </label>
                  <div className="flex gap-3">
                    {DIFFICULTIES.map((d) => {
                      const cfg = difficultyMap[d];
                      const active = loadingDifficulty === d;
                      return (
                        <label
                          key={d}
                          className={`flex-1 flex items-center gap-3 p-3.5 rounded-sm border cursor-pointer transition-all ${
                            active ? 'border-orange-500 bg-orange-500/10' : 'border-ink-600 bg-ink-800/50 hover:border-slate-500'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-orange-500' : 'border-slate-500'}`}>
                            {active && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          </div>
                          <input
                            type="radio"
                            checked={active}
                            onChange={() => setLoadingDifficulty(d)}
                            className="sr-only"
                          />
                          <div>
                            <div className={`text-sm font-semibold ${cfg.color}`}>难度 {cfg.label}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {d === 'LOW' ? '叉车协助 / 标准托盘' : d === 'MEDIUM' ? '人工搬运 / 楼层' : '大件重物 / 无设备'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-orange-400" />
                    货物价值
                    <span className="text-xs text-slate-500 font-mono ml-2">（用于保险投保）</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-display">¥</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={cargoValue}
                      onChange={(e) => setCargoValue(Math.max(0, +e.target.value))}
                      className="input-industrial pl-8 py-2.5 font-display text-lg text-white"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[5000, 20000, 50000, 100000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setCargoValue(v)}
                        className={`px-3 py-1 text-xs font-mono rounded-sm transition-colors ${
                          cargoValue === v
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                            : 'bg-ink-800 text-slate-400 border border-ink-600 hover:border-slate-500'
                        }`}
                      >
                        ¥{v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    disabled={!canStep1}
                    onClick={() => setStep(2)}
                    className="btn-primary"
                  >
                    下一步 <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <StopCard
                  title="取货点"
                  type="pickup"
                  index={1}
                  data={pickup}
                  onChange={setPickup}
                />

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 via-orange-500/20 to-transparent" />
                  <div className="text-xs text-orange-400 font-mono">配送路线 ↓</div>
                  <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/50 via-cyan-500/20 to-transparent" />
                </div>

                <div className="space-y-3">
                  {deliveries.map((d, i) => (
                    <StopCard
                      key={i}
                      title={`送达点 ${i + 1}`}
                      type="delivery"
                      index={i + 1}
                      data={d}
                      onChange={(nd) => {
                        const arr = [...deliveries];
                        arr[i] = nd;
                        setDeliveries(arr);
                      }}
                      onRemove={deliveries.length > 1 ? () => removeDelivery(i) : undefined}
                      draggable={deliveries.length > 1}
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(i)}
                    />
                  ))}
                </div>

                <button
                  onClick={addDelivery}
                  className="w-full py-3 border-2 border-dashed border-ink-600 rounded-sm text-slate-400 hover:text-orange-400 hover:border-orange-500/50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加送达点（支持拖拽排序）
                </button>

                <div className="industrial-card p-4 bg-ink-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-white">取货时间窗</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-mono">起始时间</label>
                      <input
                        type="datetime-local"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="input-industrial"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-mono">截止时间</label>
                      <input
                        type="datetime-local"
                        value={pickupEndDate}
                        onChange={(e) => setPickupEndDate(e.target.value)}
                        className="input-industrial"
                      />
                    </div>
                  </div>
                  {pickupDate >= pickupEndDate && (
                    <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      截止时间必须晚于起始时间
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4 mr-2" /> 上一步
                  </button>
                  <button disabled={!canStep2} onClick={() => setStep(3)} className="btn-primary">
                    下一步 <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="p-4 industrial-card bg-orange-500/5 border-orange-500/30">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                        insuranceEnabled ? 'bg-orange-500 border-orange-500' : 'border-slate-500'
                      }`}>
                        {insuranceEnabled && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={insuranceEnabled}
                        onChange={(e) => setInsuranceEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-semibold text-white">中国人保 货物运输险</span>
                          <span className="hex-tag">PICC</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1.5 font-mono leading-relaxed">
                          费率 0.3% · 保额 ¥{cargoValue.toLocaleString()} · 保费 <span className="text-orange-400 font-display">{formatMoney(+(cargoValue * 0.003).toFixed(2))}</span>
                          <br />保障范围：交通意外、火灾、盗抢、雨淋破损
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="industrial-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">货物信息</h3>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">货物名称</span><span className="text-slate-200">{cargoName}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">体积 / 重量</span><span className="font-mono text-slate-200">{formatVolume(volume)} / {formatWeight(weight)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">温控类型</span><span className="text-slate-200">{tempControlMap[tempControl].icon} {tempControlMap[tempControl].label}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">装卸难度</span><span className={difficultyMap[loadingDifficulty].color}>{difficultyMap[loadingDifficulty].label}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">货物价值</span><span className="font-display text-orange-400">¥{cargoValue.toLocaleString()}</span></div>
                    </div>
                  </div>

                  <div className="industrial-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">时间信息</h3>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">取货开始</span><span className="font-mono text-slate-200">{formatTime(new Date(pickupDate).toISOString())}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">取货截止</span><span className="font-mono text-slate-200">{formatTime(new Date(pickupEndDate).toISOString())}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">送达点数</span><span className="text-slate-200">{deliveries.length} 个</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">保险投保</span><span className={insuranceEnabled ? 'text-emerald-400' : 'text-slate-500'}>{insuranceEnabled ? '已投保' : '未投保'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="industrial-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">配送路线预览</h3>
                  </div>
                  <div className="space-y-0">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-500 shadow-glow-orange-sm mt-1.5" />
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-orange-500/60 to-cyan-500/60 min-h-[20px]" />
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="text-xs font-mono text-orange-400 mb-0.5">PICKUP · 取货</div>
                        <div className="text-sm text-slate-200">{pickup.address}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{pickup.contactName} · {pickup.contactPhone}</div>
                      </div>
                    </div>
                    {deliveries.map((d, i) => (
                      <div className="flex gap-4" key={i}>
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full border-2 border-cyan-500 bg-ink-900 mt-1.5" />
                          {i < deliveries.length - 1 && (
                            <div className="w-0.5 flex-1 bg-cyan-500/40 min-h-[20px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="text-xs font-mono text-cyan-400 mb-0.5">DROP {String(i + 1).padStart(2, '0')} · 送达</div>
                          <div className="text-sm text-slate-200">{d.address || '（未填写）'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{d.contactName} · {d.contactPhone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep(2)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4 mr-2" /> 修改信息
                  </button>
                  <button onClick={handlePublish} className="btn-primary">
                    <Send className="w-4 h-4 mr-2" /> 确认发布
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-[340px] shrink-0">
          <div className="sticky top-6 space-y-4">
            <div className="industrial-card corner-brackets overflow-hidden">
              <div className="p-5 border-b border-ink-600/60 bg-gradient-to-br from-orange-500/10 to-transparent">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">实时报价</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-display text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-400 leading-none">
                    ¥{price.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-mono">
                    包含税 · 最终以订单确认为准
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExpandDetails(!expandDetails)}
                className="w-full px-5 py-3 flex items-center justify-between text-sm text-slate-300 hover:bg-ink-800/50 transition-colors border-b border-ink-600/60"
              >
                <span className="font-semibold">费用明细</span>
                {expandDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandDetails && (
                <div className="p-4 space-y-3">
                  {priceItems.map((it) => (
                    <div key={it.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{it.label}</span>
                        <span className={`font-display font-semibold ${it.value > 0 ? 'text-slate-200' : 'text-slate-600'}`}>
                          {it.value > 0 ? `+¥${it.value.toFixed(2)}` : '¥0.00'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 font-mono pl-1">{it.hint}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 border-t border-ink-600/60 space-y-2 bg-ink-900/80">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">匹配时效</span>
                  <span className="text-emerald-400 font-mono">平均 3-8 分钟</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">预计车型</span>
                  <span className="text-slate-300">{volume > 35 ? '9.6米重卡' : volume > 14 ? '6.8米厢货' : volume > 5 ? '4.2米厢货' : '面包车'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">履约保障</span>
                  <span className="text-orange-400 font-mono">货损必赔</span>
                </div>
              </div>
            </div>

            <div className="industrial-card p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <div className="text-yellow-400 font-semibold mb-1">温馨提示</div>
                  发布后系统将自动推送最优司机候选，匹配成功后可在订单详情查看实时位置。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
