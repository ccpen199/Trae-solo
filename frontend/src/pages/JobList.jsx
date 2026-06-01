import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI, recAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function JobList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    salary_min: '',
    salary_max: '',
    work_type: '',
    available_date: '',
    distance: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    if (showRecommendations && user?.role === 'jobseeker') {
      loadRecommendations();
    } else {
      loadJobs();
    }
  }, [filters, showRecommendations]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const res = await jobAPI.listJobs(params);
      setJobs(res.data.jobs);
      setRecommendedJobs([]);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await recAPI.getRecommendedJobs();
      setJobs(res.data.jobs || []);
      setRecommendedJobs(res.data.jobs || []);
      setTotal(res.data.jobs?.length || 0);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      loadJobs();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowRecommendations(false);
    setFilters({ ...filters, page: 1 });
  };

  const resetFilters = () => {
    setShowRecommendations(false);
    setFilters({
      keyword: '',
      city: '',
      salary_min: '',
      salary_max: '',
      work_type: '',
      available_date: '',
      distance: '',
      page: 1,
      limit: 20,
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💼 找工作</h1>
        {!loading && <div>共 {total} 个职位</div>}
      </div>

      <div className="grid-3" style={{ gap: 16, marginBottom: 24 }}>
        <div
          className="card card-hover"
          style={{ padding: 24, cursor: 'pointer', display: 'block', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '2px dashed rgba(59, 130, 246, 0.3)' }}
          onClick={() => {
            if (!user) {
              navigate('/login', { state: { from: '/my/resumes/new' } });
            } else if (user.role === 'jobseeker') {
              navigate('/my/resumes/new');
            } else {
              alert('请使用求职者账号登录');
            }
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>创建动态简历卡片</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            完善技能标签、期望薪资浮动区间、可到岗时间，让HR更快找到你！
          </p>
          <div style={{ marginTop: 12, color: 'var(--primary-color)', fontSize: 13, fontWeight: 500 }}>
            立即创建 →
          </div>
        </div>

        <div
          className={`card card-hover ${showRecommendations ? 'card-active' : ''}`}
          style={{ padding: 24, cursor: 'pointer', background: showRecommendations ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)' : 'transparent', border: showRecommendations ? '2px solid var(--success-color)' : '2px solid transparent' }}
          onClick={() => {
            if (!user) {
              navigate('/login', { state: { from: '/jobs' } });
            } else if (user.role === 'jobseeker') {
              setShowRecommendations(!showRecommendations);
            } else {
              alert('智能推荐功能仅限求职者使用');
            }
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>智能匹配推荐</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            基于3km地理围栏 + 浏览行为语义聚类，为你精准推荐
          </p>
          <div style={{ marginTop: 12, color: 'var(--success-color)', fontSize: 13, fontWeight: 500 }}>
            {showRecommendations ? '✓ 已开启智能匹配' : '点击开启 →'}
          </div>
        </div>

        <div
          className="card card-hover"
          style={{ padding: 24, cursor: 'pointer', display: 'block', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)', border: '2px dashed rgba(239, 68, 68, 0.3)' }}
          onClick={() => navigate('/live')}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📺</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>直播招聘间</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            看直播投简历，弹幕互动提问，在线投递更高效
          </p>
          <div style={{ marginTop: 12, color: 'var(--danger-color)', fontSize: 13, fontWeight: 500 }}>
            进入直播间 →
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <form onSubmit={handleSearch}>
          <div className="grid-4" style={{ gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              className="form-input"
              placeholder="搜索职位、公司..."
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
            <select
              className="form-select"
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
            >
              <option value="">距离不限</option>
              <option value="3">3km以内优先</option>
              <option value="5">5km以内</option>
              <option value="10">10km以内</option>
            </select>
            <select
              className="form-select"
              value={filters.salary_min}
              onChange={(e) => setFilters({ ...filters, salary_min: e.target.value })}
            >
              <option value="">薪资不限</option>
              <option value="15">15K以上</option>
              <option value="25">25K以上</option>
              <option value="35">35K以上</option>
              <option value="50">50K以上</option>
            </select>
          </div>
          <div className="grid-4" style={{ gap: 12 }}>
            <select
              className="form-select"
              value={filters.salary_max}
              onChange={(e) => setFilters({ ...filters, salary_max: e.target.value })}
            >
              <option value="">薪资上限</option>
              <option value="20">20K以内</option>
              <option value="30">30K以内</option>
              <option value="40">40K以内</option>
              <option value="60">60K以内</option>
            </select>
            <select
              className="form-select"
              value={filters.work_type}
              onChange={(e) => setFilters({ ...filters, work_type: e.target.value })}
            >
              <option value="">工作类型</option>
              <option value="全职">全职</option>
              <option value="兼职">兼职</option>
              <option value="实习">实习</option>
              <option value="远程">远程</option>
            </select>
            <select
              className="form-select"
              value={filters.available_date}
              onChange={(e) => setFilters({ ...filters, available_date: e.target.value })}
            >
              <option value="">到岗时间</option>
              <option value="immediately">随时到岗</option>
              <option value="week">1周内</option>
              <option value="month">1个月内</option>
              <option value="later">1个月以上</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>搜索</button>
              <button type="button" className="btn btn-secondary" onClick={resetFilters}>重置</button>
            </div>
          </div>
        </form>
      </div>

      {showRecommendations && recommendedJobs.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>双路召回智能推荐</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                LBS 3km地理围栏优先 · 近期浏览语义聚类匹配
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>暂无符合条件的职位</p>
          {user?.role === 'jobseeker' && (
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/my/resumes/new" className="btn btn-primary">创建简历</Link>
              <button className="btn btn-secondary" onClick={resetFilters}>重置筛选</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="card card-hover" style={{ padding: 20, display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 0 }}>{job.title}</h3>
                    {job.match_score && (
                      <span className="tag tag-sm tag-success">匹配度 {job.match_score}%</span>
                    )}
                    {showRecommendations && (
                      <span className="tag tag-sm tag-primary">
                        {job.distance_km ? `📍 ${job.distance_km}km` : '🎯 语义匹配'}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{job.company_name}</p>
                </div>
                <div style={{ color: 'var(--secondary-color)', fontWeight: 600, fontSize: 16, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {job.salary_min}K-{job.salary_max}K
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="tag tag-primary">{job.industry}</span>
                <span className="tag">{job.work_type}</span>
                <span className="tag">{job.experience_required}</span>
                {(job.video_url || job.team_vlog_url) && (
                  <span className="tag tag-sm tag-info">🎬 视频介绍</span>
                )}
                {job.office_images && job.office_images.length > 0 && (
                  <span className="tag tag-sm tag-info">🖼️ 环境实拍</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>📍 {job.city}</span>
                <span>👁️ {job.view_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobList;
