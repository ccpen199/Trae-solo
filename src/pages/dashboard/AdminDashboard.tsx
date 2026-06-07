import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  FileText,
  Store,
  ShoppingBag,
  Thermometer,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  BarChart3,
  MessageSquare,
  Bell,
  ArrowRight,
  Zap,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { apiRequest } from '@/utils/api';
import type { DashboardStats, Ticket, Post } from '@/types';

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

const normalizePost = (post: any): Post => ({
  ...post,
  author: post.author || post.author_name || '社区管理处',
  authorAvatar: post.authorAvatar || post.author_avatar,
  likes: post.likes ?? post.likes_count ?? Math.max(post.views || 0, 0),
  comments: post.comments ?? post.comments_count ?? 0,
  isLiked: post.isLiked ?? false,
  createdAt: post.createdAt || post.created_at || '',
  category: post.category || 'notice',
});

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboardRes, ticketsRes, postsRes] = await Promise.all([
        apiRequest.get<DashboardStats>('/dashboard/stats'),
        apiRequest.get<{ items: Ticket[]; total: number }>('/tickets?page_size=5'),
        apiRequest.get<Post[] | { items: Post[]; total: number }>('/posts?page_size=3'),
      ]);
      if (dashboardRes.success && dashboardRes.data) {
        setStats(dashboardRes.data);
      }
      if (ticketsRes.success && ticketsRes.data) {
        const payload = ticketsRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.items || [];
        setTickets(items.slice(0, 5).map(normalizeTicket));
      }
      if (postsRes.success && postsRes.data) {
        const payload = postsRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.items || [];
        setPosts(items.slice(0, 3).map(normalizePost));
      }
    } catch (error) {
      console.error('Load admin dashboard failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: '楼栋管理', icon: Building2, path: '/buildings', color: 'primary', desc: '管理小区楼栋单元' },
    { label: '工单管理', icon: FileText, path: '/tickets', color: 'secondary', desc: '查看处理所有工单' },
    { label: '商户审核', icon: Store, path: '/merchants', color: 'green', desc: '商户入驻审核管理' },
    { label: '社区温度', icon: Thermometer, path: '/metrics', color: 'yellow', desc: '社区运营数据看板' },
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
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">系统管理员工作台</h1>
              <p className="text-gray-500">全局运营监控与系统管理</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            系统运行正常
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="小区总户数"
          value={stats?.occupied_units || 0}
          icon={Users}
          gradient="primary"
          suffix="户"
          change={2.5}
        />
        <StatCard
          title="待处理工单"
          value={stats?.pending_tickets || 0}
          icon={AlertTriangle}
          gradient="secondary"
          suffix="单"
          change={-15}
        />
        <StatCard
          title="总户数/单元"
          value={stats?.total_units || 0}
          icon={Store}
          gradient="green"
          suffix="户"
          change={8}
        />
        <StatCard
          title="缴费率"
          value={stats && stats.total_fee > 0 ? Math.round((stats.paid_fee / stats.total_fee) * 100) : 0}
          icon={Thermometer}
          gradient="yellow"
          suffix="%"
          change={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card gradient-primary text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-semibold font-serif">AI 运营摘要</h3>
              </div>
              <p className="text-white/90 leading-relaxed text-sm">
                今日社区整体运营状况良好，共收到 <span className="font-bold">{stats?.total_tickets || 0}</span> 条工单，
                其中待处理 <span className="font-bold">{stats?.pending_tickets || 0}</span> 条，
                已完成 <span className="font-bold">{stats?.completed_tickets || 0}</span> 条。
                小区总住户 <span className="font-bold">{stats?.occupied_units || 0}</span> 户，
                费用收缴率 <span className="font-bold">{stats && stats.total_fee > 0 ? Math.round((stats.paid_fee / stats.total_fee) * 100) : 0}%</span>。
                待收费用 <span className="font-bold">¥{stats?.unpaid_fee?.toFixed(1) || '0.0'}</span>，
                已收费用 <span className="font-bold">¥{stats?.paid_fee?.toFixed(1) || '0.0'}</span>。
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">快捷管理</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group text-left"
              >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900 font-serif">最新工单</h3>
            </div>
            <button
              onClick={() => navigate('/tickets')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              全部工单 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ticket.reporter_name || ticket.reporter || '未知'} · {ticket.createdAt}
                    </p>
                  </div>
                  <div className="ml-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : ticket.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {ticket.status === 'pending'
                        ? '待处理'
                        : ticket.status === 'processing'
                        ? '处理中'
                        : '已完成'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>暂无工单数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900 font-serif">社区动态</h3>
            </div>
            <button
              onClick={() => navigate('/community')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              全部动态 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-gray-900">{post.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{post.author}</span>
                    <span>👍 {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>暂无社区动态</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
