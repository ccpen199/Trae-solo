import React, { useState, useEffect, useCallback, useRef } from 'react';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 172800000) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
};

const StatusIcon = ({ status }) => {
  if (status === 'sending') {
    return (
      <span className="status-icon status-sending">⟳</span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="status-icon status-failed">!</span>
    );
  }
  return null;
};

const ConversationItem = ({ conversation, isActive, onClick, currentUserId }) => {
  const members = conversation.member_names?.split(',') || [];
  const avatars = conversation.member_avatars?.split(',') || [];
  
  const otherMembers = members.filter((_, idx) => {
    const memberAvatars = avatars[idx];
    return !memberAvatars?.includes(`seed=${currentUserId === 1 ? 'zhangsan' : currentUserId === 2 ? 'lisi' : currentUserId === 3 ? 'wangwu' : 'zhaoliu'}`);
  });
  
  const displayName = conversation.name || otherMembers[0] || '单聊会话';
  const displayAvatar = avatars[0] || '';

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''} ${!!conversation.is_pinned ? 'pinned' : ''} ${!!conversation.is_muted ? 'muted' : ''}`}
      onClick={() => onClick(conversation)}
    >
      <div className="conversation-item-content">
        <div className="conversation-avatar">
          <img src={displayAvatar} alt="avatar" />
        </div>
        <div className="conversation-info">
          <div className="conversation-title-row">
            <span className="conversation-name">
              {displayName}
              {!!conversation.is_muted && <span> 🔇</span>}
            </span>
            <span className="conversation-time">{formatTime(conversation.last_message_at)}</span>
          </div>
          <div className="conversation-preview">
            <StatusIcon status={conversation.last_message_status} />
            <span className="preview-text">
              {conversation.last_message || '暂无消息'}
            </span>
            {conversation.unread_count > 0 && (
              <span className={`badge ${!!conversation.is_muted ? 'badge-muted' : 'badge-unread'}`}>
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({ message, currentUserId, onRetry }) => {
  const isSelf = message.sender_id === currentUserId;

  return (
    <div className={`message-item ${isSelf ? 'self' : ''}`}>
      <div className="message-avatar">
        <img src={message.sender_avatar} alt="avatar" />
      </div>
      <div className="message-content">
        <div className="message-bubble">{message.content}</div>
        <div className="message-meta">
          {!isSelf && <span className="message-sender">{message.sender_name}</span>}
          <span>{formatTime(message.created_at)}</span>
          {isSelf && (
            <div className="message-status">
              <StatusIcon status={message.status} />
              {message.status === 'failed' && (
                <button className="retry-btn" onClick={() => onRetry(message.id)}>
                  重试
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon, text }) => (
  <div className="empty-state">
    <span className="empty-state-icon">{icon}</span>
    <span className="empty-state-text">{text}</span>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="error-banner">
    <div className="error-banner-content">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
    {onRetry && (
      <button className="reconnect-btn" onClick={onRetry}>
        重新连接
      </button>
    )}
  </div>
);

const UserSelector = ({ users, currentUser, onSelect }) => (
  <div className="user-selector">
    <span className="user-label">当前用户:</span>
    <select 
      className="user-select" 
      value={currentUser?.id || ''}
      onChange={(e) => onSelect(parseInt(e.target.value))}
    >
      {users.map(user => (
      <option key={user.id} value={user.id}>
        {user.name}
      </option>
    ))}
    </select>
    {currentUser && (
      <img src={currentUser.avatar} alt="" className="user-avatar-small" />
    )}
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-User-Id': currentUser?.id || 1
  }), [currentUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setUsers(data);
      setCurrentUser(prev => prev || (data.length > 0 ? data[0] : null));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        headers['X-User-Id'] = currentUser.id;
      }
      const response = await fetch('/api/conversations', {
        signal: AbortSignal.timeout(5000),
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setConversations(data);
      setIsConnected(true);
      setNetworkError(null);
    } catch (error) {
      setIsConnected(false);
      setNetworkError('网络连接失败，请检查网络设置');
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        headers['X-User-Id'] = currentUser.id;
      }
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        signal: AbortSignal.timeout(5000),
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMessages(data.messages);
      setNetworkError(null);
    } catch (error) {
      setNetworkError('获取消息失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleConversationClick = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setInputValue('');
    await fetchMessages(conversation.id);
    await fetchConversations();
  }, [fetchMessages, fetchConversations]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || 1
        },
        body: JSON.stringify({ conversation_id: activeConversation.id, content })
      });
      
      if (!response.ok) throw new Error('Failed to send');
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      
      await fetchConversations();
      
      setTimeout(async () => {
        await fetchMessages(activeConversation.id);
        await fetchConversations();
      }, 2500);
    } catch (error) {
      setNetworkError('发送失败，请重试');
    }
  };

  const handleRetryMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || 1
        }
      });
      if (!response.ok) throw new Error('Failed to retry');
      await fetchMessages(activeConversation.id);
      await fetchConversations();
    } catch (error) {
      setNetworkError('重试失败');
    }
  };

  const handleTogglePin = async () => {
    if (!activeConversation) return;
    const newPinnedState = !activeConversation.is_pinned;
    const originalState = activeConversation.is_pinned;
    
    setActiveConversation(prev => ({ ...prev, is_pinned: newPinnedState ? 1 : 0 }));
    
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || 1
        },
        body: JSON.stringify({ is_pinned: newPinnedState })
      });
      
      if (!response.ok) throw new Error('Failed to update pin status');
      
      await fetchConversations();
    } catch (error) {
      setActiveConversation(prev => ({ ...prev, is_pinned: originalState }));
      setNetworkError('置顶设置失败，请重试');
      setTimeout(() => setNetworkError(null), 3000);
    }
  };

  const handleToggleMute = async () => {
    if (!activeConversation) return;
    const newMutedState = !activeConversation.is_muted;
    const originalState = activeConversation.is_muted;
    
    setActiveConversation(prev => ({ ...prev, is_muted: newMutedState ? 1 : 0 }));
    
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || 1
        },
        body: JSON.stringify({ is_muted: newMutedState })
      });
      
      if (!response.ok) throw new Error('Failed to update mute status');
      
      await fetchConversations();
    } catch (error) {
      setActiveConversation(prev => ({ ...prev, is_muted: originalState }));
      setNetworkError('免打扰设置失败，请重试');
      setTimeout(() => setNetworkError(null), 3000);
    }
  };

  const handleUserChange = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setActiveConversation(null);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (currentUser) {
        fetchConversations();
        if (activeConversation) {
          fetchMessages(activeConversation.id);
        }
      }
    }, 3000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchConversations, fetchMessages, activeConversation, currentUser]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>📬 消息中心</h1>
          <UserSelector 
            users={users}
            currentUser={currentUser}
            onSelect={handleUserChange}
          />
        </div>
        <div className="conversation-list">
          {!currentUser ? (
            <EmptyState icon="👤" text="加载用户信息..." />
          ) : conversations.length === 0 ? (
            <EmptyState icon="💬" text="暂无会话" />
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                onClick={handleConversationClick}
                currentUserId={currentUser?.id}
              />
            ))
          )}
        </div>
      </div>

      <div className="chat-area">
        {!isConnected && (
          <ErrorBanner 
            message={networkError || '网络连接异常'} 
            onRetry={fetchConversations}
          />
        )}
        
        {activeConversation ? (
          <>
            <div className="chat-header">
              <span className="chat-title">
                {(() => {
                  const members = activeConversation.member_names?.split(',') || [];
                  const avatars = activeConversation.member_avatars?.split(',') || [];
                  const currentSeed = currentUser?.id === 1 ? 'zhangsan' : currentUser?.id === 2 ? 'lisi' : currentUser?.id === 3 ? 'wangwu' : 'zhaoliu';
                  const otherMembers = members.filter((_, idx) => !avatars[idx]?.includes(`seed=${currentSeed}`));
                  return activeConversation.name || otherMembers[0] || '单聊会话';
                })()}
                {!!activeConversation.is_muted && ' 🔇'}
              </span>
              <div className="chat-actions">
                <button
                  className={`action-btn ${!!activeConversation.is_pinned ? 'active' : ''}`}
                  onClick={handleTogglePin}
                >
                  {!!activeConversation.is_pinned ? '★ 已置顶' : '☆ 置顶'}
                </button>
                <button
                  className={`action-btn ${!!activeConversation.is_muted ? 'active' : ''}`}
                  onClick={handleToggleMute}
                >
                  {!!activeConversation.is_muted ? '🔊 取消免打扰' : '🔇 免打扰'}
                </button>
              </div>
            </div>
            
            {!!activeConversation.is_muted && (
              <div className="mute-banner">
                <span className="mute-icon">🔕</span>
                <span className="mute-text">已开启免打扰 - 新消息不会发出声音提醒</span>
              </div>
            )}
            
            <div className="messages-container">
              {isLoading && messages.length === 0 ? (
                <div className="loading-more">
                  <span className="loading-spinner"></span> 加载中...
                </div>
              ) : messages.length === 0 ? (
                <EmptyState icon="💭" text="暂无消息，开始聊天吧" />
              ) : (
                messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={currentUser?.id || 1}
                    onRetry={handleRetryMessage}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="message-input"
                  placeholder="输入消息，按 Enter 发送..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  发送
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState icon="👈" text="选择一个会话开始聊天" />
        )}
      </div>
    </div>
  );
}

export default App;
