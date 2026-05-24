import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const getStatusBadge = (status) => {
  const statusMap = {
    recruiting: { text: '招募中', className: 'info' },
    confirmed: { text: '已成局', className: 'success' },
    completed: { text: '已完成', className: 'success' },
    cancelled: { text: '已取消', className: 'danger' }
  };
  const s = statusMap[status] || { text: status, className: '' };
  return <span className={`badge ${s.className}`}>{s.text}</span>;
};

const tabs = [
  { key: 'all', name: '全部' },
  { key: 'recruiting', name: '招募中' },
  { key: 'confirmed', name: '已成局' },
  { key: 'completed', name: '已完成' },
  { key: 'organizer', name: '我发起的' }
];

function MyGames({ user }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const res = await api.get('/games/my');
      setGames(res.data);
    } catch (err) {
      console.error('加载我的球局失败', err);
    }
  };

  const filteredGames = games.filter(g => {
    if (activeTab === 'all') return true;
    if (activeTab === 'organizer') return g.member_role === 'organizer';
    return g.status === activeTab;
  });

  return (
    <div>
      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <div key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.name}
            </div>
          ))}
        </div>

        {filteredGames.map(game => (
          <div key={game.id} className="game-item" onClick={() => navigate(`/games/${game.id}`)} style={{ cursor: 'pointer' }}>
            <div className="game-header">
              <span className="game-title">{game.title}</span>
              <div>
                {game.member_role === 'organizer' && <span className="badge warning" style={{ marginRight: '8px' }}>我发起的</span>}
                {getStatusBadge(game.status)}
              </div>
            </div>
            <div className="game-meta">
              📍 {game.venue_name} - {game.court_name}
            </div>
            <div className="game-meta">
              🕐 {game.date} {game.start_time}-{game.end_time}
            </div>
            <div className="game-meta">
              👥 {game.member_count}/{game.max_players} 人
              {game.checked_in ? <span className="badge success" style={{ marginLeft: '10px' }}>已到场</span> : null}
            </div>
          </div>
        ))}

        {filteredGames.length === 0 && (
          <div style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
            暂无相关球局
          </div>
        )}
      </div>
    </div>
  );
}

export default MyGames;
