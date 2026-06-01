import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit2, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { applicationApi } from '../api/client';
import type { Application, ListResponse, Status } from '../types';

interface FormErrors {
  name?: string;
  code?: string;
  ownerId?: string;
}

export default function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    ownerId: '',
    status: 'active' as Status,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    loadApplications();
  }, [page, search, statusFilter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await applicationApi.list(params) as ListResponse<Application>;
      setApplications(response.items);
      setTotal(response.total);
    } catch {
      error('加载应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) {
      errors.name = '请输入应用名称';
    }
    if (!formData.code.trim()) {
      errors.code = '请输入应用编码';
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      errors.code = '应用编码只能包含小写字母、数字和短横线';
    }
    if (!formData.ownerId) {
      errors.ownerId = '请选择负责人';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingApp) {
        await applicationApi.update(editingApp.id, {
          ...formData,
          ownerId: parseInt(formData.ownerId),
        });
        success('应用更新成功');
      } else {
        await applicationApi.create({
          ...formData,
          ownerId: parseInt(formData.ownerId),
        });
        success('应用创建成功');
      }
      setShowModal(false);
      loadApplications();
    } catch {
      error(editingApp ? '更新应用失败' : '创建应用失败');
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      code: app.code,
      description: app.description,
      ownerId: app.ownerId.toString(),
      status: app.status,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await applicationApi.delete(deleteId);
      success('应用删除成功');
      setShowDeleteConfirm(false);
      setDeleteId(null);
      loadApplications();
    } catch {
      error('删除应用失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await applicationApi.delete(id);
      }
      success(`成功删除 ${selectedIds.length} 个应用`);
      setSelectedIds([]);
      loadApplications();
    } catch {
      error('批量删除失败');
    }
  };

  const openCreateModal = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      ownerId: '',
      status: 'active',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const columns = [
    {
      key: 'name',
      header: '应用名称',
      render: (item: Application) => (
        <div className="font-medium text-navy-900">{item.name}</div>
      ),
    },
    {
      key: 'code',
      header: '应用编码',
      render: (item: Application) => (
        <code className="font-mono text-sm bg-gray-100 px-2 py-0.5">
          {item.code}
        </code>
      ),
    },
    {
      key: 'owner',
      header: '负责人',
      render: (item: Application) => item.owner?.username || '-',
    },
    {
      key: 'status',
      header: '状态',
      render: (item: Application) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (item: Application) =>
        new Date(item.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '150px',
      render: (item: Application) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/applications/${item.id}`}
            className="p-1 hover:bg-gray-100 text-blue-600"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleEdit(item)}
            className="p-1 hover:bg-gray-100 text-navy-600"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(item.id)}
            className="p-1 hover:bg-gray-100 text-red-600"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">应用档案</h1>
          <p className="text-gray-500 mt-1">管理所有接入的应用</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增应用
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索应用名称或编码..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部状态</option>
              <option value="active">启用</option>
              <option value="disabled">停用</option>
              <option value="archived">归档</option>
            </select>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                已选择 {selectedIds.length} 项
              </span>
              <button
                onClick={handleBatchDelete}
                className="btn-danger flex items-center gap-1 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                批量删除
              </button>
            </div>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingApp ? '编辑应用' : '新增应用'}
        size="md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              {editingApp ? '保存' : '创建'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">应用名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
              }}
              className={`input ${formErrors.name ? 'input-error' : ''}`}
              placeholder="请输入应用名称"
            />
            {formErrors.name && <p className="error-text">{formErrors.name}</p>}
          </div>
          <div>
            <label className="label">应用编码 *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toLowerCase() });
                if (formErrors.code) setFormErrors({ ...formErrors, code: undefined });
              }}
              className={`input ${formErrors.code ? 'input-error' : ''}`}
              placeholder="如: my-app"
              disabled={!!editingApp}
            />
            {formErrors.code && <p className="error-text">{formErrors.code}</p>}
          </div>
          <div>
            <label className="label">负责人 *</label>
            <select
              value={formData.ownerId}
              onChange={(e) => {
                setFormData({ ...formData, ownerId: e.target.value });
                if (formErrors.ownerId) setFormErrors({ ...formErrors, ownerId: undefined });
              }}
              className={`input ${formErrors.ownerId ? 'input-error' : ''}`}
            >
              <option value="">请选择负责人</option>
              <option value="1">admin</option>
              <option value="2">ops_user</option>
              <option value="3">dev_user</option>
              <option value="4">owner_user</option>
              <option value="5">security_user</option>
            </select>
            {formErrors.ownerId && <p className="error-text">{formErrors.ownerId}</p>}
          </div>
          <div>
            <label className="label">状态</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as Status })
              }
              className="input"
            >
              <option value="active">启用</option>
              <option value="disabled">停用</option>
              <option value="archived">归档</option>
            </select>
          </div>
          <div>
            <label className="label">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px]"
              placeholder="请输入应用描述"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleDelete} className="btn-danger">
              确认删除
            </button>
          </>
        }
      >
        <p className="text-gray-700">确定要删除此应用吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
}
