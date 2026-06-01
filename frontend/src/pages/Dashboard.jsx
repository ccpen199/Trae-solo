import React, { useState, useEffect } from 'react';
import { taskAPI } from '../api.js';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await taskAPI.dashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      created: '已创建',
      submitted: '已提交',
      executing: '执行中',
      success: '成功',
      failed: '失败',
      rollbacked: '已回滚',
      reviewing: '审核中',
      rejected: '已退回',
      closed: '已关闭'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      success: 'status-success',
      executing: 'status-running',
      failed: 'status-failed',
      submitted: 'status-pending',
      reviewing: 'status-reviewing',
      created: 'status-pending',
      rejected: 'status-rejected',
      closed: 'status-closed',
      rollbacked: 'status-warning'
    };
    return classes[status] || 'status-pending';
  };

  if (!dashboardData) {
    return <div>加载中...</div>;
  }

  const stats = [
    { label: '今日任务总数', value: dashboardData.todayStats.total_today || 0, class: 'stat-primary' },
    { label: '今日成功', value: dashboardData.todayStats.success_today || 0, class: 'stat-success' },
    { label: '今日失败', value: dashboardData.todayStats.failed_today || 0, class: 'stat-danger' },
    { label: '待处理', value: dashboardData.statusStats.filter(s => ['created', 'submitted', 'reviewing'].includes(s.status)).reduce((a, b) => a + b.count, 0), class: 'stat-warning' }
  ];

  return (
    <div>
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.class}`}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card-title">任务状态分布</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {dashboardData.statusStats.map((stat, index) => (
            <div key={index} className="tag">
              {getStatusLabel(stat.status)}: <strong>{stat.count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">最近任务</h3>
        <table>
          <thead>
            <tr>
              <th>任务编号</th>
              <th>应用</th>
              <th>环境</th>
              <th>类型</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.recentTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.task_no}</td>
                <td>{task.app_name}</td>
                <td>{task.env_name}</td>
                <td><span className="tag tag-blue">{task.task_type === 'migrate' ? '迁移' : task.task_type === 'rollback' ? '回滚' : '验证'}</span></td>
                <td><span className={`status ${getStatusClass(task.status)}`}>{getStatusLabel(task.status)}</span></td>
                <td>{task.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
