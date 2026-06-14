import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI, interviewsAPI, reviewsAPI } from '../utils/api.js';

function JobDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interview_time: '',
    call_summary: ''
  });
  const [myApplication, setMyApplication] = useState(null);
  const [myInterviews, setMyInterviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const res = await jobsAPI.get(id);
      setJob(res.data);
      
      if (user?.role === 'seeker') {
        try {
          const appRes = await applicationsAPI.myApplications();
          const myApp = appRes.data.find(a => a.job_id == id);
          setMyApplication(myApp || null);
          
          if (myApp) {
            const interviewRes = await interviewsAPI.list({ application_id: myApp.id });
            setMyInterviews(interviewRes.data.interviews || []);
          }
        } catch (err) {
          console.error('加载申请状态失败:', err);
        }
      }
    } catch (err) {
      setError('职位不存在或已下架');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'seeker') {
      setError('只有求职者可以投递简历');
      return;
    }

    try {
      await applicationsAPI.create({ job_id: id });
      setSuccess('投递成功！企业会尽快与您联系');
      setTimeout(() => setSuccess(''), 3000);
      loadJob();
    } catch (err) {
      setError(err.response?.data?.error || '投递失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleConfirmInterview = async (interviewId) => {
    try {
      await interviewsAPI.confirm(interviewId);
      setSuccess('面试邀约已确认！');
      setTimeout(() => setSuccess(''), 3000);
      loadJob();
    } catch (err) {
      setError('确认失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await reviewsAPI.create({
        company_id: job.company_id,
        job_id: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setSuccess('评价提交成功！');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      loadJob();
    } catch (err) {
      setError('评价失败');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    try {
      const res = await interviewsAPI.create({
        application_id: job?.application_id || 1,
        ...interviewForm
      });
      setSuccess(`面试邀约已发送！提取到 ${res.data.key_promises.length} 个关键承诺点`);
      setShowInterviewModal(false);
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) return <div className="empty-state">加载中...</div>;
  if (error && !job) return <div className="empty-state">{error}</div>;
  if (!job) return null;

  return (
    <div className="detail-page">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-header">
        <div style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '0.35rem' }}>职位详情</div>
        <h1>{job.title}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <span className="tag industry">{job.industry}</span>
          <span className="tag arrival">⏰ {job.arrival_time}</span>
          <span className="salary">¥{job.salary_min}-{job.salary_max}/月</span>
          {job.is_suspicious && (
            <span className="tag warning">⚠️ {job.suspicious_reason}</span>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div>
          {user?.role === 'seeker' && myApplication && (
            <div className="detail-section" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
              <h3>📊 我的申请状态</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <div className={`status-badge ${myApplication.status === 'pending' ? 'pending' : myApplication.status === 'interview' ? 'active' : myApplication.status === 'accepted' ? 'active' : 'rejected'}`}>
                  {myApplication.status === 'pending' ? '⏳ 待处理' :
                   myApplication.status === 'interview' ? '📞 面试中' :
                   myApplication.status === 'accepted' ? '✅ 已录用' : '❌ 已拒绝'}
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  申请时间：{myApplication.created_at}
                </span>
              </div>
              
              <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#15803d' }}></div>
                  <span><strong>投递简历</strong> - {myApplication.created_at}</span>
                </div>
                {myApplication.status !== 'pending' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: myApplication.status === 'rejected' ? '#dc2626' : '#15803d' }}></div>
                    <span><strong>企业{myApplication.status === 'rejected' ? '拒绝' : '查看'}简历</strong></span>
                  </div>
                )}
                {myInterviews.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#15803d' }}></div>
                    <span><strong>发送面试邀约 ({myInterviews.length}次)</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {user?.role === 'seeker' && myInterviews.length > 0 && (
            <div className="detail-section">
              <h3>🎙️ 面试邀约记录 ({myInterviews.length})</h3>
              {myInterviews.map(iv => (
                <div key={iv.id} className="sidebar-card" style={{ marginBottom: '1rem', background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <p><strong>📅 面试时间：</strong>{iv.interview_time}</p>
                      <p><strong>📍 面试地点：</strong>{iv.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`status-badge ${iv.status === 'confirmed' ? 'active' : 'pending'}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                        {iv.status === 'confirmed' ? '✅ 已确认' : '⏳ 待确认'}
                      </span>
                      <button
                        className="btn btn-success btn-sm"
                        style={{ width: '100%', marginTop: '0.3rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ar-navigate/${job.id}`);
                        }}
                      >
                        🧭 AR导航到面试地点
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '0.5rem', margin: '0.8rem 0' }}>
                    <p style={{ marginBottom: '0.3rem', fontWeight: '500', color: '#166534' }}>🎧 平台电话录音存档</p>
                    <p style={{ color: '#166534', fontSize: '0.85rem' }}>录音文件：{iv.recording_url}</p>
                  </div>
                  
                  <div style={{ background: '#fef3c7', padding: '0.8rem', borderRadius: '0.5rem', marginBottom: '0.8rem' }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#92400e' }}>🎯 自动提取的关键承诺点</p>
                    {iv.key_promises && iv.key_promises.length > 0 ? (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {iv.key_promises.map((p, idx) => (
                          <span key={idx} className="tag credit" style={{ fontSize: '0.8rem' }}>
                            {p.keyword}：{p.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#92400e', fontSize: '0.85rem' }}>暂无提取到的承诺点</p>
                    )}
                  </div>
                  
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                    <strong>📝 通话摘要：</strong>{iv.call_summary}
                  </p>
                  
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.8rem', fontStyle: 'italic' }}>
                    * 以上承诺点已推送双方确认，如有争议可申请平台仲裁
                  </div>
                  
                  {iv.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirmInterview(iv.id)}
                      >
                        ✅ 确认以上承诺，参加面试
                      </button>
                      <button className="btn btn-secondary btn-sm">
                        ❌ 有异议，申请仲裁
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {user?.role === 'seeker' && myApplication?.status === 'accepted' && (
            <div className="detail-section">
              <h3>⭐ 服务评价</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowReviewModal(true)}
              >
                ✍️ 对企业进行服务评价
              </button>
            </div>
          )}

          <div className="detail-section">
            <h3>📍 实际工作地址</h3>
            <p style={{ fontSize: '1.05rem', color: '#374151' }}>{job.work_address}</p>
            {job.work_lng && job.work_lat && (
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                坐标: {job.work_lng}, {job.work_lat}
              </p>
            )}
            {user?.role === 'seeker' && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-success"
                  onClick={() => navigate(`/ar-navigate/${job.id}`)}
                >
                  🧭 AR实景导航到这里
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => window.open(`https://uri.amap.com/marker?position=${job.work_lng},${job.work_lat}&name=${encodeURIComponent(job.title)}&src=求职平台`, '_blank')}
                >
                  🗺️ 地图查看
                </button>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3>📋 职位要求</h3>
            <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>
              {job.requirements || '暂无详细要求'}
            </p>
          </div>

          <div className="detail-section">
            <h3>🎁 福利待遇</h3>
            <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>
              {job.benefits || '暂无福利信息'}
            </p>
          </div>

          <div className="detail-section">
            <h3>🏢 企业信息</h3>
            <p><strong>企业名称：</strong>{job.company_name}</p>
            <p><strong>联系人：</strong>{job.contact_person}</p>
            <p><strong>联系电话：</strong>{job.contact_phone}</p>
            <p><strong>企业地址：</strong>{job.company_address}</p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.5rem' }}
              onClick={() => navigate(`/companies/${job.company_id}`)}
            >
              查看企业详情 →
            </button>
          </div>

          {job.reviews && job.reviews.length > 0 && (
            <div className="detail-section">
              <h3>⭐ 员工评价 ({job.reviews.length})</h3>
              {job.reviews.slice(0, 3).map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="review-author">{review.seeker_name}</span>
                    <span className="review-rating">{renderStars(review.rating)}</span>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{review.comment}</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {review.created_at}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="credit-card">
            <h4>🛡️ 企业信用数据</h4>
            <div className="credit-item">
              <span>信用等级</span>
              <strong style={{ color: '#92400e' }}>
                {job.credit_score >= 4.5 ? 'A级' : job.credit_score >= 3.5 ? 'B级' : job.credit_score >= 2.5 ? 'C级' : 'D级'}
              </strong>
            </div>
            <div className="credit-item">
              <span>信用评分</span>
              <strong style={{ color: '#92400e' }}>⭐ {job.credit_score?.toFixed(1) || '5.0'}</strong>
            </div>
            <div className="credit-item">
              <span>👥 员工离职率</span>
              <strong style={{ color: job.turnover_rate > 0.3 ? '#dc2626' : '#15803d' }}>
                {(job.turnover_rate * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="credit-item">
              <span>🛡️ 社保缴纳率</span>
              <strong style={{ color: job.social_insurance_rate < 0.8 ? '#dc2626' : '#15803d' }}>
                {(job.social_insurance_rate * 100).toFixed(1)}%
              </strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.8rem' }}>
              * 数据对接社保局官方接口，每月更新
            </p>
          </div>

          {user?.role === 'seeker' && (
            <div className="sidebar-card">
              <h4>📝 求职操作</h4>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '0.5rem' }}
                onClick={handleApply}
              >
                立即投递简历
              </button>
              <button
                className="btn btn-success"
                style={{ width: '100%' }}
                onClick={() => navigate(`/ar-navigate/${job.id}`)}
              >
                🧭 AR导航面试
              </button>
            </div>
          )}

          {user?.role === 'company' && user.company_id === job.company_id && (
            <div className="sidebar-card">
              <h4>👨‍💼 企业管理</h4>
              <button
                className="btn btn-warning"
                style={{ width: '100%' }}
                onClick={() => setShowInterviewModal(true)}
              >
                📞 发送面试邀约
              </button>
            </div>
          )}
        </div>
      </div>

      {showInterviewModal && (
        <div className="modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📞 发送面试邀约</h3>
            <form onSubmit={handleCreateInterview}>
              <div className="form-group">
                <label>面试时间 <span className="required">*</span></label>
                <input
                  type="datetime-local"
                  value={interviewForm.interview_time}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interview_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>通话摘要（平台电话录音自动提取）</label>
                <textarea
                  rows="4"
                  placeholder="输入或粘贴通话内容，系统将自动提取关键承诺点...&#10;示例：我们的薪资是每月5000-7000元，试用期3个月，转正后缴纳五险一金，包吃住，每月有200元全勤奖。"
                  value={interviewForm.call_summary}
                  onChange={(e) => setInterviewForm({ ...interviewForm, call_summary: e.target.value })}
                  style={{ fontFamily: 'inherit' }}
                />
                <div className="form-hint">
                  通话摘要将自动提取薪资、福利、试用期等关键承诺点，推送双方确认
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInterviewModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  发送邀约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⭐ 服务评价</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>服务评分</label>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem', color: '#fbbf24' }}>
                  {[1,2,3,4,5].map(s => (
                    <span
                      key={s}
                      style={{ cursor: 'pointer', opacity: s <= reviewForm.rating ? 1 : 0.3 }}
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
                  rows="4"
                  placeholder="请分享您的求职体验、企业服务态度等..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  提交评价
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetailPage;
