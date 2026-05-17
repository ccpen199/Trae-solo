import React, { useState, useEffect } from 'react';
import { Camera, Plus, Heart, Calendar, Image } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';
import { useToast } from '../components/Toast';

interface MediaItem {
  id: number;
  type: 'photo' | 'video';
  file_path: string;
  caption?: string;
  taken_at?: string;
  baby_name?: string;
  is_favorite?: number;
}

const Home: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/media');
      setMediaList(response.data.data?.list || []);
    } catch (err: any) {
      setError(err.errorMessage || '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const toggleFavorite = async (id: number) => {
    try {
      await apiClient.post(`/media/${id}/favorite`);
      setMediaList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_favorite: item.is_favorite ? 0 : 1 }
            : item
        )
      );
      showToast('操作成功', 'success');
    } catch (err: any) {
      showToast(err.errorMessage || '操作失败', 'error');
    }
  };

  const groupByMonth = (media: MediaItem[]) => {
    const groups: { [key: string]: MediaItem[] } = {};
    media.forEach((item) => {
      const date = item.taken_at
        ? new Date(item.taken_at)
        : new Date();
      const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream pb-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream pb-20 p-6">
        <div className="text-center card max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchMedia} className="btn-primary">
            点击重试
          </button>
        </div>
      </div>
    );
  }

  const groupedMedia = groupByMonth(mediaList);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">宝宝时光机</h1>
            <p className="text-sm text-gray-500">记录每一个成长瞬间</p>
          </div>
          <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <div className="flex-shrink-0 bg-gradient-to-br from-primary to-secondary rounded-2xl p-4 text-white w-40">
            <Camera className="w-8 h-8 mb-2" />
            <p className="font-semibold">今日记录</p>
            <p className="text-sm opacity-80">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex-shrink-0 bg-gradient-to-br from-sky to-green rounded-2xl p-4 text-white w-40">
            <Calendar className="w-8 h-8 mb-2" />
            <p className="font-semibold">本月照片</p>
            <p className="text-sm opacity-80">共 {mediaList.length} 张</p>
          </div>
        </div>

        {groupedMedia.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">还没有照片</h3>
            <p className="text-gray-500 mb-6">点击右下角相机按钮开始记录吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMedia.map(([month, items]) => (
              <div key={month}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <h2 className="font-semibold text-gray-700">{month}</h2>
                  <span className="text-sm text-gray-400">({items.length}张)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="relative rounded-2xl overflow-hidden shadow-md group"
                    >
                      <img
                        src={
                          item.file_path.startsWith('http')
                            ? item.file_path
                            : `http://localhost:48302${item.file_path}`
                        }
                        alt={item.caption || '照片'}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://picsum.photos/400/400?random=' + item.id;
                        }}
                      />
                      {item.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs">
                          视频
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {item.caption || '美好的瞬间'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-2 left-2 p-2 rounded-full bg-white/90 hover:bg-white transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            item.is_favorite
                              ? 'text-red-500 fill-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
