import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveAPI, commonAPI } from '../api';

export default function Home() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    try {
      const res = await liveAPI.getRooms({ category: activeCategory });
      if (res.data.success) {
        setRooms(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    commonAPI.getCategories().then(res => {
      if (res.data.success) {
        setCategories(res.data.data);
      }
    });
  }, [activeCategory]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 16,
        marginBottom: 8
      }}>
        <button
          onClick={() => setActiveCategory('')}
          className="btn"
          style={{
            background: !activeCategory ? 'var(--primary)' : 'var(--gray-100)',
            color: !activeCategory ? 'white' : 'var(--gray-600)',
            whiteSpace: 'nowrap'
          }}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="btn"
            style={{
              background: activeCategory === cat ? 'var(--primary)' : 'var(--gray-100)',
              color: activeCategory === cat ? 'white' : 'var(--gray-600)',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>
          暂无直播
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => navigate(`/live/${room.id}`)}
              className="card"
              style={{ cursor: 'pointer' }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={room.cover || 'https://picsum.photos/320/180'}
                  alt={room.title}
                  style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  👁 {room.viewers}
                </div>
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 12
                }}>
                  直播中
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img
                    src={room.avatar}
                    alt={room.nickname}
                    className="avatar"
                    style={{ width: 24, height: 24 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {room.nickname}
                    {room.is_verified && <span style={{ color: 'var(--primary)' }}>✓</span>}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
