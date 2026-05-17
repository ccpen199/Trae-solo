import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Award, BookOpen } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import Loading from '../components/Loading';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?pageSize=8');
      const data = await response.json();
      if (data.success) {
        setCourses(data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, title: '海量课程', description: '覆盖编程、设计、运营等多个领域' },
    { icon: TrendingUp, title: '技能提升', description: '系统化学习路径，高效提升技能' },
    { icon: Award, title: '权威认证', description: '完成课程获得专属认证证书' }
  ];

  const categories = [
    { name: '编程开发', count: 128, color: 'blue' },
    { name: '设计创意', count: 86, color: 'purple' },
    { name: '产品运营', count: 64, color: 'green' },
    { name: '求职面试', count: 42, color: 'orange' },
    { name: '语言学习', count: 58, color: 'pink' },
    { name: '考证考级', count: 96, color: 'indigo' }
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-12">
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            HiU - 大学生在线学习平台
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            海量优质课程，助你提升技能，赢在起跑线
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索课程、测评..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-300"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">热门课程</h2>
          <Link
            to="/courses"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">课程分类</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <Link
              key={index}
              to={`/courses?category=${cat.name}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center group"
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center bg-${cat.color}-100 group-hover:bg-${cat.color}-200 transition-colors`}>
                <span className="text-2xl">{['💻', '🎨', '📊', '💼', '🌍', '📜'][index]}</span>
              </div>
              <h3 className="font-semibold text-gray-800">{cat.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{cat.count}门课程</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            开始你的学习之旅
          </h2>
          <p className="text-gray-600 mb-6">
            加入 HiU，与百万大学生一起成长
          </p>
          <Link
            to="/courses"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即开始
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
