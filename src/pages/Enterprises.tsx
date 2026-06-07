import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Filter, ArrowRight, Edit2, Trash2, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  industry: string;
  scale: string;
  region: string;
  status: 'active' | 'inactive' | 'pending';
  registerDate: string;
}

export default function Enterprises() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    creditCode: '',
    industry: '',
    scale: '',
    region: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/enterprises');
        const data = await res.json().catch(() => [
          { id: '1', name: '广东科技有限公司', creditCode: '91440000MA58XXXXXX', industry: '信息技术', scale: '中型', region: '广州市', status: 'active' as const, registerDate: '2020-01-15' },
          { id: '2', name: '深圳市创新科技集团', creditCode: '91440300MA5DXXXXXX', industry: '先进制造', scale: '大型', region: '深圳市', status: 'active' as const, registerDate: '2018-06-20' },
          { id: '3', name: '广州智能制造股份公司', creditCode: '91440100MA59XXXXXX', industry: '智能制造', scale: '大型', region: '广州市', status: 'active' as const, registerDate: '2015-03-10' },
          { id: '4', name: '佛山新材料有限公司', creditCode: '91440600MA5UXXXXXX', industry: '新材料', scale: '中型', region: '佛山市', status: 'pending' as const, registerDate: '2021-08-05' },
          { id: '5', name: '东莞电子科技有限公司', creditCode: '91441900MA52XXXXXX', industry: '电子信息', scale: '小型', region: '东莞市', status: 'active' as const, registerDate: '2019-11-22' },
          { id: '6', name: '珠海生物医药股份公司', creditCode: '91440400MA5LXXXXXX', industry: '生物医药', scale: '中型', region: '珠海市', status: 'inactive' as const, registerDate: '2017-04-18' },
          { id: '7', name: '惠州新能源有限公司', creditCode: '91441300MA5MXXXXXX', industry: '新能源', scale: '大型', region: '惠州市', status: 'active' as const, registerDate: '2016-09-30' },
          { id: '8', name: '中山精密制造有限公司', creditCode: '91442000MA5NXXXXXX', industry: '精密制造', scale: '小型', region: '中山市', status: 'pending' as const, registerDate: '2022-02-14' },
        ]);
        setEnterprises(data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = enterprises.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.creditCode.includes(searchTerm);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesIndustry = !industryFilter || item.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入企业名称';
    if (!formData.creditCode.trim()) newErrors.creditCode = '请输入统一社会信用代码';
    if (formData.creditCode && formData.creditCode.length !== 18) newErrors.creditCode = '统一社会信用代码应为18位';
    if (!formData.industry) newErrors.industry = '请选择所属行业';
    if (!formData.scale) newErrors.scale = '请选择企业规模';
    if (!formData.region) newErrors.region = '请选择所在地区';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const newEnterprise: Enterprise = {
      id: String(Date.now()),
      ...formData,
      status: 'pending',
      registerDate: new Date().toISOString().split('T')[0],
    };
    setEnterprises([newEnterprise, ...enterprises]);
    setIsAddModalOpen(false);
    setFormData({ name: '', creditCode: '', industry: '', scale: '', region: '' });
    setErrors({});
  };

  const columns = [
    { key: 'name', label: '企业名称' },
    { key: 'creditCode', label: '统一社会信用代码' },
    { key: 'industry', label: '所属行业' },
    { key: 'scale', label: '企业规模' },
    { key: 'region', label: '所在地区' },
    {
      key: 'status',
      label: '状态',
      render: (row: Enterprise) => (
        <StatusBadge status={row.status}>
          {row.status === 'active' && '正常'}
          {row.status === 'inactive' && '已注销'}
          {row.status === 'pending' && '待审核'}
        </StatusBadge>
      ),
    },
    { key: 'registerDate', label: '注册日期' },
    {
      key: 'actions',
      label: '操作',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1 ml-2">
            详情 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">企业管理</h1>
        <p className="page-description">管理和维护全省涉企服务企业信息库</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索企业名称或统一社会信用代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部状态</option>
              <option value="active">正常</option>
              <option value="inactive">已注销</option>
              <option value="pending">待审核</option>
            </select>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部行业</option>
              <option value="信息技术">信息技术</option>
              <option value="先进制造">先进制造</option>
              <option value="智能制造">智能制造</option>
              <option value="新材料">新材料</option>
              <option value="电子信息">电子信息</option>
              <option value="生物医药">生物医药</option>
              <option value="新能源">新能源</option>
            </select>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            新增企业
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={loading} />

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setErrors({}); }}
        title="新增企业"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setIsAddModalOpen(false); setErrors({}); }} className="btn-secondary">取消</button>
            <button onClick={handleSubmit} className="btn-primary">确认添加</button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">企业名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入企业名称"
              className={`input-field ${errors.name ? 'border-red-300' : ''}`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div className="col-span-2">
            <label className="form-label">统一社会信用代码</label>
            <input
              type="text"
              value={formData.creditCode}
              onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
              placeholder="请输入18位统一社会信用代码"
              className={`input-field ${errors.creditCode ? 'border-red-300' : ''}`}
              maxLength={18}
            />
            {errors.creditCode && <p className="mt-1 text-sm text-red-600">{errors.creditCode}</p>}
          </div>
          <div>
            <label className="form-label">所属行业</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className={`input-field ${errors.industry ? 'border-red-300' : ''}`}
            >
              <option value="">请选择行业</option>
              <option value="信息技术">信息技术</option>
              <option value="先进制造">先进制造</option>
              <option value="智能制造">智能制造</option>
              <option value="新材料">新材料</option>
              <option value="电子信息">电子信息</option>
              <option value="生物医药">生物医药</option>
              <option value="新能源">新能源</option>
            </select>
            {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
          </div>
          <div>
            <label className="form-label">企业规模</label>
            <select
              value={formData.scale}
              onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
              className={`input-field ${errors.scale ? 'border-red-300' : ''}`}
            >
              <option value="">请选择规模</option>
              <option value="大型">大型</option>
              <option value="中型">中型</option>
              <option value="小型">小型</option>
              <option value="微型">微型</option>
            </select>
            {errors.scale && <p className="mt-1 text-sm text-red-600">{errors.scale}</p>}
          </div>
          <div>
            <label className="form-label">所在地区</label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className={`input-field ${errors.region ? 'border-red-300' : ''}`}
            >
              <option value="">请选择地区</option>
              <option value="广州市">广州市</option>
              <option value="深圳市">深圳市</option>
              <option value="珠海市">珠海市</option>
              <option value="佛山市">佛山市</option>
              <option value="东莞市">东莞市</option>
              <option value="中山市">中山市</option>
              <option value="惠州市">惠州市</option>
            </select>
            {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
