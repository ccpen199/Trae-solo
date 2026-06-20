import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Bookmark, MapPin, Briefcase, Play, ChevronDown,
  Sparkles, Search, Map, X, Filter,
  Video, Users, Building2, ShieldCheck, TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { companies, jobSeekers, heatmapData } from '../data/mockData';
import { ScoreBreakdown } from '../types';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  totalScore: number;
}

const ScoreBreakdownDisplay = ({ breakdown, totalScore }: ScoreBreakdownProps) => {
  const items = [
    { label: '行业', value: breakdown.industry, color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' },
    { label: '薪资', value: breakdown.salary, color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' },
    { label: '通勤', value: breakdown.commute, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    { label: '互动', value: breakdown.interaction, color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50' },
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
                style={{ width: `${(item.value / 35) * 100}%` }}
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
}

const VideoCard = ({
  video,
  companyId,
  companyName,
  companyLogo,
  jobTitle,
  index,
  scoreBreakdown,
}: VideoCardProps) => {
  const {
    toggleLikeVideo, toggleBookmarkVideo, isVideoLiked, isVideoBookmarked,
    markVideoWatched, shareVideo
  } = useApp();
  const navigate = useNavigate();

  const isLiked = isVideoLiked(video.id);
  const isBookmarked = isVideoBookmarked(video.id);
  const [likes, setLikes] = useState(video.likes + (isLiked ? 1 : 0));
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleLikeVideo(video.id);
    setLikes((prev: number) => result ? prev + 1 : prev - 1);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmarkVideo(video.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareVideo(video.id);
  };

  const handleCardClick = () => {
    markVideoWatched(video.id);
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
    job: { label: '岗位', color: 'bg-accent-500' },
    office: { label: '办公环境', color: 'bg-blue-500' },
    team: { label: '团队', color: 'bg-green-500' },
    introduction: { label: '介绍', color: 'bg-purple-500' },
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
        <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110">
          <Play className="w-8 h-8 ml-1" fill="white" />
        </button>
      </div>

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10 gap-2">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
          <img src={companyLogo} alt={companyName} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-white text-sm font-medium">{companyName}</span>
          <span className={`px-2 py-0.5 ${typeInfo.color} text-white text-xs rounded-full`}>{typeInfo.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
            {formatDuration(video.duration)}
          </div>
        </div>
      </div>

      {video.score !== undefined && video.score > 40 && scoreBreakdown && (
        <div className="absolute top-16 left-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown(!showBreakdown);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3 h-3" />
            <span>匹配 {Math.round(video.score)}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
          </button>
          {showBreakdown && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <ScoreBreakdownDisplay breakdown={scoreBreakdown} totalScore={video.score} />
            </div>
          )}
        </div>
      )}

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
          onClick={(e) => e.stopPropagation()}
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
    { id: 'bus', label: '公交15分钟' },
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selected
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    preferences.salaryRange === salary
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
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
                  onClick={() => setCommutePreference(
                    preferences.commutePreference === c.id ? null : (c.id as 'walk' | 'bike' | 'bus' | null)
                  )}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    preferences.commutePreference === c.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <p className="text-xs text-gray-600">
              💡 偏好设置会基于你的互动行为（点赞、收藏、完播）自动更新推荐内容，你也可以手动添加行业和薪资来获取更精准的岗位和视频推荐。
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
  { text: '健身私教', icon: '💪' },
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
  const [, forceRefresh] = useState(0);

  const hasPreferences =
    preferences.industryInterests.length > 0 ||
    preferences.salaryRange !== '全部' ||
    preferences.commutePreference !== null;

  const recommendedVideos = useMemo(() => {
      const list: any[] = activeTab === 'recommend' ? getRecommendedVideos() : getDiscoveryVideos();
      return list.map(v => {
        const company = companies.find(c => c.id === v.companyId);
        return {
          ...v,
          jobTitle: company?.jobs.find(j => j.videoId === v.id)?.title,
        };
      });
    }, [activeTab, getRecommendedVideos, getDiscoveryVideos, forceRefresh]);

  const recommendedJobs = useMemo(() => getRecommendedJobs().slice(0, 6), [getRecommendedJobs]);

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
            type: video.type,
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
      legalVerified: company.verified || Math.random() > 0.3,
    }));
  }, []);

  const tabs = [
    { id: 'recommend', label: '职影推荐', icon: Sparkles, desc: '基于你的偏好与互动加权推荐' },
    { id: 'discover', label: '发现更多', icon: Video, desc: '跨行业探索新鲜内容' },
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
  };

  const getTotalInteractionCount = () => {
    return interactions.likedVideos.length + interactions.bookmarkedVideos.length + interactions.completedVideos.length;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
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
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                hasPreferences
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
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
                  className={`flex items-center gap-1.5 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-primary-600 border-primary-600'
                      : 'text-gray-500 border-transparent hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={refreshRecommendations}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                换一批
              </button>
            </div>
          </div>
        </div>
        {hasPreferences && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {preferences.industryInterests.slice(0, 3).map(ind => (
                <span key={ind} className="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                  🏷️ {ind}
                </span>
              ))}
              {preferences.salaryRange !== '全部' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                  💰 {preferences.salaryRange}
                </span>
              )}
              {preferences.commutePreference && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  🚶 {preferences.commutePreference === 'walk' ? '步行' : preferences.commutePreference === 'bike' ? '骑行' : '公交'} 15分钟
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
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-orange-50 rounded-2xl border border-purple-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">智能推荐引擎</p>
                  <p className="text-xs text-gray-600">
                    {recommendedVideos.length > 0
                      ? `已为你精选 ${recommendedVideos.length} 条内容 · 最高匹配度 ${Math.round(recommendedVideos[0]?.score || 0)}分 · 你已互动 ${getTotalInteractionCount()} 次`
                      : '添加偏好以获得更精准的推荐'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrefs(true)}
                className="px-4 py-2 bg-white text-primary-600 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {hasPreferences ? '调整偏好' : '设置偏好'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === 'recommend' ? '为你推荐' : '发现精彩'}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === 'recommend'
                ? '基于行业兴趣、薪资预期、通勤偏好与互动行为双重加权推荐'
                : '探索不同行业的优质岗位与企业视频'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recommendedVideos.map((video, index) => (
            <VideoCard
              key={`${video.id}-${activeTab}`}
              video={video}
              companyId={video.companyId}
              companyName={video.companyName}
              companyLogo={video.companyLogo}
              jobTitle={video.jobTitle}
              index={index}
              scoreBreakdown={video.scoreBreakdown}
            />
          ))}
        </div>

        {recommendedJobs.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">匹配你的热门岗位</h2>
                <p className="text-sm text-gray-500">基于偏好与互动加权排序</p>
              </div>
              <Link to="/jobs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                查看更多
                <ChevronDown className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/company/${job.companyId}`)}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 cursor-pointer card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{job.title}</h3>
                        {job.score > 40 && (
                          <span className="px-1.5 py-0.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[10px] rounded-full font-medium">
                            匹配 {Math.round(job.score)}
                          </span>
                        )}
                      </div>
                      <p className="text-accent-600 font-bold text-lg mt-1">{job.salary}</p>
                    </div>
                    {job.videoThumbnail && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative group">
                        <img src={job.videoThumbnail} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                    <span>·</span>
                    {job.experience}
                    <span>·</span>
                    {job.education}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.tags.map(tag => (
                      <span key={tag} className="tag tag-blue">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <img src={job.companyLogo} alt="" className="w-6 h-6 rounded-full" />
                      <span className="text-sm text-gray-600">{job.companyName}</span>
                      {job.verified && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded-full font-medium">
                          已认证
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{job.applications}人投递</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                视频简历人才库
              </h2>
              <p className="text-sm text-gray-500">AI自动提取字幕与技能关键词，快速识人</p>
            </div>
            <Link to="/seekers" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部
              <ChevronDown className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {jobSeekers.slice(0, 3).map(seeker => (
              <Link
                key={seeker.id}
                to={`/seeker/${seeker.id}`}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 card-hover"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={seeker.avatar}
                    alt={seeker.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{seeker.name}</h3>
                    <p className="text-sm text-primary-600 font-medium">{seeker.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{seeker.experience} · {seeker.education}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{seeker.location}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    AI识别技能
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {seeker.resumeVideo?.aiKeywords?.slice(0, 4).map(kw => (
                      <span key={kw} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">技能标签</p>
                  <div className="flex flex-wrap gap-1.5">
                    {seeker.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{seeker.views} 次浏览</span>
                  <span className="text-sm font-semibold text-green-600">{seeker.expectedSalary}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                企业真实性核验
              </h2>
              <p className="text-sm text-gray-500">工商比对+街景验证，保障岗位真实可靠</p>
            </div>
            <Link to="/companies" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              全部企业
              <ChevronDown className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-5 gap-0 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="col-span-2 text-xs font-semibold text-gray-600">企业</div>
              <div className="text-center text-xs font-semibold text-gray-600">工商</div>
              <div className="text-center text-xs font-semibold text-gray-600">地址</div>
              <div className="text-center text-xs font-semibold text-gray-600">法人</div>
            </div>
            {verificationStatuses.map(company => (
              <Link
                key={company.id}
                to={`/company/${company.id}`}
                className="grid grid-cols-5 gap-0 items-center px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <img src={company.logo} alt={company.name} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.industry}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  {company.businessVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      已核验
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">
                      待核验
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  {company.addressVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      已核验
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">
                      待核验
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  {company.legalVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      已核验
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-medium">
                      审核中
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link
            to="/map"
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden card-hover"
          >
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Map className="w-4 h-4 text-blue-600" />
                  15分钟通勤热力图
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">点击查看完整地图找岗</p>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors -rotate-90" />
            </div>
            <div className="relative h-48 bg-gradient-to-br from-blue-50 via-green-50 to-orange-50 overflow-hidden">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
              {heatmapData.slice(0, 6).map((point, idx) => {
                const x = 15 + ((point.lng - 121.38) / 0.18) * 70;
                const y = 15 + ((31.27 - point.lat) / 0.12) * 70;
                const size = 28 + point.intensity * 40;
                return (
                  <div
                    key={idx}
                    className={`absolute rounded-full ${getHeatmapColor(point.intensity)} blur-md heatmap-cell`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      opacity: getHeatmapOpacity(point.intensity),
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600">热度:</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-gray-600">
                  {heatmapData.reduce((sum, h) => sum + h.jobCount, 0)} 个岗位
                </span>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  企业视频画廊
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">办公环境/团队/岗位实拍</p>
              </div>
              <Link to="/companies" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                更多
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1.5">
              {enterpriseVideos.map(video => {
                const typeLabel: Record<string, string> = {
                  job: '岗位',
                  office: '环境',
                  team: '团队',
                  introduction: '介绍',
                };
                const typeColor: Record<string, string> = {
                  job: 'bg-accent-500',
                  office: 'bg-blue-500',
                  team: 'bg-green-500',
                  introduction: 'bg-purple-500',
                };
                return (
                  <Link
                    key={video.id}
                    to={`/company/${video.companyId}`}
                    className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-1.5 right-1.5">
                      <span className={`px-1.5 py-0.5 ${typeColor[video.type] || 'bg-gray-500'} text-white text-[9px] rounded-full font-medium`}>
                        {typeLabel[video.type] || '视频'}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-4 h-4 ml-0.5 text-white" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <p className="text-[10px] text-white font-medium truncate">{video.title}</p>
                      <p className="text-[9px] text-white/70 truncate">{video.companyName}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                企业招聘新方式
              </h3>
              <p className="text-white/80 text-sm">用短视频展示岗位，吸引更多优质人才</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/enterprise"
                className="px-6 py-2.5 bg-white text-primary-600 font-semibold rounded-full hover:bg-white/90 transition-colors text-sm"
              >
                入驻企业版
              </Link>
              <Link
                to="/map"
                className="px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-colors text-sm flex items-center gap-1.5"
              >
                <Map className="w-4 h-4" />
                地图找岗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showPrefs && <PreferencePanel onClose={() => setShowPrefs(false)} />}
    </div>
  );
};

export default HomePage;
