import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Building2,
  Calendar,
  Shield,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Briefcase,
  GraduationCap,
  Clock3,
  FileCheck,
} from 'lucide-react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { Job, FilingForm, Company } from '../../../shared/types';

interface JobDetailResponse extends Job {
  company?: Company;
  filingForm?: FilingForm | null;
  applicationCount?: number;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuthStore();
  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<JobDetailResponse>(`/jobs/${id}`);
      setJob(res);
    } catch (err) {
      setError('获取岗位详情失败');
      console.error('获取岗位详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (userRole !== 'student') {
      setError('只有学生账号可以投递岗位');
      return;
    }
    if (!id) return;

    setApplying(true);
    setError('');
    try {
      await api.post(`/applications`, { jobId: id });
      setApplySuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投递失败，请重试');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary-600 hover:text-primary-700"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-card p-8 mb-6 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-accent-500">
                  ¥{job.salaryPerHour}
                  <span className="text-base font-normal text-gray-500">/小时</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-6">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                  {job.location}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                  {job.workStartTime} - {job.workEndTime}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                  {job.maxHoursPerDay}小时/天，{job.maxHoursPerWeek}小时/周
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {job.majorRequired.map((major) => (
                  <span
                    key={major}
                    className="px-3 py-1 bg-primary-50 text-primary-600 text-sm rounded-full"
                  >
                    {major}
                  </span>
                ))}
                {job.workDays.map((day) => (
                  <span
                    key={day}
                    className="px-3 py-1 bg-accent-50 text-accent-500 text-sm rounded-full"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:text-right">
              <div className="flex items-center justify-center lg:justify-end text-sm text-gray-500 mb-2">
                <User className="w-4 h-4 mr-1.5 text-gray-400" />
                {job.applicationCount || 0} 人投递
              </div>
              {job.filingForm && (
                <div className="inline-flex items-center px-3 py-1.5 bg-success-50 text-success-500 text-sm rounded-full">
                  <Shield className="w-4 h-4 mr-1.5" />
                  已备案
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
                岗位描述
              </h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {job.description || '暂无岗位描述'}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-primary-600" />
                任职要求
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>相关专业背景：{job.majorRequired.join('、')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>工作时间：{job.workDays.join('、')}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>每日工作时长不超过 {job.maxHoursPerDay} 小时</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>每周工作时长不超过 {job.maxHoursPerWeek} 小时</span>
                </li>
              </ul>
            </div>

            {job.filingForm && (
              <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileCheck className="w-5 h-5 mr-2 text-success-500" />
                  用工备案表公示
                </h2>
                <div className="bg-success-50 border border-success-200 rounded-xl p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">每日最长工时</p>
                      <p className="text-lg font-semibold text-gray-900">{job.filingForm.maxHoursPerDay} 小时</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">每周最长工时</p>
                      <p className="text-lg font-semibold text-gray-900">{job.filingForm.maxHoursPerWeek} 小时</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">最低时薪</p>
                      <p className="text-lg font-semibold text-accent-500">¥{job.filingForm.minWage}/时</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">保险保障</p>
                      <p className="text-lg font-semibold text-success-600">
                        {job.filingForm.insuranceProvided ? '已提供' : '未提供'}
                      </p>
                    </div>
                    {job.filingForm.insuranceType && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 mb-1">保险类型</p>
                        <p className="text-gray-900">{job.filingForm.insuranceType}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-success-200 pt-4 mt-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">安全措施</p>
                      <p className="text-gray-700">{job.filingForm.safetyMeasures}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">紧急联系人</p>
                        <p className="text-gray-700">{job.filingForm.emergencyContact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">紧急联系电话</p>
                        <p className="text-gray-700">{job.filingForm.emergencyPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-success-200 text-sm text-success-600">
                    <Shield className="w-4 h-4 inline mr-1" />
                    备案时间：{new Date(job.filingForm.filedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-primary-600" />
                企业信息
              </h2>
              {job.company ? (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
                      <Building2 className="w-7 h-7 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.company.name}</h3>
                      {job.company.verified && (
                        <span className="inline-flex items-center text-xs text-success-600">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          已认证
                        </span>
                      )}
                    </div>
                  </div>

                  {job.company.industry && (
                    <div className="text-sm text-gray-500 mb-3">
                      <span className="text-gray-400 mr-2">行业：</span>
                      {job.company.industry}
                    </div>
                  )}

                  {job.company.address && (
                    <div className="text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
                      {job.company.address}
                    </div>
                  )}

                  {job.company.description && (
                    <p className="text-sm text-gray-600 mt-4 line-clamp-4">
                      {job.company.description}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">企业信息暂未公开</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock3 className="w-5 h-5 mr-2 text-primary-600" />
                工作信息
              </h2>
              <ul className="space-y-3">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">工作地点</span>
                  <span className="text-gray-900">{job.location}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">工作时间</span>
                  <span className="text-gray-900">{job.workStartTime}-{job.workEndTime}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">工作天数</span>
                  <span className="text-gray-900">{job.workDays.join('、')}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">日工时上限</span>
                  <span className="text-gray-900">{job.maxHoursPerDay}小时</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">周工时上限</span>
                  <span className="text-gray-900">{job.maxHoursPerWeek}小时</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">薪资结算</span>
                  <span className="text-accent-500 font-medium">¥{job.salaryPerHour}/时</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-accent-500">¥{job.salaryPerHour}</span>
            <span className="text-gray-500 ml-1">/小时</span>
          </div>
          <div className="flex items-center space-x-3">
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
            {applySuccess ? (
              <div className="flex items-center text-success-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">投递成功</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className={cn(
                  'px-8 py-3 bg-accent-500 text-white font-medium rounded-xl',
                  'hover:bg-accent-600 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {applying ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline" />
                ) : userRole === 'student' ? (
                  '立即投递'
                ) : user ? (
                  '学生账号可投递'
                ) : (
                  '登录后投递'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
