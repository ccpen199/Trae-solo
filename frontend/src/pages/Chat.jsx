import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request, { showToast } from '../utils/request';
import useAuthStore from '../store/authStore';

function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatInfo, setChatInfo] = useState({});
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await request.get(`/chats/${chatId}/messages`);
      if (res?.success) {
        setMessages(res.data || []);
      }
    } catch (e) {
      showToast('获取消息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await request.post(`/chats/${chatId}/messages`, {
        type: 0,
        content: input.trim()
      });
      if (res?.success) {
        setMessages(prev => [...prev, res.data]);
        setInput('');
      }
    } catch (e) {
      showToast('发送失败');
    } finally {
      setSending(false);
    }
  };

  const sendHeart = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await request.post(`/chats/${chatId}/messages`, {
        type: 2,
        content: '❤️'
      });
      if (res?.success) {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (e) {
      showToast('发送失败');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(time).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="header">
        <div className="header-back" onClick={() => navigate(-1)}>←</div>
        <div className="header-title">{chatInfo.name || '聊天'}</div>
        <div style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowSettings(!showSettings)}>
          ⋮
        </div>
      </div>

      {showSettings && (
        <div style={{ 
          background: '#fff', 
          padding: 16, 
          borderBottom: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 20 }}>🔕</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>免打扰</div>
            </div>
            <div style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 20 }}>📌</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>置顶</div>
            </div>
            <div style={{ textAlign: 'center', cursor: 'pointer', color: '#f5222d' }}>
              <div style={{ fontSize: 20 }}>🗑️</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>删除</div>
            </div>
            <div style={{ textAlign: 'center', cursor: 'pointer', color: '#f5222d' }}>
              <div style={{ fontSize: 20 }}>⚠️</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>投诉</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f5f5f5' }}>
        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const showTime = index === 0 || 
              new Date(msg.created_at) - new Date(messages[index - 1].created_at) > 300000;

            return (
              <div key={msg.id}>
                {showTime && (
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: 12, 
                    color: '#999', 
                    margin: '12px 0' 
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: 16
                }}>
                  {!isMe && (
                    <img
                      src={msg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                      alt="avatar"
                      className="avatar-sm"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: isMe ? 'var(--primary)' : '#fff',
                    color: isMe ? '#fff' : 'var(--text)',
                    wordBreak: 'break-word'
                  }}>
                    {msg.content === '❤️' ? (
                      <span style={{ fontSize: 48 }}>❤️</span>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {isMe && (
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                      alt="avatar"
                      className="avatar-sm"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ 
        padding: '12px 16px', 
        background: '#fff', 
        borderTop: '1px solid var(--border)',
        paddingBottom: 24
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 24, cursor: 'pointer' }}>📷</span>
          <span style={{ fontSize: 24, cursor: 'pointer' }}>😊</span>
          <input
            type="text"
            className="input"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1 }}
          />
          <span 
            style={{ fontSize: 24, cursor: 'pointer' }} 
            onClick={sendHeart}
          >
            ❤️
          </span>
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{ padding: '8px 16px' }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
