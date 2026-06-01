import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resumeAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function ResumeList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    skill: '',
    salary_min: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    loadResumes();
    if (user?.role === 'hr') {
      loadVerificationStatus();
    }
  }, [filters, user]);

  const loadVerificationStatus = async () => {
    try {
      const res = await authAPI.getCurrentUser();
      setVerificationStatus(res.data.user.verification_status);
    } catch (err) {
      console.error('Failed to load verification status:', err);
    }
  };

  const loadResumes = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const res = await resumeAPI.listResumes(params);
      setResumes(res.data.resumes);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 找人才</h1>
        {!loading && <div>共 {total} 份简历</div>}
      </div>

      {user?.role === 'hr' && (
        <div className="grid-3" style={{ gap: 16, marginBottom: 24 }}>
          <div
            className="card card-hover"
            style={{ padding: 24, cursor: 'pointer', display: 'block', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '2px dashed rgba(59, 130, 246, 0.3)' }}
            onClick={() => navigate('/my/jobs')}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>发布职位快闪页</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              上传视频介绍、办公环境实拍、团队Vlog，发布带多媒体的职位
            </p>
            <div style={{ marginTop: 12, color: 'var(--primary-color)', fontSize: 13, fontWeight: 500 }}>
              去发布 →
            </div>
          </div>

          <div
            className="card card-hover"
            style={{ padding: 24, cursor: 'pointer', display: 'block', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '2px dashed rgba(16, 185, 129, 0.3)' }}
            onClick={() => navigate('/chat')}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>人才沟通</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              实时聊天、语音通话、文件传输，自动识别面试意向
            </p>
            <div style={{ marginTop: 12, color: 'var(--success-color)', fontSize: 13, fontWeight: 500 }}>
              查看消息 →
            </div>
          </div>

          <div
            className="card card-hover"
            style={{ padding: 24, cursor: 'pointer', display: 'block', background: verificationStatus === 'verified' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' 
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: verificationStatus === 'verified' 
                ? '2px solid rgba(16, 185, 129, 0.3)' 
                : '2px dashed rgba(245, 158, 11, 0.3)' }}
            onClick={() => navigate('/admin/verification')}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {verificationStatus === 'verified' ? '✅' : '📝'}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>企业资质核验</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {verificationStatus === 'verified' 
                ? '已完成营业执照OCR+对公账户打款验证' 
                : '完成营业执照OCR+对公账户打款验证，解锁全部功能'}
            </p>
            <div style={{ marginTop: 12, color: verificationStatus === 'verified' ? 'var(--success-color)' : 'var(--accent-color)', fontSize: 13, fontWeight: 500 }}>
              {verificationStatus === 'verified' ? '✓ 已核验' : '去核验 →'}
            </div>
          </div>
        </div>
      )}

      {user?.role !== 'hr' && user?.role !== 'admin' && (
        <div className="card" style={{ padding: 16, marginBottom: 24, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <p style={{ color: 'var(--primary-color)', fontSize: 14 }}>
            💡 只有企业 HR 和管理员可以查看简历详情。
            {!user && <span>请 <Link to="/register" className="font-medium">注册企业账号</Link> 后查看。</span>}
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <form onSubmit={handleSearch}>
          <div className="grid-4" style={{ gap: 12 }}>
            <input
              type="text"
              className="form-input"
              placeholder="搜索职位、技能..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <select
              className="form-select"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">所有城市</option>
              <option value="北京市朝阳区">北京朝阳</option>
              <option value="北京市海淀区">北京海淀</option>
              <option value="北京市西城区">北京西城</option>
              <option value="上海市">上海</option>
              <option value="深圳市">深圳</option>
            </select>
            <input
              type="text"
              className="form-input"
              placeholder="技能标签（如 React）"
              value={filters.skill}
              onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
            />
            <button type="submit" className="btn btn-primary">搜索</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : resumes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p>暂无符合条件的简历</p>
        </div>
      ) : (
        <div className="grid-3">
          {resumes.map(resume => (
            <Link key={resume.id} to={`/resumes/${resume.id}`} className="card card-hover" style={{ padding: 20, display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="avatar avatar-lg">
                  {resume.real_name?.charAt(0) || '求'}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{resume.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {resume.real_name} · {resume.work_years}年 · {resume.education}
                  </p>
                </div>
              </div>

              <div style={{ color: 'var(--secondary-color)', fontWeight: 600, marginBottom: 12 }}>
                期望 {resume.expected_salary_min}K - {resume.expected_salary_max}K
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {resume.skills?.slice(0, 4).map((skill, i) => (
                  <span key={i} className="tag">{skill}</span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>📍 {resume.city}</span>
                <span>👁️ {resume.view_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumeList;
