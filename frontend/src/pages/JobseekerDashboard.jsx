import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function JobseekerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('applications');
  const [showGuide, setShowGuide] = useState(false);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [resumeForm, setResumeForm] = useState({
    title: '',
    skills: '',
    videoId: ''
  });
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (searchParams.get('guide') === 'record_video') {
      setShowGuide(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchApplications();
    fetchResumes();
    fetchVideos();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get('/api/applications/my');
      setApplications(data.applications);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data } = await axios.get('/api/resumes/my');
      setResumes(data.resumes);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data } = await axios.get('/api/videos/my');
      setVideos(data.videos.filter(v => v.type === 'resume'));
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const handleCreateResume = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = resumeForm.skills.split(',').map(s => s.trim()).filter(s => s);
      await axios.post('/api/resumes', {
        ...resumeForm,
        skills: skillsArray,
        videoId: resumeForm.videoId || null
      });
      setShowResumeForm(false);
      setResumeForm({ title: '', skills: '', videoId: '' });
      fetchResumes();
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      viewed: 'badge-primary',
      interview: 'badge-success',
      offer: 'badge-success',
      hired: 'badge-success',
      rejected: 'badge-danger'
    };
    const labels = {
      pending: '待查看',
      viewed: '已查看',
      interview: '面试中',
      offer: '已录用',
      hired: '已入职',
      rejected: '已拒绝'
    };
    return { className: badges[status] || 'badge-gray', label: labels[status] || status };
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>求职中心</h1>
          <p className="page-subtitle">管理您的简历和求职申请</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/record')}
          >
            📹 录制视频
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowResumeForm(true)}
          >
            创建简历
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="card" style={{ 
          marginBottom: '32px', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1px solid #93c5fd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                🎉 欢迎加入视聘！让我们开始您的求职之旅
              </h3>
              <div style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.8' }}>
                <div>1️⃣ 录制您的个人视频简历（支持美颜、字幕功能）</div>
                <div>2️⃣ 添加技能标签，AI自动优化您的简历</div>
                <div>3️⃣ 浏览视频岗位，一键投递</div>
                <div>4️⃣ 查看AI匹配度评分，接收面试邀请</div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowGuide(false);
                    navigate('/record');
                  }}
                >
                  📹 立即录制视频简历
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowGuide(false);
                    navigate('/jobs');
                  }}
                >
                  先逛逛岗位
                </button>
              </div>
            </div>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setShowGuide(false)}
              style={{ color: '#1e40af', borderColor: '#1e40af' }}
            >
              知道了
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#4f46e5' }}>
            {applications.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>总投递</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#06b6d4' }}>
            {applications.filter(a => a.status === 'viewed').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>已查看</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
            {applications.filter(a => a.status === 'interview').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>面试中</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>
            {resumes.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>简历数</div>
        </div>
      </div>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px'
        }}>
          <button 
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0, border: 'none', background: 'transparent', color: activeTab === 'applications' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'applications' ? '2px solid #4f46e5' : '2px solid transparent' }}
            onClick={() => setActiveTab('applications')}
          >
            我的投递
          </button>
          <button 
            className={`btn ${activeTab === 'resumes' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0, border: 'none', background: 'transparent', color: activeTab === 'resumes' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'resumes' ? '2px solid #4f46e5' : '2px solid transparent' }}
            onClick={() => setActiveTab('resumes')}
          >
            我的简历
          </button>
          <button 
            className={`btn ${activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0, border: 'none', background: 'transparent', color: activeTab === 'videos' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'videos' ? '2px solid #4f46e5' : '2px solid transparent' }}
            onClick={() => setActiveTab('videos')}
          >
            视频库
          </button>
        </div>

        <div className="card-body">
          {activeTab === 'applications' && (
            applications.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                暂无投递记录，去
                <Link to="/jobs" style={{ color: '#4f46e5' }}>浏览岗位</Link>
                吧
              </div>
            ) : (
              <div className="grid grid-2">
                {applications.map(app => {
                  const badge = getStatusBadge(app.status);
                  const getMatchColor = (score) => {
                    if (score >= 85) return '#16a34a';
                    if (score >= 70) return '#4f46e5';
                    if (score >= 60) return '#f59e0b';
                    return '#6b7280';
                  };
                  const matchColor = app.match_score ? getMatchColor(app.match_score) : '#6b7280';
                  return (
                    <div key={app.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                      {app.match_score && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '16px', 
                          right: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            border: `3px solid ${matchColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${matchColor}10`
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: matchColor }}>
                              {app.match_score}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                            AI匹配度
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingRight: app.match_score ? '60px' : '0' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                            {app.job_title}
                          </h3>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {app.company_name}
                          </div>
                        </div>
                        <span className={`badge ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ color: '#4f46e5', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>
                        {app.salary_min}K - {app.salary_max}K
                      </div>
                      {app.match_reason && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          marginBottom: '12px',
                          padding: '8px',
                          background: '#f9fafb',
                          borderRadius: '4px'
                        }}>
                          💡 {app.match_reason}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
                        <span>投递时间: {new Date(app.created_at).toLocaleDateString()}</span>
                        <Link to={`/jobs/${app.job_id}`} style={{ color: '#4f46e5' }}>
                          查看岗位 →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {activeTab === 'resumes' && (
            resumes.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                暂无简历，点击右上角创建第一个简历
              </div>
            ) : (
              <div className="grid grid-2">
                {resumes.map(resume => (
                  <div key={resume.id} className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      {resume.title}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                      {resume.skills?.slice(0, 5).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                    {resume.video_status && (
                      <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                        视频状态: 
                        <span className={`badge ${
                          resume.video_status === 'approved' ? 'badge-success' :
                          resume.video_status === 'rejected' ? 'badge-danger' : 'badge-warning'
                        }`} style={{ marginLeft: '8px' }}>
                          {resume.video_status === 'approved' ? '已通过' :
                           resume.video_status === 'rejected' ? '已拒绝' : '审核中'}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      创建时间: {new Date(resume.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'videos' && (
            videos.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                暂无视频，点击右上角录制第一个视频简历
              </div>
            ) : (
              <div className="grid grid-3">
                {videos.map(video => (
                  <div key={video.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ 
                      height: '120px', 
                      background: '#f3f4f6', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      marginBottom: '12px'
                    }}>
                      📹
                    </div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{video.title}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      {new Date(video.created_at).toLocaleDateString()}
                    </div>
                    <span className={`badge ${
                      video.status === 'approved' ? 'badge-success' :
                      video.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {video.status === 'approved' ? '已通过' :
                       video.status === 'rejected' ? '已拒绝' : '审核中'}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {showResumeForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>创建简历</h2>
              <button onClick={() => setShowResumeForm(false)} style={{ background: 'none', fontSize: '24px' }}>×</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateResume}>
                <div className="form-group">
                  <label className="form-label">简历标题 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={resumeForm.title}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="如：前端开发工程师简历"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">关联视频</label>
                  <select 
                    className="form-input form-select"
                    value={resumeForm.videoId}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, videoId: e.target.value }))}
                  >
                    <option value="">不关联视频</option>
                    {videos.filter(v => v.status === 'approved').map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">技能标签（用逗号分隔）</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={resumeForm.skills}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="如：React, JavaScript, CSS"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  创建简历
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobseekerDashboard;
