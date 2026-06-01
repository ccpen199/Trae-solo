import { useEffect, useState } from 'react';
import { shipments } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, warehouse: 0, security: 0, delivered: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await shipments.list({ limit: 10 });
    setRecent(data.shipments || []);
    setStats({
      total: data.total || 0,
      warehouse: data.shipments?.filter(s => s.status?.includes('warehouse')).length || 0,
      security: data.shipments?.filter(s => s.status?.includes('security')).length || 0,
      delivered: data.shipments?.filter(s => s.status === 'delivered').length || 0
    });
  }

  const statusLabels = {
    created: { text: '已创建', class: 'badge-info' },
    warehouse_received: { text: '已入仓', class: 'badge-info' },
    warehouse_exception: { text: '入仓异常', class: 'badge-warning' },
    security_passed: { text: '安检通过', class: 'badge-success' },
    security_failed: { text: '安检失败', class: 'badge-danger' },
    departed: { text: '已起飞', class: 'badge-info' },
    arrived: { text: '已到达', class: 'badge-info' },
    customs_cleared: { text: '已清关', class: 'badge-success' },
    delivered: { text: '已签收', class: 'badge-success' }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1e293b' }}>工作台</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>{stats.total}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>总运单数</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>{stats.warehouse}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>入仓处理</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{stats.security}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>安检处理</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>{stats.delivered}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>已签收</div>
        </div>
      </div>

      <div className="card">
        <h2>最近运单</h2>
        <table className="table">
          <thead>
            <tr>
              <th>运单号</th>
              <th>发货人</th>
              <th>收货人</th>
              <th>航线</th>
              <th>件数/重量</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(s => {
              const status = statusLabels[s.status] || { text: s.status, class: 'badge-secondary' };
              return (
                <tr key={s.id}>
                  <td><a href={`/shipments/${s.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{s.shipment_no}</a></td>
                  <td>{s.shipper_name}</td>
                  <td>{s.consignee_name}</td>
                  <td>{s.origin} → {s.destination}</td>
                  <td>{s.pieces}件 / {s.weight}kg</td>
                  <td><span className={`badge ${status.class}`}>{status.text}</span></td>
                  <td>{new Date(s.created_at).toLocaleString('zh-CN')}</td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
