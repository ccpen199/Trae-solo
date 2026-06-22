import { useEffect, useState } from 'react';
import { couponApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { Coupon, CouponOrder } from '../types';

export default function CouponsPage() {
  const { showToast, currentUser } = useAppStore();
  const [tab, setTab] = useState<'market' | 'orders'>('market');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<CouponOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showDetail, setShowDetail] = useState<Coupon | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const categories = [
    { id: 'all', name: '全部', icon: '🏷️' },
    { id: 'food', name: '美食', icon: '🍜' },
    { id: 'entertainment', name: '娱乐', icon: '🎬' },
    { id: 'fitness', name: '健身', icon: '💪' },
    { id: 'beauty', name: '丽人', icon: '💅' },
    { id: 'travel', name: '旅游', icon: '✈️' },
  ];

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize: 12 };
      if (category !== 'all') params.category = category;
      if (city) params.city = city;
      if (keyword) params.keyword = keyword;
      const res = await couponApi.list(params);
      const data = res as unknown as { items: Coupon[]; total: number };
      setCoupons(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const list = await couponApi.getOrders();
      setOrders(list as CouponOrder[]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tab === 'market') void loadCoupons();
    else void loadOrders();
  }, [tab, category, city, keyword, page]);

  const handlePurchase = async (coupon: Coupon) => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const order = await couponApi.purchase(coupon.id, { quantity: 1 });
      showToast(`购买成功！核销码：${(order as CouponOrder).redemptionCode}`, 'success');
      setShowDetail(null);
      void loadCoupons();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRedeem = async (orderId: string) => {
    try {
      await couponApi.redeem(orderId, '门店线下核销');
      showToast('核销成功！信用分已 +1', 'success');
      void loadOrders();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  return (
    <div className="page-container max-w-6xl">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">🎫 小壶优选 · 本地生活</h1>
          <p className="text-sm text-gray-500 mt-1">团购优惠券 · 核销状态实时同步 · 消费可加信用分</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('market')}
            className={`btn ${tab === 'market' ? 'btn-primary' : 'btn-secondary'}`}>
            🏪 优惠券市场 {total > 0 && <span className="ml-1 text-xs opacity-75">({total})</span>}
          </button>
          <button onClick={() => setTab('orders')}
            className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}>
            📦 我的订单
          </button>
        </div>
      </div>

      {tab === 'market' ? (
        <>
          <div className="card card-body mb-6">
            <div className="grid gap-4 items-center" style={{ gridTemplateColumns: 'auto auto 1fr auto' }}>
              <div className="flex gap-1 overflow-x-auto">
                {categories.map(c => (
                  <button key={c.id} onClick={() => { setCategory(c.id); setPage(1); }}
                    className={`btn btn-sm flex-shrink-0 ${category === c.id ? 'btn-primary' : 'btn-secondary'}`}>
                    <span className="mr-1">{c.icon}</span>{c.name}
                  </button>
                ))}
              </div>
              <input className="input" style={{ width: 180 }} placeholder="城市" value={city}
                onChange={e => setCity(e.target.value)} />
              <input className="input" placeholder="搜索商家/券名..." value={keyword}
                onChange={e => setKeyword(e.target.value)} />
              <button onClick={() => { setPage(1); void loadCoupons(); }} className="btn btn-primary">🔍 搜索</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">加载中...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-6xl mb-4">🎫</div>
              <p>暂无优惠券，试试其他条件</p>
            </div>
          ) : (
            <div className="grid grid-3 gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {coupons.map(c => {
                const savings = c.originalPrice - c.discountedPrice;
                return (
                  <div key={c.id} className="card overflow-hidden hover:shadow-lg transition hover:-translate-y-1 cursor-pointer"
                    onClick={() => setShowDetail(c)}>
                    <div className="aspect-video bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 bg-red-500 text-white rotate-45 text-xs font-bold py-1 px-10 shadow-lg">
                        省 {savings}元
                      </div>
                      <div className="text-center px-6">
                        <div className="text-sm font-medium text-amber-800 mb-1">{c.merchantName}</div>
                        <div className="text-4xl mb-2">🎫</div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-3xl font-bold text-red-600">¥{c.discountedPrice}</span>
                          <span className="text-sm text-gray-500 line-through">¥{c.originalPrice}</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <h3 className="font-bold truncate">{c.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>📍 {c.city}</span>
                        <span>⭐ {c.averageRating.toFixed(1)} · {c.reviewCount}条评价</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map(t => <span key={t} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{t}</span>)}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-500">已售 {c.soldCount}份 · 库存 {c.stock}</div>
                        <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setShowDetail(c); }}>立即购买</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {total > 0 && (
            <div className="mt-8 flex justify-center gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</button>
              <span className="px-4 py-2 text-sm text-gray-600">第 {page} 页</span>
              <button className="btn btn-secondary btn-sm" disabled={page * 12 >= total}
                onClick={() => setPage(p => p + 1)}>下一页</button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4">📦</div>
                <p>暂无订单</p>
                <button onClick={() => setTab('market')} className="btn btn-primary mt-6">去逛逛</button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => {
                  const c = o.coupon;
                  return (
                    <div key={o.id} className="p-4 border border-gray-100 rounded-xl flex items-center gap-5 flex-wrap">
                      <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-pink-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                        🎫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{c?.title}</span>
                          <span className={`badge ${
                            o.redemptionStatus === 'redeemed' ? 'badge-success' :
                            o.redemptionStatus === 'pending' ? 'badge-warning' :
                            o.redemptionStatus === 'expired' ? 'badge-secondary' : 'badge-danger'
                          }`}>
                            {o.redemptionStatus === 'redeemed' ? '✓ 已核销' :
                             o.redemptionStatus === 'pending' ? '待核销' :
                             o.redemptionStatus === 'expired' ? '已过期' : '已退款'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">商家: {c?.merchantName}</div>
                        <div className="mt-3 flex items-center gap-6 flex-wrap">
                          <div>
                            <div className="text-xs text-gray-400">核销码</div>
                            <div className="font-mono font-bold text-indigo-600">{o.redemptionCode}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">订单金额</div>
                            <div className="font-bold">¥{o.totalPrice}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">下单时间</div>
                            <div className="text-sm">{new Date(o.createdAt).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">有效期至</div>
                            <div className="text-sm">{new Date(o.expiresAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                      {o.redemptionStatus === 'pending' && (
                        <button onClick={() => handleRedeem(o.id)} className="btn btn-success">门店核销</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="h-48 bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 relative flex items-center justify-center">
              <button onClick={() => setShowDetail(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">✕</button>
              <div className="text-center">
                <div className="text-sm font-medium text-amber-800 mb-2">{showDetail.merchantName}</div>
                <div className="text-5xl mb-2">🎫</div>
                <div className="flex items-baseline justify-center gap-3">
                  <span className="text-4xl font-bold text-red-600">¥{showDetail.discountedPrice}</span>
                  <span className="text-gray-500 line-through">¥{showDetail.originalPrice}</span>
                  <span className="badge badge-danger">省{showDetail.originalPrice - showDetail.discountedPrice}元</span>
                </div>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div>
                <h2 className="text-xl font-bold">{showDetail.title}</h2>
                <p className="text-gray-600 mt-2">{showDetail.description}</p>
              </div>
              <div className="grid grid-3 gap-4 text-sm" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400">评分</div>
                  <div className="font-bold">⭐ {showDetail.averageRating.toFixed(1)} ({showDetail.reviewCount})</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400">库存</div>
                  <div className="font-bold">{showDetail.stock} 份</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400">城市</div>
                  <div className="font-bold">📍 {showDetail.city}</div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-2">🏷️ 标签</div>
                <div>{showDetail.tags.map(t => <span key={t} className="tag tag-primary mr-1">{t}</span>)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                <div className="font-medium text-gray-700 mb-1">📋 购买须知</div>
                <p>{showDetail.termsAndConditions}</p>
                <p className="mt-2 text-xs text-green-600">
                  ✓ 核销成功后自动加信用分 +1 · 小壶优选状态实时同步
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn btn-secondary flex-1" onClick={() => setShowDetail(null)}>取消</button>
                <button className="btn btn-danger flex-1 btn-lg"
                  disabled={purchasing || showDetail.stock <= 0 || !currentUser}
                  onClick={() => void handlePurchase(showDetail)}
                  style={{ background: '#ef4444' }}>
                  {purchasing ? '处理中...' : `¥${showDetail.discountedPrice} 立即购买`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
