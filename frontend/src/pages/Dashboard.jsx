import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    tasks: 0,
    executions: 0,
    alerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    Promise.all([
      fetch('/api/audit/dashboard/stats').then(function(res) { return res.json(); })
    ]).then(function(results) {
      var stats = results[0];
      setStats({
        applications: stats.applications,
        tasks: stats.tasks,
        executions: stats.executions,
        alerts: stats.openAlerts
      });
      setLoading(false);
    }).catch(function() {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>📊 数据看板</h1>
          <p>分布式任务调度平台概览</p>
        </div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📊 数据看板</h1>
        <p>分布式任务调度平台概览</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">应用数量</div>
          <div className="value">{stats.applications}</div>
        </div>
        <div className="stat-card">
          <div className="label">任务数量</div>
          <div className="value">{stats.tasks}</div>
        </div>
        <div className="stat-card">
          <div className="label">执行次数</div>
          <div className="value">{stats.executions}</div>
        </div>
        <div className="stat-card">
          <div className="label">待处理告警</div>
          <div className="value">{stats.alerts}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>系统说明</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <p>分布式任务调度平台 - 完整功能已就绪</p>
          <ul style={{ marginTop: '10px', marginLeft: '20px', lineHeight: '1.8' }}>
            <li>📦 应用管理 - 管理接入平台的应用和环境</li>
            <li>⚡ 任务调度 - 配置和执行定时任务、即时任务</li>
            <li>📝 配置变更 - 管理应用配置变更流程</li>
            <li>📜 执行记录 - 查看任务执行历史和日志</li>
            <li>🔍 权限审计 - 告警管理、操作日志、权限配置</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
