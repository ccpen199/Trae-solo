import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useFriendStore, useUiStore } from '@/store';
import { friendApi, messageApi } from '@/services/api';
import { Friend, ChatMessage } from '@/types';
import ProfileModal from '@/components/ProfileModal';
import SearchModal from '@/components/SearchModal';
import RequestsModal from '@/components/RequestsModal';

const EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔',
  '😴', '🥺', '😢', '😡', '🤗', '😘', '👍', '👎',
  '❤️', '💔', '🔥', '⭐', '🎉', '🎊', '👏', '🙏',
  '🌹', '🌷', '☀️', '🌙', '⭐', '🌈', '🍕', '🍔',
  '🎵', '🎮', '💻', '📱', '🚗', '✈️', '🏠', '🎁'
];

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const { 
    activeChat, 
    setActiveChat, 
    messages, 
    setMessages, 
    addMessage,
    unreadCounts,
    setUnreadCount,
    clearUnreadCount,
    typingUsers,
    addTypingUser,
    removeTypingUser
  } = useChatStore();
  const { 
    friends, 
    setFriends, 
    updateFriendOnlineStatus,
    pendingRequests,
    setPendingRequests
  } = useFriendStore();
  const { 
    showProfile, 
    toggleProfile,
    showSearch,
    toggleSearch,
    showRequests,
    toggleRequests
  } = useUiStore();
  
  const socketRef = useRef<Socket | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollToBottom = useCallback(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat, scrollToBottom]);

  useEffect(() => {
    const initData = async () => {
      try {
        const friendsResult = await friendApi.getFriends();
        if (friendsResult.success && friendsResult.data) {
          setFriends(friendsResult.data);
        }
        
        const requestsResult = await friendApi.getPendingRequests();
        if (requestsResult.success && requestsResult.data) {
          setPendingRequests(requestsResult.data);
        }
        
        const unreadResult = await messageApi.getUnreadCount();
        if (unreadResult.success && unreadResult.data) {
          unreadResult.data.byUser.forEach(item => {
            setUnreadCount(item.userId, item.unreadCount);
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, [setFriends, setPendingRequests, setUnreadCount]);

  useEffect(() => {
    if (!token) return;
    
    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('user:online', ({ userId }) => {
      updateFriendOnlineStatus(userId, true);
    });
    
    socket.on('user:offline', ({ userId }) => {
      updateFriendOnlineStatus(userId, false);
    });
    
    socket.on('message:receive', (message: ChatMessage) => {
      addMessage(message.fromUserId, message);
      
      if (activeChat !== message.fromUserId) {
        setUnreadCount(message.fromUserId, (unreadCounts[message.fromUserId] || 0) + 1);
      }
    });
    
    socket.on('typing:start', ({ fromUserId }) => {
      if (fromUserId === activeChat) {
        addTypingUser(fromUserId);
      }
    });
    
    socket.on('typing:stop', ({ fromUserId }) => {
      removeTypingUser(fromUserId);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [token, activeChat, unreadCounts, updateFriendOnlineStatus, addMessage, setUnreadCount, addTypingUser, removeTypingUser]);

  const handleSelectFriend = async (friend: Friend) => {
    setActiveChat(friend.id);
    clearUnreadCount(friend.id);
    
    try {
      await messageApi.markAsRead(friend.id);
      
      const historyResult = await messageApi.getChatHistory(friend.id);
      if (historyResult.success && historyResult.data) {
        setMessages(friend.id, historyResult.data);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!activeChat || !messageInput.trim() || sending) return;
    
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    
    try {
      if (socketRef.current) {
        socketRef.current.emit('message:send', {
          toUserId: activeChat,
          content,
          type: 'text'
        });
      }
      
      const result = await messageApi.sendMessage({
        toUserId: activeChat,
        content,
        type: 'text'
      });
      
      if (result.success && result.data) {
        addMessage(activeChat, result.data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    logout();
    navigate('/login');
  };

  const activeFriend = friends.find(f => f.id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  if (loading) {
    return (
      <div className="main-container">
        <div className="loading" style={{ flex: 1 }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="sidebar">
        <div className="user-info">
          <img 
            className="avatar" 
            src={user?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20avatar%20icon%20simple%20cartoon&image_size=square'} 
            alt={user?.nickname}
          />
          <div className="user-details">
            <div className="user-nickname">{user?.nickname || '用户'}</div>
            <div className="user-qq">QQ: {user?.qqNumber}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              className="tool-button"
              onClick={() => toggleProfile(true)}
              title="个人资料"
            >
              资料
            </button>
            <button 
              className="tool-button"
              onClick={handleLogout}
              title="退出登录"
            >
              退出
            </button>
          </div>
        </div>
        
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="搜索或添加好友"
              onClick={() => toggleSearch(true)}
              readOnly
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>
        
        <div className="sidebar-tabs">
          <button className="sidebar-tab active">
            好友列表
          </button>
          <button 
            className="sidebar-tab"
            onClick={() => toggleRequests(true)}
          >
            好友请求
            {pendingRequests.length > 0 && (
              <span className="unread-badge" style={{ marginLeft: '4px' }}>
                {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
              </span>
            )}
          </button>
        </div>
        
        <div className="sidebar-content">
          {friends.length === 0 ? (
            <div className="empty-state" style={{ height: 'auto', padding: '40px' }}>
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">暂无好友</div>
              <button 
                className="chat-button primary"
                style={{ marginTop: '16px' }}
                onClick={() => toggleSearch(true)}
              >
                搜索添加好友
              </button>
            </div>
          ) : (
            friends.map(friend => (
              <div
                key={friend.id}
                className={`friend-item ${activeChat === friend.id ? 'active' : ''}`}
                onClick={() => handleSelectFriend(friend)}
              >
                <div className="friend-avatar">
                  <img 
                    className="avatar avatar-small" 
                    src={friend.avatar} 
                    alt={friend.nickname}
                  />
                  <span className={`online-status ${friend.isOnline ? 'online' : 'offline'}`}></span>
                </div>
                <div className="friend-info">
                  <div className="friend-nickname">{friend.nickname}</div>
                  <div className="friend-status">
                    {friend.isOnline ? '在线' : '离线'}
                  </div>
                </div>
                {unreadCounts[friend.id] > 0 && (
                  <span className="unread-badge">
                    {unreadCounts[friend.id] > 99 ? '99+' : unreadCounts[friend.id]}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="chat-container">
        {!activeChat ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">选择一个好友开始聊天</div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <img 
                  className="avatar avatar-small" 
                  src={activeFriend?.avatar} 
                  alt={activeFriend?.nickname}
                />
                <div>
                  <div className="chat-header-name">{activeFriend?.nickname}</div>
                  <div className="chat-header-status">
                    {activeFriend?.isOnline ? '在线' : '离线'}
                    {activeFriend?.qqNumber && ` · QQ: ${activeFriend.qqNumber}`}
                  </div>
                </div>
              </div>
              <div className="chat-header-actions">
                <button 
                  className="chat-button danger"
                  onClick={async () => {
                    if (window.confirm(`确定要删除好友 "${activeFriend?.nickname}" 吗？`)) {
                      try {
                        await friendApi.deleteFriend(activeChat);
                        setFriends(friends.filter(f => f.id !== activeChat));
                        setActiveChat(null);
                      } catch (error) {
                        console.error('Failed to delete friend:', error);
                      }
                    }
                  }}
                >
                  删除好友
                </button>
              </div>
            </div>
            
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-text">暂无消息</div>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isSent = msg.fromUserId === user?.id;
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`message-item ${isSent ? 'sent' : 'received'}`}
                    >
                      <div className="message-avatar">
                        <img 
                          className="avatar avatar-small" 
                          src={isSent ? user?.avatar : activeFriend?.avatar} 
                          alt=""
                        />
                      </div>
                      <div className="message-content">
                        <div className="message-bubble">
                          {msg.content}
                        </div>
                        <div className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {typingUsers.has(activeChat) && (
                <div className="typing-indicator">
                  {activeFriend?.nickname} 正在输入<span>.</span><span>.</span><span>.</span>
                </div>
              )}
              
              <div ref={chatMessagesEndRef} />
            </div>
            
            <div className="chat-input-area">
              <div className="chat-toolbar" style={{ position: 'relative' }} ref={emojiPickerRef}>
                <button 
                  className="tool-button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{ backgroundColor: showEmojiPicker ? '#e8e8e8' : 'transparent' }}
                >
                  😊 表情
                </button>
                <button className="tool-button">📷 图片</button>
                <button className="tool-button">📁 文件</button>
                
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '8px',
                    padding: '12px',
                    backgroundColor: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    maxWidth: '320px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: '4px'
                    }}>
                      {EMOJIS.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiClick(emoji)}
                          style={{
                            fontSize: '24px',
                            padding: '8px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-input-wrapper">
                <textarea
                  className="chat-input"
                  placeholder="输入消息..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                >
                  发送
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {showProfile && <ProfileModal onClose={() => toggleProfile(false)} />}
      {showSearch && <SearchModal onClose={() => toggleSearch(false)} />}
      {showRequests && <RequestsModal onClose={() => toggleRequests(false)} />}
    </div>
  );
};

export default MainPage;
