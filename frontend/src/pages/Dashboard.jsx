import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { Link } from 'react-router-dom';
import { Download, Play } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await apiService.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  const orderStatusColors = {
    created: '#6366f1',
    submitted: '#f59e0b',
    executing: '#ec4899',
    reviewed: '#10b981',
    rejected: '#ef4444',
    closed: '#6b7280'
  };

  const taskStatusColors = {
    pending: '#f59e0b',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444'
  };

  const totalOrders = stats?.ordersByStatus?.reduce((sum, s) => sum + s.count, 0) || 1;
  const totalTasks = stats?.tasksByStatus?.reduce((sum, s) => sum + s.count, 0) || 1;

  const getStatusLabel = (status) => {
    const labels = {
      created: '已创建',
      submitted: '已提交',
      executing: '执行中',
      reviewed: '已复核',
      rejected: '已退回',
      closed: '已关闭',
      pending: '待执行',
      running: '执行中',
      completed: '已完成',
      failed: '失败'
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">总览看板</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => apiService.exportData('applications')}>
            <Download size={16} /> 导出应用
          </button>
          <button className="btn btn-secondary" onClick={() => apiService.exportData('change-orders')}>
            <Download size={16} /> 导出变更单
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <h3>应用数量</h3>
          <div className="stat-value">{stats?.appCount || 0}</div>
        </div>
        <div className="stat-card green">
          <h3>环境数量</h3>
          <div className="stat-value">{stats?.envCount || 0}</div>
        </div>
        <div className="stat-card yellow">
          <h3>变更单总数</h3>
          <div className="stat-value">{stats?.orderCount || 0}</div>
        </div>
        <div className="stat-card red">
          <h3>执行任务</h3>
          <div className="stat-value">{stats?.taskCount || 0}</div>
        </div>
        <div className="stat-card purple">
          <h3>待处理告警</h3>
          <div className="stat-value">{stats?.alarmCount || 0}</div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-box">
          <h3>变更单状态分布</h3>
          <div className="status-bars">
            {stats?.ordersByStatus?.map(item => (
              <div key={item.status} className="status-bar">
                <span className="label">{getStatusLabel(item.status)}</span>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      width: `${(item.count / totalOrders) * 100}%`,
                      background: orderStatusColors[item.status] || '#6b7280'
                    }}
                  />
                </div>
                <span className="count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-box">
          <h3>任务状态分布</h3>
          <div className="status-bars">
            {stats?.tasksByStatus?.map(item => (
              <div key={item.status} className="status-bar">
                <span className="label">{getStatusLabel(item.status)}</span>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      width: `${(item.count / totalTasks) * 100}%`,
                      background: taskStatusColors[item.status] || '#6b7280'
                    }}
                  />
                </div>
                <span className="count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>最近活动</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>类型</th>
                <th>编号</th>
                <th>标题</th>
                <th>状态</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentActivities?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`badge ${item.type === 'change_order' ? 'badge-created' : 'badge-pending'}`}>
                      {item.type === 'change_order' ? '变更单' : '任务'}
                    </span>
                  </td>
                  <td>{item.no}</td>
                  <td>{item.title}</td>
                  <td>
                    <span className={`badge badge-${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>
                    {item.type === 'change_order' ? (
                      <Link to={`/change-orders`} className="link-text">查看</Link>
                    ) : (
                      <Link to={`/execution-tasks`} className="link-text">查看</Link>
                    )}
                  </td>
                </tr>
              ))}
              {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                <tr>
                  <td colSpan="6" className="empty-state">暂无活动记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>快速开始</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/applications" className="btn btn-primary">
            <Play size={16} /> 管理应用
          </Link>
          <Link to="/change-orders" className="btn btn-success">
            <Play size={16} /> 创建变更单
          </Link>
          <Link to="/execution-tasks" className="btn btn-warning">
            <Play size={16} /> 执行任务
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
