import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Users, Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function EmployerJobs() {
  const navigate = useNavigate();
  const userRole = useAuthStore(state => state.user?.role);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'employer') {
      navigate('/');
      return;
    }
    loadJobs();
  }, [userRole]);

  const loadJobs = async () => {
    setLoading(true);
    const result = await jobsApi.my();
    setLoading(false);
    if (result.success && result.data) {
      setJobs(result.data);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    const result = await jobsApi.updateStatus(jobId, status);
    if (result.success) {
      loadJobs();
    } else {
      alert(result.error || '操作失败');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    const result = await jobsApi.updateApplicationStatus(applicationId, status);
    if (result.success) {
      loadJobs();
    } else {
      alert(result.error || '操作失败');
    }
  };

  const jobTypeLabels: Record<string, string> = {
    daily: '日结',
    weekly: '周结',
    project: '项目制',
    remote: '远程'
  };

  const jobStatusLabels: Record<string, { label: string; color: string }> = {
    open: { label: '招聘中', color: 'bg-green-100 text-green-700' },
    filled: { label: '已招满', color: 'bg-blue-100 text-blue-700' },
    closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
    completed: { label: '已完成', color: 'bg-purple-100 text-purple-700' }
  };

  const applicationStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    reviewing: { label: '审核中', color: 'bg-blue-100 text-blue-700' },
    interview: { label: '面试中', color: 'bg-purple-100 text-purple-700' },
    accepted: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
    hired: { label: '已入职', color: 'bg-indigo-100 text-indigo-700' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">我发布的岗位</h1>
          <Link
            to="/employer/jobs/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            发布岗位
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-6">暂无发布的岗位</p>
            <Link
              to="/employer/jobs/create"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              立即发布
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {jobTypeLabels[job.job_type] || job.job_type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${jobStatusLabels[job.status]?.color || ''}`}>
                          {jobStatusLabels[job.status]?.label || job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>薪资: ¥{job.salary_amount}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job.applicant_count} 人申请
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-gray-500 hover:text-blue-600 p-2 transition"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="text-gray-500 hover:text-blue-600 p-2 transition"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {job.status === 'open' && (
                        <button
                          onClick={() => handleUpdateJobStatus(job.id, 'closed')}
                          className="text-red-500 hover:text-red-700 px-3 py-1 text-sm transition"
                        >
                          关闭招聘
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {expandedJob === job.id && job.applications && job.applications.length > 0 && (
                  <div className="border-t bg-gray-50 p-6">
                    <h4 className="font-medium text-gray-800 mb-4">申请者列表</h4>
                    <div className="space-y-3">
                      {job.applications.map((app: any) => (
                        <div key={app.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-800">{app.name || '匿名用户'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${applicationStatusLabels[app.status]?.color || ''}`}>
                                {applicationStatusLabels[app.status]?.label || app.status}
                              </span>
                            </div>
                            {app.cover_letter && (
                              <p className="text-sm text-gray-500 mt-1">{app.cover_letter}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                              <span>信用分: {app.credit_score || 100}</span>
                              <span>上岗时效: {app.onboarding_effectiveness_hours || 24}h</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'interview')}
                                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded text-sm transition"
                                >
                                  安排面试
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                  className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-sm transition"
                                >
                                  拒绝
                                </button>
                              </>
                            )}
                            {app.status === 'interview' && (
                              <>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'hired')}
                                  className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-sm transition"
                                >
                                  录用
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                  className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-sm transition"
                                >
                                  拒绝
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
