import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2 } from 'lucide-react';
import TicketCard from '@/components/TicketCard';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/utils/api';
import type { Ticket } from '@/types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: '设施维修', label: '设施维修' },
  { value: '咨询服务', label: '咨询服务' },
  { value: '物业服务', label: '物业服务' },
  { value: '投诉建议', label: '投诉建议' },
];

type ScopeTab = 'mine' | 'all';

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

const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scope, setScope] = useState<ScopeTab>(() => {
    if (!user) return 'all';
    return user.role === 'resident' ? 'mine' : 'all';
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/tickets';
      if (scope === 'mine' && user) {
        if (user.role === 'resident') {
          url += `?reporter_id=${user.id}`;
        } else {
          url += `?assignee_id=${user.id}`;
        }
      }
      const response = await apiRequest.get<{ items: Ticket[]; total: number }>(url);
      if (response.success) {
        const payload = response.data as any;
        const items = Array.isArray(payload) ? payload : payload?.items || [];
        setTickets(items.map(normalizeTicket));
      }
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [scope, user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch = ticket.title.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || ticket.category === categoryFilter || ticket.type === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    processing: tickets.filter((t) => t.status === 'processing').length,
    completed: tickets.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">工单管理</h1>
          <p className="text-gray-500 mt-1">查看和处理所有工单</p>
        </div>
        <button
          onClick={() => navigate('/tickets/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          创建工单
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setScope('mine')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scope === 'mine'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          我的工单
        </button>
        <button
          onClick={() => setScope('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scope === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部工单
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">全部工单</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">待处理</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.processing}</p>
          <p className="text-sm text-gray-500">处理中</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">已完成</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input pl-10"
            placeholder="搜索工单标题或描述..."
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              />
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">暂无符合条件的工单</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TicketList;
