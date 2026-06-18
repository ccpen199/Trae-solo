import { useState } from 'react';
import { Search, Clock, User, Globe, FileEdit } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import * as adminApi from '@/api/admin';

interface TraceEvent {
  action: string;
  timestamp: string;
  ip: string;
  user: string;
  beforeContent?: string;
  afterContent?: string;
}

const mockTraces: TraceEvent[] = [
  {
    action: 'create',
    timestamp: '2024-01-15 10:30:00',
    ip: '192.168.1.100',
    user: '邻居小明',
    afterContent: '关于小区绿化带的讨论...',
  },
  {
    action: 'edit',
    timestamp: '2024-01-15 10:35:00',
    ip: '192.168.1.100',
    user: '邻居小明',
    beforeContent: '关于小区绿化带的讨论...',
    afterContent: '关于小区绿化带的讨论（已修改）...',
  },
  {
    action: 'publish',
    timestamp: '2024-01-15 10:36:00',
    ip: '192.168.1.100',
    user: '邻居小明',
  },
  {
    action: 'report',
    timestamp: '2024-01-15 12:00:00',
    ip: '192.168.1.200',
    user: '邻居小红',
  },
];

const actionLabels: Record<string, string> = {
  create: '创建',
  edit: '编辑',
  publish: '发布',
  hide: '隐藏',
  delete: '删除',
  report: '举报',
  restore: '恢复',
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  edit: 'bg-blue-100 text-blue-700',
  publish: 'bg-primary-100 text-primary-700',
  hide: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  report: 'bg-orange-100 text-orange-700',
  restore: 'bg-purple-100 text-purple-700',
};

export default function TraceLogPage() {
  const [topicId, setTopicId] = useState('');
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!topicId.trim()) return;
    setSearched(true);
    try {
      const res = await adminApi.getTraceLogs(topicId);
      setTraces(res.data?.data || mockTraces);
    } catch {
      setTraces(mockTraces);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="话题追踪日志" subtitle="查看话题的完整操作历史记录" />

      <div className="card">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              placeholder="输入话题ID进行搜索..."
              className="input-field pl-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            搜索
          </button>
        </div>
      </div>

      {searched && (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {traces.map((trace, idx) => (
              <div key={idx} className="relative pl-10">
                <div className="absolute left-3.5 w-3 h-3 rounded-full bg-white border-2 border-primary-500" />
                <div className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${actionColors[trace.action] || 'badge-gray'}`}>
                      {actionLabels[trace.action] || trace.action}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {trace.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {trace.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {trace.ip}
                    </span>
                  </div>
                  {trace.beforeContent && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-gray-600">
                      <span className="font-medium text-red-500">修改前：</span>
                      {trace.beforeContent}
                    </div>
                  )}
                  {trace.afterContent && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs text-gray-600">
                      <span className="font-medium text-green-500">修改后：</span>
                      {trace.afterContent}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searched && traces.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileEdit className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>未找到该话题的追踪记录</p>
        </div>
      )}
    </div>
  );
}
