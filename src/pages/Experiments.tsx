import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Calendar, ArrowRight, Plus, Edit, Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { experimentApi } from '../utils/api';
import type { Experiment } from '../../shared/types';

const Experiments = () => {
  const { user } = useAuthStore();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const res = await experimentApi.list();
      if (res.success) {
        setExperiments(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const d = new Date(deadline);
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: '已截止', color: 'text-red-600 bg-red-50' };
    if (days <= 3) return { text: `还剩 ${days} 天`, color: 'text-amber-600 bg-amber-50' };
    return { text: `还剩 ${days} 天`, color: 'text-green-600 bg-green-50' };
  };

  const canManage = user?.role === 'teacher' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">实验任务</h2>
          <p className="text-sm text-slate-500 mt-1">查看所有实验任务和提交状态</p>
        </div>
        {canManage && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            新建实验
          </button>
        )}
      </div>

      {experiments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无实验任务</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {experiments.map(exp => {
            const status = getDeadlineStatus(exp.deadline);
            return (
              <div key={exp.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">{exp.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        exp.status === 'published' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {exp.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4 line-clamp-2">{exp.description}</p>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>截止: {new Date(exp.deadline).toLocaleString()}</span>
                      </div>
                      {exp.lateDeadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>迟交截止: {new Date(exp.lateDeadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {user?.role === 'student' ? (
                      <button 
                        onClick={() => navigate(`/experiments/${exp.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        提交报告
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/experiments/${exp.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Experiments;
