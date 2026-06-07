import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data } = await axios.get('/api/messages/conversations');
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/conversation/${userId}`);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await axios.post('/api/messages', {
        receiverId: selectedConversation.other_user_id,
        type: 'text',
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedConversation.other_user_id);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="page-header">
        <h1 className="page-title">消息中心</h1>
        <p className="page-subtitle">与招聘方/求职者沟通</p>
      </div>

      <div className="card" style={{ height: 'calc(100vh - 200px)', display: 'flex' }}>
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>会话列表</h3>
          </div>
          {conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
              暂无会话
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.other_user_id}
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer',
                  background: selectedConversation?.other_user_id === conv.other_user_id ? '#f9fafb' : 'transparent',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onClick={() => setSelectedConversation(conv)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: '#4f46e5', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {conv.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>
                      {conv.other_user_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {conv.other_user_role === 'company' ? '企业' : conv.other_user_role === 'jobseeker' ? '求职者' : '管理员'}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {conv.last_message_type === 'video' ? '[视频消息]' : conv.last_message?.slice(0, 30)}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: '#4f46e5', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {selectedConversation.other_user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{selectedConversation.other_user_name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>在线</div>
                </div>
              </div>

              <div style={{ 
                flex: 1, 
                padding: '20px', 
                overflowY: 'auto',
                background: '#f9fafb'
              }}>
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: msg.sender_name === selectedConversation.other_user_name ? 'flex-start' : 'flex-end',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ 
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: msg.sender_name === selectedConversation.other_user_name ? 'white' : '#4f46e5',
                      color: msg.sender_name === selectedConversation.other_user_name ? '#374151' : 'white',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {msg.type === 'video' ? (
                        <div>[视频消息]</div>
                      ) : (
                        <div>{msg.content}</div>
                      )}
                      <div style={{ 
                        fontSize: '11px', 
                        marginTop: '4px',
                        opacity: 0.7,
                        textAlign: 'right'
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} style={{ 
                padding: '16px 20px', 
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px'
              }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">
                  发送
                </button>
              </form>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#9ca3af'
            }}>
              选择一个会话开始聊天
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
