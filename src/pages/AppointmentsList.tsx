import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  MessageSquare,
  Filter,
  Calendar,
  User,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { updateAppointmentStatus, addFollowUpRecord } from '@/api/modules/appointments';
import { formatDate } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import type { Appointment, AppointmentStatus, User as UserType } from '@/types';

const intentionLevelLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const intentionLevelColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const typeLabels: Record<string, string> = {
  view: '看车',
  test_drive: '试驾',
};

const statusOptions: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'no_show', label: '未到场' },
];

const typeOptions: { value: 'view' | 'test_drive' | ''; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'view', label: '看车' },
  { value: 'test_drive', label: '试驾' },
];

const mockSales: UserType[] = [
  { id: 1, name: '王销售', username: 'sales1', role: 'sales', phone: '13800138001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '李销售', username: 'sales2', role: 'sales', phone: '13800138002', status: 'active', createdAt: '2024-01-01' },
  { id: 3, name: '张销售', username: 'sales3', role: 'sales', phone: '13800138003', status: 'active', createdAt: '2024-01-01' },
];

const generateMockAppointments = (): Appointment[] => {
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
      buyer: { id: 1, name: '张先生', username: 'buyer1', role: 'buyer', phone: '13900139001', status: 'active', createdAt: '2024-01-01' },
      salesId: 1,
      sales: mockSales[0],
      type: 'view',
      appointmentTime: '2025-05-21 14:00:00',
      contactPhone: '13900139001',
      intentionLevel: 'high',
      notes: '对车源很感兴趣，希望详细了解车况',
      status: 'confirmed',
      followUpRecords: [],
      createdAt: '2025-05-18 10:30:00',
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
      buyer: { id: 2, name: '李女士', username: 'buyer2', role: 'buyer', phone: '13900139002', status: 'active', createdAt: '2024-01-01' },
      salesId: 2,
      sales: mockSales[1],
      type: 'test_drive',
      appointmentTime: '2025-05-22 10:00:00',
      contactPhone: '13900139002',
      intentionLevel: 'medium',
      notes: '需要试驾体验',
      status: 'pending',
      followUpRecords: [],
      createdAt: '2025-05-19 14:20:00',
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
      buyer: { id: 3, name: '王先生', username: 'buyer3', role: 'buyer', phone: '13900139003', status: 'active', createdAt: '2024-01-01' },
      salesId: 1,
      sales: mockSales[0],
      type: 'view',
      appointmentTime: '2025-05-20 15:30:00',
      contactPhone: '13900139003',
      intentionLevel: 'high',
      notes: '准备近期购买',
      status: 'completed',
      followUpRecords: [],
      createdAt: '2025-05-15 09:15:00',
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
      buyerId: 4,
      buyer: { id: 4, name: '赵女士', username: 'buyer4', role: 'buyer', phone: '13900139004', status: 'active', createdAt: '2024-01-01' },
      salesId: 3,
      sales: mockSales[2],
      type: 'test_drive',
      appointmentTime: '2025-05-19 11:00:00',
      contactPhone: '13900139004',
      intentionLevel: 'low',
      notes: '初步了解',
      status: 'cancelled',
      followUpRecords: [],
      createdAt: '2025-05-17 16:45:00',
    },
  ];
};

export default function AppointmentsList() {
  const { checkRole, checkPermission } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    salesId: '',
    keyword: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
    newStatus: AppointmentStatus;
  }>({ isOpen: false, appointment: null, newStatus: 'pending' });
  const [followUpModal, setFollowUpModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
    content: string;
  }>({ isOpen: false, appointment: null, content: '' });

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = generateMockAppointments();
      let filtered = [...data];

      if (filters.status) {
        filtered = filtered.filter((a) => a.status === filters.status);
      }
      if (filters.type) {
        filtered = filtered.filter((a) => a.type === filters.type);
      }
      if (filters.startDate) {
        filtered = filtered.filter((a) => a.appointmentTime >= filters.startDate);
      }
      if (filters.endDate) {
        filtered = filtered.filter((a) => a.appointmentTime <= filters.endDate + ' 23:59:59');
      }
      if (filters.salesId) {
        filtered = filtered.filter((a) => a.salesId === Number(filters.salesId));
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.car?.brand.toLowerCase().includes(keyword) ||
            a.car?.model.toLowerCase().includes(keyword) ||
            a.buyer?.name.toLowerCase().includes(keyword) ||
            a.contactPhone.includes(keyword)
        );
      }

      setAppointments(filtered);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusModal.appointment) return;

    try {
      await updateAppointmentStatus(statusModal.appointment.id, statusModal.newStatus);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === statusModal.appointment!.id ? { ...a, status: statusModal.newStatus } : a
        )
      );
      setStatusModal({ isOpen: false, appointment: null, newStatus: 'pending' });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpModal.appointment || !followUpModal.content.trim()) return;

    try {
      await addFollowUpRecord(followUpModal.appointment.id, followUpModal.content);
      setFollowUpModal({ isOpen: false, appointment: null, content: '' });
    } catch (error) {
      console.error('Failed to add follow-up record:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      startDate: '',
      endDate: '',
      salesId: '',
      keyword: '',
    });
  };

  const canCreate = checkRole(['buyer', 'sales', 'admin']);
  const canUpdateStatus = checkPermission('appointment:update') || checkRole(['sales', 'admin']);
  const canAddFollowUp = checkPermission('appointment:follow-up') || checkRole(['sales', 'customer_service', 'admin']);

  const getStatusActions = (appointment: Appointment) => {
    const actions: { status: AppointmentStatus; label: string; class: string }[] = [];

    switch (appointment.status) {
      case 'pending':
        actions.push({ status: 'confirmed', label: '确认预约', class: 'bg-blue-600 hover:bg-blue-700' });
        actions.push({ status: 'cancelled', label: '取消预约', class: 'bg-gray-600 hover:bg-gray-700' });
        break;
      case 'confirmed':
        actions.push({ status: 'completed', label: '标记完成', class: 'bg-green-600 hover:bg-green-700' });
        actions.push({ status: 'no_show', label: '未到场', class: 'bg-red-600 hover:bg-red-700' });
        actions.push({ status: 'cancelled', label: '取消预约', class: 'bg-gray-600 hover:bg-gray-700' });
        break;
      default:
        break;
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">预约管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理看车和试驾预约</p>
          </div>
          {canCreate && (
            <Link
              to="/appointments/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建预约
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索车源、买家、电话..."
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as 'view' | 'test_drive' | '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {typeOptions.map((opt) => (
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

                {checkRole(['admin']) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">销售</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={filters.salesId}
                        onChange={(e) => setFilters({ ...filters, salesId: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">全部销售</option>
                        {mockSales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
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
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  预约时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  联系电话
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  意向等级
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  销售
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
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    暂无预约数据
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-500">{appointment.car?.brand?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {appointment.car?.brand} {appointment.car?.model}
                          </p>
                          <p className="text-xs text-gray-500">VIN: {appointment.car?.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{appointment.buyer?.name}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {typeLabels[appointment.type]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(appointment.appointmentTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {appointment.contactPhone}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${intentionLevelColors[appointment.intentionLevel]}`}
                      >
                        {intentionLevelLabels[appointment.intentionLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {appointment.sales?.name || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={appointment.status} type="appointment" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canUpdateStatus && getStatusActions(appointment).length > 0 && (
                          <div className="relative group">
                            <button
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="更新状态"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                              {getStatusActions(appointment).map((action) => (
                                <button
                                  key={action.status}
                                  onClick={() =>
                                    setStatusModal({
                                      isOpen: true,
                                      appointment,
                                      newStatus: action.status,
                                    })
                                  }
                                  className={`w-full px-3 py-2 text-left text-sm text-white ${action.class} first:rounded-t-lg last:rounded-b-lg`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {canAddFollowUp && (
                          <button
                            onClick={() =>
                              setFollowUpModal({ isOpen: true, appointment, content: '' })
                            }
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="添加跟进记录"
                          >
                            <MessageSquare className="w-4 h-4" />
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
        isOpen={statusModal.isOpen}
        title={`确认${
          statusOptions.find((s) => s.value === statusModal.newStatus)?.label || '更新状态'
        }`}
        message={`确定要将预约状态更新为"${
          statusOptions.find((s) => s.value === statusModal.newStatus)?.label
        }"吗？`}
        confirmText="确认"
        confirmButtonClass={
          statusModal.newStatus === 'cancelled' || statusModal.newStatus === 'no_show'
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-primary-600 hover:bg-primary-700'
        }
        onConfirm={handleUpdateStatus}
        onCancel={() =>
          setStatusModal({ isOpen: false, appointment: null, newStatus: 'pending' })
        }
      />

      {followUpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFollowUpModal({ isOpen: false, appointment: null, content: '' })}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">添加跟进记录</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  setFollowUpModal({ isOpen: false, appointment: null, content: '' })
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                跟进内容
              </label>
              <textarea
                value={followUpModal.content}
                onChange={(e) =>
                  setFollowUpModal({ ...followUpModal, content: e.target.value })
                }
                rows={4}
                placeholder="请输入跟进内容..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setFollowUpModal({ isOpen: false, appointment: null, content: '' })
                }
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddFollowUp}
                disabled={!followUpModal.content.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
