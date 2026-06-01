import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../utils/api';

function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await jobAPI.getMyJobs();
      setJobs(res.data.jobs);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (job) => {
    try {
      await jobAPI.updateJob(job.id, { is_active: job.is_active ? 0 : 1 });
      loadJobs();
    } catch (err) {
      console.error('Failed to update job:', err);
    }
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💼 职位管理</h1>
        <Link to="/my/jobs/new" className="btn btn-primary">
          + 发布职位
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <p style={{ marginBottom: 16 }}>您还没有发布任何职位</p>
          <Link to="/my/jobs/new" className="btn btn-primary">发布第一个职位</Link>
        </div>
      ) : (
        <div className="grid-2">
          {jobs.map(job => (
            <div key={job.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{job.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{job.company_name}</p>
                  <span className={`badge ${job.is_active ? 'badge-success' : 'badge-warning'}`}>
                    {job.is_active ? '招聘中' : '已下架'}
                  </span>
                </div>
                <div style={{ color: 'var(--secondary-color)', fontWeight: 600, fontSize: 18 }}>
                  {job.salary_min}K-{job.salary_max}K
                </div>
              </div>

              {job.requirements && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {job.requirements.slice(0, 3).map((req, i) => (
                    <span key={i} className="tag">{req.substring(0, 12)}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                <span>📍 {job.city}</span>
                <span>👁️ {job.view_count} 浏览</span>
                <span>📮 {job.application_count || 0} 投递</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/my/jobs/${job.id}/edit`} className="btn btn-sm btn-secondary">
                  编辑
                </Link>
                <button
                  className={`btn btn-sm ${job.is_active ? 'btn-outline' : 'btn-success'}`}
                  onClick={() => toggleActive(job)}
                >
                  {job.is_active ? '下架' : '上架'}
                </button>
                <Link to={`/jobs/${job.id}`} className="btn btn-sm btn-outline" target="_blank">
                  预览
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyJobs;
