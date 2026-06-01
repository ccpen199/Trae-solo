import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { getRiskMap, submitReport, getBlacklist } from '@/api/risk';
import type { RiskMapPoint, BlacklistEntry } from '@/types';

const reportTypes = [
  { value: 'wage_arrears', label: '拖欠工资' },
  { value: 'false_info', label: '虚假信息' },
  { value: 'unsafe', label: '安全隐患' },
  { value: 'harassment', label: '骚扰行为' },
  { value: 'other', label: '其他' },
];

export default function RiskMap() {
  const { user } = useAuthStore();
  const [riskPoints, setRiskPoints] = useState<RiskMapPoint[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    target_employer_id: '',
    job_id: '',
    report_type: 'wage_arrears',
    description: '',
    location: '',
    lat: '',
    lng: '',
  });

  useEffect(() => {
    getRiskMap().then(setRiskPoints).catch(() => {});
    getBlacklist().then(setBlacklist).catch(() => {});
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitReport({
        ...reportForm,
        target_employer_id: reportForm.target_employer_id ? Number(reportForm.target_employer_id) : undefined,
        job_id: reportForm.job_id ? Number(reportForm.job_id) : undefined,
        lat: reportForm.lat ? Number(reportForm.lat) : undefined,
        lng: reportForm.lng ? Number(reportForm.lng) : undefined,
      });
      setShowReport(false);
      setReportForm({ target_employer_id: '', job_id: '', report_type: 'wage_arrears', description: '', location: '', lat: '', lng: '' });
      alert('举报已提交');
      getRiskMap().then(setRiskPoints).catch(() => {});
    } catch (err: any) {
      alert(err.response?.data?.message || '提交失败');
    }
  };

  const getColor = (count: number) => {
    if (count >= 5) return 'bg-red-500/70';
    if (count >= 3) return 'bg-amber-500/60';
    return 'bg-yellow-400/50';
  };

  const getSize = (count: number) => {
    const base = 20;
    return Math.min(base + count * 8, 60);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">风险地图</h1>
        <button onClick={() => setShowReport(true)} className="btn-danger text-sm">
          🚨 举报风险
        </button>
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">风险热力图</h2>
          <p className="text-sm text-slate-400 mt-0.5">基于举报数据的风险分布（模拟视图）</p>
        </div>
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 h-[400px] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400/50" /> 低风险</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500/60" /> 中风险</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500/70" /> 高风险</span>
            </div>
          </div>
          {riskPoints.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <p className="text-3xl mb-2">🗺️</p>
                <p>暂无风险数据</p>
                <p className="text-sm">当有风险举报时，热力点将显示在此</p>
              </div>
            </div>
          )}
          {riskPoints.map((point, index) => {
            const size = getSize(point.count);
            const left = ((point.lng + 180) / 360) * 100;
            const top = ((90 - point.lat) / 180) * 100;
            return (
              <div
                key={index}
                className={`absolute rounded-full ${getColor(point.count)} animate-pulse`}
                style={{
                  width: size,
                  height: size,
                  left: `${Math.min(Math.max(left, 5), 95)}%`,
                  top: `${Math.min(Math.max(top, 5), 95)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`举报数: ${point.count} | 类型: ${point.types}`}
              />
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-700 mb-4">黑名单</h2>
        {blacklist.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">暂无黑名单记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">雇主</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">原因</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">被举报次数</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-50">
                    <td className="py-3 px-4 text-slate-700">{entry.employer_nickname || `#${entry.employer_id}`}</td>
                    <td className="py-3 px-4 text-slate-600">{entry.reason || '-'}</td>
                    <td className="py-3 px-4"><span className="badge-red">{entry.reported_count}次</span></td>
                    <td className="py-3 px-4 text-slate-400">{entry.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">风险举报</h3>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="label-text">举报类型 *</label>
                <select value={reportForm.report_type} onChange={(e) => setReportForm((f) => ({ ...f, report_type: e.target.value }))} className="select-field">
                  {reportTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">雇主ID</label>
                <input type="number" value={reportForm.target_employer_id} onChange={(e) => setReportForm((f) => ({ ...f, target_employer_id: e.target.value }))} className="input-field" placeholder="被举报雇主ID" />
              </div>
              <div>
                <label className="label-text">岗位ID</label>
                <input type="number" value={reportForm.job_id} onChange={(e) => setReportForm((f) => ({ ...f, job_id: e.target.value }))} className="input-field" placeholder="相关岗位ID" />
              </div>
              <div>
                <label className="label-text">详细描述</label>
                <textarea value={reportForm.description} onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))} className="input-field min-h-[80px]" placeholder="请详细描述风险情况..." />
              </div>
              <div>
                <label className="label-text">地点</label>
                <input type="text" value={reportForm.location} onChange={(e) => setReportForm((f) => ({ ...f, location: e.target.value }))} className="input-field" placeholder="地点" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">纬度</label>
                  <input type="number" step="0.01" value={reportForm.lat} onChange={(e) => setReportForm((f) => ({ ...f, lat: e.target.value }))} className="input-field" placeholder="如 39.9" />
                </div>
                <div>
                  <label className="label-text">经度</label>
                  <input type="number" step="0.01" value={reportForm.lng} onChange={(e) => setReportForm((f) => ({ ...f, lng: e.target.value }))} className="input-field" placeholder="如 116.4" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-danger">提交举报</button>
                <button type="button" onClick={() => setShowReport(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
