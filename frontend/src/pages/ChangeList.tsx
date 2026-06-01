import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { changeApi } from '../api/client';
import type { ChangeOrder, ListResponse, ChangeType } from '../types';

export default function ChangeList() {
  const [changes, setChanges] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'config' as ChangeType,
    reason: '',
    affectedObjects: '',
    recoveryPath: '',
    oldValue: '',
    newValue: '',
  });
  const { success, error } = useToast();

  useEffect(() => {
    loadChanges();
  }, [page, search, statusFilter, typeFilter]);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await changeApi.list(params) as ListResponse<ChangeOrder>;
      setChanges(response.items);
      setTotal(response.total);
    } catch {
      error('加载变更单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.reason.trim()) {
      error('请输入变更原因');
      return false;
    }
    if (!formData.oldValue.trim()) {
      error('请输入原值');
      return false;
    }
    if (!formData.newValue.trim()) {
      error('请输入新值');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      await changeApi.create(formData);
      success('变更单创建成功');
      setShowModal(false);
      loadChanges();
    } catch {
      error('创建变更单失败');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await changeApi.approve(id);
      success('变更已批准');
      loadChanges();
    } catch {
      error('批准失败');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await changeApi.reject(id);
      success('变更已拒绝');
      loadChanges();
    } catch {
      error('拒绝失败');
    }
  };

  const handleExecute = async (id: number) => {
    try {
      await changeApi.execute(id);
      success('变更已执行');
      loadChanges();
    } catch {
      error('执行失败');
    }
  };

  const handleRollback = async (id: number) => {
    try {
      await changeApi.rollback(id);
      success('变更已回滚');
      loadChanges();
    } catch {
      error('回滚失败');
    }
  };

  const getChangeTypeIcon = (type: ChangeType) => {
    switch (type) {
      case 'config':
        return '⚙️';
      case 'permission':
        return '🔐';
      case 'secret':
        return '🔑';
      case 'application':
        return '📦';
      default:
        return '📝';
    }
  };

  const columns = [
    {
      key: 'id',
      header: '变更单号',
      render: (item: ChangeOrder) => (
        <code className="font-mono text-sm">#{item.id}</code>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (item: ChangeOrder) => (
        <div className="flex items-center gap-2">
          <span>{getChangeTypeIcon(item.type)}</span>
          <StatusBadge status={item.type} />
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item: ChangeOrder) => <StatusBadge status={item.status} />,
    },
    {
      key: 'operator',
      header: '操作者',
      render: (item: ChangeOrder) => item.operator?.username || '-',
    },
    {
      key: 'reason',
      header: '变更原因',
      render: (item: ChangeOrder) => (
        <span className="max-w-xs truncate block">{item.reason}</span>
      ),
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (item: ChangeOrder) =>
        new Date(item.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '200px',
      render: (item: ChangeOrder) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/changes/${item.id}`}
            className="p-1 hover:bg-gray-100 text-blue-600"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(item.id)}
                className="p-1 hover:bg-gray-100 text-green-600"
                title="批准"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(item.id)}
                className="p-1 hover:bg-gray-100 text-red-600"
                title="拒绝"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {item.status === 'approved' && (
            <button
              onClick={() => handleExecute(item.id)}
              className="p-1 hover:bg-gray-100 text-blue-600"
              title="执行"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {item.status === 'executed' && (
            <button
              onClick={() => handleRollback(item.id)}
              className="p-1 hover:bg-gray-100 text-orange-600"
              title="回滚"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">变更中心</h1>
          <p className="text-gray-500 mt-1">管理所有配置变更单</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建变更
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索变更原因..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部类型</option>
              <option value="config">配置变更</option>
              <option value="permission">权限变更</option>
              <option value="secret">密钥变更</option>
              <option value="application">应用变更</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部状态</option>
              <option value="pending">待审批</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
              <option value="executed">已执行</option>
              <option value="rolled_back">已回滚</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={changes}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="新建变更单"
        size="lg"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">变更类型 *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as ChangeType })
                }
                className="input"
              >
                <option value="config">配置变更</option>
                <option value="permission">权限变更</option>
                <option value="secret">密钥变更</option>
                <option value="application">应用变更</option>
              </select>
            </div>
            <div>
              <label className="label">影响对象</label>
              <input
                type="text"
                value={formData.affectedObjects}
                onChange={(e) =>
                  setFormData({ ...formData, affectedObjects: e.target.value })
                }
                className="input"
                placeholder="如: 电商平台-生产环境"
              />
            </div>
          </div>
          <div>
            <label className="label">变更原因 *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input min-h-[80px]"
              placeholder="请详细描述变更原因"
            />
          </div>
          <div>
            <label className="label">恢复路径</label>
            <textarea
              value={formData.recoveryPath}
              onChange={(e) =>
                setFormData({ ...formData, recoveryPath: e.target.value })
              }
              className="input min-h-[80px]"
              placeholder="描述如何回滚此变更"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">原值 *</label>
              <textarea
                value={formData.oldValue}
                onChange={(e) => setFormData({ ...formData, oldValue: e.target.value })}
                className="input min-h-[100px] font-mono text-sm"
                placeholder="变更前的值"
              />
            </div>
            <div>
              <label className="label">新值 *</label>
              <textarea
                value={formData.newValue}
                onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
                className="input min-h-[100px] font-mono text-sm"
                placeholder="变更后的值"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
