import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../utils/api.js';

function HomePage() {
  const navigate = useNavigate();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchIndustry, setSearchIndustry] = useState('');
  const [searchArrival, setSearchArrival] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await jobsAPI.list({ pageSize: 6 });
      setFeaturedJobs(res.data.jobs);
    } catch (err) {
      console.error('加载职位失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (searchIndustry) params.append('industry', searchIndustry);
    if (searchArrival) params.append('arrival_time', searchArrival);
    navigate(`/jobs?${params.toString()}`);
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div>
      <div className="hero">
        <h1>🏙️ 都市服务业青年专属求职平台</h1>
        <p>聚焦餐饮、零售、物流等高频流动行业，真实地址、快速到岗、信用保障</p>
      </div>

      <div className="search-box">
        <form onSubmit={handleSearch}>
          <div className="search-row">
            <div className="input-group" style={{ flex: 2 }}>
              <label>🔍 搜索职位</label>
              <input
                type="text"
                placeholder="搜索奶茶店、快递员、服务员..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>🏢 行业</label>
              <select value={searchIndustry} onChange={(e) => setSearchIndustry(e.target.value)}>
                <option value="">全部行业</option>
                <option value="餐饮">餐饮</option>
                <option value="零售">零售</option>
                <option value="物流">物流</option>
              </select>
            </div>
            <div className="input-group">
              <label>⏰ 到岗时效</label>
              <select value={searchArrival} onChange={(e) => setSearchArrival(e.target.value)}>
                <option value="">不限</option>
                <option value="当日">当日到岗</option>
                <option value="3日内">3日内</option>
                <option value="一周内">一周内</option>
              </select>
            </div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                搜索
              </button>
            </div>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>🔥 热门职位</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/jobs')}>
          查看全部 →
        </button>
      </div>

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : (
        <div className="job-list">
          {featuredJobs.map(job => (
            <div
              key={job.id}
              className="job-card"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div className="job-card-header">
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-company">🏢 {job.company_name}</div>
                </div>
                <div className="salary">¥{job.salary_min}-{job.salary_max}/月</div>
              </div>
              <div className="job-tags">
                <span className="tag industry">{job.industry}</span>
                <span className="tag arrival">⏰ {job.arrival_time}</span>
                {job.is_suspicious ? (
                  <span className="tag warning">⚠️ 风险预警</span>
                ) : null}
                <span className="tag credit">⭐ {job.credit_score?.toFixed(1) || '5.0'}</span>
              </div>
              <div className="job-footer">
                <div className="credit-info">
                  <span>📌 {job.work_address.substring(0, 20)}...</span>
                  <span>👥 离职率 <strong>{(job.turnover_rate * 100).toFixed(1)}%</strong></span>
                  <span>🛡️ 社保率 <strong>{(job.social_insurance_rate * 100).toFixed(1)}%</strong></span>
                </div>
                <span className="rating-stars" style={{ color: '#fbbf24' }}>
                  {renderStars(job.credit_score || 5)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '3rem' }}>
        <div className="credit-card" onClick={() => navigate('/companies')} style={{ cursor: 'pointer' }}>
          <h4>🛡️ 信用体系</h4>
          <p style={{ color: '#78350f', fontSize: '0.9rem' }}>
            企业展示员工离职率、社保缴纳率数据，对接社保局权威接口，让求职更放心
          </p>
          <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
            <span className="btn btn-primary btn-sm">查看企业信用 →</span>
          </div>
        </div>
        <div className="credit-card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', cursor: 'pointer' }} onClick={() => navigate('/voice-search')}>
          <h4 style={{ color: '#1e40af' }}>🎤 语音搜索</h4>
          <p style={{ color: '#1e40af', fontSize: '0.9rem' }}>
            支持语音搜索"附近奶茶店招人"，AI智能解析意图，快速匹配心仪工作
          </p>
          <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
            <span className="btn btn-primary btn-sm" style={{ background: '#1e40af' }}>立即体验 →</span>
          </div>
        </div>
        <div className="credit-card" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', cursor: 'pointer' }} onClick={() => navigate('/jobs')}>
          <h4 style={{ color: '#15803d' }}>🧭 AR实景导航</h4>
          <p style={{ color: '#15803d', fontSize: '0.9rem' }}>
            AR实景导航至面试地点，再也不用担心找不到路，准时面试更有底气
          </p>
          <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
            <span className="btn btn-primary btn-sm" style={{ background: '#15803d' }}>找职位试试 →</span>
          </div>
        </div>
        <div className="credit-card" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', cursor: 'pointer' }} onClick={() => navigate('/admin')}>
          <h4 style={{ color: '#9d174d' }}>🤖 AI风控 & 录音存档</h4>
          <p style={{ color: '#9d174d', fontSize: '0.9rem' }}>
            舆情监控抓取负面关键词，高薪低门槛虚假职位自动预警；面试电话录音存档，关键承诺自动提取
          </p>
          <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
            <span className="btn btn-primary btn-sm" style={{ background: '#9d174d' }}>管理后台 →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
