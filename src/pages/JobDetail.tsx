import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Building2, Users, Star, Calendar } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userRole = useAuthStore(state => state.user?.role);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    if (!id) return;
    setLoading(true);
    const result = await jobsApi.get(id);
    setLoading(false);
    if (result.success && result.data) {
      setJob(result.data);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setApplying(true);
    const result = await jobsApi.apply(id, coverLetter);
    setApplying(false);

    if (result.success) {
      alert('申请成功！');
      setShowApplyForm(false);
      loadJob();
    } else {
      alert(result.error || '申请失败');
    }
  };

  const jobTypeLabels: Record<string, string> = {
    daily: '日结',
    weekly: '周结',
    project: '项目制',
    remote: '远程'
  };

  const salaryTypeLabels: Record<string, string> = {
    hourly: '元/小时',
    daily: '元/天',
    weekly: '元/周',
    fixed: '元'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">岗位不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {job.company_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {job.employer_rating}
                    </span>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {jobTypeLabels[job.job_type] || job.job_type}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                <div>
                  <p className="text-gray-500 text-sm">薪资</p>
                  <p className="text-green-600 font-semibold flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ¥{job.salary_amount}{salaryTypeLabels[job.salary_type] || ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">工作地点</p>
                  <p className="text-gray-800 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location_address || '待确认'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">申请人数</p>
                  <p className="text-gray-800 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {job.applicant_count} 人
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">发布时间</p>
                  <p className="text-gray-800 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="py-4">
                <h3 className="font-semibold text-gray-800 mb-3">岗位描述</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{job.description || '暂无描述'}</p>
              </div>

              {job.required_skills && (
                <div className="py-4 border-t">
                  <h3 className="font-semibold text-gray-800 mb-3">技能要求</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.split(',').map((skill: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.working_hours && (
                <div className="py-4 border-t">
                  <h3 className="font-semibold text-gray-800 mb-3">工作时间</h3>
                  <p className="text-gray-600">{job.working_hours}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
              {isAuthenticated && userRole === 'job_seeker' ? (
                <>
                  {!showApplyForm ? (
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                    >
                      立即申请
                    </button>
                  ) : (
                    <form onSubmit={handleApply} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自我介绍（选填）
                        </label>
                        <textarea
                          value={coverLetter}
                          onChange={e => setCoverLetter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={4}
                          placeholder="向雇主介绍一下自己..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowApplyForm(false)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          disabled={applying}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
                        >
                          {applying ? '提交中...' : '确认申请'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : !isAuthenticated ? (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  登录后申请
                </button>
              ) : userRole === 'employer' ? (
                <div className="text-center text-gray-500">
                  <p>雇主身份无法申请岗位</p>
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-800 mb-3">温馨提示</h4>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• 申请前请确认岗位信息符合您的预期</li>
                  <li>• 面试前请提前准备好相关资料</li>
                  <li>• 如遇收费请提高警惕，平台不收取任何费用</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
