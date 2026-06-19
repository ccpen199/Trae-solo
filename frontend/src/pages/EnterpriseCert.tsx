import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { ROLE_LABELS, ROLE_COLORS, VERIFICATION_STATUS, formatDateTime, CATEGORY_OPTIONS } from '../lib/constants';

export default function EnterpriseCert() {
  const nav = useNavigate();
  const { user, enterprise, profile, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (enterprise) {
      const init: any = { ...enterprise };
      if (profile) Object.assign(init, profile);
      setForm(init);
    }
  }, [enterprise, profile]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setLoading(true); setSaved(false);
    try {
      await api.put('/auth/enterprise', form);
      await fetchMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { alert(e.error || '保存失败'); }
    finally { setLoading(false); }
  };

  if (!enterprise || !user) return <div className="card p-16 text-center text-slate-400">加载中...</div>;

  const v = VERIFICATION_STATUS[enterprise.verification_status];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className={`card p-6 border-2 ${enterprise.verification_status === 'approved' ? 'border-emerald-300 bg-emerald-50/40'
        : enterprise.verification_status === 'pending' ? 'border-amber-300 bg-amber-50/40' : 'border-rose-300 bg-rose-50/40'}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md shadow-black/5 ${
              enterprise.verification_status === 'approved' ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' :
              enterprise.verification_status === 'pending' ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' :
              'bg-gradient-to-br from-rose-500 to-red-600 text-white'
            }`}>
              {enterprise.verification_status === 'approved' ? '✓' : enterprise.verification_status === 'pending' ? '⏳' : '✕'}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{enterprise.company_name}</h2>
                <span className={`status-badge ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                <span className={`status-badge ${v?.color}`}>{v?.label}</span>
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                <span>法人：{enterprise.legal_person}</span>
                <span>区域：{enterprise.region}</span>
                <span>USCC：<code className="font-mono bg-white/60 px-1.5 rounded">{enterprise.unified_social_credit_code}</code></span>
              </div>
              {enterprise.credit_rating && (
                <div className="text-sm text-slate-600 mt-2">
                  信用分：<span className="font-bold text-slate-900">{enterprise.credit_score}</span>/100
                  <span className="mx-2">|</span>
                  评级：<span className="font-black text-lg tracking-tight">{enterprise.credit_rating}</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => nav('/credit-ratings')} className="btn-outline text-sm">查看完整信用档案 →</button>
        </div>
        {saved && <div className="mt-4 p-3 rounded-lg bg-emerald-100 text-emerald-700 text-sm">✓ 信息已保存</div>}
      </div>

      <div className="card p-6 space-y-5">
        <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">🏢 基本信息</h3>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="label">企业全称</label>
            <input value={form.company_name || ''} onChange={e => update('company_name', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">统一社会信用代码 (18位)</label>
            <input value={form.unified_social_credit_code || ''} onChange={e => update('unified_social_credit_code', e.target.value)} className="input-field font-mono" maxLength={18} />
          </div>
          <div>
            <label className="label">所在地区</label>
            <input value={form.region || ''} onChange={e => update('region', e.target.value)} className="input-field" placeholder="省/市" />
          </div>
          <div>
            <label className="label">法定代表人</label>
            <input value={form.legal_person || ''} onChange={e => update('legal_person', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">法人身份证号</label>
            <input value={form.legal_person_id || ''} onChange={e => update('legal_person_id', e.target.value)} className="input-field font-mono" maxLength={18} />
          </div>
          <div className="col-span-2">
            <label className="label">注册地址</label>
            <input value={form.registered_address || ''} onChange={e => update('registered_address', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">营业执照图片链接</label>
            <input value={form.business_license_url || ''} onChange={e => update('business_license_url', e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="label">经营资质文件链接</label>
            <input value={form.qualification_cert_url || ''} onChange={e => update('qualification_cert_url', e.target.value)} className="input-field" placeholder="https://..." />
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-4">
            {user.role === 'recycler' ? '♻️ 回收商业务信息' :
              user.role === 'producer' ? '🏭 产废单位业务信息' :
              user.role === 'inspector' ? '🔬 质检机构资质信息' :
              user.role === 'carrier' ? '🚚 物流承运商信息' : '账号信息'}
          </h3>

          {user.role === 'recycler' && (
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="label">回收品类 (JSON数组)</label>
                <textarea rows={2} value={form.recycling_categories || '[]'} onChange={e => update('recycling_categories', e.target.value)}
                  className="input-field font-mono text-xs" />
                <div className="text-[11px] text-slate-500 mt-1">可选: {CATEGORY_OPTIONS.map(c => c.value).join('、')}</div>
              </div>
              <div>
                <label className="label">年处理能力 (吨)</label>
                <input type="number" value={form.annual_capacity || ''} onChange={e => update('annual_capacity', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">主要业务区域 (JSON数组)</label>
                <input value={form.main_business_regions || '[]'} onChange={e => update('main_business_regions', e.target.value)}
                  className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="label">危废经营许可证 URL</label>
                <input value={form.waste_management_license_url || ''} onChange={e => update('waste_management_license_url', e.target.value)} className="input-field" />
              </div>
            </div>
          )}

          {user.role === 'producer' && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label">所属行业类型</label>
                <input value={form.industry_type || ''} onChange={e => update('industry_type', e.target.value)} className="input-field" placeholder="如：钢铁冶炼/汽车制造/电子..." />
              </div>
              <div>
                <label className="label">年产废量 (吨)</label>
                <input type="number" value={form.annual_waste_volume || ''} onChange={e => update('annual_waste_volume', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">工厂分布地点 (JSON)</label>
                <input value={form.factory_locations || '[]'} onChange={e => update('factory_locations', e.target.value)} className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="label">主要废料类型 (JSON)</label>
                <input value={form.waste_types || '[]'} onChange={e => update('waste_types', e.target.value)} className="input-field font-mono text-xs" />
              </div>
            </div>
          )}

          {user.role === 'inspector' && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label">CMA认证编号</label>
                <input value={form.cma_cert_no || ''} onChange={e => update('cma_cert_no', e.target.value)} className="input-field font-mono" />
              </div>
              <div>
                <label className="label">CMA有效期至</label>
                <input type="date" value={form.cma_valid_until || ''} onChange={e => update('cma_valid_until', e.target.value)} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="label">检测范围</label>
                <input value={form.inspection_scope || ''} onChange={e => update('inspection_scope', e.target.value)} className="input-field" />
              </div>
            </div>
          )}

          {user.role === 'carrier' && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label">道路运输经营许可证</label>
                <input value={form.carrier_license_no || ''} onChange={e => update('carrier_license_no', e.target.value)} className="input-field font-mono" />
              </div>
              <div>
                <label className="label">自有车辆数</label>
                <input type="number" value={form.vehicle_count || ''} onChange={e => update('vehicle_count', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">服务区域 (JSON)</label>
                <input value={form.service_regions || '[]'} onChange={e => update('service_regions', e.target.value)} className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="label">对接API</label>
                <select value={form.api_provider || '自有'} onChange={e => update('api_provider', e.target.value)} className="input-field">
                  <option>自有</option><option>中储运</option><option>德邦</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            账号创建：{formatDateTime(user.created_at || '')} · 最近更新：{formatDateTime(enterprise.updated_at)}
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav(-1)} className="btn-secondary">取消</button>
            <button onClick={save} disabled={loading} className="btn-primary px-8">{loading ? '保存中...' : '💾 保存企业信息'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
