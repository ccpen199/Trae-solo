import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Plus,
  CheckCircle,
  FileCheck,
  FileText,
  Receipt,
  Filter,
  Calendar,
  ChevronDown,
  X,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  markSettled,
  markReconciled,
  markInvoiced,
} from '@/api';
import { formatDate, formatPrice } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import type { Settlement, SettlementStatus, SettlementFee, User as UserType, Contract, Car } from '@/types';

const statusOptions: { value: SettlementStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待结算' },
  { value: 'settled', label: '已结算' },
  { value: 'reconciled', label: '已对账' },
  { value: 'invoiced', label: '已开票' },
];

const mockDealers: UserType[] = [
  { id: 1, name: '诚信二手车行', username: 'dealer1', role: 'dealer', phone: '13800138011', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '顺通车业', username: 'dealer2', role: 'dealer', phone: '13800138012', status: 'active', createdAt: '2024-02-15' },
  { id: 3, name: '宏远汽车', username: 'dealer3', role: 'dealer', phone: '13800138013', status: 'active', createdAt: '2024-03-20' },
];

const mockCars: Car[] = [
  {
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
    dealer: mockDealers[0],
    status: 'sold',
    statusHistory: [],
    createdAt: '2025-01-15',
    updatedAt: '2025-05-10',
  },
  {
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
    dealer: mockDealers[0],
    status: 'sold',
    statusHistory: [],
    createdAt: '2025-02-20',
    updatedAt: '2025-05-15',
  },
  {
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
    dealerId: 2,
    dealer: mockDealers[1],
    status: 'sold',
    statusHistory: [],
    createdAt: '2025-03-10',
    updatedAt: '2025-05-12',
  },
  {
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
    dealerId: 3,
    dealer: mockDealers[2],
    status: 'sold',
    statusHistory: [],
    createdAt: '2025-01-25',
    updatedAt: '2025-05-08',
  },
];

const mockContracts: Contract[] = [
  {
    id: 1,
    carId: 1,
    car: mockCars[0],
    buyerId: 1,
    dealerId: 1,
    dealer: mockDealers[0],
    totalPrice: 428000,
    paymentMethod: 'full',
    status: 'completed',
    signedByBuyerAt: '2025-05-10 10:00:00',
    signedByDealerAt: '2025-05-10 11:00:00',
    createdAt: '2025-05-08',
  },
  {
    id: 2,
    carId: 2,
    car: mockCars[1],
    buyerId: 2,
    dealerId: 1,
    dealer: mockDealers[0],
    totalPrice: 498000,
    paymentMethod: 'installment',
    status: 'completed',
    signedByBuyerAt: '2025-05-15 09:00:00',
    signedByDealerAt: '2025-05-15 10:00:00',
    createdAt: '2025-05-12',
  },
  {
    id: 3,
    carId: 3,
    car: mockCars[2],
    buyerId: 3,
    dealerId: 2,
    dealer: mockDealers[1],
    totalPrice: 388000,
    paymentMethod: 'full',
    status: 'completed',
    signedByBuyerAt: '2025-05-12 14:00:00',
    signedByDealerAt: '2025-05-12 15:00:00',
    createdAt: '2025-05-10',
  },
  {
    id: 4,
    carId: 4,
    car: mockCars[3],
    buyerId: 4,
    dealerId: 3,
    dealer: mockDealers[2],
    totalPrice: 198000,
    paymentMethod: 'full',
    status: 'completed',
    signedByBuyerAt: '2025-05-08 16:00:00',
    signedByDealerAt: '2025-05-08 17:00:00',
    createdAt: '2025-05-05',
  },
];

const mockOtherFees: SettlementFee[][] = [
  [
    { type: 'inspection', name: '检测费', amount: 300 },
    { type: 'transfer', name: '过户费', amount: 800 },
  ],
  [
    { type: 'inspection', name: '检测费', amount: 300 },
    { type: 'transfer', name: '过户费', amount: 800 },
    { type: 'finance', name: '金融服务费', amount: 5000 },
  ],
  [
    { type: 'inspection', name: '检测费', amount: 300 },
    { type: 'transfer', name: '过户费', amount: 800 },
  ],
  [
    { type: 'inspection', name: '检测费', amount: 300 },
    { type: 'transfer', name: '过户费', amount: 800 },
  ],
];

const generateMockSettlements = (): Settlement[] => {
  return [
    {
      id: 1,
      contractId: 1,
      contract: mockContracts[0],
      carId: 1,
      car: mockCars[0],
      dealerId: 1,
      dealer: mockDealers[0],
      totalAmount: 428000,
      platformFee: 8560,
      feeRate: 0.02,
      otherFees: mockOtherFees[0],
      amountToDealer: 418340,
      status: 'pending',
      createdAt: '2025-05-18 10:00:00',
    },
    {
      id: 2,
      contractId: 2,
      contract: mockContracts[1],
      carId: 2,
      car: mockCars[1],
      dealerId: 1,
      dealer: mockDealers[0],
      totalAmount: 498000,
      platformFee: 9960,
      feeRate: 0.02,
      otherFees: mockOtherFees[1],
      amountToDealer: 481940,
      status: 'settled',
      settledAt: '2025-05-19 10:00:00',
      createdAt: '2025-05-16 08:30:00',
    },
    {
      id: 3,
      contractId: 3,
      contract: mockContracts[2],
      carId: 3,
      car: mockCars[2],
      dealerId: 2,
      dealer: mockDealers[1],
      totalAmount: 388000,
      platformFee: 7760,
      feeRate: 0.02,
      otherFees: mockOtherFees[2],
      amountToDealer: 379140,
      status: 'reconciled',
      settledAt: '2025-05-15 10:00:00',
      reconciledAt: '2025-05-16 14:00:00',
      createdAt: '2025-05-13 08:00:00',
    },
    {
      id: 4,
      contractId: 4,
      contract: mockContracts[3],
      carId: 4,
      car: mockCars[3],
      dealerId: 3,
      dealer: mockDealers[2],
      totalAmount: 198000,
      platformFee: 3960,
      feeRate: 0.02,
      otherFees: mockOtherFees[3],
      amountToDealer: 192940,
      status: 'invoiced',
      settledAt: '2025-05-12 10:00:00',
      reconciledAt: '2025-05-13 10:00:00',
      invoicedAt: '2025-05-14 10:00:00',
      invoiceNumber: 'FP202505140001',
      createdAt: '2025-05-10 08:30:00',
    },
  ];
};

export default function SettlementsList() {
  const { checkRole, checkPermission } = useAuthStore();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    dealerId: '',
    keyword: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    settlement: Settlement | null;
    action: 'settle' | 'reconcile' | 'invoice';
    message: string;
    confirmText: string;
    confirmButtonClass: string;
  }>({
    isOpen: false,
    settlement: null,
    action: 'settle',
    message: '',
    confirmText: '确认',
    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
  });
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    settlement: Settlement | null;
    invoiceNumber: string;
  }>({ isOpen: false, settlement: null, invoiceNumber: '' });
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    contractId: number;
    platformFee: number;
    otherFees: SettlementFee[];
  }>({ isOpen: false, contractId: 0, platformFee: 0, otherFees: [] });
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    settlement: Settlement | null;
  }>({ isOpen: false, settlement: null });

  const canView = checkRole(['finance', 'admin']);
  const canCreate = checkPermission('settlement:create') || checkRole(['finance', 'admin']);
  const canSettle = checkPermission('settlement:update') || checkRole(['finance', 'admin']);
  const canReconcile = checkPermission('settlement:reconcile') || checkRole(['finance', 'admin']);
  const canInvoice = checkPermission('settlement:invoice') || checkRole(['finance', 'admin']);

  useEffect(() => {
    loadSettlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = generateMockSettlements();
      let filtered = [...data];

      if (filters.status) {
        filtered = filtered.filter((s) => s.status === filters.status);
      }
      if (filters.startDate) {
        filtered = filtered.filter((s) => s.createdAt >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((s) => s.createdAt <= filters.endDate + ' 23:59:59');
      }
      if (filters.dealerId) {
        filtered = filtered.filter((s) => s.dealerId === parseInt(filters.dealerId));
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.car?.brand.toLowerCase().includes(keyword) ||
            s.car?.model.toLowerCase().includes(keyword) ||
            s.car?.vin.toLowerCase().includes(keyword) ||
            s.dealer?.name.toLowerCase().includes(keyword)
        );
      }

      setSettlements(filtered);
    } catch (error) {
      console.error('Failed to load settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.settlement) return;

    try {
      switch (confirmModal.action) {
        case 'settle':
          await markSettled(confirmModal.settlement.id);
          break;
        case 'reconcile':
          await markReconciled(confirmModal.settlement.id);
          break;
        case 'invoice':
          if (invoiceModal.invoiceNumber) {
            await markInvoiced(confirmModal.settlement.id, invoiceModal.invoiceNumber);
          }
          break;
      }

      loadSettlements();
      setConfirmModal({
        isOpen: false,
        settlement: null,
        action: 'settle',
        message: '',
        confirmText: '确认',
        confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
      });
      setInvoiceModal({ isOpen: false, settlement: null, invoiceNumber: '' });
      setCreateModal({ isOpen: false, contractId: 0, platformFee: 0, otherFees: [] });
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      dealerId: '',
      keyword: '',
    });
  };

  const calculateOtherFeesTotal = (fees: SettlementFee[]): number => {
    return fees.reduce((sum, fee) => sum + fee.amount, 0);
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">无访问权限</h2>
          <p className="text-gray-500">您没有权限访问结算管理页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理交易结算和财务对账</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreateModal({ isOpen: true, contractId: 1, platformFee: 0, otherFees: [] })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建结算
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索车源品牌、型号、VIN码、车商名称..."
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">车商</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={filters.dealerId}
                      onChange={(e) => setFilters({ ...filters, dealerId: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">全部车商</option>
                      {mockDealers.map((dealer) => (
                        <option key={dealer.id} value={dealer.id}>
                          {dealer.name}
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
                  车商
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  总金额
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  平台服务费
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  其他费用
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  应付车商
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
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    暂无结算数据
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-500">{settlement.car?.brand?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {settlement.car?.brand} {settlement.car?.model}
                          </p>
                          <p className="text-xs text-gray-500">VIN: {settlement.car?.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{settlement.dealer?.name}</div>
                      <div className="text-xs text-gray-500">{settlement.dealer?.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatPrice(settlement.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-orange-600">
                      {formatPrice(settlement.platformFee)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                      {formatPrice(calculateOtherFeesTotal(settlement.otherFees))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                      {formatPrice(settlement.amountToDealer)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={settlement.status} type="settlement" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailModal({ isOpen: true, settlement })}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canSettle && settlement.status === 'pending' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                settlement,
                                action: 'settle',
                                message: `确定要结算该笔交易吗？应付车商 ${formatPrice(settlement.amountToDealer)}`,
                                confirmText: '确认结算',
                                confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="标记已结算"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {canReconcile && settlement.status === 'settled' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                settlement,
                                action: 'reconcile',
                                message: '确定要标记该笔结算为已对账吗？',
                                confirmText: '确认对账',
                                confirmButtonClass: 'bg-purple-600 hover:bg-purple-700',
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="标记已对账"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}

                        {canInvoice && settlement.status === 'reconciled' && (
                          <button
                            onClick={() =>
                              setInvoiceModal({ isOpen: true, settlement, invoiceNumber: '' })
                            }
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="标记已开票"
                          >
                            <FileText className="w-4 h-4" />
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
        isOpen={confirmModal.isOpen && !invoiceModal.isOpen && !createModal.isOpen && !detailModal.isOpen}
        title="确认操作"
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmButtonClass={confirmModal.confirmButtonClass}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            settlement: null,
            action: 'settle',
            message: '',
            confirmText: '确认',
            confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
          })
        }
      />

      {detailModal.isOpen && detailModal.settlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetailModal({ isOpen: false, settlement: null })}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">结算详情</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setDetailModal({ isOpen: false, settlement: null })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">基本信息</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">合同号</span>
                      <span className="text-sm font-medium font-mono">HT{String(detailModal.settlement.contractId).padStart(6, '0')}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">创建时间</span>
                      <span className="text-sm text-gray-900">{formatDate(detailModal.settlement.createdAt)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">状态</span>
                      <StatusBadge status={detailModal.settlement.status} type="settlement" />
                    </div>
                    {detailModal.settlement.settledAt && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">结算时间</span>
                        <span className="text-sm text-gray-900">{formatDate(detailModal.settlement.settledAt)}</span>
                      </div>
                    )}
                    {detailModal.settlement.reconciledAt && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">对账时间</span>
                        <span className="text-sm text-gray-900">{formatDate(detailModal.settlement.reconciledAt)}</span>
                      </div>
                    )}
                    {detailModal.settlement.invoicedAt && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">开票时间</span>
                        <span className="text-sm text-gray-900">{formatDate(detailModal.settlement.invoicedAt)}</span>
                      </div>
                    )}
                    {detailModal.settlement.invoiceNumber && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">发票号</span>
                        <span className="text-sm font-mono text-gray-900">{detailModal.settlement.invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">车源信息</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">车辆</span>
                      <span className="text-sm text-gray-900">{detailModal.settlement.car?.brand} {detailModal.settlement.car?.model}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">VIN码</span>
                      <span className="text-sm font-mono text-gray-900">{detailModal.settlement.car?.vin}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">车商</span>
                      <span className="text-sm text-gray-900">{detailModal.settlement.dealer?.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">费率</span>
                      <span className="text-sm text-gray-900">{(detailModal.settlement.feeRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-3">费用明细</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">交易总金额</span>
                    <span className="text-sm font-medium text-gray-900">{formatPrice(detailModal.settlement.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">平台服务费</span>
                    <span className="text-sm font-medium text-orange-600">- {formatPrice(detailModal.settlement.platformFee)}</span>
                  </div>
                  {detailModal.settlement.otherFees.map((fee, index) => (
                    <div key={index} className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">{fee.name}</span>
                      <span className="text-sm font-medium text-orange-600">- {formatPrice(fee.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-base font-semibold text-gray-900">应付车商</span>
                    <span className="text-base font-bold text-green-600">{formatPrice(detailModal.settlement.amountToDealer)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setDetailModal({ isOpen: false, settlement: null })}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setInvoiceModal({ isOpen: false, settlement: null, invoiceNumber: '' })}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                <Receipt className="w-5 h-5 inline mr-2 text-green-600" />
                开具发票
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setInvoiceModal({ isOpen: false, settlement: null, invoiceNumber: '' })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                发票号码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceModal.invoiceNumber}
                onChange={(e) => setInvoiceModal({ ...invoiceModal, invoiceNumber: e.target.value })}
                placeholder="请输入发票号码"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                请输入实际开具的发票号码，用于财务对账记录
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setInvoiceModal({ isOpen: false, settlement: null, invoiceNumber: '' })}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    settlement: invoiceModal.settlement,
                    action: 'invoice',
                    message: `确定要标记该笔结算为已开票吗？发票号：${invoiceModal.invoiceNumber}`,
                    confirmText: '确认开票',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                  });
                  setInvoiceModal({ ...invoiceModal, isOpen: false });
                }}
                disabled={!invoiceModal.invoiceNumber.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认开票
              </button>
            </div>
          </div>
        </div>
      )}

      {createModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCreateModal({ isOpen: false, contractId: 0, platformFee: 0, otherFees: [] })}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                <Plus className="w-5 h-5 inline mr-2 text-primary-600" />
                创建结算单
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setCreateModal({ isOpen: false, contractId: 0, platformFee: 0, otherFees: [] })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择合同 <span className="text-red-500">*</span>
                </label>
                <select
                  value={createModal.contractId}
                  onChange={(e) => {
                    const contract = mockContracts.find((c) => c.id === parseInt(e.target.value));
                    if (contract) {
                      const platformFee = Math.round(contract.totalPrice * 0.02);
                      setCreateModal({
                        ...createModal,
                        contractId: contract.id,
                        platformFee,
                        otherFees: [
                          { type: 'inspection', name: '检测费', amount: 300 },
                          { type: 'transfer', name: '过户费', amount: 800 },
                        ],
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={0}>请选择已完成的合同</option>
                  {mockContracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      HT{String(contract.id).padStart(6, '0')} - {contract.car?.brand} {contract.car?.model} - {formatPrice(contract.totalPrice)}
                    </option>
                  ))}
                </select>
              </div>

              {createModal.contractId > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      平台服务费（元）
                    </label>
                    <input
                      type="number"
                      value={createModal.platformFee}
                      onChange={(e) => setCreateModal({ ...createModal, platformFee: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">默认按交易金额2%计算，可手动调整</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">其他费用</label>
                      <button
                        type="button"
                        onClick={() =>
                          setCreateModal({
                            ...createModal,
                            otherFees: [...createModal.otherFees, { type: 'other', name: '', amount: 0 }],
                          })
                        }
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        + 添加费用
                      </button>
                    </div>
                    <div className="space-y-2">
                      {createModal.otherFees.map((fee, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={fee.name}
                            onChange={(e) => {
                              const newFees = [...createModal.otherFees];
                              newFees[index].name = e.target.value;
                              setCreateModal({ ...createModal, otherFees: newFees });
                            }}
                            placeholder="费用名称"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <input
                            type="number"
                            value={fee.amount}
                            onChange={(e) => {
                              const newFees = [...createModal.otherFees];
                              newFees[index].amount = parseInt(e.target.value) || 0;
                              setCreateModal({ ...createModal, otherFees: newFees });
                            }}
                            placeholder="金额"
                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFees = createModal.otherFees.filter((_, i) => i !== index);
                              setCreateModal({ ...createModal, otherFees: newFees });
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const contract = mockContracts.find((c) => c.id === createModal.contractId);
                    const otherTotal = calculateOtherFeesTotal(createModal.otherFees);
                    const amountToDealer = contract ? contract.totalPrice - createModal.platformFee - otherTotal : 0;
                    return (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">交易金额</span>
                            <span className="font-medium">{contract ? formatPrice(contract.totalPrice) : '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">平台服务费</span>
                            <span className="font-medium text-orange-600">- {formatPrice(createModal.platformFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">其他费用</span>
                            <span className="font-medium text-orange-600">- {formatPrice(otherTotal)}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-semibold text-gray-900">应付车商</span>
                            <span className="font-bold text-green-600">{formatPrice(amountToDealer)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setCreateModal({ isOpen: false, contractId: 0, platformFee: 0, otherFees: [] })}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const contract = mockContracts.find((c) => c.id === createModal.contractId);
                  if (contract) {
                    setConfirmModal({
                      isOpen: true,
                      settlement: {
                        id: 0,
                        contractId: contract.id,
                        carId: contract.carId,
                        dealerId: contract.dealerId,
                        totalAmount: contract.totalPrice,
                        platformFee: createModal.platformFee,
                        feeRate: 0.02,
                        otherFees: createModal.otherFees,
                        amountToDealer: contract.totalPrice - createModal.platformFee - calculateOtherFeesTotal(createModal.otherFees),
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                      },
                      action: 'settle',
                      message: '确定要创建该结算单吗？',
                      confirmText: '创建结算',
                      confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
                    });
                    setCreateModal({ isOpen: false, contractId: 0, platformFee: 0, otherFees: [] });
                  }
                }}
                disabled={createModal.contractId === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建结算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
