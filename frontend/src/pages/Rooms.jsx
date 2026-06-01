import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../api';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [activeType, setActiveType] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRoomTypes();
    loadRooms();
  }, []);

  const loadRoomTypes = async () => {
    try {
      const res = await roomAPI.getRoomTypes();
      setRoomTypes(res.data);
    } catch (error) {
      console.error('加载房间类型失败', error);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await roomAPI.getRooms(activeType ? { type: activeType } : {});
      setRooms(res.data);
    } catch (error) {
      console.error('加载房间失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  return (
    <div>
      <div className="header">
        <h1>房间</h1>
        <span style={{ cursor: 'pointer' }} onClick={handleCreateRoom}>➕</span>
      </div>

      <div className="container">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            className={activeType === null ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
            onClick={() => { setActiveType(null); loadRooms(); }}
          >
            全部
          </button>
          {roomTypes.map(type => (
            <button
              key={type.type}
              className={activeType === type.type ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '8px 16px', fontSize: '12px' }}
              onClick={() => { setActiveType(type.type); loadRooms(); }}
            >
              {type.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎤</div>
            <p>还没有房间，快来创建第一个吧</p>
          </div>
        ) : (
          rooms.map(room => (
            <div 
              key={room.id} 
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>🎤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{room.name}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {room.type} · {room.current_members || 0}/{room.max_members} 人
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rooms;
