import { useState, useEffect } from 'react';
import { FileCheck, Search, Filter, Plus, ArrowRight, FileText, Calendar, Tag, Lightbulb, Eye, Download } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';

interface Policy {
  id: string;
  title: string;
  category: string;
  department: string;
  publishDate: string;
  validUntil: string;
  status: 'active' | 'expired' | 'draft';
  matchScore?: number;
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [matchedPolicies, setMatchedPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'matched'>('all');
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchForm, setMatchForm] = useState({
    industry: '',
    scale: '',
    region: '',
    type: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/policies');
        const data = await res.json().catch(() => [
          { id: '1', title: '关于推动广东省制造业高质量发展的若干政策', category: '产业政策', department: '工信厅', publishDate: '2024-01-01', validUntil: '2026-12-31', status: 'active' as const },
          { id: '2', title: '广东省高新技术企业认定管理办法实施细则', category: '科技政策', department: '科技厅', publishDate: '2023-12-15', validUntil: '2025-12-31', status: 'active' as const },
          { id: '3', title: '关于促进中小企业融资的实施意见', category: '金融政策', department: '地方金融监管局', publishDate: '2023-11-20', validUntil: '2024-12-31', status: 'active' as const },
          { id: '4', title: '广东省技术改造专项资金管理办法', category: '财政政策', department: '财政厅', publishDate: '2023-10-01', validUntil: '2025-10-01', status: 'active' as const },
          { id: '5', title: '关于加快发展数字经济的实施意见', category: '产业政策', department: '发改局', publishDate: '2023-09-15', validUntil: '2023-12-31', status: 'expired' as const },
          { id: '6', title: '广东省专精特新中小企业培育实施方案', category: '产业政策', department: '工信厅', publishDate: '2023-08-10', validUntil: '2025-08-10', status: 'active' as const },
          { id: '7', title: '关于支持企业科技创新的税收优惠政策', category: '税收政策', department: '税务局', publishDate: '2023-07-01', validUntil: '2027-12-31', status: 'active' as const },
          { id: '8', title: '广东省知识产权质押融资风险补偿机制', category: '金融政策', department: '市场监管局', publishDate: '2024-01-10', validUntil: '2026-01-10', status: 'draft' as const },
        ]);
        setPolicies(data);
        setMatchedPolicies(data.slice(0, 3).map(p => ({ ...p, matchScore: Math.floor(Math.random() * 30) + 70 })));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPolicies = (activeTab === 'all' ? policies : matchedPolicies).filter((item) => {
    const matchesSearch = item.title.includes(searchTerm) || item.department.includes(searchTerm);
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleMatch = () => {
    const matched = policies
      .filter(p => p.status === 'active')
      .slice(0, 5)
      .map(p => ({ ...p, matchScore: Math.floor(Math.random() * 30) + 70 }))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    setMatchedPolicies(matched);
    setIsMatchModalOpen(false);
    setActiveTab('matched');
  };

  const columns = [
    { key: 'title', label: '政策名称', className: 'min-w-[300px]' },
    { key: 'category', label: '政策类别' },
    { key: 'department', label: '发布部门' },
    { key: 'publishDate', label: '发布日期' },
    { key: 'validUntil', label: '有效期至' },
    {
      key: 'matchScore',
      label: '匹配度',
      render: (row: Policy) => row.matchScore !== undefined ? (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              style={{ width: `${row.matchScore}%` }}
            />
          </div>
          <span className="text-sm font-medium text-emerald-600">{row.matchScore}%</span>
        </div>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      key: 'status',
      label: '状态',
      render: (row: Policy) => (
        <StatusBadge status={row.status}>
          {row.status === 'active' && '有效'}
          {row.status === 'expired' && '已过期'}
          {row.status === 'draft' && '待发布'}
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
          <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            立即申报 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">政策匹配</h1>
        <p className="page-description">智能匹配适合您企业的惠企政策，享受政策红利</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="有效政策总数" value="256" icon={FileCheck} iconColor="text-blue-600" />
        <StatsCard title="今日新增政策" value="12" icon={FileText} iconColor="text-green-600" />
        <StatsCard title="本月到期政策" value="28" icon={Calendar} iconColor="text-orange-600" />
        <StatsCard title="已匹配政策" value={matchedPolicies.length} icon={Lightbulb} iconColor="text-purple-600" />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              全部政策
            </button>
            <button
              onClick={() => setActiveTab('matched')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'matched' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              为我匹配
            </button>
          </div>
          <button onClick={() => setIsMatchModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Tag className="w-5 h-5" />
            智能匹配
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索政策名称或发布部门..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部类别</option>
              <option value="产业政策">产业政策</option>
              <option value="科技政策">科技政策</option>
              <option value="金融政策">金融政策</option>
              <option value="财政政策">财政政策</option>
              <option value="税收政策">税收政策</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部状态</option>
              <option value="active">有效</option>
              <option value="expired">已过期</option>
              <option value="draft">待发布</option>
            </select>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            发布政策
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredPolicies} loading={loading} />

      <Modal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        title="智能政策匹配"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsMatchModalOpen(false)} className="btn-secondary">取消</button>
            <button onClick={handleMatch} className="btn-primary">开始匹配</button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-sm mb-4">请填写您的企业信息，系统将为您智能匹配适用的政策</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">所属行业</label>
              <select
                value={matchForm.industry}
                onChange={(e) => setMatchForm({ ...matchForm, industry: e.target.value })}
                className="input-field"
              >
                <option value="">请选择行业</option>
                <option value="信息技术">信息技术</option>
                <option value="先进制造">先进制造</option>
                <option value="智能制造">智能制造</option>
                <option value="新材料">新材料</option>
                <option value="生物医药">生物医药</option>
                <option value="新能源">新能源</option>
              </select>
            </div>
            <div>
              <label className="form-label">企业规模</label>
              <select
                value={matchForm.scale}
                onChange={(e) => setMatchForm({ ...matchForm, scale: e.target.value })}
                className="input-field"
              >
                <option value="">请选择规模</option>
                <option value="大型">大型</option>
                <option value="中型">中型</option>
                <option value="小型">小型</option>
                <option value="微型">微型</option>
              </select>
            </div>
            <div>
              <label className="form-label">所在地区</label>
              <select
                value={matchForm.region}
                onChange={(e) => setMatchForm({ ...matchForm, region: e.target.value })}
                className="input-field"
              >
                <option value="">请选择地区</option>
                <option value="广州市">广州市</option>
                <option value="深圳市">深圳市</option>
                <option value="珠海市">珠海市</option>
                <option value="佛山市">佛山市</option>
                <option value="东莞市">东莞市</option>
              </select>
            </div>
            <div>
              <label className="form-label">企业类型</label>
              <select
                value={matchForm.type}
                onChange={(e) => setMatchForm({ ...matchForm, type: e.target.value })}
                className="input-field"
              >
                <option value="">请选择类型</option>
                <option value="高新技术企业">高新技术企业</option>
                <option value="专精特新企业">专精特新企业</option>
                <option value="科技型中小企业">科技型中小企业</option>
                <option value="国有企业">国有企业</option>
                <option value="民营企业">民营企业</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
