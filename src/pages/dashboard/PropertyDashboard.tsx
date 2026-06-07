import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Users,
  Building2,
  KeyRound,
  CreditCard,
  MessageSquare,
  ArrowRight,
  Zap,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import TicketCard from '@/components/TicketCard';
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import type { Ticket, DashboardStats } from '@/types';

const normalizeTicket = (ticket: any): Ticket => ({
  ...ticket,
  category: ticket.category || ticket.type || '服务工单',
  reporter: ticket.reporter || ticket.reporter_name || ticket.contact_name || '居民',
  assignee: ticket.assignee || ticket.assignee_name,
  createdAt: ticket.createdAt || ticket.created_at || '',
  updatedAt: ticket.updatedAt || ticket.updated_at,
  progress:
    ticket.progress ??
    (ticket.status === 'completed' ? 100 : ticket.status === 'processing' ? 60 : ticket.status === 'assigned' ? 30 : 0),
});

const PropertyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        apiRequest.get<{ items: Ticket[]; total: number }>('/tickets?assignee_id=' + user?.id + '&page_size=5'),
        apiRequest.get<DashboardStats>('/dashboard/stats'),
      ]);
      if (ticketsRes.success && ticketsRes.data) {
        const payload = ticketsRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.items || [];
        setMyTickets(items.slice(0, 5).map(normalizeTicket));
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Load property dashboard failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: '我的工单', icon: FileText, path: '/tickets', color: 'primary', desc: '查看分派工单', badge: myTickets.length },
    { label: '创建工单', icon: Plus, path: '/tickets/create', color: 'secondary', desc: '登记新的工单' },
    { label: '门禁管理', icon: KeyRound, path: '/access', color: 'green', desc: '出入记录查询' },
    { label: '费用管理', icon: CreditCard, path: '/fees', color: 'yellow', desc: '费用收缴管理' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">
                物业管理员工作台
              </h1>
              <p className="text-gray-500">
                欢迎回来，{user?.name} · {user?.skills || '综合运维'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/tickets/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增工单
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="待处理"
          value={stats?.pending_tickets || 0}
          icon={Clock}
          gradient="yellow"
          suffix="单"
        />
        <StatCard
          title="已完成"
          value={stats?.completed_tickets || 0}
          icon={AlertTriangle}
          gradient="secondary"
          suffix="单"
        />
        <StatCard
          title="总住户"
          value={stats?.occupied_units || 0}
          icon={CheckCircle}
          gradient="green"
          suffix="户"
          change={12}
        />
        <StatCard
          title="我的工单"
          value={myTickets.length}
          icon={FileText}
          gradient="primary"
          suffix="单"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-semibold font-serif">AI 工作摘要</h3>
              </div>
              <p className="text-white/90 leading-relaxed text-sm">
                当前共有 <span className="font-bold">{stats?.pending_tickets || 0}</span> 个待处理工单，
                已完成 <span className="font-bold">{stats?.completed_tickets || 0}</span> 个工单，
                您有 <span className="font-bold">{myTickets.length}</span> 个分派工单待处理。
                小区总住户 <span className="font-bold">{stats?.occupied_units || 0}</span> 户，
                费用收缴率 <span className="font-bold">{stats && stats.total_fee > 0 ? Math.round((stats.paid_fee / stats.total_fee) * 100) : 0}%</span>，继续保持！
              </p>
            </div>
            <div className="text-right ml-6">
              <div className="flex items-center gap-2 justify-end">
                <TrendingUp className="w-6 h-6" />
                <span className="text-5xl font-bold">{stats && stats.total_fee > 0 ? Math.round((stats.paid_fee / stats.total_fee) * 100) : 0}%</span>
              </div>
              <p className="text-white/70 text-sm mt-1">费用收缴率</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">快捷操作</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group text-left relative"
              >
                {action.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    action.color === 'primary'
                      ? 'bg-primary-100 text-primary-600'
                      : action.color === 'secondary'
                      ? 'bg-secondary-100 text-secondary-600'
                      : action.color === 'green'
                      ? 'bg-accent-green-100 text-accent-green-600'
                      : 'bg-accent-yellow-100 text-accent-yellow-600'
                  } group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-900 group-hover:text-primary-600 text-sm">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 font-serif">我的待办工单</h3>
          </div>
          <button
            onClick={() => navigate('/tickets')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            全部工单 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {myTickets.length > 0 ? (
          <div className="space-y-4">
            {myTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-gray-700">太棒了！</p>
            <p className="text-sm">当前没有待处理的工单</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDashboard;
