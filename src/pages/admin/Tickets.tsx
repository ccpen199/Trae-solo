import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Ticket,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { api } from '@/utils/api';

interface TicketItem {
  id: number;
  title: string;
  type: string;
  status: 'pending' | 'assigned' | 'resolved';
  content: string;
  street?: string;
  user_name?: string;
  user_phone?: string;
  assigned_to?: string | null;
  reply?: string | null;
  created_at: string;
}

interface RouteRule {
  id: number;
  street?: string;
  department: string;
  complaint_type?: string;
  pattern?: string;
  priority: number;
  created_at?: string;
}

const fallbackTickets: TicketItem[] = [
  {
    id: 1,
    title: '道路积水影响出行',
    type: '市政设施',
    status: 'pending',
    content: '雨后路口积水较深，影响居民通行。',
    street: '鼓楼区',
    user_name: '张三',
    user_phone: '138****1234',
    created_at: '2026-06-05 09:30',
  },
  {
    id: 2,
    title: '夜间施工噪音扰民',
    type: '噪音扰民',
    status: 'assigned',
    content: '小区附近夜间施工噪音明显。',
    street: '玄武区',
    user_name: '李四',
    user_phone: '139****5678',
    assigned_to: '城管局',
    created_at: '2026-06-04 21:10',
  },
];

const fallbackRules: RouteRule[] = [
  { id: 1, street: '鼓楼区', department: '市政设施处', complaint_type: '市政设施', priority: 5 },
  { id: 2, street: '玄武区', department: '综合执法局', complaint_type: '噪音扰民', priority: 4 },
];

const statusConfig = {
  pending: { label: '待分拨', color: 'bg-yellow-50 text-yellow-600', icon: Clock },
  assigned: { label: '处理中', color: 'bg-blue-50 text-blue-600', icon: UserPlus },
  resolved: { label: '已解决', color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
};

function normalizeTicket(raw: any): TicketItem {
  const status: TicketItem['status'] =
    raw.status === 'resolved' ? 'resolved' : raw.status === 'assigned' || raw.assigned_to ? 'assigned' : 'pending';
  return {
    id: raw.id,
    title: raw.title || raw.subject || `${raw.type || '市民诉求'} #${raw.id}`,
    type: raw.type || raw.complaint_type || '其他',
    status,
    content: raw.content || raw.description || '',
    street: raw.street,
    user_name: raw.user_name || raw.name,
    user_phone: raw.user_phone || raw.phone,
    assigned_to: raw.assigned_to,
    reply: raw.reply,
    created_at: raw.created_at || '',
  };
}

export default function AdminTickets() {
  const [tab, setTab] = useState<'tickets' | 'rules'>('tickets');
  const [tickets, setTickets] = useState<TicketItem[]>(fallbackTickets);
  const [rules, setRules] = useState<RouteRule[]>(fallbackRules);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | TicketItem['status']>('all');
  const [replyTicket, setReplyTicket] = useState<TicketItem | null>(null);
  const [reply, setReply] = useState('');
  const [newRule, setNewRule] = useState({ street: '', department: '', complaint_type: '', priority: 1 });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/admin/tickets');
      setTickets(Array.isArray(data) && data.length > 0 ? data.map(normalizeTicket) : fallbackTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets(fallbackTickets);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const data = await api.get<RouteRule[]>('/admin/tickets/routes');
      setRules(Array.isArray(data) && data.length > 0 ? data : fallbackRules);
    } catch (error) {
      console.error('Failed to load ticket routes:', error);
      setRules(fallbackRules);
    }
  };

  useEffect(() => {
    loadTickets();
    loadRules();
  }, []);

  const filteredTickets = useMemo(() => {
    const key = query.trim();
    return tickets.filter((item) => {
      const matchesText =
        !key ||
        item.title.includes(key) ||
        item.content.includes(key) ||
        String(item.street || '').includes(key) ||
        String(item.user_name || '').includes(key);
      const matchesStatus = status === 'all' || item.status === status;
      return matchesText && matchesStatus;
    });
  }, [tickets, query, status]);

  const stats = {
    pending: tickets.filter((item) => item.status === 'pending').length,
    assigned: tickets.filter((item) => item.status === 'assigned').length,
    resolved: tickets.filter((item) => item.status === 'resolved').length,
    total: tickets.length,
  };

  const updateTicket = async (ticket: TicketItem, nextStatus: TicketItem['status'], nextReply?: string) => {
    try {
      await api.put(`/admin/tickets/${ticket.id}`, {
        status: nextStatus,
        assigned_to: nextStatus === 'assigned' ? ticket.assigned_to || '综合受理岗' : ticket.assigned_to,
        reply: nextReply,
      });
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
    setTickets((prev) =>
      prev.map((item) =>
        item.id === ticket.id
          ? {
              ...item,
              status: nextStatus,
              assigned_to: nextStatus === 'assigned' ? item.assigned_to || '综合受理岗' : item.assigned_to,
              reply: nextReply || item.reply,
            }
          : item,
      ),
    );
    setReplyTicket(null);
    setReply('');
  };

  const addRule = async () => {
    if (!newRule.department || !newRule.complaint_type) return;
    try {
      const data = await api.post<{ id: number }>('/admin/tickets/routes', newRule);
      setRules((prev) => [{ ...newRule, id: data?.id || Date.now() }, ...prev]);
    } catch (error) {
      console.error('Failed to add ticket route:', error);
      setRules((prev) => [{ ...newRule, id: Date.now() }, ...prev]);
    }
    setNewRule({ street: '', department: '', complaint_type: '', priority: 1 });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif-cn text-xl font-bold text-warm-800 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            工单分拨
          </h1>
          <p className="text-sm text-warm-500 mt-1">市民诉求接收、分派、回复和路由规则维护</p>
        </div>
        <button
          onClick={loadTickets}
          className="px-4 py-2 border border-warm-200 rounded-md text-sm hover:bg-warm-50 flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '全部工单', value: stats.total, icon: Ticket, color: 'text-primary' },
          { label: '待分拨', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
          { label: '处理中', value: stats.assigned, icon: UserPlus, color: 'text-blue-600' },
          { label: '已解决', value: stats.resolved, icon: CheckCircle2, color: 'text-green-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warm-500">{item.label}</p>
                  <p className="text-2xl font-bold text-warm-800 mt-1">{item.value}</p>
                </div>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setTab('tickets')}
          className={`px-5 py-2 rounded-md text-sm font-medium ${
            tab === 'tickets' ? 'bg-primary text-white' : 'bg-white text-warm-600 hover:bg-warm-100'
          }`}
        >
          工单列表
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`px-5 py-2 rounded-md text-sm font-medium ${
            tab === 'rules' ? 'bg-primary text-white' : 'bg-white text-warm-600 hover:bg-warm-100'
          }`}
        >
          路由规则
        </button>
      </div>

      {tab === 'tickets' ? (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] h-10 px-3 border border-warm-200 rounded-md">
              <Search className="w-4 h-4 text-warm-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、内容、市民或街道"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">全部状态</option>
              <option value="pending">待分拨</option>
              <option value="assigned">处理中</option>
              <option value="resolved">已解决</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center text-warm-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                加载工单中...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center text-warm-500">暂无工单</div>
            ) : (
              filteredTickets.map((item) => {
                const cfg = statusConfig[item.status];
                const Icon = cfg.icon;
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-warm-800">{item.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-warm-600 mb-3">{item.content || '暂无描述'}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-warm-500">
                          <span className="bg-warm-100 px-2 py-1 rounded">{item.type}</span>
                          <span className="bg-warm-100 px-2 py-1 rounded">{item.street || '未填街道'}</span>
                          <span className="bg-warm-100 px-2 py-1 rounded">{item.user_name || '匿名市民'}</span>
                          <span>{item.created_at}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => updateTicket(item, 'assigned')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-md hover:bg-blue-100 flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            分拨
                          </button>
                        )}
                        {item.status !== 'resolved' && (
                          <button
                            onClick={() => setReplyTicket(item)}
                            className="px-3 py-1.5 bg-green-50 text-green-600 text-xs rounded-md hover:bg-green-100 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            回复结单
                          </button>
                        )}
                      </div>
                    </div>
                    {item.reply && (
                      <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                        处理回复：{item.reply}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="grid md:grid-cols-5 gap-3 mb-5">
            <input
              value={newRule.street}
              onChange={(event) => setNewRule((prev) => ({ ...prev, street: event.target.value }))}
              placeholder="街道"
              className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={newRule.complaint_type}
              onChange={(event) => setNewRule((prev) => ({ ...prev, complaint_type: event.target.value }))}
              placeholder="诉求类型"
              className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={newRule.department}
              onChange={(event) => setNewRule((prev) => ({ ...prev, department: event.target.value }))}
              placeholder="分拨部门"
              className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              value={newRule.priority}
              onChange={(event) => setNewRule((prev) => ({ ...prev, priority: Number(event.target.value) }))}
              className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addRule}
              className="h-10 bg-primary text-white rounded-md text-sm hover:bg-primary-light flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加规则
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50 border-b border-warm-200">
                <th className="text-left py-3 px-4 text-warm-600 font-medium">街道</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">类型</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">部门</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">优先级</th>
                <th className="text-right py-3 px-4 text-warm-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-warm-50">
                  <td className="py-3 px-4">{rule.street || '-'}</td>
                  <td className="py-3 px-4">{rule.complaint_type || rule.pattern || '-'}</td>
                  <td className="py-3 px-4 font-medium text-warm-800">{rule.department}</td>
                  <td className="py-3 px-4">{rule.priority}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setRules((prev) => prev.filter((item) => item.id !== rule.id))}
                      className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                      移除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {replyTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-warm-800">回复并结单</h3>
              <button onClick={() => setReplyTicket(null)} className="text-warm-400 hover:text-warm-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 rounded-md bg-warm-50 p-3 text-sm text-warm-600">
              <div className="font-medium text-warm-800 mb-1">{replyTicket.title}</div>
              {replyTicket.content}
            </div>
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="填写处理结果"
              className="w-full min-h-28 p-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setReplyTicket(null)}
                className="px-4 py-2 border border-warm-200 rounded-md text-sm hover:bg-warm-50"
              >
                取消
              </button>
              <button
                onClick={() => updateTicket(replyTicket, 'resolved', reply || '已处理完成')}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                确认结单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
