import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Bug, Clock, User, Server } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { taskApi, vulnerabilityApi } from '../api/client';
import type { ScanTask, Vulnerability, SeverityCounts } from '../types';

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#3b82f6',
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<ScanTask | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (taskId: number) => {
    setLoading(true);
    try {
      const [taskData, vulnsData] = await Promise.all([
        taskApi.get(taskId) as Promise<ScanTask>,
        taskApi.getVulnerabilities(taskId) as Promise<Vulnerability[]>,
      ]);
      setTask(taskData);
      setVulnerabilities(vulnsData);
    } catch {
      error('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    try {
      await taskApi.execute(parseInt(id));
      success('任务已开始执行');
      loadData(parseInt(id));
    } catch {
      error('执行任务失败');
    }
  };

  const handleVulnStatusChange = async (
    vulnId: number,
    status: 'fixed' | 'ignored'
  ) => {
    try {
      await vulnerabilityApi.update(vulnId, { status });
      success('漏洞状态更新成功');
      if (id) loadData(parseInt(id));
    } catch {
      error('更新漏洞状态失败');
    }
  };

  const parseSeverityCounts = (countsStr: string): SeverityCounts => {
    try {
      return JSON.parse(countsStr);
    } catch {
      return { critical: 0, high: 0, medium: 0, low: 0 };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-40 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">任务不存在</p>
        <Link to="/tasks" className="btn-primary mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const severityCounts = parseSeverityCounts(task.severityCounts || '{}');
  const pieData = [
    { name: '严重', value: severityCounts.critical, color: severityColors.critical },
    { name: '高危', value: severityCounts.high, color: severityColors.high },
    { name: '中危', value: severityCounts.medium, color: severityColors.medium },
    { name: '低危', value: severityCounts.low, color: severityColors.low },
  ].filter((d) => d.value > 0);

  const formatDuration = () => {
    if (!task.startTime || !task.endTime) return '-';
    const start = new Date(task.startTime).getTime();
    const end = new Date(task.endTime).getTime();
    const duration = end - start;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/tasks"
          className="p-2 hover:bg-gray-100 rounded"
          title="返回列表"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              扫描任务 #{task.id}
            </h1>
            <StatusBadge status={task.status} size="md" />
          </div>
          <p className="text-gray-500 mt-1">
            {task.app?.name || '未知应用'} -{' '}
            {task.version?.version || '未知版本'}
          </p>
        </div>
        {task.status === 'pending' && (
          <button
            onClick={handleExecute}
            className="btn-success flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            执行扫描
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Server className="w-4 h-4" />
            <span className="text-sm">扫描环境</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={task.environment?.type || ''} />
            <span className="font-medium">{task.environment?.name}</span>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <User className="w-4 h-4" />
            <span className="text-sm">触发者</span>
          </div>
          <p className="font-medium">{task.triggerUser?.username || '-'}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">执行时长</span>
          </div>
          <p className="font-medium">{formatDuration()}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Bug className="w-4 h-4" />
            <span className="text-sm">漏洞总数</span>
          </div>
          <p className="font-medium text-xl">
            {severityCounts.critical +
              severityCounts.high +
              severityCounts.medium +
              severityCounts.low}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">漏洞分布</h3>
          <div className="h-64">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                暂无漏洞数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {['critical', 'high', 'medium', 'low'].map((sev) => (
              <div key={sev} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: severityColors[sev] }}
                />
                <span className="text-sm text-gray-600">
                  {sev === 'critical'
                    ? '严重'
                    : sev === 'high'
                    ? '高危'
                    : sev === 'medium'
                    ? '中危'
                    : '低危'}
                  : {severityCounts[sev as keyof SeverityCounts]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">执行信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">创建时间</label>
              <p className="font-medium">
                {new Date(task.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">开始时间</label>
              <p className="font-medium">
                {task.startTime
                  ? new Date(task.startTime).toLocaleString('zh-CN')
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">结束时间</label>
              <p className="font-medium">
                {task.endTime
                  ? new Date(task.endTime).toLocaleString('zh-CN')
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">状态</label>
              <p>
                <StatusBadge status={task.status} />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">漏洞清单</h3>
        {vulnerabilities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无漏洞数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    严重程度
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    CVE ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    组件名称
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    当前版本
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    修复版本
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {vulnerabilities.map((vuln) => (
                  <tr
                    key={vuln.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={vuln.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-sm">{vuln.cveId || '-'}</code>
                    </td>
                    <td className="px-4 py-3 font-medium">{vuln.packageName}</td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-sm">
                        {vuln.currentVersion}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {vuln.fixedVersion ? (
                        <code className="font-mono text-sm text-green-600">
                          {vuln.fixedVersion}
                        </code>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={vuln.status} />
                    </td>
                    <td className="px-4 py-3">
                      {vuln.status === 'open' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVulnStatusChange(vuln.id, 'fixed')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded"
                          >
                            标记修复
                          </button>
                          <button
                            onClick={() => handleVulnStatusChange(vuln.id, 'ignored')}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
                          >
                            忽略
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {vulnerabilities.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">修复建议</h3>
          <div className="space-y-4">
            {vulnerabilities
              .filter((v) => v.status === 'open')
              .slice(0, 3)
              .map((vuln) => (
                <div
                  key={vuln.id}
                  className="p-4 bg-gray-50 border-l-4 border-navy-900"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={vuln.severity} />
                    <span className="font-medium">{vuln.packageName}</span>
                    {vuln.fixedVersion && (
                      <span className="text-sm text-gray-500">
                        → 升级到 {vuln.fixedVersion}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {vuln.description || '暂无详细描述'}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
