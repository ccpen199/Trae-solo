import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playlistAPI } from '../api/index.js';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const res = await playlistAPI.getPlaylists({ limit: 20 });
        setPlaylists(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPlaylists();
  }, []);

  return (
    <div className="container section">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 className="section-title" style={{ margin: 0 }}>片单</h1>
        <button className="btn btn-primary">+ 创建片单</button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="grid grid-2">
          {playlists.map(pl => (
            <Link
              key={pl.id}
              to={`/playlists/${pl.id}`}
              style={{
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px' }}>📋 {pl.name}</h3>
                <span className="badge badge-neutral">
                  {pl.item_count || 0} 部
                </span>
              </div>
              <p style={{
                margin: '0 0 16px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {pl.description}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                <span>创建者: {pl.creator_username || '用户' + pl.user_id}</span>
                <span>❤️ {pl.likes || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
