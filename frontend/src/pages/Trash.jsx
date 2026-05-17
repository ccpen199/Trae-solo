import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function Trash() {
  const navigate = useNavigate();
  const { user, showToast } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrash();
  }, [user]);

  const loadTrash = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/notes/trash/list');
      setNotes(res.data.notes || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const restoreNote = async (id) => {
    try {
      await api.put(`/notes/${id}/restore`);
      showToast('恢复成功', 'success');
      loadTrash();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deletePermanently = async (id) => {
    if (!confirm('确定要永久删除吗？此操作不可撤销。')) return;
    try {
      await api.delete(`/notes/${id}/permanent`);
      showToast('已永久删除', 'success');
      loadTrash();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>回收站</h2>
        <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>笔记删除后将保留 30 天</p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : !user ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗑️</div>
            <p style={{ color: '#999', marginBottom: '20px' }}>登录后查看回收站</p>
            <button onClick={() => navigate('/login')} style={{ padding: '10px 32px', background: '#1890ff', color: 'white', borderRadius: '20px' }}>
              立即登录
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗑️</div>
            <p style={{ color: '#999' }}>回收站为空</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.map(note => (
              <div key={note.id} style={{
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                  {note.title || '无标题'}
                </h3>
                <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '12px' }}>
                  删除于: {dayjs(note.deleted_at).format('YYYY-MM-DD HH:mm')}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => restoreNote(note.id)}
                    style={{ padding: '6px 16px', background: '#e6f7ff', color: '#1890ff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    恢复
                  </button>
                  <button
                    onClick={() => deletePermanently(note.id)}
                    style={{ padding: '6px 16px', background: '#fff1f0', color: '#ff4d4f', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    永久删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
