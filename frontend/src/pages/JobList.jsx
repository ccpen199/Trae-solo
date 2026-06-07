import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const VIDEO_TYPE_LABELS = {
  environment: { label: '环境实拍', icon: '🏢', color: '#059669' },
  work_live: { label: '工作实况', icon: '💼', color: '#2563eb' },
  team_interview: { label: '团队访谈', icon: '👥', color: '#7c3aed' },
  intro: { label: '企业介绍', icon: '📋', color: '#d97706' },
  other: { label: '其他', icon: '🎬', color: '#6b7280' }
};

function JobList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    minSalary: '',
    maxSalary: '',
    location: '',
    hasVideo: false,
    videoResume: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0
  });

  useEffect(() => {
    fetchJobs();
    if (user?.role === 'jobseeker') fetchMyApplications();
  }, [pagination.page, filters.hasVideo, filters.videoResume, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const autoApplyJobId = params.get('autoApply');
    if (autoApplyJobId && user?.role === 'jobseeker') {
      handleQuickApply({ preventDefault: () => {}, stopPropagation: () => {} }, autoApplyJobId);
      navigate('/jobs', { replace: true });
    }
  }, [location.search, user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        keyword: filters.keyword,
        minSalary: filters.minSalary,
        maxSalary: filters.maxSalary,
        location: filters.location
      };
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) delete params[key];
      });

      const { data } = await axios.get('/api/jobs', { params });
      let filteredJobs = data.jobs;
      
      if (filters.hasVideo) {
        filteredJobs = filteredJobs.filter(j => j.video_status === 'approved');
      }
      if (filters.videoResume) {
        filteredJobs = filteredJobs.filter(j => j.video_resume_enabled === 1);
      }
      
      setJobs(filteredJobs);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const { data } = await axios.get('/api/applications/my');
      const appMap = {};
      data.applications.forEach(app => {
        appMap[app.job_id] = app;
      });
      setAppliedJobs(appMap);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchJobs();
  };

  const handleQuickApply = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate(`/login?redirect=/jobs&autoApply=${jobId}`);
      return;
    }
    if (user.role !== 'jobseeker') {
      return;
    }

    setApplyingJobId(jobId);
    try {
      await axios.post(`/api/applications/${jobId}/apply`, {});
      await fetchMyApplications();
    } catch (err) {
      alert(err.response?.data?.error || '投递失败');
    } finally {
      setApplyingJobId(null);
    }
  };

  const getCreditColor = (score) => {
    if (score >= 90) return '#16a34a';
    if (score >= 80) return '#4f46e5';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  const getMatchColor = (score) => {
    if (score >= 85) return '#16a34a';
    if (score >= 70) return '#4f46e5';
    if (score >= 60) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: '待查看',
      viewed: '已查看',
      interview: '面试中',
      offer: '已录用',
      hired: '已入职',
      rejected: '已拒绝'
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      pending: '#f59e0b',
      viewed: '#4f46e5',
      interview: '#8b5cf6',
      offer: '#06b6d4',
      hired: '#16a34a',
      rejected: '#dc2626'
    };
    return map[status] || '#6b7280';
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="page-header">
        <h1 className="page-title">全部岗位</h1>
        <p className="page-subtitle">发现适合你的视频招聘岗位</p>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="card-body">
          <form onSubmit={handleSearch} style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: '16px',
            alignItems: 'end',
            marginBottom: '16px'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">关键词</label>
              <input
                type="text"
                className="form-input"
                placeholder="搜索岗位、公司..."
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">最低薪资</label>
              <input
                type="number"
                className="form-input"
                placeholder="K"
                value={filters.minSalary}
                onChange={(e) => setFilters(prev => ({ ...prev, minSalary: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">最高薪资</label>
              <input
                type="number"
                className="form-input"
                placeholder="K"
                value={filters.maxSalary}
                onChange={(e) => setFilters(prev => ({ ...prev, maxSalary: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">地点</label>
              <input
                type="text"
                className="form-input"
                placeholder="城市"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              搜索
            </button>
          </form>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={filters.hasVideo}
                onChange={(e) => setFilters(prev => ({ ...prev, hasVideo: e.target.checked }))}
              />
              <span>🎬 仅显示带视频的岗位</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={filters.videoResume}
                onChange={(e) => setFilters(prev => ({ ...prev, videoResume: e.target.checked }))}
              />
              <span>📹 支持视频简历投递</span>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: '60px 0' }}>
          加载中...
        </div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ marginBottom: '8px' }}>暂无匹配的岗位</h3>
          <p className="text-muted">试试调整筛选条件</p>
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: '16px', 
            fontSize: '14px', 
            color: '#6b7280',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              共 <strong style={{ color: '#374151' }}>{jobs.length}</strong> 个匹配岗位
              {filters.keyword && ` · 关键词: "${filters.keyword}"`}
              {filters.minSalary && ` · 最低${filters.minSalary}K`}
              {filters.maxSalary && ` · 最高${filters.maxSalary}K`}
              {filters.location && ` · ${filters.location}`}
            </span>
          </div>

          <div className="grid grid-3">
            {jobs.map(job => {
              const myApp = appliedJobs[job.id];
              const isApplying = applyingJobId === job.id;
              const isApplied = !!myApp;
              
              return (
                <div key={job.id} className="card" style={{ 
                  padding: '0',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}>
                  {job.video_status === 'approved' && (
                    <div style={{ 
                      position: 'relative',
                      height: '180px',
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }} onClick={() => setPlayingVideoId(playingVideoId === job.id ? null : job.id)}>
                      {playingVideoId === job.id ? (
                        <video 
                          controls 
                          autoPlay
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          src={`/api/videos/stream/${job.video_id}`}
                          onEnded={() => setPlayingVideoId(null)}
                        />
                      ) : (
                        <>
                          <div style={{ 
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexDirection: 'column',
                            gap: '8px',
                            background: 'rgba(0,0,0,0.3)'
                          }}>
                            <div style={{ 
                              width: '64px', 
                              height: '64px', 
                              borderRadius: '50%', 
                              background: 'rgba(255,255,255,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '28px',
                              backdropFilter: 'blur(8px)',
                              border: '2px solid rgba(255,255,255,0.5)'
                            }}>
                              ▶
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>
                              {job.video_title || '点击播放岗位视频'}
                            </span>
                          </div>
                          <div style={{ 
                            position: 'absolute', 
                            top: '10px', 
                            left: '10px',
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ 
                              background: 'rgba(79, 70, 229, 0.95)',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backdropFilter: 'blur(4px)'
                            }}>
                              ▶ 视频招聘
                            </span>
                            {job.video_type && VIDEO_TYPE_LABELS[job.video_type] && (
                              <span style={{ 
                                background: `${VIDEO_TYPE_LABELS[job.video_type].color}E6`,
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backdropFilter: 'blur(4px)'
                              }}>
                                {VIDEO_TYPE_LABELS[job.video_type].icon} {VIDEO_TYPE_LABELS[job.video_type].label}
                              </span>
                            )}
                          </div>
                          {job.video_resume_enabled === 1 && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '10px', 
                              right: '10px',
                              background: 'rgba(16, 185, 129, 0.95)',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backdropFilter: 'blur(4px)'
                            }}>
                              📹 视频简历
                            </div>
                          )}
                          <div style={{ 
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            right: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.8)'
                          }}>
                            <span>🎬 视频浏览</span>
                            <span>点击播放完整视频</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', 
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                        color: 'white'
                      }}>
                        🏢
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {job.title}
                            {job.video_status !== 'approved' && (
                              <span className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                ▶ 视频
                              </span>
                            )}
                          </div>
                        </Link>
                        <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{job.company_name}</span>
                          <span style={{ 
                            color: getCreditColor(job.company_credit || 80),
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>
                            ⭐ {job.company_credit || 80}分
                          </span>
                          {job.company_verified === 1 && (
                            <span style={{ color: '#16a34a', fontSize: '11px' }}>✓认证</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: '#4f46e5',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px'
                    }}>
                      {job.salary_min}K - {job.salary_max}K
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>
                        · {job.experience_required || '经验不限'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {job.skills?.slice(0, 4).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                      {job.skills?.length > 4 && (
                        <span className="skill-tag">+{job.skills.length - 4}</span>
                      )}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#6b7280',
                      paddingTop: '12px',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <span>📍 {job.location || '不限'} · 👁️ {job.views_count || 0}</span>
                    </div>

                    {isApplied && myApp ? (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px 12px',
                        background: '#f0fdf4',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', color: getStatusColor(myApp.status), fontWeight: '600' }}>
                            {getStatusLabel(myApp.status)}
                          </div>
                          {myApp.match_score && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              AI匹配度: <span style={{ color: getMatchColor(myApp.match_score), fontWeight: '600' }}>{myApp.match_score}%</span>
                            </div>
                          )}
                        </div>
                        <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">
                          查看详情
                        </Link>
                      </div>
                    ) : user?.role === 'jobseeker' ? (
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          className="btn btn-primary w-full btn-sm"
                          onClick={(e) => handleQuickApply(e, job.id)}
                          disabled={isApplying}
                        >
                          {isApplying ? '投递中...' : '立即投递'}
                        </button>
                      </div>
                    ) : !user ? (
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          className="btn btn-outline w-full btn-sm"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/login'); }}
                        >
                          登录后投递
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.total > pagination.limit && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px',
              marginTop: '40px'
            }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                上一页
              </button>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                padding: '0 16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.limit)} 页
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default JobList;
