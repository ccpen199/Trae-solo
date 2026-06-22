import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Calendar, Clock, Briefcase, Edit2, XCircle, Share2, FileText, AlertCircle } from 'lucide-react';
import { mockJobs, mockResumes } from '@/mock/data';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = mockJobs.find((j) => j.id === id);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  if (!job) {
    return <div className="text-center py-12 text-ash-500">职位不存在</div>;
  }

  const typeLabel: Record<string, string> = {
    fulltime: '全职',
    parttime: '兼职',
    project: '项目制',
  };

  const typeBadge: Record<string, string> = {
    fulltime: 'bg-terracotta-100 text-terracotta-700',
    parttime: 'bg-spruce-100 text-spruce-700',
    project: 'bg-sand-100 text-sand-700',
  };

  const statusBadge: Record<string, string> = {
    active: 'bg-spruce-100 text-spruce-700',
    closed: 'bg-ash-100 text-ash-600',
    draft: 'bg-sand-100 text-sand-700',
  };

  const statusLabel: Record<string, string> = {
    active: '招聘中',
    closed: '已关闭',
    draft: '草稿',
  };

  const closeReasons = [
    '已录用合适候选人',
    '人员编制调整，需求取消',
    '招聘周期过长，需求变更',
    '候选人放弃录用',
    '其他原因',
  ];

  const handleCloseJob = () => {
    if (!closeReason) return;
    alert(`职位已关闭，原因：${closeReason}`);
    setShowCloseModal(false);
  };

  const applicants = mockResumes.slice(0, 3);

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate('/enterprise/jobs')}
        className="flex items-center gap-2 text-ash-500 hover:text-terracotta-600 mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        返回职位列表
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="font-serif text-3xl font-bold text-ash-700">{job.title}</h1>
                  <span className={`badge ${statusBadge[job.status]}`}>
                    {statusLabel[job.status]}
                  </span>
                  <span className={`badge ${typeBadge[job.employmentType]}`}>
                    {typeLabel[job.employmentType]}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-ash-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    发布于 {job.createdAt}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={16} />
                    预计到岗 {job.arrivalTime}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-terracotta-600 font-serif">
                  {job.salaryMin / 1000}K-{job.salaryMax / 1000}K
                </p>
                <p className="text-xs text-ash-400 mt-1">月薪</p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-ash-100 pt-6">
              {job.status === 'active' && (
                <>
                  <button onClick={() => navigate(`/enterprise/jobs/${job.id}/edit`)} className="btn-secondary flex items-center gap-2">
                    <Edit2 size={16} />
                    编辑职位
                  </button>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="btn-outline flex items-center gap-2 text-terracotta-600 border-terracotta-500 hover:bg-terracotta-50"
                  >
                    <XCircle size={16} />
                    关闭职位
                  </button>
                </>
              )}
              <button className="btn-secondary flex items-center gap-2">
                <Share2 size={16} />
                分享职位
              </button>
            </div>

            {job.status === 'closed' && job.closeReason && (
              <div className="mt-6 p-5 bg-ash-50 rounded-xl border border-ash-100">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-ash-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-ash-700 mb-1">职位关闭原因</h4>
                    <p className="text-sm text-ash-600">{job.closeReason}</p>
                    <p className="text-xs text-ash-400 mt-2">此记录将同步至数据看板的职位关闭原因分布统计。</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="text-sm text-terracotta-600 font-medium hover:text-terracotta-700 flex items-center gap-1 whitespace-nowrap"
                  >
                    <FileText size={14} />
                    查看统计分析
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card p-8">
            <h2 className="font-serif text-xl font-bold text-ash-700 mb-6">岗位JD</h2>
            <div className="prose prose-ash max-w-none">
              {job.jd.split('\n').map((line, i) => (
                <p key={i} className="text-ash-600 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-ash-700">候选人投递</h2>
              <button
                onClick={() => navigate('/enterprise/resumes')}
                className="text-sm text-terracotta-600 font-medium hover:text-terracotta-700"
              >
                查看全部简历匹配
              </button>
            </div>
            <div className="space-y-4">
              {applicants.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-4 bg-ash-50 rounded-xl hover:bg-ash-100 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-medium">
                    {r.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-ash-700">{r.name}</p>
                      <span className="text-xs text-ash-500">{r.education}</span>
                    </div>
                    <p className="text-sm text-ash-500 mt-0.5">{r.skills.slice(0, 5).join(' · ')}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold font-serif text-spruce-600">{r.matchScore}</span>
                      <span className="text-xs text-ash-400">分</span>
                    </div>
                    <p className="text-xs text-ash-400">匹配度</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-ash-700 mb-4">企业信息</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-serif text-xl font-bold">
                云
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ash-700">云南云智科技</p>
                  <span className="badge bg-sand-100 text-sand-700">
                    已认证
                  </span>
                </div>
                <p className="text-sm text-ash-500">互联网/信息技术 · 50-150人</p>
              </div>
            </div>
            <p className="text-sm text-ash-600 leading-relaxed">
              云南云智科技有限公司成立于2015年，专注于为西南地区企业提供数字化转型解决方案。
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-ash-700 mb-4">招聘数据</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash-500">累计投递</span>
                <span className="font-semibold text-ash-700">{job.applicationsCount} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash-500">待处理</span>
                <span className="font-semibold text-terracotta-600">{Math.floor(job.applicationsCount * 0.4)} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash-500">已面试</span>
                <span className="font-semibold text-spruce-600">{Math.floor(job.applicationsCount * 0.2)} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash-500">平均响应时间</span>
                <span className="font-semibold text-ash-700">2.3 小时</span>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-terracotta-500 to-spruce-500 text-white">
            <h3 className="font-serif text-lg font-bold mb-3">快速操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/enterprise/resumes')}
                className="w-full py-2.5 bg-white/15 hover:bg-white/25 rounded-lg font-medium transition-colors"
              >
                查看匹配简历
              </button>
              <button
                onClick={() => navigate('/enterprise/interviews')}
                className="w-full py-2.5 bg-white hover:text-terracotta-600 text-ash-700 rounded-lg font-medium transition-colors"
              >
                邀约面试
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-serif text-xl font-bold text-ash-700 mb-2">关闭职位</h3>
            <p className="text-sm text-ash-500 mb-6">请选择关闭原因，以便我们统计和优化招聘流程。</p>
            <div className="space-y-2 mb-6">
              {closeReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    closeReason === reason
                      ? 'border-terracotta-500 bg-terracotta-50'
                      : 'border-ash-100 hover:border-ash-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="closeReason"
                    value={reason}
                    checked={closeReason === reason}
                    onChange={() => setCloseReason(reason)}
                    className="w-4 h-4 text-terracotta-500"
                  />
                  <span className="text-sm text-ash-700">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleCloseJob}
                disabled={!closeReason}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
