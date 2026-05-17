import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function Search() {
  const navigate = useNavigate();
  const { user, showToast } = useApp();
  const [keyword, setKeyword] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (keyword.trim()) {
      doSearch();
    } else {
      setNotes([]);
    }
  }, [keyword]);

  const doSearch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notes', { params: { keyword } });
      setNotes(res.data.notes || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '10px 16px',
          gap: '8px'
        }}>
          <span>🔍</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索笔记内容..."
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '15px'
            }}
          />
          {keyword && (
            <button onClick={() => setKeyword('')} style={{ background: 'none', fontSize: '18px', color: '#999' }}>×</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>搜索中...</div>
        ) : !user ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: '#999', marginBottom: '20px' }}>登录后搜索您的笔记</p>
            <button onClick={() => navigate('/login')} style={{ padding: '10px 32px', background: '#1890ff', color: 'white', borderRadius: '20px' }}>
              立即登录
            </button>
          </div>
        ) : notes.length === 0 ? (
          keyword ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: '#999' }}>未找到相关笔记</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              输入关键词开始搜索
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#999' }}>找到 {notes.length} 条结果</p>
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => navigate(`/note/${note.id}`)}
                style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer'
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                  {note.title || '无标题'}
                </h3>
                <p style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>
                  {note.content?.slice(0, 100) || '暂无内容'}
                </p>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  {dayjs(note.updated_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
