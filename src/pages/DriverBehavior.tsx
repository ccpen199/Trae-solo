import { useState } from 'react';
import { Calendar, Shield, AlertTriangle, Gauge, Navigation, Zap, UserX } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/StatCard';

const radarData = [
  { dimension: '速度控制', score: 85, fullMark: 100 },
  { dimension: '路线遵守', score: 92, fullMark: 100 },
  { dimension: '驾驶平稳', score: 78, fullMark: 100 },
  { dimension: '疲劳管理', score: 88, fullMark: 100 },
  { dimension: '规范操作', score: 95, fullMark: 100 },
];

const mockEvents = [
  { id: '1', type: '急加速', driver: '王五', plate: '京D22222', time: '2024-01-15 08:30', level: 'minor' },
  { id: '2', type: '急刹车', driver: '王五', plate: '京D22222', time: '2024-01-15 09:15', level: 'major' },
  { id: '3', type: '急转弯', driver: '赵六', plate: '京E33333', time: '2024-01-15 10:00', level: 'minor' },
  { id: '4', type: '超速', driver: '王五', plate: '京D22222', time: '2024-01-15 11:20', level: 'critical' },
  { id: '5', type: '疲劳驾驶', driver: '赵六', plate: '京E33333', time: '2024-01-15 12:00', level: 'critical' },
];

const mockRanking = [
  { rank: 1, driver: '张三', score: 96, trips: 120, events: 2 },
  { rank: 2, driver: '李四', score: 93, trips: 115, events: 4 },
  { rank: 3, driver: '赵六', score: 87, trips: 108, events: 8 },
  { rank: 4, driver: '王五', score: 72, trips: 98, events: 15 },
  { rank: 5, driver: '钱七', score: 68, trips: 90, events: 22 },
];

const eventIcons: Record<string, typeof Gauge> = {
  '急加速': Zap,
  '急刹车': Gauge,
  '急转弯': Navigation,
  '超速': Gauge,
  '疲劳驾驶': UserX,
};

const levelBadge: Record<string, string> = {
  critical: 'bg-danger/10 text-danger',
  major: 'bg-warning/10 text-warning',
  minor: 'bg-info/10 text-info',
};

const levelText: Record<string, string> = {
  critical: '严重',
  major: '重要',
  minor: '一般',
};

export default function DriverBehavior() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary" />
        </div>
        <span className="text-gray-500">至</span>
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary" />
        </div>
        <select className="rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary">
          <option>全部组织</option>
          <option>一分公司</option>
          <option>二分公司</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Shield size={24} />} label="平均安全分" value={87.5} color="primary" suffix="分" />
        <StatCard icon={<AlertTriangle size={24} />} label="今日事件" value={23} color="danger" suffix="起" />
        <StatCard icon={<Gauge size={24} />} label="超速事件" value={5} color="warning" suffix="起" />
        <StatCard icon={<UserX size={24} />} label="疲劳事件" value={2} color="info" suffix="起" />
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="dark-card flex flex-col">
          <h3 className="text-sm font-medium text-white mb-2">安全评分雷达图</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a3a4e" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#5a6a7e', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#5a6a7e', fontSize: 10 }} />
                <Radar name="安全评分" dataKey="score" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dark-card flex flex-col">
          <h3 className="text-sm font-medium text-white mb-2">驾驶事件列表</h3>
          <div className="flex-1 overflow-auto">
            {mockEvents.map((ev) => {
              const Icon = eventIcons[ev.type] || AlertTriangle;
              return (
                <div key={ev.id} className="flex items-center gap-3 border-b border-surface-border py-2.5 px-2">
                  <Icon size={14} className="text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{ev.type}</span>
                    <span className="text-xs text-gray-500 ml-2">{ev.driver} · {ev.plate}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${levelBadge[ev.level]}`}>{levelText[ev.level]}</span>
                  <span className="text-xs text-gray-500 font-mono shrink-0">{ev.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dark-card">
        <h3 className="text-sm font-medium text-white mb-3">司机安全排行</h3>
        <div className="overflow-auto">
          <table className="dark-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>司机</th>
                <th>安全分</th>
                <th>出车次数</th>
                <th>违规事件</th>
              </tr>
            </thead>
            <tbody>
              {mockRanking.map((r) => (
                <tr key={r.rank}>
                  <td>
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                      r.rank <= 3 ? 'bg-primary/10 text-primary' : 'bg-surface-light text-gray-400'
                    }`}>{r.rank}</span>
                  </td>
                  <td className="text-white">{r.driver}</td>
                  <td className="font-mono">
                    <span className={r.score >= 90 ? 'text-success' : r.score >= 80 ? 'text-primary' : r.score >= 70 ? 'text-warning' : 'text-danger'}>
                      {r.score}
                    </span>
                  </td>
                  <td className="font-mono text-gray-300">{r.trips}</td>
                  <td className="font-mono">
                    <span className={r.events > 10 ? 'text-danger' : r.events > 5 ? 'text-warning' : 'text-success'}>{r.events}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
