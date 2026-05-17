import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, UserPlus, Music } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import { videoAPI, followAPI } from '../utils/api';
import useUserStore from '../store/userStore';
import useToastStore from '../store/toastStore';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import CommentModal from '../components/CommentModal';
import LoginModal from '../components/LoginModal';
import 'swiper/css';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('recommend');
  const [showLogin, setShowLogin] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const videoRefs = useRef({});
  
  const { isLoggedIn } = useUserStore();
  const { show } = useToastStore();

  useEffect(() => {
    loadVideos();
  }, [activeTab]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    setActiveIndex(0);
    try {
      const res = activeTab === 'recommend' 
        ? await videoAPI.getRecommend()
        : await videoAPI.getNearby();
      if (res.success) {
        setVideos(res.data.list || []);
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLike = async (video, index) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    try {
      const res = await videoAPI.like(video.id);
      if (res.success) {
        const newVideos = [...videos];
        newVideos[index] = {
          ...newVideos[index],
          is_liked: !newVideos[index].is_liked,
          likes_count: (newVideos[index].likes_count || 0) + (res.data.is_liked ? 1 : -1)
        };
        setVideos(newVideos);
      }
    } catch (err) {
      show(err.message || '操作失败');
    }
  };

  const handleFavorite = async (video, index) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    try {
      const res = await videoAPI.favorite(video.id);
      if (res.success) {
        const newVideos = [...videos];
        newVideos[index] = {
          ...newVideos[index],
          is_favorited: !newVideos[index].is_favorited
        };
        setVideos(newVideos);
        show(res.data.is_favorited ? '收藏成功' : '取消收藏');
      }
    } catch (err) {
      show(err.message || '操作失败');
    }
  };

  const handleFollow = async (video, index) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    try {
      const res = await followAPI.follow(video.author_id);
      if (res.success) {
        const newVideos = [...videos];
        newVideos[index] = {
          ...newVideos[index],
          is_followed: !newVideos[index].is_followed
        };
        setVideos(newVideos);
        show(res.data.is_followed ? '关注成功' : '取消关注');
      }
    } catch (err) {
      show(err.message || '操作失败');
    }
  };

  const handleComment = (video) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    setSelectedVideo(video);
    setShowComment(true);
  };

  const handleShare = async (video) => {
    try {
      await videoAPI.share(video.id);
      show('分享成功');
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadVideos} />;

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', position: 'relative' }}>
      <div className="home-header">
        <div className="home-tabs">
          <span 
            className={`home-tab ${activeTab === 'recommend' ? 'active' : ''}`}
            onClick={() => handleTabChange('recommend')}
          >
            推荐
          </span>
          <span 
            className={`home-tab ${activeTab === 'nearby' ? 'active' : ''}`}
            onClick={() => handleTabChange('nearby')}
          >
            同城
          </span>
        </div>
      </div>

      <Swiper
        direction="vertical"
        modules={[Mousewheel]}
        style={{ width: '100%', height: '100%' }}
        onSlideChange={({ activeIndex }) => setActiveIndex(activeIndex)}
        mousewheel={true}
      >
        {videos.map((video, index) => (
          <SwiperSlide key={video.id}>
            <div className="video-container">
              <video
                ref={el => videoRefs.current[index] = el}
                className="video-element"
                src={video.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                poster={video.cover_url}
                loop
                muted
                playsInline
                autoPlay={index === activeIndex}
                onClick={(e) => {
                  const videoEl = e.target;
                  if (videoEl.paused) {
                    videoEl.play();
                  } else {
                    videoEl.pause();
                  }
                }}
              />
              
              <div className="video-overlay">
                <div className="video-author">
                  <img 
                    className="avatar" 
                    src={video.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.author_id}`} 
                    alt="" 
                  />
                  <span className="author-name">@{video.author_name || '用户'}</span>
                  {!video.is_followed && (
                    <button className="follow-btn" onClick={() => handleFollow(video, index)}>
                      <UserPlus size={14} />
                    </button>
                  )}
                </div>
                <div className="video-title">{video.title || '精彩视频'}</div>
                <div className="video-music">
                  <Music size={14} />
                  <span>原声 - {video.author_name || '用户'}</span>
                </div>
              </div>

              <div className="side-actions">
                <button className={`action-btn ${video.is_liked ? 'liked' : ''}`} onClick={() => handleLike(video, index)}>
                  <div className="action-icon"><Heart size={24} /></div>
                  <span className="action-count">{formatCount(video.likes_count)}</span>
                </button>
                
                <button className="action-btn" onClick={() => handleComment(video)}>
                  <div className="action-icon"><MessageCircle size={24} /></div>
                  <span className="action-count">{formatCount(video.comments_count)}</span>
                </button>
                
                <button className={`action-btn ${video.is_favorited ? 'favorited' : ''}`} onClick={() => handleFavorite(video, index)}>
                  <div className="action-icon"><Bookmark size={24} /></div>
                  <span className="action-count">收藏</span>
                </button>
                
                <button className="action-btn" onClick={() => handleShare(video)}>
                  <div className="action-icon"><Share2 size={24} /></div>
                  <span className="action-count">{formatCount(video.shares_count)}</span>
                </button>

                <div className="music-disc">
                  <Music size={16} />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
      <CommentModal 
        visible={showComment} 
        onClose={() => setShowComment(false)} 
        videoId={selectedVideo?.id}
        commentCount={selectedVideo?.comments_count}
      />
    </div>
  );
}
