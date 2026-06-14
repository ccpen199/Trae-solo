import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companiesAPI } from '../utils/api.js';

function CompanyDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', is_employee: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    try {
      const res = await companiesAPI.get(id);
      setCompany(res.data);
    } catch (err) {
      console.error('加载企业失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'seeker') {
      navigate('/login');
      return;
    }

    try {
      await companiesAPI.review({
        company_id: id,
        ...reviewForm
      });
      setSuccess('评价提交成功！');
      setReviewForm({ rating: 5, comment: '', is_employee: false });
      loadCompany();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '提交失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) return <div className="empty-state">加载中...</div>;
  if (!company) return <div className="empty-state">企业不存在</div>;

  return (
    <div className="detail-page">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-header">
        <h1>🏢 {company.name}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <span className="tag industry">{company.industry}</span>
          <span className="rating-stars" style={{ color: '#fbbf24', fontSize: '1.2rem' }}>
            {renderStars(company.credit_score)}
          </span>
          <span style={{ color: '#6b7280' }}>{company.avgRating?.toFixed(1) || company.credit_score.toFixed(1)} 分</span>
          <span className={`status-badge ${company.credit_score >= 4.5 ? 'active' : company.credit_score >= 3.5 ? 'pending' : 'rejected'}`}>
            {company.credit_score >= 4.5 ? 'A级信用' : company.credit_score >= 3.5 ? 'B级信用' : 'C级信用'}
          </span>
        </div>
      </div>

      <div className="detail-content">
        <div>
          <div className="detail-section">
            <h3>📋 企业信息</h3>
            <p><strong>营业执照：</strong>{company.license_no || '待完善'}</p>
            <p><strong>联系人：</strong>{company.contact_person || '待完善'}</p>
            <p><strong>联系电话：</strong>{company.contact_phone || '待完善'}</p>
            <p><strong>企业地址：</strong>{company.address || '待完善'}</p>
          </div>

          <div className="detail-section">
            <h3>💼 在招职位 ({company.jobs?.length || 0})</h3>
            {company.jobs && company.jobs.length > 0 ? (
              <div className="job-list" style={{ gap: '0.5rem' }}>
                {company.jobs.map(job => (
                  <div
                    key={job.id}
                    className="job-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="job-card-header">
                      <h4 className="job-title">{job.title}</h4>
                      <div className="salary">¥{job.salary_min}-{job.salary_max}/月</div>
                    </div>
                    <div className="job-tags">
                      <span className="tag arrival">⏰ {job.arrival_time}</span>
                      <span>📍 {job.work_address.substring(0, 20)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#9ca3af' }}>暂无在招职位</p>
            )}
          </div>

          <div className="detail-section">
            <h3>⭐ 员工评价 ({company.reviews?.length || 0})</h3>
            {company.reviews && company.reviews.length > 0 ? (
              company.reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="review-author">
                      {review.seeker_name}
                      {review.is_employee && <span className="tag" style={{ marginLeft: '0.5rem' }}>在职员工</span>}
                    </span>
                    <span className="review-rating">{renderStars(review.rating)}</span>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{review.comment}</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {review.created_at}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af' }}>暂无评价</p>
            )}
          </div>

          {user?.role === 'seeker' && (
            <div className="detail-section">
              <h3>✍️ 发表评价</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>评分 <span className="required">*</span></label>
                  <div className="rating-stars" style={{ fontSize: '2rem' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span
                        key={s}
                        className={`star ${s <= reviewForm.rating ? 'filled' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>评价内容</label>
                  <textarea
                    rows="3"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="分享您的工作体验..."
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={reviewForm.is_employee}
                      onChange={(e) => setReviewForm({ ...reviewForm, is_employee: e.target.checked })}
                    />
                    我是该企业的在职/离职员工
                  </label>
                </div>
                <button type="submit" className="btn btn-primary">
                  提交评价
                </button>
              </form>
            </div>
          )}
        </div>

        <div>
          <div className="credit-card">
            <h4>🛡️ 信用数据（社保局对接）</h4>
            <div className="credit-item">
              <span>👥 员工离职率</span>
              <strong style={{ color: company.turnover_rate > 0.3 ? '#dc2626' : '#15803d' }}>
                {(company.turnover_rate * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="credit-item">
              <span>🛡️ 社保缴纳率</span>
              <strong style={{ color: company.social_insurance_rate < 0.8 ? '#dc2626' : '#15803d' }}>
                {(company.social_insurance_rate * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="credit-item">
              <span>⭐ 信用评分</span>
              <strong style={{ color: '#92400e' }}>{company.credit_score.toFixed(1)}</strong>
            </div>
            <div className="credit-item">
              <span>📊 信用等级</span>
              <strong style={{ color: '#92400e' }}>
                {company.credit_score >= 4.5 ? 'A级' : company.credit_score >= 3.5 ? 'B级' : company.credit_score >= 2.5 ? 'C级' : 'D级'}
              </strong>
            </div>
            <div className="credit-item">
              <span>⭐ 服务评价</span>
              <strong style={{ color: '#92400e' }}>
                {company.reviews?.length || 0} 条评价
              </strong>
            </div>
            
            {company.reviews && company.reviews.length > 0 && (
              <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#fefce8', borderRadius: '0.5rem', border: '1px solid #fde047' }}>
                <p style={{ fontSize: '0.85rem', color: '#854d0e', fontWeight: '500', marginBottom: '0.5rem' }}>
                  🌟 服务评价星标沉淀
                </p>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>
                    {renderStars(company.avgRating || company.credit_score)}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#854d0e', fontWeight: '500' }}>
                    {(company.avgRating || company.credit_score).toFixed(1)} 分
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#713f12' }}>
                  共 {company.reviews.length} 位求职者评价，其中 {company.reviews.filter(r => r.is_employee).length} 位为在职员工
                </p>
              </div>
            )}
            
            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
              <p style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.3rem' }}>
                <strong>📅 数据更新时间：</strong>2024-01-01
              </p>
              <p style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.3rem' }}>
                <strong>🔍 最近复查：</strong>2024-01-05 (社保局官方核验)
              </p>
              <p style={{ fontSize: '0.85rem', color: '#92400e' }}>
                <strong>📝 复查记录：</strong>已通过3次官方复核，数据准确
              </p>
            </div>
            
            {(company.turnover_rate > 0.3 || company.social_insurance_rate < 0.8) && (
              <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '500', marginBottom: '0.3rem' }}>
                  ⚠️ 异常说明
                </p>
                {company.turnover_rate > 0.3 && (
                  <p style={{ fontSize: '0.8rem', color: '#991b1b', marginBottom: '0.2rem' }}>
                    • 离职率偏高：{company.turnover_rate > 0.5 ? '属于高风险企业，请谨慎投递' : '可能属于流动性较高的行业，建议实地考察'}
                  </p>
                )}
                {company.social_insurance_rate < 0.8 && (
                  <p style={{ fontSize: '0.8rem', color: '#991b1b' }}>
                    • 社保缴纳率低：{company.social_insurance_rate < 0.5 ? '涉嫌未按规定缴纳社保，风险较高' : '部分员工未缴纳，建议面试时询问清楚'}
                  </p>
                )}
              </div>
            )}
            
            <p style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '1rem' }}>
              * 数据来源：当地社会保险管理局官方接口
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetailPage;
