import { useEffect } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  ShoppingCart,
  Star,
  AlertTriangle,
  Plus,
  Minus,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import { Input } from '@/components/common/Input';
import { useInventoryStore } from '@/stores/inventoryStore';
import { cn, formatCurrency } from '@/utils/common';

const categories = [
  { id: 'all', name: '全部', icon: '🛒' },
  { id: 'prescription_drug', name: '处方药', icon: '💊', requiresPrescription: true },
  { id: 'nutrition', name: '营养保健', icon: '🌿' },
  { id: 'supplies', name: '日用用品', icon: '🧴' },
  { id: 'grooming_product', name: '洗护用品', icon: '🛁' },
];

export default function ShopPage() {
  const { products, fetchProducts, addToCart, isLoading } = useInventoryStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts(activeCategory === 'all' ? undefined : activeCategory);
  }, [activeCategory, fetchProducts]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (productId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    addToCart(productId, 1);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = products
    .filter((p) => cartItems[p.id] > 0)
    .reduce((sum, p) => sum + p.price * cartItems[p.id], 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">在线商城</h1>
          <p className="text-neutral-500 mt-1">精选宠物好物，执业兽医在线审方</p>
        </div>
        <Button variant="outline" className="relative">
          <ShoppingCart className="w-5 h-5 mr-2" />
          购物车
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-mint-400 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">处方药购买须知</span>
          </div>
          <p className="text-white/80 text-sm">
            根据《兽药管理条例》，购买处方药需上传执业兽医开具的处方，经在线审方通过后方可购买。
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">商品分类</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    activeCategory === cat.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="flex-1 text-left">{cat.name}</span>
                  {cat.requiresPrescription && (
                    <Badge variant="warning" size="sm">需处方</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="flex-1"
            />
            <Button variant="outline">
              <Filter className="w-5 h-5 mr-2" />
              筛选
            </Button>
          </div>

          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-soft border border-neutral-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary-600" />
                  <span className="text-neutral-600">
                    已选择 <span className="font-semibold text-primary-600">{totalItems}</span> 件商品
                  </span>
                </div>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <Button size="lg">去结算</Button>
            </motion.div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card hoverable padded={false} className="h-full flex flex-col">
                  <div className="relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded-t-2xl"
                    />
                    {product.requiresPrescription && (
                      <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        需处方
                      </div>
                    )}
                    {product.originalPrice && (
                      <Badge variant="accent" className="absolute top-3 right-3">
                        省¥{(product.originalPrice - product.price).toFixed(0)}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start gap-2 mb-1">
                      <Tag variant="neutral" size="sm">{product.brand}</Tag>
                    </div>
                    <h4 className="font-semibold text-neutral-900 mb-1 line-clamp-2 flex-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-neutral-500 mb-3">{product.specification}</p>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-neutral-400 line-through ml-2">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      {cartItems[product.id] > 0 ? (
                        <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-2 py-1">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-primary-600 hover:bg-primary-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold text-primary-700 w-4 text-center">
                            {cartItems[product.id]}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          加入
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
