import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI, matchesAPI } from '../api/client';

const MOCK_USER_ID = 'user_001';

function HomePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchingTime, setMatchingTime] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('small');
  const [joinRoomId, setJoinRoomId] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRooms(filter);
      setRooms(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || '获取房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  useEffect(() => {
    const checkMatchStatus = async () => {
      try {
        const response = await matchesAPI.getMatchStatus(MOCK_USER_ID);
        if (response.data?.matching) {
          setMatching(true);
          setMatchingTime(response.data.elapsed || 0);
        }
      } catch (err) {
        console.error('Check match status error:', err);
      }
    };

    checkMatchStatus();
    const interval = setInterval(checkMatchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (matching) {
      const timer = setInterval(() => {
        setMatchingTime(t => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [matching]);

  const handleCancelMatch = async () => {
    try {
      await matchesAPI.cancelMatch(MOCK_USER_ID);
      setMatching(false);
      setMatchingTime(0);
    } catch (err) {
      console.error('Cancel match error:', err);
    }
  };

  const handleStartMatch = async (type) => {
    try {
      const response = await matchesAPI.startMatch({
        userId: MOCK_USER_ID,
        type
      });
      
      if (response.data?.matched && response.data?.roomId) {
        navigate(`/room/${response.data.roomId}`);
      } else {
        setMatching(true);
        setMatchingTime(0);
      }
    } catch (err) {
      console.error('Start match error:', err);
      alert('匹配失败，请重试');
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert('请输入房间名称');
      return;
    }

    try {
      const response = await roomsAPI.createRoom({
        name: newRoomName,
        type: newRoomType,
        hostId: MOCK_USER_ID,
        maxPlayers: 8
      });
      
      setShowCreateModal(false);
      setNewRoomName('');
      navigate(`/room/${response.data.id}`);
    } catch (err) {
      console.error('Create room error:', err);
      alert('创建房间失败，请重试');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      alert('请输入房间ID');
      return;
    }

    try {
      await roomsAPI.joinRoom(joinRoomId, MOCK_USER_ID);
      setShowJoinModal(false);
      setJoinRoomId('');
      navigate(`/room/${joinRoomId}`);
    } catch (err) {
      console.error('Join room error:', err);
      alert('加入房间失败，请重试');
    }
  };

  const handleRoomClick = async (room) => {
    try {
      await roomsAPI.joinRoom(room.id, MOCK_USER_ID);
      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Join room error:', err);
      alert('加入房间失败，请重试');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <header className="header">
        <h1>🐢 海龟汤</h1>
        <p style={{ opacity: 0.7, fontSize: 14 }}>推理互动音频游戏</p>
      </header>

      {matching && (
        <div className="matching-bar">
          <span>正在匹配对手... {formatTime(matchingTime)}</span>
          <button className="cancel-btn" onClick={handleCancelMatch}>
            取消
          </button>
        </div>
      )}

      <div className="action-grid">
        <div 
          className="action-card" 
          onClick={() => handleStartMatch('small')}
        >
          <div className="icon">🐣</div>
          <h3>小龟汤</h3>
          <p>新手入门，简单推理</p>
        </div>
        <div 
          className="action-card" 
          onClick={() => handleStartMatch('hard')}
        >
          <div className="icon">🐢</div>
          <h3>老龟汤</h3>
          <p>高难度，烧脑挑战</p>
        </div>
        <div 
          className="action-card" 
          onClick={() => setShowCreateModal(true)}
        >
          <div className="icon">➕</div>
          <h3>创建房间</h3>
          <p>邀请好友一起玩</p>
        </div>
        <div 
          className="action-card" 
          onClick={() => setShowJoinModal(true)}
        >
          <div className="icon">🔑</div>
          <h3>加入房间</h3>
          <p>输入房间ID加入</p>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'recommended' ? 'active' : ''}`}
          onClick={() => setFilter('recommended')}
        >
          推荐
        </button>
        <button 
          className={`filter-tab ${filter === 'hot' ? 'active' : ''}`}
          onClick={() => setFilter('hot')}
        >
          热门
        </button>
        <button 
          className={`filter-tab ${filter === 'available' ? 'active' : ''}`}
          onClick={() => setFilter('available')}
        >
          有空位
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">
          {error}
          <button 
            onClick={fetchRooms}
            style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            重试
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty">暂无房间，快来创建第一个吧！</div>
      ) : (
        <div className="rooms-list">
          {rooms.map(room => (
            <div 
              key={room.id} 
              className="room-card"
              onClick={() => handleRoomClick(room)}
            >
              <div className="room-header">
                <div className="room-info">
                  <h3>{room.name}</h3>
                  <span className="room-type">
                    {room.type === 'small' ? '小龟汤' : '老龟汤'}
                  </span>
                </div>
                <div className="host-info">
                  <div className="host-avatar">
                    {room.host_name?.charAt(0) || '?'}
                  </div>
                  <span className="host-name">{room.host_name}</span>
                </div>
              </div>
              <div className="room-footer">
                <span className="player-count">
                  👥 {room.current_players}/{room.max_players}
                </span>
                <span className={`status-badge ${room.status}`}>
                  {room.status === 'waiting' ? '等待中' : '进行中'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">创建房间</h2>
            <div className="form-group">
              <label>房间名称</label>
              <input 
                type="text" 
                className="form-input"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="请输入房间名称"
              />
            </div>
            <div className="form-group">
              <label>游戏类型</label>
              <select 
                className="form-select"
                value={newRoomType}
                onChange={e => setNewRoomType(e.target.value)}
              >
                <option value="small">小龟汤（简单）</option>
                <option value="hard">老龟汤（困难）</option>
              </select>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel" 
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleCreateRoom}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">加入房间</h2>
            <div className="form-group">
              <label>房间ID</label>
              <input 
                type="text" 
                className="form-input"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value)}
                placeholder="请输入房间ID"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel" 
                onClick={() => setShowJoinModal(false)}
              >
                取消
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleJoinRoom}
              >
                加入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
