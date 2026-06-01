import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loading } from 'antd-mobile';
import dayjs from 'dayjs';
import { useChatStore } from '../store/useChatStore';
import AddTransactionModal from '../components/AddTransactionModal';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    messages, 
    currentContact, 
    contacts,
    loading, 
    fetchMessages, 
    fetchContacts, 
    sendMessage,
    sending
  } = useChatStore();
  
  const [inputValue, setInputValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (currentContact) {
      fetchMessages(currentContact.id);
    }
  }, [currentContact]);

  useEffect(() => {
    if (contacts.length > 0 && !currentContact) {
      useChatStore.getState().setCurrentContact(contacts[0]);
    }
  }, [contacts, currentContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const content = inputValue.trim();
    setInputValue('');
    await sendMessage(content, currentContact?.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return dayjs(dateStr).format('HH:mm');
  };

  const renderMessage = (msg: any) => {
    const isUser = msg.sender_type === 'user';
    
    if (msg.message_type === 'transaction') {
      const parts = msg.content.split(' ');
      const icon = parts[0];
      const amount = parts.find((p: string) => p.includes('¥')) || '¥0';
      const category = parts[parts.length - 1];
      
      return (
        <div key={msg.id} className={`message-wrapper ${isUser ? 'user' : 'contact'}`}>
          {!isUser && <div className="message-avatar">🤖</div>}
          <div className="message-content-wrapper">
            <div className="transaction-message">
              <div className="transaction-header">
                <span>{icon}</span>
                <span>记账</span>
              </div>
              <div className="transaction-amount">{amount}</div>
              <div className="transaction-category">{category}</div>
            </div>
            <div className="message-time">{formatTime(msg.created_at)}</div>
          </div>
          {isUser && <div className="message-avatar">👤</div>}
        </div>
      );
    }
    
    return (
      <div key={msg.id} className={`message-wrapper ${isUser ? 'user' : 'contact'}`}>
        {!isUser && <div className="message-avatar">🤖</div>}
        <div className="message-content-wrapper">
          <div className="message-content">{msg.content}</div>
          <div className="message-time">{formatTime(msg.created_at)}</div>
        </div>
        {isUser && <div className="message-avatar">👤</div>}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-contact-avatar">🤖</div>
          <div>
            <div className="chat-contact-name">{currentContact?.name || '叨叨'}</div>
            <div className="chat-header-stats">今日已记账 0 笔</div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="empty-state">
            <Loading />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-text">开始和叨叨聊天吧</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>
              点击底部 + 号可以快速记账
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="说点什么..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className="chat-send-btn" 
          onClick={handleSend}
          disabled={sending}
        >
          ➤
        </button>
      </div>

      <div className="tab-bar">
        <div className="tab-item active" onClick={() => navigate('/')}>
          <span className="tab-icon">💬</span>
          <span>聊天</span>
        </div>
        <div className="tab-item" onClick={() => navigate('/contacts')}>
          <span className="tab-icon">👥</span>
          <span>联系人</span>
        </div>
        <div className="add-btn" onClick={() => setShowAddModal(true)}>
          +
        </div>
        <div className="tab-item" onClick={() => navigate('/profile')}>
          <span className="tab-icon">👤</span>
          <span>我的</span>
        </div>
      </div>

      <AddTransactionModal 
        visible={showAddModal} 
        onClose={() => setShowAddModal(false)}
        contactId={currentContact?.id}
      />
    </div>
  );
};

export default ChatPage;