import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  Clock,
  ThumbsUp,
  X
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { mockData } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function VideoPlayerPage() {
  const { setCurrentPage, setCurrentMovieId, movies } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1235);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  const videoRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, duration]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  const currentVideo = mockData.videos[0];
  const relatedMovies = movies.filter(m => m.status === 'showing').slice(0, 4);

  return (
    <div className="min-h-screen bg-cinema-bg">
      <div className="relative">
        <div 
          ref={videoRef}
          className="relative h-[50vh] md:h-[70vh] bg-gradient-to-br from-gray-900 to-black cursor-pointer"
          onClick={() => {
            setIsPlaying(!isPlaying);
            setShowControls(true);
          }}
        >
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="w-full h-full object-cover opacity-80"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent" />
          
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="w-20 h-20 bg-cinema-red/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white" />
              ) : (
                <Play className="w-10 h-10 text-white ml-1" />
              )}
            </button>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setCurrentPage('videos')}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={() => setShowMoreInfo(true)} className="text-white font-medium text-lg flex-1 text-left">
                {currentVideo.title}
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTime(Math.max(0, currentTime - 10));
                  }}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(!isPlaying);
                  }}
                  className="w-12 h-12 bg-cinema-red rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTime(Math.min(duration, currentTime + 10));
                  }}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <div className="flex-1 mx-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = x / rect.width;
                        setCurrentTime(Math.floor(percentage * duration));
                      }}
                    >
                      <div 
                        className="h-full bg-cinema-red rounded-full relative"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-white text-sm">{formatTime(duration)}</span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="px-3 py-1 bg-black/70 rounded-full flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            <span className="text-white text-sm">{(currentVideo.views / 10000).toFixed(1)}万播放</span>
          </div>
          <div className="px-3 py-1 bg-black/70 rounded-full flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-sm">{currentVideo.duration}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{currentVideo.title}</h1>
                <div className="flex items-center gap-4 text-cinema-text-secondary">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-cinema-bg-light flex items-center justify-center text-cinema-gold font-bold">
                      {currentVideo.author.charAt(0)}
                    </span>
                    {currentVideo.author}
                  </span>
                  <span>{currentVideo.uploadTime}</span>
                  <span>播放完成率: 87%</span>
                  <span>互动密度: 92%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                    isLiked ? 'bg-cinema-red text-white' : 'bg-cinema-bg-light text-cinema-text-secondary hover:bg-cinema-border'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? '已点赞' : '点赞'}
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-cinema-bg-light text-cinema-text-secondary hover:bg-cinema-border rounded-full transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  评论
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-cinema-bg-light text-cinema-text-secondary hover:bg-cinema-border rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                  分享
                </button>
                <button className="p-3 bg-cinema-bg-light text-cinema-text-secondary hover:bg-cinema-border rounded-full transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-cinema-bg-light rounded-xl p-6 border border-cinema-border mb-8">
              <h3 className="text-lg font-bold text-white mb-4">推荐说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-cinema-bg rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-5 h-5 text-cinema-red" />
                    <span className="text-cinema-text-secondary text-sm">内容质量</span>
                  </div>
                  <p className="text-2xl font-bold text-white">95分</p>
                </div>
                <div className="p-4 bg-cinema-bg rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-cinema-gold" />
                    <span className="text-cinema-text-secondary text-sm">观看完成率</span>
                  </div>
                  <p className="text-2xl font-bold text-white">87%</p>
                </div>
                <div className="p-4 bg-cinema-bg rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-cinema-text-secondary text-sm">互动密度</span>
                  </div>
                  <p className="text-2xl font-bold text-white">92%</p>
                </div>
                <div className="p-4 bg-cinema-bg rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-5 h-5 text-green-400" />
                    <span className="text-cinema-text-secondary text-sm">跨平台热度</span>
                  </div>
                  <p className="text-2xl font-bold text-white">极高</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4">评论区</h3>
              <div className="space-y-4">
                {[
                  { id: 1, user: '电影发烧友', content: '太精彩了！这个幕后特辑让我对诺兰更加佩服了', likes: 123 },
                  { id: 2, user: '科幻迷', content: '黑洞的视觉效果原来是这样做出来的，长知识了', likes: 89 },
                  { id: 3, user: '路人甲', content: '期待在影院看到完整版', likes: 45 },
                ].map((comment) => (
                  <div key={comment.id} className="bg-cinema-bg-light rounded-xl p-4 border border-cinema-border">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-10 h-10 rounded-full bg-cinema-bg flex items-center justify-center text-cinema-gold font-bold">
                        {comment.user.charAt(0)}
                      </span>
                      <span className="text-white font-medium">{comment.user}</span>
                    </div>
                    <p className="text-cinema-text-secondary mb-3">{comment.content}</p>
                    <div className="flex items-center gap-4 text-cinema-text-muted text-sm">
                      <button className="flex items-center gap-1 hover:text-cinema-red transition-colors">
                        <Heart className="w-4 h-4" />
                        {comment.likes}
                      </button>
                      <button className="hover:text-white transition-colors">回复</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-80">
            <h3 className="text-lg font-bold text-white mb-4">相关影片推荐</h3>
            <div className="space-y-4">
              {relatedMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="flex gap-3 cursor-pointer group"
                  onClick={() => {
                    setCurrentMovieId(movie.id);
                    setCurrentPage('movie');
                  }}
                >
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-24 h-32 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium line-clamp-2 group-hover:text-cinema-red transition-colors">
                      {movie.title}
                    </h4>
                    <p className="text-cinema-text-muted text-sm mt-1">{movie.genre.join(' / ')}</p>
                    <p className="text-cinema-gold text-sm mt-1">评分: {movie.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showMoreInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowMoreInfo(false)}>
          <div className="bg-cinema-bg rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">视频详情</h2>
              <button onClick={() => setShowMoreInfo(false)} className="text-cinema-text-muted hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <img
                  src={currentVideo.thumbnail}
                  alt={currentVideo.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{currentVideo.title}</h3>
                <div className="flex items-center gap-4 text-cinema-text-secondary">
                  <span>{currentVideo.author}</span>
                  <span>{currentVideo.uploadTime}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-cinema-bg-light rounded-lg">
                  <p className="text-2xl font-bold text-white">{(currentVideo.views / 10000).toFixed(1)}万</p>
                  <p className="text-cinema-text-muted text-sm">播放量</p>
                </div>
                <div className="text-center p-4 bg-cinema-bg-light rounded-lg">
                  <p className="text-2xl font-bold text-white">2.3万</p>
                  <p className="text-cinema-text-muted text-sm">点赞</p>
                </div>
                <div className="text-center p-4 bg-cinema-bg-light rounded-lg">
                  <p className="text-2xl font-bold text-white">568</p>
                  <p className="text-cinema-text-muted text-sm">评论</p>
                </div>
              </div>
              
              {currentVideo.movieId && (
                <button
                  onClick={() => {
                    setCurrentMovieId(currentVideo.movieId!);
                    setCurrentPage('movie');
                    setShowMoreInfo(false);
                  }}
                  className="w-full py-3 bg-cinema-red text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  查看正片购票
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
