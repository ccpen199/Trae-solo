import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Clock,
  Shield,
  Eye,
  Type,
  Image as ImageIcon,
  Move,
  Palette,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Package,
  ShieldCheck,
  Lock,
  EyeOff,
  Users,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Card, CardContent } from '@/components/ui/Card';
import SectionTitle from '@/components/common/SectionTitle';
import Breadcrumb from '@/components/common/Breadcrumb';
import TemplateCard from '@/components/product/TemplateCard';
import { products } from '@/mock/data/products';
import { templates } from '@/mock/data/templates';
import { materials } from '@/mock/data/materials';
import type { ProductCategory, MaterialOption, ProductFeature } from '@/types';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

const editableFeaturesList = [
  { icon: Move, label: '拖拽图文', description: '自由拖拽图片和文字' },
  { icon: Type, label: '字体替换', description: '多种字体可选' },
  { icon: Palette, label: '颜色编辑', description: '自定义配色方案' },
  { icon: ImageIcon, label: '图片滤镜', description: '多款滤镜效果' },
  { icon: Sparkles, label: '特效装饰', description: '丰富装饰元素' },
  { icon: Eye, label: '实时预览', description: '所见即所得编辑' },
];

const faqList = [
  {
    question: '产品的生产周期是多久？',
    answer: '一般产品的生产周期通常为3-5个工作日，具体时间根据产品类型和数量有所不同。定制产品可能需要额外1-2天的生产时间。',
  },
  {
    question: '可以退换货政策是怎样的？',
    answer: '定制产品不支持无理由退换货。如有质量问题，请在收到商品后7天内联系客服，我们将为您提供退换货服务。',
  },
  {
    question: '支持哪些支付方式？',
    answer: '支持微信支付、支付宝、银行卡等多种支付方式。企业用户还可以使用企业对公转账。',
  },
  {
    question: '如何查看我的订单物流信息？',
    answer: '您可以在"我的订单"页面查看所有订单的状态和物流信息。发货后会有短信通知您物流单号。',
  },
  {
    question: '模板可以修改吗？',
    answer: '所有模板都支持在线编辑修改。您可以更换照片、修改文字、调整布局等，打造专属于您的定制产品。',
  },
];

const shippingMethods = [
  {
    id: 'standard',
    name: '普通快递',
    icon: Package,
    description: '中通/圆通/韵达等',
    days: '2-3天',
    price: '¥8起',
    freeThreshold: '满99元包邮',
  },
  {
    id: 'sf',
    name: '顺丰速运',
    icon: Truck,
    description: '快速安全配送',
    days: '1-2天',
    price: '¥15起',
    freeThreshold: '满199元包邮',
  },
  {
    id: 'pickup',
    name: '到店自取',
    icon: MapPin,
    description: '线下门店自提',
    days: '生产完成即可取',
    price: '免费',
    freeThreshold: '无需运费',
  },
];

const shippingRegionRules = [
  { region: '华东地区', provinces: '上海、江苏、浙江、安徽', fee: '包邮', remark: '满99元' },
  { region: '华北地区', provinces: '北京、天津、河北、山西、内蒙古', fee: '包邮', remark: '满99元' },
  { region: '华南地区', provinces: '广东、广西、海南、福建', fee: '包邮', remark: '满99元' },
  { region: '华中地区', provinces: '湖北、湖南、河南、江西', fee: '包邮', remark: '满99元' },
  { region: '西南地区', provinces: '四川、重庆、贵州、云南', fee: '包邮', remark: '满129元' },
  { region: '东北地区', provinces: '辽宁、吉林、黑龙江', fee: '包邮', remark: '满129元' },
  { region: '西北地区', provinces: '陕西、甘肃、青海、宁夏', fee: '¥10', remark: '满149元包邮' },
  { region: '偏远地区', provinces: '新疆、西藏', fee: '¥20', remark: '不参与包邮' },
];

const auditProcessSteps = [
  { step: 1, title: '提交素材', description: '设计师上传原创素材并提交审核' },
  { step: 2, title: '初审', description: '审核专员检查素材质量与完整性' },
  { step: 3, title: '复审', description: '资深审核员确认版权与合规性' },
  { step: 4, title: '上架', description: '审核通过后素材正式上架展示' },
];

const privacySettings = [
  {
    id: 'public',
    name: '公开',
    icon: Eye,
    description: '所有人可见，可在社区广场展示',
    color: 'text-forest-500',
    bgColor: 'bg-forest-50',
  },
  {
    id: 'private',
    name: '仅自己',
    icon: EyeOff,
    description: '只有您自己可以查看',
    color: 'text-brand-500',
    bgColor: 'bg-brand-50',
  },
  {
    id: 'friends',
    name: '指定好友',
    icon: Users,
    description: '仅您指定的好友可见',
    color: 'text-gold-500',
    bgColor: 'bg-gold-50',
  },
];

const privacyGuarantees = [
  { icon: Lock, title: '照片仅用于生产', description: '您上传的照片仅用于定制产品生产，不会用于其他用途' },
  { icon: Database, title: '云端加密存储', description: '所有照片采用银行级加密存储，保障数据安全' },
  { icon: ShieldCheck, title: '隐私承诺保障', description: '严格遵守隐私保护法规，确保您的个人信息安全' },
];

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedBinding, setSelectedBinding] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const product = products.find((p) => p.id === productId);
  const productTemplates = templates.filter((t) => t.productId === productId);

  const detailImages = [
    `https://picsum.photos/seed/${productId}-main/800/600`,
    `https://picsum.photos/seed/${productId}-2/800/600`,
    `https://picsum.photos/seed/${productId}-3/800/600`,
    `https://picsum.photos/seed/${productId}-4/800/600`,
    `https://picsum.photos/seed/${productId}-5/800/600`,
  ];

  const materialOptions: MaterialOption[] = materials
  .filter((m) => {
    if (productId === 'album' || productId === 'calendar-desk' || productId === 'calendar-wall' || productId === 'lomo-card' || productId === 'postcard') {
      return m.category === 'photo-paper';
    } else if (productId === 'photo-wall' || productId === 'wood-print') {
      return m.category === 'frame';
    } else if (productId === 'mug') {
      return m.category === 'ceramic';
    } else if (productId === 'pillow') {
      return m.category === 'fabric';
    } else if (productId === 'phone-case') {
      return m.category === 'other';
    }
    return true;
  })
  .map((m) => ({
    name: m.name,
    price: Math.round((product?.priceRange.min || 39) * (m.priceMultiplier - 1) * 100),
    description: m.description,
    image: `https://picsum.photos/seed/${m.id}/200/150`,
  }));

  const sizeOptions = (() => {
    switch (productId) {
      case 'album':
        return ['6寸', '8寸', '10寸', '12寸'];
      case 'calendar-desk':
        return ['标准款', '大号款'];
      case 'calendar-wall':
        return ['A3', 'A2'];
      case 'lomo-card':
      case 'postcard':
      case 'fridge-magnet':
        return ['标准尺寸'];
      case 'photo-wall':
        return ['5框组合', '9框组合', '12框组合'];
      case 'wood-print':
        return ['8寸', '10寸', '12寸'];
      case 'mug':
        return ['标准款', '大容量款'];
      case 'pillow':
        return ['40x40cm', '45x45cm', '50x50cm'];
      case 'phone-case':
        return ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', '华为 Mate 60'];
      case 'puzzle':
        return ['300片', '500片', '1000片'];
      default:
        return ['标准尺寸'];
    }
  })();

  const bindingOptions = (() => {
    if (productId === 'album') {
      return ['软壳简装', '硬壳精装', '蝴蝶装'];
    }
    return [];
  })();

  const features: ProductFeature[] = [
    {
      icon: '🎨',
      title: '高清印刷',
      description: '采用进口印刷设备，色彩还原度高，画面清晰细腻',
    },
    {
      icon: '📸',
      title: '优质材质',
      description: '精选优质原材料，环保安全，经久耐用',
    },
    {
      icon: '✨',
      title: '个性定制',
      description: '支持在线编辑器，轻松打造专属定制产品',
    },
    {
      icon: '🎁',
      title: '精美包装',
      description: '精美礼盒包装，送礼自用两相宜',
    },
    {
      icon: '🚚',
      title: '快速发货',
      description: '3-5个工作日生产，全国包邮到家',
    },
    {
      icon: '💝',
      title: '品质保证',
      description: '品质问题包退换，售后无忧',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBar(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <p className="text-lg font-medium text-paper-600">产品不存在</p>
          <Button
            className="mt-4"
            onClick={() => navigate('/products')}
          >
            返回产品列表
          </Button>
        </div>
      </div>
    );
  }

  const currentPrice = product.priceRange.min + (materialOptions[selectedMaterial]?.price || 0) / 100;

  const handleAddToCart = () => {
    const newItem = {
      id: `cart-${Date.now()}`,
      templateId: productTemplates[0]?.id || '',
      templateName: productTemplates[0]?.name || '',
      templateThumbnail: productTemplates[0]?.thumbnailUrl || '',
      productId: product.id,
      productName: product.name,
      materialId: materialOptions[selectedMaterial]?.name || '',
      materialName: materialOptions[selectedMaterial]?.name || '',
      quantity,
      unitPrice: Math.round(currentPrice * 100),
      editorSnapshot: '',
      renderedPreview: detailImages[0],
    };
    addItem(newItem);
  };

  const breadcrumbItems = [
    { label: '产品分类', path: '/products' },
    { label: product.name },
  ];

  return (
    <div className="min-h-screen bg-paper-50 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Breadcrumb items={breadcrumbItems} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="sticky top-24">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-soft aspect-[4/3]">
                <img
                  src={detailImages[currentImageIndex]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + detailImages.length) % detailImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-paper-700 shadow-md transition-all hover:bg-white hover:text-brand-600"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % detailImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-paper-700 shadow-md transition-all hover:bg-white hover:text-brand-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {detailImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'relative overflow-hidden rounded-lg aspect-[4/3] transition-all duration-200',
                      currentImageIndex === index
                        ? 'ring-2 ring-brand-500 ring-offset-2'
                        : 'ring-1 ring-paper-200 hover:ring-brand-300'
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <h1 className="font-display text-3xl font-bold text-paper-900">
                    {product.name}
                  </h1>
                </div>
                <p className="mt-3 text-paper-600">{product.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-brand-600">
                    ¥{currentPrice.toFixed(0)}
                  </span>
                  <span className="text-sm text-paper-500"> 起</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-paper-500">
                  <span>月销 {product.monthlySales.toLocaleString()}</span>
                  <span>·</span>
                  <span>{productTemplates.length} 个模板</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Tag key={tag} variant="brand" size="sm">
                    {tag}
                  </Tag>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {editableFeaturesList.slice(0, 6).map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.label}
                      className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-soft"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-paper-800">
                          {feature.label}
                        </p>
                        <p className="text-xs text-paper-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-paper-700">
                  选择材质
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {materialOptions.map((material, index) => (
                    <button
                      key={material.name}
                      onClick={() => setSelectedMaterial(index)}
                      className={cn(
                        'relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200',
                        selectedMaterial === index
                          ? 'ring-2 ring-brand-500 bg-brand-50'
                          : 'bg-white ring-1 ring-paper-200 hover:ring-brand-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-paper-100">
                          <img
                            src={material.image}
                            alt={material.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-paper-900 truncate">
                            {material.name}
                          </p>
                          <p className="text-xs text-brand-600">
                            {material.price > 0 ? `+¥${(material.price / 100).toFixed(0)}元` : '基础款'}
                          </p>
                        </div>
                      </div>
                      {selectedMaterial === index && (
                        <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-paper-700">
                  选择尺寸
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size, index) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(index)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        selectedSize === index
                          ? 'bg-brand-500 text-white shadow-soft'
                          : 'bg-white text-paper-700 ring-1 ring-paper-200 hover:ring-brand-300'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {bindingOptions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-paper-700">
                    选择装帧
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {bindingOptions.map((binding, index) => (
                      <button
                        key={binding}
                        onClick={() => setSelectedBinding(index)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          selectedBinding === index
                            ? 'bg-brand-500 text-white shadow-soft'
                            : 'bg-white text-paper-700 ring-1 ring-paper-200 hover:ring-brand-300'
                        )}
                      >
                        {binding}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3 text-sm font-medium text-paper-700">
                  数量
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-lg bg-white ring-1 ring-paper-200">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-10 w-10 items-center justify-center text-paper-600 transition-colors hover:bg-paper-100 hover:text-paper-900"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium text-paper-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-10 w-10 items-center justify-center text-paper-600 transition-colors hover:bg-paper-100 hover:text-paper-900"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-paper-500">
                    小计: <span className="font-medium text-brand-600">¥{(currentPrice * quantity).toFixed(0)}</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate(`/templates/${productId}`)}
                >
                  <Sparkles className="h-5 w-5" />
                  立即制作
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  加入购物车
                </Button>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-paper-900">配送说明</h4>
                        <p className="text-xs text-paper-500">预计发货时间</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-paper-600">生产周期</span>
                        <span className="font-medium text-paper-900">3-5个工作日</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-paper-600">发货地</span>
                        <span className="font-medium text-paper-900">广东深圳</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-paper-600">运费政策</span>
                        <Badge variant="success" size="sm">全国包邮</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-paper-900">隐私保障</h4>
                        <p className="text-xs text-paper-500">支持私密设置</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-paper-600">
                        <CheckCircle2 className="h-4 w-4 text-forest-500 flex-shrink-0" />
                        <span>照片仅用于生产，不对外展示</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-paper-600">
                        <CheckCircle2 className="h-4 w-4 text-forest-500 flex-shrink-0" />
                        <span>支持公开/私密/好友可见设置</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-paper-600">
                        <CheckCircle2 className="h-4 w-4 text-forest-500 flex-shrink-0" />
                        <span>云端加密存储，数据安全</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full max-w-xl mx-auto">
              <TabsTrigger value="details">商品详情</TabsTrigger>
              <TabsTrigger value="templates">模板预览</TabsTrigger>
              <TabsTrigger value="materials">材质说明</TabsTrigger>
              <TabsTrigger value="faq">常见问题</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-8">
              <div className="space-y-8">
                <SectionTitle
                  title="产品特点"
                  subtitle="精心打造每一个细节"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="rounded-xl bg-white p-6 shadow-soft"
                    >
                      <div className="mb-4 text-4xl">{feature.icon}</div>
                      <h3 className="mb-2 font-display text-lg font-semibold text-paper-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-paper-600">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-12">
                  <SectionTitle title="产品展示" subtitle="精美实拍展示" />
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-hidden rounded-2xl shadow-soft aspect-[4/3]">
                      <img
                        src={`https://picsum.photos/seed/${productId}-show1/800/600`}
                        alt="产品展示1"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl shadow-soft aspect-[4/3]">
                      <img
                        src={`https://picsum.photos/seed/${productId}-show2/800/600`}
                        alt="产品展示2"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl shadow-soft aspect-[4/3]">
                      <img
                        src={`https://picsum.photos/seed/${productId}-show3/800/600`}
                        alt="产品展示3"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl shadow-soft aspect-[4/3]">
                      <img
                        src={`https://picsum.photos/seed/${productId}-show4/800/600`}
                        alt="产品展示4"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-8">
              <div className="space-y-6">
                <SectionTitle
                  title="精选模板"
                  subtitle={`共 ${productTemplates.length} 个精美模板`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 gap-6">
                  {productTemplates.slice(0, 8).map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                  >
                    <TemplateCard
                      template={template}
                      onClick={() => navigate(`/templates/${productId}?template=${template.id}`)}
                    />
                  </motion.div>
                ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/templates/${productId}`)}
                  >
                    查看全部模板
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="mt-8">
              <div className="space-y-6">
                <SectionTitle
                  title="材质说明"
                  subtitle="精选优质材质，品质有保障"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {materialOptions.map((material, index) => (
                    <motion.div
                      key={material.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="flex gap-6 rounded-xl bg-white p-6 shadow-soft"
                    >
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-paper-100">
                        <img
                          src={material.image}
                          alt={material.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold text-paper-900">
                          {material.name}
                        </h3>
                        <p className="mt-2 text-sm text-paper-600">
                          {material.description}
                        </p>
                        <p className="mt-3 text-sm font-medium text-brand-600">
                          {material.price > 0 ? `+¥${(material.price / 100).toFixed(0)}元/件` : '基础款'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-8">
              <div className="space-y-6">
                <SectionTitle
                  title="常见问题"
                  subtitle="解答您的疑惑"
                />
                <div className="space-y-3">
                  {faqList.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      className="overflow-hidden rounded-xl bg-white shadow-soft"
                    >
                      <button
                        onClick={() =>
                          setExpandedFaq(expandedFaq === index ? null : index)
                        }
                        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-paper-50"
                      >
                        <span className="font-medium text-paper-900">
                          {faq.question}
                        </span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-paper-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-paper-500" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-5 text-sm text-paper-600">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <AnimatePresence>
        {showFloatingBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-t border-paper-200"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <div className="text-brand-600">
                    <span className="font-display text-2xl font-bold">
                      ¥{currentPrice.toFixed(0)}
                    </span>
                    <span className="text-sm text-paper-500"> 起</span>
                  </div>
                  <div className="text-sm text-paper-500">
                    月销 {product.monthlySales.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    加入购物车
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => navigate(`/templates/${productId}`)}
                  >
                    <Sparkles className="h-4 w-4" />
                    立即制作
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
