import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Bookmark, MapPin, Briefcase, Play, ChevronDown,
  Sparkles, Search, Map, X, Filter,
  Video, Users, Building2, ShieldCheck, TrendingUp,
  RefreshCw, CheckCircle2, Factory, Navigation, UserCheck,
  ClipboardCheck, Eye, BarChart3, BriefcaseBusiness
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { companies, jobSeekers, heatmapData } from '../data/mockData';
import { ScoreBreakdown } from '../types';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  totalScore: number;
}

const ScoreBreakdownDisplay = ({ breakdown, totalScore }: ScoreBreakdownProps) => {
  const items = [
    { label: '行业', value: breakdown.industry, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { label: '薪资', value: breakdown.salary, color: 'bg-green-500', textColor: 'text-green-600' },
    { label: '通勤', value: breakdown.commute, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: '互动', value: breakdown.interaction, color: 'bg-orange-500', textColor: 'text-orange-600' }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">匹配度 {Math.round(totalScore)} 分</span>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary-500" />
          <span className="text-[10px] text-gray-500">AI加权</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`text-[10px] font-medium w-6 ${item.textColor}`}>{item.label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min((item.value / 35) * 100, 100)}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold w-6 text-right ${item.textColor}`}>
              +{Math.round(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface VideoCardProps {
  video: any;
  companyId: string;
  companyName: string;
  companyLogo: string;
  jobTitle?: string;
  index: number;
  scoreBreakdown?: ScoreBreakdown;
  onInteraction: () => void;
  showToast: (msg: string) => void;
}

const VideoCard = ({
  video,
  companyId,
  companyName,
  companyLogo,
  jobTitle,
  index,
  scoreBreakdown,
  onInteraction,
  showToast
}: VideoCardProps) => {
  const {
    toggleLikeVideo, toggleBookmarkVideo, isVideoLiked, isVideoBookmarked,
    markVideoWatched, shareVideo, markVideoCompleted
  } = useApp();
  const navigate = useNavigate();

  const isLiked = isVideoLiked(video.id);
  const isBookmarked = isVideoBookmarked(video.id);
  const [likes, setLikes] = useState(video.likes + (isLiked ? 1 : 0));
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleLikeVideo(video.id);
    setLikes(prev => result ? prev + 1 : prev - 1);
    onInteraction();
    showToast('已更新推荐排序');
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkVideo(video.id);
    onInteraction();
    showToast('已更新推荐排序');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareVideo(video.id);
    onInteraction();
    showToast('已更新推荐排序');
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    markVideoCompleted(video.id);
    onInteraction();
    showToast('已更新推荐排序');
  };

  const handleCardClick = () => {
    markVideoWatched(video.id);
    onInteraction();
    navigate(`/company/${companyId}`);
  };

  const formatViews = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const videoTypeLabels: Record<string, { label: string; color: string }> = {
    job: { label: '岗位招聘', color: 'bg-accent-500' },
    office: { label: '办公环境', color: 'bg-blue-500' },
    team: { label: '团队介绍', color: 'bg-green-500' },
    introduction: { label: '企业介绍', color: 'bg-purple-500' }
  };

  const typeInfo = videoTypeLabels[video.type] || { label: '视频', color: 'bg-gray-500' };

  return (
    <div
      onClick={handleCardClick}
      className="relative w-full h-[75vh] max-h-[560px] rounded-2xl overflow-hidden bg-gray-900 card-hover cursor-pointer group"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${video.thumbnail})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent group-hover:scale-[1.02] transition-transform duration-500" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleComplete}
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110"
        >
          <Play className="w-8 h-8 ml-1" fill="white" />
        </button>
      </div>

      <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <span className={`px-2.5 py-1 ${typeInfo.color} text-white text-xs rounded-full font-medium shadow-md`}>
              {typeInfo.label}
            </span>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <img src={companyLogo} alt={companyName} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-white text-sm font-medium">{companyName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
              {formatDuration(video.duration)}
            </div>
          </div>
        </div>

        {video.score !== undefined && video.score > 40 && scoreBreakdown && (
          <div>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowBreakdown(!showBreakdown);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              <Sparkles className="w-3 h-3" />
              <span>匹配 {Math.round(video.score)}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </button>
            {showBreakdown && (
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                <ScoreBreakdownDisplay breakdown={scoreBreakdown} totalScore={video.score} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
        <h3 className="text-lg font-bold mb-2">{video.title}</h3>
        {jobTitle && (
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-accent-400" />
            <span className="text-accent-400 font-medium">{jobTitle}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {video.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
        {video.aiKeywords && video.aiKeywords.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-white/80 mb-3 flex-wrap">
            <span className="text-primary-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI识别:
            </span>
            {video.aiKeywords.slice(0, 3).map((kw: string) => (
              <span key={kw} className="text-primary-300">{kw}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span>{formatViews(video.views)} 次观看</span>
        </div>
      </div>

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-pink-400 transition-all hover:scale-110"
        >
          <div className={`w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-colors ${isLiked ? 'text-pink-500' : ''}`}>
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs font-medium">{formatViews(likes)}</span>
        </button>

        <Link
          to={`/company/${companyId}`}
          onClick={e => e.stopPropagation()}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-primary-400 transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs">评论</span>
        </Link>

        <button
          onClick={handleBookmark}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-yellow-400 transition-all hover:scale-110"
        >
          <div className={`w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-colors ${isBookmarked ? 'text-yellow-400' : ''}`}>
            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs">收藏</span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-green-400 transition-all hover:scale-110"
        >
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs">分享</span>
        </button>
      </div>
    </div>
  );
};

interface PreferencePanelProps {
  onClose: () => void;
}

const PreferencePanel = ({ onClose }: PreferencePanelProps) => {
  const { preferences, addIndustryInterest, removeIndustryInterest, setSalaryRange, setCommutePreference } = useApp();

  const industries = ['互联网/科技', '餐饮/咖啡', '健身/运动', '零售/快消', '教育/培训', '生活服务', '医疗/健康', '金融/银行', '文化传媒', '建筑/地产'];
  const salaries = ['全部', '5k以下', '5k-10k', '10k-20k', '20k-30k', '30k以上'];
  const commutes = [
    { id: 'walk', label: '步行15分钟' },
    { id: 'bike', label: '骑行15分钟' },
    { id: 'bus', label: '公交15分钟' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">个性化推荐设置</h3>
            <p className="text-sm text-gray-500">完善偏好，获取更精准的推荐</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-500" />
              行业兴趣（多选）
            </h4>
            <div className="flex flex-wrap gap-2">
              {industries.map(ind => {
                const selected = preferences.industryInterests.includes(ind);
                return (
                  <button
                    key={ind}
                    onClick={() => selected ? removeIndustryInterest(ind) : addIndustryInterest(ind)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selected ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-green-500" />
              期望薪资
            </h4>
            <div className="flex flex-wrap gap-2">
              {salaries.map(salary => (
                <button
                  key={salary}
                  onClick={() => setSalaryRange(salary)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${preferences.salaryRange === salary ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {salary}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Map className="w-4 h-4 text-blue-500" />
              通勤偏好
            </h4>
            <div className="flex flex-wrap gap-2">
              {commutes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCommutePreference(preferences.commutePreference === c.id ? null : (c.id as 'walk' | 'bike' | 'bus' | null))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${preferences.commutePreference === c.id ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <p className="text-xs text-gray-600">
              偏好设置会基于你的互动行为（点赞、收藏、完播）自动更新推荐内容，你也可以手动添加行业和薪资来获取更精准的岗位和视频推荐。
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            保存并查看推荐
          </button>
        </div>
      </div>
    </div>
  );
};

const hotSearchKeywords = [
  { text: '咖啡师拉花', icon: '☕' },
  { text: 'React前端', icon: '💻' },
  { text: '健身私教', icon: '💪' }
];

const getHeatmapColor = (intensity: number): string => {
  if (intensity >= 0.85) return 'bg-red-500';
  if (intensity >= 0.7) return 'bg-orange-500';
  if (intensity >= 0.55) return 'bg-yellow-500';
  if (intensity >= 0.4) return 'bg-green-500';
  return 'bg-blue-500';
};

const getHeatmapOpacity = (intensity: number): number => {
  return 0.5 + intensity * 0.5;
};

const HomePage = () => {
  const navigate = useNavigate();
  const { getRecommendedVideos, getDiscoveryVideos, getRecommendedJobs, preferences, interactions } = useApp();
  const [activeTab, setActiveTab] = useState<'recommend' | 'discover'>('recommend');
  const [showPrefs, setShowPrefs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, forceRefresh] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hasPreferences =
    preferences.industryInterests.length > 0 ||
    preferences.salaryRange !== '全部' ||
    preferences.commutePreference !== null;

  const hasInteractions =
    interactions.likedVideos.length > 0 ||
    interactions.bookmarkedVideos.length > 0 ||
    interactions.completedVideos.length > 0 ||
    interactions.sharedVideos.length > 0 ||
    interactions.watchedVideos.length > 0 ||
    interactions.followedCompanies.length > 0;

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  const handleInteractionUpdate = useCallback(() => {
    forceRefresh(prev => prev + 1);
  }, []);

  const recommendedVideos = useMemo(() => {
    const list: any[] = activeTab === 'recommend' ? getRecommendedVideos() : getDiscoveryVideos();
    return list.map(v => {
      const company = companies.find(c => c.id === v.companyId);
      return {
        ...v,
        jobTitle: company?.jobs.find(j => j.videoId === v.id)?.title
      };
    });
  }, [activeTab, getRecommendedVideos, getDiscoveryVideos, refreshKey]);

  const recommendedJobs = useMemo(() => getRecommendedJobs().slice(0, 6), [getRecommendedJobs, refreshKey]);

  const enterpriseVideos = useMemo(() => {
    const videos: Array<{ id: string; thumbnail: string; title: string; companyId: string; companyName: string; type: string }> = [];
    companies.forEach(company => {
      company.videos.forEach(video => {
        if (videos.length < 6) {
          videos.push({
            id: video.id,
            thumbnail: video.thumbnail,
            title: video.title,
            companyId: company.id,
            companyName: company.name,
            type: video.type
          });
        }
      });
    });
    return videos.slice(0, 6);
  }, []);

  const verificationStatuses = useMemo(() => {
    return companies.slice(0, 5).map(company => ({
      id: company.id,
      name: company.name,
      logo: company.logo,
      industry: company.industry,
      businessVerified: company.verified,
      addressVerified: company.verified,
      legalVerified: company.verified
    }));
  }, []);

  const tabs = [
    { id: 'recommend', label: '职影推荐', icon: Sparkles, desc: '基于你的偏好与互动加权推荐' },
    { id: 'discover', label: '发现更多', icon: Video, desc: '跨行业探索新鲜内容' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const handleHotSearch = (keyword: string) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const refreshRecommendations = () => {
    forceRefresh(prev => prev + 1);
    showToast('推荐已刷新');
  };

  const getTotalInteractionCount = () => {
    return interactions.likedVideos.length +
           interactions.bookmarkedVideos.length +
           interactions.completedVideos.length +
           interactions.sharedVideos.length +
           interactions.watchedVideos.length +
           interactions.followedCompanies.length;
  };

  const getCommuteLabel = () => {
    if (!preferences.commutePreference) return null;
    const map: Record<string, string> = {
      walk: '步行15分钟',
      bike: '骑行15分钟',
      bus: '公交15分钟'
    };
    return map[preferences.commutePreference];
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="px-4 py-2.5 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-xl shadow-lg animate-slide-up flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            {toast.message}
          </div>
        ))}
      </div>

      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <form onSubmit={handleSearch} className="py-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="AI语义搜索：搜索岗位技能、工作场景..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium whitespace-nowrap flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              AI搜索
            </button>
            <Link
              to="/map"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Map className="w-4 h-4" />
              地图找岗
            </Link>
            <button
              type="button"
              onClick={() => setShowPrefs(true)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${hasPreferences ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Filter className="w-4 h-4" />
              {hasPreferences ? '已设置' : '偏好设置'}
            </button>
          </form>

          <div className="pb-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              热门搜索:
            </span>
            {hotSearchKeywords.map(item => (
              <button
                key={item.text}
                onClick={() => handleHotSearch(item.text)}
                className="px-3 py-1 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 text-gray-600 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>{item.icon}</span>
                {item.text}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-3 scrollbar-hide border-t border-gray-50 pt-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${isActive ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-800'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={refreshRecommendations}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50"
              >
                <RefreshCw className="w-4 h-4" />
                刷新推荐
              </button>
            </div>
          </div>
        </div>
        {hasPreferences && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {preferences.industryInterests.slice(0, 3).map(ind => (
                <span key={ind} className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                  {ind}
                </span>
              ))}
              {preferences.salaryRange !== '全部' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                  {preferences.salaryRange}
                </span>
              )}
              {preferences.commutePreference && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  {getCommuteLabel()}
                </span>
              )}
              <button
                onClick={() => setShowPrefs(true)}
                className="text-xs text-gray-500 underline underline-offset-2 hover:text-primary-600"
              >
                编辑
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {activeTab === 'recommend' && (
          <div className="mb-6">
            {!hasPreferences && !hasInteractions ? (
              <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border border-amber-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">开启个性化推荐之旅</p>
                      <p className="text-sm text-gray-600 mt-1">
                        设置你的行业偏好或与内容互动，AI 将为你精选最合适的岗位和企业视频
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrefs(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    立即设置偏好
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-r from-purple-50 via-blue-50 to-orange-50 rounded-2xl border border-purple-100">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-5">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          智能推荐引擎
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-[10px] font-semibold">
                            AI驱动
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          已为你精选 <span className="font-bold text-purple-600">{recommendedVideos.length}</span> 条内容
                          {recommendedVideos.length > 0 && recommendedVideos[0]?.score !== undefined && (
                            <> · TOP1 匹配度 <span className="font-bold text-accent-600">{Math.round(recommendedVideos[0].score)}</span> 分</>
                          )}
                        </p>
                      </div>
                    </div>

                    {recommendedVideos.length > 0 && recommendedVideos[0]?.scoreBreakdown && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-purple-600 w-10">行业</span>
                          <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((recommendedVideos[0].scoreBreakdown.industry / 35) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-purple-600 w-10 text-right">+{Math.round(recommendedVideos[0].scoreBreakdown.industry)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-green-600 w-10">薪资</span>
                          <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((recommendedVideos[0].scoreBreakdown.salary / 35) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-green-600 w-10 text-right">+{Math.round(recommendedVideos[0].scoreBreakdown.salary)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-600 w-10">通勤</span>
                          <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((recommendedVideos[0].scoreBreakdown.commute / 35) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-blue-600 w-10 text-right">+{Math.round(recommendedVideos[0].scoreBreakdown.commute)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-orange-600 w-10">互动</span>
                          <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((recommendedVideos[0].scoreBreakdown.interaction / 35) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-orange-600 w-10 text-right">+{Math.round(recommendedVideos[0].scoreBreakdown.interaction)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                        你已互动 <span className="font-bold text-orange-600">{getTotalInteractionCount()}</span> 次
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        行业偏好 <span className="font-bold text-purple-600">{preferences.industryInterests.length}</span> 个
                      </span>
                      {preferences.salaryRange !== '全部' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <Briefcase className="w-3.5 h-3.5 text-green-500" />
                          薪资 <span className="font-bold text-green-600">{preferences.salaryRange}</span>
                        </span>
                      )}
                      {preferences.commutePreference && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <Navigation className="w-3.5 h-3.5 text-blue-500" />
                          通勤 <span className="font-bold text-blue-600">{getCommuteLabel()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPrefs(true)}
                    className="px-5 py-2.5 bg-white text-primary-600 text-sm font-semibold rounded-xl shadow-md hover:shadow-lg border border-primary-100 transition-all flex items-center gap-1.5"
                  >
                    <Filter className="w-4 h-4" />
                    {hasPreferences ? '调整偏好' : '设置偏好'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
