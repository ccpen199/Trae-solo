import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  X,
  Eye,
  Check,
  AlertCircle,
  Scale,
  Sparkles,
  Tag,
  User,
  Clock,
  Shirt,
  BookOpen,
  Smartphone,
  Package,
  FileText,
  Send,
  Plus,
  Minus,
  History,
  Camera,
  Zap,
  ShieldCheck,
  ChevronRight,
  Circle,
  CheckCircle2,
  ArrowLeftRight,
  Calculator,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type {
  Category,
  QualityOrderStatus,
  PricingRule,
} from '../../../shared/types';

const categoryIconMap: Record<Category, typeof Package> = {
  clothing: Shirt,
  books: BookOpen,
  phones: Smartphone,
};

const categoryLabelMap: Record<Category, string> = {
  clothing: '衣物',
  books: '图书',
  phones: '手机数码',
};

const imageTypeLabels = ['外观', '成色', '瑕疵', '重量'] as const;
type ImageType = (typeof imageTypeLabels)[number];

interface QualityImage {
  url: string;
  type: ImageType;
  uploadedBy: string;
  uploadedAt: string;
}

interface OperationLog {
  id: string;
  time: string;
  operator: string;
  action: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
}

interface PricingBreakdown {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  amount: number;
  description: string;
}

const statusMap: Record<QualityOrderStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-neutral-100 text-neutral-600' },
  'ai-screening': { label: 'AI初筛中', className: 'bg-blue-100 text-blue-700' },
  'manual-inspection': { label: '人工质检中', className: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', className: 'bg-eco-100 text-eco-700' },
};

export default function QualityDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { qualityOrders, orders, currentUser, pricingRules } = useStore();

  const qualityOrder = useMemo(
    () => qualityOrders.find((q) => q.id === id) || qualityOrders[0],
    [qualityOrders, id]
  );
  const order = useMemo(
    () => orders.find((o) => o.id === qualityOrder?.orderId) || orders[0],
    [orders, qualityOrder]
  );

  const CatIcon = order ? categoryIconMap[order.category] : Package;

  const completedSteps = qualityOrder?.sopSteps.filter((s) => s.completed).length || 0;
  const [currentStep, setCurrentStep] = useState(Math.min(completedSteps + 1, 5));

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const initialImages: QualityImage[] = useMemo(() => {
    const types: ImageType[] = ['外观', '成色', '瑕疵', '重量'];
    return (qualityOrder?.images || []).map((url, idx) => ({
      url,
      type: types[idx % types.length],
      uploadedBy: qualityOrder?.assignee || '质检师-王工',
      uploadedAt: qualityOrder?.createdAt || '2026-06-18 10:30:00',
    }));
  }, [qualityOrder]);

  const [images, setImages] = useState<QualityImage[]>(initialImages);

  const [condition, setCondition] = useState(
    qualityOrder?.manualResult?.condition || qualityOrder?.aiResult?.detectedCondition || 7
  );
  const [actualWeight, setActualWeight] = useState(
    qualityOrder?.manualResult?.actualWeightKg || order?.weightKg || 0
  );
  const [selectedDefects, setSelectedDefects] = useState<string[]>(
    qualityOrder?.manualResult?.defects || qualityOrder?.aiResult?.defects || []
  );
  const [notes, setNotes] = useState(qualityOrder?.manualResult?.notes || '');

  const operationLogs: OperationLog[] = useMemo(
    () => [
      {
        id: 'log-001',
        time: qualityOrder?.createdAt || '2026-06-17 10:00:00',
        operator: '系统',
        action: '创建工单',
        description: '质检工单已创建，等待分配',
      },
      {
        id: 'log-002',
        time: '2026-06-17 10:05:00',
        operator: qualityOrder?.assignee || '质检师-王工',
        action: '工单分配',
        description: '工单已分配给质检员',
      },
      {
        id: 'log-003',
        time: '2026-06-17 10:08:00',
        operator: 'AI系统',
        action: 'AI初筛完成',
        description: 'AI识别品类、成色、瑕疵检测完成',
        beforeValue: '-',
        afterValue: `${categoryLabelMap[order?.category || 'clothing']} / 成色${qualityOrder?.aiResult?.detectedCondition || 7}分`,
      },
      {
        id: 'log-004',
        time: '2026-06-17 10:15:00',
        operator: qualityOrder?.assignee || '质检师-王工',
        action: '开始人工质检',
        description: '质检员开始进行人工质检流程',
      },
      {
        id: 'log-005',
        time: '2026-06-17 10:20:00',
        operator: qualityOrder?.assignee || '质检师-王工',
        action: '完成外观检查',
        description: 'SOP步骤1：外观检查完成',
      },
      {
        id: 'log-006',
        time: '2026-06-17 10:25:00',
        operator: qualityOrder?.assignee || '质检师-王工',
        action: '完成称重测量',
        description: 'SOP步骤2：称重测量完成',
        beforeValue: `${order?.weightKg || 0} kg`,
        afterValue: `${actualWeight} kg`,
      },
      {
        id: 'log-007',
        time: '2026-06-17 10:32:00',
        operator: qualityOrder?.assignee || '质检师-王工',
        action: '成色评估变更',
        description: '调整了成色评估结果',
        beforeValue: `${qualityOrder?.aiResult?.detectedCondition || 7}分`,
        afterValue: `${condition}分`,
      },
    ],
    [qualityOrder, order, actualWeight, condition]
  );

  const defectOptions = [
    '轻微折痕',
    '书角磨损',
    '轻微褪色',
    '个别纽扣松动',
    '屏幕细微划痕',
    '边框磕碰',
    '电池老化',
    '功能异常',
    '污渍明显',
    '破损严重',
    '配件缺失',
    '包装损坏',
  ];

  const toggleDefect = (defect: string) => {
    setSelectedDefects((prev) =>
      prev.includes(defect) ? prev.filter((d) => d !== defect) : [...prev, defect]
    );
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const addImage = () => {
    const types: ImageType[] = ['外观', '成色', '瑕疵', '重量'];
    const newImage: QualityImage = {
      url: `https://picsum.photos/seed/new${Date.now()}/400/300`,
      type: types[images.length % types.length],
      uploadedBy: currentUser?.nickname || '运营管理员',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setImages((prev) => [...prev, newImage]);
  };

  const calcPricingBreakdown = (): PricingBreakdown[] => {
    const rules = pricingRules.filter(
      (r) => r.category === order?.category || r.category === 'all'
    );
    const baseWeight = actualWeight || 1;
    const baseCondition = condition / 10;

    return rules.map((rule: PricingRule) => {
      let matched = false;
      let amount = 0;

      if (rule.formula.type === 'per_kg') {
        matched = true;
        amount = rule.formula.basePrice * baseWeight * (1 + rule.formula.multipliers[0]?.factor || 0) * baseCondition;
      } else if (rule.formula.type === 'per_item') {
        matched = order?.category === 'phones';
        const quantity = order?.items.reduce((s, i) => s + i.quantity, 0) || 1;
        amount = rule.formula.basePrice * quantity * baseCondition;
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched,
        amount: Number(amount.toFixed(2)),
        description: rule.formula.type === 'per_kg'
          ? `基础价 ¥${rule.formula.basePrice}/kg × ${baseWeight}kg × 成色系数${baseCondition.toFixed(2)}`
          : `基础价 ¥${rule.formula.basePrice}/件 × ${order?.items.reduce((s, i) => s + i.quantity, 0) || 1}件 × 成色系数${baseCondition.toFixed(2)}`,
      };
    });
  };

  const pricingBreakdown = useMemo(calcPricingBreakdown, [actualWeight, condition, order, pricingRules]);

  const finalPrice = useMemo(() => {
    const total = pricingBreakdown.filter((b) => b.matched).reduce((s, b) => s + b.amount, 0);
    const defectDeduction = selectedDefects.length * 2;
    return Number(Math.max(0, total - defectDeduction).toFixed(2));
  }, [pricingBreakdown, selectedDefects]);

  const aiDefects = qualityOrder?.aiResult?.defects || [];
  const manualDefects = selectedDefects;

  const defectDiff = useMemo(() => {
    const onlyInAi = aiDefects.filter((d) => !manualDefects.includes(d));
    const onlyInManual = manualDefects.filter((d) => !aiDefects.includes(d));
    const common = aiDefects.filter((d) => manualDefects.includes(d));
    return { onlyInAi, onlyInManual, common };
  }, [aiDefects, manualDefects]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/quality')}
          className="p-2.5 rounded-xl bg-white shadow-card border border-neutral-100 hover:bg-eco-50 hover:border-eco-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">质检工单详情</h1>
          <p className="text-sm text-neutral-500 mt-1">
            质检单号：{qualityOrder?.id} · 订单号：{order?.orderNo}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-eco-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">基本信息</h3>
              <p className="text-xs text-neutral-400 mt-0.5">订单与用户基本资料</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('badge', statusMap[qualityOrder?.status || 'pending'].className)}>
              {statusMap[qualityOrder?.status || 'pending'].label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <Tag className="w-3.5 h-3.5" />
              订单号
            </div>
            <p className="font-mono font-semibold text-neutral-800 text-sm">{order?.orderNo}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <Package className="w-3.5 h-3.5" />
              品类
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-eco-50 flex items-center justify-center">
                <CatIcon className="w-3.5 h-3.5 text-eco-600" />
              </div>
              <span className="font-medium text-neutral-700">
                {order ? categoryLabelMap[order.category] : '-'}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <User className="w-3.5 h-3.5" />
              用户信息
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center text-white text-xs font-medium">
                {(currentUser?.nickname || '用户').slice(-2)}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">{currentUser?.nickname}</p>
                <p className="text-xs text-neutral-400">{currentUser?.phone}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <Clock className="w-3.5 h-3.5" />
              创建时间
            </div>
            <p className="font-medium text-neutral-700 text-sm">{qualityOrder?.createdAt}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <Circle className="w-3.5 h-3.5" />
              当前状态
            </div>
            <p className="font-medium text-neutral-700 text-sm">
              {statusMap[qualityOrder?.status || 'pending'].label}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              分配质检员
            </div>
            <p className="font-medium text-neutral-700 text-sm">
              {qualityOrder?.assignee || '待分配'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1 space-y-5">
          <div className="card p-5 overflow-hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                <History className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">操作日志</h3>
                <p className="text-xs text-neutral-400 mt-0.5">完整操作记录时间轴</p>
              </div>
            </div>
            <div className="relative pl-1 max-h-[520px] overflow-auto scrollbar-thin pr-2">
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-neutral-200" />
              <div className="space-y-5">
                {operationLogs.map((log, idx) => (
                  <div key={log.id} className="relative">
                    <div
                      className={cn(
                        'absolute -left-0.5 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10',
                        idx === operationLogs.length - 1
                          ? 'bg-eco-500'
                          : 'bg-white border-2 border-neutral-300'
                      )}
                    >
                      {idx === operationLogs.length - 1 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-neutral-400" />
                      )}
                    </div>
                    <div className="ml-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-neutral-800">{log.action}</span>
                        <span className="text-xs text-neutral-400">·</span>
                        <span className="text-xs text-neutral-500">{log.time}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-1.5">
                        <span className="text-violet-600 font-medium">{log.operator}</span>{' '}
                        {log.description}
                      </p>
                      {log.beforeValue && log.afterValue && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 line-through">
                            {log.beforeValue}
                          </span>
                          <ArrowLeftRight className="w-3 h-3 text-neutral-400" />
                          <span className="px-2 py-1 rounded-lg bg-eco-50 text-eco-700 font-medium">
                            {log.afterValue}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">定价依据拆解</h3>
                <p className="text-xs text-neutral-400 mt-0.5">多级定价规则匹配过程</p>
              </div>
            </div>
            <div className="space-y-3">
              {pricingBreakdown.map((item) => (
                <div
                  key={item.ruleId}
                  className={cn(
                    'p-3 rounded-xl border transition-all',
                    item.matched
                      ? 'bg-eco-50/50 border-eco-200'
                      : 'bg-neutral-50 border-neutral-200 opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {item.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-eco-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-400" />
                      )}
                      <span className="text-sm font-medium text-neutral-800">{item.ruleName}</span>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        item.matched ? 'text-eco-600' : 'text-neutral-400'
                      )}
                    >
                      {item.matched ? `+¥${item.amount.toFixed(2)}` : '未匹配'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 pl-6">{item.description}</p>
                </div>
              ))}
              {selectedDefects.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">瑕疵扣减</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      -¥{(selectedDefects.length * 2).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-red-500 pl-6">
                    {selectedDefects.length} 项瑕疵 × ¥2.00/项
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-eco-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">质检图片</h3>
                <p className="text-xs text-neutral-400 mt-0.5">多图上传，支持分类标注</p>
              </div>
              <span className="ml-auto badge bg-eco-100 text-eco-700">{images.length} 张</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden group bg-neutral-100 animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <img src={img.url} alt={`质检图片${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <span className="badge bg-white/90 text-neutral-700 backdrop-blur-sm">
                      {img.type}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setPreviewImage(img.url)}
                      className="p-2 rounded-lg bg-white/90 text-neutral-700 hover:bg-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white/80">{img.uploadedBy}</p>
                    <p className="text-xs text-white/60">{img.uploadedAt}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={addImage}
                className="aspect-[4/3] rounded-xl border-2 border-dashed border-neutral-200 hover:border-eco-400 hover:bg-eco-50/40 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-eco-600 transition-all"
              >
                <Plus className="w-7 h-7" />
                <span className="text-sm font-medium">上传图片</span>
              </button>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">AI初筛 vs 人工复核对比</h3>
                <p className="text-xs text-neutral-400 mt-0.5">智能识别与人工质检结果对比</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-neutral-800">AI初筛结果</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">识别品类</p>
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-neutral-800">
                        {order ? categoryLabelMap[order.category] : '-'}
                      </span>
                      <span className="text-xs text-blue-600 font-medium">
                        {Math.round((qualityOrder?.aiResult?.categoryConfidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-neutral-500">检测成色</p>
                      <span className="text-sm font-bold text-blue-600">
                        {qualityOrder?.aiResult?.detectedCondition || 0} / 10
                      </span>
                    </div>
                    <div className="h-2 bg-blue-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                        style={{
                          width: `${(qualityOrder?.aiResult?.detectedCondition || 0) * 10}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-neutral-500">整体置信度</p>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round((qualityOrder?.aiResult?.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-blue-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                        style={{
                          width: `${(qualityOrder?.aiResult?.confidence || 0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">检测到的瑕疵</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiDefects.length === 0 ? (
                        <span className="text-xs text-neutral-400">未检测到明显瑕疵</span>
                      ) : (
                        aiDefects.map((d, i) => (
                          <span
                            key={i}
                            className="badge bg-blue-100 text-blue-700 border border-blue-200"
                          >
                            {d}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-eco-50/50 border border-eco-200">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-eco-600" />
                  <span className="font-semibold text-neutral-800">人工复核结果</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">识别品类</p>
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-4 h-4 text-eco-600" />
                      <span className="font-semibold text-neutral-800">
                        {order ? categoryLabelMap[order.category] : '-'}
                      </span>
                      <span className="text-xs text-eco-600 font-medium">100%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-neutral-500">实际成色</p>
                      <span className="text-sm font-bold text-eco-600">{condition} / 10</span>
                    </div>
                    <div className="h-2 bg-eco-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-eco-400 to-emerald-500 rounded-full"
                        style={{ width: `${condition * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-neutral-500">实际重量</p>
                      <span className="text-sm font-bold text-eco-600">{actualWeight} kg</span>
                    </div>
                    <div className="h-2 bg-eco-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-eco-400 to-emerald-500 rounded-full"
                        style={{ width: `${Math.min((actualWeight / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">人工标记瑕疵</p>
                    <div className="flex flex-wrap gap-1.5">
                      {manualDefects.length === 0 ? (
                        <span className="text-xs text-neutral-400">未标记瑕疵</span>
                      ) : (
                        manualDefects.map((d, i) => (
                          <span
                            key={i}
                            className="badge bg-eco-100 text-eco-700 border border-eco-200"
                          >
                            {d}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-neutral-800">差异分析</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">成色差异</p>
                  <p className="font-semibold">
                    {qualityOrder?.aiResult?.detectedCondition !== condition
                      ? `${qualityOrder?.aiResult?.detectedCondition || 0}分 → ${condition}分 (${condition > (qualityOrder?.aiResult?.detectedCondition || 0) ? '+' : ''}${condition - (qualityOrder?.aiResult?.detectedCondition || 0)}分)`
                      : '无差异'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">AI漏检瑕疵</p>
                  <p className="font-semibold">
                    {defectDiff.onlyInManual.length > 0 ? defectDiff.onlyInManual.join('、') : '无'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">AI误检瑕疵</p>
                  <p className="font-semibold">
                    {defectDiff.onlyInAi.length > 0 ? defectDiff.onlyInAi.join('、') : '无'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-eco-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">SOP 质检流程</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  已完成 {completedSteps} / {qualityOrder?.sopSteps.length || 5} 步
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 mx-8" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-eco-400 to-eco-500 mx-8 transition-all duration-500"
                style={{
                  width: `calc(${(completedSteps / (qualityOrder?.sopSteps.length || 5)) * 100}% - 4rem)`,
                }}
              />
              <div className="relative grid grid-cols-5 gap-2">
                {(qualityOrder?.sopSteps || []).map((step, idx) => {
                  const stepIndex = idx + 1;
                  const isCompleted = step.completed;
                  const isCurrent = stepIndex === currentStep;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(stepIndex)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div
                        className={cn(
                          'relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 z-10',
                          isCompleted
                            ? 'bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-card'
                            : isCurrent
                            ? 'bg-white border-2 border-eco-500 text-eco-600 shadow-card'
                            : 'bg-white border-2 border-neutral-200 text-neutral-400 group-hover:border-neutral-300'
                        )}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : stepIndex}
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            'text-sm font-medium transition-colors',
                            isCompleted || isCurrent ? 'text-neutral-800' : 'text-neutral-400'
                          )}
                        >
                          {step.name}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5 hidden md:block">
                          {step.description}
                        </p>
                        {isCompleted && step.completedAt && (
                          <p className="text-xs text-eco-600 mt-1">{step.completedAt}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-eco-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">人工质检结果</h3>
                <p className="text-xs text-neutral-400 mt-0.5">请仔细填写实际质检数据</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label-base !mb-0 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-eco-500" />
                    成色评估
                  </label>
                  <span className="text-lg font-bold text-eco-600">{condition} / 10</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={condition}
                    onChange={(e) => setCondition(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-eco-400 [&::-webkit-slider-thumb]:to-eco-600 [&::-webkit-slider-thumb]:shadow-card [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-eco-400 to-eco-500 rounded-full pointer-events-none"
                    style={{ width: `${(condition / 10) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-400">
                  <span>破损严重</span>
                  <span>一般</span>
                  <span>九成新</span>
                  <span>全新</span>
                </div>
              </div>
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-eco-500" />
                  实际重量 (kg)
                </label>
                <div className="relative">
                  <button
                    onClick={() =>
                      setActualWeight(Math.max(0, Number((actualWeight - 0.1).toFixed(2))))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={actualWeight}
                    onChange={(e) => setActualWeight(Number(e.target.value))}
                    className="input-base !pl-12 !pr-12 text-center text-lg font-semibold"
                  />
                  <button
                    onClick={() => setActualWeight(Number((actualWeight + 0.1).toFixed(2)))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  瑕疵标记
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {defectOptions.map((defect) => {
                    const isSelected = selectedDefects.includes(defect);
                    return (
                      <button
                        key={defect}
                        onClick={() => toggleDefect(defect)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left',
                          isSelected
                            ? 'bg-eco-50 border-eco-300 text-eco-700'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                              isSelected ? 'bg-eco-500 border-eco-500' : 'border-neutral-300'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {defect}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label-base">备注说明</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="请输入质检备注说明..."
                  className="input-base resize-none"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 border-2 border-eco-200 bg-gradient-to-br from-eco-50/50 to-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center shadow-card">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">最终定价</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">基于质检结果计算</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 mb-1">预估价格</p>
                <p className="text-sm text-neutral-600 line-through">
                  ¥{order?.estimatedPrice.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="p-3 rounded-xl bg-white border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">规则匹配金额</p>
                <p className="text-lg font-bold text-neutral-800">
                  ¥{pricingBreakdown.filter((b) => b.matched).reduce((s, b) => s + b.amount, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">成色系数</p>
                <p className="text-lg font-bold text-neutral-800">×{(condition / 10).toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">瑕疵扣减</p>
                <p className="text-lg font-bold text-red-600">
                  -¥{(selectedDefects.length * 2).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-eco-500 to-eco-600 text-white">
                <p className="text-xs text-eco-100 mb-1">最终定价</p>
                <p className="text-2xl font-bold">¥{finalPrice.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary flex-1">保存草稿</button>
              <button className="btn-primary flex-1 gap-2">
                <Send className="w-4.5 h-4.5" />
                提交质检结果
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-700" />
            </button>
            <img
              src={previewImage}
              alt="预览"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
