import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Filter,
  Layers,
  Palette,
  ClipboardList,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  Users,
  Truck,
  X,
} from 'lucide-react';
import SectionTitle from '@/components/common/SectionTitle';
import ProductCard from '@/components/product/ProductCard';
import PriceTag from '@/components/common/PriceTag';
import { products } from '@/mock/data/products';
import { ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

type SortType = 'default' | 'sales' | 'price-asc' | 'price-desc';
type ViewType = 'grid' | 'list';

type ModalType = 'material' | 'privacy' | 'copyright' | null;

const allEditableFeatures = ['拖拽编辑', '字体替换', '蒙版裁剪', '背景替换', '滤镜调色', '边框装饰'];
const allMaterialTypes = ['相纸', '陶瓷', '布艺', '金属', '特种纸', '实木'];

const materialSpecs = [
  { name: '哑光相纸', spec: '200g铜版纸', description: '质感细腻，不反光，适合日常记录', price: '¥39起' },
  { name: '光面相纸', spec: '250g光面铜版纸', description: '色彩鲜艳，光泽度高，适合人像照片', price: '¥49起' },
  { name: '绒面相纸', spec: '300g特种纸', description: '高级质感，触感柔软，专业影像级', price: '¥59起' },
  { name: '金属相纸', spec: '金属质感涂层', description: '金属光泽，立体感强，艺术感十足', price: '¥89起' },
  { name: '高温陶瓷', spec: '优质白瓷', description: '环保健康，色彩持久，可进微波炉', price: '¥59起' },
  { name: '亚麻布艺', spec: '天然亚麻', description: '亲肤透气，自然质感，可拆洗', price: '¥69起' },
  { name: '铝合金', spec: '航空级铝合金', description: '轻便坚固，金属质感，永不褪色', price: '¥129起' },
  { name: '进口实木', spec: '新西兰松木', description: '天然木纹，环保油漆，质感厚重', price: '¥159起' },
];

const privacyPolicy = [
  { icon: Eye, title: '公开', description: '所有人可见，可在社区广场展示，获得更多曝光' },
  { icon: EyeOff, title: '仅自己', description: '只有您自己可以查看和编辑，完全私密' },
  { icon: Users, title: '指定好友', description: '仅您指定的好友可见，分享更有针对性' },
];

const copyrightProcess = [
  { step: 1, title: '设计师提交', description: '设计师上传原创素材并提交版权证明' },
  { step: 2, title: '初审', description: '审核专员检查素材质量与完整性' },
  { step: 3, title: '复审', description: '资深审核员确认版权与合规性' },
  { step: 4, title: '上架展示', description: '审核通过后素材正式上架展示' },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const allCategories = [
    { id: 'all', name: '全部产品', icon: '📦' },
    ...products.map((p) => ({ id: p.id, name: p.name, icon: p.icon })),
  ];

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(material) ? prev.filter((m) => m !== material) : [...prev, material]
    );
  };

  const filteredProducts = products.filter((p) => {
    const categoryMatch = selectedCategory === 'all' ? true : p.id === selectedCategory;
    const featureMatch =
      selectedFeatures.length === 0 ||
      selectedFeatures.some((f) => p.editableFeatures.includes(f));
    const materialMatch =
      selectedMaterials.length === 0 ||
      selectedMaterials.some((m) =>
        p.materialOptions.some((mo) => mo.name.includes(m))
      );
    return categoryMatch && featureMatch && materialMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'sales':
        return b.monthlySales - a.monthlySales;
      case 'price-asc':
        return a.priceRange.min - b.priceRange.min;
      case 'price-desc':
        return b.priceRange.min - a.priceRange.min;
      default:
        return 0;
    }
  });

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <SectionTitle
            title="产品分类"
            subtitle="精选12类定制产品，满足你的所有创意需求"
          />
        </motion.div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Sidebar - Categories */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-64 lg:flex-shrink-0"
          >
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl bg-white p-4 shadow-soft">
                <h3 className="mb-4 px-2 font-display text-lg font-semibold text-paper-900">
                  产品分类
                </h3>
                <nav className="space-y-1">
                  {allCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                        selectedCategory === category.id
                          ? 'bg-gradient-brand text-white shadow-soft'
                          : 'text-paper-700 hover:bg-paper-100'
                      )}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                      {selectedCategory !== 'all' &&
                        category.id !== 'all' && (
                          <span className={cn(
                            'ml-auto text-xs',
                            selectedCategory === category.id ? 'text-white/80' : 'text-paper-400'
                          )}>
                            {
                              products.find((p) => p.id === category.id)
                                ?.monthlySales
                            }
                          </span>
                        )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-soft">
                <h3 className="mb-3 px-2 font-display text-base font-semibold text-paper-900">
                  快捷入口
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-paper-700 transition-all duration-200 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">生产进度查询</span>
                  </button>
                  <button
                    onClick={() => navigate('/user/enterprise')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-paper-700 transition-all duration-200 hover:bg-gold-50 hover:text-gold-600"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">企业定制</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-soft">
                <h3 className="mb-3 px-2 font-display text-base font-semibold text-paper-900">
                  服务说明
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveModal('material')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-paper-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Palette className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">材质说明</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-paper-700 transition-all duration-200 hover:bg-forest-50 hover:text-forest-600"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100 text-forest-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">隐私设置</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('copyright')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-paper-700 transition-all duration-200 hover:bg-purple-50 hover:text-purple-600"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">版权声明</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Right Content */}
          <div className="flex-1">
            {/* Filter & Sort Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-paper-500" />
                    <span className="text-sm text-paper-600">排序：</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('default')}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                        sortBy === 'default'
                          ? 'bg-brand-500 text-white'
                          : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                      )}
                    >
                      综合
                    </button>
                    <button
                      onClick={() => setSortBy('sales')}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                        sortBy === 'sales'
                          ? 'bg-brand-500 text-white'
                          : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                      )}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      销量
                    </button>
                    <button
                      onClick={() =>
                        setSortBy(
                          sortBy === 'price-asc' ? 'price-desc' : 'price-asc'
                        )
                      }
                      className={cn(
                        'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                        sortBy === 'price-asc' || sortBy === 'price-desc'
                          ? 'bg-brand-500 text-white'
                          : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                      )}
                    >
                      {sortBy === 'price-desc' ? (
                        <SortDesc className="h-3.5 w-3.5" />
                      ) : (
                        <SortAsc className="h-3.5 w-3.5" />
                      )}
                      价格
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-paper-600">
                    共 {sortedProducts.length} 个产品
                  </span>
                  <div className="flex rounded-lg bg-paper-100 p-1">
                    <button
                      onClick={() => setViewType('grid')}
                      className={cn(
                        'flex items-center justify-center rounded-md p-1.5 transition-all duration-200',
                        viewType === 'grid'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-paper-500 hover:text-paper-700'
                      )}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewType('list')}
                      className={cn(
                        'flex items-center justify-center rounded-md p-1.5 transition-all duration-200',
                        viewType === 'list'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-paper-500 hover:text-paper-700'
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="space-y-3 rounded-xl bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-paper-700 whitespace-nowrap">
                    可编辑能力：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allEditableFeatures.map((feature) => (
                      <button
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        className={cn(
                          'rounded-md px-3 py-1 text-xs font-medium transition-all duration-200',
                          selectedFeatures.includes(feature)
                            ? 'bg-brand-500 text-white'
                            : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                        )}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-paper-700 whitespace-nowrap">
                    材质类型：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allMaterialTypes.map((material) => (
                      <button
                        key={material}
                        onClick={() => toggleMaterial(material)}
                        className={cn(
                          'rounded-md px-3 py-1 text-xs font-medium transition-all duration-200',
                          selectedMaterials.includes(material)
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        )}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedFeatures.length > 0 || selectedMaterials.length > 0) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-paper-100">
                    <span className="text-xs text-paper-500">已选筛选：</span>
                    {selectedFeatures.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700"
                      >
                        {f}
                        <button
                          onClick={() => toggleFeature(f)}
                          className="hover:text-brand-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {selectedMaterials.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {m}
                        <button
                          onClick={() => toggleMaterial(m)}
                          className="hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedFeatures([]);
                        setSelectedMaterials([]);
                      }}
                      className="text-xs text-paper-500 hover:text-brand-600 ml-auto"
                    >
                      清除全部
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Grid/List */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className={cn(
                viewType === 'grid'
                  ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              )}
            >
              {sortedProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  {viewType === 'grid' ? (
                    <ProductCard
                      product={product}
                      onClick={() => handleProductClick(product.id)}
                    />
                  ) : (
                    <div
                      onClick={() => handleProductClick(product.id)}
                      className="group flex cursor-pointer gap-6 rounded-xl bg-white p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-medium"
                    >
                      <div className="relative h-36 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-paper-100">
                        <img
                          src={product.coverImage}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                          {product.tags.slice(0, 2).map((tag) => {
                            const isHot = tag === '热销';
                            const isNew = tag === '新品';
                            return (
                              <span
                                key={tag}
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                                  isHot && 'bg-brand-500',
                                  isNew && 'bg-forest-500',
                                  !isHot && !isNew && 'bg-paper-600/80'
                                )}
                              >
                                {tag}
                              </span>
                            );
                          })}
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                            <ShieldCheck className="h-3 w-3" />
                            设计师素材审核通过
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-paper-900">
                            {product.name}
                          </h3>
                          <p className="mt-1.5 text-sm text-paper-500 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-paper-600">
                            <span className="inline-flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-brand-500" />
                              {product.templateCount}+ 模板
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Palette className="h-3.5 w-3.5 text-brand-500" />
                              {product.materialOptions.length} 种材质
                            </span>
                            <span className="inline-flex items-center gap-1 text-forest-600">
                              <Truck className="h-3.5 w-3.5" />
                              全国包邮（偏远地区补差）
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {product.editableFeatures.slice(0, 4).map((feature) => (
                              <span
                                key={feature}
                                className="inline-flex items-center rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-paper-500">材质：</span>
                              <div className="flex gap-1.5">
                                {product.materialOptions.slice(0, 4).map((material) => (
                                  <div
                                    key={material.name}
                                    className="h-6 w-6 overflow-hidden rounded-full border-2 border-white shadow-sm"
                                    title={material.name}
                                  >
                                    <img
                                      src={material.image}
                                      alt={material.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ))}
                                {product.materialOptions.length > 4 && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-paper-100 text-xs text-paper-500">
                                    +{product.materialOptions.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-paper-500">隐私：</span>
                              <div className="flex gap-1">
                                {product.privacySupport.map((privacy) => {
                                  const isPublic = privacy.includes('公开');
                                  const isPrivate = privacy.includes('仅自己');
                                  return (
                                    <span
                                      key={privacy}
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs',
                                        isPublic && 'bg-forest-50 text-forest-600',
                                        isPrivate && 'bg-brand-50 text-brand-600',
                                        !isPublic && !isPrivate && 'bg-amber-50 text-amber-600'
                                      )}
                                    >
                                      {isPublic && <Eye className="h-3 w-3" />}
                                      {isPrivate && <EyeOff className="h-3 w-3" />}
                                      {!isPublic && !isPrivate && <Users className="h-3 w-3" />}
                                      {isPublic ? '公开' : isPrivate ? '仅自己' : '指定好友'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-baseline gap-1">
                              <PriceTag price={product.priceRange.min} size="lg" />
                              <span className="text-sm text-paper-500">起</span>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-600">
                              全国包邮
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm text-paper-500">
                              <TrendingUp className="h-4 w-4" />
                              <span>月销 {product.monthlySales.toLocaleString()}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product.id);
                              }}
                              className="rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-md"
                            >
                              立即制作
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {sortedProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="mb-4 text-6xl">🔍</div>
                <p className="text-lg font-medium text-paper-600">
                  暂无相关产品
                </p>
                <p className="mt-2 text-sm text-paper-500">
                  试试其他分类吧
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-paper-200 bg-white px-6 py-4">
                <h2 className="font-display text-xl font-semibold text-paper-900">
                  {activeModal === 'material' && '材质规格说明'}
                  {activeModal === 'privacy' && '隐私设置说明'}
                  {activeModal === 'copyright' && '版权声明与审核流程'}
                </h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-100 text-paper-500 transition-colors hover:bg-paper-200 hover:text-paper-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 max-h-[calc(80vh-80px)]">
                {activeModal === 'material' && (
                  <div className="space-y-4">
                    <p className="text-sm text-paper-600 mb-6">
                      我们精选优质原材料，确保每件产品都达到最高品质标准。以下是我们提供的主要材质规格：
                    </p>
                    <div className="grid gap-4">
                      {materialSpecs.map((spec, index) => (
                        <motion.div
                          key={spec.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-4 rounded-xl border border-paper-200 p-4 hover:border-brand-300 hover:shadow-soft transition-all"
                        >
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 text-2xl">
                            🎨
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h3 className="font-medium text-paper-900">{spec.name}</h3>
                              <span className="text-sm font-semibold text-brand-600">{spec.price}</span>
                            </div>
                            <p className="mt-1 text-xs text-paper-500">{spec.spec}</p>
                            <p className="mt-2 text-sm text-paper-600">{spec.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'privacy' && (
                  <div className="space-y-6">
                    <p className="text-sm text-paper-600">
                      我们重视您的隐私，提供灵活的隐私设置，让您完全掌控作品的可见范围。
                    </p>
                    <div className="grid gap-4">
                      {privacyPolicy.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4 rounded-xl border border-paper-200 p-5 hover:border-forest-300 hover:shadow-soft transition-all"
                          >
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-paper-900">{item.title}</h3>
                              <p className="mt-2 text-sm text-paper-600">{item.description}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="mt-6 rounded-xl bg-forest-50 p-4 border border-forest-100">
                      <h4 className="font-medium text-forest-900 mb-2">🔒 隐私保障承诺</h4>
                      <ul className="space-y-2 text-sm text-forest-700">
                        <li>• 您上传的照片仅用于定制产品生产，不会用于其他用途</li>
                        <li>• 所有照片采用银行级加密存储，保障数据安全</li>
                        <li>• 生产完成后7天自动删除源文件，确保信息安全</li>
                        <li>• 严格遵守《个人信息保护法》等相关法律法规</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeModal === 'copyright' && (
                  <div className="space-y-6">
                    <p className="text-sm text-paper-600">
                      我们尊重原创，保护知识产权。所有上架素材都经过严格的版权审核流程。
                    </p>

                    <div className="rounded-xl bg-purple-50 p-5 border border-purple-100">
                      <h3 className="font-display text-lg font-semibold text-purple-900 mb-4">
                        版权审核流程
                      </h3>
                      <div className="space-y-4">
                        {copyrightProcess.map((step, index) => (
                          <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white text-sm font-medium">
                                {step.step}
                              </div>
                              {index < copyrightProcess.length - 1 && (
                                <div className="w-0.5 flex-1 bg-purple-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <h4 className="font-medium text-purple-900">{step.title}</h4>
                              <p className="mt-1 text-sm text-purple-700">{step.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
                        <h4 className="font-medium text-brand-900 mb-2">📝 用户作品版权</h4>
                        <p className="text-sm text-brand-700">
                          用户上传的照片和创建的作品，版权归用户本人所有。仅授权平台用于产品生产制作。
                        </p>
                      </div>
                      <div className="rounded-xl bg-forest-50 p-4 border border-forest-100">
                        <h4 className="font-medium text-forest-900 mb-2">💼 设计师素材</h4>
                        <p className="text-sm text-forest-700">
                          设计师上传的原创素材需提供版权证明，审核通过后方可上架，并获得相应分成。
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-paper-50 p-4 border border-paper-200">
                      <h4 className="font-medium text-paper-900 mb-2">⚠️ 侵权投诉</h4>
                      <p className="text-sm text-paper-600">
                        如您发现平台上有侵犯您版权的内容，请通过客服渠道联系我们，我们将在24小时内处理并下架相关内容。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
