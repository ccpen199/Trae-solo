import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, TrendingUp, Eye } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const pageOptions = [
  { id: 'home', label: '首页' },
  { id: 'hall', label: '服务大厅' },
  { id: 'cert', label: '电子证照' },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  views: Math.floor(Math.random() * 8000) + 500,
}));

const regionData = [
  { name: '玉山镇', value: 32500 },
  { name: '巴城镇', value: 21800 },
  { name: '花桥镇', value: 18600 },
  { name: '张浦镇', value: 15300 },
  { name: '周市镇', value: 12700 },
  { name: '千灯镇', value: 9800 },
];

const stats = [
  { label: '平均停留时长', value: '4分32秒', icon: Clock, color: 'text-gov-blue' },
  { label: '跳出率', value: '32.5%', icon: TrendingUp, color: 'text-amber-500' },
  { label: '页面浏览量', value: '128,456', icon: Eye, color: 'text-emerald-500' },
];

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
}

function generateHeatPoints(width: number, height: number): HeatPoint[] {
  const points: HeatPoint[] = [];
  const regions = [
    { xMin: 0.05, xMax: 0.3, yMin: 0.05, yMax: 0.2, count: 15, intensity: 0.9 },
    { xMin: 0.35, xMax: 0.65, yMin: 0.1, yMax: 0.35, count: 25, intensity: 1 },
    { xMin: 0.7, xMax: 0.95, yMin: 0.05, yMax: 0.2, count: 10, intensity: 0.7 },
    { xMin: 0.1, xMax: 0.5, yMin: 0.4, yMax: 0.6, count: 20, intensity: 0.8 },
    { xMin: 0.5, xMax: 0.9, yMin: 0.4, yMax: 0.7, count: 18, intensity: 0.6 },
    { xMin: 0.2, xMax: 0.8, yMin: 0.7, yMax: 0.95, count: 12, intensity: 0.5 },
  ];

  regions.forEach((r) => {
    for (let i = 0; i < r.count; i++) {
      points.push({
        x: (r.xMin + Math.random() * (r.xMax - r.xMin)) * width,
        y: (r.yMin + Math.random() * (r.yMax - r.yMin)) * height,
        intensity: r.intensity * (0.5 + Math.random() * 0.5),
      });
    }
  });

  return points;
}

function HeatmapCanvas({ pageId }: { pageId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, width, 50);
    ctx.fillRect(0, 50, 200, height - 50);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.fillText(pageOptions.find((p) => p.id === pageId)?.label ?? '', 20, 32);

    const navItems = ['首页', '服务大厅', '电子证照', '个人中心'];
    navItems.forEach((item, i) => {
      ctx.fillStyle = pageId === 'home' && i === 0 ? '#1A56DB' : '#64748B';
      ctx.fillText(item, 20 + i * 80, 80);
    });

    ctx.fillStyle = '#CBD5E1';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(20, 110 + i * 140, width - 240, 120);
    }

    const points = generateHeatPoints(width, height);
    points.forEach((p) => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 25 + p.intensity * 15);
      if (p.intensity > 0.7) {
        gradient.addColorStop(0, `rgba(239, 68, 68, ${p.intensity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(245, 158, 11, ${p.intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else if (p.intensity > 0.4) {
        gradient.addColorStop(0, `rgba(245, 158, 11, ${p.intensity * 0.5})`);
        gradient.addColorStop(0.5, `rgba(34, 197, 94, ${p.intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      } else {
        gradient.addColorStop(0, `rgba(34, 197, 94, ${p.intensity * 0.5})`);
        gradient.addColorStop(0.5, `rgba(34, 197, 94, ${p.intensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(p.x - 40, p.y - 40, 80, 80);
    });
  }, [pageId]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden border border-gov-border">
      <canvas ref={canvasRef} className="w-full" style={{ height: 500 }} />
    </div>
  );
}

export default function Heatmap() {
  const [selectedPage, setSelectedPage] = useState('home');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="gov-section-title">
          <Flame className="w-5 h-5 text-gov-blue" />
          行为热力图
        </h2>
        <select
          className="gov-input w-40 text-sm"
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
        >
          {pageOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="gov-stat-card flex items-center gap-4">
              <div className={`p-2.5 rounded-lg bg-gov-bg ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gov-text-secondary">{s.label}</p>
                <p className="text-xl font-bold text-gov-text">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">点击热力图</h3>
        <HeatmapCanvas pageId={selectedPage} />
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gov-text-secondary">
          <span>低频</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded-sm bg-green-400/50" />
            <div className="w-4 h-4 rounded-sm bg-yellow-400/50" />
            <div className="w-4 h-4 rounded-sm bg-red-400/50" />
          </div>
          <span>高频</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">时段分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94A3B8" interval={3} />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              />
              <Bar dataKey="views" fill="#1A56DB" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">区域分布</h3>
          <div className="space-y-3 mt-2">
            {regionData.map((r, i) => {
              const maxVal = regionData[0].value;
              const pct = (r.value / maxVal) * 100;
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-sm text-gov-text w-16 text-right shrink-0">{r.name}</span>
                  <div className="flex-1 h-6 bg-gov-bg rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-gov-blue to-gov-blue-light rounded-full"
                    />
                  </div>
                  <span className="text-sm font-medium text-gov-text w-16 shrink-0">
                    {r.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
