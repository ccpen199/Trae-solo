import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Share2,
  ArrowLeft,
  Minus,
  Plus,
  Clock,
  Truck,
  Shield,
  Leaf,
  Droplets,
  Sun,
  Thermometer,
  Info,
} from 'lucide-react';
import Header from '@/components/Header';
import { api } from '@/utils/api';
import { useCartStore } from '@/store/useCartStore';
import type { Product } from '../../shared/types';

const mockProducts: Product[] = [
  {
    id: 1,
    shopId: 1,
    shopName: '繁花似锦花店',
    name: '浪漫红玫瑰束 99朵',
    category: 'flower',
    price: 599,
    originalPrice: 899,
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&h=600&fit=crop',
    description: '精选厄瓜多尔进口红玫瑰，99朵代表天长地久的爱情，搭配精美包装和贺卡。每一朵玫瑰都经过严格筛选，花型饱满，色泽鲜艳，花期持久。我们承诺，收到的花束如有任何质量问题，无条件退换。',
    festival: ['情人节', '纪念日', '生日'],
    scene: ['表白', '求婚', '祝福'],
    shelfLifeHours: 72,
    deliveryRadius: 10,
    stock: 50,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    shopId: 1,
    shopName: '繁花似锦花店',
    name: '粉色康乃馨花束',
    category: 'flower',
    price: 268,
    originalPrice: 368,
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&h=600&fit=crop',
    description: '33朵粉色康乃馨，代表母爱与感恩，是母亲节送妈妈的最佳选择。',
    festival: ['母亲节', '生日', '教师节'],
    scene: ['感谢', '探望', '祝福'],
    shelfLifeHours: 96,
    deliveryRadius: 10,
    stock: 8,
    createdAt: '2024-01-15T10:00:00Z',
  },
];

const careTips = [
  {
    icon: Droplets,
    title: '浇水',
    content: '每天换水，水位约为花茎的1/3，避免花叶浸泡在水中。',
  },
  {
    icon: Scissors,
    title: '修剪',
    content: '每2天斜剪一次花茎，去除腐烂部分，保持吸水通畅。',
  },
  {
    icon: Sun,
    title: '光照',
    content: '避免阳光直射，放置在通风阴凉处，延长花期。',
  },
  {
    icon: Thermometer,
    title: '温度',
    content: '最佳保存温度18-22°C，远离空调出风口和水果。',
  },
  {
    icon: Leaf,
    title: '保鲜',
    content: '可加入鲜花保鲜剂，或少量白糖和84消毒液。',
  },
  {
    icon: Info,
    title: '注意',
    content: '如对花粉过敏，请避免直接接触，放置在通风处。',
  },
];

function Scissors(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'care'>('detail');
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      if (id) {
        const data = await api.products.get(parseInt(id));
        setProduct(data);
      }
    } catch (error) {
      console.log('Using mock data:', error);
      const mock = mockProducts.find(p => p.id === parseInt(id || '1'));
      setProduct(mock || mockProducts[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      alert(`已添加 ${quantity} 件商品到购物车`);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500 mb-4">商品不存在</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-rose text-white rounded-btn"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 py-3 text-gray-600 hover:text-rose transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="animate-fade-in-up">
            <div className="relative rounded-card overflow-hidden bg-white shadow-sm border border-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-rose text-white px-3 py-1 text-sm font-medium rounded-btn">
                  限时优惠 -{discount}%
                </div>
              )}
              <button
                onClick={() => setLiked(!liked)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all ${liked ? 'bg-rose text-white' : 'bg-white/80 text-gray-600 hover:bg-rose hover:text-white'}`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <button className="absolute top-4 right-14 p-2 rounded-full bg-white/80 text-gray-600 hover:bg-sprout hover:text-white transition-all">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="animate-stagger-1">
            <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-800 mb-2">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {product.festival.map((f) => (
                  <span key={f} className="text-xs px-2 py-1 bg-rose-50 text-rose rounded-btn">
                    {f}
                  </span>
                ))}
                {product.scene.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 bg-sprout-50 text-sprout rounded-btn">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-rose">
                  ¥{product.price.toFixed(2)}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  ¥{product.originalPrice.toFixed(2)}
                </span>
                <span className="text-sm text-warmgold">
                  已售 {Math.floor(Math.random() * 1000) + 100} 件
                </span>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              {product.shopName && (
                <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-btn">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-rose font-serif font-bold">
                      {product.shopName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{product.shopName}</p>
                    <p className="text-xs text-gray-500">配送半径 {product.deliveryRadius}km</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-btn">
                  <Truck className="h-5 w-5 text-sprout mx-auto mb-1" />
                  <p className="text-xs text-gray-600">2小时达</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-btn">
                  <Clock className="h-5 w-5 text-warmgold mx-auto mb-1" />
                  <p className="text-xs text-gray-600">可预约</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-btn">
                  <Shield className="h-5 w-5 text-rose mx-auto mb-1" />
                  <p className="text-xs text-gray-600">品质保证</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-btn">
                <span className="text-gray-600">购买数量</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-btn border border-gray-200 text-gray-600 hover:bg-rose hover:text-white hover:border-rose transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-btn border border-gray-200 text-gray-600 hover:bg-rose hover:text-white hover:border-rose transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {product.stock < 10 && (
                <p className="text-sm text-warmgold mb-4">
                  温馨提示：库存仅剩 {product.stock} 件，欲购从速
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-6 border-2 border-rose text-rose rounded-btn font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  加入购物车
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3 px-6 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
                >
                  立即购买
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden animate-stagger-2">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'detail' ? 'text-rose border-b-2 border-rose' : 'text-gray-500 hover:text-gray-700'}`}
            >
              商品详情
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'care' ? 'text-rose border-b-2 border-rose' : 'text-gray-500 hover:text-gray-700'}`}
            >
              养护知识库
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'detail' ? (
              <div className="animate-fade-in-up">
                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-4">
                  商品参数
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">商品分类</span>
                    <span className="text-gray-800">
                      {product.category === 'flower' ? '鲜花' : product.category === 'cake' ? '蛋糕' : '礼品'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">保鲜时长</span>
                    <span className="text-gray-800">{product.shelfLifeHours} 小时</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">配送半径</span>
                    <span className="text-gray-800">{product.deliveryRadius} 公里</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">库存数量</span>
                    <span className="text-gray-800">{product.stock} 件</span>
                  </div>
                </div>

                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-4">
                  商品描述
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-6">
                  <img
                    src={product.image}
                    alt="detail"
                    className="w-full rounded-card"
                  />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-2">
                  鲜花养护指南
                </h3>
                <p className="text-gray-500 mb-6">
                  正确的养护方式可以让鲜花保持最佳状态，延长观赏时间
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {careTips.map((tip, index) => (
                    <div
                      key={tip.title}
                      className={`p-4 bg-gradient-to-br from-sprout-50 to-white rounded-card border border-sprout-100 animate-stagger-${index + 1}`}
                    >
                      <div className="w-10 h-10 bg-sprout-100 rounded-full flex items-center justify-center mb-3">
                        <tip.icon className="h-5 w-5 text-sprout" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">{tip.title}</h4>
                      <p className="text-sm text-gray-600">{tip.content}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-warmgold-50 rounded-card border border-warmgold-100">
                  <h4 className="font-semibold text-warmgold-800 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    温馨提示
                  </h4>
                  <p className="text-sm text-warmgold-700">
                    由于鲜花是天然植物，每一束花的形态和颜色可能略有差异。我们的花艺师会精心挑选最好的花材，确保您收到的花束品质如一。如有任何问题，请及时联系我们的客服。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p className="mb-2">花时达 - 让每一份心意准时送达</p>
          <p>© 2024 花时达 版权所有</p>
        </div>
      </footer>
    </div>
  );
}
