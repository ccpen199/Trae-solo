import { Activity, CheckCircle, Clock, Zap, Plus, Trash2, Copy, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/StatCard';

const mockCallData = [
  { date: '01-09', calls: 12500, errors: 120 }, { date: '01-10', calls: 15200, errors: 95 },
  { date: '01-11', calls: 13800, errors: 110 }, { date: '01-12', calls: 16400, errors: 88 },
  { date: '01-13', calls: 14200, errors: 130 }, { date: '01-14', calls: 17600, errors: 102 },
  { date: '01-15', calls: 18900, errors: 78 },
];

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  callCount: number;
  status: 'active' | 'disabled';
}

const mockApiKeys: ApiKey[] = [
  { id: '1', name: '监控数据接口', key: 'vk_live_a1b2c3d4e5f6', createdAt: '2024-01-01', lastUsed: '2024-01-15T12:00:00Z', callCount: 45200, status: 'active' },
  { id: '2', name: '告警推送接口', key: 'vk_live_g7h8i9j0k1l2', createdAt: '2024-01-05', lastUsed: '2024-01-15T11:30:00Z', callCount: 12800, status: 'active' },
  { id: '3', name: '第三方对接', key: 'vk_live_m3n4o5p6q7r8', createdAt: '2024-01-10', lastUsed: '2024-01-14T08:00:00Z', callCount: 3200, status: 'disabled' },
];

export default function ApiGateway() {
  const successRate = 98.5;
  const avgResponseTime = 45;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Activity size={24} />} label="总调用量" value={108600} color="primary" suffix="次" />
        <StatCard icon={<CheckCircle size={24} />} label="成功率" value={successRate} color="success" suffix="%" />
        <StatCard icon={<Clock size={24} />} label="平均响应" value={avgResponseTime} color="info" suffix="ms" />
        <StatCard icon={<Zap size={24} />} label="API密钥" value={mockApiKeys.length} color="warning" suffix="个" />
      </div>

      <div className="dark-card">
        <h3 className="text-sm font-medium text-white mb-4">每日调用量</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mockCallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4e" />
            <XAxis dataKey="date" tick={{ fill: '#5a6a7e', fontSize: 12 }} />
            <YAxis tick={{ fill: '#5a6a7e', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #2a3a4e', borderRadius: 8 }}
              labelStyle={{ color: '#e0e6ed' }}
            />
            <Line type="monotone" dataKey="calls" stroke="#00d4ff" strokeWidth={2} dot={false} name="调用量" />
            <Line type="monotone" dataKey="errors" stroke="#ff6b35" strokeWidth={2} dot={false} name="错误数" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="dark-card flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">API密钥管理</h3>
          <button className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors">
            <Plus size={12} /> 创建密钥
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="dark-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>密钥</th>
                <th>创建时间</th>
                <th>最后使用</th>
                <th>调用次数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {mockApiKeys.map((k) => (
                <tr key={k.id}>
                  <td className="text-white">{k.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-surface-dark px-2 py-0.5 font-mono text-xs text-gray-300">{k.key.slice(0, 16)}...</code>
                      <button className="text-gray-500 hover:text-primary" title="复制"><Copy size={12} /></button>
                    </div>
                  </td>
                  <td className="text-gray-400 text-xs">{k.createdAt}</td>
                  <td className="font-mono text-xs text-gray-400">{new Date(k.lastUsed).toLocaleString()}</td>
                  <td className="font-mono text-gray-300">{k.callCount.toLocaleString()}</td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                      k.status === 'active' ? 'text-success bg-success/10' : 'text-gray-500 bg-gray-500/10'
                    }`}>
                      {k.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-warning" title="禁用"><X size={12} /></button>
                      <button className="text-gray-400 hover:text-danger" title="删除"><Trash2 size={12} /></button>
                    </div>
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
