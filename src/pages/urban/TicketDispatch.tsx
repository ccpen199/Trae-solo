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
  Plus,
  Settings,
  Inbox,
  BarChart3,
  Timer,
  Star,
  Zap,
  Share2,
  Wrench,
  Brain,
  List,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { api } from '@/api/client';
import type {
  ComplaintTicket,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  DispatchRule,
  DispatchRuleType,
  DepartmentStats,
  DepartmentReceipt,
  TicketLog,
} from '../../../shared/types';
import {
  TICKET_STATUS_MAP,
  TICKET_CATEGORY_MAP,
  DISPATCH_RULE_TYPE_MAP,
  TICKET_ACTION_MAP,
} from '../../../shared/types';
import { cn } from '@/lib/utils';

type TabType = 'list' | 'rules' | 'department';

const departments = [
  '南宁市交通运输局',
  '南宁市卫生健康委员会',
  '南宁市教育局',
  '南宁市行政审批局',
  '南宁市城市管理局',
  '南宁市应急管理局',
  '南宁市12345热线中心',
];

const allDepartments = [
  '南宁市交通运输局',
  '南宁市卫生健康委员会',
  '南宁市教育局',
  '南宁市行政审批局',
  '南宁市城市管理局',
];

export default function TicketDispatch() {
  const [activeTab, setActiveTab] = useState<TabType>('list');

  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [ticketDetail, setTicketDetail] = useState<ComplaintTicket | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const [rules, setRules] = useState<DispatchRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<DispatchRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'keyword' as DispatchRuleType,
    conditionValue: '',
    conditionOperator: 'contains',
    department: '',
    ccDepartments: [] as string[],
    priority: 'medium' as TicketPriority,
    description: '',
    isEnabled: true,
  });

  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [departmentReceipts, setDepartmentReceipts] = useState<DepartmentReceipt[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    urgent: 0,
  });

  useEffect(() => {
    loadTickets();
    loadRules();
    loadDepartmentData();
  }, []);

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
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
      setTicketsLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      setRulesLoading(true);
      const data = await api.urban.getDispatchRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setRulesLoading(false);
    }
  };

  const loadDepartmentData = async () => {
    try {
      setDepartmentLoading(true);
      const [statsData, receiptsData] = await Promise.all([
        api.urban.getDepartmentStats(),
        api.urban.getDepartmentReceipts(),
      ]);
      setDepartmentStats(Array.isArray(statsData) ? statsData : []);
      setDepartmentReceipts(Array.isArray(receiptsData) ? receiptsData : []);
    } catch (e) {
      console.error('Failed to load department data:', e);
    } finally {
      setDepartmentLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchSearch = ticket.title.includes(searchQuery) || ticket.content.includes(searchQuery) || ticket.ticketNo.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const filteredReceipts = departmentReceipts.filter(receipt => {
    return selectedDept === 'all' || receipt.department === selectedDept;
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

  const handleViewDetail = async (ticket: ComplaintTicket) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      setTicketDetail(ticket);
      const data = await api.urban.getTicketDetail(ticket.id);
      if (data) {
        setTicketDetail(data);
      }
    } catch (e) {
      console.error('Failed to load ticket detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isEnabled: boolean) => {
    try {
      await api.urban.toggleDispatchRule(ruleId, isEnabled);
      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, isEnabled } : r
      ));
    } catch (e) {
      console.error('Failed to toggle rule:', e);
    }
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name || !ruleForm.conditionValue || !ruleForm.department) return;

    const ruleData = {
      name: ruleForm.name,
      type: ruleForm.type,
      condition: {
        type: ruleForm.type,
        value: ruleForm.conditionValue,
        operator: ruleForm.conditionOperator,
      },
      department: ruleForm.department,
      ccDepartments: ruleForm.ccDepartments,
      priority: ruleForm.priority,
      description: ruleForm.description,
      isEnabled: ruleForm.isEnabled,
    };

    try {
      if (editingRule) {
        await api.urban.updateDispatchRule(editingRule.id, ruleData);
      } else {
        await api.urban.createDispatchRule(ruleData);
      }
      await loadRules();
      setShowRuleModal(false);
      resetRuleForm();
    } catch (e) {
      console.error('Failed to save rule:', e);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.urban.deleteDispatchRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (e) {
      console.error('Failed to delete rule:', e);
    }
  };

  const handleEditRule = (rule: DispatchRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      type: rule.type,
      conditionValue: rule.condition.value,
      conditionOperator: rule.condition.operator || 'contains',
      department: rule.department,
      ccDepartments: rule.ccDepartments || [],
      priority: rule.priority,
      description: rule.description || '',
      isEnabled: rule.isEnabled,
    });
    setShowRuleModal(true);
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      type: 'keyword',
      conditionValue: '',
      conditionOperator: 'contains',
      department: '',
      ccDepartments: [],
      priority: 'medium',
      description: '',
      isEnabled: true,
    });
    setEditingRule(null);
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-red-100', text: 'text-red-600', label: '紧急' };
      case 'high': return { bg: 'bg-warm-100', text: 'text-warm-600', label: '高' };
      case 'medium': return { bg: 'bg-primary-100', text: 'text-primary-600', label: '中' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: '低' };
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, any> = {
      submit: Send,
      classify: Brain,
      assign: Share2,
      receive: Inbox,
      process: Wrench,
      resolve: CheckCircle,
      rate: Star,
    };
    return iconMap[action] || MessageSquare;
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('zh-CN');
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortedStats = [...departmentStats].sort((a, b) => b.resolutionRate - a.resolutionRate);

  const statCards = [
    { label: '工单总数', value: stats.total, icon: MessageSquare, color: 'from-primary-500 to-primary-600' },
    { label: '待分派', value: stats.pending, icon: Clock, color: 'from-warm-500 to-warm-600' },
    { label: '处理中', value: stats.processing, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '已解决', value: stats.resolved, icon: CheckCircle, color: 'from-eco-500 to-eco-600' },
    { label: '紧急工单', value: stats.urgent, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ];

  const tabs = [
    { id: 'list' as TabType, label: '工单列表', icon: List },
    { id: 'rules' as TabType, label: '派发规则', icon: Settings },
    { id: 'department' as TabType, label: '部门接收', icon: Building2 },
  ];

  const departmentStatCards = (dept: DepartmentStats) => [
    { label: '待处理', value: dept.pending, icon: Clock, color: 'bg-warm-50 text-warm-600' },
    { label: '处理中', value: dept.processing, icon: Wrench, color: 'bg-blue-50 text-blue-600' },
    { label: '已办结', value: dept.resolved, icon: CheckCircle, color: 'bg-eco-50 text-eco-600' },
    { label: '超时预警', value: dept.overdue, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
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
        <div className="border-b border-gray-100">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'text-primary-600 border-primary-500 bg-primary-50/50'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'list' && (
          <>
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
              {ticketsLoading ? (
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
                              {formatDate(ticket.deadline)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewDetail(ticket)}
                                className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                详情
                              </button>
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
          </>
        )}

        {activeTab === 'rules' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">派发规则管理</h3>
                <p className="text-sm text-gray-500 mt-1">配置工单自动分派规则，提高处理效率</p>
              </div>
              <button
                onClick={() => { resetRuleForm(); setShowRuleModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                新建规则
              </button>
            </div>

            {rulesLoading ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>加载中...</p>
              </div>
            ) : rules.length > 0 ? (
              <div className="space-y-4">
                {rules.map((rule) => {
                  const typeInfo = DISPATCH_RULE_TYPE_MAP[rule.type];
                  const priorityInfo = getPriorityColor(rule.priority);
                  return (
                    <div key={rule.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-800">{rule.name}</h4>
                            <span
                              className="px-2 py-0.5 text-xs font-medium rounded-full"
                              style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}
                            >
                              {typeInfo.name}
                            </span>
                            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', priorityInfo.bg, priorityInfo.text)}>
                              {priorityInfo.label}优先级
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Zap className="w-4 h-4 text-warm-500" />
                              <span>触发条件：</span>
                              <span className="font-medium">
                                {rule.type === 'keyword' && `包含关键词「${rule.condition.value}」`}
                                {rule.type === 'category' && `类别为「${TICKET_CATEGORY_MAP[rule.condition.value as TicketCategory]?.name || rule.condition.value}」`}
                                {rule.type === 'time' && `时间在 ${rule.condition.value}`}
                                {rule.type === 'priority' && `紧急程度为「${getPriorityColor(rule.condition.value as TicketPriority).label}」`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Share2 className="w-4 h-4 text-blue-500" />
                              <span>分派至：</span>
                              <span className="font-medium">{rule.department}</span>
                            </div>
                            {rule.ccDepartments && rule.ccDepartments.length > 0 && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Users className="w-4 h-4 text-purple-500" />
                                <span>抄送：</span>
                                <span className="font-medium">{rule.ccDepartments.join('、')}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-3">
                            创建于 {formatDate(rule.createdAt)} · 更新于 {formatDate(rule.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rule.isEnabled}
                              onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">暂无派发规则</p>
                <p className="text-sm text-gray-400">点击「新建规则」创建自动分派规则</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'department' && (
          <div className="p-5 space-y-6">
            {departmentLoading ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>加载中...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">部门工单统计</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {departmentStats.map((dept) => (
                      <div key={dept.departmentId} className="border border-gray-200 rounded-xl p-5 hover:border-primary-200 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm">{dept.departmentName}</h4>
                              <p className="text-xs text-gray-500">总工单 {dept.total} 件</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {departmentStatCards(dept).map((stat) => {
                            const Icon = stat.icon;
                            return (
                              <div key={stat.label} className={cn('rounded-lg p-3 text-center', stat.color)}>
                                <Icon className="w-4 h-4 mx-auto mb-1" />
                                <p className="text-lg font-bold">{stat.value}</p>
                                <p className="text-xs">{stat.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">部门处理效率排名</h3>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4">
                      <div>排名</div>
                      <div>部门</div>
                      <div className="text-center">平均处理时长</div>
                      <div className="text-center">办结率</div>
                      <div className="text-center">满意度</div>
                    </div>
                    <div className="space-y-2">
                      {sortedStats.map((dept, index) => (
                        <div key={dept.departmentId} className="grid grid-cols-5 gap-4 items-center bg-white rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                              index === 0 ? 'bg-yellow-100 text-yellow-600' :
                              index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-gray-50 text-gray-500'
                            )}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="font-medium text-gray-800 text-sm">{dept.departmentName}</div>
                          <div className="text-center">
                            <span className="text-gray-800 font-medium">{dept.avgProcessTime}</span>
                            <span className="text-gray-500 text-xs ml-1">小时</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {dept.resolutionRate >= 90 ? (
                                <ArrowUpRight className="w-4 h-4 text-eco-500" />
                              ) : dept.resolutionRate >= 85 ? (
                                <ArrowDownRight className="w-4 h-4 text-warm-500" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-red-500" />
                              )}
                              <span className={cn(
                                'font-medium',
                                dept.resolutionRate >= 90 ? 'text-eco-600' :
                                dept.resolutionRate >= 85 ? 'text-warm-600' : 'text-red-600'
                              )}>
                                {dept.resolutionRate}%
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-medium text-gray-800">{dept.satisfactionRate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">部门接收回执</h3>
                    <div className="relative">
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      >
                        <option value="all">全部部门</option>
                        {allDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {filteredReceipts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">工单号</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">工单标题</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">接收部门</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">处理人</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">接收时间</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">预计完成</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">当前状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredReceipts.map((receipt) => {
                            const statusInfo = TICKET_STATUS_MAP[receipt.status];
                            return (
                              <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="text-sm font-mono text-gray-600">{receipt.ticketNo}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-gray-800 font-medium truncate max-w-xs">{receipt.ticketTitle}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-gray-600">{receipt.department}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                                      <User className="w-3.5 h-3.5 text-primary-600" />
                                    </div>
                                    <span className="text-sm text-gray-700">{receipt.receiver}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {formatDateTime(receipt.receivedAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Timer className="w-4 h-4 text-gray-400" />
                                    {formatDate(receipt.estimatedFinishAt)}
                                  </div>
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">暂无部门接收记录</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
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

      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingRule ? '编辑规则' : '新建规则'}
              </h3>
              <button
                onClick={() => { setShowRuleModal(false); resetRuleForm(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">规则名称 *</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入规则名称"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">规则类型 *</label>
                  <div className="relative">
                    <select
                      value={ruleForm.type}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, type: e.target.value as DispatchRuleType }))}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none"
                    >
                      <option value="keyword">关键词匹配</option>
                      <option value="category">类别匹配</option>
                      <option value="time">时间规则</option>
                      <option value="priority">紧急程度</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">优先级 *</label>
                  <div className="relative">
                    <select
                      value={ruleForm.priority}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, priority: e.target.value as TicketPriority }))}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ruleForm.type === 'keyword' && '关键词 *'}
                  {ruleForm.type === 'category' && '工单类别 *'}
                  {ruleForm.type === 'time' && '时间范围 *'}
                  {ruleForm.type === 'priority' && '紧急程度 *'}
                </label>
                {ruleForm.type === 'category' ? (
                  <div className="relative">
                    <select
                      value={ruleForm.conditionValue}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, conditionValue: e.target.value }))}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none"
                    >
                      <option value="">请选择类别</option>
                      <option value="transportation">交通出行</option>
                      <option value="medical">医疗健康</option>
                      <option value="education">教育服务</option>
                      <option value="government">政务服务</option>
                      <option value="urban_management">城市管理</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                ) : ruleForm.type === 'priority' ? (
                  <div className="relative">
                    <select
                      value={ruleForm.conditionValue}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, conditionValue: e.target.value }))}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none"
                    >
                      <option value="">请选择紧急程度</option>
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={ruleForm.conditionValue}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, conditionValue: e.target.value }))}
                    placeholder={ruleForm.type === 'keyword' ? '请输入关键词，多个用逗号分隔' : '例如：22:00-08:00'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分派部门 *</label>
                <div className="relative">
                  <select
                    value={ruleForm.department}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none"
                  >
                    <option value="">请选择分派部门</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">抄送部门</label>
                <div className="flex flex-wrap gap-2">
                  {departments.filter(d => d !== ruleForm.department).slice(0, 5).map(dept => (
                    <label key={dept} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={ruleForm.ccDepartments.includes(dept)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRuleForm(prev => ({ ...prev, ccDepartments: [...prev.ccDepartments, dept] }));
                          } else {
                            setRuleForm(prev => ({ ...prev, ccDepartments: prev.ccDepartments.filter(d => d !== dept) }));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{dept.replace('南宁市', '').replace('局', '')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">规则描述</label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入规则描述说明..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">启用规则</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleForm.isEnabled}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowRuleModal(false); resetRuleForm(); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveRule}
                disabled={!ruleForm.name || !ruleForm.conditionValue || !ruleForm.department}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {editingRule ? '保存修改' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && ticketDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{ticketDetail.title}</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{ticketDetail.ticketNo}</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setTicketDetail(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>加载中...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">工单详情</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">工单类别：</span>
                        <span className="text-gray-800">{TICKET_CATEGORY_MAP[ticketDetail.category]?.name || ticketDetail.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">优先级：</span>
                        <span className={cn(getPriorityColor(ticketDetail.priority).text, 'font-medium')}>
                          {getPriorityColor(ticketDetail.priority).label}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">当前状态：</span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{ backgroundColor: TICKET_STATUS_MAP[ticketDetail.status].color + '20', color: TICKET_STATUS_MAP[ticketDetail.status].color }}
                        >
                          {TICKET_STATUS_MAP[ticketDetail.status].name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">处理部门：</span>
                        <span className="text-gray-800">{ticketDetail.department}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">提交时间：</span>
                        <span className="text-gray-800">{formatDateTime(ticketDetail.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">截止时间：</span>
                        <span className="text-gray-800">{formatDateTime(ticketDetail.deadline)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-500 text-sm mb-2">诉求内容：</p>
                      <p className="text-gray-800 text-sm">{ticketDetail.content}</p>
                    </div>
                    {ticketDetail.resolution && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-500 text-sm mb-2">处理结果：</p>
                        <p className="text-gray-800 text-sm bg-eco-50 p-3 rounded-lg">{ticketDetail.resolution}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">流转记录</h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="space-y-6">
                        {(ticketDetail.logs || []).map((log: TicketLog, index: number) => {
                          const actionInfo = TICKET_ACTION_MAP[log.action] || { name: log.action, color: '#666666' };
                          const ActionIcon = getActionIcon(log.action);
                          return (
                            <div key={log.id} className="relative pl-10">
                              <div
                                className="absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: actionInfo.color }}
                              >
                                <ActionIcon className="w-3 h-3" />
                              </div>
                              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                                      style={{ backgroundColor: actionInfo.color + '20', color: actionInfo.color }}
                                    >
                                      {actionInfo.name}
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">{log.description}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{formatDateTime(log.timestamp)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                  <span>操作人：{log.operator}</span>
                                  <span>部门：{log.department}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
