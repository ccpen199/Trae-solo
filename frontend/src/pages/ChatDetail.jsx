import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { socialApi } from '../api';
import useStore from '../store';
import Loading from '../components/Loading';

const ChatDetail = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState({ nickname: '好友' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await socialApi.getMessages(friendId);
      setMessages(response.data?.messages || []);
    } catch (error) {
      showError(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await socialApi.sendMessage(friendId, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (error) {
      showError(error.message || '发送失败');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 style={styles.title}>{friend.nickname}</h1>
        <div style={{ width: '32px' }} />
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>💬</span>
            <p>暂无消息，打个招呼吧！</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              style={{ ...styles.messageItem, ...(msg.from_user_id === user?.id ? styles.myMessage : styles.otherMessage) }}
            >
              <span style={styles.messageContent}>{msg.content}</span>
              <span style={styles.messageTime}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          placeholder="输入消息..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button style={styles.sendBtn} onClick={handleSendMessage}>发送</button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: 'rgba(0,0,0,0.1)'
  },
  backBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer'
  },
  title: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '600'
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  messageItem: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px',
    position: 'relative'
  },
  myMessage: {
    alignSelf: 'flex-end',
    background: 'white',
    borderBottomRightRadius: '4px'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.8)',
    borderBottomLeftRadius: '4px'
  },
  messageContent: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5'
  },
  messageTime: {
    fontSize: '10px',
    color: '#999',
    marginTop: '4px',
    display: 'block',
    textAlign: 'right'
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.95)'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '20px',
    border: '2px solid #eee',
    fontSize: '14px',
    outline: 'none'
  },
  sendBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default ChatDetail;
