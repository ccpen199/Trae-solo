import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, Package, History, Check, AlertCircle } from 'lucide-react';
import * as api from '../api.js';

const mockProducts = [
  { id: 'tmall-001', name: '智能灯泡', price: 59.9, image: '💡', category: '智能家居' },
  { id: 'tmall-002', name: '智能插座', price: 39.9, image: '🔌', category: '智能家居' },
  { id: 'tmall-003', name: '温湿度传感器', price: 89.0, image: '🌡️', category: '传感器' },
  { id: 'tmall-004', name: '智能门锁', price: 1299.0, image: '🔐', category: '安防' },
  { id: 'tmall-005', name: '智能摄像头', price: 299.0, image: '📷', category: '安防' },
  { id: 'tmall-006', name: '智能音箱', price: 199.0, image: '🔊', category: '娱乐' }
];

export default function Shopping() {
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mall');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [accountRes, ordersRes] = await Promise.all([
        api.getShoppingAccount(),
        api.getShoppingOrders()
      ]);
      setAccount(accountRes.data);
      setOrders(ordersRes.data);
    } catch (e) {
      console.error('Failed to load shopping data:', e);
    } finally {
      setLoading(false);
    }
  }

  function updateCart(productId, delta) {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  }

  async function handleCheckout() {
    const items = Object.entries(cart).filter(([_, qty]) => qty > 0);
    if (items.length === 0) return;

    const total = items.reduce((sum, [id, qty]) => {
      const product = mockProducts.find(p => p.id === id);
      return sum + (product?.price || 0) * qty;
    }, 0);

    if (account && account.balance < total) {
      alert('账户余额不足，请先充值');
      return;
    }

    try {
      for (const [id, qty] of items) {
        const product = mockProducts.find(p => p.id === id);
        await api.createOrder({
          itemName: product.name,
          quantity: qty,
          totalAmount: product.price * qty,
          tmallItemId: id,
          voiceTriggered: false
        });
      }
      setCart({});
      await loadData();
      alert('订单已完成支付！');
    } catch (e) {
      alert(e.response?.data?.error || '下单失败');
    }
  }

  async function handleRecharge() {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) return;
    
    try {
      await api.rechargeAccount(parseFloat(rechargeAmount));
      setRechargeAmount('');
      await loadData();
    } catch (e) {
      alert('充值失败');
    }
  }

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = mockProducts.find(p => p.id === id);
    return sum + (product?.price || 0) * qty;
  }, 0);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">购物商城</h1>
          <p className="text-slate-400 mt-1">天猫商品语音下单</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
          {['mall', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab === 'mall' ? '商品商城' : '订单记录'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-5 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
              <CreditCard className="text-blue-300" size={24} />
            </div>
            <div>
              <p className="text-slate-300 text-sm">家庭账户余额</p>
              <p className="text-3xl font-bold text-white">¥{account?.balance?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="充值金额"
              className="w-32 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleRecharge}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              充值
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'mall' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProducts.map((product) => {
              const qty = cart[product.id] || 0;
              return (
                <div key={product.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/50 transition-all">
                  <div className="text-5xl mb-3">{product.image}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-xl font-bold text-amber-400 mb-4">¥{product.price.toFixed(2)}</p>
                  
                  {qty === 0 ? (
                    <button
                      onClick={() => updateCart(product.id, 1)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      加入购物车
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => updateCart(product.id, -1)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-white font-semibold text-lg">{qty}</span>
                      <button
                        onClick={() => updateCart(product.id, 1)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {cartCount > 0 && (
            <div className="fixed bottom-6 right-6 bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-2xl w-72">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-blue-400" size={20} />
                  <span className="text-white font-medium">购物车 ({cartCount})</span>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-2 max-h-40 overflow-auto">
                {Object.entries(cart).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
                  const product = mockProducts.find(p => p.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{product.name} × {qty}</span>
                      <span className="text-white">¥{(product.price * qty).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-700 mt-3 pt-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400">合计</span>
                  <span className="text-xl font-bold text-amber-400">¥{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  立即支付
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'orders' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-medium text-sm">商品</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">数量</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">金额</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">状态</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">来源</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Package size={48} className="mx-auto mb-3 opacity-50" />
                    <p>暂无订单</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Package className="text-slate-400" size={18} />
                        </div>
                        <div>
                          <p className="text-white">{order.item_name}</p>
                          <p className="text-xs text-slate-500">{order.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{order.quantity}</td>
                    <td className="p-4 text-amber-400 font-medium">¥{order.total_amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status === 'paid' ? '已支付' :
                         order.status === 'pending' ? '待支付' :
                         order.status === 'cancelled' ? '已取消' : order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.voice_triggered ? (
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">语音下单</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">手动下单</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
