import { useEffect, useState } from 'react';
import {
  MapPin, Users, Briefcase, DollarSign, Activity, RefreshCw,
  Filter, Download, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RegionHeatmap as RegionHeatmapType } from '@shared/types';
import { cn } from '@/lib/utils';

interface RegionData extends RegionHeatmapType {
  regionName: string;
  saturation: number;
  vacancyCount: number;
  jobSeekerCount: number;
  avgSalary: number;
  x: number;
  y: number;
}

const mockRegions: RegionData[] = [
  { regionCode: 'R01', regionName: '苏州工业园', saturation: 92, vacancyCount: 420, jobSeekerCount: 380, avgSalary: 7200, x: 420, y: 220 },
  { regionCode: 'R02', regionName: '苏州高新区', saturation: 78, vacancyCount: 285, jobSeekerCount: 310, avgSalary: 6800, x: 360, y: 250 },
  { regionCode: 'R03', regionName: '苏州吴中区', saturation: 65, vacancyCount: 198, jobSeekerCount: 220, avgSalary: 6200, x: 400, y: 290 },
  { regionCode: 'R04', regionName: '苏州相城区', saturation: 48, vacancyCount: 145, jobSeekerCount: 180, avgSalary: 5800, x: 380, y: 180 },
  { regionCode: 'R05', regionName: '昆山陆家镇', saturation: 88, vacancyCount: 356, jobSeekerCount: 290, avgSalary: 7000, x: 510, y: 260 },
  { regionCode: 'R06', regionName: '昆山张浦镇', saturation: 75, vacancyCount: 245, jobSeekerCount: 260, avgSalary: 6500, x: 500, y: 310 },
  { regionCode: 'R07', regionName: '昆山高新区', saturation: 82, vacancyCount: 312, jobSeekerCount: 285, avgSalary: 6800, x: 470, y: 230 },
  { regionCode: 'R08', regionName: '无锡新区', saturation: 58, vacancyCount: 178, jobSeekerCount: 165, avgSalary: 6400, x: 240, y: 220 },
  { regionCode: 'R09', regionName: '无锡锡山区', saturation: 45, vacancyCount: 125, jobSeekerCount: 140, avgSalary: 6000, x: 270, y: 180 },
  { regionCode: 'R10', regionName: '上海松江', saturation: 95, vacancyCount: 520, jobSeekerCount: 410, avgSalary: 7800, x: 620, y: 340 },
  { regionCode: 'R11', regionName: '上海青浦', saturation: 85, vacancyCount: 385, jobSeekerCount: 320, avgSalary: 7500, x: 580, y: 300 },
  { regionCode: 'R12', regionName: '上海嘉定', saturation: 90, vacancyCount: 445, jobSeekerCount: 390, avgSalary: 7600, x: 600, y: 240 },
  { regionCode: 'R13', regionName: '上海闵行', saturation: 72, vacancyCount: 298, jobSeekerCount: 305, avgSalary: 7200, x: 640, y: 280 },
  { regionCode: 'R14', regionName: '杭州钱塘区', saturation: 68, vacancyCount: 230, jobSeekerCount: 250, avgSalary: 6900, x: 380, y: 400 },
  { regionCode: 'R15', regionName: '杭州余杭区', saturation: 55, vacancyCount: 168, jobSeekerCount: 190, avgSalary: 6700, x: 320, y: 380 },
  { regionCode: 'R16', regionName: '杭州萧山区', saturation: 62, vacancyCount: 195, jobSeekerCount: 215, avgSalary: 6600, x: 360, y: 430 },
  { regionCode: 'R17', regionName: '宁波北仑区', saturation: 70, vacancyCount: 258, jobSeekerCount: 240, avgSalary: 6800, x: 520, y: 420 },
  { regionCode: 'R18', regionName: '宁波鄞州区', saturation: 52, vacancyCount: 152, jobSeekerCount: 168, avgSalary: 6400, x: 490, y: 380 },
  { regionCode: 'R19', regionName: '宁波慈溪市', saturation: 42, vacancyCount: 118, jobSeekerCount: 150, avgSalary: 6000, x: 460, y: 440 },
  { regionCode: 'R20', regionName: '常熟市', saturation: 60, vacancyCount: 175, jobSeekerCount: 185, avgSalary: 6300, x: 440, y: 150 },
  { regionCode: 'R21', regionName: '张家港市', saturation: 50, vacancyCount: 142, jobSeekerCount: 155, avgSalary: 6200, x: 320, y: 130 },
  { regionCode: 'R22', regionName: '太仓市', saturation: 38, vacancyCount: 98, jobSeekerCount: 130, avgSalary: 6100, x: 500, y: 160 },
  { regionCode: 'R23', regionName: '江阴市', saturation: 56, vacancyCount: 165, jobSeekerCount: 170, avgSalary: 6500, x: 200, y: 160 },
  { regionCode: 'R24', regionName: '宜兴市', saturation: 32, vacancyCount: 82, jobSeekerCount: 115, avgSalary: 5900, x: 160, y: 280 },
];

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
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [summary, setSummary] = useState<{ totalRegions: number; totalVacancy: number; totalSeekers: number; avgSalary: number; avgSaturation: number } | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'saturation' | 'vacancy' | 'seekers'>('saturation');

  useEffect(() => {
    fetch('/api/heatmap/regions')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data.length > 0) {
          setRegions(res.data.map((r: RegionHeatmapType, i: number) => ({
            ...r,
            x: r.x ?? mockRegions[i]?.x ?? 400,
            y: r.y ?? mockRegions[i]?.y ?? 300,
          })));
          setSummary(res.summary);
        } else {
          setRegions(mockRegions);
          setSummary({
            totalRegions: mockRegions.length,
            totalVacancy: mockRegions.reduce((s, r) => s + r.vacancyCount, 0),
            totalSeekers: mockRegions.reduce((s, r) => s + r.jobSeekerCount, 0),
            avgSalary: Math.round(mockRegions.reduce((s, r) => s + r.avgSalary, 0) / mockRegions.length),
            avgSaturation: Math.round(mockRegions.reduce((s, r) => s + r.saturation, 0) / mockRegions.length),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setRegions(mockRegions);
        setSummary({
          totalRegions: mockRegions.length,
          totalVacancy: mockRegions.reduce((s, r) => s + r.vacancyCount, 0),
          totalSeekers: mockRegions.reduce((s, r) => s + r.jobSeekerCount, 0),
          avgSalary: Math.round(mockRegions.reduce((s, r) => s + r.avgSalary, 0) / mockRegions.length),
          avgSaturation: Math.round(mockRegions.reduce((s, r) => s + r.saturation, 0) / mockRegions.length),
        });
        setLoading(false);
      });
  }, []);

  const chartData = [...regions]
    .sort((a, b) => b.saturation - a.saturation)
    .slice(0, 24)
    .map(r => ({
      region: r.regionName.length > 4 ? r.regionName.slice(0, 4) : r.regionName,
      vacancy: r.vacancyCount,
      seekers: r.jobSeekerCount,
    }));

  const sortedTableData = [...regions].sort((a, b) => {
    if (sortBy === 'saturation') return b.saturation - a.saturation;
    if (sortBy === 'vacancy') return b.vacancyCount - a.vacancyCount;
    return b.jobSeekerCount - a.jobSeekerCount;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-brand-600 text-lg">加载中...</div></div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">长三角用工饱和度热力图</h1>
          <p className="text-gray-500 text-sm mt-1">区域供需洞察 · 薪资分布 · 饱和度实时监控</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2"><Filter className="w-4 h-4" /> 区域筛选</button>
          <button className="btn-ghost gap-2"><Download className="w-4 h-4" /> 导出数据</button>
          <button className="btn-primary gap-2"><RefreshCw className="w-4 h-4" /> 刷新数据</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6 text-brand-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">覆盖区县</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{summary?.totalRegions ?? '--'}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center shrink-0"><Briefcase className="w-6 h-6 text-accent-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">岗位空缺</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{(summary?.totalVacancy ?? 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-success-600" /></div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">求职人数</div>
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
            <h3 className="section-title"><MapPin className="w-5 h-5 text-brand-600" /> 长三角用工饱和度分布</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} /> 0-40%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} /> 40-70%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#FF7A00' }} /> 70-85%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} /> 85%+</span>
            </div>
          </div>
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
              <text x="400" y="60" textAnchor="middle" className="fill-brand-700/40 text-[14px] font-bold">苏州市</text>
              <text x="500" y="130" textAnchor="middle" className="fill-brand-700/40 text-[12px] font-medium">· 常熟 · 太仓</text>
              <text x="250" y="110" textAnchor="middle" className="fill-brand-700/40 text-[13px] font-bold">无锡市</text>
              <text x="590" y="210" textAnchor="middle" className="fill-brand-700/40 text-[14px] font-bold">上海市</text>
              <text x="500" y="210" textAnchor="middle" className="fill-brand-700/40 text-[12px] font-bold">昆山市</text>
              <text x="350" y="470" textAnchor="middle" className="fill-brand-700/40 text-[13px] font-bold">杭州市</text>
              <text x="500" y="475" textAnchor="middle" className="fill-brand-700/40 text-[13px] font-bold">宁波市</text>
              <text x="200" y="250" textAnchor="middle" className="fill-brand-700/40 text-[11px]">· 宜兴</text>
              <text x="220" y="130" textAnchor="middle" className="fill-brand-700/40 text-[11px]">· 江阴 · 张家港</text>

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

            <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-soft p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">饱和度分级图例</div>
              <div className="space-y-1.5">
                {[
                  { color: '#10B981', label: '供大于求', range: '0 - 40%', icon: CheckCircle, iconCls: 'text-success-600' },
                  { color: '#F59E0B', label: '供需平衡', range: '40 - 70%', icon: Activity, iconCls: 'text-warning-600' },
                  { color: '#FF7A00', label: '高度紧缺', range: '70 - 85%', icon: TrendingUp, iconCls: 'text-orange-600' },
                  { color: '#EF4444', label: '极度紧缺', range: '85% 以上', icon: AlertTriangle, iconCls: 'text-danger-600' },
                ].map(item => {
                  const I = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <span className="w-6 h-4 rounded" style={{ background: item.color, opacity: 0.7 }} />
                      <I className={cn('w-3.5 h-3.5', item.iconCls)} />
                      <span className="text-gray-700 w-16">{item.label}</span>
                      <span className="text-gray-400">{item.range}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4"><BarChart_ className="w-5 h-5 text-accent-600" /> 区县供需洞察 TOP24</h3>
          <div className="h-[calc(100%-44px)] min-h-[420px]">
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
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="section-title"><Activity className="w-5 h-5 text-brand-600" /> 区县详细数据</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">排序：</span>
            {[
              { key: 'saturation' as const, label: '按饱和度' },
              { key: 'vacancy' as const, label: '按空缺数' },
              { key: 'seekers' as const, label: '按求职数' },
            ].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className={cn('px-3 py-1.5 rounded-lg transition-all', sortBy === s.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="text-left font-medium px-5 py-3 w-16">排名</th>
                <th className="text-left font-medium px-5 py-3 whitespace-nowrap">区县名称</th>
                <th className="text-left font-medium px-5 py-3 whitespace-nowrap w-40">饱和度</th>
                <th className="text-center font-medium px-5 py-3 whitespace-nowrap">状态</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">岗位空缺</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">求职人数</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">供需比</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">平均薪资</th>
                <th className="text-right font-medium px-5 py-3 whitespace-nowrap">紧缺指数</th>
              </tr>
            </thead>
            <tbody>
              {sortedTableData.map((r, i) => {
                const satLabel = getSaturationLabel(r.saturation);
                const ratio = r.jobSeekerCount > 0 ? (r.vacancyCount / r.jobSeekerCount).toFixed(2) : '-';
                const shortage = Math.round((r.vacancyCount - r.jobSeekerCount) / Math.max(r.vacancyCount, 1) * 100);
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
                        <span className="font-bold w-10 text-right text-gray-900 text-xs">{r.saturation}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('badge border text-[10px]', satLabel.cls)}>{satLabel.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-brand-600">{r.vacancyCount}<span className="text-xs font-normal text-gray-400 ml-0.5">个</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-accent-600">{r.jobSeekerCount}<span className="text-xs font-normal text-gray-400 ml-0.5">人</span></td>
                    <td className="px-5 py-3 text-right text-gray-700">{ratio}<span className="text-xs text-gray-400 ml-0.5">:1</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-success-600">¥{r.avgSalary.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn(
                        'font-bold text-sm',
                        shortage > 20 ? 'text-danger-600' : shortage > 0 ? 'text-warning-600' : 'text-success-600'
                      )}>
                        {shortage > 0 ? '+' : ''}{shortage}%
                      </span>
                    </td>
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

function BarChart_(_props: { className?: string }) { return <BarChart data={[]} />; }
