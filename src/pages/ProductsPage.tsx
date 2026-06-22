import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Filter,
  Layers,
  Palette,
} from 'lucide-react';
import SectionTitle from '@/components/common/SectionTitle';
import ProductCard from '@/components/product/ProductCard';
import PriceTag from '@/components/common/PriceTag';
import { products } from '@/mock/data/products';
import { ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

type SortType = 'default' | 'sales' | 'price-asc' | 'price-desc';
type ViewType = 'grid' | 'list';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [viewType, setViewType] = useState<ViewType>('grid');

  const allCategories = [
    { id: 'all', name: '全部产品', icon: '📦' },
    ...products.map((p) => ({ id: p.id, name: p.name, icon: p.icon })),
  ];

  const filteredProducts = products.filter((p) =>
    selectedCategory === 'all' ? true : p.id === selectedCategory
  );

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
            <div className="sticky top-24 rounded-xl bg-white p-4 shadow-soft">
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
          </motion.aside>

          {/* Right Content */}
          <div className="flex-1">
            {/* Filter & Sort Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-soft"
            >
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
                        <div className="absolute left-2 top-2 flex gap-1.5">
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
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {product.editableFeatures.slice(0, 4).map((feature) => (
                              <span
                                key={feature}
                                className="inline-flex items-center rounded bg-paper-100 px-2 py-0.5 text-xs text-paper-600"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
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
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <PriceTag price={product.priceRange.min} size="lg" />
                            <span className="text-sm text-paper-500">起</span>
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
    </div>
  );
}
