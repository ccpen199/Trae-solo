import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Play, Search, Clock, GraduationCap, Briefcase, Filter, X, Sparkles, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

const parseSalaryRange = (range: string): [number, number] | null => {
  if (range === '5k以下') return [0, 5000];
  if (range === '5k-10k') return [5000, 10000];
  if (range === '10k-20k') return [10000, 20000];
  if (range === '20k-30k') return [20000, 30000];
  if (range === '30k以上') return [30000, Infinity];
  return null;
};

const JobsPage = () => {
  const navigate = useNavigate();
  const { getRecommendedJobs, preferences, setSalaryRange, addIndustryInterest } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryRange, setLocalSalaryRange] = useState<string>(preferences.salaryRange);
  const [jobType, setJobType] = useState<string>('全部');
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const salaryRanges = ['全部', '5k以下', '5k-10k', '10k-20k', '20k-30k', '30k以上'];
  const jobTypes = ['全部', '全职', '兼职', '实习'];

  const activeFilterCount = (preferences.salaryRange !== '全部' ? 1 : 0) +
    (jobType !== '全部' ? 1 : 0) + (hasVideo !== null ? 1 : 0);

  const filteredJobs = useMemo(() => {
    let result = getRecommendedJobs();

    if (searchTerm.trim()) {
      const term = searchTerm.trim();
      result = result.filter(job =>
        job.title.includes(term) ||
        job.companyName.includes(term) ||
        job.tags.some(tag => tag.includes(term)) ||
        job.description.includes(term) ||
        job.requirements.some(req => req.includes(term))
      );
    }

    if (salaryRange !== '全部') {
      const range = parseSalaryRange(salaryRange);
      if (range) {
        const [min, max] = range;
        result = result.filter(job => job.salaryMax >= min && job.salaryMin <= max);
      }
    }

    if (jobType !== '全部') {
      result = result.filter(job => job.type === jobType);
    }

    if (hasVideo !== null) {
      result = result.filter(job => hasVideo ? !!job.videoId : !job.videoId);
    }

    return result;
  }, [searchTerm, salaryRange, jobType, hasVideo, getRecommendedJobs]);

  const videoJobs = useMemo(() => filteredJobs.filter(j => j.videoId), [filteredJobs]);

  const handleSalaryChange = (range: string) => {
    setLocalSalaryRange(range);
    setSalaryRange(range);
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setLocalSalaryRange('全部');
    setSalaryRange('全部');
    setJobType('全部');
    setHasVideo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索岗位、公司、技能，支持视频语义匹配..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              语义搜索
            </Link>
            <Link
              to="/map"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              地图找岗
            </Link>
            <button
              type="button"
              onClick={() => setShowFilterPanel(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors relative"
              style={{
                backgroundColor: activeFilterCount > 0 ? '#eff6ff' : '#f3f4f6',
                color: activeFilterCount > 0 ? '#2563eb' : '#4b5563',
              }}
            >
              <Filter className="w-4 h-4" />
              筛选
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {salaryRanges.map(range => {
              const isActive = salaryRange === range;
              return (
                <button
                  key={range}
                  onClick={() => handleSalaryChange(range)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-accent-300 hover:text-accent-600'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="max-w-5xl mx-auto px-4 pb-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">已选筛选:</span>
            {salaryRange !== '全部' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-full">
                💰 {salaryRange}
                <button onClick={() => handleSalaryChange('全部')} className="hover:text-orange-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {jobType !== '全部' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                📋 {jobType}
                <button onClick={() => setJobType('全部')} className="hover:text-blue-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {hasVideo !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                🎬 {hasVideo ? '有视频' : '无视频'}
                <button onClick={() => setHasVideo(null)} className="hover:text-purple-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={handleClearAll} className="text-xs text-gray-500 underline underline-offset-2 hover:text-primary-600 ml-auto">
              清除全部
            </button>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {searchTerm ? `"${searchTerm}" 的搜索结果` : '岗位列表'}
            </h1>
            <p className="text-sm text-gray-500">
              共找到 <span className="text-primary-600 font-semibold">{filteredJobs.length}</span> 个岗位
              {videoJobs.length > 0 && (
                <> · 其中 <span className="text-purple-600 font-semibold">{videoJobs.length}</span> 个带视频展示</>
              )}
            </p>
          </div>
        </div>

        {videoJobs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                </span>
                视频看岗
                <span className="text-xs text-gray-400 font-normal">筛选结果中含视频的岗位</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {videoJobs.slice(0, 4).map(job => (
                <div
                  key={`video-${job.id}`}
                  onClick={() => {
                    addIndustryInterest(job.tags[0] || job.title);
                    navigate(`/company/${job.companyId}`);
                  }}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group"
                >
                  <img
                    src={job.videoThumbnail}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] rounded-full font-medium">
                    视频岗
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="font-semibold text-sm">{job.title}</p>
                    <p className="text-accent-400 font-bold text-base">{job.salary}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-white/70">
                      <span>{job.companyName}</span>
                      <span>·</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">没有找到匹配的岗位</h3>
              <p className="text-sm text-gray-500 mb-4">试试调整筛选条件或搜索关键词</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
                >
                  清除筛选条件
                </button>
                <Link
                  to="/search"
                  className="px-4 py-2 bg-purple-50 text-purple-600 text-sm rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  试试语义搜索
                </Link>
              </div>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div
                key={job.id}
                onClick={() => {
                  addIndustryInterest(job.tags[0] || job.title);
                  navigate(`/company/${job.companyId}`);
                }}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all card-hover border border-gray-100 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                        {job.score > 40 && (
                          <span className="px-1.5 py-0.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[10px] rounded-full font-medium flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" />
                            匹配 {Math.round(job.score)}
                          </span>
                        )}
                        {job.verified && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded-full font-medium">
                            已认证
                          </span>
                        )}
                        {job.videoId && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full font-medium flex items-center gap-0.5">
                            <Play className="w-2.5 h-2.5" fill="currentColor" />
                            有视频
                          </span>
                        )}
                      </div>
                      <p className="text-accent-600 font-bold text-xl whitespace-nowrap">{job.salary}</p>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <img src={job.companyLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-sm text-gray-600">{job.companyName}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {job.experience}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <GraduationCap className="w-4 h-4" />
                        {job.education}
                      </span>
                      <span className="tag tag-blue">{job.type}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.tags.map(tag => (
                        <span key={tag} className="tag tag-blue">{tag}</span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>
                  </div>

                  {job.videoThumbnail && (
                    <div className="w-full sm:w-32 h-44 sm:h-auto sm:aspect-[3/4] rounded-xl overflow-hidden relative flex-shrink-0 group/thumb">
                      <img
                        src={job.videoThumbnail}
                        alt=""
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover/thumb:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                        视频看岗
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{job.postedDate}发布</span>
                    <span>·</span>
                    <span>{job.applications}人投递</span>
                    {job.requirements.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{job.requirements.length}项要求</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/map`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      看地图
                    </Link>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="px-5 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-full hover:bg-primary-600 transition-colors"
                    >
                      立即投递
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/search"
            className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all card-hover"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">视频语义搜索</h3>
            <p className="text-sm text-gray-500">AI识别视频内容，搜索「咖啡师」自动匹配拉花操作画面</p>
          </Link>
          <Link
            to="/map"
            className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all card-hover"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">15分钟通勤圈</h3>
            <p className="text-sm text-gray-500">按步行/骑行/公交设置范围，热力图看岗位密度</p>
          </Link>
          <Link
            to="/seekers"
            className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-green-200 transition-all card-hover"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">视频简历识人</h3>
            <p className="text-sm text-gray-500">AI自动提取字幕与技能关键词，快速了解候选人</p>
          </Link>
        </div>
      </div>

      {showFilterPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowFilterPanel(false)}>
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">筛选条件</h3>
              <button onClick={() => setShowFilterPanel(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">薪资范围</h4>
                <div className="flex flex-wrap gap-2">
                  {salaryRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => handleSalaryChange(range)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        salaryRange === range
                          ? 'bg-accent-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">工作类型</h4>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setJobType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        jobType === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">视频展示</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setHasVideo(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      hasVideo === null ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setHasVideo(true)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      hasVideo === true ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    仅看视频岗
                  </button>
                  <button
                    onClick={() => setHasVideo(false)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      hasVideo === false ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    无视频
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                清除全部
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
