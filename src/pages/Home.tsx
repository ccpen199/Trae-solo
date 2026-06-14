import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Users,
  Building2,
  Filter,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { Job } from '../../shared/types';

interface JobListResponse {
  list: Job[];
  total: number;
  page: number;
  size: number;
}

const salaryRanges = [
  { label: '不限', min: 0 },
  { label: '20元/时以上', min: 20 },
  { label: '30元/时以上', min: 30 },
  { label: '40元/时以上', min: 40 },
  { label: '50元/时以上', min: 50 },
];

const majorCategories = [
  '全部',
  '计算机',
  '设计',
  '金融',
  '市场',
  '语言',
];

const locations = ['全部', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京'];

const workDurations = ['全部', '短期', '长期', '周末', '寒暑假'];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [salaryMin, setSalaryMin] = useState(parseFloat(searchParams.get('salaryMin') || '0'));
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [major, setMajor] = useState(searchParams.get('major') || '');
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchJobs();
  }, [page, salaryMin, location, major]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (salaryMin > 0) params.salaryMin = salaryMin;
      if (location) params.location = location;
      if (major) params.major = major;

      const res = await api.get<JobListResponse>('/jobs', { params });
      setJobs(res.list);
      setTotal(res.total);
    } catch (error) {
      console.error('获取岗位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    const params: Record<string, string> = {};
    if (keyword) params.keyword = keyword;
    if (salaryMin > 0) params.salaryMin = String(salaryMin);
    if (location) params.location = location;
    if (major) params.major = major;
    setSearchParams(params);
    fetchJobs();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleSalaryChange = (min: number) => {
    setSalaryMin(min);
    setPage(1);
  };

  const handleLocationChange = (loc: string) => {
    setLocation(loc === '全部' ? '' : loc);
    setPage(1);
  };

  const handleMajorChange = (maj: string) => {
    setMajor(maj === '全部' ? '' : maj);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            发现优质实习兼职机会
          </h1>
          <p className="text-primary-100 text-center mb-8">
            合规备案岗位，薪资透明有保障
          </p>

          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="搜索岗位名称、关键词..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <div className="relative sm:w-48">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc === '全部' ? '' : loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-accent-500 text-white font-medium rounded-xl hover:bg-accent-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>搜索</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <button
            onClick={() => setShowMobileFilter(true)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg mb-4"
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
          </button>

          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-card p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                筛选条件
              </h3>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                  薪资范围
                </h4>
                <div className="space-y-2">
                  {salaryRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => handleSalaryChange(range.min)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        salaryMin === range.min
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                  专业类别
                </h4>
                <div className="flex flex-wrap gap-2">
                  {majorCategories.map((maj) => (
                    <button
                      key={maj}
                      onClick={() => handleMajorChange(maj)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                        (maj === '全部' ? !major : major === maj)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {maj}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  工作地点
                </h4>
                <div className="flex flex-wrap gap-2">
                  {locations.slice(0, 6).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocationChange(loc)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                        (loc === '全部' ? !location : location === loc)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  工作时长
                </h4>
                <div className="flex flex-wrap gap-2">
                  {workDurations.map((dur) => (
                    <button
                      key={dur}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {showMobileFilter && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowMobileFilter(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">筛选条件</h3>
                  <button onClick={() => setShowMobileFilter(false)} className="text-gray-400">
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-500">筛选内容同桌面端</p>
              </div>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                共 <span className="font-semibold text-gray-900">{total}</span> 个岗位
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">排序：</span>
                <button className="text-primary-600 font-medium">最新发布</button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {jobs.map((job, index) => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="bg-white rounded-xl shadow-card p-5 hover:shadow-cardHover transition-all duration-300 hover:-translate-y-0.5 group animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                        <span className="text-accent-500 font-bold whitespace-nowrap ml-2">
                          ¥{job.salaryPerHour}/时
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {job.workStartTime}-{job.workEndTime}
                        </span>
                      </div>

                      <div className="flex items-center mb-4">
                        {job.company && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            <span className="line-clamp-1">{job.company.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.majorRequired.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded"
                          >
                            {m}
                          </span>
                        ))}
                        {job.majorRequired.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                            +{job.majorRequired.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-400">
                          <Users className="w-3.5 h-3.5 mr-1" />
                          {job.applicationCount || 0} 人投递
                        </div>
                        <span className="text-xs text-primary-600 font-medium group-hover:translate-x-1 transition-transform">
                          查看详情 →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center mt-8 space-x-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            'w-10 h-10 rounded-lg font-medium transition-colors',
                            page === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-card p-16 text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无符合条件的岗位</h3>
                <p className="text-gray-500">试试调整筛选条件或搜索关键词</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
