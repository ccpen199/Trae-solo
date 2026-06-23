import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Briefcase, Play, Pause, Heart, Share2,
  GraduationCap, MessageSquare,
  Sparkles, Mic, Copy, Download,
  Building2, Clock, Target, ArrowRight
} from 'lucide-react';
import { jobSeekers } from '../data/mockData';
import { useApp } from '../context/AppContext';

const SeekerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seeker = jobSeekers.find(s => s.id === id);
  const { getMatchedJobsForSeeker } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(seeker?.resumeVideo?.likes || 0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(-1);

  if (!seeker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>用户不存在</p>
      </div>
    );
  }

  const video = seeker.resumeVideo;
  const subtitles = video?.subtitles || [];
  const aiKeywords = video?.aiKeywords || [];

  const matchedJobs = useMemo(() => {
    return getMatchedJobsForSeeker(seeker.skills, aiKeywords).slice(0, 3);
  }, [seeker.skills, aiKeywords, getMatchedJobsForSeeker]);

  const allHighlightKeywords = useMemo(() => {
    return [...new Set([...seeker.skills, ...aiKeywords])];
  }, [seeker.skills, aiKeywords]);

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

  const highlightText = (text: string, keywords: string[]) => {
    if (keywords.length === 0) return text;

    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
      if (isKeyword) {
        return (
          <span
            key={index}
            className="bg-yellow-100 text-yellow-800 font-semibold px-0.5 rounded"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  useEffect(() => {
    if (isPlaying && subtitles.length > 0 && !videoRef.current) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= (video?.duration || 0)) {
            setIsPlaying(false);
            return 0;
          }
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

  useEffect(() => {
    const activeIndex = subtitles.findIndex(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    );
    setActiveSubtitleIndex(activeIndex);

    if (activeIndex !== -1 && subtitleContainerRef.current && showTranscript) {
      const activeElement = subtitleContainerRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentTime, subtitles, showTranscript]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current && video.videoUrl) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, video?.duration || 0));
    setCurrentTime(clampedTime);
    if (videoRef.current && video.videoUrl) {
      videoRef.current.currentTime = clampedTime;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !video) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * video.duration;
    seekTo(time);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current || !video) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = percent * video.duration;
      setCurrentTime(time);
      if (videoRef.current && video.videoUrl) {
        videoRef.current.currentTime = time;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, video]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleCopyTranscript = () => {
    const fullText = subtitles.map(s => s.text).join(' ');
    navigator.clipboard?.writeText(fullText);
  };

  const progress = video ? (currentTime / video.duration) * 100 : 0;
  const currentSubtitle = activeSubtitleIndex !== -1 ? subtitles[activeSubtitleIndex]?.text : '';

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative aspect-[9/16] max-h-[650px] mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
              {video?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  poster={video.thumbnail}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                />
              ) : video && (
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
                <div className="absolute bottom-32 left-4 right-4 text-center">
                  <div className="inline-block px-5 py-3 bg-black/75 backdrop-blur-md rounded-xl text-white text-base leading-relaxed max-w-full">
                    {highlightText(currentSubtitle, allHighlightKeywords)}
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-12">
                <div
                  ref={progressRef}
                  className="h-1.5 bg-white/25 rounded-full mb-3 cursor-pointer group relative"
                  onClick={handleProgressClick}
                  onMouseDown={handleProgressMouseDown}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" fill="white" />
                      )}
                    </button>
                    <div className="text-white/80 text-xs font-mono">
                      {formatDuration(currentTime)} / {formatDuration(video?.duration || 0)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(video?.duration || 0)}</span>
                  </div>
                </div>
              </div>

              {!isPlaying && !isDragging && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
                >
                  <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-all hover:scale-110 shadow-2xl">
                    <Play className="w-10 h-10 text-white ml-1.5" fill="white" />
                  </div>
                </button>
              )}

              <div className="absolute right-3 bottom-36 flex flex-col items-center gap-4">
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

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  showTranscript
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Mic className="w-4 h-4" />
                AI实时字幕
              </button>
              <button
                onClick={handleCopyTranscript}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                复制字幕
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                下载视频
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-5">
                <img
                  src={seeker.avatar}
                  alt={seeker.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary-50"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">{seeker.name}</h1>
                  <p className="text-primary-600 font-semibold text-lg">{seeker.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
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
                  <p className="text-sm text-gray-500 mb-1">期望薪资</p>
                  <p className="text-2xl font-bold text-accent-600">{seeker.expectedSalary}</p>
                </div>
                <button className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-full hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/25">
                  邀请面试
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700">{formatNumber(seeker.views)}</span> 次浏览
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700">{seeker.connections}</span> 位联系人
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">个人简介</h3>
              <p className="text-gray-600 leading-relaxed">
                {highlightText(seeker.bio, allHighlightKeywords)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                技能标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {seeker.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 text-primary-600 rounded-full text-sm font-semibold border border-primary-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {aiKeywords.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-800">AI 智能提取关键词</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  基于视频内容和语音自动识别的技能关键词
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiKeywords.map(keyword => (
                    <span
                      key={keyword}
                      className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 rounded-full text-sm font-semibold border border-purple-100"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {matchedJobs.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-gray-800">智能匹配岗位</h3>
                  </div>
                  <span className="text-xs text-gray-400">Top {matchedJobs.length} 匹配</span>
                </div>
                <div className="space-y-3">
                  {matchedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/company/${job.companyId}`)}
                      className="p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                {highlightText(job.title, job.matchedKeywords)}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm text-gray-500">{job.companyName}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-lg font-bold text-green-600">
                                {job.salary}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                                    style={{ width: `${job.matchScore * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-green-600">
                                  {Math.round(job.matchScore * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                              {job.location}
                            </span>
                            <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-md">
                              {job.experience}
                            </span>
                            {job.matchedKeywords.slice(0, 3).map(kw => (
                              <span
                                key={kw}
                                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-md font-medium"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-end mt-3 text-primary-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            查看公司详情
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subtitles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-blue-500" />
                    语音转字幕正文
                  </h3>
                  <span className="text-xs text-gray-400">
                    共 {subtitles.length} 条字幕
                  </span>
                </div>
                <div
                  ref={subtitleContainerRef}
                  className="space-y-2 max-h-80 overflow-y-auto pr-2 -mr-2"
                >
                  {subtitles.map((sub, index) => (
                    <div
                      key={index}
                      data-index={index}
                      onClick={() => seekTo(sub.startTime)}
                      className={`flex gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                        activeSubtitleIndex === index
                          ? 'bg-primary-50 border border-primary-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <button
                        className={`text-xs font-mono whitespace-nowrap pt-0.5 px-2 py-1 rounded-md transition-colors ${
                          activeSubtitleIndex === index
                            ? 'bg-primary-500 text-white font-semibold'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {formatDuration(sub.startTime)}
                      </button>
                      <p className={`text-sm leading-relaxed flex-1 ${
                        activeSubtitleIndex === index ? 'text-gray-800 font-medium' : 'text-gray-600'
                      }`}>
                        {highlightText(sub.text, allHighlightKeywords)}
                      </p>
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
