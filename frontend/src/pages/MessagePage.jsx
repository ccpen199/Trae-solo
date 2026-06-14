import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function MessagePage({ user }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userId) {
      setSelectedUserId(parseInt(userId));
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/conversation/${userId}`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      await api.post('/messages', {
        receiverId: selectedUserId,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedUserId);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getUserName = (conv) => {
    if (conv.user_name) return conv.user_name;
    return conv.company_name || `用户 ${conv.user_id}`;
  };

  const quickMessages = [
    '您好，请问这个岗位还在招聘吗？',
    '请问薪资待遇具体是怎样的？',
    '我想了解一下工作时间安排',
    '可以约个时间面试吗？',
    '请问包吃住吗？'
  ];

  const handleQuickMessage = (msg) => {
    setNewMessage(msg);
  };

  return (
    <div className="main-layout" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ width: '320px', background: 'white', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>消息中心</div>
          <div className="text-sm text-secondary">与招聘方实时沟通，语音和附件功能开发中</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <p className="text-secondary mb-16">暂无会话</p>
              <p className="text-sm text-secondary">投递岗位后可以与HR在线沟通</p>
              <button 
                className="btn btn-primary btn-sm mt-16"
                onClick={() => navigate('/jobs')}
              >
                去找工作
              </button>
            </div>
          ) : (
            conversations.map((conv, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selectedUserId === conv.user_id ? '#e6f7ff' : 'transparent',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => {
                  setSelectedUserId(conv.user_id);
                  navigate(`/messages/${conv.user_id}`);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>{getUserName(conv)}</span>
                  {conv.unread_count > 0 && (
                    <span className="badge badge-error" style={{ fontSize: '12px' }}>{conv.unread_count}</span>
                  )}
                </div>
                <div className="text-sm text-secondary" style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conv.last_message || '暂无消息'}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                  {conv.last_message_time ? new Date(conv.last_message_time).toLocaleString() : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        {selectedUserId ? (
          <React.Fragment>
            <div style={{
              padding: '16px 20px',
              background: 'white',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600' }}>
                  {getUserName(conversations.find(c => c.user_id === selectedUserId) || {})}
                </div>
                <div className="text-sm text-secondary">在线沟通 · HR 24小时内响应</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" disabled title="语音功能开发中">🎤 语音</button>
                <button className="btn btn-outline btn-sm" disabled title="附件功能开发中">📎 附件</button>
              </div>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>👋</div>
                  <p className="text-secondary">开始对话吧</p>
                  <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {quickMessages.map((msg, idx) => (
                      <button
                        key={idx}
                        className="btn btn-outline btn-sm"
                        onClick={() => handleQuickMessage(msg)}
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: msg.sender_id === user?.id ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: msg.sender_id === user?.id ? '#1890ff' : 'white',
                        color: msg.sender_id === user?.id ? 'white' : 'inherit',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <div>{msg.content}</div>
                        <div style={{ 
                          fontSize: '11px', 
                          opacity: 0.7, 
                          marginTop: '4px',
                          textAlign: msg.sender_id === user?.id ? 'right' : 'left'
                        }}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={sendMessage} style={{ 
              padding: '16px 20px', 
              background: 'white', 
              borderTop: '1px solid var(--border-color)', 
              display: 'flex', 
              gap: '8px' 
            }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="输入消息，按回车发送..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">发送</button>
            </form>
          </React.Fragment>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
            <p>选择一个会话开始聊天</p>
            <p className="text-sm text-secondary mt-8">或在岗位详情中点击「在线沟通」</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagePage;
