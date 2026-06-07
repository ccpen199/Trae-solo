import { useState, useEffect } from 'react';
import { Coins, Search, Filter, Plus, ArrowRight, Eye, Building2, Percent, Clock, CheckCircle2, FileText, Banknote, CreditCard, TrendingUp, Shield, ShieldCheck } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';

interface FinancialProduct {
  id: string;
  name: string;
  type: 'loan' | 'guarantee' | 'equity' | 'insurance';
  institution: string;
  maxAmount: string;
  interestRate: string;
  term: string;
  applyCount: number;
  status: 'active' | 'inactive';
  rating: number;
}

interface FinancingApplication {
  id: string;
  productName: string;
  enterpriseName: string;
  applyAmount: string;
  applyDate: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  progress: number;
}

export default function Finance() {
  const [products, setProducts] = useState<FinancialProduct[]>([]);
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'applications'>('products');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FinancialProduct | null>(null);
  const [applyForm, setApplyForm] = useState({
    enterpriseName: '',
    creditCode: '',
    applyAmount: '',
    usage: '',
    term: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, appsRes] = await Promise.all([
          fetch('/api/finance/products'),
          fetch('/api/finance/applications'),
        ]);

        const productsData = await productsRes.json().catch(() => [
          { id: '1', name: '粤企信用贷', type: 'loan' as const, institution: '中国工商银行广东省分行', maxAmount: '500万元', interestRate: '4.25%/年', term: '最长3年', applyCount: 1256, status: 'active' as const, rating: 4.8 },
          { id: '2', name: '科技型中小企业融资担保', type: 'guarantee' as const, institution: '广东省融资再担保有限公司', maxAmount: '300万元', interestRate: '1.5%/年', term: '最长2年', applyCount: 892, status: 'active' as const, rating: 4.7 },
          { id: '3', name: '专精特新企业股权投资', type: 'equity' as const, institution: '广东省产业发展基金', maxAmount: '5000万元', interestRate: '股权方式', term: '5-7年', applyCount: 234, status: 'active' as const, rating: 4.9 },
          { id: '4', name: '企业信用保险', type: 'insurance' as const, institution: '中国出口信用保险公司广东分公司', maxAmount: '2000万元', interestRate: '0.8%/年', term: '1年', applyCount: 567, status: 'active' as const, rating: 4.6 },
          { id: '5', name: '知识产权质押融资', type: 'loan' as const, institution: '中国建设银行广东省分行', maxAmount: '1000万元', interestRate: '4.85%/年', term: '最长3年', applyCount: 723, status: 'active' as const, rating: 4.7 },
          { id: '6', name: '供应链金融保理', type: 'loan' as const, institution: '平安银行广州分行', maxAmount: '2000万元', interestRate: '5.15%/年', term: '最长1年', applyCount: 445, status: 'active' as const, rating: 4.5 },
        ]);

        const appsData = await appsRes.json().catch(() => [
          { id: '1', productName: '粤企信用贷', enterpriseName: '广东科技有限公司', applyAmount: '200万元', applyDate: '2024-01-15', status: 'processing' as const, progress: 60 },
          { id: '2', productName: '科技型中小企业融资担保', enterpriseName: '深圳市创新科技集团', applyAmount: '150万元', applyDate: '2024-01-14', status: 'approved' as const, progress: 100 },
          { id: '3', productName: '知识产权质押融资', enterpriseName: '广州智能制造股份公司', applyAmount: '500万元', applyDate: '2024-01-13', status: 'pending' as const, progress: 20 },
          { id: '4', productName: '专精特新企业股权投资', enterpriseName: '佛山新材料有限公司', applyAmount: '2000万元', applyDate: '2024-01-12', status: 'rejected' as const, progress: 0 },
          { id: '5', productName: '供应链金融保理', enterpriseName: '东莞电子科技有限公司', applyAmount: '800万元', applyDate: '2024-01-11', status: 'processing' as const, progress: 80 },
        ]);

        setProducts(productsData);
        setApplications(appsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.institution.includes(searchTerm);
    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredApplications = applications.filter((item) => {
    const matchesSearch = item.productName.includes(searchTerm) || item.enterpriseName.includes(searchTerm);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const typeIcons: Record<string, React.ReactNode> = {
    loan: <Banknote className="w-5 h-5" />,
    guarantee: <Shield className="w-5 h-5" />,
    equity: <TrendingUp className="w-5 h-5" />,
    insurance: <ShieldCheck className="w-5 h-5" />,
  };

  const typeLabels: Record<string, string> = {
    loan: '贷款产品',
    guarantee: '担保产品',
    equity: '股权融资',
    insurance: '保险产品',
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

  const handleApply = (product: FinancialProduct) => {
    setSelectedProduct(product);
    setIsApplyModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!applyForm.enterpriseName.trim()) errors.enterpriseName = '请输入企业名称';
    if (!applyForm.creditCode.trim()) errors.creditCode = '请输入统一社会信用代码';
    if (applyForm.creditCode && applyForm.creditCode.length !== 18) errors.creditCode = '统一社会信用代码应为18位';
    if (!applyForm.applyAmount.trim()) errors.applyAmount = '请输入申请金额';
    if (!applyForm.usage.trim()) errors.usage = '请输入资金用途';
    if (!applyForm.term) errors.term = '请选择融资期限';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitApplication = () => {
    if (!validateForm()) return;
    const newApp: FinancingApplication = {
      id: String(Date.now()),
      productName: selectedProduct?.name || '',
      enterpriseName: applyForm.enterpriseName,
      applyAmount: applyForm.applyAmount,
      applyDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      progress: 10,
    };
    setApplications([newApp, ...applications]);
    setIsApplyModalOpen(false);
    setApplyForm({ enterpriseName: '', creditCode: '', applyAmount: '', usage: '', term: '' });
    setFormErrors({});
    setActiveTab('applications');
  };

  const productColumns = [
    {
      key: 'name',
      label: '产品名称',
      className: 'min-w-[200px]',
      render: (row: FinancialProduct) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            row.type === 'loan' && 'bg-blue-100 text-blue-600',
            row.type === 'guarantee' && 'bg-green-100 text-green-600',
            row.type === 'equity' && 'bg-purple-100 text-purple-600',
            row.type === 'insurance' && 'bg-orange-100 text-orange-600',
          )}>
            {typeIcons[row.type]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{typeLabels[row.type]}</p>
          </div>
        </div>
      ),
    },
    { key: 'institution', label: '金融机构' },
    {
      key: 'maxAmount',
      label: '最高额度',
      render: (row: FinancialProduct) => (
        <span className="font-semibold text-[#1a56db]">{row.maxAmount}</span>
      ),
    },
    {
      key: 'interestRate',
      label: '利率/费率',
      render: (row: FinancialProduct) => (
        <span className="font-medium text-green-600 flex items-center gap-1">
          <Percent className="w-4 h-4" />
          {row.interestRate}
        </span>
      ),
    },
    { key: 'term', label: '融资期限' },
    {
      key: 'rating',
      label: '评分',
      render: (row: FinancialProduct) => renderStars(row.rating),
    },
    {
      key: 'applyCount',
      label: '已申请',
      render: (row: FinancialProduct) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
          {row.applyCount} 次
        </span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      render: (row: FinancialProduct) => (
        <StatusBadge status={row.status === 'active' ? 'active' : 'expired'}>
          {row.status === 'active' && '可申请'}
          {row.status === 'inactive' && '已下线'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: FinancialProduct) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleApply(row)}
            className="text-[#1a56db] hover:underline text-sm flex items-center gap-1"
          >
            立即申请 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const applicationColumns = [
    { key: 'id', label: '申请编号' },
    { key: 'productName', label: '金融产品' },
    { key: 'enterpriseName', label: '申请企业' },
    {
      key: 'applyAmount',
      label: '申请金额',
      render: (row: FinancingApplication) => (
        <span className="font-semibold text-[#1a56db]">{row.applyAmount}</span>
      ),
    },
    { key: 'applyDate', label: '申请日期' },
    {
      key: 'progress',
      label: '进度',
      render: (row: FinancingApplication) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                row.status === 'approved' ? 'bg-green-500' : row.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${row.progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态',
      render: (row: FinancingApplication) => (
        <StatusBadge status={row.status}>
          {row.status === 'pending' && '待审核'}
          {row.status === 'processing' && '审批中'}
          {row.status === 'approved' && '已通过'}
          {row.status === 'rejected' && '已拒绝'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: () => (
        <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
          查看详情 <ArrowRight className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const totalApproved = applications.filter(a => a.status === 'approved').reduce((sum, a) => {
    const amount = parseInt(a.applyAmount.replace(/,/g, '').replace('万元', ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">金融服务</h1>
        <p className="page-description">金融服务撮合中心，助力企业融资对接</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="金融产品总数" value={products.length} icon={Coins} iconColor="text-blue-600" />
        <StatsCard title="本月新增申请" value="256" icon={FileText} iconColor="text-green-600" />
        <StatsCard title="累计放款金额" value={`${totalApproved.toLocaleString()}万元`} icon={CreditCard} iconColor="text-purple-600" />
        <StatsCard title="合作金融机构" value="28" icon={Building2} iconColor="text-orange-600" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              金融产品
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'applications' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              申请记录
            </button>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {activeTab === 'products' ? '发布产品' : '快速申请'}
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`搜索${activeTab === 'products' ? '产品名称或金融机构' : '产品或企业名称'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {activeTab === 'products' && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="">全部类型</option>
                <option value="loan">贷款产品</option>
                <option value="guarantee">担保产品</option>
                <option value="equity">股权融资</option>
                <option value="insurance">保险产品</option>
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部状态</option>
              {activeTab === 'products' ? (
                <>
                  <option value="active">可申请</option>
                  <option value="inactive">已下线</option>
                </>
              ) : (
                <>
                  <option value="pending">待审核</option>
                  <option value="processing">审批中</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={(activeTab === 'products' ? productColumns : applicationColumns) as any}
        data={(activeTab === 'products' ? filteredProducts : filteredApplications) as any}
        loading={loading}
      />

      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => { setIsApplyModalOpen(false); setFormErrors({}); }}
        title="申请融资"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setIsApplyModalOpen(false); setFormErrors({}); }} className="btn-secondary">取消</button>
            <button onClick={submitApplication} className="btn-primary">提交申请</button>
          </div>
        }
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900">{selectedProduct.name}</h3>
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-blue-600">最高额度</span>
                  <p className="font-semibold text-blue-900">{selectedProduct.maxAmount}</p>
                </div>
                <div>
                  <span className="text-blue-600">利率/费率</span>
                  <p className="font-semibold text-blue-900">{selectedProduct.interestRate}</p>
                </div>
                <div>
                  <span className="text-blue-600">融资期限</span>
                  <p className="font-semibold text-blue-900">{selectedProduct.term}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">企业名称</label>
                  <input
                    type="text"
                    value={applyForm.enterpriseName}
                    onChange={(e) => setApplyForm({ ...applyForm, enterpriseName: e.target.value })}
                    placeholder="请输入企业名称"
                    className={`input-field ${formErrors.enterpriseName ? 'border-red-300' : ''}`}
                  />
                  {formErrors.enterpriseName && <p className="mt-1 text-sm text-red-600">{formErrors.enterpriseName}</p>}
                </div>
                <div className="col-span-2">
                  <label className="form-label">统一社会信用代码</label>
                  <input
                    type="text"
                    value={applyForm.creditCode}
                    onChange={(e) => setApplyForm({ ...applyForm, creditCode: e.target.value })}
                    placeholder="请输入18位统一社会信用代码"
                    maxLength={18}
                    className={`input-field ${formErrors.creditCode ? 'border-red-300' : ''}`}
                  />
                  {formErrors.creditCode && <p className="mt-1 text-sm text-red-600">{formErrors.creditCode}</p>}
                </div>
                <div>
                  <label className="form-label">申请金额（万元）</label>
                  <input
                    type="text"
                    value={applyForm.applyAmount}
                    onChange={(e) => setApplyForm({ ...applyForm, applyAmount: e.target.value })}
                    placeholder="请输入申请金额"
                    className={`input-field ${formErrors.applyAmount ? 'border-red-300' : ''}`}
                  />
                  {formErrors.applyAmount && <p className="mt-1 text-sm text-red-600">{formErrors.applyAmount}</p>}
                </div>
                <div>
                  <label className="form-label">融资期限</label>
                  <select
                    value={applyForm.term}
                    onChange={(e) => setApplyForm({ ...applyForm, term: e.target.value })}
                    className={`input-field ${formErrors.term ? 'border-red-300' : ''}`}
                  >
                    <option value="">请选择期限</option>
                    <option value="6个月">6个月</option>
                    <option value="1年">1年</option>
                    <option value="2年">2年</option>
                    <option value="3年">3年</option>
                    <option value="5年">5年</option>
                  </select>
                  {formErrors.term && <p className="mt-1 text-sm text-red-600">{formErrors.term}</p>}
                </div>
              </div>
              <div>
                <label className="form-label">资金用途</label>
                <textarea
                  rows={3}
                  value={applyForm.usage}
                  onChange={(e) => setApplyForm({ ...applyForm, usage: e.target.value })}
                  placeholder="请详细说明资金用途..."
                  className={`input-field ${formErrors.usage ? 'border-red-300' : ''}`}
                />
                {formErrors.usage && <p className="mt-1 text-sm text-red-600">{formErrors.usage}</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
