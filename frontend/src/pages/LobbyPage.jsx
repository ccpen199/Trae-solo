import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function LobbyPage({ user, onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    const result = await api.getRooms();
    if (result.rooms) {
      setRooms(result.rooms);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    setCreatingRoom(true);
    const result = await api.createRoom(user.id, newRoomName.trim());
    if (result.success) {
      onEnterRoom(result.room);
    }
    setCreatingRoom(false);
  };

  const handleJoinRoom = async (room) => {
    if (room.player1Id === user.id) {
      onEnterRoom(room);
      return;
    }
    
    const result = await api.joinRoom(room.id, user.id);
    if (result.success) {
      onEnterRoom(result.room);
    }
  };

  const getPlayerCount = (room) => {
    let count = 0;
    if (room.player1Id) count++;
    if (room.player2Id) count++;
    return count;
  };

  return (
    <div className="two-column">
      <div>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>🏠 创建房间</h3>
          <form onSubmit={handleCreateRoom}>
            <div className="form-group">
              <label>房间名称</label>
              <input
                type="text"
                className="input"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="输入房间名称..."
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={creatingRoom || !newRoomName.trim()}
            >
              {creatingRoom ? '创建中...' : '创建房间'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>🎮 游戏说明</h3>
          <ul style={{ lineHeight: '1.8', color: '#666' }}>
            <li>支持五子棋对战</li>
            <li>先连成五颗同色棋子获胜</li>
            <li>黑棋先行</li>
            <li>双方轮流落子</li>
          </ul>
        </div>
      </div>

      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>🏟️ 房间列表</h3>
            <button 
              className="btn btn-secondary"
              onClick={fetchRooms}
              disabled={loading}
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>

          {loading && <p style={{ textAlign: 'center', color: '#999' }}>加载中...</p>}
          
          {!loading && rooms.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
              暂无等待中的房间，创建一个吧！
            </p>
          )}

          {!loading && rooms.length > 0 && (
            <div className="room-list">
              {rooms.map(room => (
              <div key={room.id} className="room-item">
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    {room.name}
                  </strong>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    人数: {getPlayerCount(room)}/2
                    {room.player1Ready && ' | 玩家1已准备'}
                    {room.player2Ready && ' | 玩家2已准备'}
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleJoinRoom(room)}
                  disabled={getPlayerCount(room) >= 2 && room.player1Id !== user.id}
                >
                  {room.player1Id === user.id ? '重新进入' : 
                   getPlayerCount(room) >= 2 ? '已满' : '加入'}
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LobbyPage;