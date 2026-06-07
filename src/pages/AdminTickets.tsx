import React, { useState, useEffect } from 'react';
import {
  Ticket,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  User,
  RefreshCw,
  Filter,
  Search,
  X,
  ChevronRight,
  MapPin,
  DollarSign,
  Calendar,
  AlertCircle,
  Zap,
  FileText,
  Send,
  Clock8,
  Shield,
  History,
  CheckSquare,
  Target,
  MessageSquare,
  Phone,
  Upload,
  Bell,
  Settings,
  Bot,
} from 'lucide-react';
import api, { ApiResponse, Ticket as TicketType } from '@/utils/api';

interface TicketProcessRecord {
  id: number;
  ticketId: number;
  action: string;
  operator: string;
  operatorRole: string;
  comment: string;
  timestamp: string;
  status: string;
}

interface TicketDetail {
  aiAnalysis: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  fakeProbability: number;
  evidence: Array<{
    type: string;
    description: string;
    value?: string;
  }>;
  deadline: string;
  processRecords: TicketProcessRecord[];
}

const mockTicketDetails: Record<number, TicketDetail> = {
  1: {
    aiAnalysis: '该房源价格明显低于同区域同类型房源均价35%，且图片存在明显PS痕迹，描述与实际房源信息不符，疑似虚假房源。建议立即下架处理，并对发布者进行警告。',
    riskLevel: 'high',
    riskScore: 92,
    fakeProbability: 95,
    evidence: [
      { type: '价格异常', description: '低于同区域均价35%', value: '680万 vs 均价1050万' },
      { type: '图片异常', description: '图片存在PS痕迹', value: '相似度92%与其他房源重复' },
      { type: '描述不符', description: '房源描述与实际不符', value: '标注120㎡实际为90㎡' },
      { type: '状态异常', description: '房源状态频繁变更', value: '近7天变更8次' },
    ],
    deadline: '2026-06-08 18:00',
    processRecords: [
      { id: 1, ticketId: 1, action: 'AI检测触发', operator: 'AI系统', operatorRole: 'system', comment: '价格监测模型检测到异常低价，触发工单流程', timestamp: '2026-06-07 09:30:00', status: 'pending' },
      { id: 2, ticketId: 1, action: '多维度核验', operator: 'AI系统', operatorRole: 'system', comment: '启动图片比对、信息核验、状态监测三重校验', timestamp: '2026-06-07 09:30:02', status: 'pending' },
      { id: 3, ticketId: 1, action: '风险评估', operator: 'AI系统', operatorRole: 'system', comment: '综合评分92分，高风险，自动设置24小时处理时限', timestamp: '2026-06-07 09:30:05', status: 'pending' },
      { id: 4, ticketId: 1, action: '工单分配', operator: '系统', operatorRole: 'system', comment: '根据负载均衡策略分配给审核组A', timestamp: '2026-06-07 09:30:10', status: 'pending' },
      { id: 5, ticketId: 1, action: '短信通知', operator: '系统', operatorRole: 'system', comment: '已发送短信通知审核主管：高风险工单待处理', timestamp: '2026-06-07 09:30:15', status: 'pending' },
    ],
  },
  2: {
    aiAnalysis: '该房源图片与系统中另一房源图片相似度达85%，可能存在图片盗用情况。建议联系发布者核实房源真实性。',
    riskLevel: 'medium',
    riskScore: 68,
    fakeProbability: 72,
    evidence: [
      { type: '图片重复', description: '与其他房源图片重复', value: '相似度85%' },
      { type: '价格正常', description: '价格在合理范围内', value: '与均价偏差5%' },
    ],
    deadline: '2026-06-09 18:00',
    processRecords: [
      { id: 1, ticketId: 2, action: 'AI检测触发', operator: 'AI系统', operatorRole: 'system', comment: '图片相似度模型检测到重复图片，触发工单流程', timestamp: '2026-06-07 10:15:00', status: 'pending' },
      { id: 2, ticketId: 2, action: '风险评估', operator: 'AI系统', operatorRole: 'system', comment: '综合评分68分，中风险，设置48小时处理时限', timestamp: '2026-06-07 10:15:03', status: 'pending' },
      { id: 3, ticketId: 2, action: '工单分配', operator: '系统', operatorRole: 'system', comment: '根据负载均衡策略分配给审核员张三', timestamp: '2026-06-07 10:15:08', status: 'pending' },
      { id: 4, ticketId: 2, action: '开始处理', operator: '张三', operatorRole: 'admin', comment: '已接收工单，正在核实房源真实性', timestamp: '2026-06-07 14:20:00', status: 'processing' },
      { id: 5, ticketId: 2, action: '联系发布者', operator: '张三', operatorRole: 'admin', comment: '已电话联系发布者，要求提供房源产权证明', timestamp: '2026-06-07 14:35:00', status: 'processing' },
      { id: 6, ticketId: 2, action: '补充材料', operator: '发布者', operatorRole: 'user', comment: '发布者已上传房产证和户型图，等待审核', timestamp: '2026-06-07 16:00:00', status: 'processing' },
    ],
  },
  3: {
    aiAnalysis: '该房源已售出但状态仍显示为可售，疑似状态未及时更新。建议核实后更新房源状态。',
    riskLevel: 'low',
    riskScore: 35,
    fakeProbability: 20,
    evidence: [
      { type: '状态不符', description: '系统记录已售出但前端显示可售', value: '订单号：20260605001' },
      { type: '价格正常', description: '价格在合理范围内', value: '与均价偏差3%' },
    ],
    deadline: '2026-06-10 18:00',
    processRecords: [
      { id: 1, ticketId: 3, action: 'AI检测触发', operator: 'AI系统', operatorRole: 'system', comment: '订单同步系统检测到状态不一致，触发工单', timestamp: '2026-06-07 08:00:00', status: 'pending' },
      { id: 2, ticketId: 3, action: '自动核实', operator: 'AI系统', operatorRole: 'system', comment: '核验订单系统与房源系统数据差异', timestamp: '2026-06-07 08:00:03', status: 'pending' },
      { id: 3, ticketId: 3, action: '工单分配', operator: '系统', operatorRole: 'system', comment: '分配给房源管理组处理', timestamp: '2026-06-07 08:00:05', status: 'pending' },
    ],
  },
};

const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  processing: { label: '处理中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  resolved: { label: '已解决', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: '已驳回', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const riskMap: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: 'text-green-600' },
  medium: { label: '中风险', color: 'text-yellow-600' },
  high: { label: '高风险', color: 'text-red-600' },
};

const typeMap: Record<string, string> = {
  price_anomaly: '价格异常',
  fake_image: '虚假图片',
  false_description: '虚假描述',
  status_mismatch: '状态不符',
};

const normalizeTicket = (ticket: any): TicketType => ({
  ...ticket,
  property: ticket.property || (ticket.projectName ? {
    id: ticket.propertyId,
    projectName: ticket.projectName,
    city: ticket.city,
    address: ticket.address,
    status: ticket.propertyStatus,
    price: ticket.price,
  } as any : undefined),
});

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processComment, setProcessComment] = useState('');
  const [ticketDetails, setTicketDetails] = useState<Record<number, TicketDetail>>(mockTicketDetails);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await api.get<ApiResponse<TicketType[]>>('/admin/tickets');
      if (res.code === 200) {
        const payload = res.data as any;
        const list = Array.isArray(payload) ? payload : payload.list || [];
        setTickets(list.map(normalizeTicket));
      }
    } catch (error) {
      console.error('加载工单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;
    if (diff <= 0) return { text: '已超时', urgent: true, hours: 0 };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return { text: `${days}天${hours % 24}小时`, urgent: hours < 24, hours };
    return { text: `${hours}小时`, urgent: hours < 24, hours };
  };

  const handleStartProcessing = async (ticketId: number) => {
    try {
      const res = await api.post<ApiResponse<TicketType>>(`/admin/tickets/${ticketId}/process`);
      if (res.code === 200) {
        const updated = normalizeTicket(res.data);
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);

        const newRecord: TicketProcessRecord = {
          id: Date.now(),
          ticketId,
          action: '开始处理',
          operator: '当前管理员',
          operatorRole: 'admin',
          comment: processComment || '已开始人工复核',
          timestamp: new Date().toLocaleString('zh-CN'),
          status: 'processing',
        };

        setTicketDetails(prev => ({
          ...prev,
          [ticketId]: {
            ...prev[ticketId],
            processRecords: [...prev[ticketId].processRecords, newRecord],
          },
        }));
        setProcessComment('');
      }
    } catch (error) {
      console.error('开始处理工单失败:', error);
      const updated = { ...selectedTicket!, status: 'processing' as const };
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      setSelectedTicket(updated);

      const newRecord: TicketProcessRecord = {
        id: Date.now(),
        ticketId,
        action: '开始处理',
        operator: '当前管理员',
        operatorRole: 'admin',
        comment: processComment || '已开始人工复核',
        timestamp: new Date().toLocaleString('zh-CN'),
        status: 'processing',
      };

      setTicketDetails(prev => ({
        ...prev,
        [ticketId]: {
          ...prev[ticketId],
          processRecords: [...prev[ticketId].processRecords, newRecord],
        },
      }));
      setProcessComment('');
    }
  };

  const handleProcessTicket = async (ticketId: number, action: 'resolve' | 'reject') => {
    try {
      const res = await api.post<ApiResponse<TicketType>>(`/admin/tickets/${ticketId}/${action}`);
      if (res.code === 200) {
        const updated = normalizeTicket(res.data);
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);

        const newRecord: TicketProcessRecord = {
          id: Date.now(),
          ticketId,
          action: action === 'resolve' ? '确认违规下架' : '驳回，房源正常',
          operator: '当前管理员',
          operatorRole: 'admin',
          comment: processComment || (action === 'resolve' ? '已确认违规，房源已下架' : '经核实，房源信息真实有效'),
          timestamp: new Date().toLocaleString('zh-CN'),
          status: action === 'resolve' ? 'resolved' : 'rejected',
        };

        setTicketDetails(prev => ({
          ...prev,
          [ticketId]: {
            ...prev[ticketId],
            processRecords: [...prev[ticketId].processRecords, newRecord],
          },
        }));
        setProcessComment('');
      }
    } catch (error) {
      console.error('处理工单失败:', error);
      const newStatus = action === 'resolve' ? 'resolved' : 'rejected';
      const updated = { ...selectedTicket!, status: newStatus as any };
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      setSelectedTicket(updated);

      const newRecord: TicketProcessRecord = {
        id: Date.now(),
        ticketId,
        action: action === 'resolve' ? '确认违规下架' : '驳回，房源正常',
        operator: '当前管理员',
        operatorRole: 'admin',
        comment: processComment || (action === 'resolve' ? '已确认违规，房源已下架' : '经核实，房源信息真实有效'),
        timestamp: new Date().toLocaleString('zh-CN'),
        status: newStatus,
      };

      setTicketDetails(prev => ({
        ...prev,
        [ticketId]: {
          ...prev[ticketId],
          processRecords: [...prev[ticketId].processRecords, newRecord],
        },
      }));
      setProcessComment('');
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchSearch = !searchQuery || 
      t.property?.projectName?.includes(searchQuery) ||
      t.type.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const groupedTickets = {
    pending: filteredTickets.filter(t => t.status === 'pending'),
    processing: filteredTickets.filter(t => t.status === 'processing'),
    resolved: filteredTickets.filter(t => t.status === 'resolved'),
    rejected: filteredTickets.filter(t => t.status === 'rejected'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工单处理中心</h1>
          <p className="text-gray-500 mt-1">虚假房源AI识别与人工复核工单流</p>
        </div>
        <button
          onClick={loadTickets}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'all', label: '全部工单', count: filteredTickets.length, icon: Ticket, color: 'bg-blue-50 text-blue-600' },
          { key: 'pending', label: '待处理', count: groupedTickets.pending.length, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { key: 'processing', label: '处理中', count: groupedTickets.processing.length, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
          { key: 'resolved', label: '已完成', count: groupedTickets.resolved.length + groupedTickets.rejected.length, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`p-4 rounded-xl border transition-all text-left ${
                statusFilter === item.key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-100 bg-white hover:border-primary-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索楼盘或工单类型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">工单列表</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无工单</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const detail = ticketDetails[ticket.id];
                const timeRemaining = detail ? getTimeRemaining(detail.deadline) : null;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDetailModal(true);
                    }}
                    className={`w-full p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${
                      selectedTicket?.id === ticket.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative ${
                        ticket.riskLevel === 'high' ? 'bg-red-100' :
                        ticket.riskLevel === 'medium' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        {ticket.riskLevel === 'high' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Ticket className={`w-5 h-5 ${
                            ticket.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        )}
                        {detail && timeRemaining?.urgent && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMap[ticket.status].bgColor} ${statusMap[ticket.status].color}`}>
                            {statusMap[ticket.status].label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              ticket.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                              ticket.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {riskMap[ticket.riskLevel]?.label}
                              {detail && (
                                <span className="ml-1 opacity-75">
                                  {detail.riskScore}分
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900 mt-1">
                          {typeMap[ticket.type] || ticket.type}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {ticket.property?.projectName || '未知楼盘'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            {new Date(ticket.createdAt).toLocaleString('zh-CN')}
                          </p>
                          {detail && timeRemaining && (
                            <span className={`text-xs flex items-center gap-1 ${
                              timeRemaining.urgent ? 'text-red-600 font-medium' : 'text-gray-500'
                            }`}>
                              <Clock8 className="w-3 h-3" />
                              剩余{timeRemaining.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedTicket.riskLevel === 'high' ? 'bg-red-100' :
                      selectedTicket.riskLevel === 'medium' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}>
                      {selectedTicket.riskLevel === 'high' ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Ticket className={`w-6 h-6 ${
                          selectedTicket.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {typeMap[selectedTicket.type] || selectedTicket.type}
                      </h2>
                      <p className="text-sm text-gray-500">工单编号：{selectedTicket.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowDetailModal(true)}
                      className="btn-secondary flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      查看完整明细
                    </button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[selectedTicket.status].bgColor} ${statusMap[selectedTicket.status].color}`}>
                      {statusMap[selectedTicket.status].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {(() => {
                  const detail = ticketDetails[selectedTicket.id];
                  const timeRemaining = detail ? getTimeRemaining(detail.deadline) : null;
                  return (
                    <>
                      {detail && timeRemaining && (
                        <div className={`p-4 rounded-xl border ${
                          timeRemaining.urgent
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock8 className={`w-5 h-5 ${timeRemaining.urgent ? 'text-red-600' : 'text-amber-600'}`} />
                              <span className={`font-medium ${timeRemaining.urgent ? 'text-red-900' : 'text-amber-900'}`}>
                                处理时限
                              </span>
                            </div>
                            <span className={`text-sm font-bold ${timeRemaining.urgent ? 'text-red-600' : 'text-amber-600'}`}>
                              剩余 {timeRemaining.text}
                              {timeRemaining.urgent && ' · 请尽快处理'}
                            </span>
                          </div>
                          <div className="mt-2 bg-white/50 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${timeRemaining.urgent ? 'bg-red-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.max(0, Math.min(100, (timeRemaining.hours / 48) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {selectedTicket.property && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary-600" />
                            关联房源
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">楼盘名称</p>
                              <p className="font-medium text-gray-900">{selectedTicket.property.projectName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">城市</p>
                              <p className="font-medium text-gray-900">{selectedTicket.property.city}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">当前状态</p>
                              <p className="font-medium text-gray-900">
                                {selectedTicket.property.status === 'available' ? '在售' :
                                 selectedTicket.property.status === 'locked' ? '已锁' :
                                 selectedTicket.property.status === 'sold' ? '已售' : '下架'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">价格</p>
                              <p className="font-medium text-gray-900">¥{selectedTicket.property.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {detail && (
                        <div className={`p-4 border rounded-xl ${
                          selectedTicket.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                          selectedTicket.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                          'border-green-200 bg-green-50'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <h3 className={`font-medium flex items-center gap-2 ${
                              selectedTicket.riskLevel === 'high' ? 'text-red-900' :
                              selectedTicket.riskLevel === 'medium' ? 'text-yellow-900' :
                              'text-green-900'
                            }`}>
                              <Eye className="w-5 h-5" />
                              AI分析结果
                            </h3>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">虚假概率</p>
                                <p className={`text-lg font-bold ${
                                  detail.fakeProbability >= 80 ? 'text-red-600' :
                                  detail.fakeProbability >= 50 ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {detail.fakeProbability}%
                                </p>
                              </div>
                              <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white" style={{
                                borderColor: detail.fakeProbability >= 80 ? '#dc2626' :
                                  detail.fakeProbability >= 50 ? '#eab308' : '#22c55e'
                              }}>
                                <span className="text-xl font-bold" style={{
                                  color: detail.fakeProbability >= 80 ? '#dc2626' :
                                    detail.fakeProbability >= 50 ? '#eab308' : '#22c55e'
                                }}>
                                  {detail.riskScore}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className={`${
                            selectedTicket.riskLevel === 'high' ? 'text-red-800' :
                            selectedTicket.riskLevel === 'medium' ? 'text-yellow-800' :
                            'text-green-800'
                          }`}>
                            {detail.aiAnalysis}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {detail.evidence.map((ev, index) => (
                              <div key={index} className="p-2 bg-white/70 rounded-lg">
                                <p className="text-xs font-medium text-gray-700">{ev.type}</p>
                                <p className="text-sm text-gray-600">{ev.description}</p>
                                {ev.value && <p className="text-xs text-primary-600 mt-0.5">{ev.value}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-500">创建时间</p>
                          <p className="font-medium text-gray-900 mt-1">
                            {new Date(selectedTicket.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-500">处理人</p>
                          <p className="font-medium text-gray-900 mt-1 flex items-center gap-2">
                            {selectedTicket.handlerId ? (
                              <>
                                <User className="w-4 h-4" />
                                管理员
                              </>
                            ) : (
                              '待分配'
                            )}
                          </p>
                        </div>
                      </div>

                      {detail && detail.processRecords.length > 0 && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <History className="w-5 h-5 text-primary-600" />
                            处理记录
                            <span className="ml-auto text-xs font-normal text-gray-500">
                              {detail.processRecords.length} 个节点
                            </span>
                          </h3>
                          <div className="relative max-h-48 overflow-y-auto">
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-500 via-primary-300 to-gray-200" />
                            <div className="space-y-1 pl-1">
                              {detail.processRecords.map((record, index) => {
                                const isLast = index === detail.processRecords.length - 1;
                                const getActionIcon = () => {
                                  if (record.action.includes('AI') || record.action.includes('检测')) return Bot;
                                  if (record.action.includes('核验') || record.action.includes('评估')) return Shield;
                                  if (record.action.includes('分配')) return Settings;
                                  if (record.action.includes('通知')) return Bell;
                                  if (record.action.includes('联系') || record.action.includes('电话')) return Phone;
                                  if (record.action.includes('材料') || record.action.includes('上传')) return Upload;
                                  if (record.action.includes('开始')) return Clock;
                                  if (record.action.includes('驳回')) return XCircle;
                                  if (record.action.includes('下架') || record.action.includes('解决')) return CheckSquare;
                                  if (record.action.includes('消息')) return MessageSquare;
                                  return record.operatorRole === 'system' ? Zap : User;
                                };
                                const ActionIcon = getActionIcon();
                                return (
                                  <div key={record.id} className="relative pl-8 py-1.5">
                                    <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                      isLast
                                        ? record.status === 'resolved'
                                          ? 'bg-green-500 text-white'
                                          : record.status === 'rejected'
                                          ? 'bg-gray-500 text-white'
                                          : 'bg-primary-500 text-white ring-2 ring-primary-100 animate-pulse'
                                        : index === 0
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white border-2 border-primary-300 text-primary-600'
                                    }`}>
                                      <ActionIcon className="w-3 h-3" />
                                    </div>
                                    <div className={`rounded-lg p-2 border text-xs ${
                                      isLast ? 'bg-white border-primary-100' : 'bg-white/70 border-gray-100'
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <span className={`font-medium ${isLast ? 'text-primary-700' : 'text-gray-900'}`}>
                                          {record.action}
                                        </span>
                                        <span className="text-gray-400">{record.timestamp.split(' ')[1]}</span>
                                      </div>
                                      <p className="text-gray-600 mt-0.5">{record.comment}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedTicket.status === 'pending' && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <textarea
                            value={processComment}
                            onChange={(e) => setProcessComment(e.target.value)}
                            placeholder="输入处理备注（可选）..."
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleStartProcessing(selectedTicket.id)}
                              className="flex-1 btn-secondary flex items-center justify-center gap-2"
                            >
                              <Clock className="w-5 h-5" />
                              开始处理
                            </button>
                            <button
                              onClick={() => handleProcessTicket(selectedTicket.id, 'resolve')}
                              className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              确认违规，下架处理
                            </button>
                            <button
                              onClick={() => handleProcessTicket(selectedTicket.id, 'reject')}
                              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              驳回，房源正常
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedTicket.status === 'processing' && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <textarea
                            value={processComment}
                            onChange={(e) => setProcessComment(e.target.value)}
                            placeholder="输入处理备注..."
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleProcessTicket(selectedTicket.id, 'resolve')}
                              className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              确认违规，下架处理
                            </button>
                            <button
                              onClick={() => handleProcessTicket(selectedTicket.id, 'reject')}
                              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              驳回，房源正常
                            </button>
                          </div>
                        </div>
                      )}

                      {(selectedTicket.status === 'resolved' || selectedTicket.status === 'rejected') && (
                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                            selectedTicket.status === 'resolved' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {selectedTicket.status === 'resolved' ? (
                              <CheckCircle2 className="w-8 h-8 text-green-600" />
                            ) : (
                              <XCircle className="w-8 h-8 text-gray-500" />
                            )}
                          </div>
                          <p className="font-medium text-gray-900">
                            {selectedTicket.status === 'resolved' ? '工单已完成处理' : '工单已驳回'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {selectedTicket.status === 'resolved'
                              ? '该房源已确认违规并下架处理'
                              : '经核实，该房源信息真实有效'}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">选择工单查看详情</h3>
              <p className="text-sm text-gray-400 mt-1">从左侧列表选择一个工单进行处理</p>
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">工单详情追踪</h3>
                <p className="text-sm text-gray-500 mt-1">工单编号：{selectedTicket.id} · 完整处理轨迹</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const detail = ticketDetails[selectedTicket.id];
              if (!detail) return null;
              const timeRemaining = getTimeRemaining(detail.deadline);

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl border ${
                      selectedTicket.riskLevel === 'high' ? 'bg-red-50 border-red-200' :
                      selectedTicket.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className={`w-5 h-5 ${
                          selectedTicket.riskLevel === 'high' ? 'text-red-600' :
                          selectedTicket.riskLevel === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                        <span className="text-sm font-medium text-gray-700">风险等级</span>
                      </div>
                      <p className={`text-xl font-bold ${
                        selectedTicket.riskLevel === 'high' ? 'text-red-600' :
                        selectedTicket.riskLevel === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {riskMap[selectedTicket.riskLevel]?.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">风险评分：{detail.riskScore}分</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">虚假概率</span>
                      </div>
                      <p className="text-xl font-bold text-purple-600">{detail.fakeProbability}%</p>
                      <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${detail.fakeProbability}%` }}
                        />
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      timeRemaining.urgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock8 className={`w-5 h-5 ${timeRemaining.urgent ? 'text-red-600' : 'text-amber-600'}`} />
                        <span className="text-sm font-medium text-gray-700">处理时限</span>
                      </div>
                      <p className={`text-xl font-bold ${timeRemaining.urgent ? 'text-red-600' : 'text-amber-600'}`}>
                        {timeRemaining.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">截止：{detail.deadline}</p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">当前状态</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{statusMap[selectedTicket.status].label}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        创建于 {new Date(selectedTicket.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  {selectedTicket.property && (
                    <div className="p-6 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-600" />
                        房源详细信息
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">楼盘名称</p>
                          <p className="font-medium text-gray-900">{selectedTicket.property.projectName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">所在区域</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {selectedTicket.property.city}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">房源状态</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedTicket.property.status === 'available' ? 'bg-green-100 text-green-700' :
                            selectedTicket.property.status === 'locked' ? 'bg-yellow-100 text-yellow-700' :
                            selectedTicket.property.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {selectedTicket.property.status === 'available' ? '在售' :
                             selectedTicket.property.status === 'locked' ? '已锁定' :
                             selectedTicket.property.status === 'sold' ? '已售出' : '已下架'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">挂牌价格</p>
                          <p className="font-medium text-primary-600 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ¥{selectedTicket.property.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`p-6 rounded-xl border ${
                    selectedTicket.riskLevel === 'high' ? 'bg-red-50 border-red-200' :
                    selectedTicket.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <h4 className={`font-semibold mb-4 flex items-center gap-2 ${
                      selectedTicket.riskLevel === 'high' ? 'text-red-900' :
                      selectedTicket.riskLevel === 'medium' ? 'text-yellow-900' :
                      'text-green-900'
                    }`}>
                      <Zap className="w-5 h-5" />
                      AI智能分析结果
                    </h4>
                    <p className={`mb-4 ${
                      selectedTicket.riskLevel === 'high' ? 'text-red-800' :
                      selectedTicket.riskLevel === 'medium' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {detail.aiAnalysis}
                    </p>
                    <h5 className="font-medium text-gray-700 mb-3">检测证据</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detail.evidence.map((ev, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{ev.type}</span>
                            {ev.value && (
                              <span className="text-xs text-primary-600 font-medium">{ev.value}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary-600" />
                      工单追踪链路
                      <span className="ml-auto text-sm font-normal text-gray-500">
                        共 {detail.processRecords.length} 个处理节点
                      </span>
                    </h4>
                    <div className="relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-500 via-primary-300 to-gray-200" />
                      <div className="space-y-1">
                        {detail.processRecords.map((record, index) => {
                          const isLast = index === detail.processRecords.length - 1;
                          const getActionIcon = () => {
                            if (record.action.includes('AI') || record.action.includes('检测')) return Bot;
                            if (record.action.includes('核验') || record.action.includes('评估')) return Shield;
                            if (record.action.includes('分配')) return Settings;
                            if (record.action.includes('通知')) return Bell;
                            if (record.action.includes('联系') || record.action.includes('电话')) return Phone;
                            if (record.action.includes('材料') || record.action.includes('上传')) return Upload;
                            if (record.action.includes('开始')) return Clock;
                            if (record.action.includes('驳回')) return XCircle;
                            if (record.action.includes('下架') || record.action.includes('解决')) return CheckSquare;
                            if (record.action.includes('消息')) return MessageSquare;
                            return record.operatorRole === 'system' ? Zap : User;
                          };
                          const ActionIcon = getActionIcon();
                          return (
                            <div key={record.id} className="relative pl-10 py-2">
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isLast
                                  ? record.status === 'resolved'
                                    ? 'bg-green-500 text-white'
                                    : record.status === 'rejected'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-primary-500 text-white ring-4 ring-primary-100 animate-pulse'
                                  : index === 0
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white border-2 border-primary-300 text-primary-600'
                              }`}>
                                <ActionIcon className="w-4 h-4" />
                              </div>
                              <div className={`rounded-lg p-4 border transition-all ${
                                isLast
                                  ? 'bg-white border-primary-200 shadow-sm'
                                  : 'bg-white/70 border-gray-100'
                              }`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isLast ? 'text-primary-700' : 'text-gray-900'}`}>
                                      {record.action}
                                    </span>
                                    {isLast && (
                                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                        当前节点
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0 ml-2">
                                    <Calendar className="w-3 h-3" />
                                    {record.timestamp}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{record.comment}</p>
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                      record.operatorRole === 'system' ? 'bg-purple-100' :
                                      record.operatorRole === 'admin' ? 'bg-blue-100' :
                                      'bg-green-100'
                                    }`}>
                                      {record.operatorRole === 'system' ? (
                                        <Bot className="w-3 h-3 text-purple-600" />
                                      ) : record.operatorRole === 'admin' ? (
                                        <Shield className="w-3 h-3 text-blue-600" />
                                      ) : (
                                        <User className="w-3 h-3 text-green-600" />
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {record.operator}
                                      <span className="text-gray-400 mx-1">·</span>
                                      {record.operatorRole === 'system' ? '系统自动' :
                                       record.operatorRole === 'admin' ? '管理员' :
                                       record.operatorRole === 'user' ? '用户' : '审核员'}
                                    </span>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    record.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                    record.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {record.status === 'pending' ? '待处理' :
                                     record.status === 'processing' ? '处理中' :
                                     record.status === 'resolved' ? '已解决' : '已驳回'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedTicket.status === 'pending' && (
                    <div className="space-y-4 p-6 bg-primary-50 rounded-xl border border-primary-200">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary-600" />
                        工单处理
                      </h4>
                      <textarea
                        value={processComment}
                        onChange={(e) => setProcessComment(e.target.value)}
                        placeholder="请输入处理备注..."
                        className="w-full p-4 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
                        rows={3}
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            handleStartProcessing(selectedTicket.id);
                            setShowDetailModal(false);
                          }}
                          className="flex-1 btn-secondary flex items-center justify-center gap-2"
                        >
                          <Clock className="w-5 h-5" />
                          开始处理
                        </button>
                        <button
                          onClick={() => {
                            handleProcessTicket(selectedTicket.id, 'resolve');
                            setShowDetailModal(false);
                          }}
                          className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          确认违规，下架处理
                        </button>
                        <button
                          onClick={() => {
                            handleProcessTicket(selectedTicket.id, 'reject');
                            setShowDetailModal(false);
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                          驳回，房源正常
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'processing' && (
                    <div className="space-y-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        完成处理
                      </h4>
                      <textarea
                        value={processComment}
                        onChange={(e) => setProcessComment(e.target.value)}
                        placeholder="请输入处理结果..."
                        className="w-full p-4 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
                        rows={3}
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            handleProcessTicket(selectedTicket.id, 'resolve');
                            setShowDetailModal(false);
                          }}
                          className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          确认违规，下架处理
                        </button>
                        <button
                          onClick={() => {
                            handleProcessTicket(selectedTicket.id, 'reject');
                            setShowDetailModal(false);
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                          驳回，房源正常
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-primary px-8"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
