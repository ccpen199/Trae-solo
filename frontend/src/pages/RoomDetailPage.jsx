import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsAPI, messagesAPI } from '../api/client';

const MOCK_USER_ID = 'user_001';

function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [micEnabled, setMicEnabled] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [memberMicStatus, setMemberMicStatus] = useState({});

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRoom(id);
      setRoom(response.data);
      setMessages(response.data.messages || []);
      setError(null);
    } catch (err) {
      setError(err.message || '获取房间详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetail();
    const interval = setInterval(fetchRoomDetail, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (room?.members) {
      const initialStatus = {};
      room.members.forEach((member, index) => {
        if (member.id !== MOCK_USER_ID) {
          initialStatus[member.id] = index % 2 === 0;
        }
      });
      setMemberMicStatus(initialStatus);
    }
  }, [room]);

  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [recordingInterval]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await messagesAPI.sendMessage({
        roomId: id,
        userId: MOCK_USER_ID,
        content: newMessage,
        type: 'chat'
      });
      setNewMessage('');
      fetchRoomDetail();
    } catch (err) {
      console.error('Send message error:', err);
      alert('发送消息失败，请重试');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await roomsAPI.leaveRoom(id, MOCK_USER_ID);
      navigate('/');
    } catch (err) {
      console.error('Leave room error:', err);
      navigate('/');
    }
  };

  const toggleMic = () => {
    if (!micEnabled) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            setMicEnabled(true);
            setMemberMicStatus(prev => ({ ...prev, [MOCK_USER_ID]: true }));
          })
          .catch(() => {
            alert('无法访问麦克风，请检查权限设置');
          });
      } else {
        setMicEnabled(true);
        setMemberMicStatus(prev => ({ ...prev, [MOCK_USER_ID]: true }));
      }
    } else {
      setMicEnabled(false);
      setMemberMicStatus(prev => ({ ...prev, [MOCK_USER_ID]: false }));
    }
  };

  const toggleSpeaker = () => {
    setSpeakerEnabled(!speakerEnabled);
  };

  const startRecording = () => {
    if (!micEnabled) {
      alert('请先开启麦克风');
      return;
    }
    setIsRecording(true);
    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
    setRecordingInterval(interval);
  };

  const stopRecording = () => {
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    if (recordingTime > 0) {
      const timeStr = formatTime(recordingTime);
      const voiceMsg = {
        id: Date.now(),
        nickname: '海龟达人',
        content: `🎤 语音消息 (${timeStr})`,
        type: 'voice',
        duration: recordingTime,
        created_at: Math.floor(Date.now() / 1000)
      };
      setMessages(prev => [...prev, voiceMsg]);
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playVoiceMessage = (msg) => {
    if (!speakerEnabled) {
      alert('请先开启扬声器');
      return;
    }
    alert(`正在播放语音消息，时长：${formatTime(msg.duration || 5)}秒`);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error || !room) {
    return (
      <div className="error">
        {error || '房间不存在'}
        <button 
          onClick={() => navigate('/')}
          style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="room-detail-page">
      <div className="room-detail-header">
        <button className="back-btn" onClick={handleLeaveRoom}>
          ←
        </button>
        <div>
          <h2>{room.name}</h2>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            {room.type === 'small' ? '小龟汤' : '老龟汤'} · {room.current_players}/{room.max_players}人
          </p>
        </div>
      </div>

      {room.story_title && (
        <div className="story-content">
          <h3>📖 {room.story_title}</h3>
          <p>{room.story_content}</p>
        </div>
      )}

      <div className="members-section">
        <h4>👥 房间成员 ({room.members?.length || 0})</h4>
        <div className="members-grid">
          {room.members?.map(member => (
            <div key={member.id} className="member-item">
              <div style={{ position: 'relative' }}>
                <div className="member-avatar" style={{
                  background: memberMicStatus[member.id] 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : undefined
                }}>
                  {member.nickname?.charAt(0) || '?'}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  background: memberMicStatus[member.id] ? '#10b981' : '#6b7280',
                  border: '2px solid #1a1a2e'
                }}>
                  {memberMicStatus[member.id] ? '🎤' : '🔇'}
                </div>
              </div>
              <span className="member-name">
                {member.nickname}
                {member.role === 'host' && ' 👑'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="empty">还没有消息，快来发送第一条吧！</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="message-item">
              <div className="message-avatar">
                {msg.nickname?.charAt(0) || '?'}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name">{msg.nickname}</span>
                  <span className="message-time">
                    {new Date(msg.created_at * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.type === 'voice' ? (
                  <div 
                    className="message-bubble"
                    onClick={() => playVoiceMessage(msg)}
                    style={{ 
                      cursor: 'pointer',
                      minWidth: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🔊</span>
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <div className="message-bubble">{msg.content}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isRecording && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          padding: '12px 24px',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 100
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fff',
            animation: 'recording-pulse 1s infinite'
          }} />
          <span style={{ color: '#fff', fontWeight: 'bold' }}>
            正在录音 {formatTime(recordingTime)}
          </span>
        </div>
      )}

      <div style={{
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={toggleMic}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: micEnabled 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              : 'rgba(255,255,255,0.1)',
            transition: 'all 0.2s'
          }}
          title={micEnabled ? '关闭麦克风' : '开启麦克风'}
        >
          {micEnabled ? '🎤' : '🔇'}
        </button>

        <button
          onClick={toggleSpeaker}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: speakerEnabled 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'rgba(255,255,255,0.1)',
            transition: 'all 0.2s'
          }}
          title={speakerEnabled ? '关闭扬声器' : '开启扬声器'}
        >
          {speakerEnabled ? '🔊' : '🔇'}
        </button>

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: isRecording 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : 'rgba(255,255,255,0.1)',
            transition: 'all 0.2s'
          }}
          title={isRecording ? '松开发送' : '按住说话'}
        >
          🎙️
        </button>

        <input
          type="text"
          className="message-input"
          placeholder="输入消息..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          style={{ margin: 0 }}
        />

        <button className="send-btn" onClick={handleSendMessage}>
          📤
        </button>
      </div>
    </div>
  );
}

export default RoomDetailPage;
