import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Briefcase, Play, Heart, Share2,
  GraduationCap, MessageSquare,
  Sparkles, Mic, Copy, Download
} from 'lucide-react';
import { jobSeekers } from '../data/mockData';

const SeekerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seeker = jobSeekers.find(s => s.id === id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(seeker?.resumeVideo?.likes || 0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const timerRef = useRef<number | null>(null);

  if (!seeker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>用户不存在</p>
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
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const video = seeker.resumeVideo;
  const subtitles = video?.subtitles || [];

  useEffect(() => {
    if (isPlaying && subtitles.length > 0) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= (video?.duration || 0)) {
            setIsPlaying(false);
            return 0;
          }
          const subtitle = subtitles.find(
            s => next >= s.startTime && next <= s.endTime
          );
          setCurrentSubtitle(subtitle?.text || '');
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, subtitles, video?.duration]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const progress = video ? (currentTime / video.duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative aspect-[9/16] max-h-[600px] mx-auto bg-gray-900 rounded-2xl overflow-hidden">
              {video && (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              )}

              <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
              >
                ←
              </button>

              {showTranscript && currentSubtitle && (
                <div className="absolute bottom-24 left-4 right-4 text-center">
                  <div className="inline-block px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm">
                    {currentSubtitle}
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4">
                <div className="h-1 bg-white/20 rounded-full mb-3">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-white/80 text-xs">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(video?.duration || 0)}</span>
                </div>
              </div>

              {!isPlaying && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-all hover:scale-110">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </div>
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="absolute inset-0"
                />
              )}

              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center gap-1 text-white/90 hover:text-pink-400 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ${isLiked ? 'text-pink-500' : ''}`}>
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-xs">{formatNumber(likes)}</span>
                </button>

                <button className="flex flex-col items-center gap-1 text-white/90 hover:text-primary-400 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-xs">私信</span>
                </button>

                <button className="flex flex-col items-center gap-1 text-white/90 hover:text-green-400 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs">分享</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showTranscript
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <Mic className="w-4 h-4" />
                AI字幕
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                <Copy className="w-4 h-4" />
                复制文案
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                下载视频
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={seeker.avatar}
                  alt={seeker.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">{seeker.name}</h1>
                  <p className="text-primary-600 font-medium">{seeker.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {seeker.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {seeker.education}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {seeker.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent-50 to-orange-50 rounded-xl mb-4">
                <div>
                  <p className="text-sm text-gray-500">期望薪资</p>
                  <p className="text-2xl font-bold text-accent-600">{seeker.expectedSalary}</p>
                </div>
                <button className="px-5 py-2.5 bg-primary-500 text-white font-medium rounded-full hover:bg-primary-600 transition-colors">
                  邀请面试
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>{formatNumber(seeker.views)} 次浏览</span>
                <span>{seeker.connections} 位联系人</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">个人简介</h3>
              <p className="text-gray-600 leading-relaxed">{seeker.bio}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">技能标签</h3>
              <div className="flex flex-wrap gap-2">
                {seeker.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-blue-50 text-primary-600 rounded-full text-sm font-medium border border-primary-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {video?.aiKeywords && video.aiKeywords.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-800">AI 智能提取关键词</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  基于视频内容和语音自动识别的技能关键词
                </p>
                <div className="flex flex-wrap gap-2">
                  {video.aiKeywords.map(keyword => (
                    <span
                      key={keyword}
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {subtitles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">字幕全文</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {subtitles.map((sub, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                        currentTime >= sub.startTime && currentTime <= sub.endTime
                          ? 'bg-primary-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setCurrentTime(sub.startTime);
                        if (!isPlaying) setIsPlaying(true);
                      }}
                    >
                      <span className="text-xs text-gray-400 whitespace-nowrap pt-1">
                        {formatDuration(sub.startTime)}
                      </span>
                      <span className="text-sm text-gray-700">{sub.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekerDetailPage;
