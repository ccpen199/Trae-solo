import { useEffect, useState } from 'react';
import {
  MapPin, Users, Briefcase, DollarSign, Activity, Loader2, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RegionHeatmap as RegionHeatmapType } from '@shared/types';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';

interface RegionSummary {
  totalRegions: number;
  totalVacancy: number;
  totalSeekers: number;
  avgSalary: number;
  avgSaturation: number;
}

function getSaturationColor(s: number) {
  if (s >= 85) return '#EF4444';
  if (s >= 70) return '#FF7A00';
  if (s >= 40) return '#F59E0B';
  return '#10B981';
}

function getSaturationOpacity(s: number) {
  return 0.2 + s / 150;
}

function getSaturationLabel(s: number) {
  if (s >= 85) return { label: '极度紧缺', cls: 'text-danger-600 bg-danger-50 border-danger-200' };
  if (s >= 70) return { label: '高度紧缺', cls: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (s >= 40) return { label: '供需平衡', cls: 'text-warning-600 bg-warning-50 border-warning-200' };
  return { label: '供大于求', cls: 'text-success-600 bg-success-50 border-success-200' };
}

export default function RegionHeatmap() {
  const [regions, setRegions] = useState<RegionHeatmapType[]>([]);
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionHeatmapType | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await get<RegionHeatmapType[]>('/heatmap/regions');
        if (res.success && Array.isArray(res.data)) {
          setRegions(res.data);
          const sm = (res as any).summary as RegionSummary | undefined;
          if (sm) {
            setSummary(sm);
          } else {
            setSummary({
              totalRegions: res.data.length,
              totalVacancy: res.data.reduce((s, r) => s + r.vacancyCount, 0),
              totalSeekers: res.data.reduce((s, r) => s + r.jobSeekerCount, 0),
              avgSalary: Math.round(res.data.reduce((s, r) => s + r.avgSalary, 0) / res.data.length),
              avgSaturation: Math.round(res.data.reduce((s, r) => s + r.saturation, 0) / res.data.length),
            });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sortedTableData = [...regions].sort((a, b) => b.saturation - a.saturation);

  const chartData = [...regions]
    .sort((a, b) => b.vacancyCount - a.vacancyCount)
    .slice(0, 10)
    .map(r => ({
      region: r.regionName.length > 4 ? r.regionName.slice(0, 4) : r.regionName,
      vacancy: r.vacancyCount,
      seekers: r.jobSeekerCount,
    }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">区域用工饱和度热力图</h1>
        <p className="text-gray-500 text-sm mt-1">区域供需洞察 · 薪资分布 · 饱和度实时监控</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6 text-brand-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">总区域数</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{summary?.totalRegions ?? '--'}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center shrink-0"><Briefcase className="w-6 h-6 text-accent-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">总缺岗</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{(summary?.totalVacancy ?? 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-success-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">总求职</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{(summary?.totalSeekers ?? 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><DollarSign className="w-6 h-6 text-blue-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">平均薪资</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">¥{(summary?.avgSalary ?? 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center shrink-0"><Activity className="w-6 h-6 text-warning-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">平均饱和度</div>
            <div className="text-2xl font-bold text-gray-900 leading-none flex items-baseline gap-1">{summary?.avgSaturation ?? '--'}<span className="text-xs text-gray-400 font-normal">%</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title"><MapPin className="w-5 h-5 text-brand-600" /> 饱和度分布热力图</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} /> 0-40%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} /> 40-70%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#FF7A00' }} /> 70-85%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} /> 85%+</span>
            </div>
          </div>
          {regions.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-gray-400">暂无数据</div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-brand-50/30 to-accent-50/30 border border-gray-100" style={{ aspectRatio: '800/500' }}>
              <svg viewBox="0 0 800 500" className="w-full h-full"
                onMouseMove={e => {
                  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                  setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E0E7FF" strokeWidth="0.5" opacity="0.5" />
                  </pattern>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <rect width="800" height="500" fill="url(#grid)" />

                {regions.map(r => {
                  const color = getSaturationColor(r.saturation);
                  const opacity = getSaturationOpacity(r.saturation);
                  const baseRadius = 18 + r.saturation / 8;
                  const isHovered = hoveredRegion?.regionCode === r.regionCode;
                  return (
                    <g key={r.regionCode}
                      onMouseEnter={() => setHoveredRegion(r)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      style={{ cursor: 'pointer' }}>
                      <circle cx={r.x} cy={r.y} r={baseRadius + 10} fill={color} opacity={opacity * 0.3} />
                      <circle cx={r.x} cy={r.y} r={baseRadius} fill={color} opacity={opacity} filter={isHovered ? 'url(#glow)' : undefined}
                        stroke={isHovered ? '#1E3A5F' : 'white'} strokeWidth={isHovered ? 3 : 2} className="transition-all" />
                      <text x={r.x} y={r.y + baseRadius + 14} textAnchor="middle" className="fill-gray-600 text-[10px] font-medium pointer-events-none">
                        {r.regionName.length > 5 ? r.regionName.slice(-3) : r.regionName}
                      </text>
                      <text x={r.x} y={r.y + 4} textAnchor="middle" className={cn('font-bold text-[11px] pointer-events-none', r.saturation >= 70 ? 'fill-white' : 'fill-gray-700')}>
                        {r.saturation}%
                      </text>
                    </g>
                  );
                })}
              </svg>

              {hoveredRegion && (
                <div className="absolute z-20 bg-white rounded-xl shadow-card-hover border border-gray-100 p-3.5 pointer-events-none min-w-[200px]"
                  style={{
                    left: Math.min(mousePos.x + 16, (typeof window !== 'undefined' ? window.innerWidth * 0.8 : 600)),
                    top: Math.min(mousePos.y + 16, 400),
                    transform: mousePos.x > 500 ? 'translateX(-110%)' : undefined,
                  }}>
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="font-bold text-gray-900 text-sm">{hoveredRegion.regionName}</div>
                    <span className={cn('badge border text-[10px]', getSaturationLabel(hoveredRegion.saturation).cls)}>{getSaturationLabel(hoveredRegion.saturation).label}</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-4"><span className="text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3" />用工饱和度</span><span className="font-bold text-gray-900">{hoveredRegion.saturation}%</span></div>
                    <div className="flex justify-between gap-4"><span className="text-gray-500 flex items-center gap-1"><Briefcase className="w-3 h-3" />岗位空缺</span><span className="font-bold text-brand-600">{hoveredRegion.vacancyCount}个</span></div>
                    <div className="flex justify-between gap-4"><span className="text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" />求职人数</span><span className="font-bold text-accent-600">{hoveredRegion.jobSeekerCount}人</span></div>
                    <div className="flex justify-between gap-4 pt-1 border-t border-gray-50 mt-1.5"><span className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" />平均薪资</span><span className="font-bold text-success-600">¥{hoveredRegion.avgSalary.toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4"><BarChart3 className="w-5 h-5 text-accent-600" /> 供需对比Top10</h3>
          {chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-gray-400">暂无数据</div>
          ) : (
            <div className="h-[calc(100%-44px)] min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis dataKey="region" type="category" tick={{ fontSize: 9 }} stroke="#94A3B8" width={38} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="rect" />
                  <Bar dataKey="vacancy" name="岗位空缺" fill="#1E3A5F" radius={[0, 4, 4, 0]} barSize={7} />
                  <Bar dataKey="seekers" name="求职人数" fill="#FF7A00" radius={[0, 4, 4, 0]} barSize={7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="section-title"><Activity className="w-5 h-5 text-brand-600" /> 饱和度排名表</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="text-left font-medium px-5 py-3 w-16">排名</th>
                <th className="text-left font-medium px-5 py-3 whitespace-nowrap">区县名称</th>
                <th className="text-left font-medium px-5 py-3 whitespace-nowrap w-40">饱和度</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">岗位空缺</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">求职人数</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">平均薪资</th>
              </tr>
            </thead>
            <tbody>
              {sortedTableData.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">暂无数据</td></tr>
              )}
              {sortedTableData.map((r, i) => {
                const satLabel = getSaturationLabel(r.saturation);
                return (
                  <tr key={r.regionCode} className="border-b border-gray-50 hover:bg-brand-50/30 transition">
                    <td className="px-5 py-3">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0',
                        i === 0 ? 'bg-danger-500 text-white' :
                        i === 1 ? 'bg-orange-500 text-white' :
                        i === 2 ? 'bg-warning-500 text-white' :
                        'bg-gray-100 text-gray-500'
                      )}>{i + 1}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                        <span className="font-semibold text-gray-900">{r.regionName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${r.saturation}%`, background: getSaturationColor(r.saturation) }} />
                        </div>
                        <span className={cn('font-bold w-12 text-right text-xs', satLabel.cls.split(' ')[0])}>{r.saturation}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-brand-600">{r.vacancyCount}<span className="text-xs font-normal text-gray-400 ml-0.5">个</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-accent-600">{r.jobSeekerCount}<span className="text-xs font-normal text-gray-400 ml-0.5">人</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-success-600">¥{r.avgSalary.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
