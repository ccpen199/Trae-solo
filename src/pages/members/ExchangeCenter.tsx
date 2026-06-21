import { useState } from 'react';
import {
  Search,
  Coins,
  ShoppingCart,
  Gift,
  Clock,
  Star,
  Tag,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import { products, members } from '@/data/mockData';
import { cn } from '@/lib/utils';

const categories = ['全部', '时长卡', '电竞周边', '赛事门票', '饮品', '零食'];

export default function ExchangeCenter() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);

  const currentMember = members[0];

  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === '全部' || product.category === selectedCategory;
    const matchSearch = !searchText ||
      product.name.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch && product.pointsCost > 0;
  });

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
    );
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const totalPoints = cart.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product?.pointsCost || 0) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">权益兑换中心</h1>
          <p className="text-dark-400 mt-1">使用积分兑换精选商品</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-neon-orange/30">
            <Coins className="w-5 h-5 text-neon-orange" />
            <span className="text-xl font-bold text-neon-orange font-orbitron">
              {currentMember.points.toLocaleString()}
            </span>
            <span className="text-sm text-dark-400">积分</span>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative p-3 rounded-xl bg-cyber-600 hover:bg-cyber-500 text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索商品..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'h-9 px-4 text-sm rounded-lg transition-colors',
                  selectedCategory === cat
                    ? 'bg-cyber-600 text-white'
                    : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-500/50 hover:-translate-y-1"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>

              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 text-xs bg-neon-purple/20 text-neon-purple rounded-full">
                  {product.category}
                </span>
              </div>

              {product.stock < 20 && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 text-xs bg-neon-red/20 text-neon-red rounded-full">
                    仅剩 {product.stock} 件
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 h-10">
                {product.name}
              </h3>

              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-neon-orange" />
                    <span className="text-lg font-bold text-neon-orange font-orbitron">
                      {product.pointsCost}
                    </span>
                  </div>
                  <p className="text-xs text-dark-500 line-through">¥{product.price}</p>
                </div>

                <button
                  onClick={() => addToCart(product.id)}
                  className="p-2 rounded-lg bg-cyber-600 hover:bg-cyber-500 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的商品</p>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4 rounded-xl bg-dark-800 border border-cyber-600/50 shadow-neon-blue/30 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-dark-700">
              <h3 className="text-xl font-bold text-white font-orbitron">兑换购物车</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 rounded-full hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-dark-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>购物车是空的</p>
                </div>
              ) : (
                cart.map((item) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;

                  return (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Coins className="w-3.5 h-3.5 text-neon-orange" />
                          <span className="text-sm text-neon-orange font-orbitron">
                            {product.pointsCost}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 rounded bg-dark-600 hover:bg-dark-500 text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-white text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 rounded bg-dark-600 hover:bg-dark-500 text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-dark-400 hover:text-neon-red transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 bg-dark-900/50 border-t border-dark-700">
                <div className="flex items-end justify-between mb-4">
                  <span className="text-dark-300">总计积分</span>
                  <div className="flex items-center gap-1">
                    <Coins className="w-5 h-5 text-neon-orange" />
                    <span className="text-2xl font-bold text-neon-orange font-orbitron">
                      {totalPoints.toLocaleString()}
                    </span>
                  </div>
                </div>

                {totalPoints > currentMember.points ? (
                  <div className="mb-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30">
                    <p className="text-sm text-neon-red">积分不足，还差 {totalPoints - currentMember.points} 积分</p>
                  </div>
                ) : null}

                <button
                  disabled={totalPoints > currentMember.points}
                  className={cn(
                    'w-full h-10 font-medium rounded-lg transition-all flex items-center justify-center gap-2',
                    totalPoints > currentMember.points
                      ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white'
                  )}
                >
                  <Gift className="w-4 h-4" />
                  确认兑换
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
