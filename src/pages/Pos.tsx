import { useState, useEffect, useMemo } from 'react';
import { mastersApi, ordersApi, shiftsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Tag,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Gift,
  Wallet,
  X,
  Check,
  ShoppingCart
} from 'lucide-react';

interface CartItem {
  product_id: number;
  product_name: string;
  product_code: string;
  price: number;
  quantity: number;
  discount_amount: number;
  subtotal: number;
  unit: string;
}

interface PaymentItem {
  method: string;
  amount: number;
  channel_order_no?: string;
}

export default function Pos() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [member, setMember] = useState<any>(null);
  const [memberPhone, setMemberPhone] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [invoiceNeeded, setInvoiceNeeded] = useState(false);
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceTaxNo, setInvoiceTaxNo] = useState('');
  const [remark, setRemark] = useState('');
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [memberSearching, setMemberSearching] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadData();
    checkShift();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes, promoRes] = await Promise.all([
        mastersApi.getCategories(),
        mastersApi.getProducts({ pageSize: 100 }),
        mastersApi.getPromotions()
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data.list);
      setPromotions(promoRes.data);
    } finally {
      setLoading(false);
    }
  };

  const checkShift = async () => {
    try {
      const res = await shiftsApi.getCurrentShift();
      setCurrentShift(res.data);
    } catch {
      setCurrentShift(null);
    }
  };

  const openShift = async () => {
    try {
      await shiftsApi.openShift();
      await checkShift();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return (
          p.name.toLowerCase().includes(kw) ||
          p.code.toLowerCase().includes(kw) ||
          p.bar_code?.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchKeyword]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    let discount = manualDiscount;
    if (selectedPromotion) {
      if (selectedPromotion.type === 'discount') {
        if (totalAmount >= selectedPromotion.min_amount) {
          discount = Math.max(discount, selectedPromotion.value);
        }
      } else if (selectedPromotion.type === 'percent') {
        discount = Math.max(discount, totalAmount * selectedPromotion.value / 100);
      }
    }
    return Math.min(discount, totalAmount);
  }, [cart, selectedPromotion, manualDiscount, totalAmount]);

  const memberDiscount = useMemo(() => {
    if (!member) return 0;
    const rate = member.level === '钻石' ? 0.15 : member.level === '黄金' ? 0.1 : 0.05;
    return totalAmount * rate;
  }, [member, totalAmount]);

  const payableAmount = useMemo(() => {
    return Math.max(0, totalAmount - discountAmount - memberDiscount);
  }, [totalAmount, discountAmount, memberDiscount]);

  const totalPayment = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.price - i.discount_amount
              }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          price: product.price,
          quantity: 1,
          discount_amount: 0,
          subtotal: product.price,
          unit: product.unit
        }
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product_id !== productId) return i;
          const newQty = Math.max(0, i.quantity + delta);
          return {
            ...i,
            quantity: newQty,
            subtotal: newQty * i.price - i.discount_amount
          };
        })
        .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setMember(null);
    setMemberPhone('');
    setSelectedPromotion(null);
    setManualDiscount(0);
    setInvoiceNeeded(false);
    setInvoiceTitle('');
    setInvoiceTaxNo('');
    setRemark('');
    setPayments([]);
    setSuccessOrder(null);
  };

  const searchMember = async () => {
    if (!memberPhone) return;
    setMemberSearching(true);
    try {
      const res = await mastersApi.getMemberByPhone(memberPhone);
      setMember(res.data);
    } catch (err: any) {
      alert(err.message);
      setMember(null);
    } finally {
      setMemberSearching(false);
    }
  };

  const addPayment = (method: string) => {
    const remaining = Math.max(0, payableAmount - totalPayment);
    if (remaining <= 0) return;

    setPayments(prev => {
      const existing = prev.find(p => p.method === method);
      if (existing) {
        return prev.map(p =>
          p.method === method ? { ...p, amount: Math.min(payableAmount, p.amount + remaining) } : p
        );
      }
      return [...prev, { method, amount: remaining }];
    });
  };

  const updatePaymentAmount = (method: string, amount: number) => {
    setPayments(prev =>
      prev.map(p => (p.method === method ? { ...p, amount: Math.max(0, amount) } : p)).filter(p => p.amount > 0)
    );
  };

  const removePayment = (method: string) => {
    setPayments(prev => prev.filter(p => p.method !== method));
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('购物车为空');
      return;
    }
    if (Math.abs(totalPayment - payableAmount) > 0.01) {
      alert('支付金额与应付金额不一致');
      return;
    }
    if (!currentShift) {
      alert('请先开始交班');
      return;
    }

    try {
      const res = await ordersApi.createOrder({
        items: cart.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          product_code: i.product_code,
          price: i.price,
          quantity: i.quantity,
          discount_amount: i.discount_amount,
          subtotal: i.subtotal
        })),
        member_id: member?.id || null,
        promotion_id: selectedPromotion?.id || null,
        discount_amount: discountAmount + memberDiscount,
        payments,
        invoice_needed: invoiceNeeded,
        invoice_title: invoiceNeeded ? invoiceTitle : null,
        invoice_tax_no: invoiceNeeded ? invoiceTaxNo : null,
        remark
      });

      setSuccessOrder(res.data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const paymentMethods = [
    { method: 'cash', label: '现金', icon: <Banknote className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
    { method: 'qrcode', label: '扫码支付', icon: <Smartphone className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { method: 'bank_card', label: '银行卡', icon: <CreditCard className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
    { method: 'stored_card', label: '储值卡', icon: <Wallet className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
    { method: 'coupon', label: '优惠券', icon: <Gift className="w-5 h-5" />, color: 'bg-pink-50 text-pink-600' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentShift) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">请先开始交班</h2>
          <p className="text-gray-500">收银员需要先开始交班才能进行收银操作</p>
        </div>
        <button
          onClick={openShift}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          开始交班
        </button>
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">订单创建成功</h2>
          <p className="text-gray-500">订单号：{successOrder.orderNo}</p>
          <p className="text-2xl font-bold text-green-600 mt-4">¥{payableAmount.toFixed(2)}</p>
        </div>
        <button
          onClick={clearCart}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          继续收银
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索商品名称、编码、条码..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMember()}
                placeholder="输入会员手机号"
                className="w-full md:w-48 pl-4 pr-24 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={searchMember}
                disabled={memberSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {memberSearching ? '...' : '查询'}
              </button>
            </div>
          </div>

          {member && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{member.name}</p>
                <p className="text-sm text-gray-500">
                  {member.code} · {member.level}会员 · 余额¥{member.balance?.toFixed(2)} · {member.points}积分
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">会员折扣</p>
                <p className="font-medium text-blue-600">
                  {member.level === '钻石' ? '85折' : member.level === '黄金' ? '9折' : '95折'}
                </p>
              </div>
              <button onClick={() => setMember(null)} className="p-2 hover:bg-blue-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm p-4 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition group"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-300">{product.name[0]}</span>
                </div>
                <h4 className="font-medium text-gray-800 truncate">{product.name}</h4>
                <p className="text-sm text-gray-500">{product.code}</p>
                <p className="text-lg font-bold text-blue-600">¥{product.price.toFixed(2)}</p>
                <p className="text-xs text-gray-400">库存: {product.stock}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">购物车</h3>
            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-700"
            >
              清空
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p>购物车为空</p>
              <p className="text-sm">点击左侧商品添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">{item.product_name}</h4>
                    <p className="text-sm text-gray-500">¥{item.price.toFixed(2)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="font-medium text-gray-800">¥{item.subtotal.toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品合计</span>
                <span className="font-medium">¥{totalAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>优惠折扣</span>
                  <span>-¥{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {memberDiscount > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>会员折扣</span>
                  <span>-¥{memberDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>应付金额</span>
                <span className="text-red-600">¥{payableAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedPromotion?.id || ''}
                  onChange={(e) => {
                    const promo = promotions.find(p => p.id === parseInt(e.target.value));
                    setSelectedPromotion(promo || null);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">选择优惠活动</option>
                  {promotions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-500" />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={invoiceNeeded}
                    onChange={(e) => setInvoiceNeeded(e.target.checked)}
                    className="rounded"
                  />
                  需要发票
                </label>
              </div>

              {invoiceNeeded && (
                <div className="space-y-2 pl-6">
                  <input
                    type="text"
                    value={invoiceTitle}
                    onChange={(e) => setInvoiceTitle(e.target.value)}
                    placeholder="发票抬头"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={invoiceTaxNo}
                    onChange={(e) => setInvoiceTaxNo(e.target.value)}
                    placeholder="税号（选填）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}

              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注（选填）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              去支付 · ¥{payableAmount.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">收银结算</h3>
            <p className="text-3xl font-bold text-red-600 mb-6">应付：¥{payableAmount.toFixed(2)}</p>

            <div className="space-y-3 mb-6">
              {paymentMethods.map(pm => {
                const payment = payments.find(p => p.method === pm.method);
                const remaining = Math.max(0, payableAmount - totalPayment + (payment?.amount || 0));
                return (
                  <div key={pm.method} className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${pm.color}`}>
                      {pm.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{pm.label}</p>
                    </div>
                    {payment ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={payment.amount}
                          onChange={(e) => updatePaymentAmount(pm.method, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                          step="0.01"
                        />
                        <button onClick={() => removePayment(pm.method)} className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addPayment(pm.method)}
                        disabled={remaining <= 0}
                        className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50"
                      >
                        添加
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
              <div>
                <p className="text-sm text-gray-500">已付金额</p>
                <p className="text-xl font-bold text-green-600">¥{totalPayment.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">待付</p>
                <p className="text-xl font-bold text-orange-600">¥{(payableAmount - totalPayment).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                取消
              </button>
              <button
                onClick={submitOrder}
                disabled={Math.abs(totalPayment - payableAmount) > 0.01}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认收款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
