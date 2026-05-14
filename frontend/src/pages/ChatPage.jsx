import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { messageApi } from '../api';

const ChatPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const quickMessages = [
    '司机师傅您好，我已到达上车点',
    '请稍等，我马上到',
    '可以帮我放一下行李吗',
    '麻烦开一下后备箱',
    '师傅，请走最近的路',
    '我在便利店门口等您'
  ];

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const res = await messageApi.getMessages({ orderId });
      if (res.data.success) {
        setMessages(res.data.data);
        messageApi.markAsRead({ orderId });
      }
    } catch (err) {
      console.error('加载消息失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    
    try {
      setSending(true);
      const res = await messageApi.sendMessage({
        orderId,
        content: content.trim()
      });
      
      if (res.data.success) {
        setInputValue('');
        await loadMessages();
      }
    } catch (err) {
      alert('发送失败');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        paddingTop: '50px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 10
      }}>
        <div 
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', cursor: 'pointer' }}
        >
          ←
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>司机</div>
        <div style={{ width: '20px' }}></div>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <div>还没有消息</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>使用快捷消息或手动发送</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, index) => (
              <div 
                key={msg.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: msg.is_from_me ? 'flex-end' : 'flex-start'
                }}
              >
                {!msg.is_from_me && (
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    marginRight: '8px'
                  }}>
                    👨‍✈️
                  </div>
                )}
                <div style={{ 
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.is_from_me ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.is_from_me ? '#ff6a00' : 'white',
                  color: msg.is_from_me ? 'white' : '#333',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {msg.content}
                </div>
                {msg.is_from_me && (
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: '#fff5ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    marginLeft: '8px'
                  }}>
                    👤
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '8px 12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {quickMessages.map((msg, index) => (
            <span
              key={index}
              onClick={() => handleSendMessage(msg)}
              style={{ 
                padding: '6px 12px', 
                background: '#f5f5f5', 
                borderRadius: '16px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer'
              }}
            >
              {msg}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="输入消息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            style={{ 
              flex: 1, 
              padding: '10px 16px', 
              border: '1px solid #e5e5e5',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || sending}
            style={{ 
              padding: '10px 20px', 
              background: (!inputValue.trim() || sending) ? '#ccc' : '#ff6a00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              fontSize: '14px',
              cursor: (!inputValue.trim() || sending) ? 'not-allowed' : 'pointer'
            }}
          >
            {sending ? '...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;