import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobAPI, chatAPI, resumeAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [myResumes, setMyResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJob();
    if (user?.role === 'jobseeker') {
      loadMyResumes();
    }
  }, [id, user]);

  const loadJob = async () => {
    try {
      const res = await jobAPI.getJob(id);
      setJob(res.data.job);
    } catch (err) {
      console.error('Failed to load job:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyResumes = async () => {
    try {
      const res = await resumeAPI.getMyResumes();
      setMyResumes(res.data.resumes);
      if (res.data.resumes.length > 0) {
        setSelectedResume(res.data.resumes[0].id);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedResume) {
      alert('请选择简历');
      return;
    }

    setSubmitting(true);
    try {
      await jobAPI.applyJob(id, {
        resume_id: selectedResume,
        message: applyMessage,
      });
      alert('投递成功！HR 会尽快查看您的简历');
      setShowApplyModal(false);
      setApplyMessage('');
    } catch (err) {
      alert(err.response?.data?.error || '投递失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await chatAPI.createChat({
        target_user_id: job.hr_id,
        job_id: job.id,
      });
      navigate(`/chat/${res.data.chat_id}`);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  if (!job) return <div className="empty-state">职位不存在或已下架</div>;

  return (
    <div className="grid-3">
      <div style={{ gridColumn: 'span 2' }}>
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{job.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-secondary)' }}>
                <span>🏢 {job.company_name}</span>
                <span>📍 {job.city}</span>
                <span>👁️ {job.view_count} 次浏览</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--secondary-color)' }}>
                {job.salary_min}K - {job.salary_max}K
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>月薪</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <span className="tag tag-primary">{job.industry}</span>
            <span className="tag">{job.work_type}</span>
            <span className="tag">{job.experience_required}</span>
            <span className="tag">{job.education_required}</span>
            <span className="tag">公司规模: {job.scale}</span>
          </div>

          {user?.role === 'jobseeker' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button className="btn btn-primary btn-lg" onClick={() => setShowApplyModal(true)}>
                📮 立即投递
              </button>
              <button className="btn btn-outline btn-lg" onClick={handleChat}>
                💬 聊聊
              </button>
            </div>
          )}

          <div className="divider" />

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📋 职位描述</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {job.description || '暂无描述'}
            </p>
          </section>

          {job.requirements && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>✅ 任职要求</h2>
              <ul style={{ lineHeight: 2, color: 'var(--text-secondary)', paddingLeft: 20 }}>
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {(job.video_url || job.team_vlog_url || (job.office_images && job.office_images.length > 0)) && (
            <div className="divider" style={{ margin: '32px 0' }} />
          )}

          {job.video_url && (
            <section style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🎬</span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 0 }}>职位介绍视频</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>HR 带你了解真实的工作内容和团队氛围</p>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: 12,
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <div style={{ fontSize: 64, marginBottom: 12, cursor: 'pointer', transition: 'transform 0.2s' }}>
                    ▶️
                  </div>
                  <p style={{ fontSize: 14, opacity: 0.8 }}>点击播放职位介绍</p>
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />
              </div>
            </section>
          )}

          {job.team_vlog_url && (
            <section style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🎥</span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 0 }}>团队 Vlog</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>走进真实的团队工作日常</p>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)',
                borderRadius: 12,
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>📹</div>
                  <p style={{ fontSize: 14, opacity: 0.9 }}>团队日常 Vlog</p>
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)' }} />
              </div>
            </section>
          )}

          {job.office_images && job.office_images.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🖼️</span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 0 }}>办公环境实拍</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>共 {job.office_images.length} 张真实环境照片</p>
                </div>
              </div>
              <div className="grid-3" style={{ gap: 12 }}>
                {job.office_images.map((img, i) => (
                  <div key={i} style={{
                    aspectRatio: '4/3',
                    background: `linear-gradient(${45 + i * 30}deg, #${(0x667eea + i * 0x111111).toString(16).padStart(6, '0')} 0%, #${(0x764ba2 + i * 0x111111).toString(16).padStart(6, '0')} 100%)`,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 36,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span>🏢</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div>
        <div className="card" style={{ padding: 24, marginBottom: 24, position: 'sticky', top: 88 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="avatar avatar-lg">
              {job.hr_name?.charAt(0).toUpperCase() || 'H'}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{job.hr_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>HR</div>
            </div>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🏢 公司信息</h3>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div>公司名称：{job.company_name}</div>
              <div>所属行业：{job.industry}</div>
              <div>公司规模：{job.scale}</div>
              <div>工作地址：{job.address || job.city}</div>
            </div>
          </div>

          {job.company_description && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📖 公司介绍</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {job.company_description}
              </p>
            </div>
          )}
        </div>
      </div>

      {showApplyModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowApplyModal(false)}>
          <div className="card" style={{ width: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
              投递简历 - {job.title}
            </h2>
            
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">选择简历</label>
                {myResumes.length === 0 ? (
                  <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>您还没有创建简历</p>
                    <Link to="/my/resumes/new" className="btn btn-primary btn-sm">创建简历</Link>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    required
                  >
                    {myResumes.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">附言（可选）</label>
                <textarea
                  className="form-textarea"
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="简单介绍一下自己，或者说明为什么适合这个职位"
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || myResumes.length === 0}>
                  {submitting ? '提交中...' : '确认投递'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetail;
