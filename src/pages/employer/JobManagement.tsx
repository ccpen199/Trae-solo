import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Power, MoreHorizontal, Filter, ChevronDown } from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatSalary, getIndustryLabel } from '@/utils/helpers';
import type { Job } from '@/../shared/types';
import { useNavigate } from 'react-router-dom';

export default function JobManagement() {
  const navigate = useNavigate();
  const { setJobs, jobs, setApplications, setEmployerInterviews, setAnalyticsData, setCompany, setVerificationRecord, updateJob } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    setJobs(mockJobs);
    setApplications(mockApplications);
    setEmployerInterviews(mockInterviews);
    setAnalyticsData(mockAnalyticsData);
    setCompany(mockCompanies[0]);
    setVerificationRecord(mockVerificationRecords[0]);
  }, [setJobs, setApplications, setEmployerInterviews, setAnalyticsData, setCompany, setVerificationRecord]);

  const getApplicationCount = (jobId: string) => {
    return mockApplications.filter(app => app.jobId === jobId).length;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || job.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const handleToggleStatus = (job: Job) => {
    const newStatus = job.status === 'published' ? 'offline' : 'published';
    updateJob(job.id, { status: newStatus });
  };

  const handleDelete = (jobId: string) => {
    if (window.confirm('确定要删除这个岗位吗？')) {
      const updatedJobs = jobs.filter(job => job.id !== jobId);
      useStore.getState().setJobs(updatedJobs);
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">岗位管理</h1>
        <button
          onClick={() => navigate('/employer/jobs/create')}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          发布新岗位
        </button>
      </div>

      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索岗位名称、公司..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">筛选</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2 px-2">状态</p>
                  {['all', 'published', 'offline', 'draft'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                        statusFilter === status
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {status === 'all' ? '全部' : status === 'published' ? '已发布' : status === 'offline' ? '已下线' : '草稿'}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 px-2">行业</p>
                  {['all', 'restaurant', 'retail', 'housekeeping', 'logistics', 'security', 'other'].map(industry => (
                    <button
                      key={industry}
                      onClick={() => {
                        setIndustryFilter(industry);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
                        industryFilter === industry
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {industry === 'all' ? '全部' : getIndustryLabel(industry)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {statusFilter === 'published' ? '已发布' : statusFilter === 'offline' ? '已下线' : '草稿'}
              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-primary/80">
                ×
              </button>
            </span>
          )}
          {industryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {getIndustryLabel(industryFilter)}
              <button onClick={() => setIndustryFilter('all')} className="ml-1 hover:text-primary/80">
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">岗位信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">薪资</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">审核</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">投递数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job: Job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.companyName} · {getIndustryLabel(job.industry)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={job.status} type="review" />
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={job.reviewStatus} type="verification" />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {getApplicationCount(job.id)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/employer/jobs/edit/${job.id}`)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          job.status === 'published'
                            ? 'text-success hover:text-success hover:bg-success/10'
                            : 'text-gray-500 hover:text-success hover:bg-success/10'
                        }`}
                        title={job.status === 'published' ? '下线' : '上线'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">没有找到匹配的岗位</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setIndustryFilter('all');
              }}
              className="mt-3 text-primary text-sm hover:underline"
            >
              清除筛选条件
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
