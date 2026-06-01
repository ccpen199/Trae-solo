import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Star, TrendingUp, Target } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Recommendations() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userRole = useAuthStore(state => state.user?.role);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'job_seeker') {
      navigate('/login');
      return;
    }
    loadRecommendations();
  }, [isAuthenticated, userRole]);

  const loadRecommendations = async () => {
    setLoading(true);
    const result = await jobsApi.recommendations();
    setLoading(false);
    if (result.success && result.data) {
      setJobs(result.data);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const jobTypeLabels: Record<string, string> = {
    daily: '日结',
    weekly: '周结',
    project: '项目制',
    remote: '远程'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-8 w-8" />
            <h1 className="text-3xl font-bold">智能匹配推荐</h1>
          </div>
          <p className="text-indigo-100 max-w-2xl">
            基于您的技能标签和位置信息，为您精准匹配最合适的岗位机会
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无匹配推荐</h3>
            <p className="text-gray-500 mb-6">完善您的技能标签和位置信息，获取更精准的岗位推荐</p>
            <Link
              to="/profile"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              完善资料
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-semibold text-gray-800 text-lg hover:text-blue-600 transition"
                      >
                        {job.title}
                      </Link>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {jobTypeLabels[job.job_type] || job.job_type}
                      </span>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${getMatchScoreColor(job.match_score || 0)}`}>
                        匹配度 {job.match_score || 0}%
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{job.company_name}</p>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        ¥{job.salary_amount}
                      </span>
                      {job.location_address && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {job.location_address}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        {job.employer_rating || 5.0}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
