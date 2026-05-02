import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchApi } from '../api';
import { usePlayer } from '../App';

function History() {
  const { currentPlayer } = usePlayer();
  const navigate = useNavigate();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentPlayer) {
      loadBattles();
    }
  }, [currentPlayer?.id]);

  const loadBattles = async () => {
    try {
      setLoading(true);
      const response = await matchApi.getPlayerBattles(currentPlayer.id);
      if (response.data.success) {
        setBattles(response.data.data);
      }
    } catch (err) {
      console.error('加载对战历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBattleResult = (battle) => {
    if (!battle.winner_id) return { text: '未结束', class: 'status-pending' };
    if (battle.winner_id === currentPlayer.id) {
      return { text: '胜利', class: 'status-success' };
    }
    return { text: '失败', class: 'status-failed' };
  };

  const getOpponent = (battle) => {
    if (battle.player1_id === currentPlayer.id) {
      return battle.player2;
    }
    return battle.player1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title" style={{ marginBottom: 0 }}>对战历史</h2>
          <button className="btn btn-secondary" onClick={loadBattles}>
            刷新
          </button>
        </div>

        {battles.length === 0 ? (
          <div className="text-center text-muted p-4">
            <p>暂无对战记录</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>
              去匹配
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {battles.map((battle) => {
              const result = getBattleResult(battle);
              const opponent = getOpponent(battle);
              return (
                <div 
                  key={battle.id} 
                  className="player-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/battle/${battle.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`status-badge ${result.class}`} style={{ marginRight: '0.75rem' }}>
                        {result.text}
                      </span>
                      <span className="stat-value">
                        VS {opponent?.name || '未知玩家'}
                      </span>
                      <span className="text-muted" style={{ marginLeft: '1rem' }}>
                        ({opponent?.tier_name || '未知段位'})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="stat-value">
                        战力差: {battle.power_diff} | 胜率差: {battle.win_rate_diff}%
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                        {new Date(battle.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2" style={{ fontSize: '0.875rem' }}>
                    <span className="status-badge">
                      我的战力: {battle.player1_id === currentPlayer.id ? battle.player1_power : battle.player2_power}
                    </span>
                    <span className="status-badge">
                      对手战力: {battle.player1_id === currentPlayer.id ? battle.player2_power : battle.player1_power}
                    </span>
                    <span className={`status-badge status-${battle.status}`}>
                      状态: {battle.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">战绩统计</h2>
        <div className="grid grid-2">
          <div className="player-card text-center">
            <div className="stat-label">总场次</div>
            <div className="stat-value" style={{ fontSize: '2rem' }}>{battles.length}</div>
          </div>
          <div className="player-card text-center">
            <div className="stat-label">胜 / 负</div>
            <div className="stat-value" style={{ fontSize: '2rem' }}>
              <span className="text-success">{battles.filter(b => b.winner_id === currentPlayer.id).length}</span>
              <span className="text-muted" style={{ margin: '0 0.5rem' }}>/</span>
              <span className="text-danger">{battles.filter(b => b.winner_id && b.winner_id !== currentPlayer.id).length}</span>
            </div>
          </div>
          <div className="player-card text-center">
            <div className="stat-label">胜率</div>
            <div className="stat-value" style={{ fontSize: '2rem' }}>
              {battles.length > 0 
                ? ((battles.filter(b => b.winner_id === currentPlayer.id).length / battles.length) * 100).toFixed(1)
                : 50.0}%
            </div>
          </div>
          <div className="player-card text-center">
            <div className="stat-label">平均战力差</div>
            <div className="stat-value" style={{ fontSize: '2rem' }}>
              {battles.length > 0 
                ? (battles.reduce((sum, b) => sum + b.power_diff, 0) / battles.length).toFixed(0)
                : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;