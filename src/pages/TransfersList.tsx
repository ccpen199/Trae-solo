import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Upload,
  CheckCircle,
  XCircle,
  FileCheck,
  Filter,
  Calendar,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  reviewTransfer,
  completeTransfer,
} from '@/api';
import { formatDate } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import type { Transfer, TransferStatus, TransferDocument, User as UserType } from '@/types';

const statusOptions: { value: TransferStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待提交' },
  { value: 'submitted', label: '已提交' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已驳回' },
];

const mockReviewers: UserType[] = [
  { id: 1, name: '孙财务', username: 'finance1', role: 'finance', phone: '13800138001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '系统管理员', username: 'admin', role: 'admin', phone: '13800138000', status: 'active', createdAt: '2024-01-01' },
];

const generateMockTransfers = (): Transfer[] => {
  return [
    {
      id: 1,
      contractId: 1,
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
      documents: [
        { type: 'id_card_buyer', name: '买家身份证', url: '' },
        { type: 'id_card_seller', name: '卖家身份证', url: '' },
      ],
      status: 'pending',
      createdAt: '2025-05-18 10:00:00',
    },
    {
      id: 2,
      contractId: 2,
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
      documents: [
        { type: 'id_card_buyer', name: '买家身份证', url: '' },
        { type: 'id_card_seller', name: '卖家身份证', url: '' },
        { type: 'registration', name: '行驶证', url: '' },
        { type: 'insurance', name: '保险单', url: '' },
      ],
      status: 'submitted',
      createdAt: '2025-05-19 08:30:00',
    },
    {
      id: 3,
      contractId: 3,
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
      documents: [
        { type: 'id_card_buyer', name: '买家身份证', url: '' },
        { type: 'id_card_seller', name: '卖家身份证', url: '' },
        { type: 'registration', name: '行驶证', url: '' },
        { type: 'insurance', name: '保险单', url: '' },
      ],
      status: 'reviewing',
      reviewerId: 1,
      reviewer: mockReviewers[0],
      createdAt: '2025-05-20 08:00:00',
    },
    {
      id: 4,
      contractId: 4,
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
      documents: [
        { type: 'id_card_buyer', name: '买家身份证', url: '' },
        { type: 'id_card_seller', name: '卖家身份证', url: '' },
        { type: 'registration', name: '行驶证', url: '' },
        { type: 'insurance', name: '保险单', url: '' },
        { type: 'other', name: '购置税完税证明', url: '' },
      ],
      status: 'completed',
      reviewerId: 1,
      reviewer: mockReviewers[0],
      reviewComment: '资料齐全，审核通过',
      reviewedAt: '2025-05-15 14:00:00',
      completedAt: '2025-05-16 10:00:00',
      createdAt: '2025-05-12 08:30:00',
    },
  ];
};

export default function TransfersList() {
  const { checkRole } = useAuthStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    keyword: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    transfer: Transfer | null;
    action: 'approve' | 'reject' | 'complete';
    message: string;
    confirmText: string;
    confirmButtonClass: string;
  }>({
    isOpen: false,
    transfer: null,
    action: 'approve',
    message: '',
    confirmText: '确认',
    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
  });
  const [documentsModal, setDocumentsModal] = useState<{
    isOpen: boolean;
    transfer: Transfer | null;
    documents: TransferDocument[];
  }>({ isOpen: false, transfer: null, documents: [] });
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    transfer: Transfer | null;
    comment: string;
  }>({ isOpen: false, transfer: null, comment: '' });

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const data = generateMockTransfers();
      let filtered = [...data];

      if (filters.status) {
        filtered = filtered.filter((t) => t.status === filters.status);
      }
      if (filters.startDate) {
        filtered = filtered.filter((t) => t.createdAt >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((t) => t.createdAt <= filters.endDate + ' 23:59:59');
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.car?.brand.toLowerCase().includes(keyword) ||
            t.car?.model.toLowerCase().includes(keyword) ||
            t.car?.vin.toLowerCase().includes(keyword)
        );
      }

      setTransfers(filtered);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.transfer) return;

    try {
      switch (confirmModal.action) {
        case 'approve':
          await reviewTransfer(confirmModal.transfer.id, true);
          break;
        case 'reject':
          if (rejectModal.comment) {
            await reviewTransfer(confirmModal.transfer.id, false, rejectModal.comment);
          }
          break;
        case 'complete':
          await completeTransfer(confirmModal.transfer.id);
          break;
      }

      loadTransfers();
      setConfirmModal({
        isOpen: false,
        transfer: null,
        action: 'approve',
        message: '',
        confirmText: '确认',
        confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
      });
      setDocumentsModal({ isOpen: false, transfer: null, documents: [] });
      setRejectModal({ isOpen: false, transfer: null, comment: '' });
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      keyword: '',
    });
  };

  const canSubmitDocuments = checkRole(['dealer', 'admin']);
  const canReview = checkRole(['finance', 'admin']);
  const canComplete = checkRole(['finance', 'admin']);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">过户管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理车辆过户流程</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索车源品牌、型号、VIN码..."
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  合同号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  提交时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  审核人
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    暂无过户数据
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-500">{transfer.car?.brand?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {transfer.car?.brand} {transfer.car?.model}
                          </p>
                          <p className="text-xs text-gray-500">VIN: {transfer.car?.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      HT{String(transfer.contractId).padStart(6, '0')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transfer.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={transfer.status} type="transfer" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transfer.reviewer?.name || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canSubmitDocuments &&
                          (transfer.status === 'pending' || transfer.status === 'rejected') && (
                            <button
                              onClick={() =>
                                setDocumentsModal({
                                  isOpen: true,
                                  transfer,
                                  documents: transfer.documents || [],
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="提交资料"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          )}

                        {canReview &&
                          (transfer.status === 'submitted' || transfer.status === 'reviewing') && (
                            <>
                              <button
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    transfer,
                                    action: 'approve',
                                    message: '确定要审核通过该过户申请吗？',
                                    confirmText: '审核通过',
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
                                  setRejectModal({ isOpen: true, transfer, comment: '' });
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="审核驳回"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        {canComplete && transfer.status === 'approved' && (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                transfer,
                                action: 'complete',
                                message: '确定要标记该过户为完成吗？',
                                confirmText: '确认完成',
                                confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="确认完成"
                          >
                            <FileCheck className="w-4 h-4" />
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
        isOpen={confirmModal.isOpen && !documentsModal.isOpen && !rejectModal.isOpen}
        title="确认操作"
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmButtonClass={confirmModal.confirmButtonClass}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            transfer: null,
            action: 'approve',
            message: '',
            confirmText: '确认',
            confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
          })
        }
      />

      {documentsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() =>
              setDocumentsModal({ isOpen: false, transfer: null, documents: [] })
            }
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">提交过户资料</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setDocumentsModal({ isOpen: false, transfer: null, documents: [] })
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 mb-4">
                请上传以下资料完成过户申请：
              </p>
              <div className="space-y-3">
                {[
                  { type: 'id_card_buyer', name: '买家身份证', required: true },
                  { type: 'id_card_seller', name: '卖家身份证', required: true },
                  { type: 'registration', name: '车辆行驶证', required: true },
                  { type: 'insurance', name: '车辆保险单', required: true },
                  { type: 'other', name: '其他资料（可选）', required: false },
                ].map((doc) => {
                  const exists = documentsModal.documents.some((d) => d.type === doc.type);
                  return (
                    <div
                      key={doc.type}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        exists ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Upload
                          className={`w-5 h-5 ${
                            exists ? 'text-green-600' : 'text-gray-400'
                          }`}
                        />
                        <div>
                          <p className={`font-medium ${exists ? 'text-green-700' : 'text-gray-900'}`}>
                            {doc.name}
                          </p>
                          {doc.required && (
                            <p className="text-xs text-gray-500">必需</p>
                          )}
                        </div>
                      </div>
                      {exists ? (
                        <span className="text-sm text-green-600 font-medium">已上传</span>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1 text-sm text-primary-600 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
                        >
                          上传
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setDocumentsModal({ isOpen: false, transfer: null, documents: [] })
                }
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    transfer: documentsModal.transfer,
                    action: 'approve',
                    message: '确定要提交过户资料吗？',
                    confirmText: '提交资料',
                    confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
                  });
                  setDocumentsModal({ ...documentsModal, isOpen: false });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setRejectModal({ isOpen: false, transfer: null, comment: '' });
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">审核驳回</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setRejectModal({ isOpen: false, transfer: null, comment: '' })
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                驳回原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectModal.comment}
                onChange={(e) =>
                  setRejectModal({ ...rejectModal, comment: e.target.value })
                }
                rows={4}
                placeholder="请输入驳回原因..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setRejectModal({ isOpen: false, transfer: null, comment: '' })
                }
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    transfer: rejectModal.transfer,
                    action: 'reject',
                    message: `确定要驳回该过户申请吗？原因：${rejectModal.comment}`,
                    confirmText: '确认驳回',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                  });
                  setRejectModal({ ...rejectModal, isOpen: false });
                }}
                disabled={!rejectModal.comment.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
