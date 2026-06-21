import React from 'react';
import { MapPin } from 'lucide-react';
import { PriceHeatmap } from '@/components/market/PriceHeatmap';

const HeatmapPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <MapPin className="w-7 h-7 text-green-600" />
          区域价差热力图
        </h1>
        <p className="text-slate-500 mt-1">直观展示全国各省份价格差异，把握跨区域套利机会</p>
      </div>
      <PriceHeatmap />
    </div>
  );
};

export default HeatmapPage;
