import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '@/api/jobs';
import type { Job } from '@/types';

const payTypeLabel: Record<string, string> = { daily: '日结', weekly: '周结', project: '项目制', online: '线上' };
const safetyColors: Record<number, string> = { 1: 'badge-green', 2: 'badge-yellow', 3: 'badge-red' };
const safetyLabel: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险' };
const categories = ['餐饮服务', '零售促销', '活动执行', '家政服务', '线上兼职', '物流配送', '教育培训', '其他'];
const payTypes = [
  { value: '', label: '全部' },
  { value: 'daily', label: '日结' },
  { value: 'weekly', label: '周结' },
  { value: 'project', label: '项目制' },
  { value: 'online', label: '线上' },
];

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [payType, setPayType] = useState('');
  const [location, setLocation] = useState('');
  const [safetyLevel, setSafetyLevel] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    getJobs({
      status: 'approved',
      category: category || undefined,
      pay_type: payType || undefined,
      location: location || undefined,
      safety_level: safetyLevel || undefined,
      page,
      pageSize,
    })
      .then((res) => {
        setJobs(res.list);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [category, payType, location, safetyLevel, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">岗位列表</h1>
        <Link to="/jobs/create" className="btn-primary text-sm">
          + 发布岗位
        </Link>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="select-field">
            <option value="">全部分类</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={payType} onChange={(e) => { setPayType(e.target.value); setPage(1); }} className="select-field">
            {payTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            type="text"
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
            placeholder="搜索地点..."
            className="input-field"
          />
          <select value={safetyLevel} onChange={(e) => { setSafetyLevel(e.target.value ? Number(e.target.value) : ''); setPage(1); }} className="select-field">
            <option value="">全部安全等级</option>
            <option value="1">低风险</option>
            <option value="2">中风险</option>
            <option value="3">高风险</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-3">🔍</p>
          <p>暂无符合条件的岗位</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="card p-5 hover:border-brand-100 group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 group-hover:text-brand-500 transition-colors line-clamp-1">{job.title}</h3>
                  <span className={safetyColors[job.safety_level] || 'badge-gray'}>{safetyLabel[job.safety_level]}</span>
                </div>
                <p className="text-brand-500 font-bold text-lg mb-2">
                  ¥{job.pay_amount}
                  <span className="text-slate-400 text-sm font-normal">/{payTypeLabel[job.pay_type]}</span>
                </p>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{job.description || '暂无描述'}</p>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  {job.location && <span>📍 {job.location}</span>}
                  {job.work_start && <span>📅 {job.work_start}</span>}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="badge-blue">{payTypeLabel[job.pay_type]}</span>
                  {job.applied_count > 0 && <span className="badge-gray">{job.applied_count}人申请</span>}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-sm text-slate-500 px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
