import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, roomsAPI } from '../api/client';

const MOCK_USER_ID = 'user_001';

function FollowingRoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFollowingRooms = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getFollowingRooms(MOCK_USER_ID);
      setRooms(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || '获取好友房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowingRooms();
  }, []);

  const handleRoomClick = async (room) => {
    try {
      await roomsAPI.joinRoom(room.id, MOCK_USER_ID);
      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Join room error:', err);
      alert('加入房间失败，请重试');
    }
  };

  return (
    <div>
      <header className="header">
        <h1>👥 和朋友一起玩</h1>
        <p style={{ opacity: 0.7, fontSize: 14 }}>查看好友正在进行的游戏</p>
      </header>

      <div className="following-rooms-section">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : error ? (
          <div className="error">
            {error}
            <button 
              onClick={fetchFollowingRooms}
              style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              重试
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty">暂无好友在游戏中，快去邀请好友吧！</div>
        ) : (
          rooms.map(room => (
            <div 
              key={room.id} 
              className="room-card"
              onClick={() => handleRoomClick(room)}
              style={{ marginBottom: 12 }}
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
          ))
        )}
      </div>
    </div>
  );
}

export default FollowingRoomsPage;
