import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { CATEGORY_OPTIONS, METAL_SUBCATEGORIES, PLASTIC_SUBCATEGORIES, EQUIPMENT_SUBCATEGORIES } from '../../lib/constants';

export default function OpportunityPublish() {
  const nav = useNavigate();
  const { enterprise } = useAuthStore();
  const verified = enterprise?.verification_status === 'approved';
  const [form, setForm] = useState({
    type: 'supply',
    category: '废金属',
    sub_category: '废钢',
    title: '',
    description: '',
    quantity: 100,
    unit: '吨',
    min_price: 0,
    max_price: 0,
    price_unit: '元/吨',
    region: '',
    quality_grade: '',
    available_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subCategories: Record<string, string[]> = {
    '废金属': METAL_SUBCATEGORIES,
    '废塑料': PLASTIC_SUBCATEGORIES,
    '二手设备': EQUIPMENT_SUBCATEGORIES,
  };

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) { setErr('企业尚未通过认证，无法发布商机'); return; }
    if (!form.title || form.title.length < 5) { setErr('标题至少5个字符'); return; }
    if (!form.description || form.description.length < 10) { setErr('详细说明至少10个字符'); return; }
    if (!form.region) { setErr('请填写所在地区'); return; }
    if (form.quantity <= 0) { setErr('数量必须大于0'); return; }
    if (form.min_price < 0 || form.max_price < 0) { setErr('价格不能为负'); return; }
    if (form.min_price > form.max_price) { setErr('最低价格不能超过最高价格'); return; }
    if (new Date(form.available_date) > new Date(form.expiry_date)) { setErr('可供货日期不能晚于有效期截止日'); return; }
    setErr('');
    setSubmitting(true);

    try {
      const r: any = await api.post('/opportunities', form);
      nav(`/opportunities/${r.id}`);
    } catch (e: any) {
      setErr(e.error || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified) {
    return (
      <div className="card p-16 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">企业认证尚未通过</h3>
        <p className="text-slate-500 mb-5">请先完成企业资质审核，审核通过后即可发布商机</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">发布新商机</h2>
        <p className="text-sm text-slate-500">请如实填写信息，信息越完整越容易匹配到意向客户</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="label mb-2">商机类型</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => update('type', 'supply')}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                form.type === 'supply' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <div className="text-3xl mb-1">🏭</div>
              <div className={`font-bold ${form.type === 'supply' ? 'text-primary-700' : 'text-slate-800'}`}>供应信息</div>
              <div className="text-xs text-slate-500 mt-0.5">我有再生资源可以出售</div>
            </button>
            <button type="button" onClick={() => update('type', 'demand')}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                form.type === 'demand' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <div className="text-3xl mb-1">🛒</div>
              <div className={`font-bold ${form.type === 'demand' ? 'text-amber-700' : 'text-slate-800'}`}>求购信息</div>
              <div className="text-xs text-slate-500 mt-0.5">我需要采购再生资源</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label">主品类</label>
            <select value={form.category} onChange={e => {
              const category = e.target.value;
              update('category', category);
              update('sub_category', subCategories[category][0]);
            }} className="input-field">
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">细分品类</label>
            <select value={form.sub_category} onChange={e => update('sub_category', e.target.value)} className="input-field">
              {subCategories[form.category].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">商机标题 <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={e => update('title', e.target.value)} className="input-field"
            placeholder={form.type === 'supply' ? '如：宝钢供应优质重型废钢5000吨' : '如：公司月度求购废不锈钢300吨'} />
        </div>

        <div>
          <label className="label">详细说明 <span className="text-red-500">*</span> <span className="text-slate-400 font-normal text-xs">（规格参数、材质说明、产地来源、看货方式等）</span></label>
          <textarea rows={5} value={form.description} onChange={e => update('description', e.target.value)} className="input-field resize-none"
            placeholder={form.type === 'supply' ? '请描述货物来源、成色、含杂质比例、仓储方式、是否支持样品检测等' : '请描述需求用途、质量标准、验收方式、结算周期等'} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label">数量</label>
            <div className="flex gap-2">
              <input type="number" value={form.quantity} onChange={e => update('quantity', Number(e.target.value))} className="input-field flex-1" />
              <select value={form.unit} onChange={e => update('unit', e.target.value)} className="input-field w-24">
                <option value="吨">吨</option>
                <option value="公斤">公斤</option>
                <option value="台">台</option>
                <option value="套">套</option>
                <option value="立方米">立方米</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">品质等级</label>
            <input value={form.quality_grade} onChange={e => update('quality_grade', e.target.value)} className="input-field"
              placeholder="如：H1重废 / 食品级 / 8成新" />
          </div>
          <div>
            <label className="label">最低价格</label>
            <div className="flex gap-2">
              <input type="number" value={form.min_price} onChange={e => update('min_price', Number(e.target.value))} className="input-field flex-1" />
              <span className="inline-flex items-center px-3 rounded-lg bg-slate-100 text-slate-500 text-sm">
                {form.price_unit}
              </span>
            </div>
          </div>
          <div>
            <label className="label">最高价格</label>
            <div className="flex gap-2">
              <input type="number" value={form.max_price} onChange={e => update('max_price', Number(e.target.value))} className="input-field flex-1" />
              <span className="inline-flex items-center px-3 rounded-lg bg-slate-100 text-slate-500 text-sm">
                {form.price_unit}
              </span>
            </div>
          </div>
          <div>
            <label className="label">所在地区 <span className="text-red-500">*</span></label>
            <input value={form.region} onChange={e => update('region', e.target.value)} className="input-field" placeholder="如：江苏省南京市" />
          </div>
          <div>
            <label className="label">可供货/采购日期</label>
            <input type="date" value={form.available_date} onChange={e => update('available_date', e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="label">报价有效期截止</label>
            <input type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} className="input-field" />
          </div>
        </div>

        {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{err}</div>}

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={() => nav(-1)} className="btn-secondary flex-1 py-3">取消</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-[2] py-3">
            {submitting ? '发布中...' : '立即发布商机'}
          </button>
        </div>
      </form>
    </div>
  );
}
