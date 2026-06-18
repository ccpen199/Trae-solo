import { useEffect, useState } from 'react';
import { Search, Filter, Play, FileText, Video, BookOpen, Clock, Star, ChevronRight, Plus } from 'lucide-react';
import { getCourses } from '../../services/api';
import type { Course } from '../../../shared/types';
import { Link } from 'react-router-dom';

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  video: { label: '视频课程', icon: Video, color: 'bg-rose-100 text-rose-700' },
  document: { label: '文档资料', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  audio: { label: '音频课程', icon: Play, color: 'bg-green-100 text-green-700' },
};

const categoryConfig: Record<string, { label: string }> = {
  product: { label: '产品知识' },
  sales: { label: '销售技巧' },
  compliance: { label: '合规培训' },
  management: { label: '团队管理' },
  culture: { label: '企业文化' },
};

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getCourses();
      if (res.code === 0) {
        setCourses(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'product', label: '产品知识' },
    { key: 'sales', label: '销售技巧' },
    { key: 'compliance', label: '合规培训' },
    { key: 'management', label: '团队管理' },
    { key: 'culture', label: '企业文化' },
  ];

  const stats = [
    { label: '课程总数', value: courses.length, icon: BookOpen, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '已学习', value: courses.filter(c => c.progress > 0).length, icon: Play, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '已完成', value: courses.filter(c => c.progress === 100).length, icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '学习时长', value: '12.5h', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const filteredCourses = courses.filter(c => {
    const matchKeyword = !searchKeyword || c.title.includes(searchKeyword);
    const matchCategory = activeCategory === 'all' || c.category === activeCategory;
    return matchKeyword && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索课程..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          发布课程
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const TypeIcon = typeConfig[course.type]?.icon || FileText;
          return (
            <div key={course.id} className="card overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link to={`/training/courses/${course.id}`}>
                <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
                  <img
                    src={course.coverUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TypeIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[course.type]?.color}`}>
                      {typeConfig[course.type]?.label}
                    </span>
                  </div>
                  {course.progress > 0 && course.progress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <div 
                        className="h-full bg-primary-500 transition-all"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">
                      {categoryConfig[course.category]?.label}
                    </span>
                    {course.progress === 100 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">已完成</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      {course.rating}
                    </div>
                    {course.studentCount && (
                      <div className="text-gray-500">
                        {course.studentCount.toLocaleString()}人学习
                      </div>
                    )}
                  </div>
                  {course.progress > 0 && course.progress < 100 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>学习进度</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
