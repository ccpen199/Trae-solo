import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Shield,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  PenTool,
  UserCheck,
  ClipboardCheck,
  Lock,
} from 'lucide-react';
import type { Product } from '@shared/types';
import { cn } from '@/lib/utils';

const allProducts: Record<string, Product> = {
  p1: {
    id: 'p1', merchantId: 'm1', name: '皇家幼犬粮 2kg 全价营养配方 支持消化系统健康',
    category: '主粮', species: ['dog'], ageRange: '幼年', healthCondition: [],
    price: 158.0, stock: 156, isPrescription: false, images: [],
    description: '专为幼犬设计的全价营养配方粮，采用高品质动物蛋白，支持消化系统健康和免疫系统发育。含有DHA和EPA，促进大脑和视力发育。',
  },
  p2: {
    id: 'p2', merchantId: 'm1', name: '猫砂膨润土除臭无尘 10L',
    category: '日用品', species: ['cat'], ageRange: '全年龄', healthCondition: [],
    price: 69.9, stock: 5, isPrescription: false, images: [],
    description: '高品质膨润土猫砂，除臭无尘，结团力强，适合猫咪日常使用。',
  },
  p3: {
    id: 'p3', merchantId: 'm2', name: '拜宠爽体外驱虫滴剂（犬用）',
    category: '驱虫药', species: ['dog'], ageRange: '成年', healthCondition: [],
    price: 128.0, stock: 89, isPrescription: true, images: [],
    description: '拜宠爽体外驱虫滴剂，用于犬只体外寄生虫预防和治疗。需执业兽医师开具处方，宠主知情确认后方可购买。本品含氟虫腈及双甲脒，仅限犬用。',
  },
  p4: {
    id: 'p4', merchantId: 'm1', name: '宠物营养膏 猫狗通用 120g',
    category: '营养品', species: ['dog', 'cat'], ageRange: '全年龄', healthCondition: [],
    price: 45.0, stock: 234, isPrescription: false, images: [],
    description: '猫狗通用营养膏，含多种维生素和矿物质，适合日常营养补充。',
  },
  p5: {
    id: 'p5', merchantId: 'm3', name: '狗狗磨牙棒零食 500g',
    category: '零食', species: ['dog'], ageRange: '全年龄', healthCondition: [],
    price: 39.9, stock: 456, isPrescription: false, images: [],
    description: '天然牛皮磨牙棒，帮助清洁牙齿，减少牙垢积累。',
  },
  p6: {
    id: 'p6', merchantId: 'm1', name: '猫罐头湿粮混合口味 12罐',
    category: '零食', species: ['cat'], ageRange: '成年', healthCondition: [],
    price: 118.0, stock: 178, isPrescription: false, images: [],
    description: '混合口味猫罐头，含鸡肉、鱼肉、牛肉三种口味，营养均衡。',
  },
  p7: {
    id: 'p7', merchantId: 'm4', name: '宠物自动喂食器 智能定时',
    category: '日用品', species: ['dog', 'cat'], ageRange: '全年龄', healthCondition: [],
    price: 299.0, stock: 45, isPrescription: false, images: [],
    description: '智能定时喂食器，支持手机远程操控，定时定量喂养。',
  },
  p8: {
    id: 'p8', merchantId: 'm2', name: '猫咪化毛膏 120g',
    category: '营养品', species: ['cat'], ageRange: '成年', healthCondition: [],
    price: 58.0, stock: 267, isPrescription: false, images: [],
    description: '化毛膏帮助猫咪排出体内毛球，保护肠胃健康。',
  },
};

const mockPrescriptionFlow = {
  prescriptionId: 'RX-20260616-001',
  status: 'pending' as const,
  doctorName: '王建国',
  doctorLicenseNo: 'VET-BJ-2024-00891',
  doctorSignature: null as string | null,
  ownerAcknowledged: false,
  createdAt: '2026-06-16 10:30:00',
  validUntil: '2026-06-23 10:30:00',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [prescriptionStep, setPrescriptionStep] = useState<'pending' | 'doctor_signed' | 'owner_confirmed' | 'approved'>('pending');
  const [showPrescriptionPanel, setShowPrescriptionPanel] = useState(false);

  const product = allProducts[id || 'p1'] || allProducts.p1;

  const handleDoctorSign = () => {
    setPrescriptionStep('doctor_signed');
  };

  const handleOwnerAcknowledge = () => {
    setPrescriptionStep('owner_confirmed');
    setTimeout(() => setPrescriptionStep('approved'), 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white hover:bg-forest-50 transition-colors shadow-card"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="section-title flex-1">商品详情</h1>
        <button
          onClick={() => setLiked(!liked)}
          className="p-2.5 rounded-xl bg-white hover:bg-red-50 transition-colors shadow-card"
        >
          <Heart className={cn('w-5 h-5', liked ? 'text-red-500 fill-red-500' : 'text-gray-500')} />
        </button>
        <button className="p-2.5 rounded-xl bg-white hover:bg-forest-50 transition-colors shadow-card">
          <Share2 className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card !p-0 overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center relative">
            <Package className="w-24 h-24 text-forest-200" />
            {product.isPrescription && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-100 text-warm-600 text-sm font-semibold">
                <Pill className="w-4 h-4" /> 处方药
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 p-4 border-t border-forest-50">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-forest-300 transition-all"
              >
                <Package className="w-8 h-8 text-forest-200" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start gap-3 mb-3">
              {product.isPrescription && (
                <span className="tag tag-orange flex items-center gap-1">
                  <Pill className="w-3 h-3" />
                  处方药
                </span>
              )}
              <span className="tag tag-green">{product.category}</span>
              <span className="tag tag-gray">{product.ageRange}</span>
            </div>
            <h1 className="font-display font-bold text-xl text-gray-900 mb-3">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn('w-4 h-4', i <= 4 ? 'text-warm-400 fill-warm-400' : 'text-gray-200')}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">4.8</span>
              </div>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">已售 2.3k+</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">{product.stock} 件库存</span>
            </div>
            <div className="flex items-baseline gap-2 p-4 rounded-2xl bg-warm-50">
              <span className="text-sm text-warm-500">¥</span>
              <span className="text-3xl font-bold text-warm-500">{product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-400 line-through ml-2">¥{Math.round(product.price * 1.3).toFixed(2)}</span>
            </div>
          </div>

          {product.isPrescription && (
            <div className="card border-2 border-warm-200 bg-gradient-to-br from-warm-50 to-orange-50 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-warm-600" />
                <h3 className="font-display font-bold text-base text-warm-800">处方药双签验证</h3>
              </div>
              <p className="text-[11px] text-warm-600 leading-relaxed">
                根据《兽药管理条例》，处方药购买需经执业兽医师开具处方并电子签名，宠主知情确认后方可完成购买。双签记录永久留痕，可审计追溯。
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-warm-100">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    prescriptionStep !== 'pending' ? 'bg-forest-100 text-forest-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">① 医生电子签名</span>
                      {prescriptionStep !== 'pending' ? (
                        <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-warm-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {prescriptionStep !== 'pending'
                        ? `${mockPrescriptionFlow.doctorName} · 执业证号 ${mockPrescriptionFlow.doctorLicenseNo} · 已签名`
                        : '等待执业兽医师开具处方并电子签名'}
                    </p>
                  </div>
                  {prescriptionStep === 'pending' && (
                    <button
                      onClick={handleDoctorSign}
                      className="px-3 py-1.5 rounded-lg bg-warm-100 text-warm-700 text-xs font-semibold hover:bg-warm-200 transition-colors whitespace-nowrap"
                    >
                      模拟签名
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-warm-100">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    prescriptionStep === 'owner_confirmed' || prescriptionStep === 'approved' ? 'bg-forest-100 text-forest-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">② 宠主知情确认</span>
                      {prescriptionStep === 'owner_confirmed' || prescriptionStep === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-warm-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {prescriptionStep === 'owner_confirmed' || prescriptionStep === 'approved'
                        ? '宠主已确认知情并同意购买'
                        : '需宠主确认已了解用药风险与注意事项'}
                    </p>
                  </div>
                  {prescriptionStep === 'doctor_signed' && (
                    <button
                      onClick={handleOwnerAcknowledge}
                      className="px-3 py-1.5 rounded-lg bg-warm-100 text-warm-700 text-xs font-semibold hover:bg-warm-200 transition-colors whitespace-nowrap"
                    >
                      确认知情
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-warm-100">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    prescriptionStep === 'approved' ? 'bg-forest-100 text-forest-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">③ 处方复核通过</span>
                      {prescriptionStep === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-warm-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {prescriptionStep === 'approved'
                        ? `处方号 ${mockPrescriptionFlow.prescriptionId} · 双签完成 · 可购买`
                        : '双签完成后自动复核，通过即可购买'}
                    </p>
                  </div>
                </div>
              </div>

              {prescriptionStep === 'approved' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-forest-50 border border-forest-200">
                  <Lock className="w-4 h-4 text-forest-600" />
                  <span className="text-xs text-forest-700 font-semibold">双签验证通过，处方药已解锁购买</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-warm-500">
                <FileText className="w-3 h-3" />
                <span>处方号：{mockPrescriptionFlow.prescriptionId}</span>
                <span>·</span>
                <span>有效期至 {mockPrescriptionFlow.validUntil}</span>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">服务保障</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-forest-500" />
                正品保障
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4 text-forest-500" />
                极速发货
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="w-4 h-4 text-forest-500" />
                7天退换
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">购买数量</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-9 h-9 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              {product.isPrescription && prescriptionStep !== 'approved' ? (
                <>
                  <button disabled className="btn-secondary flex-1 opacity-50 cursor-not-allowed">
                    <ShoppingCart className="w-5 h-5" />
                    需双签验证
                  </button>
                  <button disabled className="btn-primary flex-1 opacity-50 cursor-not-allowed">
                    处方待审核
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary flex-1">
                    <ShoppingCart className="w-5 h-5" />
                    加入购物车
                  </button>
                  <button className="btn-primary flex-1">
                    立即购买
                  </button>
                </>
              )}
            </div>
            {product.isPrescription && prescriptionStep !== 'approved' && (
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-warm-50 border border-warm-100">
                <AlertTriangle className="w-4 h-4 text-warm-500 shrink-0" />
                <span className="text-[11px] text-warm-600">
                  处方药需完成「医生签名 → 宠主确认 → 复核通过」双签流程后方可购买
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-4">商品详情</h3>
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">适用物种</p>
            <p className="font-semibold text-gray-900">{product.species.join('、')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">适用年龄</p>
            <p className="font-semibold text-gray-900">{product.ageRange}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">商品分类</p>
            <p className="font-semibold text-gray-900">{product.category}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">库存状态</p>
            <p className="font-semibold text-forest-600">现货充足</p>
          </div>
        </div>
      </div>
    </div>
  );
}
