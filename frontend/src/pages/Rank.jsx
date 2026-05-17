import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rankAPI } from '../api';

export default function Rank() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('anchor');
  const [anchorRank, setAnchorRank] = useState([]);
  const [richRank, setRichRank] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [anchorRes, richRes] = await Promise.all([
        rankAPI.getAnchorRank(),
        rankAPI.getRichRank()
      ]);
      
      if (anchorRes.data.success) setAnchorRank(anchorRes.data.data);
      if (richRes.data.success) setRichRank(richRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentData = activeTab === 'anchor' ? anchorRank : richRank;

  const getRankStyle = (index) => {
    if (index === 0) return { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#fff' };
    if (index === 1) return { background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#fff' };
    if (index === 2) return { background: 'linear-gradient(135deg, #CD7F32, #8B4513)', color: '#fff' };
    return { background: 'var(--gray-100)', color: 'var(--gray-600)' };
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>排行榜</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('anchor')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'anchor' ? 'var(--primary)' : 'var(--gray-100)',
            color: activeTab === 'anchor' ? 'white' : 'var(--gray-600)'
          }}
        >
          🏆 人气主播
        </button>
        <button
          onClick={() => setActiveTab('rich')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'rich' ? 'var(--primary)' : 'var(--gray-100)',
            color: activeTab === 'rich' ? 'white' : 'var(--gray-600)'
          }}
        >
          💰 富豪榜
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : currentData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>
          暂无数据
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {currentData.map((item, index) => (
            <div
              key={item.id}
              onClick={() => navigate(`/user/${item.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderBottom: index < currentData.length - 1 ? '1px solid var(--gray-100)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  ...getRankStyle(index)
                }}
              >
                {index + 1}
              </div>
              <img
                src={item.avatar}
                alt={item.nickname}
                className="avatar"
                style={{ width: 44, height: 44 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  {item.nickname}
                  {item.is_verified && <span style={{ color: 'var(--primary)' }}>✓</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                  {activeTab === 'anchor'
                    ? `${item.followers?.toLocaleString()} 粉丝`
                    : `累计消费 ¥${item.total_spent || 0}`}
                </div>
              </div>
              {index < 3 && (
                <span style={{ fontSize: 20 }}>
                  {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
