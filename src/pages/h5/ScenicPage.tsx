import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataApi } from '../../lib/api';
import type { ScenicSpot } from '../../../shared/types';

const MobileScenicPage: React.FC = () => {
  const [region, setRegion] = useState('');
  const [level, setLevel] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['h5-scenic-list', region, level],
    queryFn: async () => {
      const res = await dataApi.getScenicSpots({
        page: 1,
        pageSize: 20,
        region: region || undefined,
        level: level || undefined,
      });
      return res.data;
    },
  });

  const getSaturationColor = (saturation?: number) => {
    if (!saturation) return 'bg-green-500';
    if (saturation < 50) return 'bg-green-500';
    if (saturation < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getSaturationText = (saturation?: number) => {
    if (!saturation) return '舒适';
    if (saturation < 50) return '舒适';
    if (saturation < 80) return '适中';
    return '拥挤';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="flex-1 px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"
        >
          <option value="">全部地区</option>
          <option value="北京">北京</option>
          <option value="上海">上海</option>
          <option value="四川">四川</option>
          <option value="浙江">浙江</option>
          <option value="云南">云南</option>
          <option value="陕西">陕西</option>
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="flex-1 px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"
        >
          <option value="">全部级别</option>
          <option value="5A">5A级</option>
          <option value="4A">4A级</option>
          <option value="3A">3A级</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-ink-100"></div>
              <div className="p-3 space-y-2">
                <div className="h-5 bg-ink-100 rounded w-3/4"></div>
                <div className="h-4 bg-ink-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items?.map((spot: ScenicSpot) => (
            <div key={spot.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative">
                <img
                  src={spot.image || 'https://picsum.photos/400/200'}
                  alt={spot.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur rounded-full text-white text-xs flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${getSaturationColor(spot.saturation)}`}></span>
                  {getSaturationText(spot.saturation)}
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 bg-primary-500 text-white text-xs font-bold rounded">
                  {spot.level}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-ink-800 text-lg">{spot.name}</h3>
                  <span className="text-primary-600 font-bold">
                    ¥{spot.ticketPrice}
                  </span>
                </div>
                <p className="text-sm text-ink-500 mb-3">
                  📍 {spot.region} · ⭐ {spot.rating}分
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-ink-50 rounded-lg py-2">
                    <p className="text-ink-800 font-bold">{spot.currentVisitorCount?.toLocaleString()}</p>
                    <p className="text-ink-500 text-xs">当前游客</p>
                  </div>
                  <div className="bg-ink-50 rounded-lg py-2">
                    <p className="text-ink-800 font-bold">{spot.maxCapacity?.toLocaleString()}</p>
                    <p className="text-ink-500 text-xs">最大承载</p>
                  </div>
                  <div className="bg-ink-50 rounded-lg py-2">
                    <p className="text-ink-800 font-bold">{spot.saturation || 0}%</p>
                    <p className="text-ink-500 text-xs">饱和度</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileScenicPage;
