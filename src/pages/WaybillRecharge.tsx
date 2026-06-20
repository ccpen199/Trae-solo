import { useState, useEffect } from 'react';
import {
  Loader2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Send
} from 'lucide-react';
import dayjs from 'dayjs';
import { get, post } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { Modal, ModalFooter } from '@/components/Modal';
import type { RechargeRecord, WaybillAccount } from 'shared/types';

const paymentMethodLabels: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  wechat: { label: '微信支付', icon: Smartphone, color: 'text-green-600', bgColor: 'bg-green-50' },
  alipay: { label: '支付宝', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  bank: { label: '银行卡转账', icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  account: { label: '账户余额', icon: Wallet, color: 'text-amber-600', bgColor: 'bg-amber-50' },
};

const rechargeStatusConfig: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: '待支付', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  success: { label: '成功', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: '失败', className: 'bg-red-100 text-red-700', icon: XCircle },
};

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function WaybillRecharge() {
  const hasRole = useAuthStore(state => state.hasRole);
  const addNotification = useAppStore(state => state.addNotification);
  const isAdmin = hasRole(['admin']);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<WaybillAccount | null>(null);
  const [records, setRecords] = useState<RechargeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wechat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: '' as 'pending' | 'success' | 'failed' | '',
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
      const [accountData, recordsData] = await Promise.all([
        get<WaybillAccount>('/waybill/account'),
        get<{ list: RechargeRecord[]; total: number; page: number; pageSize: number }>('/waybill/recharge-records', {
          params: { page, pageSize, ...filters },
        }),
      ]);
      setAccount(accountData);
      setRecords(recordsData.list || []);
      setTotal(recordsData.total || 0);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取充值记录失败',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || Number(rechargeAmount) <= 0) {
      addNotification({
        type: 'error',
        title: '参数错误',
        message: '请输入有效的充值金额',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await post('/waybill/recharge', {
        amount: Number(rechargeAmount),
        paymentMethod: selectedPaymentMethod,
      });
      addNotification({
        type: 'success',
        title: '充值成功',
        message: `已成功充值 ¥${Number(rechargeAmount).toFixed(2)}`,
      });
      setIsRechargeModalOpen(false);
      setRechargeAmount('');
      setSelectedPaymentMethod('wechat');
      fetchData();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '充值失败',
        message: error.message || '充值操作失败',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">面单充值记录</h1>
            <p className="text-gray-500 mt-1">查看所有面单充值记录和状态</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              充值
            </button>
          )}
        </div>

        {account && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">当前账户余额</p>
                  <p className="text-4xl font-bold mt-1">¥{account.balance.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">冻结金额</p>
                <p className="text-2xl font-semibold mt-1">¥{account.frozenBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

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
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部状态</option>
                {Object.entries(rechargeStatusConfig).map(([key, config]) => (
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
              <Wallet className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无充值记录</p>
              {isAdmin && <p className="text-sm mt-1">点击上方充值按钮进行充值</p>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易流水号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record, idx) => {
                      const status = rechargeStatusConfig[record.status];
                      const StatusIcon = status.icon;
                      const paymentMethod = paymentMethodLabels[record.paymentMethod] || paymentMethodLabels.wechat;
                      const PaymentIcon = paymentMethod.icon;
                      return (
                        <tr
                          key={record.id}
                          className={cn(
                            'hover:bg-gray-50 transition-colors',
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">CZ{record.id.padStart(8, '0')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-green-600">+¥{record.amount.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', paymentMethod.bgColor)}>
                                <PaymentIcon className={cn('w-4 h-4', paymentMethod.color)} />
                              </div>
                              <span className="text-sm text-gray-600">{paymentMethod.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 font-mono">{record.transactionId || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.className)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{record.operatorName || '-'}</span>
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

      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        title="面单账户充值"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择充值金额
            </label>
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setRechargeAmount(String(amount))}
                  className={cn(
                    'py-4 px-4 rounded-xl border-2 font-semibold text-lg transition-all',
                    rechargeAmount === String(amount)
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  )}
                >
                  ¥{amount.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-2">或输入自定义金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">¥</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择支付方式
            </label>
            <div className="space-y-3">
              {Object.entries(paymentMethodLabels).map(([key, method]) => {
                const Icon = method.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(key)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      selectedPaymentMethod === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    )}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', method.bgColor)}>
                      <Icon className={cn('w-6 h-6', method.color)} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-500">推荐使用</p>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      selectedPaymentMethod === key
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    )}>
                      {selectedPaymentMethod === key && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-600">充值金额</span>
              <span className="font-bold text-green-600">
                ¥{Number(rechargeAmount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setIsRechargeModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleRecharge}
            disabled={!rechargeAmount || Number(rechargeAmount) <= 0 || isSubmitting}
            className="px-8 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                充值中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                确认充值
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
