import { useState } from 'react';
import { 
  PlayCircle, 
  Eye, 
  Clock, 
  Search,
  TrendingUp,
  Film,
  ChevronRight
} from 'lucide-react';
import { mockData } from '../services/api';
import { useAppStore } from '../stores/appStore';

export default function VideoPage() {
  const { setCurrentMovieId, setCurrentPage } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['全部', '预告片', '幕后花絮', '电影解说', '明星访谈', '经典片段'];

  const filteredVideos = mockData.videos.filter(video => {
    const matchesCategory = activeCategory === '全部' || video.title.includes(activeCategory);
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatViews = (views: number) => {
    if (views >= 10000) {
      return (views / 10000).toFixed(1) + '万';
    }
    return views.toString();
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-cinema-red/20 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-cinema-text mb-2">快看视频</h1>
              <p className="text-cinema-text-secondary">精彩预告片、幕后花絮、电影解说</p>
            </div>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cinema-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索视频..."
                className="w-full pl-12 pr-4 py-3 bg-cinema-bg-light border border-cinema-border rounded-xl text-cinema-text placeholder-cinema-text-muted focus:outline-none focus:border-cinema-red transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-cinema-red text-white'
                  : 'bg-cinema-bg-light text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-border'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <div
              key={video.id}
              className="bg-cinema-bg-light rounded-xl overflow-hidden border border-cinema-border card-hover cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setCurrentPage('video-player')}
            >
              <div className="relative aspect-video">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-cinema-red/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white">
                  {video.duration}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-cinema-text line-clamp-2 mb-3 group-hover:text-cinema-red transition-colors">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between text-sm text-cinema-text-muted">
                  <div className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    <span>{video.author}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatViews(video.views)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{video.uploadTime}</span>
                    </div>
                  </div>
                </div>

                {video.movieId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMovieId(video.movieId!);
                      setCurrentPage('movie');
                    }}
                    className="mt-4 w-full py-2 border border-cinema-border rounded-lg text-sm text-cinema-text-secondary hover:border-cinema-red hover:text-cinema-red transition-colors flex items-center justify-center gap-1"
                  >
                    <Film className="w-4 h-4" />
                    购票观影
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-20">
            <PlayCircle className="w-16 h-16 text-cinema-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-cinema-text mb-2">暂无视频</h3>
            <p className="text-cinema-text-secondary">换个关键词试试吧</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 border-t border-cinema-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cinema-gold/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-cinema-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cinema-text">热门榜单</h2>
              <p className="text-sm text-cinema-text-secondary">本周最受欢迎视频</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[...mockData.videos].sort((a, b) => b.views - a.views).slice(0, 5).map((video, index) => (
            <div
              key={video.id}
              className="flex gap-4 p-4 bg-cinema-bg-light rounded-xl border border-cinema-border hover:border-cinema-red/50 transition-colors cursor-pointer"
            >
              <span className={`text-2xl font-bold ${
                index === 0 ? 'text-yellow-500' :
                index === 1 ? 'text-gray-400' :
                index === 2 ? 'text-amber-600' :
                'text-cinema-text-muted'
              }`}>
                {index + 1}
              </span>
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-cinema-text line-clamp-1 mb-1">
                  {video.title}
                </h4>
                <div className="flex items-center gap-3 text-sm text-cinema-text-muted">
                  <span>{video.author}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViews(video.views)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
