import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { alertApi } from '../api/client';
import type { Alert, ListResponse, AlertType } from '../types';

export default function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<string>('');
  const [batchRemark, setBatchRemark] = useState('');
  const { success, error } = useToast();

  useEffect(() => {
    loadAlerts();
  }, [page, search, statusFilter, severityFilter, typeFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await alertApi.list(params) as ListResponse<Alert>;
      setAlerts(response.items);
      setTotal(response.total);
    } catch {
      error('加载告警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchProcess = async () => {
    if (selectedIds.length === 0 || !batchAction) return;
    try {
      await alertApi.batchProcess({
        ids: selectedIds,
        action: batchAction,
        remark: batchRemark,
      });
      success(`批量处理成功，共 ${selectedIds.length} 条告警`);
      setShowBatchModal(false);
      setSelectedIds([]);
      setBatchAction('');
      setBatchRemark('');
      loadAlerts();
    } catch {
      error('批量处理失败');
    }
  };

  const getAlertTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'duplicate_execution':
        return '🔄';
      case 'permission_violation':
        return '🔒';
      case 'config_misuse':
        return '⚙️';
      case 'task_failure':
        return '❌';
      case 'data_leak':
        return '📤';
      default:
        return '⚠️';
    }
  };

  const columns = [
    {
      key: 'severity',
      header: '严重程度',
      render: (item: Alert) => <StatusBadge status={item.severity} />,
    },
    {
      key: 'type',
      header: '类型',
      render: (item: Alert) => (
        <div className="flex items-center gap-2">
          <span>{getAlertTypeIcon(item.type)}</span>
          <StatusBadge status={item.type} />
        </div>
      ),
    },
    {
      key: 'title',
      header: '标题',
      render: (item: Alert) => (
        <div className="font-medium text-gray-900 max-w-md truncate">
          {item.title}
        </div>
      ),
    },
    {
      key: 'assignee',
      header: '负责人',
      render: (item: Alert) => item.assignee?.username || '-',
    },
    {
      key: 'status',
      header: '状态',
      render: (item: Alert) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (item: Alert) =>
        new Date(item.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '100px',
      render: (item: Alert) => (
        <Link
          to={`/alerts/${item.id}`}
          className="p-1 hover:bg-gray-100 text-blue-600"
          title="查看详情"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">告警中心</h1>
          <p className="text-gray-500 mt-1">管理和处理所有安全告警</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索告警标题..."
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
              <option value="open">待处理</option>
              <option value="processing">处理中</option>
              <option value="closed">已关闭</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部严重程度</option>
              <option value="critical">严重</option>
              <option value="high">高危</option>
              <option value="medium">中危</option>
              <option value="low">低危</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部类型</option>
              <option value="duplicate_execution">重复执行</option>
              <option value="permission_violation">权限越权</option>
              <option value="config_misuse">配置误发</option>
              <option value="task_failure">任务失败</option>
              <option value="data_leak">信息泄露</option>
            </select>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              批量处理 ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
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
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="批量处理告警"
        size="md"
        footer={
          <>
            <button onClick={() => setShowBatchModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleBatchProcess} className="btn-primary">
              确认处理
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            已选择 <span className="font-semibold text-navy-900">{selectedIds.length}</span>{' '}
            条告警进行批量处理
          </p>
          <div>
            <label className="label">处理动作 *</label>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value)}
              className="input"
            >
              <option value="">请选择处理动作</option>
              <option value="process">标记处理中</option>
              <option value="close">关闭告警</option>
              <option value="ignore">忽略告警</option>
            </select>
          </div>
          <div>
            <label className="label">处理备注</label>
            <textarea
              value={batchRemark}
              onChange={(e) => setBatchRemark(e.target.value)}
              className="input min-h-[100px]"
              placeholder="请输入处理备注（可选）"
            />
          </div>
          <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              请谨慎操作，批量处理将同时更新所选告警的状态
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
