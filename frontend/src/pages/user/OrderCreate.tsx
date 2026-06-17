import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  ArrowLeft,
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
  MapPin,
  User,
  Phone,
  Home,
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Coins,
  Calculator,
  CreditCard,
  CheckCircle2,
  ListPlus,
  Store,
  FileText,
  Key,
  Timer,
  Map,
  Users,
  Shield,
  AlertTriangle,
  ChevronDown,
  MapPinHouse,
  Activity,
  Gauge,
} from 'lucide-react';
import { ORDER_CATEGORIES, CITIES } from '../../constants';
import type { OrderCategory } from '../../types';
import { userApi } from '../../services/user.api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const categoryIconMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
};

type StepKey = 'category' | 'address' | 'goods' | 'price' | 'submit';

const steps: { key: StepKey; label: string }[] = [
  { key: 'category', label: '选择品类' },
  { key: 'address', label: '填写地址' },
  { key: 'goods', label: '商品信息' },
  { key: 'price', label: '价格预估' },
  { key: 'submit', label: '提交订单' },
];

const CITY_PRICING: Record<string, { baseFee: number; perKm: number; minFee: number }> = {
  '北京': { baseFee: 8, perKm: 2.5, minFee: 12 },
  '上海': { baseFee: 8, perKm: 2.5, minFee: 12 },
  '广州': { baseFee: 7, perKm: 2.0, minFee: 10 },
  '深圳': { baseFee: 7, perKm: 2.0, minFee: 10 },
  '杭州': { baseFee: 6, perKm: 1.8, minFee: 9 },
  '成都': { baseFee: 6, perKm: 1.5, minFee: 8 },
  '南京': { baseFee: 6, perKm: 1.8, minFee: 9 },
  '武汉': { baseFee: 6, perKm: 1.8, minFee: 9 },
  '西安': { baseFee: 6, perKm: 1.5, minFee: 8 },
  '天津': { baseFee: 7, perKm: 2.0, minFee: 10 },
};

const CATEGORY_MULTIPLIER: Record<OrderCategory, number> = {
  buy: 1.2,
  send: 1.0,
  fetch: 0.8,
  errand: 1.5,
};

const CATEGORY_LABELS: Record<OrderCategory, { goods: string; pickup: string; delivery: string }> = {
  buy: { goods: '代购商品', pickup: '商家地址', delivery: '送达地址' },
  send: { goods: '寄送物品', pickup: '取件地址', delivery: '送达地址' },
  fetch: { goods: '取件信息', pickup: '快递点', delivery: '收件地址' },
  errand: { goods: '办事事项', pickup: '办事地点', delivery: '送达地址' },
};

const SERVICE_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '天津'];

const CAPACITY_STATUS: Record<string, { status: 'sufficient' | 'tight' | 'insufficient'; label: string; dot: string }> = {
  '北京': { status: 'sufficient', label: '运力充足', dot: 'bg-green-500' },
  '上海': { status: 'sufficient', label: '运力充足', dot: 'bg-green-500' },
  '广州': { status: 'sufficient', label: '运力充足', dot: 'bg-green-500' },
  '深圳': { status: 'tight', label: '运力紧张', dot: 'bg-yellow-500' },
  '杭州': { status: 'tight', label: '运力紧张', dot: 'bg-yellow-500' },
  '成都': { status: 'insufficient', label: '运力不足', dot: 'bg-red-500' },
  '南京': { status: 'tight', label: '运力紧张', dot: 'bg-yellow-500' },
  '武汉': { status: 'tight', label: '运力紧张', dot: 'bg-yellow-500' },
  '西安': { status: 'insufficient', label: '运力不足', dot: 'bg-red-500' },
  '天津': { status: 'tight', label: '运力紧张', dot: 'bg-yellow-500' },
};

interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderFormData {
  category: OrderCategory;
  city: string;
  distance: number;
  pickupName: string;
  pickupPhone: string;
  pickupAddress: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  goodsDescription: string;
  weight: number;
  goodsValue: number;
  remark: string;
  isUrgent: boolean;
  isInsured: boolean;
  tip: number;
  payMethod: 'wechat' | 'alipay' | 'balance';
  purchaseItems: PurchaseItem[];
  shopName: string;
  shopAddress: string;
  isConfidential: boolean;
  pickupCode: string;
  expressType: string;
  errandDescription: string;
  errandDuration: string;
  specialRequirements: string;
}

const defaultValues: OrderFormData = {
  category: 'buy',
  city: '北京',
  distance: 3.2,
  pickupName: '',
  pickupPhone: '',
  pickupAddress: '',
  deliveryName: '',
  deliveryPhone: '',
  deliveryAddress: '',
  goodsDescription: '',
  weight: 1,
  goodsValue: 0,
  remark: '',
  isUrgent: false,
  isInsured: false,
  tip: 0,
  payMethod: 'wechat',
  purchaseItems: [{ name: '', quantity: 1, price: 0 }],
  shopName: '',
  shopAddress: '',
  isConfidential: false,
  pickupCode: '',
  expressType: '',
  errandDescription: '',
  errandDuration: '1h',
  specialRequirements: '',
};

const commonAddresses = [
  { id: '1', label: '家', icon: Home, name: '张三', phone: '138****8888', address: '北京市朝阳区望京SOHO T1 1201室' },
  { id: '2', label: '公司', icon: Building2, name: '张三', phone: '138****8888', address: '北京市海淀区中关村软件园二期 8号楼' },
];

const DURATION_OPTIONS = [
  { value: '1h', label: '1小时' },
  { value: '2h', label: '2小时' },
  { value: '3h', label: '3小时' },
  { value: 'half', label: '半天' },
  { value: 'full', label: '全天' },
];

const getReferencePrice = (city: string, catKey: OrderCategory) => {
  const pricing = CITY_PRICING[city] || CITY_PRICING['北京'];
  const multiplier = CATEGORY_MULTIPLIER[catKey];
  return Math.ceil(pricing.baseFee * multiplier);
};

const getCapacityInfo = (city: string) => {
  return CAPACITY_STATUS[city] || { status: 'tight' as const, label: '运力紧张', dot: 'bg-yellow-500' };
};

export default function OrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<StepKey>('category');
  const [submitting, setSubmitting] = useState(false);
  const [pickupAddressesOpen, setPickupAddressesOpen] = useState(false);
  const [deliveryAddressesOpen, setDeliveryAddressesOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderFormData>({ defaultValues });

  const category = watch('category');
  const city = watch('city');
  const distance = watch('distance');
  const weight = watch('weight');
  const goodsValue = watch('goodsValue');
  const isUrgent = watch('isUrgent');
  const isInsured = watch('isInsured');
  const tip = watch('tip');
  const pickupAddress = watch('pickupAddress');
  const deliveryAddress = watch('deliveryAddress');
  const purchaseItems = watch('purchaseItems');

  useEffect(() => {
    const urlCategory = searchParams.get('category') as OrderCategory;
    if (urlCategory && ORDER_CATEGORIES.some((c) => c.key === urlCategory)) {
      setValue('category', urlCategory);
      setCurrentStep('address');
    }
  }, [searchParams, setValue]);

  const priceBreakdown = useMemo(() => {
    const pricing = CITY_PRICING[city] || CITY_PRICING['北京'];
    const multiplier = CATEGORY_MULTIPLIER[category];
    const baseFee = Math.ceil(pricing.baseFee * multiplier);
    const distanceFee = Math.round(distance * pricing.perKm);
    const weightFee = Math.max(0, (weight - 1) * 2);
    const urgentFee = isUrgent ? 5 : 0;
    const insuredFee = isInsured ? Math.ceil(goodsValue * 0.01) : 0;
    const total = Math.max(pricing.minFee, baseFee + distanceFee + weightFee + urgentFee + insuredFee + tip);
    return {
      baseFee,
      distanceFee,
      weightFee,
      urgentFee,
      insuredFee,
      tip,
      total,
    };
  }, [category, city, distance, weight, goodsValue, isUrgent, isInsured, tip]);

  const purchaseTotal = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [purchaseItems]);

  const isGeoFenced = useMemo(() => {
    const addresses = [pickupAddress, deliveryAddress].filter(Boolean);
    if (addresses.length === 0) return null;
    return addresses.every((addr) => SERVICE_CITIES.some((c) => addr.includes(c)));
  }, [pickupAddress, deliveryAddress]);

  const capacityInfo = useMemo(() => getCapacityInfo(city), [city]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSelectCategory = (catKey: OrderCategory) => {
    if (category !== catKey) {
      reset({
        ...defaultValues,
        category: catKey,
        city,
        distance: 3.2,
      });
    }
    setTimeout(handleNext, 150);
  };

  const handleSelectCity = (cityName: string) => {
    setValue('city', cityName);
    setCityDropdownOpen(false);
  };

  const handleSelectPickupAddress = (addr: (typeof commonAddresses)[number]) => {
    setValue('pickupName', addr.name);
    setValue('pickupPhone', addr.phone);
    setValue('pickupAddress', addr.address);
    setPickupAddressesOpen(false);
  };

  const handleSelectDeliveryAddress = (addr: (typeof commonAddresses)[number]) => {
    setValue('deliveryName', addr.name);
    setValue('deliveryPhone', addr.phone);
    setValue('deliveryAddress', addr.address);
    setDeliveryAddressesOpen(false);
  };

  const addPurchaseItem = () => {
    const items = [...purchaseItems, { name: '', quantity: 1, price: 0 }];
    setValue('purchaseItems', items);
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length <= 1) return;
    const items = purchaseItems.filter((_, i) => i !== index);
    setValue('purchaseItems', items);
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const items = [...purchaseItems];
    items[index] = { ...items[index], [field]: value };
    setValue('purchaseItems', items);
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      setSubmitting(true);
      let description = data.goodsDescription;
      if (data.category === 'buy') {
        const itemsStr = data.purchaseItems.map((i) => `${i.name} x${i.quantity}`).join('、');
        description = `代购: ${itemsStr}${data.shopName ? ` (商家: ${data.shopName})` : ''}`;
      } else if (data.category === 'fetch') {
        description = `取件码: ${data.pickupCode}${data.expressType ? ` | 快递类型: ${data.expressType}` : ''}`;
      } else if (data.category === 'errand') {
        description = data.errandDescription;
      }
      const result = await userApi.createOrder({
        category: data.category,
        title: ORDER_CATEGORIES.find((c) => c.key === data.category)?.name || '跑腿订单',
        description,
        pickupAddress: data.pickupAddress,
        pickupLocation: { lat: 39.9042, lng: 116.4074 },
        pickupName: data.pickupName,
        pickupPhone: data.pickupPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryLocation: { lat: 39.9142, lng: 116.4174 },
        deliveryName: data.deliveryName,
        deliveryPhone: data.deliveryPhone,
        weight: data.weight,
        goodsValue: data.goodsValue,
        tip: data.tip,
      });
      navigate(`/orders/${result.id}`);
    } catch (error) {
      console.error('创建订单失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = ORDER_CATEGORIES.find((c) => c.key === category);
  const categoryLabels = CATEGORY_LABELS[category];

  const renderCitySelector = () => (
    <div className="relative">
      <button
        onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <MapPinHouse className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{city}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
      </button>
      {cityDropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {CITIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleSelectCity(c.name)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                city === c.name
                  ? 'bg-brand-50 text-brand-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderPickupCard = (
    iconBg: string,
    iconColor: string,
    IconComponent: React.FC<{ className?: string }>,
    label: string,
  ) => (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
          <IconComponent className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="font-medium text-gray-800">{label}</span>
      </div>

      <div className="mb-3">
        <button
          onClick={() => setPickupAddressesOpen(!pickupAddressesOpen)}
          className="text-sm text-brand-600 flex items-center gap-1"
        >
          选择常用地址
          <ChevronRight className={`w-4 h-4 transition-transform ${pickupAddressesOpen ? 'rotate-90' : ''}`} />
        </button>
        {pickupAddressesOpen && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {commonAddresses.map((addr) => {
              const AddrIcon = addr.icon;
              return (
                <button
                  key={addr.id}
                  onClick={() => handleSelectPickupAddress(addr)}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-brand-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <AddrIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{addr.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{addr.address}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Controller
          name="pickupName"
          control={control}
          rules={{ required: '请填写姓名' }}
          render={({ field }) => (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...field}
                placeholder="联系人姓名"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        />
        <Controller
          name="pickupPhone"
          control={control}
          rules={{ required: '请填写联系电话' }}
          render={({ field }) => (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...field}
                placeholder="联系电话"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        />
        <Controller
          name="pickupAddress"
          control={control}
          rules={{ required: '请填写详细地址' }}
          render={({ field }) => (
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                {...field}
                rows={2}
                placeholder="详细地址：街道、门牌号、楼层等"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />
      </div>
    </Card>
  );

  const renderDeliveryCard = () => (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-brand-600" />
        </div>
        <span className="font-medium text-gray-800">{categoryLabels.delivery}</span>
      </div>

      <div className="mb-3">
        <button
          onClick={() => setDeliveryAddressesOpen(!deliveryAddressesOpen)}
          className="text-sm text-brand-600 flex items-center gap-1"
        >
          选择常用地址
          <ChevronRight className={`w-4 h-4 transition-transform ${deliveryAddressesOpen ? 'rotate-90' : ''}`} />
        </button>
        {deliveryAddressesOpen && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {commonAddresses.map((addr) => {
              const AddrIcon = addr.icon;
              return (
                <button
                  key={addr.id}
                  onClick={() => handleSelectDeliveryAddress(addr)}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-brand-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <AddrIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{addr.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{addr.address}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Controller
          name="deliveryName"
          control={control}
          rules={{ required: '请填写收件人姓名' }}
          render={({ field }) => (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...field}
                placeholder="收件人姓名"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        />
        <Controller
          name="deliveryPhone"
          control={control}
          rules={{ required: '请填写收件人电话' }}
          render={({ field }) => (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...field}
                placeholder="收件人电话"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        />
        <Controller
          name="deliveryAddress"
          control={control}
          rules={{ required: '请填写送达详细地址' }}
          render={({ field }) => (
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                {...field}
                rows={2}
                placeholder="详细地址：街道、门牌号、楼层等"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />
      </div>
    </Card>
  );

  const renderGeoFence = () => {
    if (isGeoFenced === null) return null;
    if (isGeoFenced) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-700">该地址在服务范围内 ✓</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-sm text-amber-700">该地址超出服务范围，可能无法接单 ⚠️</span>
      </div>
    );
  };

  const renderValidationInfo = () => {
    const capacityData = getCapacityInfo(city);
    return (
      <Card className="mb-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">
              服务城市：<span className="font-medium">{city}</span>（已开通）
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isGeoFenced === true ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">地理围栏：地址在服务范围内</span>
              </>
            ) : isGeoFenced === false ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm text-amber-600">地理围栏：该地址超出常规服务范围，可能加收远程费或无法接单</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">地理围栏：请填写地址后校验</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">
              品类：<span className="font-medium">{selectedCategory?.name}</span>（{CATEGORY_MULTIPLIER[category]}倍计价）
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="text-sm text-gray-700">
              运力：当前区域<span className="font-medium">12名</span>骑手在线，预计<span className="font-medium">3分钟</span>接单
              <span className={`inline-block w-2 h-2 rounded-full ml-1.5 ${capacityData.dot}`} />
            </span>
          </div>
        </div>
      </Card>
    );
  };

  const renderRouteMap = () => (
    <div className="relative h-32 bg-gradient-to-br from-brand-50 to-green-50 rounded-2xl overflow-hidden border border-gray-100">
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="absolute left-[20%] top-[60%]">
        <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center">
          <Package className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="absolute right-[20%] top-[30%]">
        <div className="w-6 h-6 rounded-full bg-brand-500 border-2 border-white shadow-lg flex items-center justify-center">
          <MapPin className="w-3 h-3 text-white" />
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full">
        <path
          d="M 20% 60% Q 40% 20%, 80% 30%"
          stroke="#1E88E5"
          strokeWidth="3"
          strokeDasharray="6 4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600">
        约 {distance} 公里 · 预计 {Math.round(distance * 8)} 分钟
      </div>
    </div>
  );

  const renderGoodsBuy = () => (
    <Card>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <ListPlus className="w-4 h-4 text-brand-500" />
            购买商品清单
          </label>
          {purchaseItems.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                value={item.name}
                onChange={(e) => updatePurchaseItem(index, 'name', e.target.value)}
                placeholder="商品名称"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 1)}
                placeholder="数量"
                className="w-16 px-2 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-center"
              />
              <input
                type="number"
                value={item.price || ''}
                onChange={(e) => updatePurchaseItem(index, 'price', parseFloat(e.target.value) || 0)}
                placeholder="单价"
                className="w-20 px-2 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-center"
              />
              {purchaseItems.length > 1 && (
                <button
                  onClick={() => removePurchaseItem(index)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addPurchaseItem}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-1"
          >
            <ListPlus className="w-4 h-4" />
            添加商品
          </button>
        </div>

        <Controller
          name="shopName"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-brand-500" />
                商家名称
              </label>
              <input
                {...field}
                placeholder="如：星巴克望京店"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        />

        {purchaseTotal > 0 && (
          <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">预估商品总价</span>
              <span className="font-semibold text-brand-700">¥{purchaseTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">代购费</span>
              <span className="font-semibold text-brand-700">¥{priceBreakdown.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Controller
          name="remark"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
              <textarea
                {...field}
                rows={2}
                placeholder="特殊要求、口味偏好等"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />
      </div>
    </Card>
  );

  const renderGoodsSend = () => (
    <Card>
      <div className="space-y-4">
        <Controller
          name="goodsDescription"
          control={control}
          rules={{ required: '请描述寄送物品' }}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-yellow-600" />
                物品描述
              </label>
              <textarea
                {...field}
                rows={3}
                placeholder="请描述物品的名称、数量、包装等信息"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
              {errors.goodsDescription && (
                <p className="mt-1 text-sm text-red-500">{errors.goodsDescription.message}</p>
              )}
            </div>
          )}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">物品重量</label>
            <span className="text-sm font-semibold text-brand-600">{weight} kg</span>
          </div>
          <Controller
            name="weight"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <input
                  type="range"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={field.value}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0.5kg</span>
                  <span>10kg</span>
                  <span>20kg</span>
                </div>
              </div>
            )}
          />
        </div>

        <Controller
          name="goodsValue"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">物品价值 (元)</label>
              <input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                placeholder="选填，用于保价计算"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}
        />

        <Controller
          name="isConfidential"
          control={control}
          render={({ field }) => (
            <button
              onClick={() => field.onChange(!field.value)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                field.value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  field.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">保密文件</p>
                  <p className="text-xs text-gray-500">骑手无法查看物品详情</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${
                field.value ? 'bg-brand-500' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  field.value ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </button>
          )}
        />

        <Controller
          name="remark"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
              <textarea
                {...field}
                rows={2}
                placeholder="特殊要求、注意事项等"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />
      </div>
    </Card>
  );

  const renderGoodsFetch = () => (
    <Card>
      <div className="space-y-4">
        <Controller
          name="pickupCode"
          control={control}
          rules={{ required: '请填写取件码' }}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-green-600" />
                取件码
              </label>
              <input
                {...field}
                placeholder="请输入快递取件码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {errors.pickupCode && (
                <p className="mt-1 text-sm text-red-500">{errors.pickupCode.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="expressType"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-green-600" />
                快递/物品类型
              </label>
              <div className="flex gap-2 flex-wrap">
                {['快递', '外卖', '生鲜', '文件', '其他'].map((type) => (
                  <button
                    key={type}
                    onClick={() => field.onChange(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      field.value === type
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        <Controller
          name="goodsDescription"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">物品描述</label>
              <textarea
                {...field}
                rows={2}
                placeholder="选填，描述物品大小、数量等"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />

        <Controller
          name="remark"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
              <textarea
                {...field}
                rows={2}
                placeholder="特殊要求等"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />
      </div>
    </Card>
  );

  const renderGoodsErrand = () => (
    <Card>
      <div className="space-y-4">
        <Controller
          name="errandDescription"
          control={control}
          rules={{ required: '请描述办事事项' }}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-orange-600" />
                办事事项描述
              </label>
              <textarea
                {...field}
                rows={4}
                placeholder="请详细描述需要办理的事项，如：代排队、代缴费、代取号等"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
              {errors.errandDescription && (
                <p className="mt-1 text-sm text-red-500">{errors.errandDescription.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="errandDuration"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-orange-600" />
                预计耗时
              </label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => field.onChange(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      field.value === opt.value
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        <Controller
          name="specialRequirements"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">特殊要求</label>
              <textarea
                {...field}
                rows={2}
                placeholder="如有特殊要求请在此说明"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />

        <Controller
          name="remark"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
              <textarea
                {...field}
                rows={2}
                placeholder="其他补充信息"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        />
      </div>
    </Card>
  );

  const renderGoodsForm = () => {
    switch (category) {
      case 'buy':
        return renderGoodsBuy();
      case 'send':
        return renderGoodsSend();
      case 'fetch':
        return renderGoodsFetch();
      case 'errand':
        return renderGoodsErrand();
      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'category':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">选择服务类型</h3>
              {renderCitySelector()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ORDER_CATEGORIES.map((cat) => {
                const Icon = categoryIconMap[cat.iconName];
                const isSelected = category === cat.key;
                const refPrice = getReferencePrice(city, cat.key);
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleSelectCategory(cat.key)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-md'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      {Icon && <Icon className="w-6 h-6" style={{ color: cat.color }} />}
                    </div>
                    <p className="text-base font-semibold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-gray-100 rounded-lg">
                      <span className="text-xs font-medium text-gray-600">
                        ¥{refPrice}起
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-brand-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {category === 'errand' ? '填写办事地点' : '填写取送地址'}
              </h3>
              {renderCitySelector()}
            </div>

            {category === 'buy' && renderPickupCard('bg-blue-100', 'text-blue-600', Store, categoryLabels.pickup)}
            {category === 'send' && renderPickupCard('bg-green-100', 'text-green-600', Package, categoryLabels.pickup)}
            {category === 'fetch' && renderPickupCard('bg-green-100', 'text-green-600', Map, categoryLabels.pickup)}
            {category === 'errand' && renderPickupCard('bg-orange-100', 'text-orange-600', MapPin, categoryLabels.pickup)}

            {category !== 'errand' && (
              <>
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gray-300 border-l-2 border-dashed border-gray-300" />
                </div>
                {renderDeliveryCard()}
              </>
            )}

            {renderRouteMap()}

            {renderGeoFence()}
          </div>
        );

      case 'goods':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{categoryLabels.goods}</h3>
              {renderCitySelector()}
            </div>
            {renderGoodsForm()}

            <h3 className="text-lg font-bold text-gray-900 mt-2">服务选项</h3>
            <Card>
              <div className="space-y-3">
                <Controller
                  name="isUrgent"
                  control={control}
                  render={({ field }) => (
                    <button
                      onClick={() => field.onChange(!field.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        field.value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          field.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800">加急配送</p>
                          <p className="text-xs text-gray-500">优先派单，快30%送达</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-600">+¥5</span>
                        <div className={`w-12 h-7 rounded-full relative transition-colors ${
                          field.value ? 'bg-brand-500' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                            field.value ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>
                    </button>
                  )}
                />

                {(category === 'send' || category === 'fetch') && (
                  <Controller
                    name="isInsured"
                    control={control}
                    render={({ field }) => (
                      <button
                        onClick={() => field.onChange(!field.value)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          field.value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            field.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-800">物品保价</p>
                            <p className="text-xs text-gray-500">按价值1%投保，丢失全额赔付</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-600">
                            {goodsValue > 0 ? `+¥${Math.ceil(goodsValue * 0.01)}` : '+¥0'}
                          </span>
                          <div className={`w-12 h-7 rounded-full relative transition-colors ${
                            field.value ? 'bg-brand-500' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                              field.value ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </div>
                        </div>
                      </button>
                    )}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">打赏骑手 (小费)</label>
                  <Controller
                    name="tip"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2">
                        {[0, 2, 5, 10].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => field.onChange(amount)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              field.value === amount
                                ? 'bg-brand-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {amount === 0 ? '不打赏' : `¥${amount}`}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'price':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand-500" />
                价格预估
              </h3>
              {renderCitySelector()}
            </div>

            {renderValidationInfo()}

            <Card>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                {selectedCategory && (() => {
                  const Icon = categoryIconMap[selectedCategory.iconName];
                  return (
                    <>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${selectedCategory.color}15` }}
                      >
                        {Icon && <Icon className="w-5 h-5" style={{ color: selectedCategory.color }} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{selectedCategory.name}</p>
                        <p className="text-xs text-gray-500">约{distance}公里 · 预计{Math.round(distance * 8)}分钟</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">配送距离 (km)</label>
                  <span className="text-sm font-semibold text-brand-600">{distance} km</span>
                </div>
                <Controller
                  name="distance"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="range"
                      min={0.5}
                      max={20}
                      step={0.1}
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  )}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5km</span>
                  <span>10km</span>
                  <span>20km</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">基础运费 ({CITY_PRICING[city]?.baseFee || 8}元 × {CATEGORY_MULTIPLIER[category]}倍)</span>
                  <span className="text-sm font-medium text-gray-800">¥{priceBreakdown.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">距离费 ({distance}km × {CITY_PRICING[city]?.perKm || 2.5}元/km)</span>
                  <span className="text-sm font-medium text-gray-800">¥{priceBreakdown.distanceFee.toFixed(2)}</span>
                </div>
                {priceBreakdown.weightFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">重量费 ({weight > 1 ? `${(weight - 1).toFixed(1)}kg超重` : '未超重'})</span>
                    <span className="text-sm font-medium text-gray-800">¥{priceBreakdown.weightFee.toFixed(2)}</span>
                  </div>
                )}
                {isUrgent && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">加急费</span>
                    <span className="text-sm font-medium text-orange-600">+¥{priceBreakdown.urgentFee.toFixed(2)}</span>
                  </div>
                )}
                {isInsured && priceBreakdown.insuredFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">保价费</span>
                    <span className="text-sm font-medium text-brand-600">+¥{priceBreakdown.insuredFee.toFixed(2)}</span>
                  </div>
                )}
                {tip > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">骑手小费</span>
                    <span className="text-sm font-medium text-accent-600">+¥{priceBreakdown.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-800">合计</span>
                  <span className="text-2xl font-bold text-brand-600">¥{priceBreakdown.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-400 text-right">
                  最低消费 ¥{(CITY_PRICING[city]?.minFee || 8).toFixed(0)}
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-brand-500" />
                <h4 className="text-sm font-semibold text-gray-800">骑手匹配预览</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-gray-700">预计3分钟内匹配骑手</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">附近可用骑手：<span className="font-semibold text-brand-600">12人在线</span></span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-3">匹配维度详情：</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-brand-500" />
                          距离匹配
                        </span>
                        <span className="text-xs text-gray-500">平均 0.8km 内有骑手 · 40%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-green-500" />
                          空闲状态
                        </span>
                        <span className="text-xs text-gray-500">8人立即可接单 · 25%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-yellow-500" />
                          履约率
                        </span>
                        <span className="text-xs text-gray-500">平均 98.5% 按时送达 · 20%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-500" />
                          等级匹配
                        </span>
                        <span className="text-xs text-gray-500">3名金牌骑手优先派单 · 10%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-pink-500" />
                          品类专精
                        </span>
                        <span className="text-xs text-gray-500">5名有代购经验的骑手 · 5%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: '5%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                {isGeoFenced === true && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    <Map className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">当前地址在服务区域内 ✓</span>
                  </div>
                )}
                {isGeoFenced === false && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600">当前地址超出服务范围，可能无法接单 ⚠️</span>
                  </div>
                )}
              </div>
            </Card>

            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-500" />
              支付方式
            </h3>
            <Card>
              <Controller
                name="payMethod"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {[
                      { key: 'wechat', label: '微信支付', color: 'text-green-600', bg: 'bg-green-50' },
                      { key: 'alipay', label: '支付宝', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { key: 'balance', label: '余额支付 (¥128.50)', color: 'text-brand-600', bg: 'bg-brand-50' },
                    ].map((method) => (
                      <button
                        key={method.key}
                        onClick={() => field.onChange(method.key)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          field.value === method.key
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.bg}`}>
                            <Coins className={`w-5 h-5 ${method.color}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{method.label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          field.value === method.key ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                        }`}>
                          {field.value === method.key && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              />
            </Card>
          </div>
        );

      case 'submit':
        return (
          <div className="space-y-5 text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">确认下单</h3>
              <p className="text-sm text-gray-500 mt-1">请核对订单信息无误后提交</p>
            </div>
            <Card className="text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">服务类型</span>
                  <span className="text-sm font-medium text-gray-800">{selectedCategory?.name}</span>
                </div>
                {category !== 'errand' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{categoryLabels.pickup}</span>
                      <span className="text-sm text-gray-800 max-w-[200px] truncate text-right">{pickupAddress || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{categoryLabels.delivery}</span>
                      <span className="text-sm text-gray-800 max-w-[200px] truncate text-right">{deliveryAddress || '-'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">办事地点</span>
                    <span className="text-sm text-gray-800 max-w-[200px] truncate text-right">{pickupAddress || '-'}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="text-base font-semibold text-gray-800">支付金额</span>
                  <span className="text-xl font-bold text-brand-600">¥{priceBreakdown.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => (currentStepIndex > 0 ? handlePrev() : navigate(-1))}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">创建订单</h1>
          <div className="w-9" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      index < currentStepIndex
                        ? 'bg-brand-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      index <= currentStepIndex ? 'text-brand-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 -mt-5 transition-colors ${
                      index < currentStepIndex ? 'bg-brand-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent()}

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 py-3 pb-safe-area-inset-bottom">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    🏙️ {city}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${capacityInfo.dot}`} />
                    {capacityInfo.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-xs text-gray-500">预估费用</p>
                  <p className="text-xl font-bold text-brand-600">¥{priceBreakdown.total.toFixed(2)}</p>
                </div>
              </div>
              {currentStepIndex > 0 && (
                <Button variant="secondary" onClick={handlePrev} size="lg">
                  上一步
                </Button>
              )}
              {currentStepIndex < steps.length - 1 ? (
                <Button variant="primary" onClick={handleNext} size="lg">
                  下一步
                </Button>
              ) : (
                <Button variant="primary" type="submit" loading={submitting} size="lg">
                  提交订单
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}