import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Store,
  ShoppingBag,
  Sparkles,
  Plus,
  Thermometer,
  Building2,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import TicketCard from '@/components/TicketCard';
import PostCard from '@/components/PostCard';
import type { Ticket, Post, DashboardStats } from '@/types';

const mockStats: DashboardStats = {
  total_tickets: 23,
  pending_tickets: 8,
  completed_tickets: 12,
  total_residents: 1256,
  total_units: 292,
  occupied_units: 260,
  total_fee: 78500,
  paid_fee: 33150,
  unpaid_fee: 45350,
  tickets_by_status: [],
  tickets_by_type: [],
  recent_tickets: [],
};

const mockTickets: Ticket[] = [
  {
    id: 1,
    title: '电梯故障维修',
    description: '3号楼2单元电梯出现异响，需要维修人员检查处理',
    status: 'processing',
    priority: 'high',
    category: '设施维修',
    progress: 60,
    createdAt: '2024-01-15 09:30',
    updatedAt: '2024-01-15 14:00',
    assignee: '物业小王',
    reporter: '业主张三',
    buildingId: 3,
  },
  {
    id: 2,
    title: '楼道灯不亮',
    description: '5号楼1单元3楼楼道灯损坏，晚上出行不便',
    status: 'pending',
    priority: 'medium',
    category: '设施维修',
    progress: 0,
    createdAt: '2024-01-15 10:15',
    updatedAt: '2024-01-15 10:15',
    reporter: '业主李四',
    buildingId: 5,
  },
  {
    id: 3,
    title: '垃圾分类咨询',
    description: '想了解最新的垃圾分类政策和投放时间安排',
    status: 'completed',
    priority: 'low',
    category: '咨询服务',
    progress: 100,
    createdAt: '2024-01-14 15:00',
    updatedAt: '2024-01-14 16:30',
    assignee: '物业小李',
    reporter: '业主王五',
  },
];

const mockPosts: Post[] = [
  {
    id: 1,
    title: '周末社区亲子活动报名开始啦！',
    content: '各位邻居好！本周末（1月20日）下午2点，社区广场将举办亲子趣味运动会，有兴趣的邻居可以在物业处报名参加。活动项目包括：两人三足、运球接力、趣味投篮等，还有精美礼品等你来拿！',
    author: '社区活动中心',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=community',
    likes: 86,
    comments: 23,
    views: 156,
    isLiked: false,
    createdAt: '2024-01-15 08:00',
    category: '活动通知',
  },
  {
    id: 2,
    title: '寻人启事：谁家的小猫走丢了？',
    content: '今天早上在小区花园发现一只可爱的橘猫，看起来很亲人，应该是家养的。脖子上有蓝色项圈但没有联系方式。请失主尽快与我联系，或者到物业服务中心认领。',
    author: '热心邻居',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neighbor',
    likes: 45,
    comments: 12,
    views: 98,
    isLiked: true,
    createdAt: '2024-01-15 09:30',
    category: '互助求助',
    images: ['https://picsum.photos/seed/cat/400/300'],
  },
];

const quickActions = [
  { label: '创建工单', icon: Plus, path: '/tickets/create', color: 'primary' },
  { label: '发布帖子', icon: MessageSquare, path: '/posts/create', color: 'secondary' },
  { label: '发布闲置', icon: ShoppingBag, path: '/items/create', color: 'green' },
  { label: '费用缴纳', icon: CreditCard, path: '/fees', color: 'yellow' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">首页仪表盘</h1>
          <p className="text-gray-500 mt-1">社区运营数据概览</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建工单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总户数"
          value={mockStats.occupied_units}
          icon={Users}
          gradient="primary"
          change={2.5}
        />
        <StatCard
          title="待处理工单"
          value={mockStats.pending_tickets}
          icon={FileText}
          gradient="secondary"
          change={-15}
        />
        <StatCard
          title="总单元数"
          value={mockStats.total_units}
          icon={Store}
          gradient="green"
          change={8}
        />
        <StatCard
          title="闲置物品"
          value={0}
          icon={ShoppingBag}
          gradient="yellow"
          change={12}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card gradient-primary text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-semibold font-serif">AI 社区摘要</h3>
              </div>
              <p className="text-white/90 leading-relaxed">
                今日社区活跃度较高，共收到 {mockStats.total_tickets} 条工单，其中待处理 {mockStats.pending_tickets} 条，已完成 {mockStats.completed_tickets} 条。
                费用收缴率 {mockStats.total_fee > 0 ? Math.round((mockStats.paid_fee / mockStats.total_fee) * 100) : 0}%，
                小区总住户 {mockStats.occupied_units} 户，整体运营状况良好。
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Thermometer className="w-6 h-6" />
                <span className="text-4xl font-bold">{mockStats.total_fee > 0 ? Math.round((mockStats.paid_fee / mockStats.total_fee) * 100) : 0}%</span>
              </div>
              <p className="text-white/70 text-sm mt-1">费用收缴率</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">快捷入口</h3>
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
                <p className="font-medium text-gray-900 group-hover:text-primary-600">
                  {action.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 font-serif">最新工单</h3>
            <button
              onClick={() => navigate('/tickets')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-4">
            {mockTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 font-serif">热门动态</h3>
            <button
              onClick={() => navigate('/community')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-4">
            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
