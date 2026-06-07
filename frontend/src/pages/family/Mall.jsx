import { useState, useEffect } from 'react';
import api from '../../utils/api';

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'ac', name: '空调', icon: '❄️' },
  { id: 'fridge', name: '冰箱', icon: '🧊' },
  { id: 'washer', name: '洗衣机', icon: '🧺' },
  { id: 'tv', name: '电视', icon: '📺' },
  { id: 'small', name: '小家电', icon: '🔌' },
];

export default function MallPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      const res = await api.get('/mall/products', { params: { category } });
      setProducts(res.data.products || []);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[productId] > 1) {
        next[productId] -= 1;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const checkout = async () => {
    try {
      const items = Object.entries(cart).map(([id, quantity]) => ({
        product_id: parseInt(id), quantity
      }));
      if (items.length === 0) return;

      const res = await api.post('/mall/orders', { items });
      alert(`订单提交成功！订单号：${res.data.order_no}`);
      setCart({});
      setShowCart(false);
    } catch (err) {
      alert(err.response?.data?.error || '下单失败');
    }
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find(p => p.id === parseInt(id));
    return sum + (product?.price || 0) * qty;
  }, 0);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === c.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c.icon && <span className="mr-1">{c.icon}</span>}
              {c.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
        >
          <span>🛒</span>
          <span>购物车</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-6xl">
                {product.icon || '📦'}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-orange-600 font-bold text-lg">¥{product.price / 100}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    加入购物车
                  </button>
                </div>
                {cart[product.id] > 0 && (
                  <div className="mt-2 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="w-6 h-6 bg-gray-100 rounded text-gray-600"
                    >
                      -
                    </button>
                    <span className="w-6 text-center">{cart[product.id]}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-6 h-6 bg-gray-100 rounded text-gray-600"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">购物车</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {Object.keys(cart).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">🛒</div>
                  <p>购物车是空的</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const product = products.find(p => p.id === parseInt(id));
                    if (!product) return null;
                    return (
                      <div key={id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-3xl">
                          {product.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-orange-600 font-semibold">¥{product.price / 100}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => removeFromCart(id)} className="w-7 h-7 bg-white rounded text-gray-600 border">-</button>
                          <span className="w-8 text-center">{qty}</span>
                          <button onClick={() => addToCart(product)} className="w-7 h-7 bg-white rounded text-gray-600 border">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">合计：</span>
                <span className="text-2xl font-bold text-orange-600">¥{(totalAmount / 100).toFixed(2)}</span>
              </div>
              <button
                onClick={checkout}
                disabled={totalItems === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium"
              >
                结算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
