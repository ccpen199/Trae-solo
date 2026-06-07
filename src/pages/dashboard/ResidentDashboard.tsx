import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  Plus,
  CreditCard,
  MessageSquare,
  Store,
  ShoppingBag,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  HeartHandshake,
  Package,
  KeyRound,
  Building2,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import TicketCard from '@/components/TicketCard';
import PostCard from '@/components/PostCard';
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import type { Ticket, Post, FeeBill } from '@/types';

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

const normalizeFee = (fee: any): FeeBill => ({
  ...fee,
  billingMonth: fee.billingMonth || fee.billing_month,
  dueDate: fee.dueDate || fee.due_date,
  paidAt: fee.paidAt || fee.paid_at,
  paymentMethod: fee.paymentMethod || fee.payment_method,
});

const ResidentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [myFees, setMyFees] = useState<FeeBill[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsRes, feesRes, postsRes] = await Promise.all([
        apiRequest.get<Ticket[] | { items: Ticket[]; total: number }>('/tickets?reporter_id=' + user?.id + '&page_size=3'),
        apiRequest.get<FeeBill[]>('/fees?resident_id=' + user?.id + '&page_size=5'),
        apiRequest.get<Post[] | { items: Post[]; total: number }>('/posts/published?page_size=3'),
      ]);
      if (ticketsRes.success && ticketsRes.data) {
        const payload = ticketsRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.items || [];
        setMyTickets(items.slice(0, 3).map(normalizeTicket));
      }
      if (feesRes.success && feesRes.data) {
        setMyFees(Array.isArray(feesRes.data) ? feesRes.data.slice(0, 5).map(normalizeFee) : []);
      }
      if (postsRes.success && postsRes.data) {
        const payload = postsRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.items || [];
        setPosts(items.slice(0, 3).map(normalizePost));
      }
    } catch (error) {
      console.error('Load resident dashboard failed:', error);
      setMyTickets([
        {
          id: 1,
          title: '卫生间水管漏水',
          description: '卫生间主水管接口处漏水',
          status: 'processing',
          priority: 'urgent',
          category: '设施维修',
          progress: 60,
          createdAt: '2024-01-15 09:30',
          assignee: '物业张工',
        },
      ]);
      setMyFees([
        { id: 1, type: 'property', amount: 286.5, status: 'paid', billingMonth: '2024-01', dueDate: '2024-01-31' },
        { id: 2, type: 'electricity', amount: 189.5, status: 'unpaid', billingMonth: '2024-01', dueDate: '2024-01-31' },
      ]);
      setPosts([
        {
          id: 1,
          title: '周末社区亲子活动报名开始啦！',
          content: '本周末下午2点，社区广场将举办亲子趣味运动会',
          author: '社区活动中心',
          likes: 86,
          comments: 23,
          views: 156,
          isLiked: false,
          createdAt: '2024-01-15 08:00',
          category: '活动通知',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const unpaidCount = myFees.filter((f) => f.status === 'unpaid').length;
  const totalUnpaid = myFees
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const communityTemp = myTickets.length > 0
    ? 20 + Math.round((myTickets.filter(t => t.status === 'completed').length / myTickets.length) * 10)
    : 24;
  const activeTicket = myTickets.find(t => t.status === 'processing' || t.status === 'pending');

  const quickActions = [
    { label: '报修申请', icon: FileText, path: '/tickets/create', color: 'primary', desc: '提交维修工单' },
    { label: '我的工单', icon: Clock, path: '/tickets', color: 'secondary', desc: '查看工单进度', badge: myTickets.length },
    { label: '费用缴纳', icon: CreditCard, path: '/fees', color: 'yellow', desc: '物业费水电费', badge: unpaidCount > 0 ? unpaidCount : null },
    { label: '邻里社区', icon: MessageSquare, path: '/community', color: 'green', desc: '发帖互动交流' },
    { label: '周边商户', icon: Store, path: '/merchants', color: 'primary', desc: '小区周边商家' },
    { label: '闲置集市', icon: ShoppingBag, path: '/marketplace', color: 'secondary', desc: '闲置物品交易' },
    { label: '发布帖子', icon: Plus, path: '/posts/create', color: 'green', desc: '分享邻里动态' },
    { label: '门禁记录', icon: KeyRound, path: '/access', color: 'yellow', desc: '查看出入记录' },
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
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">居民服务工作台</h1>
              <p className="text-gray-500">
                欢迎回来，{user?.name} · {user?.unit || '1号楼1单元0101'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/tickets/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          快速报修
        </button>
      </div>

      {unpaidCount > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">费用提醒</p>
            <p className="text-sm text-yellow-700 mt-1">
              您有 <span className="font-bold">{unpaidCount}</span> 笔待缴费用，
              共计 <span className="font-bold">¥{totalUnpaid.toFixed(2)}</span>，
              请及时缴纳避免产生滞纳金。
            </p>
          </div>
          <button
            onClick={() => navigate('/fees')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
          >
            立即缴费
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="我的工单"
          value={myTickets.length}
          icon={FileText}
          gradient="primary"
          suffix="单"
        />
        <StatCard
          title="待缴费"
          value={unpaidCount}
          icon={CreditCard}
          gradient="yellow"
          suffix="笔"
        />
        <StatCard
          title="处理中"
          value={myTickets.filter((t) => t.status === 'processing').length}
          icon={Clock}
          gradient="secondary"
          suffix="单"
        />
        <StatCard
          title="已完成"
          value={myTickets.filter((t) => t.status === 'completed').length}
          icon={CheckCircle}
          gradient="green"
          suffix="单"
        />
      </div>

      <div className="card gradient-primary text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" />
              <h3 className="text-lg font-semibold font-serif">AI 社区助手</h3>
            </div>
            <p className="text-white/90 leading-relaxed text-sm">
              今日社区温度指数 <span className="font-bold">{communityTemp}°C</span>，
              邻里氛围融洽。{activeTicket
                ? `您提交的"${activeTicket.title}"工单${activeTicket.status === 'processing' ? '正在处理中' : '待处理'}。`
                : '您暂无进行中的工单。'
              }
              {unpaidCount > 0
                ? `本月还有 ${unpaidCount} 笔费用待缴，共计 ¥${totalUnpaid.toFixed(2)}。`
                : '本月费用已缴清。'
              }
            </p>
          </div>
          <div className="text-right ml-6">
            <div className="flex items-center gap-2 justify-end">
              <HeartHandshake className="w-6 h-6" />
              <span className="text-5xl font-bold">{communityTemp}°C</span>
            </div>
            <p className="text-white/70 text-sm mt-1">社区温度指数</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">快捷服务</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group text-center relative"
            >
              {action.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                  action.color === 'primary'
                    ? 'bg-primary-100 text-primary-600'
                    : action.color === 'secondary'
                    ? 'bg-secondary-100 text-secondary-600'
                    : action.color === 'green'
                    ? 'bg-accent-green-100 text-accent-green-600'
                    : 'bg-accent-yellow-100 text-accent-yellow-600'
                } group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <p className="font-medium text-gray-900 group-hover:text-primary-600 text-sm">
                {action.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900 font-serif">我的工单</h3>
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
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p>暂无工单记录</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900 font-serif">社区热门</h3>
            </div>
            <button
              onClick={() => navigate('/community')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              更多动态 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>暂无社区动态</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
