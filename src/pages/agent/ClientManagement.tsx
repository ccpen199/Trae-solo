import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  DollarSign,
  Plus,
  Search,
  X,
  ChevronRight,
  Clock,
  PhoneCall,
  MessageSquare,
  Send,
  MapPin,
  Filter,
} from 'lucide-react';
import { agentApi } from '../../utils/api';
import { formatDate, formatPhone, formatPrice, formatRelativeTime, formatDateTime } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';
import type { Client } from '../../../shared/types';

interface FollowUp {
  id: string;
  content: string;
  type: 'call' | 'viewing' | 'message' | 'other';
  createdAt: string;
}

const mockClients: Client[] = [
  { id: 'c1', name: '张先生', phone: '13800138001', level: 'A', budgetMin: 3000000, budgetMax: 5000000, preference: '三室两厅，精装修，近地铁，学区优先', agentId: 'a1', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'c2', name: '李女士', phone: '13800138002', level: 'B', budgetMin: 2000000, budgetMax: 3500000, preference: '两室一厅，朝南，采光好', agentId: 'a1', createdAt: '2026-05-10T00:00:00Z' },
  { id: 'c3', name: '王先生', phone: '13800138003', level: 'A', budgetMin: 4000000, budgetMax: 6000000, preference: '四室两厅，豪华装修，大平层', agentId: 'a1', createdAt: '2026-05-05T00:00:00Z' },
  { id: 'c4', name: '陈女士', phone: '13800138004', level: 'A', budgetMin: 1500000, budgetMax: 2500000, preference: '一室一厅，小户型，投资自住皆宜', agentId: 'a1', createdAt: '2026-05-15T00:00:00Z' },
  { id: 'c5', name: '刘先生', phone: '13800138005', level: 'B', budgetMin: 3500000, budgetMax: 5000000, preference: '三室两厅，地铁房，交通便利', agentId: 'a1', createdAt: '2026-05-08T00:00:00Z' },
  { id: 'c6', name: '赵女士', phone: '13800138006', level: 'C', budgetMin: 2500000, budgetMax: 4000000, preference: '三居室，小区环境好，绿化率高', agentId: 'a1', createdAt: '2026-05-20T00:00:00Z' },
  { id: 'c7', name: '孙先生', phone: '13800138007', level: 'A', budgetMin: 5000000, budgetMax: 8000000, preference: '别墅或叠拼，有花园，改善型', agentId: 'a1', createdAt: '2026-04-25T00:00:00Z' },
  { id: 'c8', name: '周女士', phone: '13800138008', level: 'B', budgetMin: 1800000, budgetMax: 2800000, preference: '两室两厅，精装修，拎包入住', agentId: 'a1', createdAt: '2026-05-18T00:00:00Z' },
];

const mockFollowUps: Record<string, FollowUp[]> = {
  c1: [
    { id: 'f1', content: '客户表示对万科城的房源很感兴趣，约好下周三面谈价格', type: 'call', createdAt: '2026-06-13T10:30:00Z' },
    { id: 'f2', content: '带看万科城 3室2厅，客户对户型和装修都很满意', type: 'viewing', createdAt: '2026-06-10T14:00:00Z' },
    { id: 'f3', content: '发送了5套符合需求的房源信息，客户回复会仔细看看', type: 'message', createdAt: '2026-06-08T09:15:00Z' },
    { id: 'f4', content: '初次沟通，了解到客户改善型需求，需要学区房', type: 'call', createdAt: '2026-06-01T11:00:00Z' },
  ],
  c2: [
    { id: 'f5', content: '客户反馈碧桂园的房源价格偏高，希望再优惠一些', type: 'call', createdAt: '2026-06-12T15:00:00Z' },
    { id: 'f6', content: '带看碧桂园 2室1厅，客户喜欢朝南的户型', type: 'viewing', createdAt: '2026-06-09T10:00:00Z' },
  ],
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'A': return 'bg-red-100 text-red-700 border-red-200';
    case 'B': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'C': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getLevelLabel = (level: string) => {
  switch (level) {
    case 'A': return 'A级';
    case 'B': return 'B级';
    case 'C': return 'C级';
    default: return level;
  }
};

const getFollowUpIcon = (type: string) => {
  switch (type) {
    case 'call': return PhoneCall;
    case 'viewing': return MapPin;
    case 'message': return MessageSquare;
    default: return Clock;
  }
};

const getFollowUpLabel = (type: string) => {
  switch (type) {
    case 'call': return '电话';
    case 'viewing': return '带看';
    case 'message': return '消息';
    default: return '其他';
  }
};

const getFollowUpColor = (type: string) => {
  switch (type) {
    case 'call': return 'bg-green-100 text-green-600';
    case 'viewing': return 'bg-blue-100 text-blue-600';
    case 'message': return 'bg-purple-100 text-purple-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function ClientManagement() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [newFollowUp, setNewFollowUp] = useState({
    content: '',
    type: 'call' as 'call' | 'viewing' | 'message' | 'other',
  });
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    level: 'B' as 'A' | 'B' | 'C',
    budgetMin: '',
    budgetMax: '',
    preference: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const res = await agentApi.getClients(user.id);
        if (res.success && res.data) {
          setClients(res.data);
          setFilteredClients(res.data);
        }
      } catch {
        setClients(mockClients);
        setFilteredClients(mockClients);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    let result = [...clients];
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.phone.includes(keyword) ||
        c.preference.toLowerCase().includes(keyword)
      );
    }
    if (levelFilter) {
      result = result.filter(c => c.level === levelFilter);
    }
    setFilteredClients(result);
  }, [searchKeyword, levelFilter, clients]);

  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!user?.id || !selectedClient?.id) return;
      try {
        const res = await agentApi.getClientFollowUps(user.id, selectedClient.id);
        if (res.success && res.data) {
          setFollowUps(res.data);
        } else {
          setFollowUps(mockFollowUps[selectedClient.id] || []);
        }
      } catch {
        setFollowUps(mockFollowUps[selectedClient.id] || []);
      }
    };
    fetchFollowUps();
  }, [selectedClient?.id, user?.id]);

  const handleCreateClient = async () => {
    if (!user?.id || !newClient.name || !newClient.phone) return;
    const clientData = {
      name: newClient.name,
      phone: newClient.phone,
      level: newClient.level,
      budgetMin: parseFloat(newClient.budgetMin) || 0,
      budgetMax: parseFloat(newClient.budgetMax) || 0,
      preference: newClient.preference,
    };
    try {
      const res = await agentApi.createClient(user.id, clientData);
      if (res.success && res.data) {
        setClients([res.data, ...clients]);
        setShowModal(false);
        setNewClient({ name: '', phone: '', level: 'B', budgetMin: '', budgetMax: '', preference: '' });
      }
    } catch {
      const newRecord: Client = {
        id: Date.now().toString(),
        ...clientData,
        agentId: user.id,
        createdAt: new Date().toISOString(),
      };
      setClients([newRecord, ...clients]);
      setShowModal(false);
      setNewClient({ name: '', phone: '', level: 'B', budgetMin: '', budgetMax: '', preference: '' });
    }
  };

  const handleAddFollowUp = async () => {
    if (!user?.id || !selectedClient?.id || !newFollowUp.content) return;
    try {
      const res = await agentApi.addFollowUp(user.id, selectedClient.id, newFollowUp.content, newFollowUp.type);
      if (res.success) {
        const followUp: FollowUp = {
          id: Date.now().toString(),
          content: newFollowUp.content,
          type: newFollowUp.type,
          createdAt: new Date().toISOString(),
        };
        setFollowUps([followUp, ...followUps]);
        setNewFollowUp({ content: '', type: 'call' });
      }
    } catch {
      const followUp: FollowUp = {
        id: Date.now().toString(),
        content: newFollowUp.content,
        type: newFollowUp.type,
        createdAt: new Date().toISOString(),
      };
      setFollowUps([followUp, ...followUps]);
      setNewFollowUp({ content: '', type: 'call' });
    }
  };

  const openClientDetail = (client: Client) => {
    setSelectedClient(client);
    setShowSidebar(true);
  };

  const levelStats = [
    { level: 'A', label: 'A级客户', count: clients.filter(c => c.level === 'A').length, color: 'bg-red-500' },
    { level: 'B', label: 'B级客户', count: clients.filter(c => c.level === 'B').length, color: 'bg-yellow-500' },
    { level: 'C', label: 'C级客户', count: clients.filter(c => c.level === 'C').length, color: 'bg-blue-500' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">客户管理</h1>
          <p className="text-gray-500">管理您的客户资源，跟踪跟进记录</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增客户
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {levelStats.map((stat) => (
          <div
            key={stat.level}
            onClick={() => setLevelFilter(levelFilter === stat.level ? '' : stat.level)}
            className={`card p-4 cursor-pointer transition-all ${
              levelFilter === stat.level ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索客户姓名、电话、需求..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">全部等级</option>
              <option value="A">A级客户</option>
              <option value="B">B级客户</option>
              <option value="C">C级客户</option>
            </select>
            {(searchKeyword || levelFilter) && (
              <button
                onClick={() => { setSearchKeyword(''); setLevelFilter(''); }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-start gap-4">
                <div className="skeleton w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500 mb-2">暂无客户</div>
          <p className="text-sm text-gray-400">点击右上角按钮添加您的第一位客户</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => openClientDetail(client)}
              className="card p-6 hover:shadow-card-hover transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">{client.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getLevelColor(client.level)}`}>
                      {getLevelLabel(client.level)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{formatPhone(client.phone)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600">
                    预算：{formatPrice(client.budgetMin)} - {formatPrice(client.budgetMax)}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 line-clamp-2">{client.preference}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                  <span className="text-xs text-gray-400">
                    添加于 {formatRelativeTime(client.createdAt)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSidebar && selectedClient && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowSidebar(false); setSelectedClient(null); }}
          />
          <div className="relative ml-auto w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">客户详情</h2>
                <button
                  onClick={() => { setShowSidebar(false); setSelectedClient(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{selectedClient.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedClient.name}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getLevelColor(selectedClient.level)}`}>
                      {getLevelLabel(selectedClient.level)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{formatPhone(selectedClient.phone)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    添加于 {formatDate(selectedClient.createdAt, 'yyyy年MM月dd日')}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">购房预算</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(selectedClient.budgetMin)} - {formatPrice(selectedClient.budgetMax)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">购房需求</span>
                </div>
                <div className="text-sm text-gray-700">{selectedClient.preference}</div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">添加跟进记录</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['call', 'viewing', 'message', 'other'] as const).map((type) => {
                      const Icon = getFollowUpIcon(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewFollowUp({ ...newFollowUp, type })}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            newFollowUp.type === type
                              ? getFollowUpColor(type)
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {getFollowUpLabel(type)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={newFollowUp.content}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, content: e.target.value })}
                      placeholder="记录跟进内容..."
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    <button
                      onClick={handleAddFollowUp}
                      disabled={!newFollowUp.content}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg transition-colors self-end"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">跟进记录</h4>
                {followUps.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">暂无跟进记录</div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-6">
                      {followUps.map((followUp, index) => {
                        const Icon = getFollowUpIcon(followUp.type);
                        return (
                          <div key={followUp.id} className="relative pl-12">
                            <div className={`absolute left-0 w-10 h-10 rounded-full ${getFollowUpColor(followUp.type)} flex items-center justify-center`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium ${getFollowUpColor(followUp.type).replace('bg-', 'text-').replace('100', '600')}`}>
                                  {getFollowUpLabel(followUp.type)}
                                </span>
                                <span className="text-xs text-gray-400">{formatRelativeTime(followUp.createdAt)}</span>
                              </div>
                              <div className="text-sm text-gray-700">{followUp.content}</div>
                              <div className="text-xs text-gray-400 mt-2">{formatDateTime(followUp.createdAt)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">新增客户</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">客户姓名 *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="请输入客户姓名"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">联系电话 *</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="请输入联系电话"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">客户等级</label>
                <div className="flex gap-3">
                  {(['A', 'B', 'C'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewClient({ ...newClient, level })}
                      className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                        newClient.level === level
                          ? getLevelColor(level) + ' border-current font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {getLevelLabel(level)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">预算下限（元）</label>
                  <input
                    type="number"
                    value={newClient.budgetMin}
                    onChange={(e) => setNewClient({ ...newClient, budgetMin: e.target.value })}
                    placeholder="最低预算"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">预算上限（元）</label>
                  <input
                    type="number"
                    value={newClient.budgetMax}
                    onChange={(e) => setNewClient({ ...newClient, budgetMax: e.target.value })}
                    placeholder="最高预算"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">购房需求</label>
                <textarea
                  value={newClient.preference}
                  onChange={(e) => setNewClient({ ...newClient, preference: e.target.value })}
                  placeholder="描述客户的购房需求，如户型、面积、地段、装修等..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                取消
              </button>
              <button onClick={handleCreateClient} className="btn-primary flex-1">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
