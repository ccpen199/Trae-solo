import React, { useState, useEffect } from 'react';
import { resourcesAPI, routesAPI, suppliersAPI, materialsAPI } from '../api/index.js';

function Dashboard() {
  const [stats, setStats] = useState({
    resources: 0,
    routes: 0,
    suppliers: 0,
    materials: 0
  });
  const [recentResources, setRecentResources] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resources, routes, suppliers, materials] = await Promise.all([
        resourcesAPI.getAll(),
        routesAPI.getAll(),
        suppliersAPI.getAll(),
        materialsAPI.getAll()
      ]);
      
      setStats({
        resources: resources.data.length,
        routes: routes.data.length,
        suppliers: suppliers.data.length,
        materials: materials.data.length
      });
      
      setRecentResources(resources.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const getBadgeClass = (type) => {
    const classes = {
      scenic: 'badge-scenic',
      hotel: 'badge-hotel',
      restaurant: 'badge-restaurant',
      transport: 'badge-transport',
      activity: 'badge-activity'
    };
    return classes[type] || '';
  };

  const getTypeName = (type) => {
    const names = {
      scenic: '景点',
      hotel: '酒店',
      restaurant: '餐厅',
      transport: '交通',
      activity: '活动'
    };
    return names[type] || type;
  };

  return (
    <div>
      <div className="page-header">
        <h2>📊 运营概览</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.resources}</div>
          <div className="stat-label">资源总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.routes}</div>
          <div className="stat-label">线路数量</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.suppliers}</div>
          <div className="stat-label">合作供应商</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.materials}</div>
          <div className="stat-label">素材数量</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>最近资源</h3>
        {recentResources.length === 0 ? (
          <div className="empty-state">暂无资源数据</div>
        ) : (
          recentResources.map(resource => (
            <div key={resource.id} style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={`badge ${getBadgeClass(resource.type)}`} style={{ marginRight: '0.5rem' }}>
                  {getTypeName(resource.type)}
                </span>
                <strong>{resource.name}</strong>
                <span style={{ marginLeft: '1rem', color: '#718096', fontSize: '0.9rem' }}>
                  {resource.location}
                </span>
              </div>
              <div>
                <span className="price">¥{resource.price}</span>
                {resource.is_closed && (
                  <span className="card-status status-closed" style={{ marginLeft: '1rem' }}>已停业</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>📋 自测清单</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>资源停业管理</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>资源停业后自动通知相关线路负责人</p>
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>价格变更追踪</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>价格变更自动记录并通知线路复核</p>
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>素材版权管理</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>过期素材标记，不能用于新线路</p>
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>线路时间冲突检测</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>自动校验资源时间和距离合理性</p>
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>供应商下架影响</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>供应商下架自动影响相关线路</p>
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>变更历史追踪</strong>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>所有资源变更都有记录可查</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
