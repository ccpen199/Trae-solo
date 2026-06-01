import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { getPartners, createPartner, getCertificates, issueCertificate, getPushRules, createPushRule } from '@/api/university';
import type { UniversityPartner, InternshipCertificate, JobPushRule } from '@/types';

export default function University() {
  const { user } = useAuthStore();
  const [partners, setPartners] = useState<UniversityPartner[]>([]);
  const [certificates, setCertificates] = useState<InternshipCertificate[]>([]);
  const [pushRules, setPushRules] = useState<JobPushRule[]>([]);
  const [activeTab, setActiveTab] = useState<'partners' | 'certs' | 'rules'>('partners');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ university_name: '', contact_name: '', contact_phone: '', employment_office_code: '' });
  const [certForm, setCertForm] = useState({ worker_id: '', job_id: '', university_partner_id: '', cert_number: '' });
  const [ruleForm, setRuleForm] = useState({ university_partner_id: '', category: '', keywords: '', target_roles: '' });

  useEffect(() => {
    getPartners().then((res) => setPartners(res.list));
    getCertificates().then(setCertificates).catch(() => {});
    getPushRules().then(setPushRules).catch(() => {});
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const partner = await createPartner(partnerForm);
      setPartners((prev) => [...prev, partner]);
      setShowPartnerModal(false);
      setPartnerForm({ university_name: '', contact_name: '', contact_phone: '', employment_office_code: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cert = await issueCertificate({
        worker_id: Number(certForm.worker_id),
        job_id: Number(certForm.job_id),
        university_partner_id: Number(certForm.university_partner_id),
        cert_number: certForm.cert_number,
      });
      setCertificates((prev) => [...prev, cert]);
      setShowCertModal(false);
      setCertForm({ worker_id: '', job_id: '', university_partner_id: '', cert_number: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || '颁发失败');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rule = await createPushRule({
        university_partner_id: Number(ruleForm.university_partner_id),
        category: ruleForm.category,
        keywords: ruleForm.keywords ? ruleForm.keywords.split(',').map((s) => s.trim()) : [],
        target_roles: ruleForm.target_roles ? ruleForm.target_roles.split(',').map((s) => s.trim()) : [],
      });
      setPushRules((prev) => [...prev, rule]);
      setShowRuleModal(false);
      setRuleForm({ university_partner_id: '', category: '', keywords: '', target_roles: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const tabs = [
    { key: 'partners' as const, label: '合作高校' },
    { key: 'certs' as const, label: '实习证明' },
    { key: 'rules' as const, label: '推送规则' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">高校服务</h1>
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            {activeTab === 'partners' && <button onClick={() => setShowPartnerModal(true)} className="btn-primary text-sm">+ 添加高校</button>}
            {activeTab === 'certs' && <button onClick={() => setShowCertModal(true)} className="btn-primary text-sm">+ 颁发证明</button>}
            {activeTab === 'rules' && <button onClick={() => setShowRuleModal(true)} className="btn-primary text-sm">+ 创建规则</button>}
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'partners' && (
        <div className="space-y-3">
          {partners.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🎓</p>
              <p className="text-slate-400">暂无合作高校</p>
            </div>
          ) : (
            partners.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{p.university_name}</h3>
                    <div className="flex gap-4 text-sm text-slate-400 mt-1">
                      {p.contact_name && <span>联系人: {p.contact_name}</span>}
                      {p.contact_phone && <span>电话: {p.contact_phone}</span>}
                      {p.employment_office_code && <span>就业办编码: {p.employment_office_code}</span>}
                    </div>
                  </div>
                  <span className={p.status === 'active' ? 'badge-green' : 'badge-gray'}>
                    {p.status === 'active' ? '合作中' : '已停用'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'certs' && (
        <div className="space-y-3">
          {certificates.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📜</p>
              <p className="text-slate-400">暂无实习证明</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">证书编号</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">求职者</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">岗位</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">高校</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">颁发日期</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-3 px-4 font-mono text-brand-500">{c.cert_number}</td>
                      <td className="py-3 px-4 text-slate-700">{c.worker_nickname || `#${c.worker_id}`}</td>
                      <td className="py-3 px-4 text-slate-600">{c.job_title || `#${c.job_id}`}</td>
                      <td className="py-3 px-4 text-slate-600">{c.university_name || `#${c.university_partner_id}`}</td>
                      <td className="py-3 px-4 text-slate-400">{c.issued_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-3">
          {pushRules.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📡</p>
              <p className="text-slate-400">暂无推送规则</p>
            </div>
          ) : (
            pushRules.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{r.university_name || `高校#${r.university_partner_id}`}</h3>
                    <p className="text-sm text-slate-400 mt-1">分类: {r.category || '全部'}</p>
                    {r.keywords?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {r.keywords.map((k, i) => <span key={i} className="badge-blue">{k}</span>)}
                      </div>
                    )}
                    {r.target_roles?.length > 0 && (
                      <div className="flex gap-1.5 mt-1">
                        {r.target_roles.map((role, i) => <span key={i} className="badge-green">{role}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">添加合作高校</h3>
            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div><label className="label-text">高校名称 *</label><input type="text" value={partnerForm.university_name} onChange={(e) => setPartnerForm((f) => ({ ...f, university_name: e.target.value }))} className="input-field" required /></div>
              <div><label className="label-text">联系人</label><input type="text" value={partnerForm.contact_name} onChange={(e) => setPartnerForm((f) => ({ ...f, contact_name: e.target.value }))} className="input-field" /></div>
              <div><label className="label-text">联系电话</label><input type="text" value={partnerForm.contact_phone} onChange={(e) => setPartnerForm((f) => ({ ...f, contact_phone: e.target.value }))} className="input-field" /></div>
              <div><label className="label-text">就业办编码</label><input type="text" value={partnerForm.employment_office_code} onChange={(e) => setPartnerForm((f) => ({ ...f, employment_office_code: e.target.value }))} className="input-field" /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">确认添加</button>
                <button type="button" onClick={() => setShowPartnerModal(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCertModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">颁发实习证明</h3>
            <form onSubmit={handleIssueCert} className="space-y-4">
              <div><label className="label-text">求职者ID *</label><input type="number" value={certForm.worker_id} onChange={(e) => setCertForm((f) => ({ ...f, worker_id: e.target.value }))} className="input-field" required /></div>
              <div><label className="label-text">岗位ID *</label><input type="number" value={certForm.job_id} onChange={(e) => setCertForm((f) => ({ ...f, job_id: e.target.value }))} className="input-field" required /></div>
              <div><label className="label-text">高校合作方ID *</label><input type="number" value={certForm.university_partner_id} onChange={(e) => setCertForm((f) => ({ ...f, university_partner_id: e.target.value }))} className="input-field" required /></div>
              <div><label className="label-text">证书编号 *</label><input type="text" value={certForm.cert_number} onChange={(e) => setCertForm((f) => ({ ...f, cert_number: e.target.value }))} className="input-field" required /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">确认颁发</button>
                <button type="button" onClick={() => setShowCertModal(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">创建推送规则</h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div><label className="label-text">高校合作方ID *</label><input type="number" value={ruleForm.university_partner_id} onChange={(e) => setRuleForm((f) => ({ ...f, university_partner_id: e.target.value }))} className="input-field" required /></div>
              <div><label className="label-text">分类</label><input type="text" value={ruleForm.category} onChange={(e) => setRuleForm((f) => ({ ...f, category: e.target.value }))} className="input-field" /></div>
              <div><label className="label-text">关键词（逗号分隔）</label><input type="text" value={ruleForm.keywords} onChange={(e) => setRuleForm((f) => ({ ...f, keywords: e.target.value }))} className="input-field" placeholder="如: 促销,派发" /></div>
              <div><label className="label-text">目标角色（逗号分隔）</label><input type="text" value={ruleForm.target_roles} onChange={(e) => setRuleForm((f) => ({ ...f, target_roles: e.target.value }))} className="input-field" placeholder="如: 学生,宝妈" /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">确认创建</button>
                <button type="button" onClick={() => setShowRuleModal(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
