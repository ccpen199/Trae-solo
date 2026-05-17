import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../api';

const coverGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

const avatarColors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];

const Home = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('hot');
  const navigate = useNavigate();

  useEffect(() => {
    loadContents();
  }, [filter]);

  const loadContents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contentAPI.getContents({ sort: filter, limit: 20 });
      if (res.success) {
        setContents(res.data.list || []);
      } else {
        setError(res.message || '加载失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <button onClick={loadContents} style={styles.retryBtn}>重试</button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.filterBar}>
        {['hot', 'new', 'top'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterBtnActive : {}),
            }}
          >
            {f === 'hot' ? '🔥 热门' : f === 'new' ? '✨ 最新' : '🏆 精选'}
          </button>
        ))}
      </div>

      {contents.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>暂无内容</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {contents.map((item, idx) => (
            <div
              key={item.id}
              style={styles.card}
              onClick={() => navigate(`/content/${item.id}`)}
            >
              <div style={{...styles.coverWrap, ...styles.coverFallback[idx % 6]}}>
                <span style={styles.typeBadge}>{item.content_type === 'audio' ? '🎵' : '🎬'}</span>
                {item.duration && (
                  <span style={styles.duration}>
                    {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
              <h3 style={styles.title}>{item.title}</h3>
              <p style={styles.desc}>{item.description}</p>
              <div style={styles.meta}>
                <div style={styles.author}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                    {item.author_name?.charAt(0) || '?'}
                  </div>
                  <span style={styles.authorName}>{item.author_name}</span>
                </div>
                <div style={styles.stats}>
                  <span>👁️ {item.views || 0}</span>
                  <span>❤️ {item.likes || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 100,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(139, 92, 246, 0.2)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: 16,
    color: '#9ca3af',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 100,
  },
  errorText: {
    color: '#f87171',
    marginBottom: 16,
  },
  retryBtn: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
  },
  filterBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  filterBtn: {
    padding: '8px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    borderColor: 'transparent',
    color: '#fff',
  },
  empty: {
    textAlign: 'center',
    padding: 100,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  coverWrap: {
    position: 'relative',
    aspectRatio: '16/9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
  },
  coverFallback: [
    { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  ],
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '4px 8px',
    borderRadius: 6,
    fontSize: 12,
  },
  duration: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
  },
  title: {
    padding: '16px 16px 8px',
    fontSize: 16,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  desc: {
    padding: '0 16px',
    fontSize: 13,
    color: '#9ca3af',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    padding: '12px 16px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
  },
  authorName: {
    fontSize: 13,
    color: '#d1d5db',
  },
  stats: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    color: '#6b7280',
  },
};

export default Home;
