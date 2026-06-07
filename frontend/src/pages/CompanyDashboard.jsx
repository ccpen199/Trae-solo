import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VIDEO_TYPE_OPTIONS = [
  { value: 'environment', label: '🏢 环境实拍', desc: '展示公司办公环境、设施等' },
  { value: 'work_live', label: '💼 工作实况', desc: '展示日常工作场景、团队协作' },
  { value: 'team_interview', label: '👥 团队访谈', desc: '团队成员介绍、员工分享' },
  { value: 'intro', label: '📋 企业介绍', desc: '公司简介、企业文化、发展历程' },
  { value: 'other', label: '🎬 其他视频', desc: '其他类型的招聘视频' }
];

const SKILL_SUGGESTIONS = ['React', 'Vue', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript', 'JavaScript', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Git', 'Linux'];

function CompanyDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [funnelStats, setFunnelStats] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    salaryMin: 15,
    salaryMax: 30,
    location: '',
    skills: '',
    experienceRequired: '',
    educationRequired: '',
    videoResumeEnabled: true
  });
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', file: null, videoType: 'intro' });
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  useEffect(() => {
    if (searchParams.get('guide') === 'upload_video') {
      setShowGuide(true);
      setShowVideoUpload(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchJobs();
    fetchFunnelStats();
    fetchVideos();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get('/api/jobs/company/my');
      setJobs(data.jobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchFunnelStats = async () => {
    try {
      const { data } = await axios.get('/api/applications/funnel/stats');
      setFunnelStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data } = await axios.get('/api/videos/my');
      setVideos(data.videos.filter(v => v.type === 'job'));
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = jobForm.skills.split(',').map(s => s.trim()).filter(s => s);
      await axios.post('/api/jobs', {
        ...jobForm,
        skills: skillsArray,
        salaryMin: parseInt(jobForm.salaryMin),
        salaryMax: parseInt(jobForm.salaryMax),
        videoId: selectedVideo
      });
      setShowJobForm(false);
      setJobForm({
        title: '',
        description: '',
        salaryMin: '',
        salaryMax: '',
        location: '',
        skills: '',
        experienceRequired: '',
        educationRequired: '',
        videoResumeEnabled: true
      });
      setSelectedVideo(null);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('type', 'job');
    formData.append('videoType', uploadForm.videoType);

    try {
      await axios.post('/api/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowVideoUpload(false);
      setUploadForm({ title: '', description: '', file: null, videoType: 'intro' });
      fetchVideos();
    } catch (err) {
      alert(err.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setJobForm(prev => ({ ...prev, skills: [...selectedSkills, skill].join(', ') }));
    }
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  const handleRemoveSkill = (skill) => {
    const newSkills = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(newSkills);
    setJobForm(prev => ({ ...prev, skills: newSkills.join(', ') }));
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      await axios.put(`/api/jobs/${jobId}`, { isActive: !currentStatus });
      fetchJobs();
    } catch (err) {
      console.error('Failed to update job:', err);
    }
  };

  const toggleVideoResume = async (jobId, currentEnabled) => {
    try {
      await axios.put(`/api/jobs/${jobId}`, { videoResumeEnabled: currentEnabled === 1 ? 0 : 1 });
      fetchJobs();
    } catch (err) {
      console.error('Failed to update video resume setting:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>企业中心</h1>
          <p className="page-subtitle">管理您的招聘岗位和视频内容</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => setShowVideoUpload(true)}
          >
            上传视频
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowJobForm(true)}
          >
            发布岗位
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="card" style={{ 
          marginBottom: '32px', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          border: '1px solid #6ee7b7'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                🎉 欢迎加入视聘！让我们开始您的招聘之旅
              </h3>
              <div style={{ color: '#047857', fontSize: '14px', lineHeight: '1.8' }}>
                <div>1️⃣ 上传您的第一个岗位介绍视频（已为您打开上传窗口）</div>
                <div>2️⃣ 发布招聘岗位，设置底薪区间和技能标签</div>
                <div>3️⃣ 开启视频简历投递功能，接收求职者的视频简历</div>
                <div>4️⃣ 在左侧查看招聘漏斗数据，追踪招聘效果</div>
              </div>
            </div>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setShowGuide(false)}
              style={{ color: '#065f46', borderColor: '#065f46' }}
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {funnelStats && (
        <div className="card" style={{ marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
              📊 招聘效果漏斗分析
            </h2>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              数据每日更新 · 点击各阶段查看详情
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            {[
              { key: 'exposure', label: '曝光量', value: funnelStats.funnel.exposure, color: '#4f46e5', width: '100%' },
              { key: 'viewed', label: '观看数', value: funnelStats.funnel.viewed || Math.floor(funnelStats.funnel.exposure * 0.6), color: '#06b6d4', width: '75%' },
              { key: 'applications', label: '投递数', value: funnelStats.funnel.applications, color: '#f59e0b', width: '50%' },
              { key: 'interviews', label: '面试数', value: funnelStats.funnel.interviews, color: '#8b5cf6', width: '30%' },
              { key: 'hires', label: '入职数', value: funnelStats.funnel.hires, color: '#10b981', width: '15%' }
            ].map((item, i, arr) => (
              <div key={item.key} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{ 
                  height: '80px', 
                  background: `linear-gradient(180deg, ${item.color}20, ${item.color}10)`,
                  borderRadius: '8px 8px 0 0',
                  margin: '0 auto',
                  width: item.width,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '8px',
                  borderBottom: `3px solid ${item.color}`
                }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: item.color }}>
                    {item.value}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '8px', fontWeight: '500' }}>
                  {item.label}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ 
                    position: 'absolute', 
                    right: '-12px', 
                    top: '35px',
                    fontSize: '18px',
                    color: '#d1d5db'
                  }}>
                    →
                  </div>
                )}
                {i < arr.length - 1 && (
                  <div style={{ 
                    position: 'absolute', 
                    right: '-20px', 
                    top: '10px',
                    fontSize: '11px',
                    color: '#9ca3af',
                    background: '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {arr[i + 1].value > 0 ? Math.round(arr[i + 1].value / item.value * 100) : 0}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-4" style={{ gap: '16px' }}>
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                总岗位数
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>
                {jobs.length}
              </div>
            </div>
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                待处理投递
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {funnelStats.funnel.pending || 0}
              </div>
            </div>
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                整体转化率
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {funnelStats.funnel.exposure > 0 ? Math.round(funnelStats.funnel.hires / funnelStats.funnel.exposure * 100) : 0}%
              </div>
            </div>
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                平均招聘周期
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                {funnelStats.funnel.avgDays || 7}天
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px'
        }}>
          <button 
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0, border: 'none', background: activeTab === 'jobs' ? 'transparent' : 'transparent', color: activeTab === 'jobs' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'jobs' ? '2px solid #4f46e5' : '2px solid transparent' }}
            onClick={() => setActiveTab('jobs')}
          >
            我的岗位
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
          {activeTab === 'jobs' && (
            jobs.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                暂无岗位，点击右上角发布第一个岗位
              </div>
            ) : (
              <div className="grid grid-2">
                {jobs.map(job => (
                  <div key={job.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{job.title}</h3>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {job.video_status === 'approved' && (
                            <span className="badge badge-primary" style={{ marginRight: '6px' }}>▶ 视频</span>
                          )}
                          {job.video_resume_enabled === 1 ? (
                            <span className="badge badge-success">📹 视频简历</span>
                          ) : (
                            <span className="badge badge-gray">📝 仅文字</span>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${job.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {job.is_active ? '招聘中' : '已关闭'}
                      </span>
                    </div>
                    <div style={{ color: '#4f46e5', fontWeight: '600', marginBottom: '8px' }}>
                      {job.salary_min}K - {job.salary_max}K
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                      👁️ 浏览 {job.views_count || 0} · 📍 {job.location || '不限'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                      {job.skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      paddingTop: '12px', 
                      borderTop: '1px solid #f3f4f6' 
                    }}>
                      <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">
                        查看
                      </Link>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleJobStatus(job.id, job.is_active)}
                      >
                        {job.is_active ? '关闭' : '开启'}
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleVideoResume(job.id, job.video_resume_enabled)}
                      >
                        {job.video_resume_enabled === 1 ? '关闭视频投递' : '开启视频投递'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'videos' && (
            videos.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                暂无视频，点击右上角上传第一个视频
              </div>
            ) : (
              <div className="grid grid-3">
                {videos.map(video => (
                  <div key={video.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ 
                      height: '120px', 
                      background: video.status === 'approved' ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 
                                  video.status === 'pending' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' :
                                  'linear-gradient(135deg, #fee2e2, #fecaca)', 
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      marginBottom: '12px',
                      position: 'relative'
                    }}>
                      🎬
                      {video.duration && (
                        <span style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          right: '8px', 
                          fontSize: '11px', 
                          background: 'rgba(0,0,0,0.7)', 
                          color: 'white', 
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{video.title}</div>
                    {video.description && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                        {video.description.slice(0, 30)}...
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      {new Date(video.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`badge ${
                        video.status === 'approved' ? 'badge-success' :
                        video.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {video.status === 'approved' ? '✓ 已通过' :
                         video.status === 'rejected' ? '✗ 已拒绝' : '⏳ 审核中'}
                      </span>
                      {video.reviewed_at && (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {new Date(video.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {video.reject_reason && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        background: '#fef2f2', 
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#dc2626'
                      }}>
                        审核意见：{video.reject_reason}
                      </div>
                    )}
                    {video.review_note && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        background: '#f0fdf4', 
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#166534'
                      }}>
                        审核备注：{video.review_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {showJobForm && (
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
        }} onClick={() => { setShowSkillSuggestions(false); }}>
          <div className="card" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>💼 发布岗位</h2>
              <button onClick={() => setShowJobForm(false)} style={{ background: 'none', fontSize: '24px' }}>×</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateJob}>
                <div className="form-group">
                  <label className="form-label">岗位名称 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="如：高级前端工程师"
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">关联视频</label>
                  <select 
                    className="form-input form-select"
                    value={selectedVideo || ''}
                    onChange={(e) => setSelectedVideo(e.target.value || null)}
                  >
                    <option value="">不关联视频</option>
                    {videos.filter(v => v.status === 'approved').map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                  {videos.filter(v => v.status === 'approved').length === 0 && (
                    <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                      暂无已审核通过的视频，请先上传视频并等待审核
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    薪资区间 (K/月)
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#4f46e5' 
                    }}>
                      {jobForm.salaryMin}K - {jobForm.salaryMax}K
                    </span>
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    alignItems: 'center',
                    padding: '12px 0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>最低</div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        step="5"
                        value={jobForm.salaryMin}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setJobForm(prev => ({ 
                            ...prev, 
                            salaryMin: val,
                            salaryMax: Math.max(val, prev.salaryMax)
                          }));
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>最高</div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        step="5"
                        value={jobForm.salaryMax}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setJobForm(prev => ({ 
                            ...prev, 
                            salaryMax: Math.max(val, prev.salaryMin)
                          }));
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">工作地点</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={jobForm.location}
                    onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="如：北京 · 朝阳区"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">技能标签</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px', 
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      minHeight: '42px',
                      alignItems: 'center'
                    }}>
                      {selectedSkills.map(skill => (
                        <span key={skill} style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          padding: '4px 10px',
                          background: '#eef2ff',
                          color: '#4f46e5',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {skill}
                          <span 
                            onClick={() => handleRemoveSkill(skill)}
                            style={{ cursor: 'pointer', fontWeight: '700' }}
                          >
                            ×
                          </span>
                        </span>
                      ))}
                      <input
                        type="text"
                        style={{ 
                          border: 'none', 
                          outline: 'none', 
                          flex: 1, 
                          minWidth: '100px',
                          fontSize: '14px'
                        }}
                        placeholder={selectedSkills.length === 0 ? '输入或选择技能标签...' : ''}
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          setShowSkillSuggestions(true);
                        }}
                        onFocus={() => setShowSkillSuggestions(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && skillInput.trim()) {
                            e.preventDefault();
                            handleAddSkill(skillInput.trim());
                          }
                        }}
                      />
                    </div>
                    {showSkillSuggestions && SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !selectedSkills.includes(s)).length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !selectedSkills.includes(s)).map(skill => (
                          <div
                            key={skill}
                            onClick={() => handleAddSkill(skill)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.background = 'white'}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                    推荐技能：{SKILL_SUGGESTIONS.slice(0, 8).join('、')}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">岗位描述</label>
                  <textarea 
                    className="form-input form-textarea"
                    value={jobForm.description}
                    onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="岗位职责、任职要求等..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer',
                    fontWeight: '500',
                    padding: '12px 16px',
                    background: jobForm.videoResumeEnabled ? '#ecfdf5' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${jobForm.videoResumeEnabled ? '#10b981' : '#e5e7eb'}`
                  }}>
                    <input
                      type="checkbox"
                      checked={jobForm.videoResumeEnabled}
                      onChange={(e) => setJobForm(prev => ({ ...prev, videoResumeEnabled: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📹 开启视频简历投递
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>
                          推荐
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400', marginTop: '2px' }}>
                        开启后求职者可以投递视频简历，更直观了解候选人
                      </div>
                    </div>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  发布岗位
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVideoUpload && (
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
          <div className="card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>🎬 上传岗位视频</h2>
              <button onClick={() => setShowVideoUpload(false)} style={{ background: 'none', fontSize: '24px' }}>×</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleUploadVideo}>
                <div className="form-group">
                  <label className="form-label">视频类型</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {VIDEO_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setUploadForm(prev => ({ ...prev, videoType: opt.value }))}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: uploadForm.videoType === opt.value ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                          background: uploadForm.videoType === opt.value ? '#eef2ff' : '#f9fafb',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '2px' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">视频标题 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="如：腾讯办公环境一览"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">视频描述</label>
                  <textarea 
                    className="form-input form-textarea"
                    placeholder="简要描述视频内容..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">视频文件 *</label>
                  <input 
                    type="file" 
                    accept="video/*"
                    className="form-input"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files[0] }))}
                    required
                  />
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    支持 MP4、WebM 等常见视频格式
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={uploading}>
                  {uploading ? '上传中...' : '开始上传'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;
