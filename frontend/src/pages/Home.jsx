import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

function Home() {
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('hot');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('categories')
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { status: 1 };
    if (selectedCategory) {
      params.category = selectedCategory;
    }
    api.get('notes', { params })
      .then(res => {
        setNotes(res.data.list || []);
        setLoading(false);
      })
      .catch(() => {
        setNotes([]);
        setLoading(false);
      });
  }, [selectedCategory]);

  const sortedNotes = [...notes].sort((a, b) => {
    if (sortBy === 'hot') return (b.hot_score || 0) - (a.hot_score || 0);
    if (sortBy === 'views') return (b.view_count || 0) - (a.view_count || 0);
    if (sortBy === 'likes') return (b.like_count || 0) - (a.like_count || 0);
    return 0;
  });

  const getCategoryIcon = (catId) => {
    const icons = { 1: '🍜', 2: '🏛️', 3: '👨‍👩‍👧', 4: '🎯', 5: '💇' };
    return icons[catId] || '📍';
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id == catId);
    return cat ? cat.name : '';
  };

  const getHotLevel = (score) => {
    if (score >= 200) return { label: '爆', color: '#dc2626', bg: '#fef2f2' };
    if (score >= 100) return { label: '热', color: '#ea580c', bg: '#fff7ed' };
    if (score >= 50) return { label: '温', color: '#d97706', bg: '#fffbeb' };
    return { label: '新', color: '#65a30d', bg: '#f7fee7' };
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        color: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(255,107,53,0.3)'
      }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🌟 发现本地精彩</h1>
        <p style={{ opacity: 0.9, margin: 0, fontSize: '1.1rem' }}>真实用户分享，帮你做出更好的消费决策</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.9rem', opacity: 0.85 }}>
          <span>📝 {notes.length} 条审核通过笔记</span>
          <span>🏪 {categories.length} 大场景</span>
          <span>⚠️ 避坑指南</span>
        </div>
      </div>

      <div className="category-tabs">
        <div
          className={`category-tab ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          🔥 全部推荐
        </div>
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`category-tab ${selectedCategory == cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {getCategoryIcon(cat.id)} {cat.name}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          共 {sortedNotes.length} 条笔记
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSortBy('hot')}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: sortBy === 'hot' ? '#ff6b35' : '#ddd',
              background: sortBy === 'hot' ? '#ff6b35' : 'white',
              color: sortBy === 'hot' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🔥 热度排序
          </button>
          <button
            onClick={() => setSortBy('views')}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: sortBy === 'views' ? '#ff6b35' : '#ddd',
              background: sortBy === 'views' ? '#ff6b35' : 'white',
              color: sortBy === 'views' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            👁 浏览排序
          </button>
          <button
            onClick={() => setSortBy('likes')}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: sortBy === 'likes' ? '#ff6b35' : '#ddd',
              background: sortBy === 'likes' ? '#ff6b35' : 'white',
              color: sortBy === 'likes' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            ❤️ 点赞排序
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          加载中...
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <p>暂无笔记，快去发布第一条吧～</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/publish')}>
            发布笔记
          </button>
        </div>
      ) : (
        <div className="note-grid">
          {sortedNotes.map(note => {
            const hotLevel = getHotLevel(note.hot_score || 0);
            return (
              <div
                key={note.id}
                className="note-card"
                onClick={() => navigate(`/note/${note.id}`)}
              >
                {note.images ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={note.images.split(',')[0]}
                      alt={note.title}
                      className="note-image"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {note.risk_tips && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: '#ef4444',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        ⚠️ 避坑
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: hotLevel.bg,
                      color: hotLevel.color,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {hotLevel.label}
                    </div>
                    {note.images.split(',').length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        � {note.images.split(',').length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="note-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    📝
                  </div>
                )}
                <div className="note-content">
                  <div className="note-title">{note.title}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {note.content?.replace(/\n/g, ' ').substring(0, 80)}...
                  </div>
                  <div className="note-meta">
                    <span className="note-poi">
                      {note.poi_name ? `📍 ${note.poi_name}` : '探店分享'}
                    </span>
                    <div className="note-stats">
                      <span>👁 {note.view_count || 0}</span>
                      <span>❤️ {note.like_count || 0}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <span style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 500
                      }}>
                        ✓ 已审核
                      </span>
                      {note.category_id && (
                        <span style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          {getCategoryIcon(note.category_id)} {getCategoryName(note.category_id)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>
                      🔥 {(note.hot_score || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
