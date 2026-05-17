import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { marked } from 'marked';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('edit');

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    try {
      const res = await api.get(`/notes/${id}`);
      setNote(res.data.note);
      setTitle(res.data.note.title);
      setContent(res.data.note.content);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    try {
      await api.put(`/notes/${id}`, { title, content });
      showToast('保存成功', 'success');
      loadNote();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteNote = async () => {
    if (!confirm('确定要删除这篇笔记吗？')) return;
    try {
      await api.delete(`/notes/${id}`);
      showToast('已移至回收站', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee',
        background: 'white'
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', fontSize: '20px' }}>←</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
            style={{ padding: '6px 12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}
          >
            {viewMode === 'edit' ? '👁️ 预览' : '✏️ 编辑'}
          </button>
          <button onClick={saveNote} style={{ padding: '6px 12px', background: '#1890ff', color: 'white', borderRadius: '4px', fontSize: '13px' }}>
            保存
          </button>
          <button onClick={deleteNote} style={{ padding: '6px 12px', background: '#fff1f0', color: '#ff4d4f', borderRadius: '4px', fontSize: '13px' }}>
            删除
          </button>
        </div>
      </div>

      {viewMode === 'edit' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="笔记标题"
            style={{
              fontSize: '18px',
              fontWeight: '600',
              border: 'none',
              outline: 'none',
              marginBottom: '16px',
              padding: '8px 0'
            }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支持 Markdown 格式..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              lineHeight: '1.8',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>{title || '无标题'}</h1>
          <div
            dangerouslySetInnerHTML={{ __html: marked(content) }}
            style={{ lineHeight: '1.8', fontSize: '15px' }}
          />
        </div>
      )}
    </div>
  );
}
