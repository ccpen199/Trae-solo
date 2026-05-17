import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoApi } from '@/api';
import { useToastStore } from '@/store';
import { PageLoading } from '@/components/Loading.jsx';
import Empty from '@/components/Empty.jsx';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCount, formatDuration } from '@/utils';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [banners, setBanners] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    fetchHomeData();
  }, [activeTag]);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await videoApi.getHome({ tag: activeTag });
      const data = response.data.data;
      setBanners(data.banners || []);
      setTags(data.tags || []);
      setVideos(data.videos || []);
    } catch (error) {
      showToast('加载失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto p-4">
        {banners.length > 0 && (
          <div className="relative rounded-xl overflow-hidden mb-6 aspect-[21/9] md:aspect-[5/2]">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentBanner ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 text-white font-medium">
                  {banner.title}
                </div>
              </div>
            ))}
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentBanner ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setActiveTag('')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTag === ''
                    ? 'bg-primary text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                推荐
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(tag.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTag === tag.name
                      ? 'bg-primary text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {videos.length === 0 ? (
          <Empty message="暂无视频" />
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
      </div>
    </div>
  );
}
