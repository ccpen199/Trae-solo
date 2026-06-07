import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, ArrowRight, FileCheck, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';

interface Service {
  id: string;
  name: string;
  category: string;
  department: string;
  handlingTime: string;
  applicationCount: number;
  status: 'active' | 'inactive' | 'pending';
}

interface Application {
  id: string;
  serviceName: string;
  enterpriseName: string;
  submitDate: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'applications'>('services');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, appsRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/services/applications'),
        ]);

        const servicesData = await servicesRes.json().catch(() => [
          { id: '1', name: '高新技术企业认定', category: '资质认定', department: '科技厅', handlingTime: '15个工作日', applicationCount: 1256, status: 'active' as const },
          { id: '2', name: '专精特新企业申报', category: '资质认定', department: '工信厅', handlingTime: '20个工作日', applicationCount: 892, status: 'active' as const },
          { id: '3', name: '技术改造补贴申请', category: '补贴申请', department: '工信厅', handlingTime: '10个工作日', applicationCount: 2341, status: 'active' as const },
          { id: '4', name: '研发费用加计扣除', category: '税收优惠', department: '税务局', handlingTime: '7个工作日', applicationCount: 5623, status: 'active' as const },
          { id: '5', name: '进出口经营权备案', category: '备案登记', department: '商务厅', handlingTime: '5个工作日', applicationCount: 1876, status: 'active' as const },
          { id: '6', name: '知识产权质押融资', category: '金融服务', department: '市场监管局', handlingTime: '10个工作日', applicationCount: 456, status: 'pending' as const },
        ]);

        const appsData = await appsRes.json().catch(() => [
          { id: '1', serviceName: '高新技术企业认定', enterpriseName: '广东科技有限公司', submitDate: '2024-01-15', status: 'processing' as const },
          { id: '2', serviceName: '专精特新企业申报', enterpriseName: '深圳市创新科技集团', submitDate: '2024-01-14', status: 'approved' as const },
          { id: '3', serviceName: '技术改造补贴申请', enterpriseName: '广州智能制造股份公司', submitDate: '2024-01-14', status: 'pending' as const },
          { id: '4', serviceName: '研发费用加计扣除', enterpriseName: '佛山新材料有限公司', submitDate: '2024-01-13', status: 'rejected' as const },
          { id: '5', serviceName: '进出口经营权备案', enterpriseName: '东莞电子科技有限公司', submitDate: '2024-01-12', status: 'approved' as const },
        ]);

        setServices(servicesData);
        setApplications(appsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredServices = services.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.department.includes(searchTerm);
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const serviceColumns = [
    { key: 'name', label: '服务名称' },
    { key: 'category', label: '服务类别' },
    { key: 'department', label: '办理部门' },
    { key: 'handlingTime', label: '办理时限' },
    { key: 'applicationCount', label: '申请次数' },
    {
      key: 'status',
      label: '状态',
      render: (row: Service) => (
        <StatusBadge status={row.status}>
          {row.status === 'active' && '已上线'}
          {row.status === 'inactive' && '已下线'}
          {row.status === 'pending' && '待上线'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm py-1 px-3">办理指南</button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            立即办理 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const applicationColumns = [
    { key: 'id', label: '申请编号' },
    { key: 'serviceName', label: '服务事项' },
    { key: 'enterpriseName', label: '申请企业' },
    { key: 'submitDate', label: '申请日期' },
    {
      key: 'status',
      label: '办理状态',
      render: (row: Application) => (
        <StatusBadge status={row.status}>
          {row.status === 'pending' && '待受理'}
          {row.status === 'processing' && '办理中'}
          {row.status === 'approved' && '已通过'}
          {row.status === 'rejected' && '已驳回'}
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

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">政务服务</h1>
        <p className="page-description">查看和办理各类涉企政务服务事项</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="服务事项总数" value="256" icon={FileText} iconColor="text-blue-600" />
        <StatsCard title="待办理申请" value="89" icon={Clock} iconColor="text-yellow-600" />
        <StatsCard title="本月已办结" value="1,234" icon={FileCheck} iconColor="text-green-600" />
        <StatsCard title="已驳回申请" value="23" icon={XCircle} iconColor="text-red-600" />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'services' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              服务事项
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'applications' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              申请记录
            </button>
          </div>
          <Link to="/services/guide" className="btn-secondary text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            智能导办
          </Link>
        </div>
      </div>

      {activeTab === 'services' && (
        <>
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索服务名称或办理部门..."
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
                  <option value="资质认定">资质认定</option>
                  <option value="补贴申请">补贴申请</option>
                  <option value="税收优惠">税收优惠</option>
                  <option value="备案登记">备案登记</option>
                  <option value="金融服务">金融服务</option>
                </select>
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                新增服务
              </button>
            </div>
          </div>
          <DataTable columns={serviceColumns} data={filteredServices} loading={loading} />
        </>
      )}

      {activeTab === 'applications' && (
        <DataTable columns={applicationColumns} data={applications} loading={loading} />
      )}
    </div>
  );
}
