import { useState, useEffect } from 'react';
import {
  Loader2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Check,
  X,
  Send
} from 'lucide-react';
import dayjs from 'dayjs';
import { get, post, put } from '@/utils/api';
import { cn } from '@/lib/utils';
import { Modal, ModalFooter } from '@/components/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import type { WithdrawRecord, WithdrawStatus, BankCard } from 'shared/types';

export default function WithdrawRecordPage() {
  const { hasRole } = useAuthStore();
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WithdrawRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: '' as WithdrawStatus | '',
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    minAmount: '',
    maxAmount: '',
  });

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bankCardId: '',
  });
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditingRecord, setAuditingRecord] = useState<WithdrawRecord | null>(null);
  const [auditForm, setAuditForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    remark: '',
  });
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  const isOperator = hasRole(['operator']);
  const isAdmin = hasRole(['admin']);

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await get<{ list: WithdrawRecord[]; total: number }>('/finance/withdraw-records', {
        params: { page, pageSize, ...filters },
      });
      setRecords(result.list);
      setTotal(result.total);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取提现记录失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBankCards = async () => {
    try {
      const cards = await get<BankCard[]>('/finance/bank-cards');
      setBankCards(cards);
      const defaultCard = cards.find(c => c.isDefault);
      if (defaultCard) {
        setWithdrawForm(prev => ({ ...prev, bankCardId: defaultCard.id }));
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取银行卡列表失败'
      });
    }
  };

  const openWithdrawModal = async () => {
    setWithdrawForm({ amount: '', bankCardId: '' });
    setIsWithdrawModalOpen(true);
    await fetchBankCards();
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      addNotification({ type: 'warning', title: '请输入正确的提现金额', message: '' });
      return;
    }
    if (!withdrawForm.bankCardId) {
      addNotification({ type: 'warning', title: '请选择提现银行卡', message: '' });
      return;
    }

    try {
      setWithdrawSubmitting(true);
      await post('/finance/withdraw', {
        amount: parseFloat(withdrawForm.amount),
        bankCardId: withdrawForm.bankCardId,
      });
      addNotification({ type: 'success', title: '提现申请已提交', message: '请等待审核' });
      setIsWithdrawModalOpen(false);
      fetchData();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '提交失败',
        message: error.message || '提现申请提交失败'
      });
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const openAuditModal = (record: WithdrawRecord) => {
    setAuditingRecord(record);
    setAuditForm({ status: 'approved', remark: '' });
    setIsAuditModalOpen(true);
  };

  const handleAuditSubmit = async () => {
    if (!auditingRecord) return;
    if (auditForm.status === 'rejected' && !auditForm.remark.trim()) {
      addNotification({ type: 'warning', title: '请填写拒绝原因', message: '' });
      return;
    }

    try {
      setAuditSubmitting(true);
      await put(`/finance/withdraw-records/${auditingRecord.id}/audit`, {
        status: auditForm.status,
        remark: auditForm.remark,
      });
      addNotification({
        type: 'success',
        title: '审核完成',
        message: auditForm.status === 'approved' ? '已通过提现申请' : '已拒绝提现申请'
      });
      setIsAuditModalOpen(false);
      setAuditingRecord(null);
      fetchData();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '审核失败',
        message: error.message || '审核操作失败'
      });
    } finally {
      setAuditSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">提现流水记录</h1>
            <p className="text-gray-500 mt-1">查看所有提现申请记录和状态</p>
          </div>
          {isAdmin && (
            <button
              onClick={openWithdrawModal}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              新增提现申请
            </button>
          )}
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
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="transferred">已转账</option>
                <option value="failed">失败</option>
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
                      {isOperator && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record, idx) => (
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
                          <StatusBadge status={record.status} type="withdraw" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{record.auditorName || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {record.transferredAt ? dayjs(record.transferredAt).format('YYYY-MM-DD HH:mm') : '-'}
                          </span>
                        </td>
                        {isOperator && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setAuditForm(prev => ({ ...prev, status: 'approved' })); openAuditModal(record); }}
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                  title="通过"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setAuditForm(prev => ({ ...prev, status: 'rejected' })); openAuditModal(record); }}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  title="拒绝"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
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

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="申请提现"
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              提现金额 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
              <input
                type="number"
                placeholder="请输入提现金额（最低100元）"
                min="100"
                step="0.01"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">单笔提现金额不能低于100元</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              选择银行卡 <span className="text-red-500">*</span>
            </label>
            {bankCards.length === 0 ? (
              <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center text-gray-500">
                暂无可用银行卡，请先添加
              </div>
            ) : (
              <div className="space-y-2">
                {bankCards.map((card) => (
                  <label
                    key={card.id}
                    className={cn(
                      'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                      withdrawForm.bankCardId === card.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="bankCard"
                      value={card.id}
                      checked={withdrawForm.bankCardId === card.id}
                      onChange={(e) => setWithdrawForm(prev => ({ ...prev, bankCardId: e.target.value }))}
                      className="w-4 h-4 text-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{card.bankName}</span>
                        {card.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">默认</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-mono">
                        {card.cardNumber.length > 8
                          ? `${card.cardNumber.slice(0, 4)}****${card.cardNumber.slice(-4)}`
                          : card.cardNumber}
                      </p>
                      <p className="text-xs text-gray-500">{card.cardHolder} · {card.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setIsWithdrawModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleWithdrawSubmit}
            disabled={withdrawSubmitting || bankCards.length === 0}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {withdrawSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交申请
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="审核提现申请"
        size="lg"
      >
        {auditingRecord && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">申请单号</p>
                <p className="text-sm font-medium text-gray-900">WD{auditingRecord.id.padStart(8, '0')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">申请时间</p>
                <p className="text-sm text-gray-900">{dayjs(auditingRecord.createdAt).format('YYYY-MM-DD HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">提现金额</p>
                <p className="text-xl font-bold text-gray-900">¥{auditingRecord.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">申请人</p>
                <p className="text-sm text-gray-900">{auditingRecord.applicantName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">到账银行卡</p>
                <p className="text-sm text-gray-900">
                  {auditingRecord.bankName} · {auditingRecord.cardNumber} · {auditingRecord.cardHolder}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                审核结果 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <label
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    auditForm.status === 'approved'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <input
                    type="radio"
                    name="auditStatus"
                    value="approved"
                    checked={auditForm.status === 'approved'}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, status: e.target.value as 'approved' | 'rejected' }))}
                    className="w-4 h-4"
                  />
                  <Check className="w-5 h-5" />
                  <span className="font-medium">通过</span>
                </label>
                <label
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    auditForm.status === 'rejected'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <input
                    type="radio"
                    name="auditStatus"
                    value="rejected"
                    checked={auditForm.status === 'rejected'}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, status: e.target.value as 'approved' | 'rejected' }))}
                    className="w-4 h-4"
                  />
                  <X className="w-5 h-5" />
                  <span className="font-medium">拒绝</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                审核备注 {auditForm.status === 'rejected' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder={auditForm.status === 'rejected' ? '请填写拒绝原因' : '选填，填写审核备注'}
                value={auditForm.remark}
                onChange={(e) => setAuditForm(prev => ({ ...prev, remark: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        <ModalFooter>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleAuditSubmit}
            disabled={auditSubmitting}
            className={cn(
              'px-6 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
              auditForm.status === 'approved'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            )}
          >
            {auditSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                审核中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                确认{auditForm.status === 'approved' ? '通过' : '拒绝'}
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
