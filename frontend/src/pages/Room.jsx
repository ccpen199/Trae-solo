import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { roomApi, socialApi } from '../api';
import useStore from '../store';
import Loading from '../components/Loading';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomData = async () => {
    try {
      const response = await roomApi.getRoom(roomId);
      setRoom(response.data.room);
      setMembers(response.data.members || []);
      setMessages(response.data.messages || []);
    } catch (error) {
      showError(error.message || '加载房间失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await roomApi.sendMessage(roomId, newMessage);
      setNewMessage('');
      loadRoomData();
    } catch (error) {
      showError(error.message || '发送失败');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await roomApi.leaveRoom(roomId);
      showSuccess('已退出房间');
      navigate('/');
    } catch (error) {
      showError(error.message || '退出失败');
    }
  };

  const handleLike = async (member) => {
    if (member.id === user?.id) {
      showError('不能给自己比心');
      return;
    }

    try {
      await socialApi.likeUser(member.id);
      showSuccess('比心成功！');
    } catch (error) {
      showError(error.message || '比心失败');
    }
  };

  const handleKick = async (memberId) => {
    try {
      await roomApi.kickUser(roomId, memberId);
      showSuccess('踢出成功');
      loadRoomData();
    } catch (error) {
      showError(error.message || '踢出失败');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Loading text="加载房间..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={styles.page}>
        <div style={styles.empty}>
          <p>房间不存在</p>
          <button style={styles.backBtn} onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    );
  }

  const isOwner = members.find(m => m.is_owner)?.id === user?.id;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={handleLeaveRoom}>✕</button>
        <div>
          <h1 style={styles.title}>{room.room_name}</h1>
          <p style={styles.subtitle}>房间号：{room.room_no}</p>
        </div>
        <div style={styles.memberCount}>
          👥 {members.length}人
        </div>
      </div>

      <div style={styles.movieSection}>
        <div style={styles.movieArea}>
          <div style={styles.moviePlaceholder}>
            <span style={styles.movieIcon}>🎬</span>
            <p style={styles.movieTitle}>{room.current_movie_title || '选择影片'}</p>
          </div>
        </div>
      </div>

      <div style={styles.memberSection}>
        <h3 style={styles.sectionTitle}>房间成员</h3>
        <div style={styles.memberList}>
          {members.map(member => (
            <div key={member.id} style={styles.memberItem}>
              <div style={styles.memberAvatar}>
                {member.nickname?.charAt(0) || '👤'}
                {member.is_owner && <span style={styles.ownerBadge}>房主</span>}
              </div>
              <span style={styles.memberName}>{member.nickname}</span>
              <div style={styles.memberActions}>
                <button style={styles.likeBtn} onClick={() => handleLike(member)}>💕</button>
                {isOwner && !member.is_owner && (
                  <button style={styles.kickBtn} onClick={() => handleKick(member.id)}>踢出</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.chatSection}>
        <h3 style={styles.sectionTitle}>聊天室</h3>
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} style={{ ...styles.messageItem, ...(msg.user_id === user?.id ? styles.myMessage : {}) }}>
              {msg.message_type === 'system' ? (
                <div style={styles.systemMessage}>{msg.content}</div>
              ) : (
                <>
                  <span style={styles.messageUser}>{msg.nickname || '用户'}：</span>
                  <span style={styles.messageContent}>{msg.content}</span>
                </>
              )}
            </div>
          ))}
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
    background: 'rgba(0,0,0,0.2)'
  },
  backBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer'
  },
  title: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    textAlign: 'center'
  },
  memberCount: {
    color: 'white',
    fontSize: '14px',
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '20px'
  },
  movieSection: {
    padding: '20px',
    flexShrink: 0
  },
  movieArea: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '16px',
    padding: '40px 20px'
  },
  moviePlaceholder: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)'
  },
  movieIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px'
  },
  movieTitle: {
    fontSize: '16px'
  },
  memberSection: {
    background: 'white',
    borderRadius: '24px 24px 0 0',
    padding: '20px',
    flexShrink: 0
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px'
  },
  memberList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  memberItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '70px'
  },
  memberAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    position: 'relative',
    marginBottom: '4px'
  },
  ownerBadge: {
    position: 'absolute',
    bottom: '-4px',
    right: '-4px',
    background: '#ff9800',
    color: 'white',
    fontSize: '8px',
    padding: '2px 6px',
    borderRadius: '8px'
  },
  memberName: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center'
  },
  memberActions: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px'
  },
  likeBtn: {
    padding: '4px 8px',
    fontSize: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  kickBtn: {
    padding: '2px 6px',
    fontSize: '10px',
    background: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  chatSection: {
    background: 'white',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 20px 20px',
    minHeight: '200px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    background: '#f5f5f5',
    borderRadius: '12px',
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  messageItem: {
    padding: '8px 12px',
    background: 'white',
    borderRadius: '8px',
    maxWidth: '80%'
  },
  myMessage: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  messageUser: {
    fontSize: '12px',
    color: '#667eea',
    fontWeight: '500'
  },
  messageContent: {
    fontSize: '14px',
    color: '#333'
  },
  systemMessage: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
    padding: '4px'
  },
  inputContainer: {
    display: 'flex',
    gap: '8px'
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
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  }
};

export default Room;
