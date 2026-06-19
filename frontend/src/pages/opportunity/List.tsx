import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { 
  CATEGORY_OPTIONS, METAL_SUBCATEGORIES, PLASTIC_SUBCATEGORIES, EQUIPMENT_SUBCATEGORIES,
  formatCurrency, formatWeight, formatDate, ORDER_STATUS
} from '../../lib/constants';

export default function OpportunityList() {
  const { user, enterprise } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState<any>({ type: '', category: '', region: '', min_price: '', max_price: '', min_quantity: '', sort: 'created_at_desc', page: 1 });
  const [subscribing, setSubscribing] = useState(false);

  const subCategories: Record<string, string[]> = {
    '废金属': METAL_SUBCATEGORIES,
    '废塑料': PLASTIC_SUBCATEGORIES,
    '二手设备': EQUIPMENT_SUBCATEGORIES,
  };

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    params.set('pageSize', '16');
    api.get(`/opportunities?${params}`).then((d: any) => {
      setData(d.opportunities); setTotal(d.total); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(fetchData, [f]);

  const types = [{ v: '', l: '全部' }, { v: 'supply', l: '🏭 供应' }, { v: 'demand', l: '🛒 求购' }];

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {types.map(t => (
              <button key={t.v} onClick={() => setF((x: any) => ({ ...x, type: t.v, page: 1 }))}
                className={`px-4 py-2 text-sm rounded-md transition font-medium ${
                  f.type === t.v ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}>{t.l}</button>
            ))}
          </div>

          <select value={f.category} onChange={e => setF((x: any) => ({ ...x, category: e.target.value, page: 1 }))} className="input-field w-36">
            <option value="">所有品类</option>
            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {f.category && (
            <select value={f.sub_category || ''} onChange={e => setF((x: any) => ({ ...x, sub_category: e.target.value, page: 1 }))} className="input-field w-32">
              <option value="">全部子类</option>
              {subCategories[f.category].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          <input placeholder="地域搜索..." value={f.region} onChange={e => setF((x: any) => ({ ...x, region: e.target.value, page: 1 }))} className="input-field w-40" />

          <div className="flex items-center gap-2">
            <input placeholder="最低价" type="number" value={f.min_price} onChange={e => setF((x: any) => ({ ...x, min_price: e.target.value, page: 1 }))} className="input-field w-28" />
            <span className="text-slate-400">-</span>
            <input placeholder="最高价" type="number" value={f.max_price} onChange={e => setF((x: any) => ({ ...x, max_price: e.target.value, page: 1 }))} className="input-field w-28" />
          </div>

          <input placeholder="最小吨数" type="number" value={f.min_quantity} onChange={e => setF((x: any) => ({ ...x, min_quantity: e.target.value, page: 1 }))} className="input-field w-28" />

          <select value={f.sort} onChange={e => setF((x: any) => ({ ...x, sort: e.target.value }))} className="input-field w-40">
            <option value="created_at_desc">最新发布</option>
            <option value="quantity_desc">数量最多</option>
            <option value="price_asc">价格最低</option>
            <option value="price_desc">价格最高</option>
          </select>

          <button onClick={() => setF({ type: '', category: '', region: '', min_price: '', max_price: '', min_quantity: '', sort: 'created_at_desc', page: 1 })} className="btn-secondary">
            重置筛选
          </button>

          {user && (user.role === 'recycler' || user.role === 'producer') && (
            <button 
              onClick={async () => {
                setSubscribing(true);
                try {
                  const categories = f.category ? [f.category] : [];
                  const regions = f.region ? [f.region] : [];
                  await api.post('/subscriptions', {
                    categories,
                    regions,
                    min_quantity: f.min_quantity ? parseFloat(f.min_quantity) : undefined,
                    min_price: f.min_price ? parseFloat(f.min_price) : undefined,
                    max_price: f.max_price ? parseFloat(f.max_price) : undefined,
                    is_active: 1
                  });
                  alert('✅ 已按当前筛选条件订阅商机！\n新商机将实时推送给您。');
                } catch (e: any) {
                  alert(e.response?.data?.error || '订阅失败，请重试');
                } finally {
                  setSubscribing(false);
                }
              }}
              disabled={subscribing}
              className="btn-primary ml-2"
            >
              {subscribing ? '订阅中...' : '📩 订阅此筛选条件'}
            </button>
          )}

          <Link to="/opportunities/subscription" className="btn-secondary ml-2">
            ⚙️ 管理订阅
          </Link>
        </div>

        <div className="mt-3 text-sm text-slate-500">
          共找到 <span className="font-semibold text-slate-800">{total}</span> 条商机
          {data.length > 0 && ` · 正在展示第 ${(f.page - 1) * 16 + 1}-${Math.min(f.page * 16, total)} 条`}
        </div>
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {data.map(o => {
            const cat = CATEGORY_OPTIONS.find(c => c.value === o.category);
            const typeBadge = o.type === 'supply'
              ? { t: '供应', c: 'bg-blue-100 text-blue-700' }
              : { t: '求购', c: 'bg-amber-100 text-amber-700' };
            const priceRange = o.min_price === o.max_price ? formatCurrency(o.min_price) : `${formatCurrency(o.min_price)} ~ ${formatCurrency(o.max_price)}`;
            const canNegotiate = user && o.publisher_id !== user.id && (user.role === 'recycler' || user.role === 'producer');
            return (
              <div key={o.id} className="card card-hover p-5 overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeBadge.c}`}>{typeBadge.t}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cat?.color}`}>{o.category}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{o.sub_category}</span>
                  </div>
                  {o.credit_rating && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{o.credit_rating}</span>
                  )}
                </div>
                <Link to={`/opportunities/${o.id}`} className="block">
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-3 h-12 leading-snug hover:text-primary-600 transition">{o.title}</h3>
                </Link>
                <div className="grid grid-cols-2 gap-y-2 mb-4">
                  <div>
                    <div className="text-[11px] text-slate-400">数量</div>
                    <div className="font-bold text-lg text-slate-800">{formatWeight(o.quantity)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">单价区间</div>
                    <div className="font-bold text-lg text-primary-700">{priceRange}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span>📍 {o.region}</span>
                  <span>👁️ {o.views_count || 0}</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span className="truncate max-w-[60%]">{o.publisher_name}</span>
                  <span>{formatDate(o.created_at)}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <Link
                    to={`/opportunities/${o.id}`}
                    className="flex-1 text-center py-2 px-3 text-sm rounded-lg bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 transition"
                  >
                    查看详情
                  </Link>
                  {canNegotiate && (
                    <Link
                      to={`/opportunities/${o.id}`}
                      className="flex-1 text-center py-2 px-3 text-sm rounded-lg bg-primary-50 text-primary-700 font-medium hover:bg-primary-100 transition"
                    >
                      💬 立即议价
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-slate-600 mb-2">暂无匹配的商机信息</div>
          <div className="text-sm text-slate-400">尝试调整筛选条件，或<Link to="/opportunities/publish" className="text-primary-600 hover:underline ml-1">发布新商机</Link></div>
        </div>
      )}

      {data.length > 0 && total > 16 && (
        <div className="flex justify-center gap-2 pt-4">
          <button disabled={f.page === 1} onClick={() => setF((x: any) => ({ ...x, page: x.page - 1 }))} className="btn-secondary disabled:opacity-50">
            上一页
          </button>
          <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-600">
            第 {f.page} 页 / 共 {Math.ceil(total / 16)} 页
          </div>
          <button disabled={f.page * 16 >= total} onClick={() => setF((x: any) => ({ ...x, page: x.page + 1 }))} className="btn-secondary disabled:opacity-50">
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
