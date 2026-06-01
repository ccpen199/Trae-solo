import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, alertAPI, taskAPI } from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentTasks, setRecentTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.stats);
      setRecentTasks(res.data.recentTasks);
      setAlerts(res.data.recentAlerts);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = async (id) => {
    try {
      await alertAPI.close(id, '工作台处理完成');
      loadData();
    } catch (err) {
      console.error('关闭告警失败:', err);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>应用总数</h4>
          <div className="value">{stats.applications || 0}</div>
        </div>
        <div className="stat-card success">
          <h4>执行任务</h4>
          <div className="value">{stats.tasks || 0}</div>
        </div>
        <div className="stat-card warning">
          <h4>待处理任务</h4>
          <div className="value">{stats.pendingTasks || 0}</div>
        </div>
        <div className="stat-card danger">
          <h4>待处理告警</h4>
          <div className="value">{stats.alerts || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>最近执行任务</h3>
            <button className="btn btn-default btn-sm" onClick={() => navigate('/tasks')}>查看全部</button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无任务记录</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>任务标题</th>
                  <th>应用</th>
                  <th>状态</th>
                  <th>创建人</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(task => (
                  <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{task.title}</td>
                    <td>{task.app_name}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{task.creator_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>待处理告警</h3>
            <button className="btn btn-default btn-sm" onClick={() => navigate('/alerts')}>查看全部</button>
          </div>
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">暂无告警</div>
            </div>
          ) : (
            <div>
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.level}`}>
                  <div className="alert-header">
                    <span className="alert-title">{alert.title}</span>
                    <button className="btn btn-default btn-sm" onClick={() => handleCloseAlert(alert.id)}>关闭</button>
                  </div>
                  <div className="alert-content">{alert.message}</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    责任人: {alert.responsible_name || '未分配'} | 建议: {alert.suggested_action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>快速操作</h3>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/applications')}>📦 接入新应用</button>
          <button className="btn btn-success" onClick={() => navigate('/config')}>⚙️ 创建配置版本</button>
          <button className="btn btn-default" onClick={() => navigate('/tasks')}>📋 发起执行任务</button>
          <button className="btn btn-default" onClick={() => navigate('/change-orders')}>📝 提交变更单</button>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const badgeMap = {
    pending: { class: 'badge-warning', text: '待审批' },
    approved: { class: 'badge-info', text: '已通过' },
    running: { class: 'badge-info', text: '执行中' },
    completed: { class: 'badge-success', text: '已完成' },
    rejected: { class: 'badge-error', text: '已拒绝' },
    cancelled: { class: 'badge-default', text: '已取消' },
    rollback: { class: 'badge-error', text: '已回滚' }
  };
  const badge = badgeMap[status] || { class: 'badge-default', text: status };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default Dashboard;
