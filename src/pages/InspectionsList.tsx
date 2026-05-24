import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  X,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInspections, submitInspection, auditInspection } from '@/api/modules/inspections';
import type { Inspection, InspectionStatus } from '@/types';
import { STATUS_LABELS } from '@/utils/constants';
import { formatDate, formatPrice } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import ConfirmModal from '@/components/ConfirmModal';

export default function InspectionsList() {
  const { user, checkRole } = useAuthStore();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    inspectorId: '',
    vin: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'submit' | 'approve' | 'reject';
    inspectionId: number | null;
  }>({ open: false, type: 'submit', inspectionId: null });
  const [auditComment, setAuditComment] = useState('');

  useEffect(() => {
    loadInspections();
  }, [filters]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.inspectorId) params.inspectorId = Number(filters.inspectorId);
      if (filters.vin) params.vin = filters.vin;
      const data = await getInspections(params);
      setInspections(data);
    } catch (error) {
      console.error('加载检测报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      inspectorId: '',
      vin: '',
    });
    setCurrentPage(1);
  };

  const canEdit = (inspection: Inspection) => {
    if (!user) return false;
    return (
      inspection.status === 'draft' &&
      (checkRole(['admin']) || (checkRole(['inspector']) && inspection.inspectorId === user.id))
    );
  };

  const canSubmit = (inspection: Inspection) => {
    if (!user) return false;
    return (
      inspection.status === 'draft' &&
      (checkRole(['admin']) || (checkRole(['inspector']) && inspection.inspectorId === user.id))
    );
  };

  const canAudit = () => {
    return checkRole(['admin']);
  };

  const handleSubmit = async (id: number) => {
    try {
      await submitInspection(id);
      loadInspections();
      setConfirmModal({ open: false, type: 'submit', inspectionId: null });
    } catch (error) {
      console.error('提交检测报告失败:', error);
      alert('提交失败，请重试');
    }
  };

  const handleAudit = async (id: number, approved: boolean) => {
    try {
      await auditInspection(id, approved, auditComment);
      loadInspections();
      setConfirmModal({ open: false, type: 'submit', inspectionId: null });
      setAuditComment('');
    } catch (error) {
      console.error('审核检测报告失败:', error);
      alert('审核失败，请重试');
    }
  };

  const totalPages = Math.ceil(inspections.length / pageSize);
  const paginatedInspections = inspections.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusOptions: InspectionStatus[] = ['draft', 'submitted', 'approved', 'rejected'];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              检测报告列表
            </h1>
            <p className="text-sm text-neutral-500">管理和查看所有检测报告</p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">全部状态</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS.inspection[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">检测师</label>
              <select
                value={filters.inspectorId}
                onChange={(e) => handleFilterChange('inspectorId', e.target.value)}
                className="input-field"
              >
                <option value="">全部检测师</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">VIN搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={filters.vin}
                  onChange={(e) => handleFilterChange('vin', e.target.value)}
                  placeholder="输入VIN码"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    车源信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    VIN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    检测师
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    综合评分
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    提交时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    审核时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedInspections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <Empty message="暂无检测报告数据" icon={ClipboardCheck} />
                    </td>
                  </tr>
                ) : (
                  paginatedInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {inspection.car?.images && inspection.car.images[0] ? (
                            <img
                              src={inspection.car.images[0]}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                              <ClipboardCheck className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-neutral-800">
                              {inspection.car?.brand} {inspection.car?.model}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {inspection.car?.year}年 · {formatPrice(inspection.car?.price || 0)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-neutral-700">{inspection.car?.vin || '-'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{inspection.inspector?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-lg font-bold ${
                          inspection.overallScore >= 90 ? 'text-success-600' :
                          inspection.overallScore >= 70 ? 'text-primary-600' :
                          inspection.overallScore >= 60 ? 'text-warning-600' :
                          'text-danger-600'
                        }`}>
                          {inspection.overallScore}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={inspection.status} type="inspection" />
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-500">
                        {inspection.createdAt ? formatDate(inspection.createdAt) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-500">
                        {inspection.auditedAt ? formatDate(inspection.auditedAt) : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/inspections/${inspection.id}`}
                            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canEdit(inspection) && (
                            <button
                              onClick={() => navigate(`/inspections/create/${inspection.carId}?id=${inspection.id}`)}
                              className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canSubmit(inspection) && (
                            <button
                              onClick={() => setConfirmModal({ open: true, type: 'submit', inspectionId: inspection.id })}
                              className="p-2 text-neutral-500 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
                              title="提交审核"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {canAudit() && inspection.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => setConfirmModal({ open: true, type: 'approve', inspectionId: inspection.id })}
                                className="p-2 text-neutral-500 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
                                title="审核通过"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmModal({ open: true, type: 'reject', inspectionId: inspection.id })}
                                className="p-2 text-neutral-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                                title="审核驳回"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && inspections.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
              <div className="text-sm text-neutral-500">
                共 {inspections.length} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-700 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={
          confirmModal.type === 'submit' ? '提交审核' :
          confirmModal.type === 'approve' ? '审核通过' : '审核驳回'
        }
        message={
          confirmModal.type === 'submit' ? '确定要提交该检测报告进行审核吗？提交后将无法修改。' :
          confirmModal.type === 'approve' ? '确定要通过该检测报告吗？' : '确定要驳回该检测报告吗？'
        }
        confirmText={
          confirmModal.type === 'submit' ? '提交' :
          confirmModal.type === 'approve' ? '通过' : '驳回'
        }
        confirmButtonClass={confirmModal.type === 'reject' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-700 hover:bg-primary-800'}
        onConfirm={() => {
          if (confirmModal.inspectionId) {
            if (confirmModal.type === 'submit') {
              handleSubmit(confirmModal.inspectionId);
            } else {
              handleAudit(confirmModal.inspectionId, confirmModal.type === 'approve');
            }
          }
        }}
        onCancel={() => {
          setConfirmModal({ open: false, type: 'submit', inspectionId: null });
          setAuditComment('');
        }}
      />
    </div>
  );
}
