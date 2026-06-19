import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  CATEGORY_OPTIONS, METAL_SUBCATEGORIES, PLASTIC_SUBCATEGORIES, EQUIPMENT_SUBCATEGORIES,
  formatCurrency, formatWeight, formatDate, ORDER_STATUS
} from '../../lib/constants';

export default function OpportunityList() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState<any>({ type: '', category: '', region: '', min_price: '', max_price: '', min_quantity: '', sort: 'created_at_desc', page: 1 });

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
              <button key={t.v} onClick={() => setF(x => ({ ...x, type: t.v, page: 1 }))}
                className={`px-4 py-2 text-sm rounded-md transition font-medium ${
                  f.type === t.v ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}>{t.l}</button>
            ))}
          </div>

          <select value={f.category} onChange={e => setF(x => ({ ...x, category: e.target.value, page: 1 }))} className="input-field w-36">
            <option value="">所有品类</option>
            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {f.category && (
            <select value={f.sub_category || ''} onChange={e => setF(x => ({ ...x, sub_category: e.target.value, page: 1 }))} className="input-field w-32">
              <option value="">全部子类</option>
              {subCategories[f.category].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          <input placeholder="地域搜索..." value={f.region} onChange={e => setF(x => ({ ...x, region: e.target.value, page: 1 }))} className="input-field w-40" />

          <div className="flex items-center gap-2">
            <input placeholder="最低价" type="number" value={f.min_price} onChange={e => setF(x => ({ ...x, min_price: e.target.value, page: 1 }))} className="input-field w-28" />
            <span className="text-slate-400">-</span>
            <input placeholder="最高价" type="number" value={f.max_price} onChange={e => setF(x => ({ ...x, max_price: e.target.value, page: 1 }))} className="input-field w-28" />
          </div>

          <input placeholder="最小吨数" type="number" value={f.min_quantity} onChange={e => setF(x => ({ ...x, min_quantity: e.target.value, page: 1 }))} className="input-field w-28" />

          <select value={f.sort} onChange={e => setF(x => ({ ...x, sort: e.target.value }))} className="input-field w-40">
            <option value="created_at_desc">最新发布</option>
            <option value="quantity_desc">数量最多</option>
            <option value="price_asc">价格最低</option>
            <option value="price_desc">价格最高</option>
          </select>

          <button onClick={() => setF({ type: '', category: '', region: '', min_price: '', max_price: '', min_quantity: '', sort: 'created_at_desc', page: 1 })} className="btn-secondary">
            重置筛选
          </button>
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
            return (
              <Link key={o.id} to={`/opportunities/${o.id}`} className="card card-hover p-5 block overflow-hidden">
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
                <h3 className="font-semibold text-slate-900 line-clamp-2 mb-3 h-12 leading-snug">{o.title}</h3>
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
              </Link>
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
          <button disabled={f.page === 1} onClick={() => setF(x => ({ ...x, page: x.page - 1 }))} className="btn-secondary disabled:opacity-50">
            上一页
          </button>
          <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-600">
            第 {f.page} 页 / 共 {Math.ceil(total / 16)} 页
          </div>
          <button disabled={f.page * 16 >= total} onClick={() => setF(x => ({ ...x, page: x.page + 1 }))} className="btn-secondary disabled:opacity-50">
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
