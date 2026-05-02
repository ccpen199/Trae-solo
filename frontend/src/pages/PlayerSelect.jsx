import React, { useState, useEffect } from 'react';
import { playerApi } from '../api';
import { usePlayer } from '../App';

function PlayerSelect() {
  const { loginPlayer } = usePlayer();
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await playerApi.list();
      if (response.data.success) {
        setPlayers(response.data.data);
      }
    } catch (err) {
      console.error('加载玩家列表失败:', err);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      setError('请输入玩家名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await playerApi.create(newPlayerName.trim());
      if (response.data.success) {
        loginPlayer(response.data.data);
      } else {
        setError(response.data.error || '创建失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = (player) => {
    loginPlayer(player);
  };

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 className="card-title text-center">选择或创建玩家</h2>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleCreatePlayer} className="mb-4">
          <div className="form-group">
            <label className="form-label">创建新玩家</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入玩家名称"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? '创建中...' : '创建并登录'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
          <h3 className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>选择已有玩家</h3>
          {players.length === 0 ? (
            <p className="text-muted text-center">暂无玩家，请创建一个</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {players.map((player) => (
                <div
                  key={player.id}
                  className="player-card"
                  onClick={() => handleSelectPlayer(player)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="tier-badge tier-{player.tier}" style={{ marginRight: '0.5rem' }}>
                        {player.tier_name}
                      </span>
                      <span style={{ fontWeight: 600 }}>{player.name}</span>
                    </div>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, auto)', gap: '1rem' }}>
                      <div>
                        <span className="stat-label">战力</span>
                        <span className="stat-value" style={{ marginLeft: '0.5rem' }}>{player.power}</span>
                      </div>
                      <div>
                        <span className="stat-label">胜率</span>
                        <span className="stat-value" style={{ marginLeft: '0.5rem' }}>{player.win_rate}%</span>
                      </div>
                      <div>
                        <span className="stat-label">积分</span>
                        <span className="stat-value" style={{ marginLeft: '0.5rem' }}>{player.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerSelect;