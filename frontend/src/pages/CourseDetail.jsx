import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Users, Clock, BookOpen, MessageCircle, Download, ChevronRight } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const token = localStorage.getItem('hiu_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`/api/courses/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setCourse(data.data.course);
        setChapters(data.data.chapters || []);
        setMaterials(data.data.materials || []);
        setIsEnrolled(data.data.isEnrolled || false);
      }
    } catch (error) {
      console.error('Fetch course detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId: id })
      });
      const data = await response.json();
      if (data.success) {
        setIsEnrolled(true);
        showToast('加入课程成功！', 'success');
      } else {
        showToast(data.message || '加入失败', 'error');
      }
    } catch (error) {
      showToast('加入失败，请稍后重试', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBuy = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch('/api/courses/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId: id })
      });
      const data = await response.json();
      if (data.success) {
        setIsEnrolled(true);
        showToast('购买成功！', 'success');
      } else {
        showToast(data.message || '购买失败', 'error');
      }
    } catch (error) {
      showToast('购买失败，请稍后重试', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">课程不存在</h3>
        <p className="text-gray-500 mb-4">该课程可能已被删除或下架</p>
        <Link to="/courses" className="text-blue-600 hover:text-blue-700">
          返回课程列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 relative">
            <img
              src={course.cover || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=course%20cover%20education&image_size=square_hd'}
              alt={course.title}
              className="w-full h-64 md:h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                <Play className="w-8 h-8 text-blue-600 ml-1" />
              </div>
            </div>
          </div>
          <div className="p-8 md:w-1/2">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                {course.category_name || '课程'}
              </span>
              {course.is_free ? (
                <span className="px-3 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-full">
                  免费
                </span>
              ) : (
                <span className="px-3 py-1 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
                  付费
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{course.title}</h1>
            <p className="text-gray-600 mb-6">{course.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-800">{course.buy_count || 0}</p>
                <p className="text-sm text-gray-500">学习人数</p>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-800">{course.duration || '未知'}</p>
                <p className="text-sm text-gray-500">课程时长</p>
              </div>
              <div className="text-center">
                <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-800">{chapters.length || 0}</p>
                <p className="text-sm text-gray-500">章节数</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">👨‍🏫</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{course.instructor || '讲师'}</p>
                <p className="text-sm text-gray-500">课程讲师</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!course.is_free && !isEnrolled && (
                <span className="text-2xl font-bold text-blue-600">¥{course.price}</span>
              )}
              {isEnrolled ? (
                <Link
                  to={`/courses/${id}/play`}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  开始学习
                </Link>
              ) : course.is_free ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {enrolling ? '加入中...' : '立即加入'}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={enrolling}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {enrolling ? '购买中...' : '立即购买'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">课程目录</h2>
            {chapters.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无章节内容</p>
            ) : (
              <div className="space-y-4">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        第{index + 1}章：{chapter.title}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="divide-y">
                      {(chapter.lessons || []).map((lesson, idx) => (
                        <div key={lesson.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Play className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{lesson.title}</span>
                          </div>
                          <span className="text-sm text-gray-500">{lesson.duration || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">课程资料</h2>
            {materials.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无资料</p>
            ) : (
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">{material.title}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      下载
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">课程讨论</h2>
            <Link
              to={`/courses/${id}/play?tab=discussion`}
              className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              进入讨论区
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
