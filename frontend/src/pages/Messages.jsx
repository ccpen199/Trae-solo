import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../api';

const Messages = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'chats') {
      loadConversations();
    } else {
      loadNotifications();
    }
  }, [activeTab]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data);
    } catch (error) {
      console.error('加载会话失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await messageAPI.getNotifications();
      setNotifications(res.data);
    } catch (error) {
      console.error('加载通知失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>消息</h1>
        <span></span>
      </div>

      <div className="container">
        <div className="tabs">
          <div className={`tab ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>私聊</div>
          <div className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>通知</div>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            {activeTab === 'chats' && (
              <>
                {conversations.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">💬</div>
                    <p>还没有消息，快去和朋友聊天吧</p>
                  </div>
                ) : (
                  conversations.map((conv, idx) => (
                    <div
                      key={idx}
                      className="card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/chat/${conv.other_user_id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar">{conv.nickname?.charAt(0)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600' }}>{conv.nickname}</span>
                            <span style={{ fontSize: '12px', color: '#999' }}>{conv.last_message_time}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>{conv.last_message || '暂无消息'}</span>
                            {conv.unread_count > 0 && (
                              <span className="badge">{conv.unread_count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">🔔</div>
                    <p>暂无通知</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          🔔
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500' }}>{notif.content}</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {new Date(notif.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
