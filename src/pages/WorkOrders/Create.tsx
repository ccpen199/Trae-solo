import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Building2,
  MapPin,
  Ruler,
  Banknote,
  Clock,
  Users,
  MessageSquare,
  Check,
  Plus,
  X,
  Palette,
  Sun,
  Leaf,
  Monitor,
  Coffee,
  Server,
  VolumeX,
  TreePine,
  Sparkles,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Target,
  Layers,
  Box,
  type LucideIcon,
} from 'lucide-react';
import type {
  Property,
  DemandDiagnosis,
  BudgetLevel,
  DesignStyle,
} from '@/types';
import { mockProperties } from '@/mock';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

type PropertyFormData = {
  mode: 'existing' | 'manual';
  selectedPropertyId: string;
  manualName: string;
  manualAddress: string;
  manualArea: number;
  manualType: string;
};

type QuotationPlan = {
  level: BudgetLevel;
  name: string;
  description: string;
  totalPrice: number;
  duration: number;
  materials: { name: string; brand: string }[];
  includedItems: string[];
  highlight?: boolean;
};

const steps: { id: Step; title: string; icon: LucideIcon }[] = [
  { id: 1, title: '选择房源', icon: Building2 },
  { id: 2, title: '需求诊断', icon: MessageSquare },
  { id: 3, title: '方案预算', icon: Banknote },
  { id: 4, title: '确认提交', icon: CheckCircle2 },
];

const designStyles: DesignStyle[] = [
  '现代简约',
  '新中式',
  '工业风',
  '北欧风',
  '商务轻奢',
  '科技感',
  '复古风',
  '自然生态',
];

const colorOptions = [
  '深蓝', '米白', '金属灰', '木色', '科技蓝', '白色',
  '金色', '黑色', '暖棕', '薄荷绿', '珊瑚橙', '薰衣草紫',
];

const lightingOptions: { value: DemandDiagnosis['lightingRequirement']; label: string; icon: LucideIcon }[] = [
  { value: '明亮通透', label: '明亮通透', icon: Sun },
  { value: '温馨柔和', label: '温馨柔和', icon: Sparkles },
  { value: '专业办公', label: '专业办公', icon: Monitor },
  { value: '创意多变', label: '创意多变', icon: Palette },
];

const facilityOptions: { key: keyof Pick<DemandDiagnosis, 'receptionArea' | 'pantry' | 'serverRoom' | 'soundproofRoom' | 'greening'>; label: string; icon: LucideIcon }[] = [
  { key: 'receptionArea', label: '前台', icon: Users },
  { key: 'pantry', label: '茶水间', icon: Coffee },
  { key: 'serverRoom', label: '机房', icon: Server },
  { key: 'soundproofRoom', label: '隔音室', icon: VolumeX },
  { key: 'greening', label: '绿化', icon: TreePine },
];

const budgetRanges = [
  { label: '50万以下', value: [0, 500000] as [number, number] },
  { label: '50-100万', value: [500000, 1000000] as [number, number] },
  { label: '100-200万', value: [1000000, 2000000] as [number, number] },
  { label: '200-500万', value: [2000000, 5000000] as [number, number] },
  { label: '500-1000万', value: [5000000, 10000000] as [number, number] },
  { label: '1000万以上', value: [1000000, 99999999] as [number, number] },
];

const durationOptions = [
  { label: '30天以内', value: 30 },
  { label: '30-60天', value: 60 },
  { label: '60-90天', value: 90 },
  { label: '90-120天', value: 120 },
  { label: '120-180天', value: 180 },
  { label: '180天以上', value: 365 },
];

function formatPrice(price: number): string {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)}万`;
  }
  return `¥${price.toLocaleString()}`;
}

function generateQuotationPlans(area: number, budgetRange: [number, number]): QuotationPlan[] {
  const basePrice = area * 2500;
  return [
    {
      level: '经济型',
      name: '经济实用方案',
      description: '满足基本办公需求，性价比优先',
      totalPrice: Math.max(budgetRange[0], Math.round(basePrice * 0.7)),
      duration: Math.round(area * 0.05),
      materials: [
        { name: '地砖', brand: '东鹏/马可波罗' },
        { name: '乳胶漆', brand: '多乐士/立邦' },
        { name: '矿棉板吊顶', brand: '阿姆斯壮' },
        { name: '玻璃隔断', brand: '国产' },
        { name: '灯具', brand: '雷士/欧普' },
      ],
      includedItems: [
        '基础硬装工程（隔墙、吊顶、地面）',
        '标准强弱电系统',
        '普通空调新风系统',
        '基础消防改造',
        '标准办公家具',
        '1年质保服务',
      ],
    },
    {
      level: '标准型',
      name: '标准优选方案',
      description: '品质与预算平衡，适合大多数企业',
      totalPrice: Math.max(budgetRange[0], Math.round(basePrice * 1.0)),
      duration: Math.round(area * 0.07),
      materials: [
        { name: '地砖/地毯', brand: '诺贝尔/萧氏' },
        { name: '乳胶漆', brand: '芬兰芬琳/多乐士金装' },
        { name: '矿棉板/硅钙板吊顶', brand: '阿姆斯壮' },
        { name: '双玻百叶隔断', brand: '欧曼/代高' },
        { name: 'LED灯具', brand: '飞利浦/欧司朗' },
      ],
      includedItems: [
        '完整硬装工程（隔墙、吊顶、地面、墙面）',
        '综合布线系统（六类网线）',
        '品牌空调新风系统',
        '消防改造及报审',
        '品牌办公家具',
        '基础智能化系统（门禁、监控）',
        '2年质保服务',
        '专业保洁开荒',
      ],
      highlight: true,
    },
    {
      level: '品质型',
      name: '品质尊享方案',
      description: '优质材料与精细工艺，彰显企业形象',
      totalPrice: Math.min(budgetRange[1] || 99999999, Math.round(basePrice * 1.4)),
      duration: Math.round(area * 0.09),
      materials: [
        { name: '大理石/高端地毯', brand: '卡拉拉/美利肯' },
        { name: '进口乳胶漆', brand: '丹麦福乐阁/美国宣伟' },
        { name: '造型吊顶', brand: '定制' },
        { name: '高端玻璃隔断', brand: '意大利格拉夫' },
        { name: '智能照明系统', brand: '路创/飞利浦Hue' },
      ],
      includedItems: [
        '精品硬装工程（含造型设计）',
        '智能综合布线系统',
        '中央空调+新风+净化系统',
        '消防报审及验收全包',
        '高端定制办公家具',
        '完整智能化系统',
        '室内绿化软装',
        '3年质保服务',
        '专业空气检测治理',
        'BIM建模服务',
      ],
    },
    {
      level: '豪华型',
      name: '豪华定制方案',
      description: '顶级配置与个性化定制，打造旗舰总部',
      totalPrice: Math.min(budgetRange[1] || 99999999, Math.round(basePrice * 2.0)),
      duration: Math.round(area * 0.12),
      materials: [
        { name: '进口石材/木地板', brand: '意大利施恩德/瑞士卢森' },
        { name: '进口艺术涂料', brand: '意大利瓦帕茵特' },
        { name: '定制艺术吊顶', brand: '定制' },
        { name: '进口隔断系统', brand: '德国全进口' },
        { name: '智能灯光控制系统', brand: '路创/邦奇' },
      ],
      includedItems: [
        '大师级设计与硬装工程',
        '智能楼宇控制系统',
        '恒温恒湿空调系统',
        '消防一站式服务',
        '进口/定制办公家具',
        '全场景智能化系统',
        '专业软装艺术陈设',
        '5年质保服务',
        '空气净化系统',
        'BIM全生命周期管理',
        'VIP接待区专项设计',
        '独立机房工程',
      ],
    },
  ];
}

export default function CreateWorkOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyIdParam = searchParams.get('propertyId');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);

  const [propertyData, setPropertyData] = useState<PropertyFormData>({
    mode: 'existing',
    selectedPropertyId: propertyIdParam || '',
    manualName: '',
    manualAddress: '',
    manualArea: 0,
    manualType: '写字楼',
  });

  const [demandData, setDemandData] = useState<Omit<DemandDiagnosis, 'questionnaireFilledAt'>>({
    area: 0,
    budgetRange: [500000, 1000000],
    duration: 90,
    staffCount: 50,
    meetingRoomCount: 3,
    receptionArea: false,
    pantry: false,
    serverRoom: false,
    soundproofRoom: false,
    greening: false,
    designStyles: [],
    colorPreference: [],
    lightingRequirement: '明亮通透',
    specialRequirements: '',
  });

  const [selectedPlanLevel, setSelectedPlanLevel] = useState<BudgetLevel>('标准型');

  useEffect(() => {
    if (propertyIdParam) {
      const property = mockProperties.find((p) => p.id === propertyIdParam);
      if (property) {
        setPropertyData((prev) => ({ ...prev, selectedPropertyId: propertyIdParam }));
        const area = property.spec.area;
        const isOffice = property.type === '写字楼';
        const isRetail = property.type === '商铺';
        const budgetLow = Math.round(area * (isRetail ? 3500 : isOffice ? 2800 : 2200));
        const budgetHigh = Math.round(area * (isRetail ? 6000 : isOffice ? 5000 : 4000));
        const duration = isRetail ? 105 : isOffice ? 90 : 80;
        setDemandData((prev) => ({
          ...prev,
          area: area,
          budgetRange: [budgetLow, budgetHigh],
          duration: duration,
          staffCount: isRetail ? 30 : isOffice ? 50 : 40,
          designStyles: isRetail ? ['工业风', '现代简约'] : isOffice ? ['商务轻奢', '现代简约'] : ['现代简约'],
          colorPreference: isRetail ? ['白色', '原木色'] : isOffice ? ['深灰', '米色'] : ['白色', '米色'],
          specialRequirements: isRetail
            ? '商铺人流大，须选用耐磨A级防火地面材料，加强LOGO形象墙设计'
            : isOffice
              ? '建议开放工位+独立会议室组合，网络布线满足高密度办公'
              : '厂房优先满足承重和消防喷淋要求，办公区与生产区分隔设计',
        }));
        setTimeout(() => setCurrentStep(2), 150);
      }
    }
  }, [propertyIdParam]);

  const selectedProperty = useMemo(() => {
    return mockProperties.find((p) => p.id === propertyData.selectedPropertyId);
  }, [propertyData.selectedPropertyId]);

  const effectiveArea = useMemo(() => {
    if (propertyData.mode === 'existing' && selectedProperty) {
      return selectedProperty.spec.area;
    }
    return propertyData.manualArea || demandData.area;
  }, [propertyData, selectedProperty, demandData.area]);

  const quotationPlans = useMemo(() => {
    return generateQuotationPlans(effectiveArea, demandData.budgetRange);
  }, [effectiveArea, demandData.budgetRange]);

  const selectedPlan = useMemo(() => {
    return quotationPlans.find((p) => p.level === selectedPlanLevel);
  }, [quotationPlans, selectedPlanLevel]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        if (propertyData.mode === 'existing') {
          return !!propertyData.selectedPropertyId;
        }
        return !!propertyData.manualName && !!propertyData.manualAddress && propertyData.manualArea > 0;
      case 2:
        return (
          effectiveArea > 0 &&
          demandData.budgetRange[0] >= 0 &&
          demandData.staffCount > 0 &&
          demandData.meetingRoomCount >= 0 &&
          demandData.designStyles.length > 0
        );
      case 3:
        return !!selectedPlanLevel;
      default:
        return true;
    }
  }, [currentStep, propertyData, effectiveArea, demandData, selectedPlanLevel]);

  const handleNext = () => {
    if (currentStep < 4 && canProceed) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      navigate('/orders');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    const newOrderId = 'WO-2026-' + String(Date.now()).slice(-5);
    setSubmittedOrderId(newOrderId);
  };

  const buildMatchingQuery = () => {
    const params = new URLSearchParams();
    params.append('area', String(demandData.area));
    params.append('budgetMin', String(demandData.budgetRange[0]));
    params.append('budgetMax', String(demandData.budgetRange[1]));
    params.append('duration', String(demandData.duration));
    if (demandData.designStyles.length > 0) params.append('style', demandData.designStyles.join(','));
    const p = selectedProperty;
    if (p) {
      params.append('district', p.location.district);
      params.append('type', p.type);
    }
    return params.toString();
  };

  const toggleStyle = (style: DesignStyle) => {
    setDemandData((prev) => ({
      ...prev,
      designStyles: prev.designStyles.includes(style)
        ? prev.designStyles.filter((s) => s !== style)
        : [...prev.designStyles, style],
    }));
  };

  const toggleColor = (color: string) => {
    setDemandData((prev) => ({
      ...prev,
      colorPreference: prev.colorPreference.includes(color)
        ? prev.colorPreference.filter((c) => c !== color)
        : [...prev.colorPreference, color],
    }));
  };

  const toggleFacility = (key: typeof facilityOptions[number]['key']) => {
    setDemandData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (submittedOrderId) {
    const nextSteps = [
      {
        id: 1, title: '工单已创建成功', icon: CheckCircle2, status: 'done' as const,
        desc: `工单编号：${submittedOrderId}`,
        color: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      },
      {
        id: 2, title: '智能匹配服务商', icon: Target, status: 'active' as const,
        desc: '基于面积/预算/工期/风格为您匹配最优服务商',
        color: 'bg-gold-500/15 border-gold-500/40 text-gold-400',
        action: `去匹配 →`,
        onClick: () => navigate(`/matching?${buildMatchingQuery()}`),
      },
      {
        id: 3, title: '在线议价确认', icon: MessageSquare, status: 'pending' as const,
        desc: '与匹配服务商在线沟通报价细节',
        color: 'bg-primary-700/40 border-neutral-600/40 text-neutral-400',
        action: `待匹配`,
      },
      {
        id: 4, title: '电子合同签署', icon: FileCheck2, status: 'pending' as const,
        desc: '确认条款后完成电子签章，链上存证',
        color: 'bg-primary-700/40 border-neutral-600/40 text-neutral-400',
        action: `待议价`,
      },
    ];

    const summaryItems = [
      { label: '房源名称', value: selectedProperty?.name || propertyData.manualName },
      { label: '建筑面积', value: `${demandData.area} ㎡` },
      { label: '装修方案', value: `${selectedPlanLevel}·¥${(selectedPlan?.totalPrice || 0).toLocaleString('zh-CN')}` },
      { label: '预算范围', value: `¥${demandData.budgetRange[0].toLocaleString('zh-CN')} ~ ¥${demandData.budgetRange[1].toLocaleString('zh-CN')}` },
      { label: '预计工期', value: `${demandData.duration} 天` },
      { label: '风格偏好', value: demandData.designStyles.join('、') || '未指定' },
    ];

    return (
      <div className="min-h-screen bg-mesh-tech p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card-base p-8 text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto flex items-center justify-center mb-5 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold animate-shimmer-gold mb-2">工单创建成功 🎉</h1>
            <p className="text-sm text-neutral-400">
              工单编号 <span className="font-mono text-gold-300 font-bold">{submittedOrderId}</span> 已提交系统
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card-base p-5 mb-6">
            <h3 className="text-sm font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gold-400" />
              工单信息摘要
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {summaryItems.map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-primary-800/40 border border-white/5">
                  <p className="text-[11px] text-neutral-500 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-neutral-100 truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card-base p-5 mb-6">
            <h3 className="text-sm font-semibold text-neutral-200 mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              下一步流程（点击进入）
            </h3>
            <div className="space-y-3">
              {nextSteps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="relative flex items-start gap-4">
                    {i < nextSteps.length - 1 && (
                      <div className="absolute left-[22px] top-[44px] w-px h-10 bg-gradient-to-b from-gold-500/50 to-transparent" />
                    )}
                    <div
                      onClick={step.onClick}
                      className={cn(
                        'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all',
                        step.color,
                        step.onClick && 'cursor-pointer hover:scale-105 hover:shadow-gold-glow'
                      )}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            'text-sm font-semibold',
                            step.status === 'done' && 'text-emerald-300',
                            step.status === 'active' && 'text-gold-300 animate-glow-pulse',
                            step.status === 'pending' && 'text-neutral-400'
                          )}>
                            {step.title}
                          </h4>
                          {step.status === 'done' && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        {step.action && (
                          <button
                            onClick={step.onClick}
                            disabled={!step.onClick}
                            className={cn(
                              'text-xs px-3 py-1 rounded-md font-medium transition-all',
                              step.onClick
                                ? 'bg-gold-gradient text-primary-900 hover:shadow-gold-glow'
                                : 'bg-primary-800/50 text-neutral-500 cursor-not-allowed'
                            )}
                          >
                            {step.action}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/matching?${buildMatchingQuery()}`)}
              className="btn-gold w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              立即智能匹配服务商
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="px-8 py-3 rounded-xl text-sm border border-neutral-600/40 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300 transition-all w-full md:w-auto"
            >
              返回工单中心
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-tech">
      <div className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-gold-500/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-gold-300 hover:bg-gold-500/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold animate-shimmer-gold">创建装修工单</h1>
              <p className="text-xs text-neutral-400 mt-0.5">完成4步流程，快速创建您的装修需求</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                          isCompleted && 'bg-emerald-500 border-emerald-400 text-white',
                          isActive && 'bg-gold-500 border-gold-400 text-primary-900 animate-glow-pulse',
                          !isCompleted && !isActive && 'bg-primary-900 border-neutral-600 text-neutral-500'
                        )}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium transition-colors',
                          isActive && 'text-gold-300',
                          isCompleted && 'text-emerald-300',
                          !isCompleted && !isActive && 'text-neutral-500'
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-2 relative h-0.5 bg-neutral-700/50">
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 transition-all duration-500',
                            currentStep > step.id ? 'bg-gradient-to-r from-gold-500 to-gold-400 w-full' : 'w-0'
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="card-base p-5 bg-gradient-to-r from-gold-500/5 to-transparent border-gold-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-100">第 1 步 · 选择装修房源</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      选择您要装修的房源，系统将自动匹配房源的面积、层高、承重等物理参数，为后续方案报价提供准确依据。
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        自动获取建筑参数
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        一键关联产权信息
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        支持手动录入
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">选择房源方式</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPropertyData((prev) => ({ ...prev, mode: 'existing' }))}
                    className={cn(
                      'p-5 rounded-xl border-2 text-left transition-all',
                      propertyData.mode === 'existing'
                        ? 'border-gold-500 bg-gold-500/10'
                        : 'border-neutral-700 bg-primary-900/30 hover:border-neutral-600'
                    )}
                  >
                    <Building2 className={cn(
                      'w-8 h-8 mb-3',
                      propertyData.mode === 'existing' ? 'text-gold-400' : 'text-neutral-500'
                    )} />
                    <h3 className="font-bold text-neutral-100">关联现有房源</h3>
                    <p className="text-sm text-neutral-400 mt-1">从已有房源库中选择，自动填充房源信息</p>
                  </button>
                  <button
                    onClick={() => setPropertyData((prev) => ({ ...prev, mode: 'manual' }))}
                    className={cn(
                      'p-5 rounded-xl border-2 text-left transition-all',
                      propertyData.mode === 'manual'
                        ? 'border-gold-500 bg-gold-500/10'
                        : 'border-neutral-700 bg-primary-900/30 hover:border-neutral-600'
                    )}
                  >
                    <Plus className={cn(
                      'w-8 h-8 mb-3',
                      propertyData.mode === 'manual' ? 'text-gold-400' : 'text-neutral-500'
                    )} />
                    <h3 className="font-bold text-neutral-100">手动输入房源</h3>
                    <p className="text-sm text-neutral-400 mt-1">手动填写房源信息，适用于未录入系统的房源</p>
                  </button>
                </div>
              </div>

              {propertyData.mode === 'existing' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="card-base p-6">
                    <h2 className="text-lg font-bold text-neutral-100 mb-4">选择房源</h2>
                    <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
                      {mockProperties.map((property) => (
                        <button
                          key={property.id}
                          onClick={() => {
                            setPropertyData((prev) => ({
                              ...prev,
                              selectedPropertyId: property.id,
                            }));
                            setDemandData((prev) => ({
                              ...prev,
                              area: property.spec.area,
                            }));
                          }}
                          className={cn(
                            'p-4 rounded-xl border text-left transition-all group',
                            propertyData.selectedPropertyId === property.id
                              ? 'border-gold-500 bg-gold-500/10'
                              : 'border-neutral-700 bg-primary-900/30 hover:border-gold-500/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                              propertyData.selectedPropertyId === property.id
                                ? 'border-gold-400 bg-gold-500'
                                : 'border-neutral-500'
                            )}>
                              {propertyData.selectedPropertyId === property.id && (
                                <Check className="w-3 h-3 text-primary-900" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-gold-400">{property.code}</span>
                                <span className="chip !py-0 !px-1.5 !text-[10px]">{property.type}</span>
                              </div>
                              <h3 className="font-semibold text-neutral-100 mt-1 group-hover:text-gold-300 transition-colors">
                                {property.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-2 text-sm text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {property.location.district}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Ruler className="w-3.5 h-3.5" />
                                  {property.spec.area}㎡
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1 truncate">
                                {property.location.address}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {propertyData.mode === 'manual' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="card-base p-6">
                    <h2 className="text-lg font-bold text-neutral-100 mb-4">手动输入房源信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">房源名称</label>
                        <input
                          type="text"
                          placeholder="请输入房源名称"
                          value={propertyData.manualName}
                          onChange={(e) =>
                            setPropertyData((prev) => ({ ...prev, manualName: e.target.value }))
                          }
                          className="input-tech"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">房源类型</label>
                        <select
                          value={propertyData.manualType}
                          onChange={(e) =>
                            setPropertyData((prev) => ({ ...prev, manualType: e.target.value }))
                          }
                          className="input-tech"
                        >
                          <option value="写字楼">写字楼</option>
                          <option value="商铺">商铺</option>
                          <option value="厂房">厂房</option>
                          <option value="产业园">产业园</option>
                          <option value="综合体">综合体</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">房源地址</label>
                        <input
                          type="text"
                          placeholder="请输入详细地址"
                          value={propertyData.manualAddress}
                          onChange={(e) =>
                            setPropertyData((prev) => ({ ...prev, manualAddress: e.target.value }))
                          }
                          className="input-tech"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">建筑面积（㎡）</label>
                        <input
                          type="number"
                          placeholder="请输入建筑面积"
                          value={propertyData.manualArea || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPropertyData((prev) => ({ ...prev, manualArea: val }));
                            setDemandData((prev) => ({ ...prev, area: val }));
                          }}
                          className="input-tech"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {selectedProperty && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-base p-4 bg-gradient-to-r from-emerald-500/8 to-transparent border-emerald-500/25"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-400 font-medium">已承接房源</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-100 mt-0.5">{selectedProperty.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-gold-400/60" />
                          {selectedProperty.spec.area} ㎡
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gold-400/60" />
                          {selectedProperty.location.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-gold-400/60" />
                          层高 {selectedProperty.spec.ceilingHeight}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Box className="w-3 h-3 text-gold-400/60" />
                          承重 {selectedProperty.spec.loadCapacity}kg/㎡
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] text-neutral-400 hover:text-gold-300 transition-colors"
                    >
                      更换房源
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="card-base p-5 bg-gradient-to-r from-gold-500/5 to-transparent border-gold-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-100">第 2 步 · 需求诊断</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      系统已根据房源信息自动填充以下需求，您可以根据实际情况调整。系统将基于这些信息智能匹配服务商和方案。
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        8 项需求维度
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        功能空间自定义
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        多风格选择
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">基本信息</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      <Ruler className="w-4 h-4 inline mr-1.5 text-gold-400" />
                      建筑面积（㎡）
                    </label>
                    <input
                      type="number"
                      value={effectiveArea || ''}
                      onChange={(e) =>
                        setDemandData((prev) => ({ ...prev, area: Number(e.target.value) }))
                      }
                      className="input-tech"
                      disabled={propertyData.mode === 'existing' && !!selectedProperty}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      <Banknote className="w-4 h-4 inline mr-1.5 text-gold-400" />
                      预算区间
                    </label>
                    <select
                      value={demandData.budgetRange.join('-')}
                      onChange={(e) => {
                        const [min, max] = e.target.value.split('-').map(Number);
                        setDemandData((prev) => ({
                          ...prev,
                          budgetRange: [min, max],
                        }));
                      }}
                      className="input-tech"
                    >
                      {budgetRanges.map((range) => (
                        <option key={range.label} value={range.value.join('-')}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1.5 text-gold-400" />
                      期望工期
                    </label>
                    <select
                      value={demandData.duration}
                      onChange={(e) =>
                        setDemandData((prev) => ({ ...prev, duration: Number(e.target.value) }))
                      }
                      className="input-tech"
                    >
                      {durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1.5 text-gold-400" />
                      员工人数
                    </label>
                    <input
                      type="number"
                      value={demandData.staffCount || ''}
                      onChange={(e) =>
                        setDemandData((prev) => ({ ...prev, staffCount: Number(e.target.value) }))
                      }
                      className="input-tech"
                      placeholder="预计员工人数"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1.5 text-gold-400" />
                      会议室数量
                    </label>
                    <input
                      type="number"
                      value={demandData.meetingRoomCount || ''}
                      onChange={(e) =>
                        setDemandData((prev) => ({ ...prev, meetingRoomCount: Number(e.target.value) }))
                      }
                      className="input-tech"
                      placeholder="需要的会议室数量"
                    />
                  </div>
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">功能空间需求</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {facilityOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const isSelected = demandData[option.key];
                    return (
                      <button
                        key={option.key}
                        onClick={() => toggleFacility(option.key)}
                        className={cn(
                          'p-4 rounded-xl border-2 text-center transition-all',
                          isSelected
                            ? 'border-gold-500 bg-gold-500/15'
                            : 'border-neutral-700 bg-primary-900/30 hover:border-neutral-600'
                        )}
                      >
                        <OptionIcon className={cn(
                          'w-6 h-6 mx-auto mb-2',
                          isSelected ? 'text-gold-400' : 'text-neutral-500'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-gold-300' : 'text-neutral-400'
                        )}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 mx-auto mt-2 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">
                  <Palette className="w-5 h-5 inline mr-2 text-gold-400" />
                  设计风格
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {designStyles.map((style) => {
                    const isSelected = demandData.designStyles.includes(style);
                    return (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all relative overflow-hidden',
                          isSelected
                            ? 'border-gold-500 bg-gold-500/10'
                            : 'border-neutral-700 bg-primary-900/30 hover:border-neutral-600'
                        )}
                      >
                        {isSelected && (
                          <Check className="absolute top-2 right-2 w-4 h-4 text-gold-400" />
                        )}
                        <span className={cn(
                          'font-medium',
                          isSelected ? 'text-gold-300' : 'text-neutral-300'
                        )}>
                          {style}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">
                  颜色偏好
                </h2>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const isSelected = demandData.colorPreference.includes(color);
                    return (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                          isSelected
                            ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                            : 'bg-primary-900/40 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                        )}
                      >
                        {color}
                        {isSelected && <Check className="w-3.5 h-3.5 inline ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">
                  光照要求
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {lightingOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const isSelected = demandData.lightingRequirement === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          setDemandData((prev) => ({ ...prev, lightingRequirement: option.value }))
                        }
                        className={cn(
                          'p-4 rounded-xl border-2 text-center transition-all',
                          isSelected
                            ? 'border-gold-500 bg-gold-500/15'
                            : 'border-neutral-700 bg-primary-900/30 hover:border-neutral-600'
                        )}
                      >
                        <OptionIcon className={cn(
                          'w-6 h-6 mx-auto mb-2',
                          isSelected ? 'text-gold-400' : 'text-neutral-500'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-gold-300' : 'text-neutral-400'
                        )}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-base p-6">
                <h2 className="text-lg font-bold text-neutral-100 mb-4">
                  特殊需求备注
                </h2>
                <textarea
                  value={demandData.specialRequirements}
                  onChange={(e) =>
                    setDemandData((prev) => ({ ...prev, specialRequirements: e.target.value }))
                  }
                  placeholder="请输入其他特殊需求或说明，如VIP接待区、机房标准、环保要求等..."
                  rows={4}
                  className="input-tech resize-none"
                />
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="card-base p-5 bg-gradient-to-r from-gold-500/5 to-transparent border-gold-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-100">第 3 步 · 方案报价</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      根据您的需求诊断，系统自动生成 4 档装修方案供选择，涵盖经济型到尊享型，明确分项报价、工期及材料配置。
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        4 档方案对比
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        透明分项报价
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        支持智能匹配服务商
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-neutral-100">选择装修方案</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  基于您的需求，我们为您准备了 {quotationPlans.length} 套装修方案对比
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {quotationPlans.map((plan) => {
                  const isSelected = selectedPlanLevel === plan.level;
                  return (
                    <motion.div
                      key={plan.level}
                      whileHover={{ y: -4 }}
                      className={cn(
                        'relative rounded-xl overflow-hidden transition-all cursor-pointer',
                        isSelected ? 'ring-2 ring-gold-400' : ''
                      )}
                      onClick={() => setSelectedPlanLevel(plan.level)}
                    >
                      <div className={cn(
                        'card-base h-full',
                        plan.highlight && '!from-gold-900/30 !via-primary-800/90 !to-gold-900/30'
                      )}>
                        {plan.highlight && (
                          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 text-center py-1 text-xs font-bold">
                            推荐选择
                          </div>
                        )}
                        <div className={cn('p-5', plan.highlight && 'pt-9')}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-neutral-100">{plan.name}</h3>
                            <div className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'border-gold-400 bg-gold-500'
                                : 'border-neutral-500'
                            )}>
                              {isSelected && <Check className="w-4 h-4 text-primary-900" />}
                            </div>
                          </div>
                          <p className="text-xs text-neutral-400 mb-4">{plan.description}</p>

                          <div className="mb-4">
                            <div className="text-3xl font-bold glow-text-gold">
                              ¥{formatPrice(plan.totalPrice)}
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              约 ¥{(plan.totalPrice / effectiveArea).toFixed(0)}/㎡
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-neutral-300 mb-4">
                            <Clock className="w-4 h-4 text-gold-400" />
                            预计工期：{plan.duration} 天
                          </div>

                          <div className="divider-gold my-4" />

                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-neutral-200 mb-2">材料配置</h4>
                            <div className="space-y-1.5">
                              {plan.materials.map((material, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-neutral-400">{material.name}</span>
                                  <span className="text-gold-300 font-medium">{material.brand}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-neutral-200 mb-2">包含项目</h4>
                            <ul className="space-y-1.5">
                              {plan.includedItems.slice(0, 5).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-neutral-400">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                              {plan.includedItems.length > 5 && (
                                <li className="text-xs text-gold-400">
                                  +{plan.includedItems.length - 5} 项更多服务
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-base p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-100 mb-4">
                    您已选择：<span className="text-gold-300">{selectedPlan.name}</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-primary-900/50">
                      <div className="text-2xl font-bold glow-text-gold">
                        ¥{formatPrice(selectedPlan.totalPrice)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">工程总价</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary-900/50">
                      <div className="text-2xl font-bold text-sky-300">
                        {selectedPlan.duration}天
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">预计工期</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary-900/50">
                      <div className="text-2xl font-bold text-emerald-300">
                        {selectedPlan.materials.length}项
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">主要材料</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary-900/50">
                      <div className="text-2xl font-bold text-violet-300">
                        {selectedPlan.includedItems.length}项
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">服务内容</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="card-base p-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-100">第 4 步 · 确认提交</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      请仔细核对房源信息、需求诊断、方案报价及服务期限，确认无误后提交工单，系统将自动推送至匹配的服务商。
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        全量信息复核
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        一键智能匹配服务商
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        工单自动创建
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-neutral-100">确认工单信息</h2>
                <p className="text-sm text-neutral-400 mt-1">请仔细核对以下信息，确认无误后提交</p>
              </div>

              <div className="card-base p-6">
                <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold-400" />
                  房源信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500">房源名称</div>
                    <div className="text-sm text-neutral-200 mt-1 font-medium">
                      {propertyData.mode === 'existing'
                        ? selectedProperty?.name
                        : propertyData.manualName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">房源类型</div>
                    <div className="text-sm text-neutral-200 mt-1 font-medium">
                      {propertyData.mode === 'existing'
                        ? selectedProperty?.type
                        : propertyData.manualType}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-neutral-500">房源地址</div>
                    <div className="text-sm text-neutral-200 mt-1 font-medium">
                      {propertyData.mode === 'existing'
                        ? selectedProperty?.location.address
                        : propertyData.manualAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">建筑面积</div>
                    <div className="text-sm text-gold-300 mt-1 font-bold">{effectiveArea} ㎡</div>
                  </div>
                </div>
              </div>

              <div className="card-base p-6">
                <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gold-400" />
                  需求诊断
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-neutral-500">预算区间</div>
                    <div className="text-sm text-gold-300 mt-1 font-bold">
                      {formatPrice(demandData.budgetRange[0])} - {formatPrice(demandData.budgetRange[1])}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">期望工期</div>
                    <div className="text-sm text-neutral-200 mt-1 font-medium">{demandData.duration} 天</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">员工人数</div>
                    <div className="text-sm text-neutral-200 mt-1 font-medium">{demandData.staffCount} 人</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">会议室数量</div>
                    <div className="text-sm text-neutral-200 mt-1 font-medium">{demandData.meetingRoomCount} 间</div>
                  </div>
                </div>

                <div className="divider-gold my-4" />

                <div className="mb-4">
                  <div className="text-xs text-neutral-500 mb-2">功能空间</div>
                  <div className="flex flex-wrap gap-2">
                    {facilityOptions.map((option) => (
                      demandData[option.key] && (
                        <span key={option.key} className="chip chip-gold">
                          {option.label}
                        </span>
                      )
                    ))}
                    {facilityOptions.every((option) => !demandData[option.key]) && (
                      <span className="text-sm text-neutral-500">无特殊功能空间需求</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-neutral-500 mb-2">设计风格</div>
                  <div className="flex flex-wrap gap-2">
                    {demandData.designStyles.map((style) => (
                      <span key={style} className="chip chip-gold">{style}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-neutral-500 mb-2">颜色偏好</div>
                  <div className="flex flex-wrap gap-2">
                    {demandData.colorPreference.length > 0 ? (
                      demandData.colorPreference.map((color) => (
                        <span key={color} className="chip">{color}</span>
                      ))
                    ) : (
                      <span className="text-sm text-neutral-500">无特殊颜色偏好</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-neutral-500 mb-2">光照要求</div>
                  <span className="chip">{demandData.lightingRequirement}</span>
                </div>

                {demandData.specialRequirements && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-2">特殊需求</div>
                    <p className="text-sm text-neutral-300 bg-primary-900/50 p-3 rounded-lg">
                      {demandData.specialRequirements}
                    </p>
                  </div>
                )}
              </div>

              <div className="card-base p-6">
                <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-gold-400" />
                  已选方案
                </h3>
                {selectedPlan && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-semibold text-gold-300 mb-2">{selectedPlan.name}</div>
                      <div className="text-4xl font-bold glow-text-gold mb-2">
                        ¥{formatPrice(selectedPlan.totalPrice)}
                      </div>
                      <div className="text-sm text-neutral-400">
                        约 ¥{(selectedPlan.totalPrice / effectiveArea).toFixed(0)}/㎡ · 工期 {selectedPlan.duration} 天
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-2">包含项目</div>
                      <ul className="grid grid-cols-2 gap-1">
                        {selectedPlan.includedItems.slice(0, 6).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <Check className="w-3 h-3 text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="btn-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? '返回列表' : '上一步'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                'btn-gold',
                !canProceed && 'opacity-50 cursor-not-allowed hover:transform-none'
              )}
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-gold"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  确认提交
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
