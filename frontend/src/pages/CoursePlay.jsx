import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, MessageCircle, FileText, ChevronRight, ThumbsUp, Send } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';

const CoursePlay = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chapters');
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [showVideoControls, setShowVideoControls] = useState(false);

  useEffect(() => {
    fetchCourseData();
    fetchDiscussions();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('hiu_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`/api/courses/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setCourse(data.data.course);
        setChapters(data.data.chapters || []);
        setMaterials(data.data.materials || []);
      }
    } catch (error) {
      console.error('Fetch course error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(`/api/courses/${id}/discussions`);
      const data = await response.json();
      if (data.success) {
        setDiscussions(data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch discussions error:', error);
    }
  };

  const handlePlayToggle = () => {
    if (!currentLesson) {
      showToast('请先选择一个课时开始学习', 'info');
      return;
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSelectLesson = (lesson) => {
    setCurrentLesson(lesson);
    setIsPlaying(false);
    showToast(`已选择：${lesson.title}`, 'success');
  };

  const handleSubmitDiscussion = async () => {
    if (!newTitle.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    const token = localStorage.getItem('hiu_token');
    if (!token) {
      showToast('请先登录', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/courses/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id,
          title: newTitle,
          content: newDiscussion
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('发布成功', 'success');
        setNewTitle('');
        setNewDiscussion('');
        fetchDiscussions();
      } else {
        showToast(data.message || '发布失败', 'error');
      }
    } catch (error) {
      showToast('发布失败，请稍后重试', 'error');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const tabs = [
    { id: 'chapters', label: '课程章节', icon: Play },
    { id: 'materials', label: '课程资料', icon: FileText },
    { id: 'discussion', label: '讨论区', icon: MessageCircle }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/courses" className="hover:text-blue-600">课程</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/courses/${id}`} className="hover:text-blue-600">{course?.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800">学习中</span>
      </div>

      <div 
        className="relative bg-gray-900 rounded-2xl overflow-hidden"
        onMouseEnter={() => setShowVideoControls(true)}
        onMouseLeave={() => setShowVideoControls(false)}
      >
        {currentLesson ? (
          <div className="aspect-video relative">
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              poster={course?.cover}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
              您的浏览器不支持视频播放
            </video>
            
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50">
                <button
                  onClick={handlePlayToggle}
                  className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <Play className="w-10 h-10 ml-1" />
                </button>
              </div>
            )}
            
            {(showVideoControls || !isPlaying) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlayToggle}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </button>
                    <div className="text-white">
                      <p className="font-medium">{currentLesson.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <div 
                onClick={handlePlayToggle}
                className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors"
              >
                <Play className="w-10 h-10 ml-1" />
              </div>
              <p className="text-lg font-medium">请从下方选择课时开始学习</p>
              <p className="text-sm text-gray-400 mt-1">点击课程章节中的课时即可播放</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'chapters' && (
            <div className="space-y-4">
              {chapters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无章节内容</p>
              ) : (
                chapters.map((chapter, idx) => (
                  <div key={chapter.id} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3">
                      <span className="font-medium text-gray-800">{chapter.title}</span>
                    </div>
                    <div className="divide-y">
                      {(chapter.lessons || []).map((lesson) => (
                        <div
                          key={lesson.id}
                          onClick={() => handleSelectLesson(lesson)}
                          className={`px-4 py-3 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition-colors ${
                            currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              currentLesson?.id === lesson.id ? 'bg-blue-600' : 'bg-blue-100'
                            }`}>
                              <Play className={`w-4 h-4 ml-0.5 ${
                                currentLesson?.id === lesson.id ? 'text-white' : 'text-blue-600'
                              }`} />
                            </div>
                            <span className={`font-medium ${
                              currentLesson?.id === lesson.id ? 'text-blue-600' : 'text-gray-700'
                            }`}>{lesson.title}</span>
                          </div>
                          <span className="text-sm text-gray-500">{lesson.duration || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-3">
              {materials.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无资料</p>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-700">{material.title}</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      下载
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="请输入讨论标题..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <textarea
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  placeholder="分享你的学习心得或问题..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitDiscussion}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    发布
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {discussions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无讨论，快来发布第一条吧！</p>
                ) : (
                  discussions.map((discussion) => (
                    <div key={discussion.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">👤</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{discussion.nickname || '用户'}</p>
                            <p className="text-sm text-gray-500">{new Date(discussion.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">{discussion.title}</h4>
                      <p className="text-gray-600 mb-3">{discussion.content}</p>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{discussion.like_count || 0}</span>
                        </button>
                        <span className="flex items-center gap-1 text-gray-500">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{discussion.reply_count || 0} 回复</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlay;
