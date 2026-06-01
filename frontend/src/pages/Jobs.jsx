import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { jobAPI } from '../api/client';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    employer_type: '',
    salary_type: '',
    keyword: '',
    page: 1,
    page_size: 20
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (user) params.region_code = user.region_code;
      const res = await jobAPI.getJobs(params);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
    } catch (err) {
      console.error('加载招聘信息失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const totalPages = Math.ceil(total / filters.page_size);

  return (
    <div>
      <div className="page-header">
        <h1>招聘信息</h1>
        <div className="region-info">
          {user && <span>当前区域：{user.region_code}</span>}
        </div>
      </div>

      <div className="filter-bar">
        <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
          <option value="">全部类型</option>
          <option value="fulltime">全职</option>
          <option value="parttime">兼职</option>
          <option value="domestic">家政服务</option>
          <option value="repair">维修服务</option>
        </select>
        <select value={filters.employer_type} onChange={(e) => handleFilterChange('employer_type', e.target.value)}>
          <option value="">全部雇主</option>
          <option value="enterprise">企业直招</option>
          <option value="individual">个体用工</option>
        </select>
        <select value={filters.salary_type} onChange={(e) => handleFilterChange('salary_type', e.target.value)}>
          <option value="">全部计薪方式</option>
          <option value="monthly">月薪</option>
          <option value="hourly">小时工</option>
        </select>
        <input
          type="text"
          placeholder="搜索关键词"
          value={filters.keyword}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
        />
      </div>

      {loading && <div className="loading">加载中...</div>}

      <div className="card-grid">
        {jobs.map((job) => (
          <div key={job.id} className="card" onClick={() => navigate(`/jobs/${job.id}`)}>
            <div className="card-title">{job.title}</div>
            <div className="card-meta">
              {job.employer_name} | {job.region_name}
            </div>
            <div className="card-price">
              {job.salary_type === 'monthly'
                ? `${job.salary_min}-${job.salary_max}元/月`
                : `${job.hourly_rate}元/小时`}
            </div>
            <div className="card-badges">
              {job.verified === 1 && <span className="badge badge-verified">已核验</span>}
              {job.employer_type === 'enterprise' && <span className="badge badge-pgc">企业直招</span>}
              {job.employer_type === 'individual' && <span className="badge badge-ugc">个体用工</span>}
              {job.salary_type === 'hourly' && <span className="badge badge-ugc">小时工</span>}
            </div>
          </div>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={filters.page === i + 1 ? 'active' : ''}
              onClick={() => handleFilterChange('page', i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Jobs;
