import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Clock,
  Flame,
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingBag,
  Store,
  Zap,
  Apple,
  Shirt,
  Home as HomeIcon,
  Sparkles,
} from 'lucide-react';
import { Input, Carousel, message } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/utils/cn';
import { mockProducts } from '@/mocks/data/mall';
import type { Product } from '@/types/entity';

const categories = [
  { name: '生鲜果蔬', icon: Apple, color: 'text-success-400', bg: 'bg-success-500/15' },
  { name: '日用百货', icon: Sparkles, color: 'text-warning-400', bg: 'bg-warning-500/15' },
  { name: '家政服务', icon: HomeIcon, color: 'text-primary-400', bg: 'bg-primary-500/15' },
  { name: '社区团购', icon: ShoppingBag, color: 'text-accent-400', bg: 'bg-accent-500/15' },
  { name: '服装鞋帽', icon: Shirt, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { name: '家居用品', icon: Store, color: 'text-blue-400', bg: 'bg-blue-500/15' },
];

const banners = [
  {
    id: 1,
    title: '新春大促销',
    subtitle: '全场低至5折起',
    gradient: 'from-red-500/30 to-orange-500/30',
  },
  {
    id: 2,
    title: '生鲜特惠',
    subtitle: '新鲜直达 品质保证',
    gradient: 'from-green-500/30 to-emerald-500/30',
  },
  {
    id: 3,
    title: '社区团购',
    subtitle: '拼团更优惠 邻里一起省',
    gradient: 'from-blue-500/30 to-cyan-500/30',
  },
];

const flashSaleProducts = mockProducts.slice(0, 6).map((p) => ({
  ...p,
  originalPrice: Math.round(p.price * 1.5 * 100) / 100,
  salePrice: p.price,
  soldCount: Math.floor(Math.random() * 80) + 20,
}));

const recommendProducts = mockProducts.slice(6, 14).map((p) => ({
  ...p,
  originalPrice: Math.round(p.price * 1.3 * 100) / 100,
  soldCount: Math.floor(Math.random() * 200) + 50,
  isSelfOperated: Math.random() > 0.5,
  rating: (Math.random() * 1 + 4).toFixed(1),
}));

function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(targetTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return { hours, minutes, seconds };
}

function CountdownTimer() {
  const { hours, minutes, seconds } = useCountdown(7200);

  return (
    <div className="flex items-center gap-1">
      <span className="px-1.5 py-0.5 bg-danger-500/20 text-danger-400 rounded text-xs font-mono font-bold">
        {String(hours).padStart(2, '0')}
      </span>
      <span className="text-danger-400 text-xs font-bold">:</span>
      <span className="px-1.5 py-0.5 bg-danger-500/20 text-danger-400 rounded text-xs font-mono font-bold">
        {String(minutes).padStart(2, '0')}
      </span>
      <span className="text-danger-400 text-xs font-bold">:</span>
      <span className="px-1.5 py-0.5 bg-danger-500/20 text-danger-400 rounded text-xs font-mono font-bold">
        {String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

interface ProductCardProps {
  product: Product & {
    originalPrice?: number;
    soldCount?: number;
    isSelfOperated?: boolean;
    rating?: string;
  };
  onClick?: () => void;
  className?: string;
}

function ProductCard({ product, onClick, className }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'glass-card-hover cursor-pointer overflow-hidden',
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {product.isSelfOperated && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary-500/90 text-white text-[10px] font-medium rounded">
            自营
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white line-clamp-2 mb-2 h-10">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-danger-400 font-mono">
            ¥{product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-neutral-500 line-through">
              ¥{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>已售 {product.soldCount || 0}</span>
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-warning-400 fill-warning-400" />
              <span className="text-warning-400">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MallHome() {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleProductClick = (product: Product) => {
    message.info(`查看商品详情: ${product.name}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    message.info(`切换分类: ${categoryName}`);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="社区电商"
        subtitle="足不出户，畅享优质好物"
        breadcrumb={[{ title: '首页' }, { title: '社区电商' }]}
        extra={
          <button className="btn-ghost flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            购物车
          </button>
        }
      />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card mb-6"
        >
          <div className="p-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <Input
                placeholder="搜索商品、店铺..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="!pl-12 !pr-4 !py-3 !text-base !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0 !rounded-xl"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card mb-6 p-4"
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleCategoryClick(category.name)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  activeCategory === category.name
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    category.bg
                  )}
                >
                  <category.icon className={cn('w-6 h-6', category.color)} />
                </div>
                <span className="text-xs text-neutral-300 font-medium">
                  {category.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card mb-6 overflow-hidden"
        >
          <Carousel autoplay autoplaySpeed={3000} dotPosition="bottom">
            {banners.map((banner) => (
              <div key={banner.id} className="h-48 sm:h-64">
                <div
                  className={cn(
                    'w-full h-full flex flex-col justify-center items-center bg-gradient-to-r',
                    banner.gradient
                  )}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-serif">
                    {banner.title}
                  </h2>
                  <p className="text-lg text-white/80">{banner.subtitle}</p>
                </div>
              </div>
            ))}
          </Carousel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="glass-card mb-6"
        >
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-danger-400 fill-danger-400" />
                  <span className="text-lg font-semibold text-white">
                    限时秒杀
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-500">距结束</span>
                  <CountdownTimer />
                </div>
              </div>
              <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                更多
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {flashSaleProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                  className="flex-shrink-0 w-36 sm:w-44"
                >
                  <ProductCard
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="glass-card"
        >
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning-400" />
                <span className="text-lg font-semibold text-white">
                  为你推荐
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>共 {recommendProducts.length} 件商品</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
