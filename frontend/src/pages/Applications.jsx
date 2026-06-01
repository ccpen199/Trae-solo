import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await jobAPI.getApplications();
      setApplications(res.data.applications);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await jobAPI.updateApplicationStatus(appId, status);
      loadApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const statusConfig = {
    pending: { label: '待处理', color: 'warning' },
    reviewed: { label: '已查看', color: 'info' },
    interview: { label: '面试中', color: 'primary' },
    offer: { label: '已发Offer', color: 'success' },
    rejected: { label: '已拒绝', color: 'danger' },
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📮 投递记录</h1>
        <div>{applications.length} 条记录</div>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📮</div>
          <p style={{ marginBottom: 16 }}>暂无投递记录</p>
          <Link to="/jobs" className="btn btn-primary">去浏览职位</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {applications.map(app => (
            <div key={app.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>{app.job_title}</h3>
                    <span className={`badge badge-${statusConfig[app.status]?.color}`}>
                      {statusConfig[app.status]?.label}
                    </span>
                  </div>
                  
                  {user?.role === 'jobseeker' ? (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      投递至：{app.company_name}
                    </p>
                  ) : (
                    <div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        求职者：{app.real_name}
                      </p>
                      {app.skills && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {app.skills.slice(0, 5).map((s, i) => (
                            <span key={i} className="tag tag-primary">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    简历：{app.resume_title}
                  </p>
                  {app.message && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      附言：{app.message}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'right', minWidth: 200 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {app.created_at?.replace('T', ' ').substring(0, 16)}
                  </p>
                  
                  {user?.role === 'hr' && app.status !== 'offer' && app.status !== 'rejected' && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {app.status === 'pending' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(app.id, 'reviewed')}>
                          标记已读
                        </button>
                      )}
                      {app.status !== 'interview' && (
                        <button className="btn btn-sm btn-primary" onClick={() => updateStatus(app.id, 'interview')}>
                          邀请面试
                        </button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => updateStatus(app.id, 'rejected')}>
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;
