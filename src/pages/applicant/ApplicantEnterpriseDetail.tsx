import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Clock, MapPin, Users, Star, Building2 } from 'lucide-react';
import { mockEnterprises, mockJobs } from '@/mock/data';

export default function ApplicantEnterpriseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const enterprise = mockEnterprises.find((e) => e.id === id) || mockEnterprises[0];
  const jobs = mockJobs.filter((j) => j.enterpriseId === enterprise.id && j.status === 'active');

  const avgRating = enterprise.reviews.reduce((s, r) => s + r.rating, 0) / enterprise.reviews.length;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-sand-500 fill-sand-500' : 'text-ash-300'}
      />
    ));
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/applicant/home')}
        className="flex items-center gap-2 text-ash-500 hover:text-terracotta-600 mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        返回职位列表
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-serif text-3xl font-bold">
                {enterprise.name[2]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-serif text-2xl font-bold text-ash-700">{enterprise.name}</h1>
                  {enterprise.certified && (
                    <span className="badge bg-sand-100 text-sand-700 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      企业已认证
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-ash-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {enterprise.industry}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {enterprise.size}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    云南省
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-ash-50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold font-serif text-spruce-600">{enterprise.responseRate}%</p>
                <p className="text-xs text-ash-500 mt-1">简历响应率</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold font-serif text-sand-600">{enterprise.avgResponseTime}</p>
                <p className="text-xs text-ash-500 mt-1">平均响应时间</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-0.5 mb-1">
                  {renderStars(Math.round(avgRating))}
                </div>
                <p className="text-xs text-ash-500">{enterprise.reviews.length} 条评价</p>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="font-serif text-xl font-bold text-ash-700 mb-4">企业介绍</h2>
            <p className="text-ash-600 leading-relaxed">{enterprise.description}</p>
          </div>

          <div className="card p-8">
            <h2 className="font-serif text-xl font-bold text-ash-700 mb-6">员工评价</h2>
            <div className="space-y-6">
              {enterprise.reviews.map((review) => (
                <div key={review.id} className="pb-6 border-b border-ash-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ash-100 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-ash-300 to-ash-400 blur-sm scale-125" />
                      </div>
                      <div>
                        <p className="font-medium text-ash-700 text-sm">{review.anonymousName}</p>
                        <p className="text-xs text-ash-400">{review.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-ash-600 leading-relaxed pl-13">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-ash-700 mb-4">
              在招职位 ({jobs.length})
            </h3>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-ash-50 rounded-xl hover:bg-ash-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-ash-700">{job.title}</p>
                    <span className="text-terracotta-600 font-semibold text-sm">
                      {job.salaryMin / 1000}K-{job.salaryMax / 1000}K
                    </span>
                  </div>
                  <p className="text-xs text-ash-500">
                    {job.location} · {job.employmentType === 'fulltime' ? '全职' : job.employmentType === 'parttime' ? '兼职' : '项目制'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {!enterprise.certified && (
            <div className="card p-6 bg-sand-50 border-sand-200">
              <h3 className="font-medium text-sand-700 mb-2 flex items-center gap-2">
                <ShieldCheck size={18} className="text-sand-500" />
                认证提示
              </h3>
              <p className="text-sm text-sand-600">
                该企业尚未完成营业执照核验和法人实名绑定，投递简历时请谨慎核实。
              </p>
            </div>
          )}

          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-ash-700 mb-4">求职安全提示</h3>
            <ul className="space-y-3 text-sm text-ash-600">
              <li className="flex items-start gap-2">
                <span className="text-spruce-500 mt-0.5">•</span>
                正规企业招聘不会以任何名义收取费用
              </li>
              <li className="flex items-start gap-2">
                <span className="text-spruce-500 mt-0.5">•</span>
                面试前请核实企业资质与面试地址
              </li>
              <li className="flex items-start gap-2">
                <span className="text-spruce-500 mt-0.5">•</span>
                遇到可疑情况请立即举报
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
