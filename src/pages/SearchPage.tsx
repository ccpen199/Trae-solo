import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Sparkles, Play, MapPin, Briefcase, TrendingUp, Video, Users, X } from 'lucide-react';
import { companies, jobs, jobSeekers, interestTags } from '../data/mockData';
import { useApp } from '../context/AppContext';

const SearchPage = () => {
  const location = useLocation();
  const { addIndustryInterest } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'videos' | 'jobs' | 'companies' | 'seekers'>('all');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchTerm(q);
      setActiveSearch(q);
      setShowSuggestions(false);
      addIndustryInterest(q);
    }
  }, [location.search, addIndustryInterest]);

  const hotSearches = ['咖啡师', '前端开发', '健身教练', '花艺师', '运营专员', 'UI设计', '产品经理', '兼职'];

  const allVideos = companies.flatMap(company =>
    company.videos.map(video => ({
      ...video,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logo,
    }))
  );

  const performSearch = (term: string) => {
    setSearchTerm(term);
    setActiveSearch(term);
    setShowSuggestions(false);
  };

  const filteredVideos = activeSearch
    ? allVideos.filter(v =>
        v.title.includes(activeSearch) ||
        v.tags.some(t => t.includes(activeSearch)) ||
        v.aiKeywords?.some(k => k.includes(activeSearch))
      )
    : [];

  const filteredJobs = activeSearch
    ? jobs.filter(j =>
        j.title.includes(activeSearch) ||
        j.tags.some(t => t.includes(activeSearch)) ||
        j.companyName.includes(activeSearch)
      )
    : [];

  const filteredCompanies = activeSearch
    ? companies.filter(c =>
        c.name.includes(activeSearch) ||
        c.industry.includes(activeSearch) ||
        c.description.includes(activeSearch)
      )
    : [];

  const filteredSeekers = activeSearch
    ? jobSeekers.filter(s =>
        s.title.includes(activeSearch) ||
        s.skills.some(skill => skill.includes(activeSearch)) ||
        s.name.includes(activeSearch)
      )
    : [];

  const typeTabs = [
    { id: 'all', label: '全部', icon: Search },
    { id: 'videos', label: '视频', icon: Video },
    { id: 'jobs', label: '岗位', icon: Briefcase },
    { id: 'companies', label: '企业', icon: Users },
    { id: 'seekers', label: '人才', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索岗位、企业、视频或技能..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  performSearch(searchTerm);
                }
              }}
              className="w-full pl-12 pr-24 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white text-base"
            />
            <button
              onClick={() => performSearch(searchTerm)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              搜索
            </button>
          </div>

          {showSuggestions && searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  AI 语义搜索建议
                </p>
              </div>
              <div className="p-2">
                {['咖啡师 拉花 操作', '前端开发 React TypeScript', '健身教练 私教 体能'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => performSearch(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!activeSearch ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-800">热门搜索</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {hotSearches.map((term, index) => (
                  <button
                    key={term}
                    onClick={() => performSearch(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    <span className={`text-xs font-bold ${
                      index < 3 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-800">AI 语义搜索</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                不仅搜索文字，更能理解视频内容。比如搜索"咖啡师"，自动匹配带有拉花操作画面的岗位视频。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: '🎬', title: '视频内容识别', desc: 'AI识别视频画面，精准匹配岗位场景' },
                  { icon: '💬', title: '语音转文字', desc: '自动提取视频语音，全文搜索更全面' },
                  { icon: '🏷️', title: '智能标签', desc: '自动生成技能关键词，搜索更精准' },
                  { icon: '🎯', title: '语义理解', desc: '理解搜索意图，推荐最相关的内容' },
                ].map(item => (
                  <div key={item.title} className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                    <span className="text-2xl mb-2 block">{item.icon}</span>
                    <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">热门行业标签</h3>
              <div className="flex flex-wrap gap-2">
                {interestTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => performSearch(tag)}
                    className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm hover:bg-primary-100 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {typeTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = searchType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSearchType(tab.id as typeof searchType)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>搜索 "{activeSearch}"</span>
              <span>·</span>
              <span>共找到 {filteredVideos.length + filteredJobs.length + filteredCompanies.length + filteredSeekers.length} 条结果</span>
              <button
                onClick={() => {
                  setActiveSearch('');
                  setSearchTerm('');
                }}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除搜索
              </button>
            </div>

            {(searchType === 'all' || searchType === 'videos') && filteredVideos.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary-500" />
                  视频结果 ({filteredVideos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredVideos.slice(0, 4).map(video => (
                    <div key={video.id} className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                        <p className="text-white/70 text-xs mt-1">{video.companyName}</p>
                        {video.aiKeywords && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary-300">
                            <Sparkles className="w-3 h-3" />
                            语义匹配
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(searchType === 'all' || searchType === 'jobs') && filteredJobs.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-accent-500" />
                  岗位结果 ({filteredJobs.length})
                </h3>
                <div className="space-y-3">
                  {filteredJobs.slice(0, 3).map(job => (
                    <div
                      key={job.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{job.title}</h4>
                          <p className="text-accent-600 font-semibold">{job.salary}</p>
                        </div>
                        {job.videoThumbnail && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={job.videoThumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span>{job.companyName}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.tags.map(tag => (
                          <span key={tag} className="tag tag-blue">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(searchType === 'all' || searchType === 'companies') && filteredCompanies.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  企业结果 ({filteredCompanies.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCompanies.slice(0, 2).map(company => (
                    <div
                      key={company.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{company.name}</h4>
                          {company.verified && (
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{company.industry} · {company.size}</p>
                        <p className="text-xs text-gray-400 mt-1">{company.jobs.length}个岗位在招</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(searchType === 'all' || searchType === 'seekers') && filteredSeekers.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  人才结果 ({filteredSeekers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSeekers.map(seeker => (
                    <div
                      key={seeker.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                      <img
                        src={seeker.avatar}
                        alt={seeker.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{seeker.name}</h4>
                        <p className="text-sm text-gray-500">{seeker.title}</p>
                        <p className="text-xs text-accent-600 mt-1">期望 {seeker.expectedSalary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredVideos.length === 0 && filteredJobs.length === 0 && filteredCompanies.length === 0 && filteredSeekers.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">未找到相关结果</p>
                <p className="text-sm text-gray-400 mt-1">试试其他关键词吧</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
