import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentApi, dataApi } from '../../lib/api';
import type { Content, ScenicSpot } from '../../../shared/types';

const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredContent, setFeaturedContent] = useState<Content[]>([]);
  const [hotSpots, setHotSpots] = useState<ScenicSpot[]>([]);

  const { data: contentData } = useQuery({
    queryKey: ['h5-content'],
    queryFn: async () => {
      const res = await contentApi.getList({ page: 1, pageSize: 6, status: 'published' });
      return res.data;
    },
  });

  const { data: scenicData } = useQuery({
    queryKey: ['h5-scenic'],
    queryFn: async () => {
      const res = await dataApi.getScenicSpots({ page: 1, pageSize: 4 });
      return res.data;
    },
  });

  useEffect(() => {
    if (contentData?.items) setFeaturedContent(contentData.items);
    if (scenicData?.items) setHotSpots(scenicData.items);
  }, [contentData, scenicData]);

  const quickLinks = [
    { icon: '🎫', label: '景区门票', color: 'bg-primary-100 text-primary-600' },
    { icon: '🏨', label: '酒店预订', color: 'bg-landscape-100 text-landscape-600' },
    { icon: '🎁', label: '消费券', color: 'bg-amber-100 text-amber-600' },
    { icon: '📱', label: 'VR导览', color: 'bg-porcelain-100 text-porcelain-600' },
    { icon: '🎭', label: '节庆活动', color: 'bg-primary-100 text-primary-600' },
    { icon: '📜', label: '政策解读', color: 'bg-landscape-100 text-landscape-600' },
    { icon: '🎓', label: '导游认证', color: 'bg-amber-100 text-amber-600' },
    { icon: '📊', label: '数据查询', color: 'bg-porcelain-100 text-porcelain-600' },
  ];

  const banners = [
    { id: 1, title: '2024文旅消费季', subtitle: '千万消费券等你领', color: 'from-primary-500 to-primary-600' },
    { id: 2, title: '非遗文化展', subtitle: '传承千年文脉', color: 'from-landscape-500 to-landscape-600' },
    { id: 3, title: '智慧景区', subtitle: 'VR全景漫游', color: 'from-porcelain-500 to-porcelain-600' },
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl overflow-hidden h-40 shadow-lg">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 bg-gradient-to-r ${banner.color} p-6 flex flex-col justify-center transition-opacity duration-500 ${
              index === currentBanner ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h2 className="text-2xl font-bold text-white mb-2">{banner.title}</h2>
            <p className="text-white/90">{banner.subtitle}</p>
            <button className="mt-4 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg text-sm font-medium w-fit">
              立即了解 →
            </button>
          </div>
        ))}
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentBanner ? 'bg-white w-4' : 'bg-white/50'
              }`}
              onClick={() => setCurrentBanner(i)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {quickLinks.map((link, i) => (
          <button
            key={i}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${link.color}`}>
              {link.icon}
            </span>
            <span className="text-xs text-ink-700 font-medium">{link.label}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink-800">🔥 热门景区</h2>
          <button className="text-sm text-primary-600">查看更多</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {hotSpots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => navigate(`/h5/scenic/${spot.id}`)}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <img
                src={spot.image || 'https://picsum.photos/200/120'}
                alt={spot.name}
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-ink-800 text-sm truncate">{spot.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-ink-500">{spot.level} · {spot.region}</span>
                  <span className="text-primary-600 font-bold text-sm">
                    {spot.currentVisitorCount?.toLocaleString()}人
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink-800">📰 精选内容</h2>
          <button className="text-sm text-primary-600" onClick={() => navigate('/h5/content')}>更多</button>
        </div>
        <div className="space-y-3">
          {featuredContent.map((content) => (
            <div
              key={content.id}
              onClick={() => navigate(`/h5/content/${content.id}`)}
              className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-3"
            >
              <img
                src={content.coverImage || 'https://picsum.photos/100/100'}
                alt={content.title}
                className="w-24 h-24 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink-800 text-sm line-clamp-2 mb-2">{content.title}</h3>
                <p className="text-xs text-ink-500 line-clamp-2 mb-2">{content.summary}</p>
                <div className="flex items-center gap-3 text-xs text-ink-400">
                  <span>{content.authorName}</span>
                  <span>👁 {content.views.toLocaleString()}</span>
                  <span>❤️ {content.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileHomePage;
