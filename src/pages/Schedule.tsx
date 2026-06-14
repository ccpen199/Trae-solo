import { useState } from 'react';
import { Calendar, Clock, TrendingUp, Truck, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '@/components/StatCard';

const mockDailyData = [
  { date: '01-09', rate: 92 }, { date: '01-10', rate: 88 }, { date: '01-11', rate: 95 },
  { date: '01-12', rate: 91 }, { date: '01-13', rate: 87 }, { date: '01-14', rate: 93 },
  { date: '01-15', rate: 94 },
];

const mockTrips = [
  { id: '1', plate: '京A12345', route: '1路', driver: '张三', planTime: '08:00', actualTime: '08:02', diff: 2, status: 'on-time' },
  { id: '2', plate: '京B67890', route: '2路', driver: '李四', planTime: '08:30', actualTime: '08:38', diff: 8, status: 'late' },
  { id: '3', plate: '京E33333', route: '5路', driver: '赵六', planTime: '09:00', actualTime: '08:55', diff: -5, status: 'early' },
  { id: '4', plate: '京D22222', route: '3路', driver: '王五', planTime: '09:30', actualTime: '09:31', diff: 1, status: 'on-time' },
  { id: '5', plate: '京F44444', route: '1路', driver: '钱七', planTime: '10:00', actualTime: '10:12', diff: 12, status: 'late' },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  'on-time': { label: '准点', color: 'text-success', bg: 'bg-success/10' },
  'late': { label: '晚点', color: 'text-danger', bg: 'bg-danger/10' },
  'early': { label: '早到', color: 'text-warning', bg: 'bg-warning/10' },
};

export default function Schedule() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-surface-border bg-surface-dark py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary"
          />
        </div>
        <select className="rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary">
          <option>全部线路</option>
          <option>1路</option>
          <option>2路</option>
          <option>3路</option>
          <option>5路</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Clock size={24} />} label="准点率" value={94.2} color="success" suffix="%" />
        <StatCard icon={<Truck size={24} />} label="总班次" value={128} color="primary" suffix="趟" />
        <StatCard icon={<AlertCircle size={24} />} label="晚点" value={8} color="danger" suffix="趟" />
        <StatCard icon={<TrendingUp size={24} />} label="早到" value={3} color="warning" suffix="趟" />
      </div>

      <div className="dark-card">
        <h3 className="text-sm font-medium text-white mb-4">每日准点率</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mockDailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4e" />
            <XAxis dataKey="date" tick={{ fill: '#5a6a7e', fontSize: 12 }} />
            <YAxis domain={[70, 100]} tick={{ fill: '#5a6a7e', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #2a3a4e', borderRadius: 8 }}
              labelStyle={{ color: '#e0e6ed' }}
              formatter={(value: number) => [`${value}%`, '准点率']}
            />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {mockDailyData.map((entry, i) => (
                <Cell key={i} fill={entry.rate >= 90 ? '#00e676' : entry.rate >= 85 ? '#ffab00' : '#ff6b35'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-surface-border">
        <table className="dark-table">
          <thead>
            <tr>
              <th>车牌</th>
              <th>线路</th>
              <th>司机</th>
              <th>计划时间</th>
              <th>实际时间</th>
              <th>偏差</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {mockTrips.map((trip) => {
              const st = statusMap[trip.status];
              return (
                <tr key={trip.id}>
                  <td className="font-mono text-white">{trip.plate}</td>
                  <td className="text-gray-300">{trip.route}</td>
                  <td className="text-gray-300">{trip.driver}</td>
                  <td className="font-mono text-gray-300">{trip.planTime}</td>
                  <td className="font-mono text-gray-300">{trip.actualTime}</td>
                  <td className={`font-mono ${trip.diff > 0 ? 'text-danger' : trip.diff < 0 ? 'text-warning' : 'text-success'}`}>
                    {trip.diff > 0 ? '+' : ''}{trip.diff}min
                  </td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${st.color} ${st.bg}`}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
