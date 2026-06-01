import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const careLevelColors = {
  '自理': '#4caf50',
  '半自理': '#ff9800',
  '全护理': '#f44336',
  '特护': '#9c27b0'
};

const roomNumbers = ['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '403'];
const bedNumbers = ['A', 'B', 'C', 'D'];

function ElderlyList({ user }) {
  const [elderly, setElderly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ room_number: roomNumbers[0], bed_number: bedNumbers[0], care_level: '自理', gender: '男' });
  const navigate = useNavigate();

  useEffect(() => {
    loadElderly();
  }, []);

  const loadElderly = async () => {
    try {
      const res = await api.get('/elderly');
      setElderly(res.data);
    } catch (err) {
      console.error('加载老人列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/elderly', formData);
      setShowModal(false);
      loadElderly();
    } catch (err) {
      alert('创建失败: ' + (err.response?.data?.error || '未知错误'));
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>老人档案</h2>
        {['admin', 'nurse'].includes(user.role) && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 添加老人
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {elderly.map((e) => (
          <div
            key={e.id}
            onClick={() => navigate(`/elderly/${e.id}`)}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: '1px solid #eee'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: e.gender === '男' ? '#2196f3' : '#e91e63',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                {e.gender === '男' ? '👴' : '👵'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{e.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{e.room_number}室 {e.bed_number}床</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 10px',
                background: careLevelColors[e.care_level] + '20',
                color: careLevelColors[e.care_level],
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {e.care_level}
              </span>
              <span style={{
                padding: '4px 10px',
                background: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {e.status}
              </span>
            </div>
            {e.health_status && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                {e.health_status}
              </div>
            )}
          </div>
        ))}
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
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>添加老人档案</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' }}>姓名 *</label>
                  <input type="text" required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' }}>性别</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' }}>房间号</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}>
                    {roomNumbers.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' }}>床位号</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    value={formData.bed_number}
                    onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}>
                    {bedNumbers.map(bed => (
                      <option key={bed} value={bed}>{bed}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' }}>护理等级</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, care_level: e.target.value })}>
                    <option value="自理">自理</option>
                    <option value="半自理">半自理</option>
                    <option value="全护理">全护理</option>
                    <option value="特护">特护</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#555' }}>健康状况</label>
                  <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    onChange={(e) => setFormData({ ...formData, health_status: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '10px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ElderlyList;
