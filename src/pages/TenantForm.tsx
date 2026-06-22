import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import VerifyFlow from '@/components/tenant/VerifyFlow';
import type { Tenant } from '@/types';
import { uid } from '@/types';
import { useAppStore } from '@/store';
import dayjs from 'dayjs';
import NotFound from './NotFound';
import { validateIdCard, validatePhone } from '@/utils/formatters';

type Mode = 'create' | 'edit';

export default function TenantForm() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { duplicate?: Tenant } };
  const { id } = useParams();
  const tenants = useAppStore((s) => s.tenants);
  const properties = useAppStore((s) => s.properties);
  const addTenant = useAppStore((s) => s.addTenant);
  const updateTenant = useAppStore((s) => s.updateTenant);

  const mode: Mode = id ? 'edit' : 'create';
  const existing = id ? tenants.find((t) => t.id === id) : location.state?.duplicate;
  if (id && !existing) return <NotFound />;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    phone: existing?.phone ?? '',
    propertyId: existing?.propertyId ?? '',
    status: existing?.status ?? 'pending',
    moveInDate: existing?.moveInDate ?? dayjs().format('YYYY-MM-DD'),
    moveOutDate: existing?.moveOutDate ?? '',
    emergencyContact: existing?.emergencyContact ?? '',
    remark: existing?.remark ?? '',
  });

  const [showVerify, setShowVerify] = useState(mode === 'create');
  const [verifyResult, setVerifyResult] = useState<{
    idCard: Tenant['idCard'];
    faceVerify: Tenant['faceVerify'];
    verifyStatus: Tenant['verifyStatus'];
  } | null>(
    existing
      ? {
          idCard: existing.idCard,
          faceVerify: existing.faceVerify,
          verifyStatus: existing.verifyStatus,
        }
      : null
  );

  const rentedProperties = useMemo(
    () => properties.filter((p) => p.status !== 'sold' && p.status !== 'maintenance'),
    [properties]
  );

  const errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {};
    if (!form.name.trim()) e.name = '请输入姓名';
    if (!validatePhone(form.phone)) e.phone = '请输入有效的11位手机号';
    if (verifyResult?.idCard.idNo && !validateIdCard(verifyResult.idCard.idNo))
      e.idNo = '身份证号校验失败';
    return e;
  }, [form, verifyResult]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm({ ...form, [key]: value });
  }

  function save() {
    if (Object.keys(errors).length > 0) {
      alert('请修正表单错误后再保存');
      return;
    }
    const base = {
      name: form.name,
      phone: form.phone,
      propertyId: form.propertyId || undefined,
      status: form.status,
      moveInDate: form.moveInDate || undefined,
      moveOutDate: form.moveOutDate || undefined,
      emergencyContact: form.emergencyContact || undefined,
      remark: form.remark || undefined,
      idCard: verifyResult?.idCard ?? {
        name: form.name,
        gender: '男',
        nation: '汉',
        birth: form.moveInDate || dayjs().format('YYYY-MM-DD'),
        address: '',
        idNo: '',
        issuingAuthority: '',
        validPeriod: '',
      },
      faceVerify: verifyResult?.faceVerify ?? { passed: false, score: 0, timestamp: '' },
      verifyStatus: verifyResult?.verifyStatus ?? 'unverified',
    };
    if (mode === 'edit' && id) {
      updateTenant(id, base);
    } else {
      const t = addTenant(base as Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>);
      id && t;
    }
    navigate('/tenants');
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="btn-ghost -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div>
            <div className="kicker mb-1">{mode === 'edit' ? '编辑租客' : '新增租客'}</div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              {mode === 'edit' ? '编辑租客资料' : '录入租客信息 & 身份核验'}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/tenants" className="btn-secondary">
            取消
          </Link>
          <button className="btn-primary" onClick={save}>
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">👤 基础资料</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">姓名 *</label>
                <input
                  className="input"
                  placeholder="租客真实姓名"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label">手机号 *</label>
                <input
                  className="input"
                  placeholder="11位手机号"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
                {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">绑定房源</label>
                <select
                  className="input"
                  value={form.propertyId}
                  onChange={(e) => update('propertyId', e.target.value)}
                >
                  <option value="">— 暂不绑定 —</option>
                  {rentedProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.layout} · ¥{p.monthlyRent}/月
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">租客状态</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as Tenant['status'])}
                >
                  <option value="pending">待入住</option>
                  <option value="living">在住</option>
                  <option value="moved">已退租</option>
                </select>
              </div>
              <div>
                <label className="label">入住日期</label>
                <input
                  type="date"
                  className="input"
                  value={form.moveInDate}
                  onChange={(e) => update('moveInDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label">退租日期（可选）</label>
                <input
                  type="date"
                  className="input"
                  value={form.moveOutDate}
                  onChange={(e) => update('moveOutDate', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">紧急联系人</label>
                <input
                  className="input"
                  placeholder="紧急联系人姓名及电话"
                  value={form.emergencyContact}
                  onChange={(e) => update('emergencyContact', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">备注</label>
                <textarea
                  rows={3}
                  className="input"
                  placeholder="职业、付款习惯、特殊约定等"
                  value={form.remark}
                  onChange={(e) => update('remark', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="card p-6 rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/40 via-white to-white">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="section-title mb-1">
                  🛡️ 身份核验 · 实名+活体
                </h3>
                <p className="text-[13px] text-slate-500">
                  完成核验后才可签署正式租约。建议优先完成以避免后续纠纷。
                </p>
              </div>
              {verifyResult ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {verifyResult.verifyStatus === 'verified'
                    ? `核验完成 · 活体${Math.round(verifyResult.faceVerify.score * 100)}分`
                    : verifyResult.verifyStatus === 'ocr_done'
                      ? 'OCR已完成'
                      : '部分完成'}
                </div>
              ) : null}
            </div>
            {!showVerify ? (
              <div className="py-8 text-center">
                <button className="btn-primary" onClick={() => setShowVerify(true)}>
                  开始身份核验流程
                </button>
              </div>
            ) : (
              <VerifyFlow
                defaultIdCard={verifyResult?.idCard}
                defaultVerify={verifyResult?.verifyStatus}
                defaultFace={verifyResult?.faceVerify}
                onComplete={(r) => {
                  setVerifyResult(r);
                  if (!form.name && r.idCard.name) update('name', r.idCard.name);
                }}
              />
            )}
            {errors.idNo && (
              <p className="text-rose-500 text-xs mt-3">⚠️ {errors.idNo}</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 rounded-2xl sticky top-20">
            <h3 className="section-title text-sm">📋 提交前检查</h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <CheckItem ok={!!form.name.trim()} text="填写了租客姓名" />
              <CheckItem ok={validatePhone(form.phone)} text="手机号格式正确" />
              <CheckItem ok={!!form.propertyId} text="绑定了目标房源" />
              <CheckItem
                ok={!!verifyResult && verifyResult.verifyStatus === 'verified'}
                text="身份核验已通过"
                warn
              />
              <CheckItem
                ok={
                  !verifyResult?.idCard.idNo || validateIdCard(verifyResult.idCard.idNo)
                }
                text="身份证号校验通过"
              />
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <b>💡 合规提示：</b>保存即视为确认信息真实。依据《民法典》第146条，提供虚假身份可主张合同无效。
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ ok, text, warn }: { ok: boolean; text: string; warn?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={
          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 ' +
          (ok
            ? 'bg-emerald-100 text-emerald-700'
            : warn
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-400')
        }
      >
        {ok ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <span className="text-[10px] font-bold">{warn ? '!' : '×'}</span>
        )}
      </span>
      <span className={ok ? '' : warn ? 'text-amber-700' : 'text-slate-400'}>{text}</span>
    </li>
  );
}

// workaround: avoid lint unused
void uid;
