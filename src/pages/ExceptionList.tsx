import { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, CheckSquare, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Table, type Column } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { get } from '@/utils/request';
import type { ExceptionType, ExceptionStatus, ExceptionPriority } from '../../../shared/types';

interface ExceptionItem {
  id: string;
  waybillId?: string;
  trackingNo?: string;
  type: ExceptionType;
  status: ExceptionStatus;
  priority: ExceptionPriority;
  description?: string;
  handlerId?: string;
  handlerName?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

const typeMap: Record<ExceptionType, { label: string; color: 'danger' | 'warning' | 'info' | 'primary' }> = {
  id_suspicious: { label: '证件存疑', color: 'danger' },
  address_ambiguous: { label: '地址模糊', color: 'warning' },
  prohibited_item: { label: '禁寄物品', color: 'danger' },
  liveness_failed: { label: '活体失败', color: 'info' },
};

const statusMap: Record<ExceptionStatus, { label: string; color: 'warning' | 'info' | 'success' | 'danger' }> = {
  pending: { label: '待复核', color: 'warning' },
  reviewing: { label: '复核中', color: 'info' },
  resolved: { label: '已解决', color: 'success' },
  rejected: { label: '已驳回', color: 'danger' },
};

const priorityMap: Record<ExceptionPriority, { label: string; color: 'danger' | 'warning' | 'gray' }> = {
  high: { label: '高', color: 'danger' },
  medium: { label: '中', color: 'warning' },
  low: { label: '低', color: 'gray' },
};

export default function ExceptionList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExceptionItem[]>([]);
  const [filters, setFilters] = useState({
    type: '' as ExceptionType | '',
    status: '' as ExceptionStatus | '',
    priority: '' as ExceptionPriority | '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      const res = await get<{ list: ExceptionItem[]; total: number }>(
        `/exceptions?${params.toString()}`
      );
      setData(res.list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const columns: Column<ExceptionItem>[] = [
    {
      key: 'trackingNo',
      title: '运单号',
      dataIndex: 'trackingNo' as never,
      sortable: true,
      render: (record) => (
        <span className="font-mono text-sm font-medium text-gray-900">
          {record.trackingNo || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      title: '异常类型',
      render: (record) => {
        const t = typeMap[record.type];
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    {
      key: 'priority',
      title: '优先级',
      align: 'center',
      render: (record) => {
        const p = priorityMap[record.priority];
        return <Badge color={p.color}>{p.label}</Badge>;
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (record) => {
        const s = statusMap[record.status];
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      key: 'handler',
      title: '处理人',
      render: (record) => <span className="text-gray-600">{record.handlerName || '-'}</span>,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt' as never,
      sortable: true,
      render: (record) => (
        <span className="text-gray-500">
          {new Date(record.createdAt).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      align: 'right',
      render: (record) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={Eye}
            onClick={() => navigate(`/exceptions/${record.id}`)}
          >
            查看
          </Button>
          {(record.status === 'pending' || record.status === 'reviewing') && (
            <Button
              size="sm"
              leftIcon={CheckSquare}
              onClick={() => navigate(`/exceptions/${record.id}/review`)}
            >
              复核
            </Button>
          )}
        </div>
      ),
    },
  ];

  const customRowClassName = (record: ExceptionItem) =>
    cn(record.priority === 'high' && 'bg-red-50/50 hover:bg-red-50');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">异常件列表</h1>
          <p className="mt-1 text-sm text-gray-500">管理和复核实名收寄过程中产生的异常件</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">异常类型</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as ExceptionType | '' })}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部</option>
              <option value="id_suspicious">证件存疑</option>
              <option value="address_ambiguous">地址模糊</option>
              <option value="prohibited_item">禁寄物品</option>
              <option value="liveness_failed">活体失败</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ExceptionStatus | '' })}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部</option>
              <option value="pending">待复核</option>
              <option value="reviewing">复核中</option>
              <option value="resolved">已解决</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">优先级</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as ExceptionPriority | '' })}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              leftIcon={RefreshCw}
              onClick={fetchData}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>
      </div>

      {data.some((d) => d.priority === 'high') && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-800">高优先级提醒</p>
            <p className="mt-0.5 text-sm text-red-600">
              当前存在 {data.filter((d) => d.priority === 'high').length} 个高优先级异常件，请及时处理
            </p>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading}
        pageSize={10}
      />
    </div>
  );
}
