import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Filter, Search, Eye, Edit, Plus, Download } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ReportItem {
  id: number;
  title: string;
  targetName: string;
  category: string;
  overallScore: number;
  status: 'draft' | 'submitted' | 'reviewing' | 'cross_validating' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
}

const mockReports: ReportItem[] = [
  { id: 101, title: '蒙牛乳业综合可信评价报告', targetName: '蒙牛乳业', category: '消费品牌', overallScore: 92, status: 'published', createdAt: '2025-05-01', updatedAt: '2025-06-10' },
  { id: 102, title: '农夫山泉水源品质评测报告', targetName: '农夫山泉', category: '消费品牌', overallScore: 89, status: 'approved', createdAt: '2025-05-10', updatedAt: '2025-06-05' },
  { id: 103, title: '海天酱油添加剂安全分析报告', targetName: '海天味业', category: '消费品牌', overallScore: 85, status: 'cross_validating', createdAt: '2025-05-20', updatedAt: '2025-06-02' },
  { id: 104, title: '新东方教育服务质量评测', targetName: '新东方教育', category: '教育服务', overallScore: 91, status: 'reviewing', createdAt: '2025-05-25', updatedAt: '2025-06-08' },
  { id: 105, title: '携程旅行用户满意度调查', targetName: '携程旅行', category: '旅游出行', overallScore: 89, status: 'submitted', createdAt: '2025-06-01', updatedAt: '2025-06-12' },
  { id: 106, title: '北京协和医院患者体验调研', targetName: '北京协和医院', category: '医疗健康', overallScore: 94, status: 'draft', createdAt: '2025-06-10', updatedAt: '2025-06-15' },
  { id: 107, title: '学而思在线课程质量分析', targetName: '学而思', category: '教育服务', overallScore: 88, status: 'published', createdAt: '2025-04-20', updatedAt: '2025-05-15' },
  { id: 108, title: '格力电器产品品质报告', targetName: '格力电器', category: '消费品牌', overallScore: 81, status: 'rejected', createdAt: '2025-04-15', updatedAt: '2025-05-10' },
];

const statusTabs = [
  { code: 'all', name: '全部' },
  { code: 'draft', name: '草稿' },
  { code: 'reviewing', name: '审核中' },
  { code: 'approved', name: '已通过' },
  { code: 'published', name: '已发布' },
  { code: 'rejected', name: '已驳回' },
];

export function MyReports() {
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = mockReports.filter((r) => {
    if (activeStatus !== 'all' && r.status !== activeStatus) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.targetName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: mockReports.length,
    draft: mockReports.filter(r => r.status === 'draft').length,
    reviewing: mockReports.filter(r => ['reviewing', 'cross_validating', 'submitted'].includes(r.status)).length,
    approved: mockReports.filter(r => r.status === 'approved').length,
    published: mockReports.filter(r => r.status === 'published').length,
    rejected: mockReports.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            我的报告
          </h1>
          <p className="text-slate-400 text-sm">共 {mockReports.length} 份评测报告</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-1" />
          新建报告
        </button>
      </div>

      {/* Status Tabs */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex border-b border-slate-700/50 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setActiveStatus(tab.code)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeStatus === tab.code
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-surface-light/50'
              }`}
            >
              {tab.name}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                activeStatus === tab.code ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'
              }`}>
                {counts[tab.code as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索报告标题或评测对象..."
              className="w-64 px-3 py-1.5 pl-9 bg-surface-light border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select className="bg-surface-light border border-border rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary">
              <option>按更新时间</option>
              <option>按创建时间</option>
              <option>按评分</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report List */}
      <div className="space-y-3">
        {filteredReports.map((report) => (
          <div key={report.id} className="card p-5 hover:border-primary/20 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <ScoreRing score={report.overallScore} size={56} strokeWidth={5} showLabel={false} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge status={report.status} />
                  <span className="badge bg-slate-700/50 text-slate-300 border-slate-600">{report.category}</span>
                </div>
                <h3 className="font-medium text-white truncate">{report.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span>评测对象：{report.targetName}</span>
                  <span>创建：{report.createdAt}</span>
                  <span>更新：{report.updatedAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {report.status === 'published' && (
                  <Link to={`/report/${report.id}`} className="btn btn-ghost text-sm">
                    <Eye className="w-4 h-4 mr-1" />
                    查看
                  </Link>
                )}
                {report.status === 'draft' && (
                  <button className="btn btn-outline text-sm">
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </button>
                )}
                {report.status === 'published' && (
                  <button className="btn btn-ghost text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    下载
                  </button>
                )}
                {report.status === 'rejected' && (
                  <button className="btn btn-outline text-sm text-warning">
                    修改重提
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无符合条件的报告</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReports;
