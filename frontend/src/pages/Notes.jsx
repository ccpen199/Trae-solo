import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { membersAPI } from '../api.js';

export default function Notes({ user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotes();
  }, [filter]);

  const loadNotes = async () => {
    try {
      const params = {};
      if (filter === 'public') params.is_public = 1;
      if (filter === 'private') params.is_public = 0;
      
      const response = await membersAPI.getNotes(params);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('加载笔记失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      note: '读书笔记',
      excerpt: '精彩摘录',
      thought: '个人想法',
      question: '疑问'
    };
    return types[type] || type;
  };

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <h1 style={{ marginBottom: '1.5rem' }}>成员端笔记</h1>

          <div className="tabs">
            <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部笔记</div>
            <div className={`tab ${filter === 'public' ? 'active' : ''}`} onClick={() => setFilter('public')}>公开笔记</div>
            <div className={`tab ${filter === 'private' ? 'active' : ''}`} onClick={() => setFilter('private')}>私密笔记</div>
          </div>

          {loading ? (
            <div className="text-center mt-8">加载中...</div>
          ) : (
            <div>
              {notes.map((note) => (
                <div key={note.id} className={`card ${note.is_essence ? 'essence' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <span className={`badge ${note.is_public ? 'badge-primary' : 'badge-gray'}`} style={{ marginRight: '0.5rem' }}>
                        {note.is_public ? '公开' : '私密'}
                      </span>
                      <span className="badge badge-success">{getTypeLabel(note.type)}</span>
                    </div>
                    <span className="text-muted">{note.author_name}</span>
                  </div>
                  {note.excerpt && (
                    <blockquote style={{ 
                      background: 'var(--gray-50)', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      borderLeft: '4px solid var(--primary)'
                    }}>
                      {note.excerpt}
                      {note.page_number && (
                        <span className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
                          - 第 {note.page_number} 页
                        </span>
                      )}
                    </blockquote>
                  )}
                  <p style={{ color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  <div className="text-muted" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                  <p className="text-muted">暂无笔记</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
