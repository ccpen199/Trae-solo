import { useState } from 'react';
import { Cpu, Wifi, WifiOff, Upload, Plus, X, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Device {
  id: string;
  sn: string;
  protocol: string;
  vehiclePlate: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'updating';
  lastHeartbeat: string;
}

interface UpgradeTask {
  id: string;
  name: string;
  firmwareVersion: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  status: 'pending' | 'running' | 'completed';
  createdAt: string;
}

const mockDevices: Device[] = [
  { id: '1', sn: 'SN20240001', protocol: 'JT/T808', vehiclePlate: '京A12345', firmwareVersion: 'v2.1.3', status: 'online', lastHeartbeat: '2024-01-15T12:00:00Z' },
  { id: '2', sn: 'SN20240002', protocol: 'JT/T808', vehiclePlate: '京B67890', firmwareVersion: 'v2.1.3', status: 'online', lastHeartbeat: '2024-01-15T11:58:00Z' },
  { id: '3', sn: 'SN20240003', protocol: 'JT/T808', vehiclePlate: '京C11111', firmwareVersion: 'v2.1.2', status: 'offline', lastHeartbeat: '2024-01-15T07:00:00Z' },
  { id: '4', sn: 'SN20240004', protocol: 'GB/T32960', vehiclePlate: '京D22222', firmwareVersion: 'v2.1.3', status: 'online', lastHeartbeat: '2024-01-15T11:59:00Z' },
  { id: '5', sn: 'SN20240005', protocol: 'JT/T808', vehiclePlate: '京E33333', firmwareVersion: 'v2.1.1', status: 'updating', lastHeartbeat: '2024-01-15T12:01:00Z' },
  { id: '6', sn: 'SN20240006', protocol: 'GB/T32960', vehiclePlate: '京F44444', firmwareVersion: 'v2.1.2', status: 'offline', lastHeartbeat: '2024-01-14T23:00:00Z' },
];

const mockUpgradeTasks: UpgradeTask[] = [
  { id: '1', name: '批量升级v2.1.3', firmwareVersion: 'v2.1.3', totalCount: 10, completedCount: 7, failedCount: 1, status: 'running', createdAt: '2024-01-15T08:00:00Z' },
  { id: '2', name: '紧急安全补丁', firmwareVersion: 'v2.1.4', totalCount: 3, completedCount: 3, failedCount: 0, status: 'completed', createdAt: '2024-01-14T10:00:00Z' },
];

const statusBadge: Record<string, { icon: typeof Wifi; color: string; bg: string; label: string }> = {
  online: { icon: Wifi, color: 'text-success', bg: 'bg-success/10', label: '在线' },
  offline: { icon: WifiOff, color: 'text-gray-500', bg: 'bg-gray-500/10', label: '离线' },
  updating: { icon: Upload, color: 'text-primary', bg: 'bg-primary/10', label: '升级中' },
};

const taskStatusBadge: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-warning', bg: 'bg-warning/10', label: '待执行' },
  running: { color: 'text-primary', bg: 'bg-primary/10', label: '执行中' },
  completed: { color: 'text-success', bg: 'bg-success/10', label: '已完成' },
};

export default function Devices() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);

  const filtered = mockDevices.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {['', 'online', 'offline', 'updating'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                statusFilter === s ? 'bg-primary text-surface-dark' : 'text-gray-400 hover:bg-surface-light hover:text-white'
              }`}
            >
              {s ? statusBadge[s].label : '全部'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-surface-border">
        <table className="dark-table">
          <thead>
            <tr>
              <th>SN</th>
              <th>协议</th>
              <th>绑定车辆</th>
              <th>固件版本</th>
              <th>状态</th>
              <th>最后心跳</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const badge = statusBadge[d.status];
              const StatusIcon = badge.icon;
              return (
                <tr key={d.id}>
                  <td className="font-mono text-white">{d.sn}</td>
                  <td className="text-gray-300">{d.protocol}</td>
                  <td className="font-mono text-gray-300">{d.vehiclePlate || '未绑定'}</td>
                  <td className="font-mono text-gray-300">{d.firmwareVersion}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${badge.color} ${badge.bg}`}>
                      <StatusIcon size={10} />
                      {badge.label}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-gray-400">
                    {new Date(d.lastHeartbeat).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="dark-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Upload size={16} className="text-primary" />
            升级任务
          </h3>
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={12} /> 创建任务
          </button>
        </div>

        <div className="space-y-2">
          {mockUpgradeTasks.map((t) => {
            const ts = taskStatusBadge[t.status];
            const progress = t.totalCount > 0 ? Math.round(((t.completedCount + t.failedCount) / t.totalCount) * 100) : 0;
            return (
              <div key={t.id} className="flex items-center gap-4 rounded-lg border border-surface-border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{t.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${ts.color} ${ts.bg}`}>{ts.label}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-surface-dark">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="font-mono text-xs text-gray-400">{progress}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle size={10} className="text-success" />{t.completedCount}成功</span>
                    <span className="flex items-center gap-1"><XCircle size={10} className="text-danger" />{t.failedCount}失败</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{t.totalCount - t.completedCount - t.failedCount}待执行</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{t.firmwareVersion}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="dark-card w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">创建升级任务</h3>
              <button onClick={() => setShowCreateTask(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">任务名称</label>
                <input className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" placeholder="输入任务名称" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">目标固件版本</label>
                <input className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" placeholder="v2.1.4" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">选择设备</label>
                <select className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary">
                  <option>全部在线设备</option>
                  <option>指定SN列表</option>
                </select>
              </div>
              <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-surface-dark hover:bg-primary-light transition-colors">
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
