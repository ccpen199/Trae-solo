import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Music, UserPlus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { videoAPI, userAPI, commentAPI } from '../services/api';

const VideoPlayer = ({ video, onSwipeLeft, onSwipeRight }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(video?.is_liked || false);
  const [likeCount, setLikeCount] = useState(video?.like_count || 0);
  const [isFollowing, setIsFollowing] = useState(video?.is_following || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  const videoRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const navigate = useNavigate();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [video?.id]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startXRef.current;
    const diffY = endY - startYRef.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
      if (diffX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isLiked) {
        await videoAPI.unlike(video.id);
        setLikeCount((prev) => prev - 1);
      } else {
        await videoAPI.like(video.id);
        setLikeCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        await userAPI.unfollowUser(video.user_id);
      } else {
        await userAPI.followUser(video.user_id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleShowComments = async () => {
    setShowComments(true);
    try {
      const response = await commentAPI.getComments(video.id);
      setComments(response.data.data.list || []);
    } catch (error) {
      console.error('Get comments error:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await commentAPI.createComment(video.id, commentInput);
      setComments((prev) => [response.data.data, ...prev]);
      setCommentInput('');
      // 更新视频的评论计数
      video.comment_count = (video.comment_count || 0) + 1;
    } catch (error) {
      console.error('Submit comment error:', error);
      alert('评论发送失败，请重试');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        src={video?.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        loop
        playsInline
        muted
        onClick={handleVideoClick}
      />

      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '20px 0 20px 35px',
            borderColor: 'transparent transparent transparent #fff',
            marginLeft: '10px'
          }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        right: '12px',
        bottom: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '25px'
      }}>
        <div onClick={handleLike} style={{ cursor: 'pointer' }}>
          <Heart
            size={32}
            color={isLiked ? '#fe2c55' : '#fff'}
            fill={isLiked ? '#fe2c55' : 'none'}
          />
          <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
            {likeCount}
          </div>
        </div>

        <div onClick={handleShowComments} style={{ cursor: 'pointer' }}>
          <MessageCircle size={32} color="#fff" />
          <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
            {video?.comment_count || 0}
          </div>
        </div>

        <div
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: video?.title || '精彩视频',
                text: video?.description || '来看这个精彩视频！',
                url: window.location.href
              }).catch(() => {});
            } else {
              alert('分享功能已触发');
            }
          }}
        >
          <Share2 size={32} color="#fff" />
          <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
            {video?.share_count || 0}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '2px solid #fff',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/user/${video?.user_id}`)}
          >
            <img
              src={video?.avatar || 'https://picsum.photos/100/100'}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          {!isFollowing && (
            <div
              onClick={handleFollow}
              style={{
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#fe2c55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={14} color="#fff" />
            </div>
          )}
          {isFollowing && (
            <div
              onClick={handleFollow}
              style={{
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Check size={14} color="#fff" />
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: '16px',
        right: '80px',
        bottom: '80px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
          @{video?.nickname || '用户'}
        </h3>
        <p style={{ fontSize: '14px', marginBottom: '8px', lineHeight: '1.4' }}>
          {video?.description || '这是一个精彩的视频'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Music size={16} color="#fff" />
          <span style={{ fontSize: '12px' }}>原声 - {video?.nickname || '用户'}</span>
        </div>
      </div>

      {showComments && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: '#1a1a1a',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 'bold' }}>评论 ({comments.length})</span>
            <span
              onClick={() => setShowComments(false)}
              style={{ cursor: 'pointer', color: '#999' }}
            >
              关闭
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>暂无评论</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={comment.avatar || 'https://picsum.photos/40/40'}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>
                      {comment.nickname || '用户'}
                    </div>
                    <div style={{ fontSize: '14px' }}>{comment.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {isAuthenticated && (
            <div style={{
              padding: '16px',
              borderTop: '1px solid #333',
              display: 'flex',
              gap: '12px'
            }}>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="发表评论..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: '#333',
                  color: '#fff',
                  outline: 'none'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                onClick={handleSubmitComment}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: '#fe2c55',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                发送
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
