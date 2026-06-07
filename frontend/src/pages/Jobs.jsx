
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../api.js';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    position_level: '',
    min_salary: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobAPI.list(filters);
      setJobs(res.data.jobs || []);
    } catch (e) {
      console.error('获取职位列表失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">🔍 职位列表</h1>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <input
            type="text"
            name="keyword"
            className="form-input"
            placeholder="搜索职位关键词..."
            value={filters.keyword}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            name="location"
            className="form-input"
            placeholder="工作城市..."
            value={filters.location}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group">
          <select
            name="position_level"
            className="form-select"
            value={filters.position_level}
            onChange={handleFilterChange}
          >
            <option value="">所有级别</option>
            <option value="junior">初级</option>
            <option value="middle">中级</option>
            <option value="senior">高级</option>
          </select>
        </div>
        <div className="form-group">
          <select
            name="min_salary"
            className="form-select"
            value={filters.min_salary}
            onChange={handleFilterChange}
          >
            <option value="">薪资不限</option>
            <option value="10000">10K以上</option>
            <option value="20000">20K以上</option>
            <option value="30000">30K以上</option>
            <option value="50000">50K以上</option>
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ keyword: '', location: '', position_level: '', min_salary: '' })}>
          重置
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">暂无符合条件的职位</div>
          </div>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id} className="job-card">
              <div className="job-title">{job.title}</div>
              <div className="job-salary">{job.salary_min}-{job.salary_max}K</div>
              <div className="job-company">
                {job.company_verified && <span className="tag verified">✓ 已认证</span>}
                {' '}{job.company_name}
              </div>
              <div className="job-tags">
                <span className="tag">{job.location}</span>
                <span className="tag">{job.position_level === 'senior' ? '高级' : job.position_level === 'middle' ? '中级' : '初级'}</span>
                {job.benefits?.slice(0, 3).map((b, i) => (
                  <span key={i} className="tag" style={{ background: '#f0f7ff', color: '#1890ff' }}>
                    {b.benefit_type}
                  </span>
                ))}
              </div>
              <div className="job-footer">
                <span style={{ fontSize: 12, color: '#999' }}>
                  发布于 {new Date(job.created_at).toLocaleDateString()}
                </span>
                <span style={{ fontSize: 12, color: '#667eea' }}>查看详情 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
