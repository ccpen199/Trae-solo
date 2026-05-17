import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import request from '../utils/request';
import Loading from '../components/Loading';
import useStore from '../store/useStore';

const Live = () => {
  const { userId } = useParams();
  const { user, isAuthenticated } = useStore(state => ({ user: state.user, isAuthenticated: state.isAuthenticated }));
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchCategories();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await request.get('/live/list');
      setRooms(res.data?.list || getMockRooms());
    } catch (error) {
      setRooms(getMockRooms());
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await request.get('/live/categories');
      setCategories(res.data || []);
    } catch (error) {
      setCategories([]);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      alert('请先登录后再关注主播');
      return;
    }
    try {
      if (isFollowing) {
        await request.delete(`/user/unfollow/${userId}`);
        setIsFollowing(false);
      } else {
        await request.post(`/user/follow/${userId}`);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      setIsFollowing(!isFollowing);
    }
  };

  const getMockRooms = () => {
    const rooms = [];
    const titles = [
      '【游戏】原神3.5新版本探索',
      '【颜值】一起聊聊天吧~',
      '【音乐】吉他弹唱 点歌台',
      '【学习】Python编程入门教学',
      '【户外】登山直播中',
      '【美食】深夜食堂 今天吃什么',
      '【舞蹈】练舞日常记录',
      '【科技】新品开箱测评'
    ];
    for (let i = 0; i < 8; i++) {
      rooms.push({
        id: i + 1,
        user_id: i + 1,
        title: titles[i],
        cover: `https://picsum.photos/400/225?random=${i + 100}`,
        viewer_count: Math.floor(Math.random() * 50000),
        is_living: i < 5,
        category_name: ['游戏', '颜值', '音乐', '学习', '户外'][i % 5],
        nickname: `主播${i + 1}号`,
        avatar: `https://i.pravatar.cc/100?img=${i + 20}`
      });
    }
    return rooms;
  };

  const formatCount = (num) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num?.toString() || '0';
  };

  if (userId) {
    return (
      <div className="container" style={{ padding: '20px 0' }}>
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src="https://picsum.photos/1200/675?random=room"
            alt="直播封面"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            🔴 直播中
          </div>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            👁 {formatCount(12345)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="https://i.pravatar.cc/100?img=25"
                alt="主播头像"
                className="avatar"
                style={{ width: '64px', height: '64px' }}
              />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>主播昵称</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                  🎮 游戏分区 · {formatCount(100000)} 粉丝
                </p>
              </div>
            </div>
            <button
              className="btn"
              onClick={handleFollow}
              style={{
                backgroundColor: isFollowing ? '#52c41a' : 'var(--primary-color)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {isFollowing ? '✓ 已关注' : '+ 关注'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>直播信息</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              欢迎来到直播间！喜欢的话可以点个关注哦~
            </p>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>弹幕互动</h3>
            <div style={{
              height: '300px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              marginBottom: '12px'
            }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--primary-color)' }}>用户{i}: </span>
                  <span>666！主播好厉害！</span>
                </div>
              ))}
            </div>
            <input
              placeholder="发送弹幕..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>📺 直播中心</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: activeCategory === 'all' ? 'var(--primary-color)' : 'white',
              color: activeCategory === 'all' ? 'white' : 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            全部
          </button>
          {['游戏', '颜值', '音乐', '学习', '户外'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeCategory === cat ? 'var(--primary-color)' : 'white',
                color: activeCategory === cat ? 'white' : 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {rooms.map(room => (
            <Link
              key={room.id}
              to={`/live/${room.user_id}`}
              className="card"
              style={{ overflow: 'hidden' }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={room.cover}
                  alt={room.title}
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                />
                {room.is_living && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    🔴 直播中
                  </span>
                )}
                <span style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  👁 {formatCount(room.viewer_count)}
                </span>
              </div>
              <div style={{ padding: '12px' }}>
                <h3 className="text-ellipsis" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  {room.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={room.avatar} alt={room.nickname} className="avatar" style={{ width: '28px', height: '28px' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{room.nickname}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {room.category_name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Live;
