import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/processing/dashboard/overview');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const statusMap = {
    ordered: { label: '待处理', badge: 'badge-warning' },
    lens_arrived: { label: '镜片到货', badge: 'badge-info' },
    processing: { label: '加工中', badge: 'badge-primary' },
    quality_check: { label: '质检中', badge: 'badge-info' },
    ready: { label: '待取镜', badge: 'badge-success' },
    completed: { label: '已完成', badge: 'badge-success' },
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>工作台</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">订单总数</div>
          <div className="stat-value">{stats?.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">待处理</div>
          <div className="stat-value" style={{ color: '#faad14' }}>{stats?.ordered || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">加工中</div>
          <div className="stat-value" style={{ color: '#1890ff' }}>{stats?.processing || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">待取镜</div>
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats?.ready || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">已完成</div>
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats?.completed || 0}</div>
        </div>
        {stats?.delayed > 0 && (
          <div className="stat-card" style={{ background: '#fff2f0' }}>
            <div className="stat-title" style={{ color: '#f5222d' }}>延期订单</div>
            <div className="stat-value" style={{ color: '#f5222d' }}>{stats.delayed}</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">快捷操作</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/customers" className="btn btn-primary" style={{ textAlign: 'center' }}>
              客户管理
            </Link>
            <Link to="/optometry/new" className="btn btn-success" style={{ textAlign: 'center' }}>
              新建验光
            </Link>
            <Link to="/orders/new" className="btn btn-warning" style={{ textAlign: 'center' }}>
              创建订单
            </Link>
            <Link to="/processing" className="btn btn-default" style={{ textAlign: 'center' }}>
              加工管理
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-title">系统说明</div>
          <ul style={{ lineHeight: 2, color: '#666' }}>
            <li>客户档案：记录客户基本信息、偏好和特殊提醒</li>
            <li>验光记录：保存球镜、柱镜、瞳距等处方数据</li>
            <li>配镜订单：关联镜架镜片，后端统一计算价格</li>
            <li>加工流程：跟踪从下单到取镜的完整流程</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
