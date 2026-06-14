import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../utils/api.js';

function MyApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const res = await applicationsAPI.myApplications();
      setApplications(res.data);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: '待查看',
      reviewed: '已查看',
      interview: '面试中',
      rejected: '已拒绝',
      hired: '已录用'
    };
    return map[status] || status;
  };

  if (loading) return <div className="empty-state">加载中...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>📋 我的投递</h1>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div>📭</div>
          <p>您还没有投递任何职位</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/jobs')}>
            去找工作
          </button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>职位</th>
              <th>企业</th>
              <th>薪资</th>
              <th>工作地址</th>
              <th>到岗时效</th>
              <th>状态</th>
              <th>投递时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.title}</td>
                <td>{app.company_name}</td>
                <td style={{ color: '#ef4444', fontWeight: '500' }}>
                  ¥{app.salary_min}-{app.salary_max}
                </td>
                <td style={{ maxWidth: '200px' }}>{app.work_address}</td>
                <td>
                  <span className="tag arrival">{app.arrival_time}</span>
                </td>
                <td>
                  <span className={`status-badge ${app.status}`}>
                    {getStatusText(app.status)}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {app.created_at}
                </td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/jobs/${app.job_id}`)}
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyApplicationsPage;
