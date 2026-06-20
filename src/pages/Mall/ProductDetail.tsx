import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Store,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { Tabs, Button, message, Rate } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/utils/cn';
import { mockProducts } from '@/mocks/data/mall';

const productDetail = {
  ...mockProducts[0],
  originalPrice: 49.9,
  soldCount: 2356,
  isSelfOperated: true,
  rating: 4.8,
  reviewCount: 856,
  images: [
    'https://api.dicebear.com/7.x/shapes/svg?seed=prod1',
    'https://api.dicebear.com/7.x/shapes/svg?seed=prod2',
    'https://api.dicebear.com/7.x/shapes/svg?seed=prod3',
    'https://api.dicebear.com/7.x/shapes/svg?seed=prod4',
  ],
  specs: {
    '规格': ['标准装', '家庭装', '礼盒装'],
    '口味': ['原味', '五香', '麻辣'],
  },
  shop: {
    id: 'shop_001',
    name: '阳光优选生鲜店',
    rating: 4.9,
    sales: 12580,
    isOfficial: true,
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=shop1',
  },
  details: {
    description: `精选优质鸡蛋，来自天然散养农场，蛋黄金黄，蛋白浓稠，营养丰富。每一枚鸡蛋都经过严格筛选，确保新鲜品质。`,
    parameters: [
      { label: '商品名称', value: '新鲜鸡蛋 30枚装' },
      { label: '净含量', value: '约1.8kg' },
      { label: '保质期', value: '30天' },
      { label: '储存方式', value: '冷藏保存' },
      { label: '产地', value: '山东青岛' },
      { label: '配送方式', value: '冷链配送' },
    ],
  },
  reviews: [
    {
      id: 'r1',
      userName: '张**',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
      rating: 5,
      content: '鸡蛋很新鲜，个头均匀，包装也很好，下次还会回购。',
      images: [
        'https://api.dicebear.com/7.x/shapes/svg?seed=rev1',
      ],
      date: '2024-01-15',
      spec: '标准装',
    },
    {
      id: 'r2',
      userName: '李**',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
      rating: 4,
      content: '整体还不错，就是有一两个稍微小了点，性价比还可以。',
      images: [],
      date: '2024-01-12',
      spec: '家庭装',
    },
    {
      id: 'r3',
      userName: '王**',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
      rating: 5,
      content: '送货速度很快，当天就到了，鸡蛋很新鲜，给好评！',
      images: [
        'https://api.dicebear.com/7.x/shapes/svg?seed=rev2',
        'https://api.dicebear.com/7.x/shapes/svg?seed=rev3',
      ],
      date: '2024-01-10',
      spec: '礼盒装',
    },
  ],
};

export default function ProductDetail() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({
    '规格': '标准装',
    '口味': '原味',
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? productDetail.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === productDetail.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(productDetail.stock, prev + delta)));
  };

  const handleSpecSelect = (specName: string, value: string) => {
    setSelectedSpecs((prev) => ({ ...prev, [specName]: value }));
  };

  const handleAddToCart = () => {
    message.success('已加入购物车');
  };

  const handleBuyNow = () => {
    message.success('正在跳转到结算页面...');
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.info(isFavorite ? '已取消收藏' : '已收藏');
  };

  const handleShare = () => {
    message.info('分享功能');
  };

  const handleContactService = () => {
    message.info('正在连接客服...');
  };

  const tabItems = [
    {
      key: 'description',
      label: '商品介绍',
    },
    {
      key: 'parameters',
      label: '规格参数',
    },
    {
      key: 'reviews',
      label: `用户评价 (${productDetail.reviewCount})`,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="商品详情"
        breadcrumb={[
          { title: '首页' },
          { title: '社区电商' },
          { title: '商品详情' },
        ]}
        showBack
        onBack={() => message.info('返回上一页')}
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-4"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 mb-4">
              <img
                src={productDetail.images[currentImageIndex]}
                alt={productDetail.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-3">
              {productDetail.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                    currentImageIndex === index
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-white/20'
                  )}
                >
                  <img
                    src={img}
                    alt={`缩略图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="glass-card p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {productDetail.isSelfOperated && (
                      <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-medium rounded">
                        自营
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-success-500/20 text-success-400 text-xs font-medium rounded">
                      品质保证
                    </span>
                  </div>
                  <h1 className="text-xl font-semibold text-white mb-2">
                    {productDetail.name}
                  </h1>
                  <p className="text-sm text-neutral-500">
                    {productDetail.description}
                  </p>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-4 py-4 px-4 rounded-lg bg-gradient-to-r from-danger-500/10 to-transparent">
                <span className="text-3xl font-bold text-gradient-accent font-mono">
                  ¥{productDetail.price.toFixed(2)}
                </span>
                <span className="text-sm text-neutral-500 line-through">
                  ¥{productDetail.originalPrice.toFixed(2)}
                </span>
                <span className="px-2 py-0.5 bg-danger-500/20 text-danger-400 text-xs font-medium rounded">
                  省 ¥{(productDetail.originalPrice - productDetail.price).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-neutral-400 mb-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning-400 fill-warning-400" />
                  <span className="text-warning-400 font-medium">
                    {productDetail.rating}
                  </span>
                  <span className="text-neutral-500">
                    ({productDetail.reviewCount}条评价)
                  </span>
                </div>
                <div>
                  销量 <span className="text-white">{productDetail.soldCount}</span>
                </div>
                <div>
                  库存 <span className="text-white">{productDetail.stock}件</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {Object.entries(productDetail.specs).map(([specName, values]) => (
                  <div key={specName}>
                    <div className="text-sm text-neutral-400 mb-2">{specName}</div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => (
                        <button
                          key={value}
                          onClick={() => handleSpecSelect(specName, value)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm transition-all',
                            selectedSpecs[specName] === value
                              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                              : 'bg-white/5 text-neutral-300 border border-white/10 hover:border-white/20'
                          )}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-neutral-400">数量</span>
                <div className="flex items-center">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-8 rounded-l-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-8 bg-white/5 border-y border-white/10 flex items-center justify-center">
                    <span className="text-white font-mono">{quantity}</span>
                  </div>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 rounded-r-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleToggleFavorite}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                    isFavorite
                      ? 'bg-danger-500/20 text-danger-400'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  )}
                >
                  <Heart
                    className={cn('w-5 h-5', isFavorite && 'fill-current')}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={productDetail.shop.avatar}
                alt={productDetail.shop.name}
                className="w-12 h-12 rounded-xl bg-white/5"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {productDetail.shop.name}
                  </span>
                  {productDetail.shop.isOfficial && (
                    <span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-400 text-[10px] font-medium rounded">
                      官方
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning-400 fill-warning-400" />
                    <span>{productDetail.shop.rating}分</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    <span>销量 {productDetail.shop.sales}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              icon={<MessageCircle className="w-4 h-4" />}
              className="!border-white/10 !text-neutral-300 hover:!border-white/20"
              onClick={handleContactService}
            >
              联系客服
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="glass-card mb-6"
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="!px-4 !pt-4"
            style={{ color: 'white' }}
          />
          <div className="p-4">
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-300 leading-relaxed mb-4">
                  {productDetail.details.description}
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                    <Package className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-neutral-500">正品保证</p>
                      <p className="text-sm text-white">品质保障</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                    <Truck className="w-5 h-5 text-success-400" />
                    <div>
                      <p className="text-xs text-neutral-500">极速配送</p>
                      <p className="text-sm text-white">当日达</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                    <ShieldCheck className="w-5 h-5 text-warning-400" />
                    <div>
                      <p className="text-xs text-neutral-500">售后无忧</p>
                      <p className="text-sm text-white">七天退换</p>
                    </div>
                  </div>
                </div>
                <img
                  src={productDetail.images[0]}
                  alt="商品详情图"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {activeTab === 'parameters' && (
              <div className="space-y-0">
                {productDetail.details.parameters.map((param, index) => (
                  <div
                    key={param.label}
                    className={cn(
                      'flex py-3',
                      index !== 0 && 'border-t border-white/5'
                    )}
                  >
                    <div className="w-32 text-sm text-neutral-500">
                      {param.label}
                    </div>
                    <div className="flex-1 text-sm text-white">
                      {param.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {productDetail.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="pb-4 border-b border-white/5 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={review.avatar}
                        alt={review.userName}
                        className="w-10 h-10 rounded-full bg-white/5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {review.userName}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {review.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Rate
                            disabled
                            value={review.rating}
                            className="!text-xs"
                          />
                          <span className="text-xs text-neutral-500">
                            规格：{review.spec}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 mb-3 ml-13">
                      {review.content}
                    </p>
                    {review.images.length > 0 && (
                      <div className="flex gap-2 ml-13">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`评价图片 ${idx + 1}`}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40">
        <div className="max-w-6xl mx-auto p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="glass-card p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
                  isFavorite
                    ? 'text-danger-400'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
                <span className="text-xs">收藏</span>
              </button>
              <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs">购物车</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="px-6 py-2.5 rounded-lg bg-warning-500/20 text-warning-400 font-medium hover:bg-warning-500/30 transition-colors"
              >
                加入购物车
              </button>
              <button
                onClick={handleBuyNow}
                className="btn-accent px-8"
              >
                立即购买
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
