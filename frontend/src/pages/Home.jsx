import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function Home() {
  const navigate = useNavigate();
  const { user, showToast } = useApp();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolders, setShowFolders] = useState(false);

  const loadNotes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const params = {};
      if (selectedFolder) params.folderId = selectedFolder;
      const res = await api.get('/notes', { params });
      setNotes(res.data.notes || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    if (!user) return;
    try {
      const res = await api.get('/folders');
      setFolders(res.data.folders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotes();
    loadFolders();
  }, [user, selectedFolder]);

  const createNote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/notes', {
        title: '新建笔记',
        content: '',
        folderId: selectedFolder
      });
      navigate(`/note/${res.data.note.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleFavorite = async (note) => {
    try {
      await api.put(`/notes/${note.id}`, {
        title: note.title,
        content: note.content,
        isFavorite: note.is_favorite ? 0 : 1
      });
      loadNotes();
      showToast(note.is_favorite ? '已取消收藏' : '已收藏', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
          {user ? `你好，${user.nickname || '用户'}` : '有道云笔记'}
        </h2>
        <div
          onClick={() => navigate('/search')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <span>🔍</span>
          <span style={{ opacity: 0.8 }}>搜索笔记...</span>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: '12px' }}>
        <div
          onClick={() => setShowFolders(!showFolders)}
          style={{
            padding: '6px 12px',
            background: selectedFolder ? '#e6f7ff' : '#f5f5f5',
            borderRadius: '16px',
            fontSize: '13px',
            color: selectedFolder ? '#1890ff' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          📁 {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || '全部笔记' : '全部笔记'}
        </div>
        <div
          onClick={() => setSelectedFolder(selectedFolder === 'favorite' ? null : 'favorite')}
          style={{
            padding: '6px 12px',
            background: selectedFolder === 'favorite' ? '#fff7e6' : '#f5f5f5',
            borderRadius: '16px',
            fontSize: '13px',
            color: selectedFolder === 'favorite' ? '#fa8c16' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ⭐ 收藏
        </div>
      </div>

      {showFolders && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div
            onClick={() => { setSelectedFolder(null); setShowFolders(false); }}
            style={{
              padding: '6px 12px',
              background: !selectedFolder ? '#e6f7ff' : '#f5f5f5',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            全部笔记
          </div>
          {folders.map(folder => (
            <div
              key={folder.id}
              onClick={() => { setSelectedFolder(folder.id); setShowFolders(false); }}
              style={{
                padding: '6px 12px',
                background: selectedFolder === folder.id ? '#e6f7ff' : '#f5f5f5',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {folder.name}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : !user ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: '#999', marginBottom: '20px' }}>登录后同步您的所有笔记</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 32px',
                background: '#1890ff',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px'
              }}
            >
              立即登录
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
            <p style={{ color: '#999' }}>暂无笔记，点击下方按钮创建</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', flex: 1 }}>
                    {note.title || '无标题'}
                  </h3>
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(note); }}
                    style={{ fontSize: '16px', cursor: 'pointer' }}
                  >
                    {note.is_favorite ? '⭐' : '☆'}
                  </span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#999',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.5',
                  marginBottom: '8px'
                }}>
                  {note.content || '暂无内容'}
                </p>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  {dayjs(note.updated_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <button
            onClick={createNote}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              color: 'white',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)'
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
