import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../utils/api.js';

function CompanyApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const res = await applicationsAPI.companyApplications();
      setApplications(res.data);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await applicationsAPI.updateStatus(id, status);
      loadApplications();
    } catch (err) {
      alert('操作失败');
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

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) return <div className="empty-state">加载中...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>📥 收到的简历</h1>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div>📭</div>
          <p>暂无求职者投递您的职位</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/post-job')}>
            发布新职位
          </button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>职位</th>
              <th>求职者</th>
              <th>手机号</th>
              <th>技能</th>
              <th>工作经验</th>
              <th>信用评分</th>
              <th>状态</th>
              <th>投递时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.title}</td>
                <td>
                  <strong>{app.seeker_name}</strong>
                </td>
                <td>{app.phone}</td>
                <td style={{ maxWidth: '150px', fontSize: '0.85rem' }}>
                  {app.skills || '未填写'}
                </td>
                <td style={{ maxWidth: '150px', fontSize: '0.85rem' }}>
                  {app.experience || '未填写'}
                </td>
                <td>
                  <span style={{ color: '#fbbf24' }}>{renderStars(app.seeker_rating)}</span>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {app.seeker_rating?.toFixed(1) || '5.0'} 分
                  </div>
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
                  {app.status === 'pending' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '0.3rem' }}
                      onClick={() => updateStatus(app.id, 'reviewed')}
                    >
                      标记已读
                    </button>
                  )}
                  {app.status !== 'interview' && app.status !== 'hired' && app.status !== 'rejected' && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ marginRight: '0.3rem' }}
                      onClick={() => updateStatus(app.id, 'interview')}
                    >
                      安排面试
                    </button>
                  )}
                  {app.status !== 'rejected' && app.status !== 'hired' && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginRight: '0.3rem' }}
                      onClick={() => updateStatus(app.id, 'rejected')}
                    >
                      拒绝
                    </button>
                  )}
                  {app.status === 'interview' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => updateStatus(app.id, 'hired')}
                    >
                      已录用
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompanyApplicationsPage;
