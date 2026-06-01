import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

function AdminVerifications() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [verifyingCompany, setVerifyingCompany] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    status: 'verified',
    verification_note: '',
    bank_verified: false,
  });

  useEffect(() => {
    loadCompanies();
  }, [statusFilter]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getVerifications(statusFilter);
      setCompanies(res.data.companies);
    } catch (err) {
      console.error('Failed to load verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyingCompany) return;

    try {
      await adminAPI.verifyCompany(verifyingCompany.id, verifyForm);
      setVerifyingCompany(null);
      setVerifyForm({ status: 'verified', verification_note: '', bank_verified: false });
      loadCompanies();
    } catch (err) {
      alert('处理失败');
    }
  };

  const statusLabels = {
    pending: '⏳ 待审核',
    verified: '✅ 已认证',
    rejected: '❌ 已驳回',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/admin" className="text-sm text-secondary" style={{ marginBottom: 8, display: 'block' }}>
            ← 返回控制台
          </Link>
          <h1 className="page-title">🏢 企业资质核验</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            营业执照 OCR + 对公账户打款验证 双重核验
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-color)',
      }}>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              padding: '12px 20px',
              fontWeight: statusFilter === key ? 600 : 400,
              color: statusFilter === key ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: statusFilter === key ? '2px solid var(--primary-color)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <p>暂无{statusLabels[statusFilter]}的企业</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {companies.map(company => (
            <div key={company.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>{company.name}</h3>
                    <span className={`badge badge-${
                      company.verification_status === 'verified' ? 'success' :
                      company.verification_status === 'pending' ? 'warning' : 'danger'
                    }`}>
                      {statusLabels[company.verification_status]}
                    </span>
                    {company.bank_verified ? (
                      <span className="badge badge-success">💳 对公已验证</span>
                    ) : (
                      <span className="badge badge-warning">💳 对公待验证</span>
                    )}
                  </div>

                  <div className="grid-3" style={{ marginBottom: 16 }}>
                    <div>
                      <div className="text-sm text-muted">HR账号</div>
                      <div className="font-medium">{company.username}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted">联系邮箱</div>
                      <div className="font-medium">{company.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted">联系电话</div>
                      <div className="font-medium">{company.phone}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted">所属行业</div>
                      <div className="font-medium">{company.industry}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted">公司规模</div>
                      <div className="font-medium">{company.scale}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted">营业执照号</div>
                      <div className="font-medium">{company.license_number || '未上传'}</div>
                    </div>
                  </div>

                  {company.description && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="text-sm text-muted mb-2">公司简介</div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{company.description}</p>
                    </div>
                  )}

                  {company.license_image && (
                    <div>
                      <div className="text-sm text-muted mb-2">营业执照</div>
                      <div style={{
                        width: 200,
                        height: 140,
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                      }}>
                        📄
                      </div>
                    </div>
                  )}

                  {company.verification_note && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 8,
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}>
                      <p style={{ fontSize: 14 }}>
                        <span className="font-medium">审核意见：</span>
                        {company.verification_note}
                      </p>
                    </div>
                  )}
                </div>

                {company.verification_status === 'pending' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setVerifyingCompany(company)}
                  >
                    审核
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {verifyingCompany && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setVerifyingCompany(null)}>
          <div className="card" style={{ width: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
              审核企业：{verifyingCompany.name}
            </h2>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label">审核结果</label>
                <select
                  className="form-select"
                  value={verifyForm.status}
                  onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
                >
                  <option value="verified">✅ 认证通过</option>
                  <option value="rejected">❌ 驳回申请</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={verifyForm.bank_verified}
                    onChange={(e) => setVerifyForm({ ...verifyForm, bank_verified: e.target.checked })}
                  />
                  <span className="font-medium">对公账户打款已验证</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">审核意见</label>
                <textarea
                  className="form-textarea"
                  value={verifyForm.verification_note}
                  onChange={(e) => setVerifyForm({ ...verifyForm, verification_note: e.target.value })}
                  placeholder="请填写审核意见..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setVerifyingCompany(null)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">确认审核</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVerifications;
