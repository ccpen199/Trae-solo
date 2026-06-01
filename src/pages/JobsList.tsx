import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Search, Filter } from 'lucide-react';
import { jobsApi } from '@/lib/api';

export default function JobsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [jobType, setJobType] = useState(searchParams.get('job_type') || '');

  useEffect(() => {
    loadJobs();
  }, [searchParams]);

  const loadJobs = async () => {
    setLoading(true);
    const params: any = {
      page: Number(searchParams.get('page')) || 1,
      limit: 20
    };
    if (searchParams.get('search')) params.search = searchParams.get('search')!;
    if (searchParams.get('job_type')) params.job_type = searchParams.get('job_type')!;

    const result = await jobsApi.list(params);
    setLoading(false);
    if (result.success && result.data) {
      setJobs(result.data.jobs || []);
      setPagination(result.data.pagination);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('search', searchTerm);
    if (jobType) newParams.set('job_type', jobType);
    setSearchParams(newParams);
  };

  const jobTypeLabels: Record<string, string> = {
    daily: '日结',
    weekly: '周结',
    project: '项目制',
    remote: '远程'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索岗位名称、描述..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={jobType}
              onChange={e => setJobType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部类型</option>
              <option value="daily">日结</option>
              <option value="weekly">周结</option>
              <option value="project">项目制</option>
              <option value="remote">远程</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              搜索
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            岗位大厅
            <span className="text-sm font-normal text-gray-500 ml-2">
              共 {pagination.total} 个岗位
            </span>
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">暂无匹配的岗位</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition block"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {jobTypeLabels[job.job_type] || job.job_type}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{job.company_name}</p>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        ¥{job.salary_amount}
                      </span>
                      {job.location_address && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {job.location_address}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {job.applicant_count} 人申请
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">发布于</span>
                    <p className="text-sm text-gray-600">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('page', String(page));
                  setSearchParams(newParams);
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
