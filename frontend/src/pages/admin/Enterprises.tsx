import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { ROLE_LABELS, ROLE_COLORS, VERIFICATION_STATUS, formatDateTime } from '../../lib/constants';

export default function AdminEnterprises() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [f, setF] = useState({ status: '', page: 1, pageSize: 15, kw: '' });
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (f.status) p.set('status', f.status);
    p.set('page', String(f.page)); p.set('pageSize', String(f.pageSize));
    const d: any = await api.get(`/auth/admin/enterprises?${p}`);
    setData((d.enterprises || []).filter((e: any) =>
      !f.kw || e.company_name?.includes(f.kw) || e.username?.includes(f.kw) || e.unified_social_credit_code?.includes(f.kw)
    ));
    setTotal(d.total || 0); setLoading(false);
  };

  useEffect(() => { void fetchData(); }, [f.status, f.page, f.pageSize]);

  const audit = async (id: string, status: 'approved' | 'rejected') => {
    const remark = status === 'rejected' ? prompt('请填写驳回原因：') || '资料不符' : '';
    if (status === 'rejected' && remark === '') return;
    try {
      await api.post(`/auth/admin/enterprises/${id}/verify`, { status, remark });
      alert(`已${status === 'approved' ? '通过' : '驳回'}`); fetchData(); setSel(null);
    } catch (e: any) { alert(e.error); }
  };

  const calcCredit = async (id: string) => {
    try {
      const r: any = await api.post(`/trace/credit-rating/calculate/${id}`);
      alert(`信用评级：${r.final_grade} (${r.final_score}分)，已同步企业档案`); fetchData();
    } catch (e: any) { alert(e.error || '计算失败'); }
  };

  const stats = {
    total,
    pending: data.filter(e => e.verification_status === 'pending').length,
    approved: data.filter(e => e.verification_status === 'approved').length,
    rejected: data.filter(e => e.verification_status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { t: '总企业数', v: stats.total, i: '🏢', c: 'from-slate-500 to-slate-700' },
          { t: '待审核', v: stats.pending, i: '⏳', c: 'from-amber-500 to-yellow-600' },
          { t: '已通过', v: stats.approved, i: '✅', c: 'from-emerald-500 to-green-600' },
          { t: '已驳回', v: stats.rejected, i: '⛔', c: 'from-rose-500 to-red-600' }
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-1">{s.t}</div>
              <div className="text-3xl font-black text-slate-900">{s.v}</div>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.c} text-white flex items-center justify-center text-2xl shadow-md`}>{s.i}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-900">✅ 企业资质审核管理</h2>
          <div className="flex items-center gap-2">
            <input placeholder="搜索企业名/用户名/信用代码..." value={f.kw} onChange={e => setF(x => ({ ...x, kw: e.target.value }))} className="input-field w-72" />
            <div className="flex bg-slate-100 rounded-lg p-1">
              {[
                { v: '', l: '全部' }, { v: 'pending', l: '待审核' }, { v: 'approved', l: '已通过' }, { v: 'rejected', l: '已驳回' }
              ].map(t => (
                <button key={t.v} onClick={() => setF(x => ({ ...x, status: t.v, page: 1 }))}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    f.status === t.v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}>{t.l}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? <div className="p-16 text-center text-slate-400">加载中...</div> : (
          <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">企业信息</th>
                  <th className="px-4 py-3 text-left">账号</th>
                  <th className="px-4 py-3 text-left">区域</th>
                  <th className="px-4 py-3 text-left">信用</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">提交时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-slate-400">无数据</td></tr>}
                {data.map(e => {
                  const v = VERIFICATION_STATUS[e.verification_status];
                  return (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 max-w-[260px] truncate" title={e.company_name}>{e.company_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{e.unified_social_credit_code}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">法人：{e.legal_person}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-800">{e.username}</span>
                          <span className={`status-badge text-[10px] ${ROLE_COLORS[e.role]}`}>{ROLE_LABELS[e.role]}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{e.email} · {e.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{e.region}</td>
                      <td className="px-4 py-3">
                        {e.credit_score ? (
                          <div>
                            <div className="text-lg font-bold text-slate-900">{e.credit_score} <span className="text-xs text-slate-400 font-normal">/100</span></div>
                            {e.credit_rating && <div className="text-xs font-black tracking-tighter">{e.credit_rating}</div>}
                          </div>
                        ) : <span className="text-xs text-slate-400">未评级</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`status-badge ${v?.color}`}>{v?.label}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(e.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setSel(e)} className="px-2.5 py-1.5 rounded-md text-xs bg-slate-100 hover:bg-slate-200 text-slate-700">详情</button>
                          {e.verification_status === 'pending' && (
                            <>
                              <button onClick={() => audit(e.id, 'approved')} className="px-2.5 py-1.5 rounded-md text-xs bg-emerald-500 hover:bg-emerald-600 text-white">通过</button>
                              <button onClick={() => audit(e.id, 'rejected')} className="px-2.5 py-1.5 rounded-md text-xs bg-rose-500 hover:bg-rose-600 text-white">驳回</button>
                            </>
                          )}
                          {e.verification_status === 'approved' && (
                            <button onClick={() => calcCredit(e.id)} className="px-2.5 py-1.5 rounded-md text-xs bg-amber-500 hover:bg-amber-600 text-white">计算评级</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSel(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-xl text-slate-900">企业资质详情 - {sel.company_name}</h3>
              <button onClick={() => setSel(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: '企业全称', v: sel.company_name, c: 2 },
                  { k: '统一社会信用代码', v: sel.unified_social_credit_code, mono: true },
                  { k: '用户角色', v: ROLE_LABELS[sel.role] },
                  { k: '登录账号', v: sel.username },
                  { k: '所在区域', v: sel.region },
                  { k: '法定代表人', v: sel.legal_person },
                  { k: '法人身份证', v: sel.legal_person_id, mono: true },
                  { k: '联系邮箱', v: sel.email },
                  { k: '联系电话', v: sel.phone },
                  { k: '认证状态', v: VERIFICATION_STATUS[sel.verification_status].label, badge: VERIFICATION_STATUS[sel.verification_status].color },
                  { k: '信用分/等级', v: sel.credit_score ? `${sel.credit_score}分 ${sel.credit_rating || ''}` : '未评级' },
                  { k: '认证通过时间', v: sel.verified_at ? formatDateTime(sel.verified_at) : '-' },
                  { k: '注册地址', v: sel.registered_address, c: 2 },
                  { k: '营业执照', v: sel.business_license_url, link: true, c: 2 },
                  { k: '经营资质URL', v: sel.qualification_cert_url || '-', link: true, c: 2 }
                ].map((f: any, i: number) => (
                  <div key={i} className={f.c === 2 ? 'col-span-2' : ''}>
                    <div className="text-xs text-slate-400 mb-0.5">{f.k}</div>
                    <div className={`font-medium text-slate-800 ${f.mono ? 'font-mono text-xs' : ''}`}>
                      {f.badge ? <span className={`status-badge ${f.badge}`}>{f.v}</span>
                        : f.link && f.v.startsWith('http') ? <a href={f.v} target="_blank" className="text-primary-600 hover:underline truncate block max-w-full">{f.v}</a>
                        : f.v}
                    </div>
                  </div>
                ))}
              </div>
              {sel.verification_status === 'pending' && (
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => audit(sel.id, 'rejected')} className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium">⛔ 驳回认证</button>
                  <button onClick={() => audit(sel.id, 'approved')} className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium">✓ 审核通过</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
