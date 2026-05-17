import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Award, Clock, ChevronRight } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';

const StudyCenter = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [myCourses, setMyCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) return;

    try {
      const [coursesRes, materialsRes, wrongRes] = await Promise.all([
        fetch('/api/courses/my', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user/study-materials', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/assessments/wrong-questions', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const coursesData = await coursesRes.json();
      const materialsData = await materialsRes.json();
      const wrongData = await wrongRes.json();

      if (coursesData.success) setMyCourses(coursesData.data.list || []);
      if (materialsData.success) setMaterials(materialsData.data.list || []);
      if (wrongData.success) setWrongQuestions(wrongData.data.list || []);
    } catch (error) {
      console.error('Fetch study center data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'courses', label: '我的课程', icon: BookOpen },
    { id: 'materials', label: '学习资料', icon: FileText },
    { id: 'wrong', label: '错题本', icon: Award }
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">学习中心</h1>

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
          {activeTab === 'courses' && (
            <div className="space-y-4">
              {myCourses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有课程</h3>
                  <p className="text-gray-500">去课程列表加入感兴趣的课程吧</p>
                </div>
              ) : (
                myCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">学习进度：{course.progress || 0}%</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              {materials.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无资料</h3>
                  <p className="text-gray-500">加入课程后可以查看课程资料</p>
                </div>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <span className="text-gray-700">{material.title}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      下载
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'wrong' && (
            <div className="space-y-4">
              {wrongQuestions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">太棒了！</h3>
                  <p className="text-gray-500">你还没有错题，继续保持！</p>
                </div>
              ) : (
                wrongQuestions.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {item.assessment_title}
                      </span>
                      <span className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">{item.question}</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-green-600">正确答案：{item.answer}</p>
                      <p className="text-red-600">你的答案：{item.user_answer || '（未作答）'}</p>
                    </div>
                    {item.explanation && (
                      <p className="text-gray-500 text-sm mt-2 p-3 bg-white rounded-lg">
                        💡 {item.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyCenter;
