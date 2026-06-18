import { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface Conflict {
  id: number;
  field: string;
  localValue: string;
  remoteValue: string;
  resolved: boolean;
  resolution?: 'local' | 'remote';
}

const mockConflicts: Conflict[] = [
  { id: 1, field: '联系电话', localValue: '13800138001', remoteValue: '13900139001', resolved: false },
  { id: 2, field: '通讯地址', localValue: '北京市朝阳区xx路1号', remoteValue: '北京市海淀区xx路2号', resolved: false },
  { id: 3, field: '工作单位', localValue: '北京科技有限公司', remoteValue: '北京科技股份有限公司', resolved: true, resolution: 'local' },
];

export default function ProfileSync() {
  const [lastSync, setLastSync] = useState('2026-06-18 10:30:00');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'conflict'>('conflict');
  const [conflicts, setConflicts] = useState<Conflict[]>(mockConflicts);
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setLastSync(new Date().toLocaleString('zh-CN'));
      setSyncStatus('synced');
      setSyncing(false);
    }, 2000);
  };

  const handleResolve = (id: number, resolution: 'local' | 'remote') => {
    setConflicts(conflicts.map((c) =>
      c.id === id ? { ...c, resolved: true, resolution } : c,
    ));
    const unresolved = conflicts.filter((c) => c.id !== id && !c.resolved);
    if (unresolved.length === 0) {
      setSyncStatus('synced');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">数据同步</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-700">同步状态</h2>
            <p className="text-sm text-neutral-500 mt-1">上次同步：{lastSync}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-sm font-medium ${
                syncStatus === 'synced'
                  ? 'text-success-600'
                  : syncStatus === 'conflict'
                  ? 'text-accent-500'
                  : 'text-primary-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-success-500'
                    : syncStatus === 'conflict'
                    ? 'bg-accent-500'
                    : 'bg-primary-500 animate-pulse-dot'
                }`}
              />
              {syncStatus === 'synced' ? '已同步' : syncStatus === 'conflict' ? '存在冲突' : '同步中'}
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '同步中...' : '立即同步'}
            </button>
          </div>
        </div>
      </div>

      {conflicts.some((c) => !c.resolved) && (
        <div className="bg-white border border-accent-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-accent-600 mb-4">冲突待解决</h2>
          <div className="space-y-4">
            {conflicts
              .filter((c) => !c.resolved)
              .map((c) => (
                <div key={c.id} className="border border-neutral-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-neutral-800 mb-3">{c.field}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-primary-50 rounded-lg p-3">
                      <p className="text-xs text-primary-600 mb-1">本地数据</p>
                      <p className="text-sm text-neutral-700">{c.localValue}</p>
                    </div>
                    <div className="bg-accent-50 rounded-lg p-3">
                      <p className="text-xs text-accent-600 mb-1">远程数据</p>
                      <p className="text-sm text-neutral-700">{c.remoteValue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(c.id, 'local')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      使用本地
                    </button>
                    <button
                      onClick={() => handleResolve(c.id, 'remote')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-accent-100 text-accent-600 rounded-lg text-sm hover:bg-accent-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      使用远程
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {conflicts.some((c) => c.resolved) && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-neutral-700 mb-4">已解决</h2>
          <div className="space-y-3">
            {conflicts
              .filter((c) => c.resolved)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <span className="text-sm text-neutral-700">{c.field}</span>
                  </div>
                  <span className="text-sm text-success-600">
                    已采用{c.resolution === 'local' ? '本地' : '远程'}数据
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
