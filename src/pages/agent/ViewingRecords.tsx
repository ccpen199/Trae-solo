import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Search,
  Filter,
  X,
  MessageSquare,
  Send,
  ChevronDown,
} from 'lucide-react';
import { agentApi } from '../../utils/api';
import { formatDate, formatRelativeTime } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';
import type { ViewingRecord, Client } from '../../../shared/types';

const mockViewings: ViewingRecord[] = [
  { id: '1', propertyId: 'p1', propertyTitle: '万科城 3室2厅 精装修', clientId: 'c1', clientName: '张先生', agentId: 'a1', date: '2026-06-14', timeSlot: '10:00-11:00', feedback: '对户型很满意，考虑中，需要和家人商量后再决定', interestLevel: 'high', createdAt: '2026-06-14T08:00:00Z' },
  { id: '2', propertyId: 'p2', propertyTitle: '碧桂园 2室1厅 朝南', clientId: 'c2', clientName: '李女士', agentId: 'a1', date: '2026-06-14', timeSlot: '14:00-15:00', feedback: '', interestLevel: 'medium', createdAt: '2026-06-14T09:00:00Z' },
  { id: '3', propertyId: 'p3', propertyTitle: '恒大绿洲 4室2厅 豪华装修', clientId: 'c3', clientName: '王先生', agentId: 'a1', date: '2026-06-13', timeSlot: '15:00-16:00', feedback: '价格偏高，希望能谈下来5万左右', interestLevel: 'medium', createdAt: '2026-06-13T10:00:00Z' },
  { id: '4', propertyId: 'p4', propertyTitle: '保利花园 1室1厅 小户型', clientId: 'c4', clientName: '陈女士', agentId: 'a1', date: '2026-06-13', timeSlot: '10:00-11:00', feedback: '非常满意，已约房主下周面谈价格', interestLevel: 'high', createdAt: '2026-06-13T08:00:00Z' },
  { id: '5', propertyId: 'p5', propertyTitle: '龙湖天街 3室2厅 地铁房', clientId: 'c5', clientName: '刘先生', agentId: 'a1', date: '2026-06-12', timeSlot: '16:00-17:00', feedback: '位置好，但楼层太低，采光不理想', interestLevel: 'low', createdAt: '2026-06-12T14:00:00Z' },
  { id: '6', propertyId: 'p6', propertyTitle: '融创中心 2室2厅 精装修', clientId: 'c6', clientName: '赵女士', agentId: 'a1', date: '2026-06-11', timeSlot: '09:00-10:00', feedback: '小区环境好，但价格超出预算', interestLevel: 'low', createdAt: '2026-06-11T07:00:00Z' },
  { id: '7', propertyId: 'p7', propertyTitle: '华润置地 3室1厅 南北通透', clientId: 'c7', clientName: '孙先生', agentId: 'a1', date: '2026-06-10', timeSlot: '14:00-15:00', feedback: '户型方正，采光好，已进入议价阶段', interestLevel: 'high', createdAt: '2026-06-10T10:00:00Z' },
  { id: '8', propertyId: 'p8', propertyTitle: '中海国际 4室2厅 豪华装修', clientId: 'c8', clientName: '周女士', agentId: 'a1', date: '2026-06-09', timeSlot: '11:00-12:00', feedback: '装修风格喜欢，但学区一般', interestLevel: 'medium', createdAt: '2026-06-09T09:00:00Z' },
];

const mockClients: Client[] = [
  { id: 'c1', name: '张先生', phone: '13800138001', level: 'A', budgetMin: 3000000, budgetMax: 5000000, preference: '三室两厅，精装修', agentId: 'a1', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'c2', name: '李女士', phone: '13800138002', level: 'B', budgetMin: 2000000, budgetMax: 3500000, preference: '两室一厅，朝南', agentId: 'a1', createdAt: '2026-05-10T00:00:00Z' },
  { id: 'c3', name: '王先生', phone: '13800138003', level: 'A', budgetMin: 4000000, budgetMax: 6000000, preference: '四室两厅，豪华装修', agentId: 'a1', createdAt: '2026-05-05T00:00:00Z' },
  { id: 'c4', name: '陈女士', phone: '13800138004', level: 'A', budgetMin: 1500000, budgetMax: 2500000, preference: '一室一厅，小户型', agentId: 'a1', createdAt: '2026-05-15T00:00:00Z' },
  { id: 'c5', name: '刘先生', phone: '13800138005', level: 'B', budgetMin: 3500000, budgetMax: 5000000, preference: '三室两厅，地铁房', agentId: 'a1', createdAt: '2026-05-08T00:00:00Z' },
];

const timeSlots = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
];

const getInterestLevelColor = (level: string) => {
  switch (level) {
    case 'high': return 'bg-green-100 text-green-700 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getInterestLevelLabel = (level: string) => {
  switch (level) {
    case 'high': return '高意向';
    case 'medium': return '中意向';
    case 'low': return '低意向';
    default: return level;
  }
};

export default function ViewingRecords() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [viewings, setViewings] = useState<ViewingRecord[]>(mockViewings);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState<ViewingRecord | null>(null);
  const [feedback, setFeedback] = useState('');
  const [interestLevel, setInterestLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    clientId: '',
    interestLevel: '' as '' | 'high' | 'medium' | 'low',
  });

  const getApiFilters = () => ({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    clientId: filters.clientId || undefined,
    interestLevel: filters.interestLevel || undefined,
  });
  const [newViewing, setNewViewing] = useState({
    propertyId: '',
    propertyTitle: '',
    clientId: '',
    date: '',
    timeSlot: '',
    feedback: '',
    interestLevel: 'medium' as 'high' | 'medium' | 'low',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [viewingsRes, clientsRes] = await Promise.all([
          agentApi.getViewingRecords(user.id, getApiFilters()),
          agentApi.getClients(user.id),
        ]);
        if (viewingsRes.success && viewingsRes.data) {
          setViewings(viewingsRes.data);
        }
        if (clientsRes.success && clientsRes.data) {
          setClients(clientsRes.data);
        }
      } catch {
        setViewings(mockViewings);
        setClients(mockClients);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, filters]);

  const filteredViewings = viewings.filter((v) => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        v.clientName?.toLowerCase().includes(keyword) ||
        v.propertyTitle?.toLowerCase().includes(keyword)
      );
    }
    return true;
  });

  const handleCreateViewing = async () => {
    if (!user?.id || !newViewing.propertyId || !newViewing.clientId || !newViewing.date || !newViewing.timeSlot) {
      return;
    }
    try {
      const res = await agentApi.createViewingRecord(user.id, {
        propertyId: newViewing.propertyId,
        propertyTitle: newViewing.propertyTitle,
        clientId: newViewing.clientId,
        clientName: clients.find(c => c.id === newViewing.clientId)?.name,
        date: newViewing.date,
        timeSlot: newViewing.timeSlot,
        feedback: newViewing.feedback,
        interestLevel: newViewing.interestLevel,
      });
      if (res.success && res.data) {
        setViewings([res.data, ...viewings]);
        setShowModal(false);
        setNewViewing({
          propertyId: '',
          propertyTitle: '',
          clientId: '',
          date: '',
          timeSlot: '',
          feedback: '',
          interestLevel: 'medium',
        });
      }
    } catch {
      const newRecord: ViewingRecord = {
        id: Date.now().toString(),
        propertyId: newViewing.propertyId,
        propertyTitle: newViewing.propertyTitle,
        clientId: newViewing.clientId,
        clientName: clients.find(c => c.id === newViewing.clientId)?.name,
        agentId: user.id,
        date: newViewing.date,
        timeSlot: newViewing.timeSlot,
        feedback: newViewing.feedback,
        interestLevel: newViewing.interestLevel,
        createdAt: new Date().toISOString(),
      };
      setViewings([newRecord, ...viewings]);
      setShowModal(false);
      setNewViewing({
        propertyId: '',
        propertyTitle: '',
        clientId: '',
        date: '',
        timeSlot: '',
        feedback: '',
        interestLevel: 'medium',
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user?.id || !selectedViewing || !feedback) return;
    try {
      const res = await agentApi.updateViewingFeedback(user.id, selectedViewing.id, feedback, interestLevel);
      if (res.success && res.data) {
        setViewings(viewings.map(v => v.id === selectedViewing.id ? res.data! : v));
        setShowFeedbackModal(false);
        setSelectedViewing(null);
        setFeedback('');
        setInterestLevel('medium');
      }
    } catch {
      setViewings(viewings.map(v =>
        v.id === selectedViewing.id
          ? { ...v, feedback, interestLevel }
          : v
      ));
      setShowFeedbackModal(false);
      setSelectedViewing(null);
      setFeedback('');
      setInterestLevel('medium');
    }
  };

  const openFeedbackModal = (viewing: ViewingRecord) => {
    setSelectedViewing(viewing);
    setFeedback(viewing.feedback);
    setInterestLevel(viewing.interestLevel);
    setShowFeedbackModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">带看记录管理</h1>
          <p className="text-gray-500">管理所有带看记录，录入客户反馈</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增带看
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索客户姓名、房源..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="开始日期"
              />
            </div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="结束日期"
            />
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">全部客户</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select
              value={filters.interestLevel}
              onChange={(e) => setFilters({ ...filters, interestLevel: e.target.value as '' | 'high' | 'medium' | 'low' })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">全部意向</option>
              <option value="high">高意向</option>
              <option value="medium">中意向</option>
              <option value="low">低意向</option>
            </select>
            {(filters.dateFrom || filters.dateTo || filters.clientId || filters.interestLevel) && (
              <button
                onClick={() => setFilters({ dateFrom: '', dateTo: '', clientId: '', interestLevel: '' })}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : filteredViewings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500">暂无带看记录</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredViewings.map((viewing) => (
              <div key={viewing.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{viewing.propertyTitle}</h3>
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getInterestLevelColor(viewing.interestLevel)}`}>
                            {getInterestLevelLabel(viewing.interestLevel)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{viewing.clientName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatRelativeTime(viewing.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(viewing.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {viewing.timeSlot}
                      </span>
                    </div>
                    {viewing.feedback ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-gray-500 mb-1">客户反馈</div>
                            <div className="text-sm text-gray-700">{viewing.feedback}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openFeedbackModal(viewing)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        录入反馈
                      </button>
                    )}
                  </div>
                  {viewing.feedback && (
                    <button
                      onClick={() => openFeedbackModal(viewing)}
                      className="btn-ghost text-sm py-2 px-4 self-start"
                    >
                      编辑反馈
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">新增带看记录</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">客户</label>
                <select
                  value={newViewing.clientId}
                  onChange={(e) => setNewViewing({ ...newViewing, clientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择客户</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name} - {client.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房源编号</label>
                <input
                  type="text"
                  value={newViewing.propertyId}
                  onChange={(e) => setNewViewing({ ...newViewing, propertyId: e.target.value })}
                  placeholder="请输入房源编号"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房源名称</label>
                <input
                  type="text"
                  value={newViewing.propertyTitle}
                  onChange={(e) => setNewViewing({ ...newViewing, propertyTitle: e.target.value })}
                  placeholder="例如：万科城 3室2厅 精装修"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">带看日期</label>
                  <input
                    type="date"
                    value={newViewing.date}
                    onChange={(e) => setNewViewing({ ...newViewing, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">时间段</label>
                  <div className="relative">
                    <select
                      value={newViewing.timeSlot}
                      onChange={(e) => setNewViewing({ ...newViewing, timeSlot: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                    >
                      <option value="">请选择时间段</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">意向等级</label>
                <div className="flex gap-3">
                  {(['high', 'medium', 'low'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewViewing({ ...newViewing, interestLevel: level })}
                      className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                        newViewing.interestLevel === level
                          ? getInterestLevelColor(level) + ' border-current'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {getInterestLevelLabel(level)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">客户反馈（可选）</label>
                <textarea
                  value={newViewing.feedback}
                  onChange={(e) => setNewViewing({ ...newViewing, feedback: e.target.value })}
                  placeholder="请输入客户反馈..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                取消
              </button>
              <button onClick={handleCreateViewing} className="btn-primary flex-1">
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedViewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">客户反馈</h2>
              <button onClick={() => { setShowFeedbackModal(false); setSelectedViewing(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">带看房源</div>
                <div className="font-medium text-gray-900">{selectedViewing.propertyTitle}</div>
                <div className="text-sm text-gray-500 mt-1">客户：{selectedViewing.clientName}</div>
                <div className="text-sm text-gray-500">时间：{formatDate(selectedViewing.date)} {selectedViewing.timeSlot}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">意向等级</label>
                <div className="flex gap-3">
                  {(['high', 'medium', 'low'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setInterestLevel(level)}
                      className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                        interestLevel === level
                          ? getInterestLevelColor(level) + ' border-current'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {getInterestLevelLabel(level)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">反馈内容</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="请输入客户反馈..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setShowFeedbackModal(false); setSelectedViewing(null); }} className="btn-ghost flex-1">
                取消
              </button>
              <button onClick={handleSubmitFeedback} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                提交反馈
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
