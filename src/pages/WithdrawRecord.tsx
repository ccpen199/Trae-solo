import { useState, useEffect } from 'react';
import {
  Loader2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { get } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { WithdrawRecord, WithdrawStatus, PaginatedResponse } from 'shared/types';

const statusConfig: Record<WithdrawStatus, { label: string; className: string; icon: any }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: '已通过', className: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700', icon: XCircle },
  transferred: { label: '已转账', className: 'bg-green-100 text-green-700', icon: Send },
  failed: { label: '失败', className: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

const mockWithdrawRecords: WithdrawRecord[] = [
  {
    id: '1',
    outletId: '1',
    amount: 10000.00,
    bankCardId: '1',
    bankName: '中国工商银行',
    cardNumber: '6222****1234',
    cardHolder: '张三',
    status: 'pending',
    applicantId: '1',
    applicantName: '张三',
    createdAt: '2026-06-18T10:30:00Z',
  },
  {
    id: '2',
    outletId: '1',
    amount: 25000.00,
    bankCardId: '1',
    bankName: '中国工商银行',
    cardNumber: '6222****1234',
    cardHolder: '张三',
    status: 'approved',
    auditorId: '2',
    auditorName: '李经理',
    applicantId: '1',
    applicantName: '张三',
    createdAt: '2026-06-17T14:20:00Z',
    auditedAt: '2026-06-17T16:00:00Z',
  },
  {
    id: '3',
    outletId: '1',
    amount: 5000.00,
    bankCardId: '2',
    bankName: '中国建设银行',
    cardNumber: '6217****5678',
    cardHolder: '张三',
    status: 'transferred',
    auditorId: '2',
    auditorName: '李经理',
    transferTransactionId: 'TX202606160001',
    applicantId: '1',
    applicantName: '张三',
    createdAt: '2026-06-16T09:15:00Z',
    auditedAt: '2026-06-16T10:30:00Z',
    transferredAt: '2026-06-16T14:00:00Z',
  },
  {
    id: '4',
    outletId: '1',
    amount: 8000.00,
    bankCardId: '1',
    bankName: '中国工商银行',
    cardNumber: '6222****1234',
    cardHolder: '张三',
    status: 'rejected',
    auditorId: '2',
    auditorName: '李经理',
    auditRemark: '余额不足',
    applicantId: '1',
    applicantName: '张三',
    createdAt: '2026-06-15T11:45:00Z',
    auditedAt: '2026-06-15T15:20:00Z',
  },
  {
    id: '5',
    outletId: '1',
    amount: 15000.00,
    bankCardId: '1',
    bankName: '中国工商银行',
    cardNumber: '6222****1234',
    cardHolder: '张三',
    status: 'failed',
    auditorId: '2',
    auditorName: '李经理',
    transferTransactionId: 'TX202606140001',
    applicantId: '1',
    applicantName: '张三',
    createdAt: '2026-06-14T13:30:00Z',
    auditedAt: '2026-06-14T14:30:00Z',
    transferredAt: '2026-06-14T16:00:00Z',
  },
];

export default function WithdrawRecordPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WithdrawRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: '' as WithdrawStatus | '',
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await get<PaginatedResponse<WithdrawRecord>>('/finance/withdraw-records', {
        params: { page, pageSize, ...filters },
      });
      setRecords(result.data.list);
      setTotal(result.data.total);
    } catch {
      setRecords(mockWithdrawRecords);
      setTotal(mockWithdrawRecords.length);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提现流水记录</h1>
          <p className="text-gray-500 mt-1">查看所有提现申请记录和状态</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 font-medium">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as WithdrawStatus | '' }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部状态</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">开始日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">结束日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">最小金额</label>
              <input
                type="number"
                placeholder="¥0.00"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">最大金额</label>
              <input
                type="number"
                placeholder="无上限"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setFilters({
                status: '',
                startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
                endDate: dayjs().format('YYYY-MM-DD'),
                minAmount: '',
                maxAmount: '',
              })}
              className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
            <button
              onClick={() => { setPage(1); fetchData(); }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              查询
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-500 mt-4">加载中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400">
              <Clock className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无提现记录</p>
              <p className="text-sm mt-1">您还没有提交过提现申请</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提现金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">银行卡</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审核人</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">到账时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record, idx) => {
                      const status = statusConfig[record.status];
                      const StatusIcon = status.icon;
                      return (
                        <tr
                          key={record.id}
                          className={cn(
                            'hover:bg-gray-50 transition-colors',
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">WD{record.id.padStart(8, '0')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-gray-900">¥{record.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm text-gray-900">{record.bankName}</p>
                              <p className="text-xs text-gray-500">{record.cardNumber}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.className)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{record.auditorName || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {record.transferredAt ? dayjs(record.transferredAt).format('YYYY-MM-DD HH:mm') : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  共 {total} 条记录，第 {page} / {totalPages || 1} 页
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      page === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (page > 3) {
                        pageNum = page - 2 + i;
                      }
                      if (page > totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          page === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      (page === totalPages || totalPages === 0)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
