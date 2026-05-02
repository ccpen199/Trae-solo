import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchApi, playerApi } from '../api';
import { usePlayer } from '../App';

function Battle() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { currentPlayer, setCurrentPlayer } = usePlayer();
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (battleId) {
      loadBattle();
    }
  }, [battleId]);

  const loadBattle = async () => {
    try {
      setLoading(true);
      const response = await matchApi.getBattle(battleId);
      if (response.data.success) {
        setBattle(response.data.data);
      } else {
        setError(response.data.error || '加载对战失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '加载对战失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBattle = async () => {
    try {
      const response = await matchApi.startBattle(battleId);
      if (response.data.success) {
        await loadBattle();
      }
    } catch (err) {
      console.error('开始对战失败:', err);
    }
  };

  const handleEndBattle = async (winnerId) => {
    try {
      const response = await matchApi.endBattle(battleId, winnerId);
      if (response.data.success) {
        await loadBattle();
        if (currentPlayer) {
          const playerResponse = await playerApi.get(currentPlayer.id);
          if (playerResponse.data.success) {
            setCurrentPlayer(playerResponse.data.data);
          }
        }
      }
    } catch (err) {
      console.error('结束对战失败:', err);
    }
  };

  const isMyBattle = battle && (battle.player1_id === currentPlayer?.id || battle.player2_id === currentPlayer?.id);
  const amIPlayer1 = battle && battle.player1_id === currentPlayer?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || '对战不存在'}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          返回大厅
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title" style={{ marginBottom: 0 }}>对战详情</h2>
          <div className="flex gap-2">
            <span className={`status-badge status-${battle.status}`}>
              {battle.status === 'ready' ? '准备开始' : 
               battle.status === 'playing' ? '进行中' : 
               battle.status === 'finished' ? '已结束' : battle.status}
            </span>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              返回大厅
            </button>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
          <div className="player-card" style={{ border: `2px solid ${amIPlayer1 ? '#3b82f6' : 'rgba(255,255,255,0.1)'}` }}>
            <div className="text-center">
              {battle.player1 && (
                <>
                  <div className="tier-badge tier-{battle.player1?.tier}" style={{ marginBottom: '0.5rem' }}>
                    {battle.player1?.tier_name}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {battle.player1?.name}
                    {amIPlayer1 && <span style={{ color: '#60a5fa', fontSize: '0.875rem', marginLeft: '0.5rem' }}>(你)</span>}
                  </div>
                  <div className="stats-grid">
                    <div>
                      <div className="stat-label">战力</div>
                      <div className="stat-value">{battle.player1_power}</div>
                    </div>
                    <div>
                      <div className="stat-label">胜率</div>
                      <div className="stat-value">{battle.player1_win_rate}%</div>
                    </div>
                  </div>
                  {battle.winner_id === battle.player1_id && (
                    <div className="text-success mt-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      🏆 胜利者
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="vs-text">VS</span>
          </div>

          <div className="player-card" style={{ border: `2px solid ${!amIPlayer1 && isMyBattle ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }}>
            <div className="text-center">
              {battle.player2 && (
                <>
                  <div className="tier-badge tier-{battle.player2?.tier}" style={{ marginBottom: '0.5rem' }}>
                    {battle.player2?.tier_name}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {battle.player2?.name}
                    {!amIPlayer1 && isMyBattle && <span style={{ color: '#f87171', fontSize: '0.875rem', marginLeft: '0.5rem' }}>(你)</span>}
                  </div>
                  <div className="stats-grid">
                    <div>
                      <div className="stat-label">战力</div>
                      <div className="stat-value">{battle.player2_power}</div>
                    </div>
                    <div>
                      <div className="stat-label">胜率</div>
                      <div className="stat-value">{battle.player2_win_rate}%</div>
                    </div>
                  </div>
                  {battle.winner_id === battle.player2_id && (
                    <div className="text-success mt-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      🏆 胜利者
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="alert alert-info">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="text-center">
              <div className="stat-label">战力差</div>
              <div className="stat-value">{battle.power_diff}</div>
            </div>
            <div className="text-center">
              <div className="stat-label">胜率差</div>
              <div className="stat-value">{battle.win_rate_diff}%</div>
            </div>
            <div className="text-center">
              <div className="stat-label">匹配时间</div>
              <div className="stat-value">{new Date(battle.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {battle.status === 'ready' && (
          <div className="text-center mt-4">
            <button className="btn btn-success" onClick={handleStartBattle}>
              开始对战
            </button>
          </div>
        )}

        {battle.status === 'playing' && (
          <div className="text-center mt-4">
            <p className="text-muted mb-4">选择获胜者结束对战</p>
            <div className="flex justify-center gap-4">
              <button 
                className="btn btn-primary"
                onClick={() => handleEndBattle(battle.player1_id)}
              >
                {battle.player1?.name} 获胜
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleEndBattle(battle.player2_id)}
              >
                {battle.player2?.name} 获胜
              </button>
            </div>
          </div>
        )}

        {battle.status === 'finished' && (
          <div className="alert alert-info text-center mt-4">
            <div>
              对战结束于: {battle.ended_at ? new Date(battle.ended_at).toLocaleString() : '未知'}
            </div>
            <div className="text-muted mt-2">
              胜利者: {battle.winner_id === battle.player1_id ? battle.player1?.name : battle.player2?.name}
            </div>
            <div className="text-muted mt-1">
              积分变化: 胜利者 +25, 失败者 -15
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Battle;