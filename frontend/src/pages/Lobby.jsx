import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playerApi, matchApi } from '../api';
import { usePlayer } from '../App';

function Lobby() {
  const { currentPlayer, setCurrentPlayer } = usePlayer();
  const navigate = useNavigate();
  const [queueStatus, setQueueStatus] = useState(null);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [matchConfig, setMatchConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lastRequestId, setLastRequestId] = useState(null);

  useEffect(() => {
    loadConfig();
    if (currentPlayer) {
      refreshQueueStatus();
      const interval = setInterval(refreshQueueStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPlayer?.id]);

  const loadConfig = async () => {
    try {
      const response = await matchApi.getConfig();
      if (response.data.success) {
        setMatchConfig(response.data.data);
      }
    } catch (err) {
      console.error('加载配置失败:', err);
    }
  };

  const refreshQueueStatus = async () => {
    if (!currentPlayer) return;
    try {
      const response = await matchApi.getQueueStatus(currentPlayer.id);
      if (response.data.success) {
        setQueueStatus(response.data.data.queueStatus);
        setWaitingPlayers(response.data.data.waitingPlayers || []);
        
        if (response.data.data.queueStatus) {
          if (response.data.data.queueStatus.status === 'matched') {
            setMessage({ type: 'success', text: '匹配成功！正在跳转...' });
          }
        }
      }
    } catch (err) {
      console.error('刷新队列状态失败:', err);
    }
  };

  const handleJoinQueue = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await matchApi.joinQueue(currentPlayer.id);
      if (response.data.success) {
        setMessage({ type: 'success', text: `已加入匹配队列，请求ID: ${response.data.requestId}` });
        setLastRequestId(response.data.requestId);
        await refreshQueueStatus();
      } else {
        setMessage({ type: 'error', text: response.data.error || '加入队列失败' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || '加入队列失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await matchApi.leaveQueue(currentPlayer.id);
      if (response.data.success) {
        setMessage({ type: 'success', text: `已离开匹配队列，请求ID: ${response.data.requestId}` });
        setLastRequestId(response.data.requestId);
        setQueueStatus(null);
      } else {
        setMessage({ type: 'error', text: response.data.error || '离开队列失败' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || '离开队列失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPlayer = async () => {
    try {
      const response = await playerApi.get(currentPlayer.id);
      if (response.data.success) {
        setCurrentPlayer(response.data.data);
      }
    } catch (err) {
      console.error('刷新玩家信息失败:', err);
    }
  };

  return (
    <div>
      <div className="grid grid-2">
        <div className="card">
          <h2 className="card-title">我的信息</h2>
          <div className="player-card">
            <div style={{ marginBottom: '1rem' }}>
              <span className="tier-badge tier-{currentPlayer.tier}" style={{ marginRight: '0.5rem' }}>
                {currentPlayer.tier_name}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentPlayer.name}</span>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div>
                <div className="stat-label">战力</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{currentPlayer.power}</div>
              </div>
              <div>
                <div className="stat-label">积分</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{currentPlayer.score}</div>
              </div>
              <div>
                <div className="stat-label">胜率</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{currentPlayer.win_rate}%</div>
              </div>
              <div>
                <div className="stat-label">战绩</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                  {currentPlayer.win_count}胜 / {currentPlayer.lose_count}负
                </div>
              </div>
            </div>
            <button className="btn btn-secondary mt-4" onClick={handleRefreshPlayer}>
              刷新信息
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">匹配操作</h2>
          
          {message.text && (
            <div className={`alert alert-${message.type === 'error' ? 'error' : message.type === 'success' ? 'info' : 'warning'}`}>
              {message.text}
            </div>
          )}

          {queueStatus ? (
            <div>
              <div className="alert alert-info">
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  当前状态: <span className="status-badge status-waiting">等待匹配中</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                  排队中... 已有 {waitingPlayers.length} 人在等待
                </div>
                {queueStatus.joined_at && (
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    加入时间: {new Date(queueStatus.joined_at).toLocaleString()}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <div className="loading-spinner pulse"></div>
              </div>
              <p className="text-center text-muted mt-4">正在为您寻找合适的对手...</p>
              <div className="text-center mt-4">
                <button className="btn btn-danger" onClick={handleLeaveQueue} disabled={loading}>
                  {loading ? '处理中...' : '取消匹配'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-muted mb-4">
                点击按钮开始匹配，系统将为您寻找段位、战力、胜率相近的对手
              </div>
              <button className="btn btn-primary" onClick={handleJoinQueue} disabled={loading} style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                {loading ? '处理中...' : '🎮 开始匹配'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">匹配规则</h2>
        <div className="grid grid-2">
          <div className="player-card">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>段位限制</div>
            <div className="stat-value">段位差 ≤ 1</div>
            <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              青铜只能匹配青铜或白银，白银只能匹配青铜、白银或黄金，以此类推
            </div>
          </div>
          <div className="player-card">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>战力限制</div>
            <div className="stat-value">战力差 ≤ {matchConfig?.powerDiffLimit || 100}</div>
            <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              双方战力差距不能超过配置值，确保实力相当
            </div>
          </div>
          <div className="player-card">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>胜率限制</div>
            <div className="stat-value">胜率差 ≤ {matchConfig?.winRateLimit || 5.0}%</div>
            <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              双方综合胜率差距不能超过5%，确保公平竞技
            </div>
          </div>
          <div className="player-card">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>队列超时</div>
            <div className="stat-value">{matchConfig?.queueExpireSeconds || 300}秒</div>
            <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              超过时间未匹配成功，自动离开队列
            </div>
          </div>
        </div>
      </div>

      {waitingPlayers.length > 0 && (
        <div className="card">
          <h2 className="card-title">等待中的玩家 ({waitingPlayers.length}人)</h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {waitingPlayers.map((player, index) => (
              <div key={player.id || index} className="player-card">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="tier-badge tier-{player.tier}" style={{ marginRight: '0.5rem' }}>
                      段位{player.tier}
                    </span>
                    <span className="stat-value">战力: {player.power}</span>
                    <span className="text-muted" style={{ marginLeft: '1rem' }}>
                      胜率: {typeof player.win_rate === 'number' ? player.win_rate.toFixed(1) : player.win_rate}%
                    </span>
                  </div>
                  <span className="status-badge status-waiting">等待中</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastRequestId && (
        <div className="card">
          <h2 className="card-title">最近操作</h2>
          <div className="text-muted">
            请求ID: <span className="text-primary">{lastRequestId}</span>
            <span style={{ marginLeft: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/trace')}
              >
                查看单据详情 →
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lobby;