import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Sparkles, Play, MapPin, Briefcase, TrendingUp, Video, Users, X, Building2 } from 'lucide-react';
import { companies, jobs, jobSeekers, interestTags } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { Company, Job, JobSeeker } from '../types';

interface VideoWithCompany {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  type: 'office' | 'team' | 'job' | 'introduction';
  tags: string[];
  views: number;
  likes: number;
  completionRate: number;
  favorites: number;
  conversions: number;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  aiKeywords?: string[];
  companyId: string;
  companyName: string;
  companyLogo: string;
}

interface ScoredVideo extends VideoWithCompany {
  matchScore: number;
  matchedKeywords: string[];
}

interface ScoredJob extends Job {
  matchScore: number;
  matchedKeywords: string[];
}

interface ScoredCompany extends Company {
  matchScore: number;
  matchedKeywords: string[];
}

interface ScoredSeeker extends JobSeeker {
  matchScore: number;
  matchedKeywords: string[];
}

const splitKeywords = (term: string): string[] => {
  if (!term.trim()) return [];
  const patterns = [
    /咖啡师|拉花|React|TypeScript|前端|后端|全栈|健身|教练|私教|花艺|设计师|产品|运营|销售|程序员|算法|AI|机器学习|店长|助理|咖啡|书店|店员/g,
  ];
  const found: string[] = [];
  patterns.forEach(pattern => {
    const matches = term.match(pattern);
    if (matches) {
      matches.forEach(m => {
        if (!found.includes(m)) found.push(m);
      });
    }
  });
  if (found.length === 0) {
    const segments = term.split(/[\s,，、]+/).filter(s => s.trim());
    if (segments.length > 0) return segments;
    const singleChars = term.split('').filter(c => c.trim());
    return singleChars.length > 0 ? [term] : [];
  }
  const remaining = term;
  found.forEach(f => {
    remaining.replace(f, '');
  });
  const restSegments = remaining.split(/[\s,，、]+/).filter(s => s.trim() && !found.includes(s));
  return [...found, ...restSegments];
};

const highlightText = (text: string, keywords: string[]): (string | { match: string })[] => {
  if (keywords.length === 0) return [text];
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map(part => {
    if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
      return { match: part };
    }
    return part;
  });
};

const HighlightSpan = ({ text, keywords }: { text: string; keywords: string[] }) => {
  const parts = highlightText(text, keywords);
  return (
    <span>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium">
            {part.match}
          </mark>
        )
      )}
    </span>
  );
};

const aiSearchSuggestions = [
  '咖啡师 拉花 操作',
  'React 前端开发 TypeScript',
  '健身教练 私教 体能训练',
  '花艺设计师 插花 色彩',
  '产品经理 需求分析',
  'UI设计师 用户体验',
  'AI算法工程师 机器学习',
];

const hotSearches = ['咖啡师', '前端开发', '健身教练', '花艺师', '运营专员', 'UI设计', '产品经理', 'React'];

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

  const activeKeywords = useMemo(() => splitKeywords(activeSearch), [activeSearch]);

  const allVideos: VideoWithCompany[] = useMemo(() =>
    companies.flatMap(company =>
      company.videos.map(video => ({
        ...video,
        companyId: company.id,
        companyName: company.name,
        companyLogo: company.logo,
      }))
    ), []);

  const calculateMatchScore = (texts: string[], keywords: string[]): { score: number; matched: string[] } => {
    if (keywords.length === 0) return { score: 0, matched: [] };
    let score = 0;
    const matched: string[] = [];
    keywords.forEach(kw => {
      const lowerKw = kw.toLowerCase();
      texts.forEach(text => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes(lowerKw)) {
          if (!matched.includes(kw)) matched.push(kw);
          if (lowerText === lowerKw) {
            score += 10;
          } else if (lowerText.startsWith(lowerKw) || lowerText.endsWith(lowerKw)) {
            score += 5;
          } else {
            score += 3;
          }
        }
      });
    });
    return { score, matched };
  };

  const filteredVideos: ScoredVideo[] = useMemo(() => {
    if (!activeSearch || activeKeywords.length === 0) return [];
    return allVideos
      .map(v => {
        const texts = [v.title, ...v.tags, ...(v.aiKeywords || [])];
        const { score, matched } = calculateMatchScore(texts, activeKeywords);
        return { ...v, matchScore: score, matchedKeywords: matched };
      })
      .filter(v => v.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [activeSearch, activeKeywords, allVideos]);

  const filteredJobs: ScoredJob[] = useMemo(() => {
    if (!activeSearch || activeKeywords.length === 0) return [];
    return jobs
      .map(j => {
        const texts = [j.title, j.companyName, j.location, ...j.tags];
        const { score, matched } = calculateMatchScore(texts, activeKeywords);
        return { ...j, matchScore: score, matchedKeywords: matched };
      })
      .filter(j => j.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [activeSearch, activeKeywords]);

  const filteredCompanies: ScoredCompany[] = useMemo(() => {
    if (!activeSearch || activeKeywords.length === 0) return [];
    return companies
      .map(c => {
        const texts = [c.name, c.industry, c.description, c.location, ...c.jobs.map(j => j.title)];
        const { score, matched } = calculateMatchScore(texts, activeKeywords);
        return { ...c, matchScore: score, matchedKeywords: matched };
      })
      .filter(c => c.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [activeSearch, activeKeywords]);

  const filteredSeekers: ScoredSeeker[] = useMemo(() => {
    if (!activeSearch || activeKeywords.length === 0) return [];
    return jobSeekers
      .map(s => {
        const texts = [s.name, s.title, s.bio, s.location, ...s.skills, ...(s.resumeVideo?.aiKeywords || [])];
        const { score, matched } = calculateMatchScore(texts, activeKeywords);
        return { ...s, matchScore: score, matchedKeywords: matched };
      })
      .filter(s => s.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [activeSearch, activeKeywords]);

  const totalResults = filteredVideos.length + filteredJobs.length + filteredCompanies.length + filteredSeekers.length;

  const performSearch = (term: string) => {
    setSearchTerm(term);
    setActiveSearch(term);
    setShowSuggestions(false);
    if (term.trim()) {
      addIndustryInterest(term);
    }
  };

  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerTerm = searchTerm.toLowerCase();
    const fromAI = aiSearchSuggestions.filter(s =>
      s.toLowerCase().includes(lowerTerm) ||
      activeKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))
    ).slice(0, 4);
    const fromHot = hotSearches.filter(h =>
      h.toLowerCase().includes(lowerTerm) ||
      lowerTerm.includes(h.toLowerCase())
    ).slice(0, 3);
    const fromTags = interestTags.filter(t =>
      t.toLowerCase().includes(lowerTerm) ||
      activeKeywords.some(kw => t.toLowerCase().includes(kw.toLowerCase()))
    ).slice(0, 3);
    const combined = [...fromAI, ...fromHot, ...fromTags];
    const unique = [...new Set(combined)];
    return unique.slice(0, 6);
  }, [searchTerm, activeKeywords]);

  const typeTabs = [
    { id: 'all', label: '全部', icon: Search },
    { id: 'videos', label: '视频', icon: Video },
    { id: 'jobs', label: '岗位', icon: Briefcase },
    { id: 'companies', label: '企业', icon: Building2 },
    { id: 'seekers', label: '人才', icon: Users },
  ];

  const getCount = (type: string) => {
    switch (type) {
      case 'videos': return filteredVideos.length;
      case 'jobs': return filteredJobs.length;
      case 'companies': return filteredCompanies.length;
      case 'seekers': return filteredSeekers.length;
      default: return totalResults;
    }
  };

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

          {showSuggestions && searchTerm && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  AI 语义搜索建议
                </p>
              </div>
              <div className="p-2">
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => performSearch(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      <HighlightSpan text={suggestion} keywords={activeKeywords.length > 0 ? activeKeywords : [searchTerm]} />
                    </span>
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
                不仅搜索文字，更能理解视频内容。比如搜索"咖啡师拉花"，自动匹配带有拉花操作画面的岗位视频。
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
                    <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                      {getCount(tab.id)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
              <span>搜索 "<HighlightSpan text={activeSearch} keywords={activeKeywords} />"</span>
              {activeKeywords.length > 1 && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">拆分关键词:</span>
                  {activeKeywords.map(kw => (
                    <span key={kw} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                      {kw}
                    </span>
                  ))}
                </span>
              )}
              <span>·</span>
              <span>共找到 {totalResults} 条结果</span>
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
                  {filteredVideos.map(video => (
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
                        <p className="text-white text-sm font-medium line-clamp-2">
                          <HighlightSpan text={video.title} keywords={video.matchedKeywords} />
                        </p>
                        <p className="text-white/70 text-xs mt-1">{video.companyName}</p>
                        {video.matchedKeywords.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <Sparkles className="w-3 h-3 text-primary-300" />
                            {video.matchedKeywords.slice(0, 3).map(kw => (
                              <span key={kw} className="px-1.5 py-0.5 bg-yellow-400/80 text-yellow-900 rounded text-xs font-medium">
                                {kw}
                              </span>
                            ))}
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
                  {filteredJobs.map(job => (
                    <div
                      key={job.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            <HighlightSpan text={job.title} keywords={job.matchedKeywords} />
                          </h4>
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
                          <HighlightSpan text={job.location} keywords={job.matchedKeywords} />
                        </span>
                        <span><HighlightSpan text={job.companyName} keywords={job.matchedKeywords} /></span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.tags.map(tag => (
                          <span key={tag} className="tag tag-blue">
                            <HighlightSpan text={tag} keywords={job.matchedKeywords} />
                          </span>
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
                  <Building2 className="w-5 h-5 text-green-500" />
                  企业结果 ({filteredCompanies.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCompanies.map(company => (
                    <div
                      key={company.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800 truncate">
                            <HighlightSpan text={company.name} keywords={company.matchedKeywords} />
                          </h4>
                          {company.verified && (
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs">✓</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          <HighlightSpan text={company.industry} keywords={company.matchedKeywords} /> · {company.size}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          <HighlightSpan text={company.location} keywords={company.matchedKeywords} /> · {company.jobs.length}个岗位在招
                        </p>
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
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800">
                          <HighlightSpan text={seeker.name} keywords={seeker.matchedKeywords} />
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          <HighlightSpan text={seeker.title} keywords={seeker.matchedKeywords} />
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {seeker.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="tag tag-purple">
                              <HighlightSpan text={skill} keywords={seeker.matchedKeywords} />
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-accent-600 mt-1">期望 {seeker.expectedSalary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">未找到 "{activeSearch}" 相关结果</p>
                <p className="text-sm text-gray-400 mb-6">试试这些热门搜索词吧</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {hotSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => performSearch(term)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
