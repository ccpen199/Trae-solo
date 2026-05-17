import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import request from '../utils/request';
import Loading from '../components/Loading';
import useStore from '../store/useStore';

const VideoDetail = () => {
  const { bvid } = useParams();
  const { user, isAuthenticated } = useStore(state => ({ user: state.user, isAuthenticated: state.isAuthenticated }));
  const [video, setVideo] = useState(null);
  const [userInteraction, setUserInteraction] = useState({});
  const [comments, setComments] = useState([]);
  const [danmakus, setDanmakus] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newDanmaku, setNewDanmaku] = useState('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideoDetail();
    fetchComments();
    fetchDanmakus();
  }, [bvid]);

  const fetchVideoDetail = async () => {
    try {
      const res = await request.get(`/videos/detail/${bvid}`);
      setVideo(res.data?.video || getMockVideo());
      setUserInteraction(res.data?.userInteraction || {});
    } catch (error) {
      console.error('获取视频详情失败:', error);
      setVideo(getMockVideo());
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await request.get(`/videos/comments/${bvid}`);
      setComments(res.data?.list || getMockComments());
    } catch (error) {
      setComments(getMockComments());
    }
  };

  const fetchDanmakus = async () => {
    try {
      const res = await request.get(`/videos/danmaku/${bvid}`);
      setDanmakus(res.data || []);
    } catch (error) {
      setDanmakus([]);
    }
  };

  useEffect(() => {
    if (video && typeof video.duration === 'number') {
      setDuration(video.duration);
    } else if (video && typeof video.duration === 'string') {
      const parts = video.duration.split(':');
      setDuration(parseInt(parts[0]) * 60 + parseInt(parts[1]));
    } else {
      setDuration(754);
    }
  }, [video]);

  const handleVideoTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleVideoEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const videoDuration = duration || 754;
    const newTime = percent * videoDuration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      const videoElement = videoRef.current.querySelector('video');
      if (videoElement) {
        videoElement.currentTime = newTime;
      }
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      alert('请先登录后再关注UP主');
      return;
    }
    try {
      if (isFollowing) {
        await request.delete(`/user/unfollow/${video.user_id}`);
        setIsFollowing(false);
      } else {
        await request.post(`/user/follow/${video.user_id}`);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      setIsFollowing(!isFollowing);
    }
  };

  const getMockVideo = () => ({
    bvid,
    title: '【4K】绝美风景合集，治愈你的心灵 | 放松心情 | 背景音乐',
    description: '这是一个视频描述，包含了很多精彩的内容。欢迎观看、点赞、投币、收藏！',
    cover: 'https://picsum.photos/800/450?random=1',
    duration: '12:34',
    view_count: 1234567,
    like_count: 89012,
    coin_count: 45678,
    collect_count: 23456,
    danmaku_count: 12345,
    comment_count: 6789,
    share_count: 3456,
    author_name: '风景UP主',
    author_avatar: 'https://i.pravatar.cc/100?img=1',
    created_at: Date.now() / 1000 - 86400 * 3,
    is_vip: false
  });

  const getMockComments = () => {
    const comments = [];
    const texts = [
      '太好看了！', '已三连支持', '这风景绝了', 'UP主加油', '每天都来看一遍',
      '背景音乐是什么？', '治愈了我的心灵', '4K画质真棒', '收藏了', '弹幕护体'
    ];
    for (let i = 0; i < 10; i++) {
      comments.push({
        id: i + 1,
        content: texts[i],
        user_id: i + 1,
        nickname: `用户${i + 1}`,
        avatar: `https://i.pravatar.cc/40?img=${i + 5}`,
        like_count: Math.floor(Math.random() * 1000),
        created_at: Date.now() / 1000 - Math.random() * 86400
      });
    }
    return comments;
  };

  const handleInteract = async (type) => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    try {
      await request.post(`/videos/interact/${bvid}`, { type });
      setUserInteraction(prev => ({ ...prev, [type]: !prev[type] }));
      if (video) {
        const key = `${type}_count`;
        const change = userInteraction[type] ? -1 : 1;
        setVideo(prev => ({ ...prev, [key]: (prev[key] || 0) + change }));
      }
    } catch (error) {
      console.error('互动失败:', error);
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    if (!newComment.trim()) return;

    try {
      await request.post(`/videos/comment/${bvid}`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      alert(error.message || '发送评论失败');
    }
  };

  const handleSendDanmaku = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    if (!newDanmaku.trim()) return;

    try {
      await request.post(`/videos/danmaku/${bvid}`, {
        content: newDanmaku,
        time: currentTime,
        color: '#ffffff',
        type: 1
      });
      setDanmakus(prev => [...prev, {
        time: currentTime,
        content: newDanmaku,
        color: '#ffffff',
        type: 1
      }]);
      setNewDanmaku('');
    } catch (error) {
      alert(error.message || '发送弹幕失败');
    }
  };

  const formatCount = (num) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num?.toString() || '0';
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    if (days > 0) return `${days}天前`;
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) return `${hours}小时前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <Loading />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
        <p>视频不存在</p>
        <Link to="/" style={{ color: 'var(--primary-color)' }}>返回首页</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <style>{`
        @keyframes danmakuScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100vw); }
        }
        .danmaku-item {
          position: absolute;
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          white-space: nowrap;
          animation: danmakuScroll 8s linear forwards;
          pointer-events: none;
        }
      `}</style>
      <div style={{
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div
          ref={videoRef}
          onClick={() => setPlaying(!playing)}
          style={{
            width: '100%',
            aspectRatio: '16/9',
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          <video
            src="https://www.w3schools.com/html/movie.mp4"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: playing ? 'block' : 'none'
            }}
            autoPlay={playing}
            muted
            loop
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
          />
          {!playing && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${video.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'white'
              }}>
                ▶
              </div>
            </div>
          )}
          {showDanmaku && danmakus.map((danmaku, i) => {
            const delay = Math.max(0, danmaku.time - currentTime);
            if (delay > 5 || currentTime > danmaku.time + 8) return null;
            return (
              <div
                key={i}
                className="danmaku-item"
                style={{
                  color: danmaku.color || '#ffffff',
                  top: `${10 + (i % 5) * 15}%`,
                  animationDelay: `${delay}s`
                }}
              >
                {danmaku.content}
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => setPlaying(!playing)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <div
            style={{ flex: 1, height: '4px', backgroundColor: '#444', borderRadius: '2px', cursor: 'pointer' }}
            onClick={handleSeek}
          >
            <div style={{
              width: `${(currentTime / (duration || 754)) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--primary-color)',
              borderRadius: '2px'
            }} />
          </div>
          <span style={{ color: 'white', fontSize: '14px' }}>
            {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor((duration || 754) / 60)}:{String(Math.floor((duration || 754) % 60)).padStart(2, '0')}
          </span>
          <button
            onClick={() => setShowDanmaku(!showDanmaku)}
            style={{
              background: showDanmaku ? 'var(--primary-color)' : '#444',
              border: 'none',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            弹幕 {showDanmaku ? '开' : '关'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>{video.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <Link to={`/user/1`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={video.author_avatar} alt={video.author_name} className="avatar" style={{ width: '48px', height: '48px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>{video.author_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatTime((Date.now() / 1000 - video.created_at) / 60)} 发布
              </div>
            </div>
          </Link>
          <button
            className="btn btn-primary"
            onClick={handleFollow}
            style={{
              backgroundColor: isFollowing ? '#52c41a' : 'var(--primary-color)',
              cursor: 'pointer'
            }}
          >
            {isFollowing ? '✓ 已关注' : '+ 关注'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleInteract('like')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: userInteraction.like ? 'var(--primary-color)' : 'var(--bg-secondary)',
              color: userInteraction.like ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👍 点赞 {formatCount(video.like_count)}
          </button>
          <button
            onClick={() => handleInteract('coin')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: userInteraction.coin ? '#fb7299' : 'var(--bg-secondary)',
              color: userInteraction.coin ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💰 投币 {formatCount(video.coin_count)}
          </button>
          <button
            onClick={() => handleInteract('collect')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: userInteraction.collect ? '#52c41a' : 'var(--bg-secondary)',
              color: userInteraction.collect ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⭐ 收藏 {formatCount(video.collect_count)}
          </button>
          <button
            onClick={() => handleInteract('share')}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔗 分享 {formatCount(video.share_count)}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            评论 {video.comment_count}
          </h2>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <img
              src={user?.avatar || 'https://i.pravatar.cc/40?img=99'}
              alt="我的头像"
              className="avatar"
              style={{ width: '40px', height: '40px' }}
            />
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="发表评论..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  resize: 'none',
                  minHeight: '80px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={handleSendComment}
                  className="btn btn-primary"
                  style={{ padding: '6px 20px', fontSize: '14px' }}
                >
                  发表
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <img
              src={user?.avatar || 'https://i.pravatar.cc/40?img=99'}
              alt="我的头像"
              className="avatar"
              style={{ width: '40px', height: '40px' }}
            />
            <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                value={newDanmaku}
                onChange={(e) => setNewDanmaku(e.target.value)}
                placeholder="发送弹幕..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendDanmaku()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleSendDanmaku}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                发送
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                <img src={comment.avatar} alt={comment.nickname} className="avatar" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{comment.nickname}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatTime((Date.now() / 1000 - comment.created_at) / 60)}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{comment.content}</p>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <span>👍 {comment.like_count}</span>
                    <span>💬 回复</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes danmakuScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-200%); }
        }
      `}</style>
    </div>
  );
};

export default VideoDetail;
