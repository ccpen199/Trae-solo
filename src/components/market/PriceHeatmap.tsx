import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { RegionalPrice } from '../../../shared/types';
import { CATEGORIES } from '../../../shared/types';
import { marketAPI } from '@/services/api';
import { chinaProvinces } from '@/data/chinaMap';

export const PriceHeatmap: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [regionalData, setRegionalData] = useState<RegionalPrice[]>([]);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await marketAPI.getRegional(selectedCategory);
        if (response.success && response.data) {
          setRegionalData(response.data.regions);
        }
      } catch (error) {
        console.error('Failed to fetch regional data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedCategory]);

  const getColorScale = (diffPercent: number) => {
    if (diffPercent > 5) return '#7f1d1d';
    if (diffPercent > 3) return '#dc2626';
    if (diffPercent > 1) return '#f87171';
    if (diffPercent > -1) return '#94a3b8';
    if (diffPercent > -3) return '#4ade80';
    if (diffPercent > -5) return '#22c55e';
    return '#166534';
  };

  const getProvinceData = (provinceCode: string) => {
    return regionalData.find(r => r.provinceCode === provinceCode);
  };

  const getProvinceColor = (provinceCode: string) => {
    const data = getProvinceData(provinceCode);
    if (!data) return '#e2e8f0';
    return getColorScale(data.diffPercent);
  };

  const hoveredData = hoveredProvince ? getProvinceData(hoveredProvince) : null;

  return (
    <Card className="bg-slate-900 text-white border-slate-800">
      <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">区域价差热力图</h2>
          <p className="text-sm text-slate-400 mt-1">各省份价格差异对比分析</p>
        </div>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
          className="w-40 bg-slate-800 border-slate-700 text-white"
        />
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative w-full max-w-3xl mx-auto">
                <svg viewBox="0 0 900 600" className="w-full h-auto">
                  {chinaProvinces.map((province) => (
                    <g
                      key={province.code}
                      onMouseEnter={() => setHoveredProvince(province.code)}
                      onMouseLeave={() => setHoveredProvince(null)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      <path
                        d={province.path}
                        fill={getProvinceColor(province.code)}
                        stroke={hoveredProvince === province.code ? '#ffffff' : '#334155'}
                        strokeWidth={hoveredProvince === province.code ? '2' : '1'}
                        className="transition-all duration-200 hover:opacity-90"
                      />
                      {province.labelX && province.labelY && (
                        <text
                          x={province.labelX}
                          y={province.labelY}
                          textAnchor="middle"
                          className="text-xs fill-slate-200 pointer-events-none"
                          fontSize="12"
                          fontWeight="500"
                        >
                          {province.name}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {hoveredData && hoveredProvince && (
                  <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur rounded-lg p-4 border border-slate-700 min-w-48 animate-in fade-in zoom-in duration-200">
                    <h4 className="font-semibold text-white mb-2">
                      {hoveredData.province}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">当前价格</span>
                        <span className="font-mono font-semibold text-green-400">
                          ¥{hoveredData.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">均价对比</span>
                        <span className="font-mono text-slate-300">
                          ¥{hoveredData.avgPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">价差</span>
                        <span className={`font-mono font-semibold ${hoveredData.diff > 0 ? 'text-orange-400' : hoveredData.diff < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                          {hoveredData.diff > 0 ? '+' : ''}{hoveredData.diff.toLocaleString()}
                          <span className="text-xs ml-1">
                            ({hoveredData.diffPercent > 0 ? '+' : ''}{hoveredData.diffPercent.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="text-xs text-slate-400">-5%以下</span>
                <div className="flex h-3 rounded overflow-hidden">
                  {['#166534', '#22c55e', '#4ade80', '#94a3b8', '#f87171', '#dc2626', '#7f1d1d'].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">+5%以上</span>
              </div>
            </div>

            <div className="lg:w-72 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">价格排行</h3>
              {[...regionalData]
                .sort((a, b) => b.price - a.price)
                .slice(0, 10)
                .map((item, index) => (
                  <div 
                    key={item.provinceCode}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredProvince(item.provinceCode)}
                    onMouseLeave={() => setHoveredProvince(null)}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-yellow-500 text-yellow-900' : 'bg-slate-700 text-slate-300'}`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-300">{item.province}</span>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold text-white">
                        ¥{item.price.toLocaleString()}
                      </p>
                      <Badge 
                        variant={item.diffPercent > 0 ? 'warning' : item.diffPercent < 0 ? 'success' : 'default'}
                        size="sm"
                      >
                        {item.diffPercent > 0 ? '+' : ''}{item.diffPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
