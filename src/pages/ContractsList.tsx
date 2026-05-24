import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  FileSignature,
  CreditCard,
  CheckCircle,
  Filter,
  Calendar,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  signContract,
  confirmFinalPayment,
  completeContract,
} from '@/api/modules/contracts';
import { formatDate, formatPrice } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import type { Contract, ContractStatus, User as UserType } from '@/types';

const paymentMethodLabels: Record<string, string> = {
  full: '全款',
  installment: '分期',
};

const statusOptions: { value: ContractStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_sign', label: '待签署' },
  { value: 'signed', label: '已签署' },
  { value: 'pending_payment', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const paymentMethodOptions: { value: 'full' | 'installment' | ''; label: string }[] = [
  { value: '', label: '全部支付方式' },
  { value: 'full', label: '全款' },
  { value: 'installment', label: '分期' },
];

const mockDealers: UserType[] = [
  { id: 1, name: '诚信二手车行', username: 'dealer1', role: 'dealer', phone: '13800138001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '精品汽车馆', username: 'dealer2', role: 'dealer', phone: '13800138002', status: 'active', createdAt: '2024-01-01' },
];

const mockBuyers: UserType[] = [
  { id: 1, name: '张先生', username: 'buyer1', role: 'buyer', phone: '13900139001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '李女士', username: 'buyer2', role: 'buyer', phone: '13900139002', status: 'active', createdAt: '2024-01-01' },
  { id: 3, name: '王先生', username: 'buyer3', role: 'buyer', phone: '13900139003', status: 'active', createdAt: '2024-01-01' },
];

const generateMockContracts = (): Contract[] => {
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
      dealerId: 1,
      dealer: mockDealers[0],
      depositId: 1,
      totalPrice: 428000,
      paymentMethod: 'full',
      status: 'pending_sign',
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
      dealerId: 1,
      dealer: mockDealers[0],
      depositId: 2,
      totalPrice: 498000,
      paymentMethod: 'installment',
      financePlan: {
        bank: '中国建设银行',
        downPayment: 149400,
        loanAmount: 348600,
        loanTerm: 36,
        interestRate: 4.5,
        monthlyPayment: 10360,
      },
      status: 'signed',
      signedByBuyerAt: '2025-05-19 10:00:00',
      signedByDealerAt: '2025-05-19 11:00:00',
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
      dealerId: 1,
      dealer: mockDealers[0],
      depositId: 3,
      totalPrice: 388000,
      paymentMethod: 'full',
      status: 'pending_payment',
      signedByBuyerAt: '2025-05-20 09:00:00',
      signedByDealerAt: '2025-05-20 09:30:00',
      createdAt: '2025-05-20 08:00:00',
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
      dealerId: 2,
      dealer: mockDealers[1],
      depositId: 4,
      totalPrice: 198000,
      paymentMethod: 'full',
      status: 'completed',
      signedByBuyerAt: '2025-05-10 10:00:00',
      signedByDealerAt: '2025-05-10 11:00:00',
      createdAt: '2025-05-08 08:30:00',
    },
  ];
};

export default function ContractsList() {
  const { checkRole } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    keyword: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    contract: Contract | null;
    action: 'sign' | 'confirm_payment' | 'complete';
    message: string;
    confirmText: string;
    confirmButtonClass: string;
  }>({
    isOpen: false,
    contract: null,
    action: 'sign',
    message: '',
    confirmText: '确认',
    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
  });
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    contract: Contract | null;
    transactionId: string;
  }>({ isOpen: false, contract: null, transactionId: '' });

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const data = generateMockContracts();
      let filtered = [...data];

      if (filters.status) {
        filtered = filtered.filter((c) => c.status === filters.status);
      }
      if (filters.paymentMethod) {
        filtered = filtered.filter((c) => c.paymentMethod === filters.paymentMethod);
      }
      if (filters.startDate) {
        filtered = filtered.filter((c) => c.createdAt >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((c) => c.createdAt <= filters.endDate + ' 23:59:59');
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.car?.brand.toLowerCase().includes(keyword) ||
            c.car?.model.toLowerCase().includes(keyword) ||
            c.buyer?.name.toLowerCase().includes(keyword) ||
            c.dealer?.name.toLowerCase().includes(keyword)
        );
      }

      setContracts(filtered);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleConfirmAction = async () => {
    if (!confirmModal.contract) return;

    try {
      let signer: 'dealer' | 'buyer';
      switch (confirmModal.action) {
        case 'sign':
          signer = checkRole(['buyer']) ? 'buyer' : 'dealer';
          await signContract(confirmModal.contract.id, signer);
          break;
        case 'confirm_payment':
          if (paymentModal.transactionId) {
            await confirmFinalPayment(confirmModal.contract.id, paymentModal.transactionId);
          }
          break;
        case 'complete':
          await completeContract(confirmModal.contract.id);
          break;
      }

      loadContracts();
      setConfirmModal({
        isOpen: false,
        contract: null,
        action: 'sign',
        message: '',
        confirmText: '确认',
        confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
      });
      setPaymentModal({ isOpen: false, contract: null, transactionId: '' });
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      keyword: '',
    });
  };

  const canSignAsBuyer = checkRole(['buyer']);
  const canSignAsDealer = checkRole(['dealer', 'admin']);
  const canConfirmPayment = checkRole(['finance', 'admin']);
  const canComplete = checkRole(['sales', 'finance', 'admin']);

  const canSign = (contract: Contract) => {
    if (canSignAsBuyer && contract.status === 'pending_sign' && !contract.signedByBuyerAt) {
      return true;
    }
    if (canSignAsDealer && contract.status === 'pending_sign' && !contract.signedByDealerAt) {
      return true;
    }
    if (
      contract.status === 'pending_sign' &&
      contract.signedByBuyerAt &&
      contract.signedByDealerAt
    ) {
      return false;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">合同管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理车辆交易合同</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索车源、买家、车商..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        paymentMethod: e.target.value as 'full' | 'installment' | '',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {paymentMethodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                  车商
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  总价
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  支付方式
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  签署时间
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
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    暂无合同数据
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-500">{contract.car?.brand?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {contract.car?.brand} {contract.car?.model}
                          </p>
                          <p className="text-xs text-gray-500">VIN: {contract.car?.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{contract.buyer?.name}</p>
                      <p className="text-xs text-gray-500">{contract.buyer?.phone}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{contract.dealer?.name}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold text-primary-600">{formatPrice(contract.totalPrice)}</p>
                      {contract.paymentMethod === 'installment' && contract.financePlan && (
                        <p className="text-xs text-gray-500">
                          首付 {formatPrice(contract.financePlan.downPayment)} · {contract.financePlan.loanTerm}期 · 月供 {formatPrice(contract.financePlan.monthlyPayment)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {paymentMethodLabels[contract.paymentMethod]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={contract.status} type="contract" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contract.signedByBuyerAt && contract.signedByDealerAt
                        ? formatDate(contract.signedByDealerAt)
                        : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canSign(contract) && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                contract,
                                action: 'sign',
                                message: `确定要${checkRole(['buyer']) ? '买家' : '车商'}签署该合同吗？`,
                                confirmText: '签署合同',
                                confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="签署合同"
                          >
                            <FileSignature className="w-4 h-4" />
                          </button>
                        )}

                        {canConfirmPayment && contract.status === 'pending_payment' && (
                          <button
                            onClick={() => {
                              setPaymentModal({ isOpen: true, contract, transactionId: '' });
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="确认尾款支付"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {canComplete && contract.status === 'paid' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                contract,
                                action: 'complete',
                                message: '确定要将该合同标记为完成吗？',
                                confirmText: '完成合同',
                                confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="完成合同"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
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
        isOpen={confirmModal.isOpen && !paymentModal.isOpen}
        title="确认操作"
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmButtonClass={confirmModal.confirmButtonClass}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            contract: null,
            action: 'sign',
            message: '',
            confirmText: '确认',
            confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
          })
        }
      />

      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setPaymentModal({ isOpen: false, contract: null, transactionId: '' });
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">确认尾款支付</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setPaymentModal({ isOpen: false, contract: null, transactionId: '' })
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="mb-4 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">尾款金额</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatPrice(
                    (paymentModal.contract?.totalPrice || 0) -
                      (paymentModal.contract?.deposit?.amount || 0)
                  )}
                </p>
                {paymentModal.contract?.deposit?.amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    已扣除订金 {formatPrice(paymentModal.contract.deposit.amount)}
                  </p>
                )}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentModal.transactionId}
                onChange={(e) =>
                  setPaymentModal({ ...paymentModal, transactionId: e.target.value })
                }
                placeholder="请输入尾款支付交易号"
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
                  setPaymentModal({ isOpen: false, contract: null, transactionId: '' })
                }
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    contract: paymentModal.contract,
                    action: 'confirm_payment',
                    message: `确定要确认尾款支付吗？交易号：${paymentModal.transactionId}`,
                    confirmText: '确认支付',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                  });
                  setPaymentModal({ ...paymentModal, isOpen: false });
                }}
                disabled={!paymentModal.transactionId.trim()}
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
