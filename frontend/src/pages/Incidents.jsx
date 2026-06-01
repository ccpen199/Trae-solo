import React, { useState, useEffect } from 'react';
import api from '../api';

const severityColors = {
  '轻微': '#4caf50',
  '一般': '#ff9800',
  '严重': '#f44336',
  '紧急': '#9c27b0'
};

const statusColors = {
  '待处理': '#f44336',
  '处理中': '#ff9800',
  '已处理': '#4caf50',
  '已上报': '#2196f3'
};

function Incidents({ user }) {
  const [incidents, setIncidents] = useState([]);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [elderlyList, setElderlyList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incidentsRes, pendingRes, elderlyRes] = await Promise.all([
        api.get('/incidents'),
        ['admin', 'nurse', 'caregiver'].includes(user.role) ? api.get('/incidents/pending').catch(() => ({ data: [] })) : { data: [] },
        api.get('/elderly')
      ]);
      setIncidents(incidentsRes.data);
      setPendingIncidents(pendingRes.data || []);
      setElderlyList(elderlyRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/incidents', formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('上报失败');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/incidents/${id}`, { status, handling_notes: '已处理' });
      loadData();
    } catch (err) {
      alert('更新失败');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>异常事件</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + 上报事件
        </button>
      </div>

      {pendingIncidents.length > 0 && (
        <div style={{
          background: '#ffebee',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ef9a9a'
        }}>
          <div style={{ fontWeight: 'bold', color: '#c62828', marginBottom: '12px' }}>
            ⚠️ 待处理事件 ({pendingIncidents.length}项)
          </div>
          {pendingIncidents.map((incident) => (
            <div key={incident.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              background: 'white',
              borderRadius: '6px',
              marginBottom: '8px'
            }}>
              <div>
                <span style={{
                  padding: '2px 8px',
                  background: severityColors[incident.severity] + '20',
                  color: severityColors[incident.severity],
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginRight: '8px'
                }}>
                  {incident.severity}
                </span>
                <strong>{incident.elderly_name}</strong>
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '13px' }}>
                  {incident.incident_type}
                </span>
              </div>
              {['admin', 'nurse'].includes(user.role) && (
                <button
                  onClick={() => handleStatusChange(incident.id, '已处理')}
                  style={{
                    padding: '6px 12px',
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  标记处理
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>时间</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>老人</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>类型</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>严重程度</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>描述</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>上报人</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                  {new Date(incident.occurred_at).toLocaleString('zh-CN')}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{incident.elderly_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{incident.incident_type}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: severityColors[incident.severity] + '20',
                    color: severityColors[incident.severity],
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {incident.severity}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '200px' }}>
                  {incident.description?.substring(0, 30)}...
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{incident.reporter_name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: statusColors[incident.status] + '20',
                    color: statusColors[incident.status],
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {incident.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '450px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f44336' }}>⚠️ 上报异常事件</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>老人</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onChange={(e) => setFormData({ ...formData, elderly_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {elderlyList.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>事件类型</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })} required>
                    <option value="">请选择</option>
                    <option value="跌倒">跌倒</option>
                    <option value="突发疾病">突发疾病</option>
                    <option value="情绪异常">情绪异常</option>
                    <option value="走失">走失</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>严重程度</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })} required>
                    <option value="">请选择</option>
                    <option value="轻微">轻微</option>
                    <option value="一般">一般</option>
                    <option value="严重">严重</option>
                    <option value="紧急">紧急</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>事件描述</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请详细描述事件情况..." required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  确认上报
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Incidents;
