import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const CATEGORIES = ['全部', '情感', '音乐', '游戏', '教育', '交友', '其他'];
const STATUSES = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '开放中' },
  { value: 'closed', label: '已关闭' }
];

export default function RoomsPage({ currentUser }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [category, setCategory] = useState('全部');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ topic: '', category: '情感', mic_count: 8, password: '', max_viewers: 500 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRooms = () => {
    setLoading(true);
    setError(null);
    const params = { page, pageSize };
    if (category !== '全部') params.category = category;
    if (status) params.status = status;
    api.getRooms(params).then(r => {
      setRooms(r.rooms);
      setTotal(r.total);
    }).catch(e => {
      setError(e.message || '加载失败');
      setRooms([]);
      setTotal(0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadRooms(); }, [page, category, status, currentUser]);

  const handleCreate = () => {
    if (!form.topic) return alert('请输入房间主题');
    api.createRoom(form).then(() => {
      setShowCreate(false);
      setForm({ topic: '', category: '情感', mic_count: 8, password: '', max_viewers: 500 });
      loadRooms();
    }).catch(e => alert(e.message));
  };

  const handleClose = (id) => {
    if (!confirm('确定关闭此房间？')) return;
    api.closeRoom(id).then(() => loadRooms()).catch(e => alert(e.message));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', fontSize: '22px' }}>房间列表</h2>
        {currentUser && (currentUser.role === 'host' || currentUser.role === 'admin') && (
          <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>
            + 创建房间
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} style={styles.select}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={styles.select}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span style={{ color: '#888', alignSelf: 'center', fontSize: '14px' }}>共 {total} 个房间</span>
      </div>

      {error ? (
        <div style={{ ...styles.empty, color: '#e74c3c' }}>⚠️ {error}</div>
      ) : loading ? (
        <div style={styles.empty}>加载中...</div>
      ) : rooms.length === 0 ? (
        <div style={styles.empty}>暂无房间</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {rooms.map(room => (
            <div key={room.id} style={styles.roomCard} onClick={() => navigate(`/rooms/${room.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: room.status === 'open' ? '#27ae60' : '#555',
                  color: '#fff'
                }}>{room.status === 'open' ? '开放中' : '已关闭'}</span>
                <span style={{ fontSize: '13px', color: '#888' }}>{room.category}</span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px', lineHeight: 1.4 }}>{room.topic}</h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
                <span>👤 {room.host_name}</span>
                <span>🔥 {room.popularity}</span>
                <span>👥 {room.online_count}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Array.from({ length: room.mic_count }).map((_, i) => (
                  <span key={i} style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: i < (room.mic_used || 0) ? '#5b5fc7' : '#2a2a4e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: i < (room.mic_used || 0) ? '#fff' : '#666'
                  }}>{i + 1}</span>
                ))}
              </div>
              {room.status === 'open' && currentUser && (currentUser.role === 'host' || currentUser.role === 'admin') && room.host_id === currentUser.id && (
                <button onClick={(e) => { e.stopPropagation(); handleClose(room.id); }}
                  style={{ ...styles.dangerBtn, marginTop: '12px', width: '100%' }}>
                  关闭房间
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={styles.pageBtn}>上一页</button>
          <span style={{ alignSelf: 'center', color: '#888' }}>第 {page} 页</span>
          <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)} style={styles.pageBtn}>下一页</button>
        </div>
      )}

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>创建房间</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="房间主题" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={styles.input} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={styles.input}>
                {CATEGORIES.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min="1" max="20" placeholder="麦位数" value={form.mic_count}
                onChange={e => setForm({ ...form, mic_count: parseInt(e.target.value) || 8 })} style={styles.input} />
              <input placeholder="房间密码（可选）" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={styles.input} />
              <input type="number" min="10" placeholder="最大观看人数" value={form.max_viewers}
                onChange={e => setForm({ ...form, max_viewers: parseInt(e.target.value) || 500 })} style={styles.input} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setShowCreate(false)} style={{ ...styles.btn, flex: 1 }}>取消</button>
              <button onClick={handleCreate} style={{ ...styles.primaryBtn, flex: 1 }}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  roomCard: {
    background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px',
    padding: '16px', cursor: 'pointer', transition: 'all 0.2s'
  },
  primaryBtn: {
    background: '#5b5fc7', color: '#fff', padding: '10px 20px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600
  },
  dangerBtn: {
    background: '#e74c3c', color: '#fff', padding: '8px 16px', borderRadius: '6px',
    fontSize: '13px'
  },
  btn: { background: '#2a2a4e', color: '#e0e0e0', padding: '10px 20px', borderRadius: '8px', fontSize: '14px' },
  select: { background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4e', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' },
  input: { background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4e', borderRadius: '6px', padding: '10px 12px', fontSize: '14px' },
  empty: { textAlign: 'center', color: '#666', padding: '60px 0', fontSize: '14px' },
  pageBtn: { background: '#2a2a4e', color: '#e0e0e0', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: 'none' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90%' }
};
