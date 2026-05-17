import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoApi, commentApi, messageApi } from '@/api';
import { useAuthStore, useToastStore } from '@/store';
import { PageLoading } from '@/components/Loading.jsx';
import Empty from '@/components/Empty.jsx';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ThumbsUp,
  MessageCircle,
  Star,
  User,
  Send,
} from 'lucide-react';
import { formatCount, formatDate } from '@/utils';

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [danmakuContent, setDanmakuContent] = useState('');

  const { user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    fetchVideoDetail();
    fetchComments();
  }, [id]);

  const fetchVideoDetail = async () => {
    try {
      const response = await videoApi.getDetail(id);
      setVideo(response.data.data);
    } catch (error) {
      showToast('加载视频失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentApi.getList(id, {});
      setComments(response.data.data.comments || []);
    } catch (error) {
      console.error('加载评论失败', error);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/video/${id}` } } });
      return;
    }
    try {
      await videoApi.like(id);
      setVideo((prev) => ({
        ...prev,
        isLiked: !prev.isLiked,
        like_count: prev.isLiked ? prev.like_count - 1 : prev.like_count + 1
      }));
      showToast(video.isLiked ? '已取消点赞' : '点赞成功', 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/video/${id}` } } });
      return;
    }
    try {
      await messageApi.follow(video.user_id);
      setVideo((prev) => ({ ...prev, isFollowing: !prev.isFollowing }));
      showToast(video.isFollowing ? '已取消关注' : '关注成功', 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleSendComment = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/video/${id}` } } });
      return;
    }
    if (!commentContent.trim()) {
      showToast('请输入评论内容', 'error');
      return;
    }
    try {
      await commentApi.publish(id, { content: commentContent.trim() });
      setCommentContent('');
      showToast('评论发布成功', 'success');
      fetchComments();
    } catch (error) {
      showToast('发布失败', 'error');
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Empty message="视频不存在" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-16 md:pb-0">
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={video.cover_url}
          onClick={togglePlay}
          playsInline
        >
          <source src={video.video_url} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 text-white">
            <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="p-6 bg-primary rounded-full hover:bg-primary-dark transition-colors shadow-lg"
            >
              <Play size={48} className="text-white" fill="white" />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 bg-white">
        <input
          type="text"
          value={danmakuContent}
          onChange={(e) => setDanmakuContent(e.target.value)}
          placeholder="发个弹幕~"
          className="flex-1 px-4 py-2 bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors">
          发送
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-4 mb-4">
              <h1 className="text-xl font-bold text-neutral-800 mb-3">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-4">
                <span>{formatCount(video.play_count || 0)}播放</span>
                <span>{formatCount(video.like_count || 0)}点赞</span>
                <span>{formatDate(video.created_at)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden">
                    {video.avatar ? (
                      <img src={video.avatar} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-800">{video.username}</div>
                  </div>
                </div>
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${
                    video.isFollowing
                      ? 'bg-neutral-100 text-neutral-600'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {video.isFollowing ? '已关注' : '+ 关注'}
                </button>
              </div>

              <div className="flex items-center justify-around mt-4 pt-4 border-t border-neutral-100">
                <button
                  onClick={handleLike}
                  className={`flex flex-col items-center gap-1 ${video.isLiked ? 'text-primary' : 'text-neutral-500'}`}
                >
                  <ThumbsUp size={24} fill={video.isLiked ? 'currentColor' : 'none'} />
                  <span className="text-xs">{formatCount(video.like_count || 0)}</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-neutral-500">
                  <MessageCircle size={24} />
                  <span className="text-xs">{formatCount(video.comment_count || 0)}</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-neutral-500">
                  <Star size={24} />
                  <span className="text-xs">收藏</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4">
              <h2 className="font-bold text-neutral-800 mb-4">评论 {comments.length}</h2>
              
              <div className="flex gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-2 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="说点什么..."
                    className="w-full px-4 py-2 bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSendComment}
                      className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                      发布
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <Empty message="暂无评论，快来抢沙发~" />
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-800 text-sm">{comment.username}</span>
                          <span className="text-xs text-neutral-400">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-neutral-700 text-sm mb-2">{comment.content}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {}}
                            className={`flex items-center gap-1 text-xs ${
                              comment.isLiked ? 'text-primary' : 'text-neutral-400'
                            }`}
                          >
                            <ThumbsUp size={14} fill={comment.isLiked ? 'currentColor' : 'none'} />
                            {comment.like_count || 0}
                          </button>
                          <button className="flex items-center gap-1 text-xs text-neutral-400">
                            <MessageCircle size={14} />
                            回复
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 sticky top-20">
              <h3 className="font-bold text-neutral-800 mb-4">推荐视频</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-32 h-18 bg-neutral-200 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={`https://picsum.photos/seed/rec${i}/128/72`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 line-clamp-2">
                        这是一个推荐视频标题示例
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">UP主名称 · {i * 1000}播放</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
