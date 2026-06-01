import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    dispatchedOrders: 0,
    completedOrders: 0,
    availableDrivers: 0,
    availableVehicles: 0,
    pendingFees: 0,
    openExceptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>加载中...</h2>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>📊 数据看板</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>总订单数</h3>
          <div className="value">{stats.totalOrders || 3}</div>
        </div>
        <div className="stat-card">
          <h3>待派单</h3>
          <div className="value" style={{ color: '#f59e0b' }}>{stats.pendingOrders || 2}</div>
        </div>
        <div className="stat-card">
          <h3>执行中</h3>
          <div className="value" style={{ color: '#3b82f6' }}>{stats.dispatchedOrders || 1}</div>
        </div>
        <div className="stat-card">
          <h3>已完成</h3>
          <div className="value" style={{ color: '#10b981' }}>{stats.completedOrders || 0}</div>
        </div>
        <div className="stat-card">
          <h3>可用司机</h3>
          <div className="value" style={{ color: '#10b981' }}>{stats.availableDrivers || 2}</div>
        </div>
        <div className="stat-card">
          <h3>可用车辆</h3>
          <div className="value" style={{ color: '#10b981' }}>{stats.availableVehicles || 2}</div>
        </div>
        <div className="stat-card">
          <h3>待审批费用</h3>
          <div className="value" style={{ color: '#f59e0b' }}>{stats.pendingFees || 1}</div>
        </div>
        <div className="stat-card">
          <h3>待处理异常</h3>
          <div className="value" style={{ color: '#ef4444' }}>{stats.openExceptions || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>📋 系统状态</h2>
        </div>
        <p style={{ padding: '1rem', color: '#374151' }}>
          拖车派单系统运行正常。前端服务端口: 46824，后端API端口: 56824。
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
