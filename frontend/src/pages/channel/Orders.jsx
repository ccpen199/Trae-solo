import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ChannelOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cart, setCart] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/channels/orders'),
        api.get('/mall/products'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setProducts(productsRes.data.products || []);
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

  const submitOrder = async () => {
    try {
      const items = Object.entries(cart).map(([id, quantity]) => ({
        product_id: parseInt(id), quantity
      }));
      await api.post('/channels/orders', { items });
      alert('订单提交成功');
      setCart({});
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '提交失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">采购订单</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 新建采购
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">订单列表</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{order.order_no}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.items?.length || 0} 件商品
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      ¥{(order.total_amount / 100).toFixed(2)}
                    </div>
                    <div className={`text-xs mt-1 ${
                      order.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.status === 'paid' ? '已付款' : '待付款'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">📦</div>
            <p>暂无采购订单</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">新建采购订单</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="text-3xl mb-2 text-center">{product.icon || '📦'}</div>
                    <div className="font-medium text-gray-900 text-center">{product.name}</div>
                    <div className="text-orange-600 font-bold text-center mt-1">
                      ¥{(product.price / 100).toFixed(2)}
                    </div>
                    {cart[product.id] > 0 ? (
                      <div className="flex items-center justify-center space-x-2 mt-3">
                        <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 bg-gray-100 rounded">-</button>
                        <span className="w-8 text-center">{cart[product.id]}</span>
                        <button onClick={() => addToCart(product)} className="w-7 h-7 bg-gray-100 rounded">+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm"
                      >
                        加入采购单
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">共 {Object.values(cart).reduce((a, b) => a + b, 0)} 件商品，合计：</span>
                <span className="text-2xl font-bold text-orange-600">
                  ¥{(Object.entries(cart).reduce((sum, [id, qty]) => {
                    const p = products.find(x => x.id === parseInt(id));
                    return sum + (p?.price || 0) * qty;
                  }, 0) / 100).toFixed(2)}
                </span>
              </div>
              <button
                onClick={submitOrder}
                disabled={Object.keys(cart).length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium"
              >
                提交订单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
