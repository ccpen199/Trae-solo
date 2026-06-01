import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { gradingApi } from '../utils/api';
import type { Submission } from '../../shared/types';
import { statusColors, statusNames } from '../../shared/types';

const Grading = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const res = await gradingApi.pending();
      if (res.success) {
        setSubmissions(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">批改工作台</h2>
        <p className="text-sm text-slate-500 mt-1">待批改: {submissions.length} 份</p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-slate-500">暂无待批改的报告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {(sub as unknown as { studentName?: string }).studentName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {(sub as unknown as { studentName?: string }).studentName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {(sub as unknown as { experimentTitle?: string }).experimentTitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      学号: {(sub as unknown as { studentId?: string }).studentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                    {statusNames[sub.status]}
                  </span>
                  <div className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}
                  </div>
                  <button
                    onClick={() => navigate(`/grading/${sub.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    开始批改
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Grading;
