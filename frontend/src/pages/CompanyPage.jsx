import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesAPI } from '../utils/api.js';

function CompanyPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    loadCompanies();
  }, [industry]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await companiesAPI.list({ industry, pageSize: 20 });
      setCompanies(res.data.companies);
      setTotal(res.data.total);
    } catch (err) {
      console.error('加载企业失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>🏢 企业列表</h1>

      <div className="search-box" style={{ marginBottom: '1.5rem' }}>
        <div className="search-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label>行业筛选</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">全部行业</option>
              <option value="餐饮">餐饮</option>
              <option value="零售">零售</option>
              <option value="物流">物流</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: '#6b7280' }}>
          共找到 <strong style={{ color: '#667eea' }}>{total}</strong> 家企业
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="status-badge active">A级信用 ({companies.filter(c => c.credit_score >= 4.5).length})</span>
          <span className="status-badge pending">B级信用 ({companies.filter(c => c.credit_score >= 3.5 && c.credit_score < 4.5).length})</span>
          <span className="status-badge rejected">C级信用 ({companies.filter(c => c.credit_score < 3.5).length})</span>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <div>🏢</div>
          <p>暂无符合条件的企业</p>
        </div>
      ) : (
        <div className="job-list">
          {companies.map(company => (
            <div
              key={company.id}
              className="job-card"
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <div className="job-card-header">
                <div>
                  <h3 className="job-title">{company.name}</h3>
                  <div className="job-company">
                    <span className="tag industry">{company.industry}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="rating-stars" style={{ color: '#fbbf24', fontSize: '1.5rem' }}>
                    {renderStars(company.credit_score)}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#667eea', fontWeight: 'bold', marginTop: '0.3rem' }}>
                    {company.credit_score.toFixed(1)} 分
                  </div>
                </div>
              </div>
              <div className="sidebar-card" style={{ marginTop: '0.8rem', background: '#eff6ff', border: '1px solid #93c5fd' }}>
                <p style={{ margin: '0.3rem 0', color: '#1e40af', fontSize: '0.9rem' }}>
                  <strong>📍 企业地址：</strong>{company.address || '地址待完善'}
                </p>
              </div>
              <div className="sidebar-card" style={{ marginTop: '0.5rem', background: '#fef3c7', border: '1px solid #fcd34d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: company.turnover_rate > 0.3 ? '#dc2626' : '#15803d', fontWeight: 'bold' }}>
                      {(company.turnover_rate * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#78350f' }}>
                      👥 员工离职率
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: company.social_insurance_rate < 0.8 ? '#dc2626' : '#15803d', fontWeight: 'bold' }}>
                      {(company.social_insurance_rate * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#78350f' }}>
                      🛡️ 社保缴纳率
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: '#fbbf24' }}>
                      {renderStars(company.credit_score)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#78350f' }}>
                      ⭐ 信用评级
                    </div>
                  </div>
                </div>
              </div>
              <div className="job-footer">
                <div className="credit-info">
                  <span style={{ fontSize: '0.85rem' }}>对接社保局数据 · 数据每月更新</span>
                </div>
                <span className={`status-badge ${company.credit_score >= 4.5 ? 'active' : company.credit_score >= 3.5 ? 'pending' : 'rejected'}`} style={{ fontSize: '0.9rem' }}>
                  {company.credit_score >= 4.5 ? 'A级信用' : company.credit_score >= 3.5 ? 'B级信用' : 'C级信用'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompanyPage;
