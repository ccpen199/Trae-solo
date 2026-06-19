import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { CATEGORY_OPTIONS, PROVINCES } from '../../lib/constants';

export default function Subscription() {
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    categories: [] as string[],
    regions: [] as string[],
    min_quantity: '' as number | string,
    max_quantity: '' as number | string,
    min_price: '' as number | string,
    max_price: '' as number | string,
  });

  const fetchData = async () => {
    const d: any = await api.get('/opportunities/subscriptions/my');
    setData(d);
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const submit = async () => {
    await api.post('/opportunities/subscriptions', form);
    setShowForm(false);
    setForm({ categories: [], regions: [], min_quantity: '', max_quantity: '', min_price: '', max_price: '' });
    fetchData();
  };

  const updateSub = async (id: string, patch: any) => {
    await api.put(`/opportunities/subscriptions/${id}`, patch);
    fetchData();
  };

  const delSub = async (id: string) => {
    if (confirm('确认删除此订阅？')) {
      await api.delete(`/opportunities/subscriptions/${id}`);
      fetchData();
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🔔 商机动态订阅</h2>
          <p className="text-sm text-slate-500 mt-1">按地域/品类/吨位/价格区间订阅，有匹配商机时实时推送</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '取消' : '➕ 新增订阅'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-primary-200 bg-primary-50/30">
          <h3 className="font-bold text-slate-800 mb-4">新增订阅规则</h3>
          <div className="space-y-4">
            <div>
              <label className="label mb-2">关注品类 <span className="text-slate-400 text-xs">(多选)</span></label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, categories: toggle(f.categories, c.value) }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                      form.categories.includes(c.value)
                        ? 'border-primary-500 bg-white text-primary-700 shadow-sm'
                        : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label mb-2">目标地域 <span className="text-slate-400 text-xs">(多选)</span></label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin p-1">
                {PROVINCES.map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, regions: toggle(f.regions, p) }))}
                    className={`px-3 py-1 rounded-md text-xs border transition ${
                      form.regions.includes(p) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>{p}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">最低数量 (吨)</label>
                <input type="number" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">最高数量 (吨)</label>
                <input type="number" value={form.max_quantity} onChange={e => setForm(f => ({ ...f, max_quantity: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">最低单价 (元)</label>
                <input type="number" value={form.min_price} onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">最高单价 (元)</label>
                <input type="number" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} className="input-field" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
              <button onClick={submit} className="btn-primary">保存订阅</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🔕</div>
            <div className="text-slate-600 mb-2">暂未设置任何订阅规则</div>
            <div className="text-sm text-slate-400">点击上方「新增订阅」即可自动接收匹配商机推送</div>
          </div>
        )}
        {data.map(s => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {s.categories.length === 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">全品类</span>
                ) : s.categories.map((c: string) => (
                  <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_OPTIONS.find(o => o.value === c)?.color}`}>{c}</span>
                ))}
                {s.regions.length === 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">全国</span>
                ) : s.regions.slice(0, 5).map((r: string) => (
                  <span key={r} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">{r}</span>
                ))}
                {s.regions.length > 5 && <span className="text-xs text-slate-400">等{s.regions.length}个地区</span>}
              </div>
              <button onClick={() => updateSub(s.id, { is_active: !s.is_active })}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                  s.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {s.is_active ? '✓ 已启用' : '已暂停'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm mb-4 py-3 bg-slate-50 rounded-lg px-4">
              <div>
                <div className="text-xs text-slate-400">数量范围</div>
                <div className="font-semibold text-slate-800">{s.min_quantity || '不限'} ~ {s.max_quantity || '不限'} 吨</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">价格范围</div>
                <div className="font-semibold text-slate-800">{s.min_price || '不限'} ~ {s.max_price || '不限'} 元</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">创建时间</div>
                <div className="text-slate-700">{s.created_at?.substring(0, 10)}</div>
              </div>
              <div className="text-right">
                <button onClick={() => delSub(s.id)} className="text-red-500 hover:underline text-xs">删除订阅</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
