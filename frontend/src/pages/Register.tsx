import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ROLE_LABELS } from '../lib/constants';

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'recycler' | 'producer' | 'inspector' | 'carrier'>('recycler');
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '',
    email: '', phone: '',
    company_name: '', unified_social_credit_code: '',
    legal_person: '', legal_person_id: '',
    registered_address: '', region: '',
    business_license_url: 'https://example.com/license.jpg',
    qualification_cert_url: '',
    waste_management_license_url: ''
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const roleCards = [
    { value: 'recycler' as const, icon: '♻️', name: '回收商', desc: '废品回收加工企业，需上传《再生资源经营许可证》', color: 'from-green-500 to-emerald-600' },
    { value: 'producer' as const, icon: '🏭', name: '产废单位', desc: '制造业工厂、拆解厂等，定期产生工业废料', color: 'from-blue-500 to-indigo-600' },
    { value: 'inspector' as const, icon: '🔬', name: '质检机构', desc: 'CMA认证检测机构，出具权威质检报告', color: 'from-purple-500 to-violet-600' },
    { value: 'carrier' as const, icon: '🚛', name: '物流承运商', desc: '具备危化品运输资质的物流企业（对接中储运/德邦）', color: 'from-amber-500 to-orange-600' },
  ];

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (step === 1) {
      if (!role) { setErr('请选择注册身份'); return; }
      if (!form.username || form.username.length < 3) { setErr('用户名至少3位'); return; }
      if (!form.password || form.password.length < 6) { setErr('密码至少6位'); return; }
      if (form.password !== form.confirmPassword) { setErr('两次密码不一致'); return; }
      setStep(2);
      return;
    }

    if (!form.company_name || !form.unified_social_credit_code || !form.legal_person || !form.legal_person_id || !form.registered_address || !form.region) {
      setErr('请完整填写企业信息');
      return;
    }
    if (form.unified_social_credit_code.length !== 18) { setErr('统一社会信用代码应为18位'); return; }
    if (form.legal_person_id.length !== 18) { setErr('法人身份证号应为18位'); return; }

    setLoading(true);
    try {
      await register({
        username: form.username,
        password: form.password,
        role,
        email: form.email || undefined,
        phone: form.phone || undefined,
        enterprise: {
          company_name: form.company_name,
          unified_social_credit_code: form.unified_social_credit_code,
          legal_person: form.legal_person,
          legal_person_id: form.legal_person_id,
          registered_address: form.registered_address,
          business_license_url: form.business_license_url,
          qualification_cert_url: form.qualification_cert_url || undefined,
          waste_management_license_url: form.waste_management_license_url || undefined,
          region: form.region
        }
      });
      alert('注册成功！请使用账户名密码登录，等待企业资质审核');
      navigate('/login');
    } catch (e: any) {
      setErr(e.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 mb-6">
          ← 返回登录
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl">♻️</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">企业账户注册</h1>
              <p className="text-slate-500 text-sm">绿循环再生资源B2B平台 - {ROLE_LABELS[role]}专用通道</p>
            </div>
          </div>

          <div className="flex items-center gap-2 my-7">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>{s}</div>
                <span className={`ml-2.5 text-sm ${step >= s ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                  {s === 1 ? '选择身份与账户' : '企业资质认证'}
                </span>
                {s < 2 && <div className={`flex-1 h-0.5 mx-4 ${step > s ? 'bg-primary-400' : 'bg-slate-200'}`}></div>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label className="label mb-3">请选择注册身份（选定后不可更改）</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleCards.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          role === r.value
                            ? `border-primary-500 bg-gradient-to-br ${r.color} text-white shadow-lg`
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`text-3xl mb-2 ${role === r.value ? 'grayscale-0' : ''}`}>{r.icon}</div>
                        <div className={`font-bold ${role === r.value ? '' : 'text-slate-800'}`}>{r.name}</div>
                        <div className={`text-xs mt-1 leading-relaxed ${role === r.value ? 'text-white/80' : 'text-slate-500'}`}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">用户名</label>
                    <input type="text" value={form.username} onChange={e => update('username', e.target.value)} className="input-field" placeholder="3-50位字符" required />
                  </div>
                  <div></div>
                  <div>
                    <label className="label">登录密码</label>
                    <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input-field" placeholder="至少6位" required />
                  </div>
                  <div>
                    <label className="label">确认密码</label>
                    <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className="input-field" placeholder="再次输入密码" required />
                  </div>
                  <div>
                    <label className="label">企业邮箱 <span className="text-slate-400 font-normal">(选填)</span></label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field" placeholder="用于接收重要通知" />
                  </div>
                  <div>
                    <label className="label">联系电话 <span className="text-slate-400 font-normal">(选填)</span></label>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field" placeholder="商务联系电话" />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3">下一步：填写企业信息 →</button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">企业全称</label>
                    <input type="text" value={form.company_name} onChange={e => update('company_name', e.target.value)} className="input-field" placeholder="与营业执照完全一致" required />
                  </div>
                  <div>
                    <label className="label">统一社会信用代码</label>
                    <input type="text" value={form.unified_social_credit_code} onChange={e => update('unified_social_credit_code', e.target.value)} className="input-field" placeholder="18位代码" maxLength={18} required />
                  </div>
                  <div>
                    <label className="label">所在省市</label>
                    <input type="text" value={form.region} onChange={e => update('region', e.target.value)} className="input-field" placeholder="如：江苏省南京市" required />
                  </div>
                  <div>
                    <label className="label">法定代表人姓名</label>
                    <input type="text" value={form.legal_person} onChange={e => update('legal_person', e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">法人身份证号</label>
                    <input type="text" value={form.legal_person_id} onChange={e => update('legal_person_id', e.target.value)} className="input-field" maxLength={18} required />
                  </div>
                  <div className="col-span-2">
                    <label className="label">注册地址</label>
                    <input type="text" value={form.registered_address} onChange={e => update('registered_address', e.target.value)} className="input-field" placeholder="营业执照注册详细地址" required />
                  </div>
                  <div>
                    <label className="label">营业执照URL</label>
                    <input type="url" value={form.business_license_url} onChange={e => update('business_license_url', e.target.value)} className="input-field" placeholder="https://..." required />
                  </div>
                  <div>
                    <label className="label">经营资质URL <span className="text-slate-400 font-normal">(选填)</span></label>
                    <input type="url" value={form.qualification_cert_url} onChange={e => update('qualification_cert_url', e.target.value)} className="input-field" placeholder="危废经营许可证等" />
                  </div>
                </div>

                {role === 'recycler' && (
                  <div>
                    <label className="label">《废旧物资回收经营许可证》URL <span className="text-slate-400 font-normal">(回收商必填)</span></label>
                    <input type="url" value={form.waste_management_license_url} onChange={e => update('waste_management_license_url', e.target.value)} className="input-field" placeholder="上传后可提高信用评级" />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← 返回上一步</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                    {loading ? '提交注册中...' : '提交注册 · 等待审核'}
                  </button>
                </div>
              </>
            )}

            {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{err}</div>}
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          注册即视为同意《绿循环平台服务协议》与《再生资源交易合规承诺书》
        </p>
      </div>
    </div>
  );
}
