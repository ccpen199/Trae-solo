import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  Filter,
  ChevronDown,
  Send,
  MoreHorizontal,
  TrendingUp,
  Users,
  FileCheck,
  Clock as ClockIcon,
  AlertTriangle,
  X,
} from 'lucide-react';
import { api } from '@/api/client';
import type { ComplaintTicket, TicketStatus, TicketCategory, TicketPriority } from '../../../shared/types';
import { TICKET_STATUS_MAP, TICKET_CATEGORY_MAP } from '../../../shared/types';
import { cn } from '@/lib/utils';

const departments = [
  '南宁市交通运输局',
  '南宁市卫生健康委员会',
  '南宁市教育局',
  '南宁市行政审批局',
  '南宁市城市管理局',
];

export default function TicketDispatch() {
  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    urgent: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.urban.getTickets();
      const ticketList = Array.isArray(data) ? data : [];
      setTickets(ticketList);
      setStats({
        total: ticketList.length,
        pending: ticketList.filter(t => t.status === 'pending').length,
        processing: ticketList.filter(t => t.status === 'processing' || t.status === 'assigned').length,
        resolved: ticketList.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        urgent: ticketList.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
      });
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchSearch = ticket.title.includes(searchQuery) || ticket.content.includes(searchQuery) || ticket.ticketNo.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleAssign = () => {
    if (!selectedTicket || !assignDepartment) return;
    setTickets(prev => prev.map(t =>
      t.id === selectedTicket.id
        ? { ...t, status: 'assigned' as TicketStatus, department: assignDepartment, updatedAt: new Date().toISOString() }
        : t
    ));
    setShowAssignModal(false);
    setSelectedTicket(null);
    setAssignDepartment('');
    setAssignNote('');
  };

  const handleUpdateStatus = (ticket: ComplaintTicket, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(t =>
      t.id === ticket.id
        ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
        : t
    ));
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-red-100', text: 'text-red-600', label: '紧急' };
      case 'high': return { bg: 'bg-warm-100', text: 'text-warm-600', label: '高' };
      case 'medium': return { bg: 'bg-primary-100', text: 'text-primary-600', label: '中' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: '低' };
    }
  };

  const statCards = [
    { label: '工单总数', value: stats.total, icon: MessageSquare, color: 'from-primary-500 to-primary-600' },
    { label: '待分派', value: stats.pending, icon: Clock, color: 'from-warm-500 to-warm-600' },
    { label: '处理中', value: stats.processing, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '已解决', value: stats.resolved, icon: CheckCircle, color: 'from-eco-500 to-eco-600' },
    { label: '紧急工单', value: stats.urgent, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工单分拨调度中心</h1>
          <p className="text-gray-500 mt-1">12345诉求工单统一分派、调度、跟踪管理</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
            <FileCheck className="w-4 h-4" />
            导出报表
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all text-sm">
            <TrendingUp className="w-4 h-4" />
            调度统计
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索工单号、标题、内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="assigned">已分派</option>
                  <option value="processing">处理中</option>
                  <option value="resolved">已解决</option>
                  <option value="closed">已结案</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="appearance-none pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="all">全部类别</option>
                  <option value="transportation">交通出行</option>
                  <option value="medical">医疗健康</option>
                  <option value="education">教育服务</option>
                  <option value="government">政务服务</option>
                  <option value="urban_management">城市管理</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors text-sm">
                <Filter className="w-4 h-4" />
                筛选
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          ) : filteredTickets.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">工单信息</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">优先级</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">处理部门</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">截止时间</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => {
                  const statusInfo = TICKET_STATUS_MAP[ticket.status];
                  const priorityInfo = getPriorityColor(ticket.priority);
                  const categoryInfo = TICKET_CATEGORY_MAP[ticket.category];
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-xs">{ticket.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{ticket.ticketNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{categoryInfo?.name || ticket.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', priorityInfo.bg, priorityInfo.text)}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }}></span>
                          {statusInfo.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{ticket.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4" />
                          {new Date(ticket.deadline).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(ticket.status === 'pending' || ticket.status === 'assigned') && (
                            <button
                              onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true); setAssignDepartment(ticket.department); }}
                              className="px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              分派
                            </button>
                          )}
                          {ticket.status === 'processing' && (
                            <button
                              onClick={() => handleUpdateStatus(ticket, 'resolved')}
                              className="px-3 py-1.5 bg-eco-50 text-eco-600 text-xs font-medium rounded-lg hover:bg-eco-100 transition-colors"
                            >
                              办结
                            </button>
                          )}
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无工单记录</p>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">工单分派</h3>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedTicket(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-800 mb-1">{selectedTicket.title}</p>
                <p className="text-xs text-gray-500 font-mono">{selectedTicket.ticketNo}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{selectedTicket.content}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分派部门</label>
                <div className="relative">
                  <select
                    value={assignDepartment}
                    onChange={(e) => setAssignDepartment(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none"
                  >
                    <option value="">请选择处理部门</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分派备注</label>
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="请输入分派备注说明..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedTicket(null); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={!assignDepartment}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                确认分派
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
