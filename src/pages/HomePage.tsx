import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Briefcase, Play, ChevronDown } from 'lucide-react';
import { companies } from '../data/mockData';
import { Video } from '../types';

interface VideoCardProps {
  video: Video;
  companyId: string;
  companyName: string;
  companyLogo: string;
  jobTitle?: string;
  index: number;
}

const VideoCard = ({ video, companyName, companyLogo, jobTitle, index }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(video.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
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

  return (
    <div
      className="relative w-full h-[75vh] max-h-[600px] rounded-2xl overflow-hidden bg-gray-900 card-hover"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${video.thumbnail})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110">
          <Play className="w-8 h-8 ml-1" fill="white" />
        </button>
      </div>

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
          <img src={companyLogo} alt={companyName} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-white text-sm font-medium">{companyName}</span>
          {video.type === 'job' && (
            <span className="px-2 py-0.5 bg-accent-500 text-white text-xs rounded-full">招聘中</span>
          )}
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
          {formatDuration(video.duration)}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-lg font-bold mb-2">{video.title}</h3>
        {jobTitle && (
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-accent-400" />
            <span className="text-accent-400 font-medium">{jobTitle}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {video.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
        {video.aiKeywords && video.aiKeywords.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-white/70 mb-3">
            <span className="text-primary-400">🤖 AI识别:</span>
            {video.aiKeywords.slice(0, 3).map(kw => (
              <span key={kw} className="text-primary-300">{kw}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span>{formatViews(video.views)} 次观看</span>
        </div>
      </div>

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-pink-400 transition-colors"
        >
          <div className={`w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ${isLiked ? 'text-pink-500' : ''}`}>
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs">{formatViews(likes)}</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-white/90 hover:text-primary-400 transition-colors">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs">评论</span>
        </button>

        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="flex flex-col items-center gap-1 text-white/90 hover:text-yellow-400 transition-colors"
        >
          <div className={`w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ${isBookmarked ? 'text-yellow-400' : ''}`}>
            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs">收藏</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-white/90 hover:text-green-400 transition-colors">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs">分享</span>
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('推荐');
  const tabs = ['推荐', '附近', '高薪', '最新', '餐饮', '科技', '健身'];

  const allVideos = companies.flatMap(company =>
    company.videos.map(video => ({
      ...video,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logo,
      jobTitle: company.jobs.find(j => j.videoId === video.id)?.title
    }))
  );

  const recommendedVideos = [...allVideos].sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">为你推荐</h2>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
            <ChevronDown className="w-4 h-4" />
            换一批
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recommendedVideos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              companyId={video.companyId}
              companyName={video.companyName}
              companyLogo={video.companyLogo}
              jobTitle={video.jobTitle}
              index={index}
            />
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">企业招聘新方式</h3>
              <p className="text-white/80 text-sm">用短视频展示岗位，吸引更多优质人才</p>
            </div>
            <button className="px-6 py-2.5 bg-white text-primary-600 font-semibold rounded-full hover:bg-white/90 transition-colors">
              立即入驻
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">热门岗位</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700">查看更多</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.flatMap(c => c.jobs).slice(0, 6).map(job => (
              <div
                key={job.id}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-accent-600 font-bold text-lg">{job.salary}</p>
                  </div>
                  {job.videoThumbnail && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={job.videoThumbnail} alt="" className="w-full h-full object-cover" />
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
                  </div>
                  <span className="text-xs text-gray-400">{job.applications}人投递</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
