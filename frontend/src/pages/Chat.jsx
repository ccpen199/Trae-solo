import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL, chatAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadChats();
    
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      if (msg.chat_id == chatId) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });

    socket.on('user_typing', ({ userId, isTyping }) => {
      if (userId != user?.id) {
        setIsTyping(isTyping);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id == chatId);
      setActiveChat(chat || null);
      if (chat) {
        loadMessages(chatId);
        socketRef.current?.emit('join_chat', chatId);
      }
    }
  }, [chatId, chats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      const res = await chatAPI.getChats();
      setChats(res.data.chats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (id) => {
    try {
      setLoadingMessages(true);
      const res = await chatAPI.getMessages(id);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !chatId || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const res = await chatAPI.sendMessage(chatId, { content, type: 'text' });
      
      if (res.data.intent === 'interview_request') {
        setTimeout(() => {
          const scheduleMsg = {
            id: Date.now(),
            chat_id: chatId,
            sender_id: 0,
            content: `🤖 智能助手检测到您提到了面试，建议的面试时间：${res.data.intent_data?.suggested_day || '下周'} ${res.data.intent_data?.suggested_time || ''}\n\n是否需要我帮您创建日程提醒？`,
            type: 'text',
            isSuggestion: true,
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, scheduleMsg]);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    try {
      const res = await chatAPI.uploadFile(chatId, file);
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('文件上传失败');
    }
  };

  const handleTyping = () => {
    if (chatId) {
      socketRef.current?.emit('typing', { chatId, userId: user.id, isTyping: true });
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socketRef.current?.emit('typing', { chatId, userId: user.id, isTyping: false });
      }, 2000);
    }
  };

  const selectChat = (chat) => {
    navigate(`/chat/${chat.id}`);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 0 }}>
      <div style={{
        width: 320,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px 0 0 12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>💬 消息</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div className="loading" style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
          ) : chats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <p>暂无对话</p>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  background: activeChat?.id == chat.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: 12,
                }}
              >
                <div className="avatar">
                  {user?.role === 'jobseeker' 
                    ? chat.hr_name?.charAt(0).toUpperCase()
                    : chat.jobseeker_name?.charAt(0).toUpperCase()
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>
                      {user?.role === 'jobseeker' ? chat.hr_name : chat.jobseeker_name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {chat.last_message_at?.split('T')[1]?.substring(0, 5)}
                    </span>
                  </div>
                  {chat.job_title && (
                    <div style={{ fontSize: 12, color: 'var(--primary-color)', marginBottom: 4 }}>
                      {chat.job_title}
                    </div>
                  )}
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {chat.last_message || '暂无消息'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: 'none',
        borderRadius: '0 12px 12px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {activeChat ? (
          <>
            <div style={{
              padding: 16,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div className="avatar">
                {user?.role === 'jobseeker'
                  ? activeChat.hr_name?.charAt(0).toUpperCase()
                  : activeChat.jobseeker_name?.charAt(0).toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {user?.role === 'jobseeker' ? activeChat.hr_name : activeChat.jobseeker_name}
                </div>
                {activeChat.job_title && (
                  <div style={{ fontSize: 12, color: 'var(--primary-color)' }}>{activeChat.job_title}</div>
                )}
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 20,
              background: 'var(--bg-secondary)',
            }}>
              {loadingMessages ? (
                <div className="loading" style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👋</div>
                  <p>开始你们的对话吧！</p>
                  <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>
                    发送"下周能面试吗"可以触发智能日程建议
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: msg.sender_id === user?.id ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {msg.sender_id !== user?.id && (
                        <div className="avatar avatar-sm" style={{ marginRight: 8 }}>
                          {msg.sender_name?.charAt(0).toUpperCase() || (msg.sender_id === 0 ? '🤖' : 'U')}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: 16,
                        background: msg.sender_id === user?.id
                          ? 'var(--primary-color)'
                          : (msg.isSuggestion ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-primary)'),
                        color: msg.sender_id === user?.id ? 'white' : 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)',
                      }}>
                        {msg.type === 'file' || msg.type === 'voice' || msg.type === 'image' ? (
                          <div>
                            <span style={{ fontSize: 20 }}>
                              {msg.type === 'file' ? '📄' : msg.type === 'voice' ? '🎤' : '🖼️'}
                            </span>
                            <a href={msg.file_url} target="_blank" style={{ color: 'inherit' }}>
                              {msg.file_name || `[${msg.type}]`}
                            </a>
                            {msg.duration && <span style={{ fontSize: 12, opacity: 0.8 }}> ({msg.duration}s)</span>}
                          </div>
                        ) : (
                          <div>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.content}</p>
                            {msg.intent && (
                              <div style={{
                                marginTop: 8,
                                padding: '6px 10px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: 8,
                                fontSize: 12,
                                color: 'var(--secondary-color)',
                              }}>
                                🤖 识别到意图：{msg.intent === 'interview_request' ? '面试请求' : msg.intent}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{
                          fontSize: 11,
                          marginTop: 4,
                          opacity: 0.6,
                          textAlign: 'right',
                        }}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="avatar avatar-sm">U</div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>正在输入...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  title="上传文件"
                >
                  📎
                </button>
                <input
                  type="text"
                  className="form-input"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  placeholder="输入消息... 试试发送'下周能面试吗'"
                  disabled={sending}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !messageInput.trim()}>
                  发送
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <p>选择一个对话开始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
