import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Play, Heart, Share2,
  MessageSquare, BookOpen, Users, Briefcase
} from 'lucide-react';
import { companies } from '../data/mockData';
import { Video, Job } from '../types';

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const company = companies.find(c => c.id === id);

  const [activeTab, setActiveTab] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>企业不存在</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'videos', label: '视频' },
    { id: 'jobs', label: '招聘岗位' },
    { id: 'team', label: '团队成员' },
    { id: 'about', label: '关于我们' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary-500 to-accent-500">
        {company.videos.length > 0 && (
          <div className="absolute inset-0">
            <img
              src={company.videos[0].thumbnail}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          ←
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <img
              src={company.logo}
              alt={company.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg -mt-16 md:-mt-20"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
                {company.verified && (
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </div>
              <p className="text-gray-500 mb-2">
                {company.industry} · {company.size}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {formatNumber(company.stats.followers)} 关注
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {company.jobs.length} 个岗位
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {isFollowing ? '已关注' : '关注'}
              </button>
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-100">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'videos' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {company.videos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
                          <span>{formatDuration(video.duration)}</span>
                          <span>·</span>
                          <span>{formatNumber(video.views)}次播放</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-xs text-white">
                        {video.type === 'office' ? '环境' : video.type === 'team' ? '团队' : video.type === 'job' ? '岗位' : '介绍'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {company.jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {company.teamMembers.map(member => (
                  <div key={member.id} className="text-center p-4 bg-gray-50 rounded-xl">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h4 className="font-medium text-gray-800">{member.name}</h4>
                    <p className="text-sm text-gray-500">{member.position}</p>
                    <p className="text-xs text-gray-400 mt-1">{member.department}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                    企业介绍
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{company.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-500" />
                    公司地址
                  </h3>
                  <p className="text-gray-600">{company.address}</p>
                  <div className="mt-3 h-40 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400">地图位置</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-xl">
                    <p className="text-2xl font-bold text-primary-600">{formatNumber(company.stats.views)}</p>
                    <p className="text-sm text-gray-500 mt-1">总浏览量</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{formatNumber(company.stats.followers)}</p>
                    <p className="text-sm text-gray-500 mt-1">关注者</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <p className="text-2xl font-bold text-orange-600">{company.stats.jobApplications}</p>
                    <p className="text-sm text-gray-500 mt-1">收到简历</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedVideo.thumbnail}
              alt={selectedVideo.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70"
            >
              ✕
            </button>

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <img
                src={company.logo}
                alt={company.name}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <span className="text-white text-sm font-medium">{company.name}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h3 className="text-lg font-bold mb-2">{selectedVideo.title}</h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedVideo.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
              {selectedVideo.aiKeywords && (
                <div className="p-3 bg-black/40 backdrop-blur-sm rounded-xl">
                  <p className="text-xs text-primary-400 mb-1">🤖 AI 视频语义识别</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVideo.aiKeywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 bg-primary-500/30 rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="text-xs">{formatNumber(selectedVideo.likes)}</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-xs">评论</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-xs">分享</span>
              </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all">
                <Play className="w-8 h-8 ml-1" fill="white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JobCard = ({ job }: { job: Job }) => {
  return (
    <div className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
          <p className="text-accent-600 font-bold text-xl">{job.salary}</p>
        </div>
        {job.videoThumbnail && (
          <div className="w-20 h-28 rounded-lg overflow-hidden relative flex-shrink-0">
            <img src={job.videoThumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-6 h-6 text-white" fill="white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="tag tag-blue">{job.type}</span>
        <span className="tag tag-green">{job.experience}</span>
        <span className="tag tag-purple">{job.education}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <MapPin className="w-4 h-4" />
        {job.address}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{job.applications}人投递</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">{job.postedDate}发布</span>
        </div>
        <button className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-full hover:bg-primary-600 transition-colors">
          立即投递
        </button>
      </div>
    </div>
  );
};

export default CompanyDetailPage;
