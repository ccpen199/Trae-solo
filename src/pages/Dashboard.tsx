import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Home,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  PlusCircle,
  MapPin,
  Users,
} from 'lucide-react';
import api from '@/utils/api';
import useAuthStore from '@/stores/authStore';

interface DashboardStats {
  totalApplications: number;
  homesteadStock: number;
  pendingAnomalies: number;
  approvalRate: number;
}

interface TodoItem {
  id: number;
  title: string;
  type: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    homesteadStock: 0,
    pendingAnomalies: 0,
    approvalRate: 0,
  });
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    api.get('/api/reports/overview').then((res: any) => {
      const approvedCount = (res.appByStatus || []).find((s: any) => s.status === 'approved')?.count || 0;
      const totalApps = res.totalApplications || 0;
      setStats({
        totalApplications: totalApps,
        homesteadStock: res.totalParcels ?? 0,
        pendingAnomalies: res.pendingAnomalies ?? 0,
        approvalRate: totalApps > 0 ? Math.round((approvedCount / totalApps) * 1000) / 10 : 0,
      });
    }).catch(() => {
      setStats({ totalApplications: 0, homesteadStock: 0, pendingAnomalies: 0, approvalRate: 0 });
    });
    api.get('/api/applications?page=1&pageSize=5&status=submitted').then((res: any) => {
      setTodos(res.list ?? []);
    }).catch(() => {
      setTodos([
        { id: 1, title: '张三新建宅基地申请', type: 'new_build', createdAt: '2025-05-20' },
        { id: 2, title: '李四翻建申请', type: 'rebuild', createdAt: '2025-05-19' },
        { id: 3, title: '王五退出宅基地申请', type: 'exit', createdAt: '2025-05-18' },
      ]);
    });
  }, []);

  const statCards = [
    { label: '总申请数', value: stats.totalApplications, icon: <FileText size={24} />, color: 'bg-teal-700', textColor: 'text-teal-700' },
    { label: '宅基地存量', value: stats.homesteadStock, icon: <Home size={24} />, color: 'bg-amber-600', textColor: 'text-amber-600' },
    { label: '待处理异常', value: stats.pendingAnomalies, icon: <AlertTriangle size={24} />, color: 'bg-red-500', textColor: 'text-red-500' },
    { label: '审批通过率', value: `${stats.approvalRate}%`, icon: <CheckCircle size={24} />, color: 'bg-green-600', textColor: 'text-green-600' },
  ];

  const typeLabels: Record<string, string> = {
    new_build: '新建',
    rebuild: '翻建',
    expand: '扩建',
    exit: '退出',
    transfer: '流转',
  };

  const shortcuts = [
    { label: '提交申请', path: '/applications/new', icon: <PlusCircle size={20} /> },
    { label: '农户档案', path: '/households', icon: <Users size={20} /> },
    { label: '地块管理', path: '/parcels', icon: <MapPin size={20} /> },
    { label: '申请列表', path: '/applications', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">
        {user ? `${user.name}，欢迎回来` : '欢迎回来'}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{card.label}</span>
              <div className={`${card.color} text-white p-2 rounded-lg`}>{card.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${card.textColor}`}>{card.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-100 p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">待办事项</h2>
          {todos.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">暂无待办事项</p>
          ) : (
            <div className="space-y-3">
              {todos.map((item) => (
                <Link
                  key={item.id}
                  to={`/applications/${item.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {typeLabels[item.type] || item.type} · {item.createdAt}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded">待处理</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">快捷入口</h2>
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((s) => (
              <Link
                key={s.path}
                to={s.path}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-colors"
              >
                <span className="text-teal-700">{s.icon}</span>
                <span className="text-xs text-slate-600">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
