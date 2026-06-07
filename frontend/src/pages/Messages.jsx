import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useStore from '../store.js';
import { messageAPI } from '../api.js';

export default function Messages() {
  const { user, setUnreadCount } = useStore();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const userId = searchParams.get('user_id');
    if (userId && conversations.length > 0) {
      const conv = conversations.find(c => c.user_id === parseInt(userId));
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await messageAPI.conversations();
      setConversations(res.data.conversations || []);
      const unreadRes = await messageAPI.unreadCount();
      setUnreadCount(unreadRes.data.count || 0);
    } catch (e) {
      setError(e.response?.data?.error || '获取会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    setMessagesLoading(true);
    try {
      const res = await messageAPI.getMessages(userId);
      setMessages(res.data.messages || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取消息失败');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedUser(conv);
    fetchMessages(conv.user_id);
    setConversations(prev => prev.map(c =>
      c.user_id === conv.user_id ? { ...c, unread_count: 0 } : c
    ));
    const totalUnread = conversations.reduce((sum, c) =>
      sum + (c.user_id === conv.user_id ? 0 : c.unread_count), 0);
    setUnreadCount(totalUnread);
  };

  const handleSendMessage = async (content_type = 'text', content = null) => {
    if (!selectedUser) return;

    const messageContent = content || inputText.trim();
    if (!messageContent) return;

    setSending(true);
    try {
      await messageAPI.sendMessage({
        receiver_id: selectedUser.user_id,
        content: messageContent,
        content_type
      });
      setInputText('');
      fetchMessages(selectedUser.user_id);
      fetchConversations();
    } catch (e) {
      setError(e.response?.data?.error || '发送消息失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (type) => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      handleSendMessage(type, file.name);
      fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (msg) => {
    if (msg.content_type === 'image') {
      return (
        <div className="message-attachments">
          <div className="message-attachment">
            <img src={msg.content} alt="图片" />
          </div>
        </div>
      );
    }
    if (msg.content_type === 'video') {
      return (
        <div className="message-attachments">
          <div className="message-attachment">
            <video src={msg.content} controls style={{ width: '100%', maxWidth: 300 }} />
          </div>
        </div>
      );
    }
    if (msg.content_type === 'resume') {
      return (
        <div style={{
          padding: '12px 16px',
          background: msg.sender_id === user?.id ? 'rgba(255,255,255,0.2)' : '#f5f7fa',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <div style={{ fontWeight: 500 }}>{msg.content}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>简历文件</div>
          </div>
        </div>
      );
    }
    return <div className="message-text">{msg.content}</div>;
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">💬 消息中心</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <div className="chat-layout">
        <div className="chat-sidebar">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">暂无会话</div>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.user_id}
                className={`chat-list-item ${selectedUser?.user_id === conv.user_id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div style={{ position: 'relative' }}>
                  <div className="chat-list-avatar">
                    {conv.username?.charAt(0)?.toUpperCase()}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="badge">{conv.unread_count}</span>
                  )}
                </div>
                <div className="chat-list-info" style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="chat-list-name">{conv.username}</div>
                    <div className="chat-list-time">
                      {conv.last_message_time && formatTime(conv.last_message_time)}
                    </div>
                  </div>
                  <div className="chat-list-preview">
                    {conv.last_message_content || '暂无消息'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-main">
          {selectedUser ? (
            <>
              <div className="chat-header">
                {selectedUser.username}
                {selectedUser.wechat_verified && (
                  <span className="tag verified" style={{ marginLeft: 8, fontSize: 11 }}>
                    ✓ 微信已验证
                  </span>
                )}
              </div>

              <div className="chat-messages">
                {messagesLoading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <div className="empty-state-text">开始聊天吧！</div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${msg.sender_id === user?.id ? 'self' : ''}`}
                    >
                      <div className="message-avatar">
                        {(msg.sender_id === user?.id ? user?.username : selectedUser.username)?.charAt(0)?.toUpperCase()}
                      </div>
                      <div style={{ maxWidth: '70%' }}>
                        <div className="message-bubble">
                          {renderMessageContent(msg)}
                        </div>
                        <div className="message-time">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div>
                <div className="chat-toolbar" style={{ padding: '0 24px' }}>
                  <button
                    className="tool-btn"
                    title="发送图片"
                    onClick={() => {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current.onchange = () => handleFileUpload('image');
                      fileInputRef.current.click();
                    }}
                  >
                    🖼️
                  </button>
                  <button
                    className="tool-btn"
                    title="发送视频"
                    onClick={() => {
                      fileInputRef.current.accept = 'video/*';
                      fileInputRef.current.onchange = () => handleFileUpload('video');
                      fileInputRef.current.click();
                    }}
                  >
                    🎬
                  </button>
                  <button
                    className="tool-btn"
                    title="发送简历"
                    onClick={() => {
                      fileInputRef.current.accept = '.pdf,.doc,.docx';
                      fileInputRef.current.onchange = () => handleFileUpload('resume');
                      fileInputRef.current.click();
                    }}
                  >
                    📄
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="chat-input-area">
                  <textarea
                    className="chat-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    disabled={sending}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSendMessage()}
                    disabled={sending || !inputText.trim()}
                  >
                    {sending ? '发送中...' : '发送'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon">👈</div>
              <div className="empty-state-text">选择一个会话开始聊天</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
