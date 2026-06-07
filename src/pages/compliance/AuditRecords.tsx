import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, X, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

interface AuditRecord {
  id: string;
  auditType: string;
  title: string;
  date: string;
  auditor: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: 'pass' | 'fail' | 'partial';
  remarks?: string;
}

const mockAudits: AuditRecord[] = [
  { id: '1', auditType: '年度用电合规审计', title: '2026年Q2用电合规审计', date: '2026-06-05', auditor: '审计科-李工', status: 'in_progress', remarks: '正在进行用电数据核查' },
  { id: '2', auditType: '能效专项审计', title: '重点用能设备能效审计', date: '2026-05-20', auditor: '审计科-王工', status: 'completed', result: 'pass', remarks: '各项指标符合要求，通过审计' },
  { id: '3', auditType: '安全用电审计', title: '电气安全专项检查', date: '2026-04-15', auditor: '审计科-张工', status: 'completed', result: 'partial', remarks: '发现2项安全隐患，已完成整改' },
  { id: '4', auditType: '碳排放审计', title: '一季度碳排放核查', date: '2026-04-01', auditor: '第三方机构', status: 'completed', result: 'pass', remarks: '碳排放数据真实准确，符合核算规范' },
  { id: '5', auditType: '年度用电合规审计', title: '2026年Q1用电合规审计', date: '2026-03-15', auditor: '审计科-李工', status: 'completed', result: 'pass' },
  { id: '6', auditType: '需求响应审计', title: '需求响应专项审计', date: '2026-02-10', auditor: '审计科-刘工', status: 'failed', result: 'fail', remarks: '响应数据不全，需要补充资料后重新审计' },
];

const AUDIT_TYPES = ['年度用电合规审计', '能效专项审计', '安全用电审计', '碳排放审计', '需求响应审计', '电价政策执行审计'];

export default function AuditRecords() {
  const [audits, setAudits] = useState<AuditRecord[]>(mockAudits);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ auditType: '', title: '', auditor: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<AuditRecord[]>('/compliance/audits');
        setAudits(res);
      } catch {
        setAudits(mockAudits);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    const newAudit: AuditRecord = {
      id: 'a' + Date.now(),
      auditType: form.auditType,
      title: form.title,
      date: dayjs().format('YYYY-MM-DD'),
      auditor: form.auditor,
      status: 'pending',
    };
    setAudits((prev) => [newAudit, ...prev]);
    setShowForm(false);
    setForm({ auditType: '', title: '', auditor: '' });
  };

  const statusBadge = (s: string) => {
    if (s === 'completed') return 'badge-green';
    if (s === 'in_progress') return 'badge-amber';
    if (s === 'pending') return 'badge-blue';
    return 'badge-red';
  };
  const statusLabel = (s: string) => {
    if (s === 'completed') return '已完成';
    if (s === 'in_progress') return '进行中';
    if (s === 'pending') return '待开始';
    return '已失败';
  };
  const resultBadge = (r?: string) => {
    if (r === 'pass') return 'badge-green';
    if (r === 'partial') return 'badge-amber';
    if (r === 'fail') return 'badge-red';
    return 'badge-gray';
  };
  const resultLabel = (r?: string) => {
    if (r === 'pass') return '通过';
    if (r === 'partial') return '部分通过';
    if (r === 'fail') return '未通过';
    return '-';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <ShieldCheck size={28} className="text-csg-green" />
          <div>
            <h1 className="page-title">审计记录</h1>
            <p className="page-desc">查看和管理合规审计记录</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-secondary flex items-center gap-1.5">
          <Plus size={16} /> 创建审计
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>审计类型</th>
              <th>标题</th>
              <th>日期</th>
              <th>审计员</th>
              <th>状态</th>
              <th>结果</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => (
              <tr key={audit.id}>
                <td>
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-csg-navy" />
                    {audit.auditType}
                  </span>
                </td>
                <td className="font-medium text-gray-900 dark:text-white">{audit.title}</td>
                <td>{dayjs(audit.date).format('YYYY-MM-DD')}</td>
                <td>{audit.auditor}</td>
                <td>
                  <span className={`flex items-center gap-1 ${statusBadge(audit.status)}`}>
                    {audit.status === 'in_progress' && <Clock size={12} />}
                    {audit.status === 'completed' && <CheckCircle size={12} />}
                    {audit.status === 'failed' && <AlertCircle size={12} />}
                    {statusLabel(audit.status)}
                  </span>
                </td>
                <td>
                  <span className={resultBadge(audit.result)}>{resultLabel(audit.result)}</span>
                </td>
                <td className="text-gray-500 dark:text-gray-400 text-sm max-w-xs truncate">{audit.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">创建审计</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">审计类型</label>
                <select value={form.auditType} onChange={(e) => setForm((p) => ({ ...p, auditType: e.target.value }))} className="select-field">
                  <option value="">请选择</option>
                  {AUDIT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input-field" placeholder="请输入审计标题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">审计员</label>
                <input type="text" value={form.auditor} onChange={(e) => setForm((p) => ({ ...p, auditor: e.target.value }))} className="input-field" placeholder="请输入审计员" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleSubmit} disabled={!form.auditType || !form.title} className="btn-secondary flex-1">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
