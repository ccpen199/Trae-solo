import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { showToast } from '../utils/request';

function Contacts() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      const [friendsRes, suggestedRes] = await Promise.all([
        request.get('/users/friends'),
        request.get('/users/suggested')
      ]);
      
      if (friendsRes?.success) {
        setFriends(friendsRes.data || []);
      }
      if (suggestedRes?.success) {
        setSuggested(suggestedRes.data || []);
      }
    } catch (e) {
      console.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOnline]);

  const addFriend = async (userId) => {
    try {
      const res = await request.post('/users/add-friend', { friendId: userId });
      if (res?.success) {
        showToast('添加成功');
        fetchData();
      } else {
        showToast(res?.message || '添加失败');
      }
    } catch (e) {
      showToast('添加失败');
    }
  };

  const startChat = async (userId) => {
    try {
      const res = await request.post('/chats/create', { userId });
      if (res?.success) {
        navigate(`/chat/${res.data.chatId}`);
      }
    } catch (e) {
      showToast('创建聊天失败');
    }
  };

  return (
    <div className="page">
      <div className="header">
        <div className="header-title">通讯录</div>
        <div style={{ cursor: 'pointer', fontSize: 20 }}>🔍</div>
      </div>

      {!isOnline && (
        <div style={{ 
          padding: '8px 16px', 
          background: '#fff1f0',
          color: '#f5222d',
          fontSize: 13,
          textAlign: 'center'
        }}>
          ❌ 网络未连接
        </div>
      )}

      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/capture')}>
            <div style={{ fontSize: 28 }}>📹</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>拍摄随拍</div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 28 }}>📱</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>邀请好友</div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 28 }}>🆔</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>我的ID</div>
          </div>
        </div>
      </div>

      <div className="divider" style={{ margin: '0 16px' }} />

      {suggested.length > 0 && (
        <>
          <div style={{ padding: '12px 16px', fontWeight: 500 }}>
            可能认识的人
          </div>
          {suggested.map((user) => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt="avatar"
                className="avatar-sm"
                style={{ marginRight: 12 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{user.nickname}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {user.bio || '多闪用户'}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => addFriend(user.id)}
                style={{ padding: '6px 16px', fontSize: 13 }}
              >
                关注
              </button>
            </div>
          ))}
          
          <div className="divider" style={{ margin: '0 16px' }} />
        </>
      )}

      <div style={{ padding: '12px 16px', fontWeight: 500 }}>
        好友 ({friends.length})
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : friends.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <p>暂无好友</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>去添加更多好友吧</p>
        </div>
      ) : (
        friends.map((friend) => (
          <div
            key={friend.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer'
            }}
            onClick={() => startChat(friend.id)}
          >
            <img
              src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
              alt="avatar"
              className="avatar-sm"
              style={{ marginRight: 12 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{friend.nickname}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {friend.bio || '多闪用户'}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              发消息 →
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Contacts;
