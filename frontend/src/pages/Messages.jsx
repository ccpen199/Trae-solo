import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import request from '../utils/request';
import Loading from '../components/Loading';
import useStore from '../store/useStore';

const Messages = () => {
  const { user } = useStore(state => ({ user: state.user }));
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState({});

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await request.get('/messages/conversations');
      setConversations(res.data || getMockConversations());
    } catch (error) {
      setConversations(getMockConversations());
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await request.get('/messages/unread-count');
      setUnreadCount(res.data || { messages: 3, notifications: 5, total: 8 });
    } catch (error) {
      setUnreadCount({ messages: 3, notifications: 5, total: 8 });
    }
  };

  const getMockConversations = () => {
    const convs = [];
    const names = ['B站官方', '系统通知', 'UP主小助手', '好友1号', '好友2号'];
    for (let i = 0; i < 5; i++) {
      convs.push({
        id: i + 1,
        from_user_id: i + 100,
        to_user_id: user?.id || 1,
        content: ['恭喜你成为正式会员！', '您的视频已审核通过', '投稿有新的评论啦', '在吗？求个三连', '一起看视频吗'][i],
        from_nickname: names[i],
        from_avatar: `https://i.pravatar.cc/100?img=${i + 50}`,
        is_read: i > 2,
        created_at: Date.now() / 1000 - Math.random() * 86400
      });
    }
    return convs;
  };

  const formatTime = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>💬 消息</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>会话列表</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '40px' }}><Loading /></div>
          ) : (
            <div>
              {conversations.map(conv => (
                <Link
                  key={conv.id}
                  to={`/messages/chat/${conv.from_user_id}`}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    color: 'inherit',
                    backgroundColor: !conv.is_read ? '#f0f7ff' : 'transparent'
                  }}
                >
                  <img
                    src={conv.from_avatar}
                    alt={conv.from_nickname}
                    className="avatar"
                    style={{ width: '48px', height: '48px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{conv.from_nickname}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatTime(conv.created_at)}
                      </span>
                    </div>
                    <p className="text-ellipsis" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {conv.content}
                    </p>
                  </div>
                  {!conv.is_read && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ff4d4f',
                      marginTop: '8px'
                    }} />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>选择一个会话开始聊天</h3>
          <p style={{ color: 'var(--text-muted)' }}>点击左侧列表中的用户开始对话</p>
        </div>
      </div>
    </div>
  );
};

const ChatDetail = () => {
  const { userId } = useParams();
  const { user } = useStore(state => ({ user: state.user }));
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const res = await request.get(`/messages/history/${userId}`);
      setMessages(res.data || getMockMessages());
    } catch (error) {
      setMessages(getMockMessages());
    } finally {
      setLoading(false);
    }
  };

  const getMockMessages = () => {
    const msgs = [];
    const contents = [
      '你好！欢迎来到B站！',
      '请问有什么可以帮助你的？',
      '这是一条测试消息',
      '祝你使用愉快！'
    ];
    for (let i = 0; i < 6; i++) {
      msgs.push({
        id: i + 1,
        from_user_id: i % 2 === 0 ? parseInt(userId) : user?.id || 1,
        content: contents[i % 4],
        created_at: Date.now() / 1000 - (6 - i) * 600
      });
    }
    return msgs;
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const tempMsg = {
      id: Date.now(),
      from_user_id: user?.id || 1,
      content: newMessage,
      created_at: Date.now() / 1000
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>💬 聊天</h1>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={`https://i.pravatar.cc/100?img=${parseInt(userId) + 50}`}
            alt="avatar"
            className="avatar"
            style={{ width: '40px', height: '40px' }}
          />
          <span style={{ fontWeight: 500 }}>用户 {userId}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map(msg => {
            const isMe = msg.from_user_id === user?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: '16px'
                }}
              >
                {!isMe && (
                  <img
                    src={`https://i.pravatar.cc/100?img=${parseInt(userId) + 50}`}
                    alt="avatar"
                    className="avatar"
                    style={{ width: '36px', height: '36px', marginRight: '12px' }}
                  />
                )}
                <div style={{ maxWidth: '60%' }}>
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    textAlign: isMe ? 'right' : 'left'
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
                {isMe && (
                  <img
                    src={user?.avatar || `https://i.pravatar.cc/100?img=99`}
                    alt="avatar"
                    className="avatar"
                    style={{ width: '36px', height: '36px', marginLeft: '12px' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            className="btn btn-primary"
            style={{ padding: '12px 24px', borderRadius: '20px' }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default () => (
  <Routes>
    <Route path="/" element={<Messages />} />
    <Route path="/chat/:userId" element={<ChatDetail />} />
  </Routes>
);
