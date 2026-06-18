import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Calendar, Clock, MapPin, Phone, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAppointments, updateAppointment } from '../../services/api';
import type { Appointment } from '../../../shared/types';
import { Link } from 'react-router-dom';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待确认', color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500', icon: XCircle },
  noshow: { label: '未到店', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const serviceTypeConfig: Record<string, { label: string; color: string }> = {
  health_check: { label: '健康检测', color: 'bg-purple-100 text-purple-700' },
  experience: { label: '产品体验', color: 'bg-green-100 text-green-700' },
  counseling: { label: '咨询服务', color: 'bg-blue-100 text-blue-700' },
  therapy: { label: '理疗服务', color: 'bg-amber-100 text-amber-700' },
  training: { label: '培训讲座', color: 'bg-rose-100 text-rose-700' },
};

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const pageSize = 10;

  useEffect(() => {
    fetchAppointments();
  }, [page, activeStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await getAppointments({ 
        page, 
        pageSize, 
        status: activeStatus === 'all' ? undefined : activeStatus 
      });
      if (res.code === 0) {
        setAppointments(res.data.list);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: Appointment['status']) => {
    try {
      const res = await updateAppointment(id, { status });
      if (res.code === 0) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '已确认' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  const stats = [
    { label: '今日预约', value: 24, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '待确认', value: appointments.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '已完成', value: appointments.filter(a => a.status === 'completed').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '未到店', value: appointments.filter(a => a.status === 'noshow').length, icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户姓名、电话..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-72"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
        <Link to="/field/appointments/create" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          新建预约
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveStatus(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">预约信息</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">客户</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">生活馆</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">服务类型</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((apt) => {
              const StatusIcon = statusConfig[apt.status].icon;
              return (
                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.appointmentDate}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.appointmentTime}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{apt.customerName}</p>
                      <p className="text-sm text-gray-500">{apt.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{apt.storeName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {apt.storeAddress?.slice(0, 10)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${serviceTypeConfig[apt.serviceType]?.color}`}>
                      {serviceTypeConfig[apt.serviceType]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[apt.status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[apt.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            取消
                          </button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'completed')}
                          className="px-3 py-1 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100"
                        >
                          完成
                        </button>
                      )}
                      <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        详情
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize)} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg">
              {page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
