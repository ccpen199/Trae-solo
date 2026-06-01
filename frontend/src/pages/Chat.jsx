import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI } from '../api';

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await messageAPI.getMessages(userId);
      setMessages(res.data);
    } catch (error) {
      console.error('加载消息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await messageAPI.sendMessage(userId, { content: newMessage });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('发送消息失败', error);
    }
  };

  return (
    <div>
      <div className="header">
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <h1>聊天</h1>
        <span></span>
      </div>

      <div style={{ 
        height: 'calc(100vh - 130px)', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💬</div>
              <p>开始聊天吧</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.sender_id == userId ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: msg.sender_id == userId ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: msg.sender_id == userId ? '#333' : 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #eee' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入消息..."
              style={{ flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: '24px', fontSize: '14px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '24px' }}>
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
