import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { videoApi } from '@/api';
import { useToastStore } from '@/store';
import { PageLoading } from '@/components/Loading.jsx';
import Empty from '@/components/Empty.jsx';
import { Search as SearchIcon, X, Play } from 'lucide-react';
import { formatCount, formatDuration } from '@/utils';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(query);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!query);

  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      showToast('请输入搜索关键词', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await videoApi.search(keyword.trim());
      setVideos(res.data.data.videos || []);
      setHasSearched(true);
      setSearchParams({ q: keyword.trim() });
    } catch (error) {
      showToast('搜索失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setKeyword('');
    setVideos([]);
    setHasSearched(false);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-16 md:pb-0">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <X size={24} className="text-neutral-600" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索视频、UP主..."
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            {keyword && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <PageLoading />
        ) : hasSearched ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-neutral-800">
                搜索结果 ({videos.length})
              </h2>
            </div>
            {videos.length === 0 ? (
              <Empty message={`没有找到"${query}"相关的视频`} type="search" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <Link
                    key={video.id}
                    to={`/video/${video.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.cover_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-neutral-800 line-clamp-2 mb-2 text-sm">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 overflow-hidden">
                            {video.avatar ? (
                              <img src={video.avatar} alt="" className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <span className="text-xs text-neutral-500">{video.username}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Play size={10} />
                          {formatCount(video.play_count || 0)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <SearchIcon size={64} className="text-neutral-300 mb-4" />
            <p className="text-neutral-500 mb-2">输入关键词搜索视频</p>
            <p className="text-xs text-neutral-400">支持按标题、描述搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}
