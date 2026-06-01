import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const Meeting: React.FC = () => {
  const { meetingNumber } = useParams<{ meetingNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMeeting();
    const interval = setInterval(() => {
      loadParticipants();
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [meetingNumber]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMeeting = async () => {
    try {
      const response = await apiClient.get(`/meetings/${meetingNumber}`);
      setMeeting(response.data);
      setParticipants(response.data.participants || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await apiClient.get(`/meetings/participants/${meeting?.id}`);
      setParticipants(response.data);
    } catch (err) {}
  };

  const loadMessages = async () => {
    try {
      const response = await apiClient.get(`/meetings/chat/${meeting?.id}`);
      setMessages(response.data);
    } catch (err) {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await apiClient.post(`/meetings/chat/${meeting?.id}`, {
        content: newMessage
      });
      setNewMessage('');
      loadMessages();
    } catch (err) {}
  };

  const leaveMeeting = async () => {
    try {
      await apiClient.post(`/meetings/${meetingNumber}/leave`);
    } catch (err) {
      // 忽略错误，继续退出
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        正在加入会议...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        会议不存在或已结束
        <div className="mt-20">
          <button className="btn btn-primary" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    );
  }

  const isHost = !!participants.find(p => p.user_id === user?.id && p.role === 'host');

  return (
    <div className="in-meeting">
      <div className="participant-panel">
        <h4 style={{ marginBottom: '16px' }}>参会人 ({participants.length})</h4>
        {participants.map((p) => (
          <div key={p.id} className="participant-item">
            <div className="participant-avatar">{p.username[0]?.toUpperCase()}</div>
            <span style={{ fontSize: '14px' }}>{p.username}</span>
            {p.role === 'host' && <span className="host-badge">主持人</span>}
          </div>
        ))}
      </div>

      <div className="meeting-content">
        <div style={{ padding: '16px', color: 'white', background: 'rgba(0,0,0,0.3)' }}>
          <h3>{meeting.title}</h3>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>会议号：{meeting.meeting_number}</p>
        </div>
        <div className="video-grid">
          {participants.map((p) => (
            <div key={p.id} className="video-tile">
              <div className="video-avatar">{p.username[0]?.toUpperCase()}</div>
              <span style={{ marginTop: '8px' }}>{p.username}</span>
              {p.role === 'host' && <span className="host-badge" style={{ marginTop: '4px' }}>主持人</span>}
            </div>
          ))}
        </div>
        <div className="meeting-controls">
          <button
            type="button"
            className={`control-btn ${audioMuted ? '' : 'muted'}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAudioMuted(!audioMuted); }}
            title={audioMuted ? '开启麦克风' : '关闭麦克风'}
          >
            {audioMuted ? '🎤' : '🔇'}
          </button>
          <button
            type="button"
            className={`control-btn ${videoMuted ? '' : 'muted'}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVideoMuted(!videoMuted); }}
            title={videoMuted ? '开启摄像头' : '关闭摄像头'}
          >
            {videoMuted ? '📹' : '📵'}
          </button>
          <button 
            type="button"
            className="control-btn" 
            style={{ background: '#52c41a' }} 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            title="共享屏幕"
          >
            📺
          </button>
          {isHost && (
            <button 
              type="button"
              className="control-btn" 
              style={{ background: '#faad14' }} 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              title="管理成员"
            >
              👥
            </button>
          )}
          {user?.plan === 'pro' && (
            <button 
              type="button"
              className="control-btn" 
              style={{ background: '#722ed1' }} 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              title="云录制"
            >
              ⏺
            </button>
          )}
          <button 
            type="button"
            className="control-btn" 
            style={{ background: '#ff4d4f' }} 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); leaveMeeting(); }}
            title="离开会议"
          >
            📞
          </button>
        </div>
      </div>

      <div className="chat-panel">
        <h4 style={{ marginBottom: '16px' }}>会议聊天</h4>
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          {messages.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '20px' }}>暂无消息</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <div className="chat-username">{msg.username}</div>
                <div className="chat-content">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), sendMessage())}
            placeholder="输入消息..."
            style={{ flex: 1 }}
          />
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={(e) => { e.preventDefault(); sendMessage(); }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
