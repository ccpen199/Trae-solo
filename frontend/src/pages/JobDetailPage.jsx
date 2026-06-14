import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api.js';

function JobDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [myApplication, setMyApplication] = useState(null);

  useEffect(() => {
    fetchJobDetail();
    if (user && user.role === 'jobseeker') {
      fetchMyApplication();
    }
  }, [id, user]);

  const fetchJobDetail = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.job);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplication = async () => {
    try {
      const res = await api.get('/applications/my');
      const app = res.data.applications.find(a => a.job_id === parseInt(id));
      setMyApplication(app || null);
    } catch (error) {
      console.error('Failed to fetch application:', error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'jobseeker') {
      setError('只有求职者可以投递岗位');
      return;
    }

    setApplying(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/applications', { jobId: id });
      setSuccess('投递成功！HR会尽快与您联系');
      fetchMyApplication();
    } catch (error) {
      setError(error.response?.data?.error || '投递失败，请重试');
    } finally {
      setApplying(false);
    }
  };

  const handleStartChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages/${job.employer_id}`);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!reportReason) {
      setError('请选择举报原因');
      return;
    }
    setReporting(true);
    try {
      await api.post('/admin/reports', {
        reportedType: 'job',
        reportedId: id,
        reason: reportReason,
        description: reportDescription
      });
      setSuccess('举报已提交，我们会尽快处理');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      setError(error.response?.data?.error || '举报失败，请重试');
    } finally {
      setReporting(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <span style={{ color: '#faad14' }}>
        {'★'.repeat(fullStars)}
        {hasHalf && '☆'}
        {'☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待处理', class: 'badge-warning' },
      reviewing: { text: '审核中', class: 'badge-info' },
      interview: { text: '面试中', class: 'badge-info' },
      accepted: { text: '已录用', class: 'badge-success' },
      rejected: { text: '已拒绝', class: 'badge-error' },
      hired: { text: '已入职', class: 'badge-success' }
    };
    const s = statusMap[status] || { text: status, class: '' };
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  };

  const renderMatchBreakdown = () => {
    if (!job || !job.matchScore) return null;
    return (
      <div className="card mb-24" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <h3 style={{ marginBottom: '16px', color: '#389e0d' }}>🎯 智能匹配分析</h3>
        <div className="grid grid-5">
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{job.skillMatch}%</div>
            <div className="text-sm text-secondary">技能匹配</div>
            <div style={{ height: '4px', background: '#e8e8e8', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${job.skillMatch}%`, background: '#52c41a', borderRadius: '2px' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{job.salaryMatch}%</div>
            <div className="text-sm text-secondary">薪资匹配</div>
            <div style={{ height: '4px', background: '#e8e8e8', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${job.salaryMatch}%`, background: '#1890ff', borderRadius: '2px' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>{job.locationMatch}%</div>
            <div className="text-sm text-secondary">地点匹配</div>
            <div style={{ height: '4px', background: '#e8e8e8', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${job.locationMatch}%`, background: '#722ed1', borderRadius: '2px' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>{job.availableDateMatch}%</div>
            <div className="text-sm text-secondary">到岗时间</div>
            <div style={{ height: '4px', background: '#e8e8e8', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${job.availableDateMatch}%`, background: '#fa8c16', borderRadius: '2px' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eb2f96' }}>{job.companyMatch}%</div>
            <div className="text-sm text-secondary">企业评分</div>
            <div style={{ height: '4px', background: '#e8e8e8', borderRadius: '2px', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${job.companyMatch}%`, background: '#eb2f96', borderRadius: '2px' }}></div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #d9f7be' }}>
          <span className="text-secondary">综合匹配度：</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#389e0d', margin: '0 8px' }}>{job.matchScore}%</span>
          {job.matchScore >= 80 && <span className="badge badge-success">高度匹配</span>}
          {job.matchScore >= 60 && job.matchScore < 80 && <span className="badge badge-info">较好匹配</span>}
          {job.matchScore < 60 && <span className="badge badge-warning">一般匹配</span>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading"><div className="spinner"></div></div>
    );
  }

  if (!job) {
    return (
      <div className="container" style={{ padding: '60px 20px' }}>
        <div className="card text-center">
          <p className="text-secondary">岗位不存在</p>
          <Link to="/jobs" className="btn btn-primary mt-16">返回岗位列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {myApplication && (
        <div className="card mb-24" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
          <div className="flex flex-between flex-center">
            <div>
              <div style={{ fontWeight: '600', color: '#d46b08', marginBottom: '4px' }}>📋 您的投递状态</div>
              <div className="flex flex-center gap-12">
                {getStatusBadge(myApplication.status)}
                <span className="text-secondary">投递时间：{myApplication.applied_at}</span>
                {myApplication.match_score && <span className="text-secondary">匹配度：{myApplication.match_score}%</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/jobseeker/applications" className="btn btn-outline btn-sm">查看完整进度</Link>
              <button className="btn btn-primary btn-sm" onClick={handleStartChat}>与HR沟通</button>
            </div>
          </div>
        </div>
      )}

      {job.matchScore && user && user.role === 'jobseeker' && renderMatchBreakdown()}

      <div className="card">
        <div className="flex flex-between" style={{ marginBottom: '24px' }}>
          <div>
            <div className="flex flex-center gap-8 mb-8">
              <h1 style={{ fontSize: '28px', marginBottom: 0 }}>{job.title}</h1>
              {job.is_urgent && <span className="badge badge-error">急聘</span>}
            </div>
            <div className="salary" style={{ fontSize: '24px' }}>¥{job.salary_min}-{job.salary_max}/月</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {user && user.role === 'jobseeker' && !myApplication && (
              <>
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={handleApply}
                  disabled={applying}
                  style={{ display: 'block', marginBottom: '8px', minWidth: '140px' }}
                >
                  {applying ? '投递中...' : '立即投递'}
                </button>
                <button 
                  className="btn btn-outline btn-lg"
                  onClick={handleStartChat}
                  style={{ minWidth: '140px' }}
                >
                  💬 在线沟通
                </button>
              </>
            )}
            {user && user.role === 'jobseeker' && myApplication && (
              <>
                <button 
                  className="btn btn-outline btn-lg"
                  onClick={handleStartChat}
                  style={{ display: 'block', marginBottom: '8px', minWidth: '140px' }}
                >
                  💬 继续沟通
                </button>
                <Link 
                  to="/jobseeker/applications"
                  className="btn btn-primary btn-lg"
                  style={{ minWidth: '140px', textDecoration: 'none', display: 'inline-block' }}
                >
                  📋 追踪进度
                </Link>
              </>
            )}
            <button
              className="btn btn-link"
              onClick={() => setShowReportModal(true)}
              style={{ color: '#ff4d4f', marginTop: '8px' }}
            >
              ⚠️ 举报该岗位
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <span className="tag">📍 {job.location}</span>
          {job.work_type && <span className="tag">{job.work_type}</span>}
          {job.available_date && <span className="tag tag-success">📅 {job.available_date} 可到岗</span>}
          {job.has_food && <span className="tag tag-primary">包吃</span>}
          {job.has_lodging && <span className="tag tag-primary">包住</span>}
          {job.has_insurance && <span className="tag tag-primary">五险</span>}
          {job.has_fund && <span className="tag tag-primary">公积金</span>}
          {job.distance !== null && <span className="tag tag-info">距离约 {Math.round(job.distance)} 公里</span>}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>技能要求</h3>
            <div>
              {job.skills.map((skill, i) => (
                <span key={i} className="tag tag-outline" style={{ marginRight: '8px', marginBottom: '8px' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>企业信息</h3>
          <div className="flex flex-center gap-12 mb-12">
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{job.company_name}</div>
            {job.is_verified ? (
              <span className="badge badge-success">✓ 已认证企业</span>
            ) : (
              <span className="badge badge-warning">未认证</span>
            )}
            {job.company_rating && (
              <span>
                {renderStars(job.company_rating)}
                <span className="text-secondary" style={{ marginLeft: '4px' }}>{job.company_rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          <div className="grid grid-3 text-sm mb-12">
            <div>
              <span className="text-secondary">HR响应时效：</span>
              <span style={{ color: '#1890ff', fontWeight: '600' }}>{job.hr_response_time || '24小时'}</span>
            </div>
            {job.response_rate !== undefined && (
              <div>
                <span className="text-secondary">回复率：</span>
                <span style={{ fontWeight: '600' }}>{job.response_rate}%</span>
              </div>
            )}
            {job.avg_response_time !== undefined && (
              <div>
                <span className="text-secondary">平均响应：</span>
                <span style={{ fontWeight: '600' }}>{job.avg_response_time}分钟</span>
              </div>
            )}
          </div>
          {job.company_description && (
            <p className="text-secondary">{job.company_description}</p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>职位描述</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
            {job.description || '暂无职位描述'}
          </p>
        </div>

        {job.requirements && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>任职要求</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {job.requirements}
            </p>
          </div>
        )}

        {job.benefits && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>其他福利</h3>
            <p>{job.benefits}</p>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>联系方式</h3>
          <p>联系人：{job.contact_person || 'HR'}</p>
          <p>联系电话：{user ? job.contact_phone || '投递后可见' : '登录后可见'}</p>
        </div>
      </div>

      {showReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowReportModal(false)}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>⚠️ 举报岗位</h3>
            <form onSubmit={handleReport}>
              <div className="form-group">
                <label className="form-label">举报原因 *</label>
                <select
                  className="form-select"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                >
                  <option value="">请选择原因</option>
                  <option value="虚假信息">虚假信息</option>
                  <option value="薪资不符">薪资与实际不符</option>
                  <option value="收费诈骗">收费诈骗</option>
                  <option value="违规招聘">违规招聘</option>
                  <option value="其他">其他原因</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">详细描述</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px' }}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="请详细描述问题，方便我们核实处理..."
                />
              </div>
              <div className="flex flex-end gap-8">
                <button type="button" className="btn btn-outline" onClick={() => setShowReportModal(false)}>取消</button>
                <button type="submit" className="btn btn-error" disabled={reporting}>
                  {reporting ? '提交中...' : '提交举报'}
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
