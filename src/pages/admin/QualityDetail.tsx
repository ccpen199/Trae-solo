import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockQualityOrders, mockOrders, mockUser } from '@/data/mockData';

const sopSteps = [
  { id: 'step-1', name: '外观检查', desc: '检查物品外观是否完好' },
  { id: 'step-2', name: '成色评估', desc: '根据标准评估成色等级' },
  { id: 'step-3', name: '重量称量', desc: '精确称量物品实际重量' },
  { id: 'step-4', name: '瑕疵标记', desc: '标记所有发现的瑕疵' },
  { id: 'step-5', name: '结果确认', desc: '确认质检结果并提交' },
];

const defectOptions = [
  '轻微折痕', '书角磨损', '轻微褪色', '个别纽扣松动',
  '屏幕细微划痕', '边框磕碰', '电池老化', '功能异常',
  '污渍明显', '破损严重', '配件缺失', '包装损坏',
];

const categoryIconMap: Record<string, typeof Package> = {
  clothing: Shirt,
  books: BookOpen,
  phones: Smartphone,
};

const categoryLabelMap: Record<string, string> = {
  clothing: '衣服',
  books: '图书',
  phones: '手机',
};

export default function QualityDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const qualityOrder = mockQualityOrders.find((q) => q.id === id) || mockQualityOrders[0];
  const order = mockOrders.find((o) => o.id === qualityOrder.orderId) || mockOrders[0];
  const CatIcon = categoryIconMap[order?.category] || Package;

  const completedSteps = qualityOrder.sopSteps.filter((s) => s.completed).length;
  const [currentStep, setCurrentStep] = useState(Math.min(completedSteps + 1, 5));

  const [uploadedImages, setUploadedImages] = useState<string[]>([
    ...qualityOrder.images,
    'https://picsum.photos/seed/new1/400/300',
  ]);
  const [condition, setCondition] = useState(qualityOrder.manualResult?.condition || qualityOrder.aiResult?.detectedCondition || 7);
  const [actualWeight, setActualWeight] = useState(qualityOrder.manualResult?.actualWeightKg || order.weightKg || 0);
  const [selectedDefects, setSelectedDefects] = useState<string[]>(
    qualityOrder.manualResult?.defects || qualityOrder.aiResult?.defects || []
  );
  const [notes, setNotes] = useState(qualityOrder.manualResult?.notes || '');

  const toggleDefect = (defect: string) => {
    setSelectedDefects((prev) =>
      prev.includes(defect) ? prev.filter((d) => d !== defect) : [...prev, defect]
    );
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const calcFinalPrice = () => {
    if (order.category === 'phones') {
      const base = order.items.reduce((s, i) => s + i.estimatedPrice, 0);
      return Math.round(base * (condition / 10) * 0.95);
    }
    return Number((actualWeight * 2.5 * (condition / 10)).toFixed(2));
  };

  const finalPrice = calcFinalPrice();

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/quality')}
          className="p-2.5 rounded-xl bg-white shadow-card border border-neutral-100 hover:bg-eco-50 hover:border-eco-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">质检工单详情</h1>
          <p className="text-sm text-neutral-500 mt-1">订单号：{order.orderNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-4">
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
              <span className={cn(
                'badge',
                qualityOrder.status === 'completed' ? 'bg-eco-100 text-eco-700' :
                qualityOrder.status === 'ai-screening' ? 'bg-blue-100 text-blue-700' :
                qualityOrder.status === 'manual-inspection' ? 'bg-amber-100 text-amber-700' :
                'bg-neutral-100 text-neutral-600'
              )}>
                {qualityOrder.status === 'completed' ? '已完成' :
                 qualityOrder.status === 'ai-screening' ? 'AI初筛中' :
                 qualityOrder.status === 'manual-inspection' ? '人工质检中' : '待处理'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  订单号
                </div>
                <p className="font-semibold text-neutral-800">{order.orderNo}</p>
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
                  <span className="font-medium text-neutral-700">{categoryLabelMap[order.category]}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  用户信息
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center text-white text-xs font-medium">
                    {mockUser.nickname.slice(-2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">{mockUser.nickname}</p>
                    <p className="text-xs text-neutral-400">{mockUser.phone}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  创建时间
                </div>
                <p className="font-medium text-neutral-700">{qualityOrder.createdAt}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-eco-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">SOP 质检流程</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  已完成 {completedSteps} / {sopSteps.length} 步
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 mx-8" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-eco-400 to-eco-500 mx-8 transition-all duration-500"
                style={{ width: `calc(${(completedSteps / sopSteps.length) * 100}% - 4rem)` }}
              />
              <div className="relative grid grid-cols-5 gap-2">
                {sopSteps.map((step, idx) => {
                  const stepIndex = idx + 1;
                  const isCompleted = stepIndex <= completedSteps;
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
                        <p className="text-xs text-neutral-400 mt-0.5 hidden md:block">{step.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-eco-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">质检图片</h3>
                <p className="text-xs text-neutral-400 mt-0.5">上传物品多角度照片（支持多图）</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {uploadedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden group bg-neutral-100 animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <img
                    src={img}
                    alt={`质检图片${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button className="p-2 rounded-lg bg-white/90 text-neutral-700 hover:bg-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="aspect-[4/3] rounded-xl border-2 border-dashed border-neutral-200 hover:border-eco-400 hover:bg-eco-50/40 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-eco-600 transition-all">
                <Plus className="w-7 h-7" />
                <span className="text-sm font-medium">上传图片</span>
              </button>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-eco-600" />
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
                    onClick={() => setActualWeight(Math.max(0, Number((actualWeight - 0.1).toFixed(2))))}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
        </div>

        <div className="xl:col-span-1 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">AI 初筛结果</h3>
                <p className="text-xs text-neutral-400 mt-0.5">智能识别仅供参考</p>
              </div>
            </div>

            {qualityOrder.aiResult ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 mb-1">识别品类</p>
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-5 h-5 text-eco-600" />
                    <span className="font-semibold text-neutral-800">{categoryLabelMap[order.category]}</span>
                    <span className="text-xs text-eco-600 font-medium">
                      {Math.round((qualityOrder.aiResult.categoryConfidence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-neutral-400">检测成色</p>
                    <span className="text-sm font-bold text-eco-600">{qualityOrder.aiResult.detectedCondition} / 10</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-eco-400 to-eco-500 rounded-full transition-all"
                      style={{ width: `${qualityOrder.aiResult.detectedCondition * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-neutral-400">整体置信度</p>
                    <span className="text-sm font-bold text-blue-600">
                      {Math.round((qualityOrder.aiResult.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${(qualityOrder.aiResult.confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 mb-2">检测到的瑕疵</p>
                  <div className="flex flex-wrap gap-1.5">
                    {qualityOrder.aiResult.defects.length === 0 ? (
                      <span className="text-xs text-neutral-400">未检测到明显瑕疵</span>
                    ) : (
                      qualityOrder.aiResult.defects.map((d, i) => (
                        <span key={i} className="badge bg-amber-50 text-amber-700 border border-amber-200">
                          {d}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-400 text-sm">
                AI 初筛结果暂未生成
              </div>
            )}
          </div>

          <div className="card p-5 border-2 border-eco-200 bg-gradient-to-br from-eco-50/50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center shadow-card">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">最终定价</h3>
                <p className="text-xs text-neutral-400 mt-0.5">基于质检结果计算</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">预估价格</span>
                <span className="text-neutral-600">¥{order.estimatedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">成色系数</span>
                <span className="text-neutral-600">×{(condition / 10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">实际重量</span>
                <span className="text-neutral-600">{actualWeight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">瑕疵扣减</span>
                <span className="text-red-500">-¥{(order.estimatedPrice * 0.05 * selectedDefects.length).toFixed(2)}</span>
              </div>
              <div className="border-t border-eco-200 pt-3">
                <div className="flex justify-between items-end">
                  <span className="text-neutral-600 font-medium">最终定价</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-eco-600">¥{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="btn-primary w-full gap-2">
              <Send className="w-4.5 h-4.5" />
              提交质检结果
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
