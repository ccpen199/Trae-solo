import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { getJob, applyJob, getJobApplications, updateApplication, uploadOcrReview, uploadSiteReview, reviewOcrAdmin, reviewSiteAdmin, reviewJobStatus } from '@/api/jobs';
import type { Job, JobApplication, JobReviewLog } from '@/types';

const payTypeLabel: Record<string, string> = { daily: '日结', weekly: '周结', project: '项目制', online: '线上' };
const safetyColors: Record<number, string> = { 1: 'badge-green', 2: 'badge-yellow', 3: 'badge-red' };
const safetyLabel: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险' };
const appStatusLabel: Record<string, string> = { applied: '已申请', accepted: '已接受', rejected: '已拒绝', completed: '已完成' };
const appStatusColor: Record<string, string> = { applied: 'badge-blue', accepted: 'badge-green', rejected: 'badge-red', completed: 'badge-gray' };
const reviewStatusLabel: Record<string, string> = { pending: '待审核', passed: '已通过', failed: '未通过' };
const reviewStatusColor: Record<string, string> = { pending: 'badge-yellow', passed: 'badge-green', failed: 'badge-red' };
const employerTypeLabel: Record<string, string> = { '校园社团': '校园社团', '连锁门店': '连锁门店', '活动公司': '活动公司', '其他': '其他' };
const reviewTypeLabel: Record<string, string> = { ocr: 'OCR资质审核', site: '现场核验', status: '岗位状态' };

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [showSiteReview, setShowSiteReview] = useState(false);
  const [showStatusReview, setShowStatusReview] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [siteResult, setSiteResult] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'passed' | 'failed'>('passed');
  const [jobReviewStatus, setJobReviewStatus] = useState<'approved' | 'rejected' | 'closed'>('approved');
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const jobId = Number(id);
  const isOwner = user?.role === 'employer' && job?.employer_id === user?.id;
  const isAdminLike = ['admin', 'platform', 'ops'].includes(user?.role || '');
  const canViewApplications = isOwner || isAdminLike;

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getJob(jobId).then(setJob).finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    if (jobId && canViewApplications) {
      getJobApplications(jobId).then(setApplications).catch(() => {});
    }
  }, [jobId, canViewApplications]);

  const handleApply = async () => {
    if (!jobId) return;
    setApplying(true);
    try {
      await applyJob(jobId, { cover_letter: coverLetter });
      setShowApply(false);
      setCoverLetter('');
      alert('申请成功！');
      getJob(jobId).then(setJob);
    } catch (err: any) {
      alert(err.response?.data?.message || '申请失败');
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateApp = async (appId: number, status: 'accepted' | 'rejected') => {
    try {
      await updateApplication(jobId, appId, { status });
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId) return;
    try {
      const updated = await uploadOcrReview(jobId, file);
      setJob(updated);
      alert('OCR审核材料已上传');
    } catch {
      alert('上传失败');
    }
  };

  const handleSiteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !jobId) return;
    try {
      const updated = await uploadSiteReview(jobId, Array.from(files));
      setJob(updated);
      alert('现场照片已上传');
    } catch {
      alert('上传失败');
    }
  };

  const handleOcrReviewAdmin = async () => {
    if (!jobId) return;
    setSubmitting(true);
    try {
      const updated = await reviewOcrAdmin(jobId, { status: reviewStatus, result: ocrResult });
      setJob(updated);
      setShowOcrReview(false);
      setOcrResult('');
      getJob(jobId).then(setJob);
      alert('审核完成');
    } catch (err: any) {
      alert(err.response?.data?.message || '审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSiteReviewAdmin = async () => {
    if (!jobId) return;
    setSubmitting(true);
    try {
      const updated = await reviewSiteAdmin(jobId, { status: reviewStatus, result: siteResult });
      setJob(updated);
      setShowSiteReview(false);
      setSiteResult('');
      getJob(jobId).then(setJob);
      alert('审核完成');
    } catch (err: any) {
      alert(err.response?.data?.message || '审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusReview = async () => {
    if (!jobId) return;
    setSubmitting(true);
    try {
      const updated = await reviewJobStatus(jobId, { status: jobReviewStatus });
      setJob(updated);
      setShowStatusReview(false);
      getJob(jobId).then(setJob);
      alert('状态更新完成');
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getCreditColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-slate-400">加载中...</div>;
  if (!job) return <div className="flex items-center justify-center h-96 text-slate-400">岗位不存在</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
        ← 返回
      </button>

      <div className="card p-6 lg:p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
            <p className="text-slate-400 text-sm mt-1">ID: {job.id} · {new Date(job.created_at).toLocaleString('zh-CN')}</p>
          </div>
          <div className="flex gap-2">
            <span className={safetyColors[job.safety_level]}>{safetyLabel[job.safety_level]}</span>
            <span className="badge-blue">{payTypeLabel[job.pay_type]}</span>
          </div>
        </div>

        <p className="text-brand-500 font-bold text-2xl mb-6">
          ¥{job.pay_amount}
          <span className="text-slate-400 text-base font-normal">/{job.pay_unit || payTypeLabel[job.pay_type]}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6">
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">分类</p>
            <p className="text-slate-700 font-medium">{job.category || '未分类'}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">工作地点</p>
            <p className="text-slate-700 font-medium">{job.location || '线上'}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">工期</p>
            <p className="text-slate-700 font-medium text-xs">{job.work_start || '待定'} ~ {job.work_end || '待定'}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">招聘人数</p>
            <p className="text-slate-700 font-medium">{job.required_count}人 · {job.applied_count}人已申请</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">岗位状态</p>
            <span className={appStatusColor[job.status === 'approved' ? 'accepted' : job.status === 'rejected' ? 'rejected' : job.status === 'closed' ? 'completed' : 'applied']}>
              {{ draft: '草稿', pending_review: '待审核', approved: '已上架', rejected: '已驳回', closed: '已关闭' }[job.status]}
            </span>
          </div>
        </div>

        {job.required_skills?.length > 0 && (
          <div className="mb-6">
            <p className="text-slate-400 text-sm mb-2">技能要求</p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((s, i) => <span key={i} className="badge-blue text-xs">{s}</span>)}
            </div>
          </div>
        )}

        <div className="mb-6 pt-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-3">岗位描述</h3>
          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.description || '暂无描述'}</p>
        </div>

        {user?.role === 'worker' && job.status === 'approved' && (
          <div className="pt-4 border-t border-slate-100">
            {showApply ? (
              <div className="space-y-4">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="简要介绍自己，为什么适合这份工作..."
                />
                <div className="flex gap-3">
                  <button onClick={handleApply} disabled={applying} className="btn-primary">
                    {applying ? '提交中...' : '确认申请'}
                  </button>
                  <button onClick={() => setShowApply(false)} className="btn-secondary">取消</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowApply(true)} className="btn-primary">
                立即申请
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          🏢 雇主信息
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">雇主名称</p>
            <p className="text-slate-700 font-semibold">{job.employer_name || job.employer_nickname || '未知'}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">主体类型</p>
            <span className="badge-purple text-xs">{employerTypeLabel[job.employer_type || ''] || '未填写'}</span>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">营业执照</p>
            <p className="text-slate-700 font-mono text-xs">{job.business_license || '未认证'}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-400 text-xs mb-1">入驻时间</p>
            <p className="text-slate-700 text-sm">{job.employer_created_at ? new Date(job.employer_created_at).toLocaleDateString('zh-CN') : '未知'}</p>
          </div>
        </div>
      </div>

      {(isOwner || isAdminLike) && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>✅ 真实性双审</span>
            {isAdminLike && (
              <button onClick={() => setShowStatusReview(true)} className="btn-primary text-sm px-4 py-2">
                状态审核
              </button>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-700">OCR资质审核</p>
                  <span className={reviewStatusColor[job.review_ocr_status]}>{reviewStatusLabel[job.review_ocr_status]}</span>
                </div>
                <div className="flex gap-2">
                  {isOwner && job.review_ocr_status !== 'passed' && (
                    <label className="btn-secondary text-xs cursor-pointer">
                      上传
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleOcrUpload} />
                    </label>
                  )}
                  {isAdminLike && (
                    <button onClick={() => { setReviewStatus(job.review_ocr_status === 'passed' ? 'passed' : 'passed'); setShowOcrReview(true); }} className="btn-accent text-xs px-3 py-1.5">
                      审核
                    </button>
                  )}
                </div>
              </div>
              {job.review_ocr_result && (
                <div className="mt-3 p-3 rounded bg-slate-50 text-xs text-slate-500">
                  <p className="font-medium text-slate-600 mb-1">识别结果：</p>
                  <p className="font-mono">{job.review_ocr_result}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-700">现场核验</p>
                  <span className={reviewStatusColor[job.review_site_status]}>{reviewStatusLabel[job.review_site_status]}</span>
                </div>
                <div className="flex gap-2">
                  {isOwner && job.review_site_status !== 'passed' && (
                    <label className="btn-secondary text-xs cursor-pointer">
                      上传
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleSiteUpload} />
                    </label>
                  )}
                  {isAdminLike && (
                    <button onClick={() => { setReviewStatus(job.review_site_status === 'passed' ? 'passed' : 'passed'); setShowSiteReview(true); }} className="btn-accent text-xs px-3 py-1.5">
                      审核
                    </button>
                  )}
                </div>
              </div>
              {job.review_site_photos?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-600 mb-2">核验照片 ({job.review_site_photos.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.review_site_photos.map((p, i) => (
                      <div key={i} className="aspect-square rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                        📷
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {job.review_logs && job.review_logs.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">审核记录</h3>
              <div className="space-y-2">
                {job.review_logs.map((log: JobReviewLog) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 text-sm">
                    <span className="text-lg">
                      {log.review_type === 'ocr' ? '🔍' : log.review_type === 'site' ? '📍' : '📋'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{reviewTypeLabel[log.review_type]}</span>
                        <span className={reviewStatusColor[log.new_status]}>{reviewStatusLabel[log.new_status]}</span>
                      </div>
                      {log.result && <p className="text-slate-500 text-xs mt-1">{log.result}</p>}
                      <p className="text-slate-400 text-xs mt-1">
                        {log.reviewer_nickname || '系统'} · {new Date(log.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {canViewApplications && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-800 mb-4">申请列表 ({applications.length})</h2>
          {applications.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">暂无申请</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold flex-shrink-0">
                        {app.nickname?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-700">{app.nickname || `用户${app.worker_id}`}</p>
                          {app.identity_tags?.map((t, i) => <span key={i} className="badge-blue text-xs">{t}</span>)}
                          <span className={`text-xs font-bold ${getCreditColor(app.credit_score || 0)}`}>
                            信用分 {app.credit_score || 100}
                          </span>
                        </div>
                        {app.skill_certs && app.skill_certs.length > 0 && (
                          <div className="flex gap-1.5 mt-1">
                            {app.skill_certs.map((s, i) => <span key={i} className="badge-gray text-xs">{s}</span>)}
                          </div>
                        )}
                        {app.cover_letter && <p className="text-slate-500 text-sm mt-2 line-clamp-2">{app.cover_letter}</p>}
                        <p className="text-slate-400 text-xs mt-1">{new Date(app.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className={appStatusColor[app.status]}>{appStatusLabel[app.status]}</span>
                      {app.status === 'applied' && isOwner && (
                        <>
                          <button onClick={() => handleUpdateApp(app.id, 'accepted')} className="btn-accent text-xs px-3 py-1.5">接受</button>
                          <button onClick={() => handleUpdateApp(app.id, 'rejected')} className="btn-danger text-xs px-3 py-1.5">拒绝</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showOcrReview && isAdminLike && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 mb-4">OCR资质审核</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">审核结果</label>
              <div className="flex gap-2">
                {(['passed', 'failed'] as const).map((s) => (
                  <button key={s} onClick={() => setReviewStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reviewStatus === s ? (s === 'passed' ? 'btn-accent' : 'btn-danger') : 'btn-secondary'}`}>
                    {s === 'passed' ? '通过' : '驳回'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">审核意见</label>
              <textarea value={ocrResult} onChange={(e) => setOcrResult(e.target.value)}
                className="input-field min-h-[80px]" placeholder="请填写审核意见..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleOcrReviewAdmin} disabled={submitting} className="btn-primary flex-1">
                {submitting ? '提交中...' : '确认审核'}
              </button>
              <button onClick={() => setShowOcrReview(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {showSiteReview && isAdminLike && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 mb-4">现场核验审核</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">审核结果</label>
              <div className="flex gap-2">
                {(['passed', 'failed'] as const).map((s) => (
                  <button key={s} onClick={() => setReviewStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reviewStatus === s ? (s === 'passed' ? 'btn-accent' : 'btn-danger') : 'btn-secondary'}`}>
                    {s === 'passed' ? '通过' : '驳回'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">审核意见</label>
              <textarea value={siteResult} onChange={(e) => setSiteResult(e.target.value)}
                className="input-field min-h-[80px]" placeholder="请填写审核意见..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSiteReviewAdmin} disabled={submitting} className="btn-primary flex-1">
                {submitting ? '提交中...' : '确认审核'}
              </button>
              <button onClick={() => setShowSiteReview(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {showStatusReview && isAdminLike && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 mb-4">岗位状态审核</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">设置状态</label>
              <div className="flex gap-2 flex-wrap">
                {(['approved', 'rejected', 'closed'] as const).map((s) => (
                  <button key={s} onClick={() => setJobReviewStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${jobReviewStatus === s ? (s === 'approved' ? 'btn-accent' : s === 'rejected' ? 'btn-danger' : 'btn-secondary') : 'btn-secondary'}`}>
                    {{ approved: '通过上架', rejected: '驳回', closed: '关闭' }[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleStatusReview} disabled={submitting} className="btn-primary flex-1">
                {submitting ? '提交中...' : '确认'}
              </button>
              <button onClick={() => setShowStatusReview(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
