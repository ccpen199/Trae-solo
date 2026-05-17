import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { socialApi } from '../api';
import Loading from '../components/Loading';

const Chat = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await socialApi.getFriends();
      setFriends(response.data?.friends || []);
    } catch (error) {
      showError(error.message || '加载失败');
    } finally {
      setLoading(false);
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
        <h1 style={styles.title}>私聊</h1>
        <div style={{ width: '32px' }} />
      </div>

      <div style={styles.content}>
        {friends.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>💬</span>
            <p>暂无好友，快去房间中比心认识新朋友吧！</p>
          </div>
        ) : (
          <div style={styles.friendList}>
            {friends.map(friend => (
              <div 
                key={friend.id} 
                style={styles.friendItem}
                onClick={() => navigate(`/chat/${friend.id}`)}
              >
                <div style={styles.friendAvatar}>
                  {friend.nickname?.charAt(0) || '👤'}
                  {friend.is_online && <span style={styles.onlineDot} />}
                </div>
                <div style={styles.friendInfo}>
                  <span style={styles.friendName}>{friend.nickname}</span>
                  <span style={styles.friendStatus}>
                    {friend.is_online ? '在线' : '离线'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
    padding: '20px'
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
    fontSize: '20px',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    background: 'white',
    borderRadius: '24px 24px 0 0',
    padding: '20px',
    overflowY: 'auto'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  friendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  friendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '12px',
    background: '#f8f9fa',
    cursor: 'pointer'
  },
  friendAvatar: {
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
    position: 'relative'
  },
  onlineDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    background: '#4caf50',
    borderRadius: '50%',
    border: '2px solid white'
  },
  friendInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  friendName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333'
  },
  friendStatus: {
    fontSize: '12px',
    color: '#999'
  }
};

export default Chat;
