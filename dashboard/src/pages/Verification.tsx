import { useEffect, useState } from 'react';
import {
  QrCode,
  Search,
  Download,
  Calendar,
  RefreshCw,
  Undo2,
  Filter,
} from 'lucide-react';
import { useVerificationStore } from '../stores/verificationStore';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { FormTextarea } from '../components/common/FormInput';
import { PageLoading } from '../components/common/Loading';
import { LineChart } from '../components/common/LineChart';
import dayjs from 'dayjs';
import type { VerificationRecord } from '@shared/types';

export default function Verification() {
  const {
    records,
    trendData,
    stats,
    isLoading,
    pagination,
    fetchRecords,
    fetchTrendData,
    fetchStats,
    exportRecords,
    reverseVerification,
  } = useVerificationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(
    dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [reverseModal, setReverseModal] = useState<{
    open: boolean;
    record: VerificationRecord | null;
  }>({ open: false, record: null });
  const [reverseReason, setReverseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchTrendData(14);
    fetchRecords({
      page: 1,
      pageSize: 10,
      startDate,
      endDate,
      status: statusFilter || undefined,
    });
  }, [fetchStats, fetchTrendData, fetchRecords, startDate, endDate, statusFilter]);

  const filteredRecords = records.filter(
    (r) =>
      r.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.couponInstanceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const successCount = records.filter((r) => r.status === 'success').length;
  const successRate = records.length > 0 ? ((successCount / records.length) * 100).toFixed(1) : '0';
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const totalDiscount = records.reduce((sum, r) => sum + r.discountAmount, 0);

  const handleExport = async () => {
    try {
      const blob = await exportRecords({ startDate, endDate });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `核销记录_${startDate}_${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败', err);
    }
  };

  const handleReverse = async () => {
    if (!reverseModal.record || !reverseReason.trim()) return;
    setSubmitting(true);
    try {
      await reverseVerification(reverseModal.record.id, reverseReason);
      await fetchRecords({
        page: pagination.page,
        pageSize: pagination.pageSize,
        startDate,
        endDate,
        status: statusFilter || undefined,
      });
      setReverseModal({ open: false, record: null });
      setReverseReason('');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'verifiedAt',
      header: '核销时间',
      render: (row: VerificationRecord) =>
        dayjs(row.verifiedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      key: 'orderNo',
      header: '订单号',
      render: (row: VerificationRecord) => (
        <span className="font-mono text-xs">{row.orderNo}</span>
      ),
    },
    {
      key: 'terminalType',
      header: '核销渠道',
      render: (row: VerificationRecord) => (
        <span className="text-sm">
          {row.terminalType === 'pos'
            ? 'POS机'
            : row.terminalType === 'miniapp'
            ? '小程序'
            : '城市码'}
        </span>
      ),
    },
    {
      key: 'originalAmount',
      header: '原价',
      align: 'right' as const,
      render: (row: VerificationRecord) => `¥${row.originalAmount.toFixed(2)}`,
    },
    {
      key: 'discountAmount',
      header: '优惠',
      align: 'right' as const,
      render: (row: VerificationRecord) => (
        <span className="text-accent-600">-¥{row.discountAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'amount',
      header: '实付',
      align: 'right' as const,
      render: (row: VerificationRecord) => `¥${row.amount.toFixed(2)}`,
    },
    {
      key: 'status',
      header: '状态',
      align: 'center' as const,
      render: (row: VerificationRecord) => (
        <StatusBadge status={row.status} type="verification" />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center' as const,
      render: (row: VerificationRecord) =>
        row.status === 'success' ? (
          <button
            onClick={() => setReverseModal({ open: true, record: row })}
            className="p-1.5 hover:bg-danger-50 rounded transition-colors"
            title="撤销核销"
          >
            <Undo2 className="w-4 h-4 text-danger-500" />
          </button>
        ) : null,
    },
  ];

  if (isLoading && records.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">核销管理</h1>
          <p className="text-gray-500 mt-1">查看和管理核销记录</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-outline flex items-center gap-2"
            onClick={() =>
              fetchRecords({
                page: 1,
                pageSize: 10,
                startDate,
                endDate,
                status: statusFilter || undefined,
              })
            }
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="核销笔数"
          value={stats?.todayVerifications || 0}
          icon={<QrCode className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="核销金额"
          value={stats?.todayAmount || 0}
          prefix="¥"
          icon={<QrCode className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="成功率"
          value={`${successRate}%`}
          icon={<QrCode className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="优惠总额"
          value={totalDiscount}
          prefix="¥"
          icon={<QrCode className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="card">
        <div className="card-header">核销趋势</div>
        <div className="card-body">
          <LineChart data={trendData} height={250} />
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号或券实例ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
              <option value="reversed">已撤销</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">总笔数</p>
              <p className="text-xl font-bold text-gray-800">{pagination.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">总金额</p>
              <p className="text-xl font-bold text-gray-800">
                ¥{totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">总优惠</p>
              <p className="text-xl font-bold text-accent-600">
                ¥{totalDiscount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">成功率</p>
              <p className="text-xl font-bold text-success-600">{successRate}%</p>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRecords}
          loading={isLoading}
          pagination={{
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page) =>
              fetchRecords({
                page,
                pageSize: pagination.pageSize,
                startDate,
                endDate,
                status: statusFilter || undefined,
              }),
          }}
          rowKey={(row) => row.id}
        />
      </div>

      <Modal
        visible={reverseModal.open}
        onClose={() => setReverseModal({ open: false, record: null })}
        title="撤销核销"
        size="sm"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => setReverseModal({ open: false, record: null })}
            >
              取消
            </button>
            <button
              className="btn-danger flex items-center gap-2"
              onClick={handleReverse}
              disabled={submitting || !reverseReason.trim()}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  撤销中...
                </>
              ) : (
                <>
                  <Undo2 className="w-4 h-4" />
                  确认撤销
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-danger-50 rounded-lg">
            <p className="text-sm text-danger-600">
              确定要撤销此笔核销吗？撤销后优惠券将恢复可用状态。
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <p>
                <span className="text-gray-500">订单号：</span>
                <span className="font-mono">{reverseModal.record?.orderNo}</span>
              </p>
              <p className="mt-1">
                <span className="text-gray-500">核销金额：</span>
                <span className="font-medium">
                  ¥{reverseModal.record?.amount.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
          <FormTextarea
            label="撤销原因"
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
            placeholder="请输入撤销原因"
            rows={3}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
