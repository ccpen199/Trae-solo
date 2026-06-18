import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Star, Users, CheckCircle, ChevronRight, Video, FileText, BookOpen } from 'lucide-react';
import { getCourse } from '../../services/api';
import type { Course } from '../../../shared/types';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number>(0);

  useEffect(() => {
    if (id) {
      fetchCourse(parseInt(id));
    }
  }, [id]);

  const fetchCourse = async (courseId: number) => {
    try {
      setLoading(true);
      const res = await getCourse(courseId);
      if (res.code === 0) {
        setCourse(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };

  const chapters = [
    { id: 1, title: '第一章：产品概述', duration: '15:30', isCompleted: true },
    { id: 2, title: '第二章：核心成分解析', duration: '22:15', isCompleted: true },
    { id: 3, title: '第三章：功效与作用机理', duration: '18:45', isCompleted: true },
    { id: 4, title: '第四章：适用人群与使用方法', duration: '12:30', isCompleted: false },
    { id: 5, title: '第五章：常见问题解答', duration: '20:00', isCompleted: false },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">课程不存在</p>
        <button onClick={() => navigate('/training/courses')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/training/courses')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回课程列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div 
              className="aspect-video bg-gradient-to-br from-primary-900 to-primary-700 relative cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              {isPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-16 h-16 text-white/50" />
                  <span className="absolute text-white">视频播放中...</span>
                </div>
              ) : (
                <>
                  <img
                    src={course.coverUrl}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {course.category === 'product' ? '产品知识' : course.category === 'sales' ? '销售技巧' : '合规培训'}
                </span>
                {course.progress === 100 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    已完成
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">{course.title}</h1>
              <p className="text-gray-600 mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  {course.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.studentCount?.toLocaleString() || '1,258'} 人学习
                </span>
              </div>

              {course.progress > 0 && course.progress < 100 && (
                <div className="mt-6 p-4 bg-primary-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-primary-700">学习进度</span>
                    <span className="font-semibold text-primary-700">{course.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">课程目录</h3>
            <div className="space-y-2">
              {chapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  onClick={() => setActiveChapter(idx)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                    activeChapter === idx ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      chapter.isCompleted ? 'bg-green-100 text-green-600' : 
                      activeChapter === idx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {chapter.isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-medium">{idx + 1}</span>}
                    </div>
                    <div>
                      <p className={`font-medium ${activeChapter === idx ? 'text-primary-700' : 'text-gray-900'}`}>
                        {chapter.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{chapter.duration}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">讲师信息</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                李
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">李讲师</h4>
                <p className="text-sm text-gray-500">资深培训讲师</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              拥有10年健康产业培训经验，擅长产品知识讲解和销售技巧培训，累计培训学员超过10万人次。
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">学习资料</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">产品手册.pdf</p>
                  <p className="text-xs text-gray-500">2.5MB</p>
                </div>
                <button className="text-primary-600 text-sm font-medium">下载</button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">培训讲义.pdf</p>
                  <p className="text-xs text-gray-500">1.8MB</p>
                </div>
                <button className="text-primary-600 text-sm font-medium">下载</button>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-primary-50 to-amber-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">相关考试</h3>
            <div className="p-4 bg-white rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">产品知识考核</h4>
              <p className="text-sm text-gray-500 mb-3">10道题 · 30分钟 · 满分100分</p>
              <Link to="/training/exam/1" className="btn btn-primary w-full">
                开始考试
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
