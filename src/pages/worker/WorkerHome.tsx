import { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  RefreshCw,
  Calendar,
  FileText,
  TrendingUp,
  Gift,
  Loader2,
  Filter,
  ChevronDown,
  Bell,
  User,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Star,
  BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import JobCard from '@/components/JobCard';
import type { Job, Factory, Worker, WorkerStatus } from '@shared/types';

type SortType = 'distance' | 'salary' | 'rating';

interface MatchedJob extends Job {
  factory?: Factory;
}

const WORKER_ID = 'w-001';

const workerStatusMap: Record<WorkerStatus, { text: string; color: string; bg: string }> = {
  idle: { text: '待业中', color: 'text-warning-600', bg: 'bg-warning-50' },
  interviewing: { text: '面试中', color: 'text-brand-600', bg: 'bg-brand-50' },
  onboarding: { text: '入职中', color: 'text-accent-600', bg: 'bg-accent-50' },
  employed: { text: '在职中', color: 'text-success-600', bg: 'bg-success-50' },
  resigned: { text: '已离职', color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function WorkerHome() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [location, setLocation] = useState('定位中...');
  const [isLocating, setIsLocating] = useState(false);
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('distance');
  const [keyword, setKeyword] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [region, setRegion] = useState('全部');
  const [showFilter, setShowFilter] = useState(false);

  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'distance', label: '距离优先' },
    { key: 'salary', label: '薪资最高' },
    { key: 'rating', label: '好评优先' },
  ];

  const quickActions = [
    { icon: Calendar, label: '一键预约', color: 'bg-accent-500', desc: '快速预约面试', action: () => navigate('/worker/interview') },
    { icon: FileText, label: '我的简历', color: 'bg-brand-500', desc: '完善求职信息', action: () => navigate('/worker/profile') },
    { icon: TrendingUp, label: '入职进度', color: 'bg-success-500', desc: '查看面试状态', action: () => navigate('/worker/interview') },
    { icon: Gift, label: '补贴中心', color: 'bg-purple-500', desc: '稳岗·推荐奖金', action: () => navigate('/worker/onboarding') },
  ];

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const workerRes = await get<Worker>(`/workers/${WORKER_ID}`);
      let lat = 31.3;
      let lng = 120.6;
      let regionName = '苏州工业园';

      if (workerRes.success && workerRes.data) {
        setWorker(workerRes.data);
        lat = workerRes.data.currentLocation.lat;
        lng = workerRes.data.currentLocation.lng;
        regionName = workerRes.data.currentLocation.region;
      }

      setLocation(`${regionName}·周边`);

      const res = await get<MatchedJob[]>(`/jobs/match?lat=${lat}&lng=${lng}&radius=50`);
      if (res.success && res.data) {
        setJobs(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRefreshLocation = () => {
    setIsLocating(true);
    setLocation('正在定位...');
    setTimeout(() => {
      fetchJobs();
      setIsLocating(false);
    }, 1000);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortType) {
      case 'distance':
        return (a.distanceKm || 999) - (b.distanceKm || 999);
      case 'salary':
        return b.salaryRange.max - a.salaryRange.max;
      case 'rating':
        return (b.factory?.interviewSummaries?.[0]?.satisfaction || 0) -
               (a.factory?.interviewSummaries?.[0]?.satisfaction || 0);
    }
  });

  const filteredJobs = sortedJobs.filter(job => {
    if (keyword && !job.title.includes(keyword)) return false;
    if (salaryMin && job.salaryRange.max < parseInt(salaryMin)) return false;
    if (region !== '全部' && job.factory?.region && !job.factory.region.includes(region) && !region.includes(job.factory.region)) return false;
    return true;
  });

  const ws = worker ? workerStatusMap[worker.status] : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 text-white px-4 pt-12 pb-8 rounded-b-[2rem] shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-accent-400/20 rounded-full blur-3xl" />

          {worker && (
            <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                  <User size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-lg truncate">{worker.name}</span>
                    {ws && (
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', ws.bg, ws.color)}>
                        {ws.text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-warning-300 fill-warning-300" />
                      信用分 <b className="text-white">{worker.creditScore}</b>
                    </span>
                    <span className="flex items-center gap-1">
                      {worker.idCardVerified ? (
                        <><BadgeCheck size={12} />已实名</>
                      ) : (
                        <><ShieldAlert size={12} />未实名</>
                      )}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/worker/profile')}
                  className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors active:scale-95"
                >
                  查看档案
                </button>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                <Sparkles size={16} />
              </div>
              <span className="font-semibold text-sm">找一份好工作 ✨</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 relative transition-transform active:scale-95">
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-400 rounded-full" />
              </button>
            </div>
          </div>

          <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={22} className="text-accent-300" />
                </div>
                <div>
                  <div className="text-xs text-white/70 mb-1">当前定位</div>
                  <div className="font-semibold text-lg leading-tight">{location}</div>
                  <div className="text-xs text-white/60 mt-1">覆盖周边50km热门厂区</div>
                </div>
              </div>
              <button
                onClick={handleRefreshLocation}
                disabled={isLocating}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-white/30 transition-colors disabled:opacity-60 active:scale-95"
              >
                <RefreshCw size={12} className={cn(isLocating && 'animate-spin')} />
                切换
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl shadow-card p-4 grid grid-cols-4 gap-3">
            {quickActions.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5',
                  item.color
                )}>
                  <item.icon size={22} />
                </div>
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
                <span className="text-[10px] text-gray-400 -mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-card p-3 space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索岗位关键词（如：普工、QC、仓管）"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-brand-300 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">¥</span>
                <input
                  type="text"
                  placeholder="最低月薪"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-7 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-brand-300 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all',
                  showFilter
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                <Filter size={16} />
                筛选
                <ChevronDown size={14} className={cn('transition-transform', showFilter && 'rotate-180')} />
              </button>
            </div>

            {showFilter && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">选择地区</div>
                  <div className="flex flex-wrap gap-2">
                    {['全部', '苏州工业园', '昆山', '吴江', '常熟', '张家港'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRegion(r)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs transition-all',
                          region === r
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setKeyword(''); setSalaryMin(''); setRegion('全部'); }}
                    className="flex-1 py-2 rounded-xl text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    重置
                  </button>
                  <button
                    onClick={fetchJobs}
                    className="flex-1 py-2 rounded-xl text-sm text-white bg-brand-500 hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    应用筛选
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">热门岗位</h2>
            <button
              onClick={fetchJobs}
              className="text-xs text-brand-500 font-medium flex items-center gap-1 hover:text-brand-600"
            >
              <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
              刷新
            </button>
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {sortOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortType(opt.key)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                  sortType === opt.key
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20 scale-105'
                    : 'bg-white text-gray-600 shadow-card hover:bg-gray-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={36} className="text-brand-500 animate-spin mb-3" />
              <p className="text-sm text-gray-500">正在为您匹配周边岗位...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card py-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">没有找到匹配的岗位</p>
              <button
                onClick={() => { setKeyword(''); setSalaryMin(''); setRegion('全部'); }}
                className="mt-3 text-brand-500 text-sm font-medium"
              >
                清除筛选条件
              </button>
            </div>
          ) : (
            filteredJobs.slice(0, 10).map(job => (
              <div key={job.id} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
                <JobCard
                  job={job}
                  onFactoryClick={fid => navigate(`/worker/factory/${fid}`)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
