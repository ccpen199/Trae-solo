import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Play, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { taskApi, applicationApi } from '../api/client';
import type { ScanTask, ListResponse, Application } from '../types';

export default function TaskList() {
  const [tasks, setTasks] = useState<ScanTask[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [appFilter, setAppFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    appId: '',
    versionId: '',
    envId: '',
  });
  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, [page, search, statusFilter, appFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, appsRes] = await Promise.all([
        taskApi.list({ page, pageSize, search, status: statusFilter, appId: appFilter }) as Promise<ListResponse<ScanTask>>,
        applicationApi.list({ pageSize: 100 }) as Promise<ListResponse<Application>>,
      ]);
      setTasks(tasksRes.items);
      setTotal(tasksRes.total);
      setApplications(appsRes.items);
    } catch {
      error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.appId || !formData.versionId || !formData.envId) {
      error('请填写完整信息');
      return;
    }
    try {
      await taskApi.create({
        appId: parseInt(formData.appId),
        versionId: parseInt(formData.versionId),
        envId: parseInt(formData.envId),
      });
      success('扫描任务创建成功');
      setShowModal(false);
      loadData();
    } catch {
      error('创建扫描任务失败');
    }
  };

  const handleExecute = async (id: number) => {
    try {
      await taskApi.execute(id);
      success('任务已开始执行');
      loadData();
    } catch {
      error('执行任务失败');
    }
  };

  const columns = [
    {
      key: 'id',
      header: '任务ID',
      render: (item: ScanTask) => (
        <code className="font-mono text-sm">#{item.id}</code>
      ),
    },
    {
      key: 'app',
      header: '应用',
      render: (item: ScanTask) => item.app?.name || '-',
    },
    {
      key: 'version',
      header: '版本',
      render: (item: ScanTask) => (
        <code className="font-mono text-sm bg-gray-100 px-2 py-0.5">
          {item.version?.version || '-'}
        </code>
      ),
    },
    {
      key: 'environment',
      header: '环境',
      render: (item: ScanTask) => (
        <StatusBadge status={item.environment?.type || ''} />
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item: ScanTask) => <StatusBadge status={item.status} />,
    },
    {
      key: 'triggerUser',
      header: '触发者',
      render: (item: ScanTask) => item.triggerUser?.username || '-',
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (item: ScanTask) =>
        new Date(item.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '150px',
      render: (item: ScanTask) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/tasks/${item.id}`}
            className="p-1 hover:bg-gray-100 text-blue-600"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {item.status === 'pending' && (
            <button
              onClick={() => handleExecute(item.id)}
              className="p-1 hover:bg-gray-100 text-green-600"
              title="执行扫描"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const selectedApp = applications.find(
    (a) => a.id === parseInt(formData.appId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">扫描任务</h1>
          <p className="text-gray-500 mt-1">管理所有扫描任务</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部应用</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部状态</option>
              <option value="pending">待执行</option>
              <option value="running">执行中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="新建扫描任务"
        size="md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              创建
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">应用 *</label>
            <select
              value={formData.appId}
              onChange={(e) =>
                setFormData({ ...formData, appId: e.target.value, versionId: '', envId: '' })
              }
              className="input"
            >
              <option value="">请选择应用</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">版本 *</label>
            <select
              value={formData.versionId}
              onChange={(e) => setFormData({ ...formData, versionId: e.target.value })}
              className="input"
              disabled={!formData.appId}
            >
              <option value="">请选择版本</option>
              {selectedApp?.id === 1 && (
                <>
                  <option value="1">v1.0.0</option>
                  <option value="2">v1.1.0</option>
                </>
              )}
              {selectedApp?.id === 2 && (
                <>
                  <option value="3">v2.0.0</option>
                </>
              )}
              {selectedApp?.id === 3 && (
                <>
                  <option value="4">v3.0.0</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="label">环境 *</label>
            <select
              value={formData.envId}
              onChange={(e) => setFormData({ ...formData, envId: e.target.value })}
              className="input"
              disabled={!formData.appId}
            >
              <option value="">请选择环境</option>
              {selectedApp?.id === 1 && (
                <>
                  <option value="1">开发环境</option>
                  <option value="2">生产环境</option>
                </>
              )}
              {selectedApp?.id === 2 && (
                <>
                  <option value="3">生产环境</option>
                </>
              )}
              {selectedApp?.id === 3 && (
                <>
                  <option value="4">测试环境</option>
                </>
              )}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
