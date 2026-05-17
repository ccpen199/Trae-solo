import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Music, UserPlus, Check } from 'lucide-react';
import useUserStore from '../store/userStore';
import { videoAPI, commentAPI } from '../services/api';

const VideoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef(null);

  useEffect(() => {
    loadVideo();
    loadComments();
  }, [id]);

  const loadVideo = async () => {
    try {
      const response = await videoAPI.getById(parseInt(id));
      const videoData = response.data.data;
      setVideo(videoData);
      setIsLiked(videoData.is_liked || false);
      setIsFollowing(videoData.is_following || false);
    } catch (error) {
      console.error('Load video error:', error);
      setVideo({
        id: parseInt(id),
        user_id: 1,
        nickname: '视频作者',
        avatar: `https://picsum.photos/100/100?random=${id}`,
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        description: '这是一个精彩的视频内容',
        like_count: 1234,
        comment_count: 56,
        share_count: 78,
        view_count: 9999
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentAPI.getComments(parseInt(id));
      setComments(response.data.data.list || []);
    } catch (error) {
      console.error('Load comments error:', error);
      const mockComments = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        user_id: i + 10,
        nickname: `用户${i + 1}`,
        avatar: `https://picsum.photos/40/40?random=${i + 100}`,
        content: `这个视频太棒了！评论${i + 1}`,
        like_count: Math.floor(Math.random() * 100)
      }));
      setComments(mockComments);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isLiked) {
        await videoAPI.unlike(parseInt(id));
        setVideo((prev) => ({ ...prev, like_count: prev.like_count - 1 }));
      } else {
        await videoAPI.like(parseInt(id));
        setVideo((prev) => ({ ...prev, like_count: prev.like_count + 1 }));
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
      // 动态导入 userAPI 避免循环依赖
      const { userAPI } = await import('../services/api');
      if (isFollowing) {
        await userAPI.unfollowUser(video.user_id);
        setIsFollowing(false);
      } else {
        await userAPI.followUser(video.user_id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow error:', error);
      alert('操作失败，请重试');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await commentAPI.createComment(parseInt(id), commentInput);
      setComments((prev) => [response.data.data, ...prev]);
      setVideo((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
      setCommentInput('');
    } catch (error) {
      console.error('Submit comment error:', error);
      const newComment = {
        id: Date.now(),
        nickname: '我',
        avatar: 'https://picsum.photos/40/40?random=999',
        content: commentInput,
        like_count: 0
      };
      setComments((prev) => [newComment, ...prev]);
      setVideo((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
      setCommentInput('');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: '#000' }}>
      <div style={{ position: 'relative', height: '50vh', background: '#000' }}>
        <video
          ref={videoRef}
          src={video?.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          controls
          muted
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '50px 20px 20px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)'
        }}>
          <ArrowLeft
            size={24}
            color="#fff"
            onClick={() => navigate(-1)}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <img
            src={video?.avatar || `https://picsum.photos/50/50?random=${video?.user_id}`}
            alt="avatar"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/user/${video?.user_id}`)}
          />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              @{video?.nickname || '用户'}
            </div>
          </div>
          <button
            onClick={handleFollow}
            style={{
              padding: '8px 20px',
              background: isFollowing ? '#333' : '#fe2c55',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isFollowing ? <Check size={16} /> : <UserPlus size={16} />}
            {isFollowing ? '已关注' : '关注'}
          </button>
        </div>

        <p style={{ color: '#fff', fontSize: '14px', marginBottom: '16px' }}>
          {video?.description || '这是一个精彩的视频'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Music size={16} color="#999" />
          <span style={{ color: '#999', fontSize: '12px' }}>原声音乐</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '16px 0',
          borderTop: '1px solid #333',
          borderBottom: '1px solid #333',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleLike}>
            <Heart
              size={28}
              color={isLiked ? '#fe2c55' : '#fff'}
              fill={isLiked ? '#fe2c55' : 'none'}
            />
            <div style={{ color: '#fff', fontSize: '12px', marginTop: '4px' }}>
              {video?.like_count || 0}
            </div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
            document.querySelector('input[type="text"]')?.focus();
          }}>
            <MessageCircle size={28} color="#fff" />
            <div style={{ color: '#fff', fontSize: '12px', marginTop: '4px' }}>
              {video?.comment_count || 0}
            </div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: video?.title || '精彩视频',
                text: video?.description || '来看这个精彩视频！',
                url: window.location.href
              }).catch(() => {});
            } else {
              alert('分享功能已触发');
            }
          }}>
            <Share2 size={28} color="#fff" />
            <div style={{ color: '#fff', fontSize: '12px', marginTop: '4px' }}>
              {video?.share_count || 0}
            </div>
          </div>
        </div>

        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>
          评论 ({comments.length})
        </h3>

        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          {comments.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              暂无评论，快来抢沙发吧！
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #222'
              }}>
                <img
                  src={comment.avatar || `https://picsum.photos/40/40?random=${comment.id}`}
                  alt="avatar"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>
                    {comment.nickname || '用户'}
                  </div>
                  <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>
                    {comment.content}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    ❤️ {comment.like_count}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder={isAuthenticated ? '发表评论...' : '登录后发表评论'}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: 'none',
              background: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            disabled={!isAuthenticated}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!isAuthenticated}
            style={{
              padding: '12px 24px',
              borderRadius: '24px',
              border: 'none',
              background: isAuthenticated ? '#fe2c55' : '#333',
              color: '#fff',
              fontSize: '14px',
              cursor: isAuthenticated ? 'pointer' : 'not-allowed'
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
