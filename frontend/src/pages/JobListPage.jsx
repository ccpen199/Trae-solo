import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../utils/api.js';

function JobListPage({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    industry: searchParams.get('industry') || '',
    arrival_time: searchParams.get('arrival_time') || '',
    min_salary: searchParams.get('min_salary') || '',
    max_salary: searchParams.get('max_salary') || ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [voiceParseResult, setVoiceParseResult] = useState(null);
  const [nearbyJobs, setNearbyJobs] = useState([]);

  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const industry = searchParams.get('industry') || '';
    const arrival_time = searchParams.get('arrival_time') || '';
    const min_salary = searchParams.get('min_salary') || '';
    const max_salary = searchParams.get('max_salary') || '';
    const voice_text = searchParams.get('voice_text') || '';
    const voice_keywords = searchParams.get('voice_keywords') || '';

    setFilters({ keyword, industry, arrival_time, min_salary, max_salary });
    setPage(1);

    if (voice_text) {
      setVoiceParseResult({
        text: voice_text,
        keywords: voice_keywords ? voice_keywords.split(',') : [],
        industry: industry,
        arrival_time: arrival_time,
        location: searchParams.get('voice_location') || ''
      });
    } else {
      setVoiceParseResult(null);
    }
  }, [searchParams]);

  useEffect(() => {
    loadJobs();
  }, [page, filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.list({
        ...filters,
        page,
        pageSize: 10
      });
      setJobs(res.data.jobs);
      setTotal(res.data.total);

      if (res.data.jobs.length > 0) {
        const allJobsRes = await jobsAPI.list({ pageSize: 20 });
        const allJobs = allJobsRes.data.jobs;
        
        const nearby = allJobs
          .filter(j => j.id !== res.data.jobs[0]?.id)
          .filter(j => {
            if (voiceParseResult?.location?.includes('附近') || filters.keyword) {
              if (filters.industry && j.industry === filters.industry) return true;
              if (voiceParseResult?.industry && j.industry === voiceParseResult.industry) return true;
              return true;
            }
            return false;
          })
          .slice(0, 3);
        
        setNearbyJobs(nearby.length > 0 ? nearby : allJobs.slice(0, 3));
      }
    } catch (err) {
      console.error('加载职位失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleQuickApply = async (e, jobId) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'seeker') {
      setError('只有求职者可以投递简历');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      await applicationsAPI.create({ job_id: jobId });
      setSuccess('✅ 投递成功！企业会尽快与您联系');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '投递失败，请勿重复投递');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleARNavigate = (e, jobId) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/ar-navigate/${jobId}`);
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>🔍 找工作</h1>
      <div style={{ marginTop: '-1rem', marginBottom: '1.5rem', color: '#6b7280' }}>
        搜索结果与筛选查询结果
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="search-box">
        <form onSubmit={handleSearch}>
          <div className="search-row">
            <div className="input-group" style={{ flex: 2 }}>
              <label>关键词</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="搜索职位、企业..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/voice-search')}
                  title="语音搜索"
                >
                  🎤 语音
                </button>
              </div>
            </div>
            <div className="input-group">
              <label>行业</label>
              <select
                value={filters.industry}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              >
                <option value="">全部</option>
                <option value="餐饮">餐饮</option>
                <option value="零售">零售</option>
                <option value="物流">物流</option>
              </select>
            </div>
            <div className="input-group">
              <label>到岗时效</label>
              <select
                value={filters.arrival_time}
                onChange={(e) => setFilters({ ...filters, arrival_time: e.target.value })}
              >
                <option value="">不限</option>
                <option value="当日">当日</option>
                <option value="3日内">3日内</option>
                <option value="一周内">一周内</option>
              </select>
            </div>
            <div className="input-group">
              <label>最低薪资</label>
              <input
                type="number"
                placeholder="元/月"
                value={filters.min_salary}
                onChange={(e) => setFilters({ ...filters, min_salary: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                搜索
              </button>
            </div>
          </div>
        </form>
      </div>

      {voiceParseResult && (
        <div className="sidebar-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <h4 style={{ color: '#1e40af', margin: 0, marginBottom: '0.5rem' }}>🎤 语音意图解析结果</h4>
              <p style={{ color: '#1e3a8a', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
                "{voiceParseResult.text}"
              </p>
            </div>
            <span className="tag credit" style={{ background: '#1e40af', color: '#fff' }}>AI 解析</span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {voiceParseResult.keywords.map((k, idx) => (
              <span key={idx} className="tag industry" style={{ background: '#3b82f6', color: '#fff' }}>
                关键词：{k}
              </span>
            ))}
            {voiceParseResult.industry && (
              <span className="tag arrival" style={{ background: '#10b981', color: '#fff' }}>
                行业：{voiceParseResult.industry}
              </span>
            )}
            {voiceParseResult.arrival_time && (
              <span className="tag credit" style={{ background: '#f59e0b', color: '#fff' }}>
                到岗：{voiceParseResult.arrival_time}
              </span>
            )}
            {voiceParseResult.location && (
              <span className="tag warning" style={{ background: '#ef4444', color: '#fff' }}>
                位置：{voiceParseResult.location}
              </span>
            )}
          </div>
          
          <p style={{ fontSize: '0.85rem', color: '#1e40af', margin: 0 }}>
            ✅ 已为您智能匹配 {total} 个相关职位
          </p>
        </div>
      )}

      <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
        搜索结果：共找到 <strong style={{ color: '#667eea' }}>{total}</strong> 个职位
      </div>

      {nearbyJobs.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: '#374151' }}>📍 附近热门推荐</h3>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            {nearbyJobs.slice(0, 3).map(job => (
              <div
                key={`nearby-${job.id}`}
                className="sidebar-card"
                style={{ 
                  padding: '0.8rem 1rem', 
                  margin: 0, 
                  flex: 1, 
                  minWidth: '200px',
                  cursor: 'pointer',
                  background: '#f0fdf4',
                  border: '1px solid #86efac'
                }}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <p style={{ margin: 0, fontWeight: '500', color: '#166534' }}>{job.title}</p>
                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#15803d' }}>🏢 {job.company_name}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#059669', fontWeight: '500' }}>¥{job.salary_min}-{job.salary_max}/月</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div>📭</div>
          <p>暂无符合条件的职位</p>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map(job => (
            <div
              key={job.id}
              className="job-card"
            >
              <div className="job-card-header" onClick={() => navigate(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-company">🏢 {job.company_name}</div>
                </div>
                <div className="salary">¥{job.salary_min}-{job.salary_max}/月</div>
              </div>
              <div className="job-tags" onClick={() => navigate(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                <span className="tag industry">{job.industry}</span>
                <span className="tag arrival">⏰ 到岗：{job.arrival_time}</span>
                {job.is_suspicious ? (
                  <span className="tag warning">⚠️ 风险预警</span>
                ) : null}
                <span className="tag credit">⭐ 信用{job.credit_score?.toFixed(1) || '5.0'}</span>
              </div>
              <div className="sidebar-card" onClick={() => navigate(`/jobs/${job.id}`)} style={{ cursor: 'pointer', marginTop: '0.8rem', background: '#f0fdf4', border: '1px solid #86efac' }}>
                <p style={{ margin: '0.3rem 0', color: '#166534', fontSize: '0.9rem' }}>
                  <strong>📍 工作地址：</strong>{job.work_address}
                </p>
              </div>
              <div className="job-footer" onClick={() => navigate(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                <div className="credit-info">
                  <span>👥 离职率 <strong style={{ color: job.turnover_rate > 0.3 ? '#dc2626' : '#15803d' }}>
                    {(job.turnover_rate * 100).toFixed(1)}%
                  </strong></span>
                  <span>🛡️ 社保率 <strong style={{ color: job.social_insurance_rate < 0.8 ? '#dc2626' : '#15803d' }}>
                    {(job.social_insurance_rate * 100).toFixed(1)}%
                  </strong></span>
                </div>
                <span className="rating-stars" style={{ color: '#fbbf24', fontSize: '1.1rem' }}>
                  {renderStars(job.credit_score || 5)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e5e7eb' }}>
                {user?.role === 'seeker' && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={(e) => handleQuickApply(e, job.id)}
                    >
                      📝 快速投递
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1 }}
                      onClick={(e) => handleARNavigate(e, job.id)}
                    >
                      🧭 AR导航
                    </button>
                  </>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: user?.role === 'seeker' ? 1 : '100%' }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  查看详情 →
                </button>
              </div>
              {user?.role === 'seeker' && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
                  💡 投递后企业可发送面试邀约，平台自动录音存档并提取关键承诺点
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > 10 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <span style={{ padding: '0.5rem 1rem' }}>
            第 {page} 页 / 共 {Math.ceil(total / 10)} 页
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
            disabled={page >= Math.ceil(total / 10)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default JobListPage;
