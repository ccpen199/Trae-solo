import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyAPI } from '../api.js';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companyAPI.list();
      setCompanies(res.data.companies || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取企业列表失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">🏢 企业列表</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      {companies.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-text">暂无企业信息</div>
          </div>
        </div>
      ) : (
        <div className="job-list">
          {companies.map(company => (
            <Link to={`/companies/${company.id}`} key={company.id} className="job-card">
              <div className="job-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {company.name}
                {company.verified && <span className="tag verified">✓ 已认证</span>}
              </div>
              <div className="job-company" style={{ marginBottom: 12 }}>
                {company.industry} · {company.employee_count}人
              </div>
              {company.description && (
                <div style={{
                  color: '#666',
                  fontSize: 14,
                  marginBottom: 12,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {company.description}
                </div>
              )}
              <div className="job-tags" style={{ marginBottom: 12 }}>
                {company.address && <span className="tag">📍 {company.address}</span>}
                {company.license_number && (
                  <span className="tag">📄 执照已备案</span>
                )}
              </div>
              <div className="job-footer">
                <span style={{ fontSize: 12, color: '#999' }}>
                  {company.job_count || 0} 个在招职位
                </span>
                <span style={{ fontSize: 12, color: '#667eea' }}>查看详情 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
