import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDrivers = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/admin/drivers', { params });
      setDrivers(res.data.drivers);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/drivers/${id}/approve`);
      alert('审核通过');
      fetchDrivers();
    } catch (err) {
      alert('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/drivers/${id}/reject`);
      alert('已驳回');
      fetchDrivers();
    } catch (err) {
      alert('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  const statusMap = {
    pending: { text: '待审核', class: 'status-pending' },
    approved: { text: '已通过', class: 'status-completed' },
    rejected: { text: '已驳回', class: 'status-pending' }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h2 style={{ marginBottom: '24px' }}>司机资质审核管理</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filter === s ? '#1677ff' : '#f5f5f5',
              color: filter === s ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {s === '' ? '全部' : statusMap[s].text}
          </button>
        ))}
      </div>

      <div className="card">
        {drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无司机数据
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>司机</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>手机号</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>车型</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>车牌</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>评分/接单</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>状态</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#1677ff', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {driver.name?.[0] || '司'}
                        </div>
                        {driver.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{driver.phone}</td>
                    <td style={{ padding: '12px' }}>{driver.vehicle_type || '-'}</td>
                    <td style={{ padding: '12px' }}>{driver.vehicle_number || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      ⭐ {driver.service_score} / {driver.order_count}单
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`status-badge ${statusMap[driver.status]?.class}`}>
                        {statusMap[driver.status]?.text || driver.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {driver.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={() => handleApprove(driver.id)}
                            disabled={actionLoading === driver.id}
                          >
                            通过
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 12px', fontSize: '12px', borderColor: '#ff4d4f', color: '#ff4d4f' }}
                            onClick={() => handleReject(driver.id)}
                            disabled={actionLoading === driver.id}
                          >
                            驳回
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
