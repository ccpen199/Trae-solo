import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  DollarSign,
  Filter,
  Calendar,
  User,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  confirmPayment,
  requestRefund,
  approveRefund,
  releaseDeposit,
} from '@/api';
import { formatDate, formatPrice } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import type { Deposit, DepositStatus, User as UserType } from '@/types';

const paymentMethodLabels: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  bank_transfer: '银行转账',
  cash: '现金',
};

const statusOptions: { value: DepositStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'locked', label: '已锁定' },
  { value: 'refund_pending', label: '退款待审' },
  { value: 'refunded', label: '已退款' },
  { value: 'released_to_seller', label: '已释放给卖家' },
  { value: 'deducted', label: '已扣除' },
];

const mockBuyers: UserType[] = [
  { id: 1, name: '张先生', username: 'buyer1', role: 'buyer', phone: '13900139001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '李女士', username: 'buyer2', role: 'buyer', phone: '13900139002', status: 'active', createdAt: '2024-01-01' },
  { id: 3, name: '王先生', username: 'buyer3', role: 'buyer', phone: '13900139003', status: 'active', createdAt: '2024-01-01' },
];

const generateMockDeposits = (): Deposit[] => {
  return [
    {
      id: 1,
      carId: 1,
      car: {
        id: 1,
        vin: 'LFV3A23C8D3000001',
        brand: '宝马',
        model: '5系 2023款 530Li',
        year: 2023,
        month: 6,
        mileage: 15000,
        color: '黑色',
        price: 428000,
        configuration: '豪华套装',
        images: [],
        documents: [],
        dealerId: 1,
        status: 'on_sale',
        statusHistory: [],
        createdAt: '2025-01-15',
        updatedAt: '2025-05-10',
      },
      buyerId: 1,
      buyer: mockBuyers[0],
      amount: 20000,
      paymentMethod: 'alipay',
      transactionId: 'ALI202505180001',
      paidAt: '2025-05-18 14:30:00',
      status: 'paid',
      createdAt: '2025-05-18 10:00:00',
    },
    {
      id: 2,
      carId: 2,
      car: {
        id: 2,
        vin: 'WDDUG8CBXFA123456',
        brand: '奔驰',
        model: 'E级 2024款 E300L',
        year: 2024,
        month: 1,
        mileage: 5000,
        color: '白色',
        price: 498000,
        configuration: '时尚型',
        images: [],
        documents: [],
        dealerId: 1,
        status: 'on_sale',
        statusHistory: [],
        createdAt: '2025-02-20',
        updatedAt: '2025-05-15',
      },
      buyerId: 2,
      buyer: mockBuyers[1],
      amount: 30000,
      paymentMethod: 'wechat',
      transactionId: 'WX202505190002',
      paidAt: '2025-05-19 09:15:00',
      status: 'locked',
      createdAt: '2025-05-19 08:30:00',
    },
    {
      id: 3,
      carId: 3,
      car: {
        id: 3,
        vin: 'LFV3A23C8D3000003',
        brand: '奥迪',
        model: 'A6L 2023款 45TFSI',
        year: 2023,
        month: 8,
        mileage: 12000,
        color: '银色',
        price: 388000,
        configuration: '臻选动感型',
        images: [],
        documents: [],
        dealerId: 1,
        status: 'on_sale',
        statusHistory: [],
        createdAt: '2025-03-10',
        updatedAt: '2025-05-12',
      },
      buyerId: 3,
      buyer: mockBuyers[2],
      amount: 15000,
      paymentMethod: 'bank_transfer',
      transactionId: '',
      paidAt: undefined,
      status: 'pending',
      createdAt: '2025-05-20 10:00:00',
    },
    {
      id: 4,
      carId: 4,
      car: {
        id: 4,
        vin: 'JTEBU5JR6A5000004',
        brand: '丰田',
        model: '凯美瑞 2023款 2.5G',
        year: 2023,
        month: 4,
        mileage: 20000,
        color: '黑色',
        price: 198000,
        configuration: '豪华版',
        images: [],
        documents: [],
        dealerId: 1,
        status: 'on_sale',
        statusHistory: [],
        createdAt: '2025-01-25',
        updatedAt: '2025-05-08',
      },
      buyerId: 1,
      buyer: mockBuyers[0],
      amount: 10000,
      paymentMethod: 'alipay',
      transactionId: 'ALI202505170004',
      paidAt: '2025-05-17 16:00:00',
      status: 'refund_pending',
      refundReason: '资金不足，无法继续购买',
      createdAt: '2025-05-17 15:30:00',
    },
  ];
};

export default function DepositsList() {
  const { checkRole } = useAuthStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    vin: '',
    buyerId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    deposit: Deposit | null;
    action: 'confirm_payment' | 'request_refund' | 'approve_refund' | 'reject_refund' | 'release_to_seller' | 'deduct';
    message: string;
    confirmText: string;
    confirmButtonClass: string;
  }>({
    isOpen: false,
    deposit: null,
    action: 'confirm_payment',
    message: '',
    confirmText: '确认',
    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
  });
  const [refundModal, setRefundModal] = useState<{
    isOpen: boolean;
    deposit: Deposit | null;
    reason: string;
  }>({ isOpen: false, deposit: null, reason: '' });
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean;
    deposit: Deposit | null;
    transactionId: string;
  }>({ isOpen: false, deposit: null, transactionId: '' });

  useEffect(() => {
    loadDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const data = generateMockDeposits();
      let filtered = [...data];

      if (filters.status) {
        filtered = filtered.filter((d) => d.status === filters.status);
      }
      if (filters.vin) {
        filtered = filtered.filter((d) =>
          d.car?.vin.toLowerCase().includes(filters.vin.toLowerCase())
        );
      }
      if (filters.buyerId) {
        filtered = filtered.filter((d) => d.buyerId === Number(filters.buyerId));
      }
      if (filters.startDate) {
        filtered = filtered.filter((d) => d.createdAt >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((d) => d.createdAt <= filters.endDate + ' 23:59:59');
      }

      setDeposits(filtered);
    } catch (error) {
      console.error('Failed to load deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.deposit) return;

    try {
      switch (confirmModal.action) {
        case 'confirm_payment':
          if (transactionModal.transactionId) {
            await confirmPayment(confirmModal.deposit.id, transactionModal.transactionId);
          }
          break;
        case 'request_refund':
          if (refundModal.reason) {
            await requestRefund(confirmModal.deposit.id, refundModal.reason);
          }
          break;
        case 'approve_refund':
          await approveRefund(confirmModal.deposit.id, true);
          break;
        case 'reject_refund':
          await approveRefund(confirmModal.deposit.id, false, refundModal.reason);
          break;
        case 'release_to_seller':
          await releaseDeposit(confirmModal.deposit.id, 'to_seller');
          break;
        case 'deduct':
          await releaseDeposit(confirmModal.deposit.id, 'deducted');
          break;
      }

      loadDeposits();
      setConfirmModal({
        isOpen: false,
        deposit: null,
        action: 'confirm_payment',
        message: '',
        confirmText: '确认',
        confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
      });
      setRefundModal({ isOpen: false, deposit: null, reason: '' });
      setTransactionModal({ isOpen: false, deposit: null, transactionId: '' });
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      vin: '',
      buyerId: '',
      startDate: '',
      endDate: '',
    });
  };

  const canConfirmPayment = checkRole(['buyer']);
  const canRequestRefund = checkRole(['buyer']);
  const canApproveRefund = checkRole(['finance', 'admin']);
  const canRelease = checkRole(['finance', 'admin']);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">订金管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理车辆交易订金</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索VIN码..."
                value={filters.vin}
                onChange={(e) => setFilters({ ...filters, vin: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">买家</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={filters.buyerId}
                      onChange={(e) => setFilters({ ...filters, buyerId: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">全部买家</option>
                      {mockBuyers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="w-3 h-3" />
                  重置筛选
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  车源信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  买家
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  支付方式
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  交易号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  支付时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  状态
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    暂无订金数据
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-500">{deposit.car?.brand?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {deposit.car?.brand} {deposit.car?.model}
                          </p>
                          <p className="text-xs text-gray-500">VIN: {deposit.car?.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{deposit.buyer?.name}</p>
                      <p className="text-xs text-gray-500">{deposit.buyer?.phone}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold text-primary-600">{formatPrice(deposit.amount)}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {paymentMethodLabels[deposit.paymentMethod] || deposit.paymentMethod}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {deposit.transactionId || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {deposit.paidAt ? formatDate(deposit.paidAt) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={deposit.status} type="deposit" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canConfirmPayment && deposit.status === 'pending' && (
                          <button
                            onClick={() => {
                              setTransactionModal({ isOpen: true, deposit, transactionId: '' });
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="确认支付"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {canRequestRefund &&
                          (deposit.status === 'paid' || deposit.status === 'locked') && (
                            <button
                              onClick={() => {
                                setRefundModal({ isOpen: true, deposit, reason: '' });
                              }}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="申请退款"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                        {canApproveRefund && deposit.status === 'refund_pending' && (
                          <>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  deposit,
                                  action: 'approve_refund',
                                  message: '确定要同意该退款申请吗？',
                                  confirmText: '同意退款',
                                  confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="审核通过"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setRefundModal({ isOpen: true, deposit, reason: '' });
                                setConfirmModal({
                                  isOpen: false,
                                  deposit: null,
                                  action: 'reject_refund',
                                  message: '',
                                  confirmText: '拒绝',
                                  confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                                });
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="审核驳回"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {canRelease && deposit.status === 'locked' && (
                          <div className="relative group">
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="释放订金"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    deposit,
                                    action: 'release_to_seller',
                                    message: '确定要将订金释放给卖家吗？',
                                    confirmText: '释放给卖家',
                                    confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                                  })
                                }
                                className="w-full px-3 py-2 text-left text-sm text-white bg-green-600 hover:bg-green-700 first:rounded-t-lg"
                              >
                                释放给卖家
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    deposit,
                                    action: 'deduct',
                                    message: '确定要扣除该订金吗？',
                                    confirmText: '扣除订金',
                                    confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                                  })
                                }
                                className="w-full px-3 py-2 text-left text-sm text-white bg-red-600 hover:bg-red-700 last:rounded-b-lg"
                              >
                                扣除订金
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen && !refundModal.isOpen && !transactionModal.isOpen}
        title="确认操作"
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmButtonClass={confirmModal.confirmButtonClass}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            deposit: null,
            action: 'confirm_payment',
            message: '',
            confirmText: '确认',
            confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
          })
        }
      />

      {refundModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setRefundModal({ isOpen: false, deposit: null, reason: '' });
              setConfirmModal({
                isOpen: false,
                deposit: null,
                action: 'confirm_payment',
                message: '',
                confirmText: '确认',
                confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
              });
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmModal.action === 'reject_refund' ? '拒绝退款' : '申请退款'}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setRefundModal({ isOpen: false, deposit: null, reason: '' });
                  setConfirmModal({
                    isOpen: false,
                    deposit: null,
                    action: 'confirm_payment',
                    message: '',
                    confirmText: '确认',
                    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
                  });
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {confirmModal.action === 'reject_refund' ? '拒绝原因' : '退款原因'}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundModal.reason}
                onChange={(e) =>
                  setRefundModal({ ...refundModal, reason: e.target.value })
                }
                rows={4}
                placeholder={
                  confirmModal.action === 'reject_refund'
                    ? '请输入拒绝原因...'
                    : '请输入退款原因...'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
              {refundModal.deposit?.refundReason && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">买家申请理由：</p>
                  <p className="text-sm text-gray-700">{refundModal.deposit.refundReason}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setRefundModal({ isOpen: false, deposit: null, reason: '' });
                  setConfirmModal({
                    isOpen: false,
                    deposit: null,
                    action: 'confirm_payment',
                    message: '',
                    confirmText: '确认',
                    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
                  });
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.action === 'reject_refund') {
                    setConfirmModal({
                      ...confirmModal,
                      isOpen: true,
                      message: `确定要拒绝该退款申请吗？原因：${refundModal.reason}`,
                    });
                  } else {
                    setConfirmModal({
                      ...confirmModal,
                      isOpen: true,
                      action: 'request_refund',
                      message: `确定要申请退款吗？原因：${refundModal.reason}`,
                      confirmText: '提交申请',
                      confirmButtonClass: 'bg-orange-600 hover:bg-orange-700',
                    });
                  }
                  setRefundModal({ ...refundModal, isOpen: false });
                }}
                disabled={!refundModal.reason.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmModal.action === 'reject_refund'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {confirmModal.action === 'reject_refund' ? '确认拒绝' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setTransactionModal({ isOpen: false, deposit: null, transactionId: '' });
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">确认支付</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setTransactionModal({ isOpen: false, deposit: null, transactionId: '' })
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="mb-4 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">支付金额</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatPrice(transactionModal.deposit?.amount || 0)}
                </p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transactionModal.transactionId}
                onChange={(e) =>
                  setTransactionModal({ ...transactionModal, transactionId: e.target.value })
                }
                placeholder="请输入支付交易号"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                请输入实际支付的交易号以便核对
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setTransactionModal({ isOpen: false, deposit: null, transactionId: '' })
                }
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    deposit: transactionModal.deposit,
                    action: 'confirm_payment',
                    message: `确定要确认支付吗？交易号：${transactionModal.transactionId}`,
                    confirmText: '确认支付',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                  });
                  setTransactionModal({ ...transactionModal, isOpen: false });
                }}
                disabled={!transactionModal.transactionId.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
