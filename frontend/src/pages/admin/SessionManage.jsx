import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { sessionAPI, eventAPI, venueAPI } from '../../api/client';

function SessionManage() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    event_id: '',
    venue_id: '',
    start_time: '',
    end_time: '',
    sale_start_time: '',
    sale_end_time: '',
    is_seckill: false,
    fee_rate: 0.1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionRes, eventRes, venueRes] = await Promise.all([
        sessionAPI.list({ limit: 50 }),
        eventAPI.list({ limit: 50, view: 'events-only' }),
        venueAPI.list({ limit: 50 }),
      ]);
      setSessions(sessionRes.data || []);
      setEvents(eventRes.data || []);
      setVenues(venueRes.data || []);
    } catch (e) {
      console.error('Load data failed:', e);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await sessionAPI.updateStatus(id, status);
      loadData();
    } catch (e) {
      alert('状态更新失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sessionAPI.create({
        ...formData,
        refund_policy: { type: 'flexible', before24h: 0.1, before7d: 0.05 },
      });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert('创建失败');
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      draft: '草稿',
      presale: '预售',
      onsale: '售票中',
      seckill: '秒杀',
      soldout: '售罄',
      ended: '已结束',
      cancelled: '已取消',
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      draft: 'status-soldout',
      presale: 'status-presale',
      onsale: 'status-onsale',
      seckill: 'status-seckill',
      soldout: 'status-soldout',
      ended: 'status-soldout',
      cancelled: 'status-soldout',
    };
    return map[status] || '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>场次管理</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 新增场次
        </button>
      </div>

      {showForm && (
        <div className="chart-container">
          <h3 style={{ marginBottom: '1rem' }}>新增场次</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>活动</label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                >
                  <option value="">请选择活动</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>场馆</label>
                <select
                  value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                >
                  <option value="">请选择场馆</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>开始时间</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>结束时间</label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>售票开始时间</label>
                <input
                  type="datetime-local"
                  value={formData.sale_start_time}
                  onChange={(e) => setFormData({ ...formData, sale_start_time: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>售票结束时间</label>
                <input
                  type="datetime-local"
                  value={formData.sale_end_time}
                  onChange={(e) => setFormData({ ...formData, sale_end_time: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_seckill}
                    onChange={(e) => setFormData({ ...formData, is_seckill: e.target.checked })}
                  />
                  秒杀场
                </label>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>退票手续费率</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.fee_rate}
                  onChange={(e) => setFormData({ ...formData, fee_rate: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="chart-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>活动</th>
              <th>场馆</th>
              <th>时间</th>
              <th>售票</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.event_title}</td>
                <td>{session.venue_name} ({session.city})</td>
                <td>{dayjs(session.start_time).format('YYYY-MM-DD HH:mm')}</td>
                <td>{session.sold_count} / {session.total_inventory}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(session.status)}`}>
                    {session.is_seckill && '⚡ '}{getStatusLabel(session.status)}
                  </span>
                </td>
                <td>
                  <select
                    value={session.status}
                    onChange={(e) => handleStatusChange(session.id, e.target.value)}
                    style={{ padding: '0.25rem', borderRadius: '4px' }}
                  >
                    <option value="draft">草稿</option>
                    <option value="presale">预售</option>
                    <option value="onsale">售票中</option>
                    <option value="seckill">秒杀</option>
                    <option value="soldout">售罄</option>
                    <option value="ended">已结束</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SessionManage;
