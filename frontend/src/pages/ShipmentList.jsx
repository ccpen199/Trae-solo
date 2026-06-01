import { useEffect, useState } from 'react';
import { shipments } from '../api';

export default function ShipmentList() {
  const [data, setData] = useState({ shipments: [], total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadData();
  }, [page, status]);

  async function loadData() {
    const result = await shipments.list({ page, limit: 20, status });
    setData(result);
    const totalPages = Math.ceil(result.total / 20) || 1;
    if (page > totalPages) {
      setPage(1);
    }
  }

  const allStages = [
    { key: 'created', label: '创建' },
    { key: 'approved', label: '审核' },
    { key: 'warehouse', label: '入仓' },
    { key: 'security', label: '安检' },
    { key: 'departed', label: '起飞' },
    { key: 'arrived', label: '到达' },
    { key: 'cleared', label: '清关' },
    { key: 'available', label: '提货' },
    { key: 'delivered', label: '签收' }
  ];

  function getStageProgress(shipment) {
    const stages = [];
    stages.push({ key: 'created', done: true, label: '创建' });
    if (shipment.is_dangerous || shipment.is_battery) {
      stages.push({ key: 'approved', done: shipment.dangerous_approved, label: '审核' });
    }
    stages.push({ key: 'warehouse', done: shipment.status === 'warehouse_received' || shipment.status === 'warehouse_exception', label: '入仓' });
    stages.push({ key: 'security', done: shipment.status === 'security_passed' || shipment.status === 'security_failed', label: '安检' });
    stages.push({ key: 'departed', done: shipment.status === 'departed', label: '起飞' });
    stages.push({ key: 'arrived', done: shipment.status === 'arrived', label: '到达' });
    stages.push({ key: 'cleared', done: shipment.status === 'customs_cleared', label: '清关' });
    stages.push({ key: 'available', done: shipment.status === 'available', label: '提货' });
    stages.push({ key: 'delivered', done: shipment.status === 'delivered', label: '签收' });
    return stages;
  }

  const statusLabels = {
    created: { text: '待入仓', class: 'badge-info' },
    warehouse_received: { text: '待安检', class: 'badge-info' },
    warehouse_exception: { text: '入仓异常', class: 'badge-warning' },
    security_passed: { text: '待起飞', class: 'badge-success' },
    security_failed: { text: '安检失败', class: 'badge-danger' },
    departed: { text: '运输中', class: 'badge-info' },
    arrived: { text: '待清关', class: 'badge-info' },
    customs_cleared: { text: '待提货', class: 'badge-success' },
    available: { text: '可提货', class: 'badge-success' },
    delivered: { text: '已完成', class: 'badge-success' }
  };

  return (
    <div>
      <div className="page-header">
        <h2>运单管理</h2>
        <button className="btn btn-primary" onClick={() => window.location.href = '/shipments/new'}>新建运单</button>
      </div>

      <div className="filters">
        <div className="form-group">
          <label>状态筛选</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="created">已创建</option>
            <option value="warehouse_received">已入仓</option>
            <option value="warehouse_exception">入仓异常</option>
            <option value="security_passed">安检通过</option>
            <option value="security_failed">安检失败</option>
            <option value="departed">已起飞</option>
            <option value="arrived">已到达</option>
            <option value="customs_cleared">已清关</option>
            <option value="delivered">已签收</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>运单号</th>
              <th>发货人</th>
              <th>航线</th>
              <th>件重</th>
              <th>阶段进度</th>
              <th>当前状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {data.shipments?.map(s => {
              const statusInfo = statusLabels[s.status] || { text: s.status, class: 'badge-secondary' };
              const stages = getStageProgress(s);
              const doneCount = stages.filter(x => x.done).length;
              const progress = Math.round((doneCount / stages.length) * 100);
              return (
                <tr key={s.id}>
                  <td><a href={`/shipments/${s.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{s.shipment_no}</a></td>
                  <td>{s.shipper_name}</td>
                  <td>{s.origin} → {s.destination}</td>
                  <td>{s.pieces}件/{s.weight}kg</td>
                  <td>
                    <div style={{ minWidth: '280px' }}>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                        {stages.map((st, i) => (
                          <div key={i} style={{ 
                            flex: 1, 
                            height: '8px', 
                            background: st.done ? '#10b981' : '#e2e8f0',
                            borderRadius: i === 0 ? '4px 0 0 4px' : i === stages.length - 1 ? '0 4px 4px 0' : '0'
                          }} title={st.label + (st.done ? ' ✓' : ' 待处理')} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                        <span>{stages[0].label}</span>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>{progress}%</span>
                        <span>{stages[stages.length-1].label}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span></td>
                  <td>{new Date(s.created_at).toLocaleString('zh-CN')}</td>
                </tr>
              );
            })}
            {data.shipments?.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        {(() => {
          const totalPages = Math.ceil(data.total / 20) || 1;
          return (
            <>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
              <span style={{ padding: '0.625rem 1rem' }}>第 {page} 页 / 共 {totalPages} 页</span>
              <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>下一页</button>
            </>
          );
        })()}
      </div>
    </div>
  );
}
