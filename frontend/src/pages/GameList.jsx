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

const sportTypes = [
  { value: '', name: '全部' },
  { value: 'badminton', name: '羽毛球' },
  { value: 'tennis', name: '网球' },
  { value: 'basketball', name: '篮球' }
];

function GameList({ user, canCreate }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState({ sport_type: '', status: '' });

  useEffect(() => {
    loadGames();
  }, [filter]);

  const loadGames = async () => {
    try {
      const res = await api.get('/games', { params: filter });
      setGames(res.data);
    } catch (err) {
      console.error('加载球局失败', err);
    }
  };

  const handleJoin = async (gameId) => {
    try {
      await api.post(`/games/${gameId}/join`);
      alert('报名成功！');
      loadGames();
    } catch (err) {
      alert(err.response?.data?.error || '报名失败');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="row">
          <div>
            <label>运动类型</label>
            <select value={filter.sport_type} onChange={(e) => setFilter({ ...filter, sport_type: e.target.value })}>
              {sportTypes.map(s => (
                <option key={s.value} value={s.value}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>状态</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">全部</option>
              <option value="recruiting">招募中</option>
              <option value="confirmed">已成局</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          {canCreate && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => navigate('/create-game')}>+ 发起约球</button>
            </div>
          )}
        </div>
      </div>

      {games.map(game => (
        <div key={game.id} className="game-item">
          <div className="game-header">
            <span className="game-title" onClick={() => navigate(`/games/${game.id}`)} style={{ cursor: 'pointer' }}>
              {game.title}
            </span>
            {getStatusBadge(game.status)}
          </div>
          <div className="game-meta">
            🎯 发起人：{game.organizer_name} | 🏟️ {game.venue_name} - {game.court_name}
          </div>
          <div className="game-meta">
            🕐 {game.date} {game.start_time}-{game.end_time} | 👥 {game.member_count}/{game.max_players} 人
          </div>
          <div className="game-meta">
            ⭐ 等级要求：Lv.{game.level_required} | 💰 订金 ¥{game.deposit_amount}
            {game.allow_waitlist ? <span className="badge info" style={{ marginLeft: '10px' }}>可候补</span> : null}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(game.member_count / game.max_players) * 100}%` }}></div>
          </div>
          <div style={{ marginTop: '10px' }}>
            {game.status === 'recruiting' && (
              <button className="btn btn-primary" onClick={() => handleJoin(game.id)}>立即报名</button>
            )}
            <button className="btn" onClick={() => navigate(`/games/${game.id}`)}>查看详情</button>
          </div>
        </div>
      ))}

      {games.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#718096' }}>
          暂无球局数据
        </div>
      )}
    </div>
  );
}

export default GameList;
