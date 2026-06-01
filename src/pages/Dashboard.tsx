import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, BookOpen, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { experimentApi, submissionApi, gradingApi } from '../utils/api';
import type { Experiment, Submission } from '../../shared/types';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [expRes, subRes, pendingRes] = await Promise.all([
        experimentApi.list(undefined, 'published'),
        user?.role === 'student' ? submissionApi.my() : Promise.resolve({ success: true, data: [] }),
        (user?.role === 'ta' || user?.role === 'teacher' || user?.role === 'admin') 
          ? gradingApi.pending() 
          : Promise.resolve({ success: true, data: [] }),
      ]);

      if (expRes.success) setExperiments(expRes.data || []);
      if (subRes.success) setSubmissions(subRes.data || []);
      if (pendingRes.success) setPendingCount(pendingRes.data?.length || 0);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: '进行中实验',
      value: experiments.length,
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      title: user?.role === 'student' ? '我的提交' : '待批改',
      value: user?.role === 'student' ? submissions.length : pendingCount,
      icon: FileText,
      color: 'bg-amber-500',
    },
    {
      title: user?.role === 'student' ? '已批改' : '已完成',
      value: user?.role === 'student' 
        ? submissions.filter(s => s.status === 'graded').length 
        : 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: '待处理',
      value: user?.role === 'student'
        ? submissions.filter(s => s.status === 'returned').length
        : 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">欢迎回来，{user?.name}！</h2>
        <p className="text-blue-100">
          {user?.role === 'student' && '查看实验任务，提交您的实验报告'}
          {user?.role === 'ta' && '批改学生报告，提供反馈和评分'}
          {user?.role === 'teacher' && '管理实验课程，查看班级成绩'}
          {user?.role === 'admin' && '系统管理，用户和课程配置'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {experiments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">最新实验任务</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {experiments.slice(0, 5).map(exp => (
              <div key={exp.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800">{exp.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{exp.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      截止: {new Date(exp.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">快速操作</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/experiments')}
              className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <FileText className="w-6 h-6 mb-2" />
              <p className="font-medium">查看实验</p>
            </button>
            {user?.role === 'student' && (
              <button 
                onClick={() => navigate('/experiments')}
                className="p-4 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-left"
              >
                <Clock className="w-6 h-6 mb-2" />
                <p className="font-medium">我的提交</p>
              </button>
            )}
            {(user?.role === 'ta' || user?.role === 'teacher') && (
              <button 
                onClick={() => navigate('/grading')}
                className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left"
              >
                <CheckCircle className="w-6 h-6 mb-2" />
                <p className="font-medium">批改作业</p>
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin/users')}
                className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left"
              >
                <Users className="w-6 h-6 mb-2" />
                <p className="font-medium">用户管理</p>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">使用提示</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>学生可以在「实验任务」中查看并提交实验报告</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>助教和教师在「批改工作台」中批改学生报告</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>所有批改记录和成绩变更都会自动归档，可追溯查询</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>迟交报告会自动标记，请注意截止时间</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
