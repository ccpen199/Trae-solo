import { useState, useEffect } from 'react';
import { Hammer, Search, Filter, Plus, ArrowRight, Eye, Calendar, MapPin, DollarSign, FileText } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';

interface BiddingProject {
  id: string;
  title: string;
  category: string;
  budget: string;
  region: string;
  bidDeadline: string;
  publishDate: string;
  status: 'active' | 'closed' | 'pending';
  bidCount: number;
}

export default function Bidding() {
  const [projects, setProjects] = useState<BiddingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<BiddingProject | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/bidding');
        const data = await res.json().catch(() => [
          { id: '1', title: '广东省政务服务中心信息化建设项目', category: '信息化', budget: '5,800万元', region: '广州市', bidDeadline: '2024-02-15', publishDate: '2024-01-15', status: 'active' as const, bidCount: 23 },
          { id: '2', title: '智能制造产业园基础设施建设工程', category: '工程建设', budget: '12,500万元', region: '佛山市', bidDeadline: '2024-02-20', publishDate: '2024-01-14', status: 'active' as const, bidCount: 18 },
          { id: '3', title: '科技创新专项资金评审服务项目', category: '服务采购', budget: '380万元', region: '深圳市', bidDeadline: '2024-02-10', publishDate: '2024-01-13', status: 'active' as const, bidCount: 12 },
          { id: '4', title: '政务大数据平台运维服务项目', category: '服务采购', budget: '1,200万元', region: '广州市', bidDeadline: '2024-01-30', publishDate: '2024-01-12', status: 'pending' as const, bidCount: 0 },
          { id: '5', title: '新能源汽车产业园区配套设施项目', category: '工程建设', budget: '28,000万元', region: '惠州市', bidDeadline: '2024-01-25', publishDate: '2024-01-11', status: 'active' as const, bidCount: 31 },
          { id: '6', title: '智慧交通管理系统升级改造项目', category: '信息化', budget: '3,200万元', region: '东莞市', bidDeadline: '2024-01-20', publishDate: '2024-01-10', status: 'closed' as const, bidCount: 45 },
          { id: '7', title: '环保设备采购项目', category: '货物采购', budget: '860万元', region: '珠海市', bidDeadline: '2024-02-05', publishDate: '2024-01-09', status: 'active' as const, bidCount: 8 },
        ]);
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = projects.filter((item) => {
    const matchesSearch = item.title.includes(searchTerm);
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesRegion = !regionFilter || item.region === regionFilter;
    return matchesSearch && matchesCategory && matchesRegion;
  });

  const activeCount = projects.filter(p => p.status === 'active').length;
  const totalBudget = projects.reduce((sum, p) => {
    const budget = parseInt(p.budget.replace(/,/g, '').replace('万元', ''));
    return sum + (isNaN(budget) ? 0 : budget);
  }, 0);

  const handleViewDetail = (project: BiddingProject) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const columns = [
    { key: 'title', label: '项目名称', className: 'min-w-[300px]' },
    { key: 'category', label: '项目类别' },
    {
      key: 'budget',
      label: '预算金额',
      render: (row: BiddingProject) => (
        <span className="font-semibold text-[#1a56db] flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          {row.budget}
        </span>
      ),
    },
    {
      key: 'region',
      label: '所在地区',
      render: (row: BiddingProject) => (
        <span className="flex items-center gap-1 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400" />
          {row.region}
        </span>
      ),
    },
    {
      key: 'bidDeadline',
      label: '投标截止',
      render: (row: BiddingProject) => (
        <span className="flex items-center gap-1 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          {row.bidDeadline}
        </span>
      ),
    },
    {
      key: 'bidCount',
      label: '已投标数',
      render: (row: BiddingProject) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
          {row.bidCount} 家
        </span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      render: (row: BiddingProject) => (
        <StatusBadge status={row.status === 'active' ? 'active' : row.status === 'closed' ? 'resolved' : 'pending'}>
          {row.status === 'active' && '招标中'}
          {row.status === 'closed' && '已结束'}
          {row.status === 'pending' && '待发布'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: BiddingProject) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            立即投标 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">招标投标</h1>
        <p className="page-description">查看和参与政府采购及工程项目招投标</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="招标项目总数" value={projects.length} icon={Hammer} iconColor="text-blue-600" />
        <StatsCard title="进行中项目" value={activeCount} icon={FileText} iconColor="text-green-600" />
        <StatsCard title="项目总预算" value={`${totalBudget.toLocaleString()}万元`} icon={DollarSign} iconColor="text-purple-600" />
        <StatsCard title="本月新增项目" value="28" icon={Calendar} iconColor="text-orange-600" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索招标项目名称..."
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
              <option value="工程建设">工程建设</option>
              <option value="信息化">信息化</option>
              <option value="服务采购">服务采购</option>
              <option value="货物采购">货物采购</option>
            </select>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部地区</option>
              <option value="广州市">广州市</option>
              <option value="深圳市">深圳市</option>
              <option value="佛山市">佛山市</option>
              <option value="东莞市">东莞市</option>
              <option value="惠州市">惠州市</option>
              <option value="珠海市">珠海市</option>
            </select>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            发布招标
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={loading} />

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="招标项目详情"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary">关闭</button>
            <button className="btn-primary">我要投标</button>
          </div>
        }
      >
        {selectedProject && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedProject.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {selectedProject.region}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> 发布于 {selectedProject.publishDate}
                </span>
                <StatusBadge status={selectedProject.status === 'active' ? 'active' : selectedProject.status === 'closed' ? 'resolved' : 'pending'}>
                  {selectedProject.status === 'active' && '招标中'}
                  {selectedProject.status === 'closed' && '已结束'}
                  {selectedProject.status === 'pending' && '待发布'}
                </StatusBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">项目类别</p>
                <p className="font-semibold text-gray-900">{selectedProject.category}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">预算金额</p>
                <p className="font-semibold text-[#1a56db] text-xl">{selectedProject.budget}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">投标截止时间</p>
                <p className="font-semibold text-gray-900">{selectedProject.bidDeadline}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">已投标企业</p>
                <p className="font-semibold text-gray-900">{selectedProject.bidCount} 家</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">项目概况</h4>
              <p className="text-gray-600 leading-relaxed">
                本项目为{selectedProject.region}{selectedProject.category}项目，主要内容包括相关设施建设、系统开发或服务采购等工作。项目预算{selectedProject.budget}，
                采用公开招标方式确定供应商。有意向的投标人请在投标截止时间前完成投标文件的编制和提交。
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">投标人资格要求</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#1a56db] rounded-full mt-2 flex-shrink-0" />
                  <span>具有独立法人资格，持有有效的营业执照</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#1a56db] rounded-full mt-2 flex-shrink-0" />
                  <span>具有相应的资质证书（如需要）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#1a56db] rounded-full mt-2 flex-shrink-0" />
                  <span>具有同类项目的实施经验</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[#1a56db] rounded-full mt-2 flex-shrink-0" />
                  <span>无重大违法记录，信用状况良好</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
