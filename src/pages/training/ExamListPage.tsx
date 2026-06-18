import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, AlertCircle, Play, ChevronRight, Award, FileText } from 'lucide-react';
import { getExams } from '../../services/api';
import type { Exam } from '../../../shared/types';
import { Link } from 'react-router-dom';

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: '未开始', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-700' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: 'text-green-600' },
  medium: { label: '中等', color: 'text-amber-600' },
  hard: { label: '困难', color: 'text-red-600' },
};

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await getExams();
      if (res.code === 0) {
        setExams(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: '待考试', value: exams.filter(e => e.status === 'not_started').length, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '进行中', value: exams.filter(e => e.status === 'in_progress').length, icon: Play, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '已完成', value: exams.filter(e => e.status === 'completed').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '平均分', value: '85', icon: Award, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'not_started', label: '待考试' },
    { key: 'in_progress', label: '进行中' },
    { key: 'completed', label: '已完成' },
  ];

  const filteredExams = exams.filter(e => {
    const matchKeyword = !searchKeyword || e.title.includes(searchKeyword);
    const matchStatus = activeStatus === 'all' || e.status === activeStatus;
    return matchKeyword && matchStatus;
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
              placeholder="搜索考试..."
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
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeStatus === tab.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="card p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[exam.status].color}`}>
                    {statusConfig[exam.status].label}
                  </span>
                  {exam.difficulty && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 ${difficultyConfig[exam.difficulty].color}`}>
                      {difficultyConfig[exam.difficulty].label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">{exam.description}</p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {exam.questionCount} 道题
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exam.duration} 分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    满分 {exam.totalScore} 分
                  </span>
                  {exam.passingScore && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      及格分 {exam.passingScore} 分
                    </span>
                  )}
                  {exam.deadline && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      截止: {new Date(exam.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {exam.status === 'completed' && exam.userScore !== undefined && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">您的成绩</p>
                        <p className="text-2xl font-bold">
                          <span className={exam.userScore >= (exam.passingScore || 60) ? 'text-green-600' : 'text-red-600'}>
                            {exam.userScore}
                          </span>
                          <span className="text-lg text-gray-400"> / {exam.totalScore} 分</span>
                        </p>
                      </div>
                      {exam.userScore >= (exam.passingScore || 60) ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-semibold">已通过</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-6 h-6" />
                          <span className="font-semibold">未通过</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {exam.status === 'not_started' && (
                  <Link to={`/training/exam/${exam.id}`} className="btn btn-primary">
                    开始考试 <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
                {exam.status === 'in_progress' && (
                  <Link to={`/training/exam/${exam.id}`} className="btn btn-primary">
                    继续考试 <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
                {exam.status === 'completed' && (
                  <button className="btn btn-secondary">
                    查看解析
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
