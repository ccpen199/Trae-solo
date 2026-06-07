import { useState, useEffect } from 'react';
import { Link2, Search, Filter, Plus, ArrowRight, Eye, Building2, TrendingUp, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';

interface SupplyChainPartner {
  id: string;
  enterpriseName: string;
  industry: string;
  type: 'supplier' | 'buyer' | 'logistics' | 'finance';
  region: string;
  cooperationCount: number;
  rating: number;
  status: 'active' | 'pending' | 'inactive';
}

interface SupplyChainDemand {
  id: string;
  title: string;
  enterpriseName: string;
  category: string;
  quantity: string;
  deadline: string;
  status: 'open' | 'matched' | 'closed';
  publishDate: string;
}

export default function SupplyChain() {
  const [partners, setPartners] = useState<SupplyChainPartner[]>([]);
  const [demands, setDemands] = useState<SupplyChainDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'partners' | 'demands'>('partners');
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    enterpriseName: '',
    industry: '',
    type: '',
    region: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnersRes, demandsRes] = await Promise.all([
          fetch('/api/supply-chain/partners'),
          fetch('/api/supply-chain/demands'),
        ]);

        const partnersData = await partnersRes.json().catch(() => [
          { id: '1', enterpriseName: '广东科技有限公司', industry: '信息技术', type: 'supplier' as const, region: '广州市', cooperationCount: 156, rating: 4.9, status: 'active' as const },
          { id: '2', enterpriseName: '深圳市创新科技集团', industry: '先进制造', type: 'buyer' as const, region: '深圳市', cooperationCount: 89, rating: 4.8, status: 'active' as const },
          { id: '3', enterpriseName: '广州物流集团股份公司', industry: '物流服务', type: 'logistics' as const, region: '广州市', cooperationCount: 234, rating: 4.7, status: 'active' as const },
          { id: '4', enterpriseName: '佛山新材料有限公司', industry: '新材料', type: 'supplier' as const, region: '佛山市', cooperationCount: 67, rating: 4.5, status: 'pending' as const },
          { id: '5', enterpriseName: '东莞电子制造有限公司', industry: '电子信息', type: 'buyer' as const, region: '东莞市', cooperationCount: 112, rating: 4.6, status: 'active' as const },
          { id: '6', enterpriseName: '广东金融租赁有限公司', industry: '金融服务', type: 'finance' as const, region: '广州市', cooperationCount: 45, rating: 4.8, status: 'active' as const },
        ]);

        const demandsData = await demandsRes.json().catch(() => [
          { id: '1', title: '采购高端芯片10万片', enterpriseName: '深圳市创新科技集团', category: '电子元器件', quantity: '100,000片', deadline: '2024-02-28', status: 'open' as const, publishDate: '2024-01-15' },
          { id: '2', title: '寻求精密零部件供应商', enterpriseName: '广州智能制造股份公司', category: '机械零部件', quantity: '50,000件', deadline: '2024-02-20', status: 'matched' as const, publishDate: '2024-01-14' },
          { id: '3', title: '原材料铝锭采购', enterpriseName: '佛山新材料有限公司', category: '金属材料', quantity: '2,000吨', deadline: '2024-02-15', status: 'open' as const, publishDate: '2024-01-13' },
          { id: '4', title: '物流运输服务招标', enterpriseName: '广东科技有限公司', category: '物流服务', quantity: '年度合同', deadline: '2024-02-10', status: 'closed' as const, publishDate: '2024-01-12' },
          { id: '5', title: '供应链金融服务需求', enterpriseName: '东莞电子制造有限公司', category: '金融服务', quantity: '5,000万元', deadline: '2024-03-01', status: 'open' as const, publishDate: '2024-01-11' },
        ]);

        setPartners(partnersData);
        setDemands(demandsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPartners = partners.filter((item) => {
    const matchesSearch = item.enterpriseName.includes(searchTerm) || item.industry.includes(searchTerm);
    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredDemands = demands.filter((item) => {
    const matchesSearch = item.title.includes(searchTerm) || item.enterpriseName.includes(searchTerm);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const typeLabels: Record<string, string> = {
    supplier: '供应商',
    buyer: '采购商',
    logistics: '物流商',
    finance: '金融服务商',
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={cn(
              'text-sm',
              star <= Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300'
            )}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newPartner.enterpriseName.trim()) errors.enterpriseName = '请输入企业名称';
    if (!newPartner.industry) errors.industry = '请选择所属行业';
    if (!newPartner.type) errors.type = '请选择合作类型';
    if (!newPartner.region) errors.region = '请选择所在地区';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPartner = () => {
    if (!validateForm()) return;
    const partner: SupplyChainPartner = {
      id: String(Date.now()),
      ...newPartner,
      type: newPartner.type as SupplyChainPartner['type'],
      cooperationCount: 0,
      rating: 0,
      status: 'pending',
    };
    setPartners([partner, ...partners]);
    setIsAddPartnerModalOpen(false);
    setNewPartner({ enterpriseName: '', industry: '', type: '', region: '' });
    setFormErrors({});
  };

  const partnerColumns = [
    { key: 'enterpriseName', label: '企业名称', className: 'min-w-[200px]' },
    { key: 'industry', label: '所属行业' },
    {
      key: 'type',
      label: '合作类型',
      render: (row: SupplyChainPartner) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
          {typeLabels[row.type]}
        </span>
      ),
    },
    { key: 'region', label: '所在地区' },
    { key: 'cooperationCount', label: '合作次数' },
    {
      key: 'rating',
      label: '信用评分',
      render: (row: SupplyChainPartner) => renderStars(row.rating),
    },
    {
      key: 'status',
      label: '状态',
      render: (row: SupplyChainPartner) => (
        <StatusBadge status={row.status}>
          {row.status === 'active' && '已认证'}
          {row.status === 'pending' && '待审核'}
          {row.status === 'inactive' && '已暂停'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            发起合作 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const demandColumns = [
    { key: 'title', label: '需求标题', className: 'min-w-[250px]' },
    { key: 'enterpriseName', label: '发布企业' },
    { key: 'category', label: '类别' },
    { key: 'quantity', label: '数量/规模' },
    { key: 'deadline', label: '截止日期' },
    {
      key: 'status',
      label: '状态',
      render: (row: SupplyChainDemand) => (
        <StatusBadge status={row.status === 'open' ? 'active' : row.status === 'matched' ? 'processing' : 'resolved'}>
          {row.status === 'open' && '征集中'}
          {row.status === 'matched' && '已匹配'}
          {row.status === 'closed' && '已结束'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            响应需求 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">供应链管理</h1>
        <p className="page-description">供应链上下游企业对接与协同管理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="合作企业总数" value={partners.length} icon={Building2} iconColor="text-blue-600" />
        <StatsCard title="活跃需求数" value={demands.filter(d => d.status === 'open').length} icon={Package} iconColor="text-green-600" />
        <StatsCard title="本月合作次数" value="156" icon={TrendingUp} iconColor="text-purple-600" />
        <StatsCard title="待审核合作" value={partners.filter(p => p.status === 'pending').length} icon={AlertTriangle} iconColor="text-orange-600" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'partners' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              合作伙伴
            </button>
            <button
              onClick={() => setActiveTab('demands')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'demands' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              供需信息
            </button>
          </div>
          <button
            onClick={() => setIsAddPartnerModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'partners' ? '添加合作伙伴' : '发布需求'}
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`搜索${activeTab === 'partners' ? '企业名称或行业' : '需求标题或企业'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {activeTab === 'partners' && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="">全部类型</option>
                <option value="supplier">供应商</option>
                <option value="buyer">采购商</option>
                <option value="logistics">物流商</option>
                <option value="finance">金融服务商</option>
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部状态</option>
              {activeTab === 'partners' ? (
                <>
                  <option value="active">已认证</option>
                  <option value="pending">待审核</option>
                  <option value="inactive">已暂停</option>
                </>
              ) : (
                <>
                  <option value="open">征集中</option>
                  <option value="matched">已匹配</option>
                  <option value="closed">已结束</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={(activeTab === 'partners' ? partnerColumns : demandColumns) as any}
        data={(activeTab === 'partners' ? filteredPartners : filteredDemands) as any}
        loading={loading}
      />

      <Modal
        isOpen={isAddPartnerModalOpen}
        onClose={() => { setIsAddPartnerModalOpen(false); setFormErrors({}); }}
        title={activeTab === 'partners' ? '添加合作伙伴' : '发布供需需求'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setIsAddPartnerModalOpen(false); setFormErrors({}); }} className="btn-secondary">取消</button>
            <button onClick={handleAddPartner} className="btn-primary">{activeTab === 'partners' ? '确认添加' : '确认发布'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {activeTab === 'partners' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">企业名称</label>
                <input
                  type="text"
                  value={newPartner.enterpriseName}
                  onChange={(e) => setNewPartner({ ...newPartner, enterpriseName: e.target.value })}
                  placeholder="请输入企业名称"
                  className={`input-field ${formErrors.enterpriseName ? 'border-red-300' : ''}`}
                />
                {formErrors.enterpriseName && <p className="mt-1 text-sm text-red-600">{formErrors.enterpriseName}</p>}
              </div>
              <div>
                <label className="form-label">所属行业</label>
                <select
                  value={newPartner.industry}
                  onChange={(e) => setNewPartner({ ...newPartner, industry: e.target.value })}
                  className={`input-field ${formErrors.industry ? 'border-red-300' : ''}`}
                >
                  <option value="">请选择行业</option>
                  <option value="信息技术">信息技术</option>
                  <option value="先进制造">先进制造</option>
                  <option value="智能制造">智能制造</option>
                  <option value="新材料">新材料</option>
                  <option value="电子信息">电子信息</option>
                  <option value="物流服务">物流服务</option>
                  <option value="金融服务">金融服务</option>
                </select>
                {formErrors.industry && <p className="mt-1 text-sm text-red-600">{formErrors.industry}</p>}
              </div>
              <div>
                <label className="form-label">合作类型</label>
                <select
                  value={newPartner.type}
                  onChange={(e) => setNewPartner({ ...newPartner, type: e.target.value })}
                  className={`input-field ${formErrors.type ? 'border-red-300' : ''}`}
                >
                  <option value="">请选择类型</option>
                  <option value="supplier">供应商</option>
                  <option value="buyer">采购商</option>
                  <option value="logistics">物流商</option>
                  <option value="finance">金融服务商</option>
                </select>
                {formErrors.type && <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>}
              </div>
              <div>
                <label className="form-label">所在地区</label>
                <select
                  value={newPartner.region}
                  onChange={(e) => setNewPartner({ ...newPartner, region: e.target.value })}
                  className={`input-field ${formErrors.region ? 'border-red-300' : ''}`}
                >
                  <option value="">请选择地区</option>
                  <option value="广州市">广州市</option>
                  <option value="深圳市">深圳市</option>
                  <option value="佛山市">佛山市</option>
                  <option value="东莞市">东莞市</option>
                  <option value="惠州市">惠州市</option>
                  <option value="珠海市">珠海市</option>
                </select>
                {formErrors.region && <p className="mt-1 text-sm text-red-600">{formErrors.region}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="form-label">需求标题</label>
                <input type="text" placeholder="请简要描述您的需求" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">需求类别</label>
                  <select className="input-field">
                    <option value="">请选择类别</option>
                    <option value="电子元器件">电子元器件</option>
                    <option value="机械零部件">机械零部件</option>
                    <option value="金属材料">金属材料</option>
                    <option value="化工原料">化工原料</option>
                    <option value="物流服务">物流服务</option>
                    <option value="金融服务">金融服务</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">数量/规模</label>
                  <input type="text" placeholder="请输入数量或规模" className="input-field" />
                </div>
                <div>
                  <label className="form-label">截止日期</label>
                  <input type="date" className="input-field" />
                </div>
              </div>
              <div>
                <label className="form-label">需求详情</label>
                <textarea rows={4} placeholder="请详细描述您的需求..." className="input-field" />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
