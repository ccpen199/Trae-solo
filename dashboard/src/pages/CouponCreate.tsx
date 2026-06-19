import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Users,
  MapPin,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
} from 'lucide-react';
import { useCouponStore } from '../stores/couponStore';
import { FormInput, FormSelect, FormTextarea } from '../components/common/FormInput';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';
import type {
  CouponType,
  CouponStatus,
  DistributionStrategyType,
  DistributionStrategy,
  GeofenceArea,
  AutoTriggerCondition,
} from '@shared/types';

interface CouponFormData {
  name: string;
  type: CouponType;
  value: number;
  threshold: number;
  totalQuantity: number;
  status: CouponStatus;
  startTime: string;
  endTime: string;
  description: string;
  applicableMerchants: string[];
  distributionStrategy?: DistributionStrategy;
}

const TARGETED_GROUPS = [
  { id: 'new_user', name: '新用户礼包', count: 12580, description: '注册7天内的新用户' },
  { id: 'first_order', name: '首单立减', count: 8920, description: '从未消费过的用户' },
  { id: 'low_consumption', name: '低消费激活', count: 23450, description: '近30天消费低于50元的用户' },
  { id: 'high_value', name: '高价值用户', count: 5680, description: '近90天消费Top 20%用户' },
  { id: 'specific_area', name: '特定区域用户', count: 15600, description: '指定行政区的常住用户' },
  { id: 'student', name: '学生专享', count: 7890, description: '已认证学生身份用户' },
];

const DISTRICTS = [
  { id: 'shenhe', name: '沈河区', merchantCount: 328 },
  { id: 'heping', name: '和平区', merchantCount: 412 },
  { id: 'dadong', name: '大东区', merchantCount: 256 },
  { id: 'huanggu', name: '皇姑区', merchantCount: 189 },
  { id: 'tiexi', name: '铁西区', merchantCount: 298 },
  { id: 'hunnan', name: '浑南区', merchantCount: 167 },
];

const CATEGORIES = [
  { id: 'all', name: '全部品类' },
  { id: 'food', name: '餐饮美食' },
  { id: 'retail', name: '零售购物' },
  { id: 'entertainment', name: '休闲娱乐' },
  { id: 'life', name: '生活服务' },
  { id: 'health', name: '医疗健康' },
];

interface StrategyCardProps {
  type: DistributionStrategyType;
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}

function StrategyCard({
  icon,
  title,
  description,
  selected,
  expanded,
  onToggle,
  onExpand,
}: StrategyCardProps) {
  return (
    <div
      className={`card cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-primary-500 border-primary-200' : 'hover:border-gray-200'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              selected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3
                className={`font-semibold ${selected ? 'text-primary-700' : 'text-gray-800'}`}
              >
                {title}
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="flex items-center gap-1 text-sm text-primary-600 mt-4 hover:text-primary-700"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收起配置
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                展开配置
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CouponCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { selectedCoupon, fetchCouponById, createCoupon, updateCoupon, isLoading } =
    useCouponStore();

  const [formData, setFormData] = useState<CouponFormData>({
    name: '',
    type: 'fixed',
    value: 30,
    threshold: 100,
    totalQuantity: 1000,
    status: 'draft',
    startTime: dayjs().format('YYYY-MM-DD'),
    endTime: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    description: '',
    applicableMerchants: ['m001'],
  });

  const [selectedStrategies, setSelectedStrategies] = useState<DistributionStrategyType[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<DistributionStrategyType | null>(null);

  const [targetedGroups, setTargetedGroups] = useState<string[]>([]);

  const [fenceType, setFenceType] = useState<'district' | 'custom'>('district');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [triggerCondition, setTriggerCondition] = useState<'enter' | 'consume'>('enter');

  const [minConsumptionAmount, setMinConsumptionAmount] = useState<number>(100);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxCouponsPerUser, setMaxCouponsPerUser] = useState<number>(1);
  const [issueCount, setIssueCount] = useState<number>(1);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      fetchCouponById(id);
    }
  }, [isEdit, id, fetchCouponById]);

  useEffect(() => {
    if (selectedCoupon && isEdit) {
      setFormData({
        name: selectedCoupon.name,
        type: selectedCoupon.type,
        value: selectedCoupon.value,
        threshold: selectedCoupon.threshold,
        totalQuantity: selectedCoupon.totalQuantity,
        status: selectedCoupon.status,
        startTime: dayjs(selectedCoupon.startTime).format('YYYY-MM-DD'),
        endTime: dayjs(selectedCoupon.endTime).format('YYYY-MM-DD'),
        description: selectedCoupon.description || '',
        applicableMerchants: selectedCoupon.applicableMerchants,
        distributionStrategy: selectedCoupon.distributionStrategy,
      });

      if (selectedCoupon.distributionStrategy) {
        const strategy = selectedCoupon.distributionStrategy;
        const types: DistributionStrategyType[] = [];

        if (strategy.targetedGroups && strategy.targetedGroups.length > 0) {
          types.push('targeted');
          setTargetedGroups(strategy.targetedGroups);
        }
        if (strategy.geofencingAreas && strategy.geofencingAreas.length > 0) {
          types.push('geofencing');
          const districts = strategy.geofencingAreas
            .filter((a) => a.type === 'district' && a.districtCode)
            .map((a) => a.districtCode!);
          setSelectedDistricts(districts);
        }
        if (strategy.autoTriggerConditions) {
          types.push('auto');
          setMinConsumptionAmount(strategy.autoTriggerConditions.minConsumptionAmount);
          setMaxCouponsPerUser(strategy.autoTriggerConditions.maxCouponsPerUser);
          if (strategy.autoTriggerConditions.category) {
            setSelectedCategory(strategy.autoTriggerConditions.category);
          }
        }

        setSelectedStrategies(types);
      }
    }
  }, [selectedCoupon, isEdit]);

  const toggleStrategy = (type: DistributionStrategyType) => {
    setSelectedStrategies((prev) => {
      if (prev.includes(type)) {
        if (expandedStrategy === type) {
          setExpandedStrategy(null);
        }
        return prev.filter((t) => t !== type);
      } else {
        setExpandedStrategy(type);
        return [...prev, type];
      }
    });
  };

  const toggleGroup = (groupId: string) => {
    setTargetedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  const toggleDistrict = (districtId: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(districtId) ? prev.filter((d) => d !== districtId) : [...prev, districtId]
    );
  };

  const getTargetedUserCount = () => {
    return TARGETED_GROUPS.filter((g) => targetedGroups.includes(g.id)).reduce(
      (sum, g) => sum + g.count,
      0
    );
  };

  const getDistrictMerchantCount = () => {
    return DISTRICTS.filter((d) => selectedDistricts.includes(d.id)).reduce(
      (sum, d) => sum + d.merchantCount,
      0
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入优惠券名称';
    }
    if (formData.value <= 0) {
      newErrors.value = '优惠值必须大于0';
    }
    if (formData.threshold < 0) {
      newErrors.threshold = '使用门槛不能为负数';
    }
    if (formData.type === 'discount' && (formData.value <= 0 || formData.value >= 1)) {
      newErrors.value = '折扣值必须在0-1之间';
    }
    if (formData.totalQuantity <= 0) {
      newErrors.totalQuantity = '发行量必须大于0';
    }
    if (dayjs(formData.startTime).isAfter(dayjs(formData.endTime))) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildDistributionStrategy = (): DistributionStrategy | undefined => {
    if (selectedStrategies.length === 0) return undefined;

    const strategy: DistributionStrategy = {
      id: `strategy_${Date.now()}`,
      type: selectedStrategies[0],
    };

    if (selectedStrategies.includes('targeted') && targetedGroups.length > 0) {
      strategy.targetedGroups = targetedGroups;
    }

    if (selectedStrategies.includes('geofencing') && selectedDistricts.length > 0) {
      strategy.geofencingAreas = selectedDistricts.map((districtId) => {
        const district = DISTRICTS.find((d) => d.id === districtId);
        return {
          id: `fence_${districtId}`,
          name: district?.name || '',
          type: 'district',
          districtCode: districtId,
        } as GeofenceArea;
      });
    }

    if (selectedStrategies.includes('auto')) {
      strategy.autoTriggerConditions = {
        minConsumptionAmount,
        maxCouponsPerUser,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      } as AutoTriggerCondition;
    }

    return strategy;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const distributionStrategy = buildDistributionStrategy();
      const couponData = {
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        distributionStrategy,
      };

      if (isEdit && id) {
        await updateCoupon(id, couponData);
      } else {
        await createCoupon(couponData);
      }
      navigate('/coupons');
    } catch (err) {
      console.error('保存失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && isLoading && !selectedCoupon) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? '编辑优惠券' : '创建优惠券'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? '修改优惠券活动信息' : '创建新的优惠券活动'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">基本信息</div>
              <div className="card-body space-y-4">
                <FormInput
                  label="优惠券名称"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入优惠券名称"
                  error={errors.name}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="优惠券类型"
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'fixed' | 'discount' | 'threshold',
                      })
                    }
                    options={[
                      { value: 'fixed', label: '满减券' },
                      { value: 'discount', label: '折扣券' },
                      { value: 'threshold', label: '门槛券' },
                    ]}
                  />

                  <FormInput
                    label={formData.type === 'discount' ? '折扣值(0-1)' : '优惠金额(元)'}
                    required
                    type="number"
                    step={formData.type === 'discount' ? '0.1' : '1'}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: Number(e.target.value) })
                    }
                    placeholder={formData.type === 'discount' ? '例如：0.8 表示8折' : '例如：30'}
                    error={errors.value}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="使用门槛(元)"
                    required
                    type="number"
                    value={formData.threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: Number(e.target.value) })
                    }
                    placeholder="0表示无门槛"
                    error={errors.threshold}
                  />

                  <FormInput
                    label="发行总量"
                    required
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, totalQuantity: Number(e.target.value) })
                    }
                    placeholder="请输入发行总量"
                    error={errors.totalQuantity}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="开始日期"
                    required
                    type="date"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />

                  <FormInput
                    label="结束日期"
                    required
                    type="date"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    error={errors.endTime}
                  />
                </div>

                <FormTextarea
                  label="活动说明"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入活动说明（选填）"
                  rows={4}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <span>发放策略</span>
                  <span className="text-sm text-gray-500 font-normal">
                    已选择 {selectedStrategies.length} 种策略
                  </span>
                </div>
              </div>
              <div className="card-body space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  选择一种或多种发放策略，配置后系统将按照策略自动发放优惠券
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StrategyCard
                    type="targeted"
                    icon={<Users className="w-6 h-6" />}
                    title="定向人群包"
                    description="向特定用户群体定向发放优惠券"
                    selected={selectedStrategies.includes('targeted')}
                    expanded={expandedStrategy === 'targeted'}
                    onToggle={() => toggleStrategy('targeted')}
                    onExpand={() =>
                      setExpandedStrategy(expandedStrategy === 'targeted' ? null : 'targeted')
                    }
                  />
                  <StrategyCard
                    type="geofencing"
                    icon={<MapPin className="w-6 h-6" />}
                    title="地理位置围栏"
                    description="基于地理位置触发优惠券发放"
                    selected={selectedStrategies.includes('geofencing')}
                    expanded={expandedStrategy === 'geofencing'}
                    onToggle={() => toggleStrategy('geofencing')}
                    onExpand={() =>
                      setExpandedStrategy(
                        expandedStrategy === 'geofencing' ? null : 'geofencing'
                      )
                    }
                  />
                  <StrategyCard
                    type="auto"
                    icon={<ShoppingCart className="w-6 h-6" />}
                    title="消费满减自动发放"
                    description="用户消费满足条件时自动发放"
                    selected={selectedStrategies.includes('auto')}
                    expanded={expandedStrategy === 'auto'}
                    onToggle={() => toggleStrategy('auto')}
                    onExpand={() =>
                      setExpandedStrategy(expandedStrategy === 'auto' ? null : 'auto')
                    }
                  />
                </div>

                {expandedStrategy === 'targeted' && (
                  <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-600" />
                      定向人群包配置
                    </h4>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        选择人群包
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TARGETED_GROUPS.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              targetedGroups.includes(group.id)
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                            }`}
                          >
                            {targetedGroups.includes(group.id) && (
                              <Check className="w-4 h-4 inline mr-1 -mt-0.5" />
                            )}
                            {group.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {targetedGroups.length > 0 && (
                      <div className="p-4 bg-primary-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">预计覆盖人数</span>
                          <span className="text-lg font-bold text-primary-600">
                            {getTargetedUserCount().toLocaleString()} 人
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-primary-100">
                          <p className="text-xs text-gray-500 flex items-start gap-1">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            已选 {targetedGroups.length} 个人群包，系统将取并集发放，同一用户不会重复发放
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-sm text-gray-600 font-medium mb-2">人群包说明</p>
                      <div className="space-y-2">
                        {TARGETED_GROUPS.filter((g) => targetedGroups.includes(g.id)).map(
                          (group) => (
                            <div
                              key={group.id}
                              className="flex items-center justify-between text-sm p-2 bg-white rounded-lg"
                            >
                              <span className="text-gray-600">{group.name}</span>
                              <span className="text-gray-400">
                                {group.count.toLocaleString()}人 · {group.description}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {expandedStrategy === 'geofencing' && (
                  <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-600" />
                      地理位置围栏配置
                    </h4>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        围栏类型
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFenceType('district')}
                          className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                            fenceType === 'district'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          行政区
                        </button>
                        <button
                          type="button"
                          onClick={() => setFenceType('custom')}
                          className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                            fenceType === 'custom'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          商圈自定义
                        </button>
                      </div>
                    </div>

                    {fenceType === 'district' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          选择区域
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {DISTRICTS.map((district) => (
                            <button
                              key={district.id}
                              type="button"
                              onClick={() => toggleDistrict(district.id)}
                              className={`p-3 rounded-lg text-sm font-medium transition-all text-left ${
                                selectedDistricts.includes(district.id)
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{district.name}</span>
                                {selectedDistricts.includes(district.id) && (
                                  <Check className="w-4 h-4" />
                                )}
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  selectedDistricts.includes(district.id)
                                    ? 'text-primary-100'
                                    : 'text-gray-400'
                                }`}
                              >
                                {district.merchantCount}家商户
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {fenceType === 'custom' && (
                      <div className="mb-4 p-4 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          自定义商圈围栏功能即将上线
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          支持在地图上绘制多边形围栏区域
                        </p>
                      </div>
                    )}

                    {selectedDistricts.length > 0 && (
                      <div className="p-4 bg-primary-50 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">预计覆盖商户数</span>
                          <span className="text-lg font-bold text-primary-600">
                            {getDistrictMerchantCount()} 家
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        触发条件
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-primary-300 transition-colors">
                          <input
                            type="radio"
                            name="triggerCondition"
                            checked={triggerCondition === 'enter'}
                            onChange={() => setTriggerCondition('enter')}
                            className="w-4 h-4 text-primary-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              进入围栏自动发券
                            </p>
                            <p className="text-xs text-gray-500">
                              用户进入围栏区域时自动发放优惠券
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-primary-300 transition-colors">
                          <input
                            type="radio"
                            name="triggerCondition"
                            checked={triggerCondition === 'consume'}
                            onChange={() => setTriggerCondition('consume')}
                            className="w-4 h-4 text-primary-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              围栏内消费可用
                            </p>
                            <p className="text-xs text-gray-500">
                              用户需在围栏区域内的商户消费才能使用
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {expandedStrategy === 'auto' && (
                  <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary-600" />
                      消费满减自动发放配置
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          触发条件
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">单笔消费满</span>
                          <FormInput
                            type="number"
                            value={minConsumptionAmount}
                            onChange={(e) =>
                              setMinConsumptionAmount(Number(e.target.value))
                            }
                            className="w-24 inline-block"
                            min={0}
                          />
                          <span className="text-sm text-gray-600">元</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          适用品类
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedCategory === cat.id
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            每人最多领取
                          </label>
                          <div className="flex items-center gap-2">
                            <FormInput
                              type="number"
                              value={maxCouponsPerUser}
                              onChange={(e) =>
                                setMaxCouponsPerUser(Number(e.target.value))
                              }
                              min={1}
                            />
                            <span className="text-sm text-gray-600">张</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            发放券数
                          </label>
                          <div className="flex items-center gap-2">
                            <FormInput
                              type="number"
                              value={issueCount}
                              onChange={(e) => setIssueCount(Number(e.target.value))}
                              min={1}
                            />
                            <span className="text-sm text-gray-600">张/次</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-700 flex items-start gap-2">
                          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>
                            当用户单笔消费满足满减条件时，系统将自动发放 {issueCount} 张优惠券。
                            每人最多领取 {maxCouponsPerUser} 张，超出后不再发放。
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">发布设置</div>
              <div className="card-body space-y-4">
                <FormSelect
                  label="初始状态"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'draft' | 'active' | 'paused',
                    })
                  }
                  options={[
                    { value: 'draft', label: '保存为草稿' },
                    { value: 'active', label: '立即发布' },
                    { value: 'paused', label: '暂停发布' },
                  ]}
                />

                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-600 font-medium mb-2">优惠券预览</p>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="font-bold text-lg text-gray-800">
                      {formData.name || '优惠券名称'}
                    </p>
                    <p className="text-2xl font-bold text-accent-500 mt-2">
                      {formData.type === 'discount'
                        ? `${formData.value * 10}折`
                        : `¥${formData.value}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.threshold > 0
                        ? `满${formData.threshold}元可用`
                        : '无门槛使用'}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        {formData.startTime} 至 {formData.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">投放策略预览</div>
              <div className="card-body space-y-3">
                {selectedStrategies.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">暂未选择发放策略</p>
                    <p className="text-xs text-gray-400 mt-1">
                      选择策略后此处将显示配置预览
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStrategies.includes('targeted') && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">
                            定向人群包
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            已选 {targetedGroups.length} 个人群包
                          </p>
                          {targetedGroups.length > 0 && (
                            <p className="text-purple-600 font-medium">
                              覆盖 {getTargetedUserCount().toLocaleString()} 人
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {targetedGroups.slice(0, 3).map((g) => {
                              const group = TARGETED_GROUPS.find((tg) => tg.id === g);
                              return (
                                <span
                                  key={g}
                                  className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs"
                                >
                                  {group?.name}
                                </span>
                              );
                            })}
                            {targetedGroups.length > 3 && (
                              <span className="px-2 py-0.5 text-purple-600 text-xs">
                                +{targetedGroups.length - 3}个
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStrategies.includes('geofencing') && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">
                            地理位置围栏
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            {fenceType === 'district' ? '行政区围栏' : '自定义商圈'}
                          </p>
                          {fenceType === 'district' && selectedDistricts.length > 0 && (
                            <>
                              <p className="text-blue-600 font-medium">
                                覆盖 {getDistrictMerchantCount()} 家商户
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedDistricts.slice(0, 3).map((d) => {
                                  const district = DISTRICTS.find((dt) => dt.id === d);
                                  return (
                                    <span
                                      key={d}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                                    >
                                      {district?.name}
                                    </span>
                                  );
                                })}
                                {selectedDistricts.length > 3 && (
                                  <span className="px-2 py-0.5 text-blue-600 text-xs">
                                    +{selectedDistricts.length - 3}个
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          <p className="mt-1">
                            {triggerCondition === 'enter'
                              ? '进入围栏自动发券'
                              : '围栏内消费可用'}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedStrategies.includes('auto') && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            消费满减自动发放
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>单笔消费满 {minConsumptionAmount} 元触发</p>
                          <p>
                            {selectedCategory === 'all'
                              ? '全部品类'
                              : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                          </p>
                          <p className="text-green-600 font-medium">
                            每人限领 {maxCouponsPerUser} 张，每次发放 {issueCount} 张
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-end gap-3">
                  <Link to="/coupons" className="btn-outline">
                    取消
                  </Link>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
