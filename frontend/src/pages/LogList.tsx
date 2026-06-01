import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Copy, Check } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { logApi } from '../api/client';
import type { ApiLog, ListResponse } from '../types';

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 border-blue-200',
  POST: 'bg-green-100 text-green-700 border-green-200',
  PUT: 'bg-orange-100 text-orange-700 border-orange-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  PATCH: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function LogList() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadLogs();
  }, [page, search, methodFilter, statusFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;
      if (methodFilter) params.method = methodFilter;
      if (statusFilter) params.statusCode = statusFilter;

      const response = await logApi.list(params) as ListResponse<ApiLog>;
      setLogs(response.items);
      setTotal(response.total);
    } catch {
      error('加载日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: ApiLog) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const handleCopyRequestBody = () => {
    if (selectedLog?.requestBody) {
      navigator.clipboard.writeText(selectedLog.requestBody);
      setCopied(true);
      success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const tryParseJson = (str: string) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const columns = [
    {
      key: 'method',
      header: '方法',
      width: '100px',
      render: (item: ApiLog) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${
            methodColors[item.method] || 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {item.method}
        </span>
      ),
    },
    {
      key: 'path',
      header: '路径',
      render: (item: ApiLog) => (
        <code className="font-mono text-sm max-w-md truncate block">
          {item.path}
        </code>
      ),
    },
    {
      key: 'user',
      header: '用户',
      render: (item: ApiLog) => item.user?.username || '-',
    },
    {
      key: 'statusCode',
      header: '状态码',
      render: (item: ApiLog) => (
        <span className={`font-mono font-medium ${getStatusColor(item.statusCode)}`}>
          {item.statusCode}
        </span>
      ),
    },
    {
      key: 'duration',
      header: '耗时',
      render: (item: ApiLog) => formatDuration(item.duration),
    },
    {
      key: 'ip',
      header: 'IP地址',
      render: (item: ApiLog) => (
        <code className="font-mono text-sm">{item.ip}</code>
      ),
    },
    {
      key: 'createdAt',
      header: '时间',
      render: (item: ApiLog) =>
        new Date(item.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '80px',
      render: (item: ApiLog) => (
        <button
          onClick={() => handleViewDetail(item)}
          className="p-1 hover:bg-gray-100 text-blue-600"
          title="查看详情"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">调用日志</h1>
          <p className="text-gray-500 mt-1">查看所有 API 调用记录</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索路径..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部方法</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部状态</option>
              <option value="2xx">2xx 成功</option>
              <option value="3xx">3xx 重定向</option>
              <option value="4xx">4xx 客户端错误</option>
              <option value="5xx">5xx 服务端错误</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="API 调用详情"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-500">请求方法</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${
                      methodColors[selectedLog.method] ||
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {selectedLog.method}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">状态码</label>
                <p className={`mt-1 font-mono font-medium ${getStatusColor(selectedLog.statusCode)}`}>
                  {selectedLog.statusCode}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">耗时</label>
                <p className="mt-1 font-mono">{formatDuration(selectedLog.duration)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">IP 地址</label>
                <p className="mt-1 font-mono">{selectedLog.ip}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">请求路径</label>
              <p className="mt-1 font-mono text-sm bg-gray-100 p-3 rounded break-all">
                {selectedLog.path}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">请求用户</label>
                <p className="mt-1">{selectedLog.user?.username || '匿名'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">请求时间</label>
                <p className="mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">User Agent</label>
              <p className="mt-1 text-sm bg-gray-100 p-3 rounded break-all">
                {selectedLog.userAgent || '-'}
              </p>
            </div>
            {selectedLog.requestBody && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-500">请求体</label>
                  <button
                    onClick={handleCopyRequestBody}
                    className="text-sm text-navy-900 hover:text-navy-700 flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                  {tryParseJson(selectedLog.requestBody)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
