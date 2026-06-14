import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  X,
  Clock,
  CheckCircle2,
  Upload,
  MapPin,
  TrendingUp,
  Calculator,
  Loader2,
} from 'lucide-react';
import { agentApi } from '../../utils/api';
import { formatDate, formatPrice, formatRelativeTime } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';
import type { Deal, Client, RegulatoryReport } from '../../../shared/types';

const mockDeals: Deal[] = [
  { id: 'd1', propertyId: 'p1', propertyTitle: '万科城 3室2厅 精装修', clientId: 'c1', clientName: '张先生', agentId: 'a1', dealPrice: 4580000, commission: 91600, dealDate: '2026-06-10', status: 'reported', createdAt: '2026-06-10T10:00:00Z' },
  { id: 'd2', propertyId: 'p4', propertyTitle: '保利花园 1室1厅 小户型', clientId: 'c4', clientName: '陈女士', agentId: 'a1', dealPrice: 2350000, commission: 47000, dealDate: '2026-06-08', status: 'completed', createdAt: '2026-06-08T14:00:00Z' },
  { id: 'd3', propertyId: 'p7', propertyTitle: '华润置地 3室1厅 南北通透', clientId: 'c7', clientName: '孙先生', agentId: 'a1', dealPrice: 5800000, commission: 116000, dealDate: '2026-06-05', status: 'pending', createdAt: '2026-06-05T09:00:00Z' },
  { id: 'd4', propertyId: 'p2', propertyTitle: '碧桂园 2室1厅 朝南', clientId: 'c2', clientName: '李女士', agentId: 'a1', dealPrice: 3200000, commission: 64000, dealDate: '2026-05-28', status: 'reported', createdAt: '2026-05-28T11:00:00Z' },
  { id: 'd5', propertyId: 'p3', propertyTitle: '恒大绿洲 4室2厅 豪华装修', clientId: 'c3', clientName: '王先生', agentId: 'a1', dealPrice: 5200000, commission: 104000, dealDate: '2026-05-20', status: 'completed', createdAt: '2026-05-20T15:00:00Z' },
  { id: 'd6', propertyId: 'p8', propertyTitle: '中海国际 4室2厅 豪华装修', clientId: 'c8', clientName: '周女士', agentId: 'a1', dealPrice: 4800000, commission: 96000, dealDate: '2026-05-15', status: 'reported', createdAt: '2026-05-15T10:00:00Z' },
];

const mockClients: Client[] = [
  { id: 'c1', name: '张先生', phone: '13800138001', level: 'A', budgetMin: 3000000, budgetMax: 5000000, preference: '三室两厅，精装修', agentId: 'a1', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'c2', name: '李女士', phone: '13800138002', level: 'B', budgetMin: 2000000, budgetMax: 3500000, preference: '两室一厅，朝南', agentId: 'a1', createdAt: '2026-05-10T00:00:00Z' },
  { id: 'c3', name: '王先生', phone: '13800138003', level: 'A', budgetMin: 4000000, budgetMax: 6000000, preference: '四室两厅，豪华装修', agentId: 'a1', createdAt: '2026-05-05T00:00:00Z' },
  { id: 'c4', name: '陈女士', phone: '13800138004', level: 'A', budgetMin: 1500000, budgetMax: 2500000, preference: '一室一厅，小户型', agentId: 'a1', createdAt: '2026-05-15T00:00:00Z' },
  { id: 'c7', name: '孙先生', phone: '13800138007', level: 'A', budgetMin: 5000000, budgetMax: 8000000, preference: '别墅或叠拼，有花园', agentId: 'a1', createdAt: '2026-04-25T00:00:00Z' },
  { id: 'c8', name: '周女士', phone: '13800138008', level: 'B', budgetMin: 1800000, budgetMax: 2800000, preference: '两室两厅，精装修', agentId: 'a1', createdAt: '2026-05-18T00:00:00Z' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    case 'reported': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '待处理';
    case 'completed': return '已完成';
    case 'reported': return '已上报';
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock;
    case 'completed': return CheckCircle2;
    case 'reported': return Upload;
    default: return Clock;
  }
};

export default function DealManagement() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [showModal, setShowModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reportLoading, setReportLoading] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    propertyId: '',
    propertyTitle: '',
    clientId: '',
    dealPrice: '',
    dealDate: '',
    commissionRate: '2.0',
  });
  const [commissionCalc, setCommissionCalc] = useState({
    dealPrice: '',
    commissionRate: '2.0',
    commission: 0,
    breakdown: [] as { name: string; amount: number }[],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [dealsRes, clientsRes] = await Promise.all([
          agentApi.getDeals(user.id, statusFilter as 'pending' | 'completed' | 'reported' | undefined),
          agentApi.getClients(user.id),
        ]);
        if (dealsRes.success && dealsRes.data) {
          setDeals(dealsRes.data);
        }
        if (clientsRes.success && clientsRes.data) {
          setClients(clientsRes.data);
        }
      } catch {
        setDeals(mockDeals);
        setClients(mockClients);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, statusFilter]);

  const filteredDeals = deals.filter((d) => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        d.clientName?.toLowerCase().includes(keyword) ||
        d.propertyTitle?.toLowerCase().includes(keyword)
      );
    }
    return true;
  });

  const stats = [
    { label: '待处理', value: deals.filter(d => d.status === 'pending').length, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { label: '已完成', value: deals.filter(d => d.status === 'completed').length, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: '已上报', value: deals.filter(d => d.status === 'reported').length, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '总佣金', value: formatPrice(deals.reduce((sum, d) => sum + d.commission, 0)), color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  const handleCreateDeal = async () => {
    if (!user?.id || !newDeal.propertyId || !newDeal.clientId || !newDeal.dealPrice || !newDeal.dealDate) {
      return;
    }
    const dealPrice = parseFloat(newDeal.dealPrice);
    const commissionRate = parseFloat(newDeal.commissionRate) / 100;
    const commission = dealPrice * commissionRate;

    try {
      const res = await agentApi.createDeal(user.id, {
        propertyId: newDeal.propertyId,
        propertyTitle: newDeal.propertyTitle,
        clientId: newDeal.clientId,
        clientName: clients.find(c => c.id === newDeal.clientId)?.name,
        dealPrice,
        commission,
        dealDate: newDeal.dealDate,
      });
      if (res.success && res.data) {
        setDeals([res.data, ...deals]);
        setShowModal(false);
        setNewDeal({ propertyId: '', propertyTitle: '', clientId: '', dealPrice: '', dealDate: '', commissionRate: '2.0' });
      }
    } catch {
      const newRecord: Deal = {
        id: Date.now().toString(),
        propertyId: newDeal.propertyId,
        propertyTitle: newDeal.propertyTitle,
        clientId: newDeal.clientId,
        clientName: clients.find(c => c.id === newDeal.clientId)?.name,
        agentId: user.id,
        dealPrice,
        commission,
        dealDate: newDeal.dealDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setDeals([newRecord, ...deals]);
      setShowModal(false);
      setNewDeal({ propertyId: '', propertyTitle: '', clientId: '', dealPrice: '', dealDate: '', commissionRate: '2.0' });
    }
  };

  const handleUpdateStatus = async (dealId: string, newStatus: 'pending' | 'completed' | 'reported') => {
    if (!user?.id) return;
    try {
      const res = await agentApi.updateDealStatus(user.id, dealId, newStatus);
      if (res.success && res.data) {
        setDeals(deals.map(d => d.id === dealId ? res.data! : d));
      }
    } catch {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: newStatus } : d));
    }
  };

  const handleReportToRegulatory = async (dealId: string) => {
    if (!user?.id) return;
    setReportLoading(dealId);
    try {
      const res = await agentApi.reportToRegulatory(user.id, dealId);
      if (res.success && res.data) {
        setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'reported' } : d));
      }
    } catch {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'reported' } : d));
    } finally {
      setReportLoading(null);
    }
  };

  const calculateCommission = async () => {
    if (!commissionCalc.dealPrice) return;
    const dealPrice = parseFloat(commissionCalc.dealPrice);
    const commissionRate = parseFloat(commissionCalc.commissionRate) / 100;
    try {
      const res = await agentApi.calculateCommission(dealPrice, commissionRate);
      if (res.success && res.data) {
        setCommissionCalc({
          ...commissionCalc,
          commission: res.data.commission,
          breakdown: res.data.breakdown,
        });
      }
    } catch {
      const commission = dealPrice * commissionRate;
      setCommissionCalc({
        ...commissionCalc,
        commission,
        breakdown: [
          { name: '中介服务费', amount: commission },
        ],
      });
    }
  };

  const getNextStatus = (current: string): 'pending' | 'completed' | 'reported' | null => {
    switch (current) {
      case 'pending': return 'completed';
      case 'completed': return 'reported';
      default: return null;
    }
  };

  const getNextStatusLabel = (current: string) => {
    switch (current) {
      case 'pending': return '标记完成';
      case 'completed': return '上报住建局';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">成交管理</h1>
          <p className="text-gray-500">管理成交记录，计算佣金，上报住建局</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCalculator(true)}
            className="btn-ghost flex items-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            佣金计算
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增成交
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`card p-4 ${stat.bgColor}`}>
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
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
              placeholder="搜索客户姓名、房源..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="completed">已完成</option>
              <option value="reported">已上报</option>
            </select>
            {(searchKeyword || statusFilter) && (
              <button
                onClick={() => { setSearchKeyword(''); setStatusFilter(''); }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500">暂无成交记录</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">房源信息</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成交价格</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">佣金</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成交日期</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeals.map((deal) => {
                  const StatusIcon = getStatusIcon(deal.status);
                  const nextStatus = getNextStatus(deal.status);
                  return (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-xs">{deal.propertyTitle}</div>
                            <div className="text-xs text-gray-400">{formatRelativeTime(deal.createdAt)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{deal.clientName?.charAt(0)}</span>
                          </div>
                          <span className="text-gray-900">{deal.clientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{formatPrice(deal.dealPrice)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-600">{formatPrice(deal.commission)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">{formatDate(deal.dealDate)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(deal.status)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {getStatusLabel(deal.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {nextStatus && (
                          <button
                            onClick={() => {
                              if (nextStatus === 'reported') {
                                handleReportToRegulatory(deal.id);
                              } else {
                                handleUpdateStatus(deal.id, nextStatus);
                              }
                            }}
                            disabled={reportLoading === deal.id}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              deal.status === 'completed'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5`}
                          >
                            {reportLoading === deal.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> 上报中...</>
                            ) : (
                              <>{deal.status === 'completed' && <Upload className="w-4 h-4" />}{getNextStatusLabel(deal.status)}</>
                            )}
                          </button>
                        )}
                        {deal.status === 'reported' && (
                          <span className="text-gray-400 text-sm">已完成</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900">状态流转说明</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4 border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-900">待处理</span>
            </div>
            <p className="text-sm text-gray-500">成交记录已创建，等待完成交易流程</p>
          </div>
          <div className="card p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900">已完成</span>
            </div>
            <p className="text-sm text-gray-500">交易已完成，款项已结清，可以上报住建局</p>
          </div>
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900">已上报</span>
            </div>
            <p className="text-sm text-gray-500">已上报住建局，交易流程全部完成</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">新增成交记录</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">客户 *</label>
                <select
                  value={newDeal.clientId}
                  onChange={(e) => setNewDeal({ ...newDeal, clientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择客户</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name} - {client.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房源编号 *</label>
                <input
                  type="text"
                  value={newDeal.propertyId}
                  onChange={(e) => setNewDeal({ ...newDeal, propertyId: e.target.value })}
                  placeholder="请输入房源编号"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房源名称 *</label>
                <input
                  type="text"
                  value={newDeal.propertyTitle}
                  onChange={(e) => setNewDeal({ ...newDeal, propertyTitle: e.target.value })}
                  placeholder="例如：万科城 3室2厅 精装修"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">成交价格（元）*</label>
                  <input
                    type="number"
                    value={newDeal.dealPrice}
                    onChange={(e) => setNewDeal({ ...newDeal, dealPrice: e.target.value })}
                    placeholder="请输入成交价格"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">成交日期 *</label>
                  <input
                    type="date"
                    value={newDeal.dealDate}
                    onChange={(e) => setNewDeal({ ...newDeal, dealDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">佣金费率 (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={newDeal.commissionRate}
                    onChange={(e) => setNewDeal({ ...newDeal, commissionRate: e.target.value })}
                    placeholder="2.0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                {newDeal.dealPrice && newDeal.commissionRate && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">预估佣金</span>
                      <span className="font-bold text-green-700">
                        {formatPrice(parseFloat(newDeal.dealPrice) * parseFloat(newDeal.commissionRate) / 100)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                取消
              </button>
              <button onClick={handleCreateDeal} className="btn-primary flex-1">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-600" />
                佣金计算器
              </h2>
              <button onClick={() => setShowCalculator(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成交价格（元）</label>
                <input
                  type="number"
                  value={commissionCalc.dealPrice}
                  onChange={(e) => setCommissionCalc({ ...commissionCalc, dealPrice: e.target.value })}
                  placeholder="请输入成交价格"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">佣金费率 (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={commissionCalc.commissionRate}
                    onChange={(e) => setCommissionCalc({ ...commissionCalc, commissionRate: e.target.value })}
                    placeholder="2.0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
              </div>
              <button
                onClick={calculateCommission}
                disabled={!commissionCalc.dealPrice}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                计算佣金
              </button>
              {commissionCalc.commission > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-green-600 mb-1">计算结果</div>
                    <div className="text-3xl font-bold text-green-700">
                      {formatPrice(commissionCalc.commission)}
                    </div>
                  </div>
                  {commissionCalc.breakdown.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-green-200">
                      {commissionCalc.breakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-green-700">{item.name}</span>
                          <span className="font-medium text-green-700">{formatPrice(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
