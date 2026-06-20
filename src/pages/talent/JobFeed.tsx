import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  RefreshCw,
  Filter,
  Star,
  Send,
  Briefcase,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, Badge, MatchScore, Button, LoadingSpinner } from '@/components/ui';
import { mockJobs, mockMatchResults } from '@shared/mock/data';
import { INDUSTRY_LIST, type JobDescription, type IndustryType, type MatchResult } from '@shared/types';
import { cn } from '@/lib/utils';

type SortOption = 'latest' | 'match' | 'salary' | 'distance';
type FilterState = {
  salary: string;
  workType: string;
  distance: string;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '最新发布' },
  { value: 'match', label: '匹配度最高' },
  { value: 'salary', label: '薪资最高' },
  { value: 'distance', label: '距离最近' },
];

const SALARY_OPTIONS = [
  { value: '', label: '不限' },
  { value: '5k-8k', label: '5k-8k' },
  { value: '8k-12k', label: '8k-12k' },
  { value: '12k-15k', label: '12k-15k' },
  { value: '15k+', label: '15k以上' },
];

const WORK_TYPE_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'fixed', label: '固定班制' },
  { value: 'flexible', label: '弹性工作' },
  { value: 'shift', label: '轮班制' },
];

const DISTANCE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '3', label: '3km以内' },
  { value: '5', label: '5km以内' },
  { value: '10', label: '10km以内' },
  { value: '20', label: '20km以内' },
];

const getScheduleLabel = (type: string): string => {
  const map: Record<string, string> = {
    fixed: '固定班制',
    flexible: '弹性工作',
    shift: '轮班制',
  };
  return map[type] || type;
};

const formatSalary = (job: JobDescription): string => {
  const base = job.salary.base;
  const max = base + job.salary.performance + job.salary.commission;
  return `${(base / 1000).toFixed(0)}k-${(max / 1000).toFixed(0)}k`;
};

const getRandomDistance = (): string => {
  return (Math.random() * 10 + 0.5).toFixed(1);
};

const getJobMatchResult = (jobId: string): MatchResult | undefined => {
  return mockMatchResults.find((m) => m.jobId === jobId);
};

const getIndustryColor = (industry: IndustryType): string => {
  const industryInfo = INDUSTRY_LIST.find((i) => i.key === industry);
  return industryInfo?.color || '#1E3A5F';
};

export default function JobFeed() {
  const navigate = useNavigate();
  const [currentLocation] = useState('上海市浦东新区');
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryType[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [filters, setFilters] = useState<FilterState>({
    salary: '',
    workType: '',
    distance: '',
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const observerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef(0);

  const loadJobs = useCallback(
    (isRefresh = false, page = 1) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setTimeout(() => {
        let filteredJobs = [...mockJobs];

        if (selectedIndustries.length > 0) {
          filteredJobs = filteredJobs.filter((job) =>
            selectedIndustries.includes(job.industry)
          );
        }

        if (filters.salary) {
          filteredJobs = filteredJobs.filter((job) => {
            const base = job.salary.base / 1000;
            if (filters.salary === '5k-8k') return base >= 5 && base < 8;
            if (filters.salary === '8k-12k') return base >= 8 && base < 12;
            if (filters.salary === '12k-15k') return base >= 12 && base < 15;
            if (filters.salary === '15k+') return base >= 15;
            return true;
          });
        }

        if (filters.workType) {
          filteredJobs = filteredJobs.filter(
            (job) => job.scheduleFlexibility === filters.workType
          );
        }

        if (sortBy === 'salary') {
          filteredJobs.sort(
            (a, b) =>
              b.salary.base +
              b.salary.performance +
              b.salary.commission -
              (a.salary.base + a.salary.performance + a.salary.commission)
          );
        } else if (sortBy === 'match') {
          filteredJobs.sort((a, b) => {
            const matchA = getJobMatchResult(a.id)?.overallScore || 0;
            const matchB = getJobMatchResult(b.id)?.overallScore || 0;
            return matchB - matchA;
          });
        } else if (sortBy === 'latest') {
          filteredJobs.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        const pageSize = 6;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedJobs = filteredJobs.slice(start, end);

        if (isRefresh || page === 1) {
          setJobs(paginatedJobs);
        } else {
          setJobs((prev) => [...prev, ...paginatedJobs]);
        }

        setHasMore(end < filteredJobs.length);
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }, 800);
    },
    [selectedIndustries, sortBy, filters]
  );

  useEffect(() => {
    loadJobs(false, 1);
  }, [loadJobs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = Math.floor(jobs.length / 6) + 1;
          loadJobs(false, nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [jobs.length, hasMore, loadingMore, loading, loadJobs]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 60) {
      loadJobs(true, 1);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const toggleIndustry = (industry: IndustryType) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };

  const toggleFavorite = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleApply = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert('简历已投递！');
  };

  const newJobsCount = mockJobs.filter(
    (job) =>
      new Date(job.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length;
  const nearbyCount = mockJobs.filter(() => Math.random() > 0.5).length;
  const highSalaryCount = mockJobs.filter(
    (job) => job.salary.base >= 10000
  ).length;

  return (
    <PageLayout
      title="推荐职位"
      subtitle="为您精准匹配的优质岗位"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary-600">
                <MapPin size={18} />
                <span className="font-medium">{currentLocation}</span>
                <Button variant="ghost" size="sm">
                  切换城市
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">排序：</span>
                <div className="flex gap-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-all',
                        sortBy === option.value
                          ? 'bg-primary-500 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {INDUSTRY_LIST.map((industry) => (
                <button
                  key={industry.key}
                  onClick={() => toggleIndustry(industry.key)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all border-2',
                    selectedIndustries.includes(industry.key)
                      ? 'text-white border-transparent'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  )}
                  style={
                    selectedIndustries.includes(industry.key)
                      ? { backgroundColor: industry.color }
                      : {}
                  }
                >
                  {industry.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { key: 'salary', label: '薪资范围', icon: DollarSign, options: SALARY_OPTIONS },
                { key: 'workType', label: '工作类型', icon: Briefcase, options: WORK_TYPE_OPTIONS },
                { key: 'distance', label: '距离', icon: MapPin, options: DISTANCE_OPTIONS },
              ].map((filter) => (
                <div key={filter.key} className="relative">
                  <button
                    onClick={() =>
                      setShowFilterDropdown(
                        showFilterDropdown === filter.key ? null : filter.key
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-all"
                  >
                    <filter.icon size={16} className="text-neutral-500" />
                    <span className="text-sm">
                      {filters[filter.key as keyof FilterState] || filter.label}
                    </span>
                    {showFilterDropdown === filter.key ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {showFilterDropdown === filter.key && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-card-hover border border-neutral-200 py-2 z-50 min-w-[160px]">
                      {filter.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              [filter.key]: option.value,
                            }));
                            setShowFilterDropdown(null);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 transition-all flex items-center justify-between',
                            filters[filter.key as keyof FilterState] === option.value &&
                              'text-primary-600 font-medium'
                          )}
                        >
                          {option.label}
                          {filters[filter.key as keyof FilterState] === option.value && (
                            <X size={14} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div
            ref={containerRef}
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex items-center justify-center overflow-hidden transition-all"
              style={{ height: refreshing ? 60 : pullDistance }}
            >
              {refreshing || pullDistance >= 60 ? (
                <div className="flex items-center gap-2 text-primary-500">
                  <RefreshCw className={cn(refreshing && 'animate-spin')} size={20} />
                  <span className="text-sm">
                    {refreshing ? '刷新中...' : '释放刷新'}
                  </span>
                </div>
              ) : pullDistance > 0 ? (
                <div className="flex items-center gap-2 text-neutral-500">
                  <RefreshCw size={20} />
                  <span className="text-sm">下拉刷新</span>
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-neutral-200 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-neutral-200 rounded w-3/4" />
                        <div className="h-4 bg-neutral-200 rounded w-1/2" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-neutral-200 rounded-full w-16" />
                          <div className="h-6 bg-neutral-200 rounded-full w-16" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 columns-1 md:columns-2">
                {jobs.map((job, index) => {
                  const matchResult = getJobMatchResult(job.id);
                  const distance = getRandomDistance();
                  const isFavorite = favorites.has(job.id);
                  const industryColor = getIndustryColor(job.industry);

                  return (
                    <Card
                      key={job.id}
                      hoverable
                      className="mb-4 break-inside-avoid group"
                      onClick={() => navigate(`/job/${job.id}`)}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="relative">
                        {matchResult && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <MatchScore
                              score={matchResult.overallScore}
                              size="sm"
                            />
                          </div>
                        )}

                        <div className="flex gap-4">
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: `${industryColor}15` }}
                          >
                            <Briefcase
                              size={32}
                              style={{ color: industryColor }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h3 className="font-serif text-lg font-bold text-primary-800 group-hover:text-primary-600 transition-colors">
                                  {job.title}
                                </h3>
                                <p className="text-sm text-neutral-500 mb-2">
                                  {job.company?.name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                              <span
                                className="font-bold text-lg"
                                style={{ color: industryColor }}
                              >
                                {formatSalary(job)}
                              </span>
                              <Badge variant="info" size="sm">
                                {getScheduleLabel(job.scheduleFlexibility)}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{distance}km</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>
                                  {new Date(job.createdAt).toLocaleDateString(
                                    'zh-CN'
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {job.benefits.slice(0, 3).map((benefit, i) => (
                                <Badge
                                  key={i}
                                  variant="success"
                                  size="sm"
                                >
                                  {benefit}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant={isFavorite ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={(e) => toggleFavorite(job.id, e)}
                              >
                                <Star
                                  size={16}
                                  fill={isFavorite ? 'currentColor' : 'none'}
                                />
                                {isFavorite ? '已收藏' : '收藏'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => handleApply(job.id, e)}
                              >
                                <Send size={16} />
                                投递简历
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div ref={observerRef} className="py-8">
              {loadingMore ? (
                <LoadingSpinner text="加载更多..." />
              ) : !hasMore && jobs.length > 0 ? (
                <div className="text-center text-neutral-400 text-sm">
                  — 没有更多职位了 —
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            <Card>
              <h3 className="font-serif text-lg font-bold text-primary-800 mb-4">
                附近职位地图
              </h3>
              <div className="relative h-64 bg-gradient-to-br from-primary-50 to-mint-50 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,95,0.1)_0%,transparent_70%)]" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="absolute w-4 h-4 rounded-full animate-pulse"
                    style={{
                      backgroundColor: i % 2 === 0 ? '#FF6B6B' : '#4ECDC4',
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-0.5 rounded text-xs font-medium shadow-md">
                      {mockJobs[i % mockJobs.length].title}
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-neutral-600 shadow-sm">
                  <MapPin size={14} className="inline mr-1" />
                  显示 {mockJobs.length} 个职位
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-serif text-lg font-bold text-primary-800 mb-4">
                快速统计
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-accent-500" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">今日新职位</p>
                      <p className="font-bold text-lg text-accent-600">
                        {newJobsCount} 个
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-mint-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mint-100 rounded-lg flex items-center justify-center">
                      <MapPin size={20} className="text-mint-500" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">距离&lt;5km</p>
                      <p className="font-bold text-lg text-mint-600">
                        {nearbyCount} 个
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <DollarSign size={20} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">高薪职位</p>
                      <p className="font-bold text-lg text-primary-600">
                        {highSalaryCount} 个
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter size={20} className="text-neutral-500" />
                  <span className="text-neutral-700">已选条件</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedIndustries([]);
                    setFilters({ salary: '', workType: '', distance: '' });
                  }}
                >
                  重置
                </Button>
              </div>
              {selectedIndustries.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedIndustries.map((ind) => (
                    <Badge key={ind} variant="info" size="sm">
                      {INDUSTRY_LIST.find((i) => i.key === ind)?.label}
                      <button
                        className="ml-1 hover:text-accent-500"
                        onClick={() => toggleIndustry(ind)}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
