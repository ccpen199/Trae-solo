import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, FileText, DollarSign, MapPin, ChevronRight } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function MyApplications() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadApplications();
  }, [isAuthenticated]);

  const loadApplications = async () => {
    setLoading(true);
    const result = await jobsApi.myApplications();
    setLoading(false);
    if (result.success && result.data) {
      setApplications(result.data);
    }
  };

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    interviewing: { label: '面试中', color: 'bg-blue-100 text-blue-700', icon: FileText },
    accepted: { label: '已录用', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: XCircle }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">我的申请</h1>
          <p className="text-gray-500 mt-1">查看所有岗位申请记录和状态</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无申请记录</h3>
            <p className="text-gray-500 mb-6">浏览岗位，找到适合你的工作机会</p>
            <button
              onClick={() => navigate('/jobs')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              浏览岗位
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app: any) => {
              const status = statusLabels[app.status] || statusLabels.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/jobs/${app.job_id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{app.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">{app.company_name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          ¥{app.salary_amount?.toLocaleString() || '面议'}
                        </span>
                        {app.location_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {app.location_address.slice(0, 15)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        申请时间: {new Date(app.applied_at).toLocaleString()}
                      </span>
                      {app.employer_feedback && (
                        <span className="text-blue-600">
                          雇主反馈: {app.employer_feedback}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
