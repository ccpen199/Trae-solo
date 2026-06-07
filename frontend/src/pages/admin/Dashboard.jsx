import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/platform/dashboard/stats');
      setStats(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>📊 平台数据总览</h1>

      <div className="grid grid-4" style={{ marginBottom: '20px' }}>
        <div className="card stats-card">
          <div className="stats-value">{stats?.totalRiders || 0}</div>
          <div className="stats-label">注册骑手总数</div>
        </div>
        <div className="card stats-card">
          <div className="stats-value" style={{ color: 'var(--success)' }}>{stats?.activeRiders || 0}</div>
          <div className="stats-label">活跃骑手（近1小时）</div>
        </div>
        <div className="card stats-card">
          <div className="stats-value" style={{ color: 'var(--warning)' }}>{stats?.pendingOrders || 0}</div>
          <div className="stats-label">待配送订单</div>
        </div>
        <div className="card stats-card">
          <div className="stats-value" style={{ color: 'var(--error)' }}>{stats?.pendingAppeals || 0}</div>
          <div className="stats-label">待处理申诉</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '20px' }}>
        <div className="card stats-card">
          <div className="stats-value">{stats?.totalOrders || 0}</div>
          <div className="stats-label">平台总订单</div>
        </div>
        <div className="card stats-card">
          <div className="stats-value" style={{ color: 'var(--primary)' }}>{stats?.todayOrders || 0}</div>
          <div className="stats-label">今日订单</div>
        </div>
        <div className="card stats-card">
          <div className="stats-value" style={{ color: 'var(--success)' }}>¥{stats?.totalAmount?.toFixed(2) || '0.00'}</div>
          <div className="stats-label">平台总流水</div>
        </div>
        <div className="card stats-card">
          <div className="stats-value" style={{ color: 'var(--warning)' }}>¥{stats?.totalSettled?.toFixed(2) || '0.00'}</div>
          <div className="stats-label">已结算金额</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">🎯 智能派单规则说明</h3>
          <div style={{ lineHeight: 2 }}>
            <div>• <strong>距离权重 35%</strong>：骑手到取餐点距离越近得分越高</div>
            <div>• <strong>顺路度权重 25%</strong>：与当前配送路线的重合度</div>
            <div>• <strong>履约率权重 25%</strong>：骑手历史订单完成率</div>
            <div>• <strong>供需比权重 15%</strong>：区域订单与骑手比例</div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">⚡ 快捷操作</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => window.location.href = '/admin/heatmap'}>查看运力热力图</button>
            <button className="btn btn-success" onClick={() => window.location.href = '/admin/dispatch'}>配置派单规则</button>
            <button className="btn btn-warning" onClick={() => window.location.href = '/admin/incentives'}>管理激励红包池</button>
            <button className="btn btn-danger" onClick={() => window.location.href = '/admin/appeals'}>处理申诉工单</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
