import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Calendar, Filter, CheckCircle2, Clock, XCircle, LogOut, AlertCircle } from 'lucide-react';

const API = '/api';

type AttendanceStatus = 'normal' | 'late' | 'absent' | 'early_leave';

interface AttendanceRecord {
  id: number;
  job_id: number;
  student_id: number;
  checkin_time: string;
  checkout_time: string | null;
  method: string;
  status: AttendanceStatus;
  location: string;
  student_name: string;
  job_title: string;
}

const statusMap: Record<AttendanceStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  normal: { label: '正常', className: 'badge-success', icon: CheckCircle2 },
  late: { label: '迟到', className: 'badge-warning', icon: Clock },
  absent: { label: '缺勤', className: 'badge-danger', icon: XCircle },
  early_leave: { label: '早退', className: 'badge-warning', icon: AlertCircle },
};

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

export default function Attendance() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [appealModal, setAppealModal] = useState<{ id: number; reason: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (jobFilter) params.set('job_id', jobFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('pageSize', '100');
      const data = await apiFetch<{ items: AttendanceRecord[]; total: number }>(`/attendance?${params}`);
      setRecords(data.items || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [date, jobFilter, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const normal = records.filter(r => r.status === 'normal').length;
  const late = records.filter(r => r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const handleBatchVerify = async () => {
    if (selectedIds.size === 0) return;
    setVerifying(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          apiFetch(`/attendance/${id}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'normal' }),
          })
        )
      );
      setSelectedIds(new Set());
      fetchRecords();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setVerifying(false);
    }
  };

  const handleAppeal = async () => {
    if (!appealModal) return;
    try {
      await apiFetch(`/attendance/${appealModal.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'normal' }),
      });
      setAppealModal(null);
      fetchRecords();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleCheckout = async (id: number) => {
    try {
      await apiFetch(`/attendance/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout_time: new Date().toISOString() }),
      });
      fetchRecords();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const jobs = [...new Set(records.map(r => r.job_title))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">考勤管理</h2>
        <button onClick={() => navigate('/attendance/checkin')} className="btn-accent flex items-center gap-2">
          <QrCode size={16} />生成签到码
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 flex items-center gap-3 animate-fade-in stagger-1">
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading font-mono">{normal}</p>
            <p className="text-xs text-gray-500">正常签到</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3 animate-fade-in stagger-2">
          <div className="p-2.5 rounded-xl bg-amber-50">
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading font-mono">{late}</p>
            <p className="text-xs text-gray-500">迟到</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3 animate-fade-in stagger-3">
          <div className="p-2.5 rounded-xl bg-red-50">
            <XCircle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading font-mono">{absent}</p>
            <p className="text-xs text-gray-500">缺勤</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="card-base p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="input-base w-40">
              <option value="">全部岗位</option>
              {jobs.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-32">
            <option value="">全部状态</option>
            <option value="normal">正常</option>
            <option value="late">迟到</option>
            <option value="absent">缺勤</option>
          </select>
          {selectedIds.size > 0 && (
            <button onClick={handleBatchVerify} disabled={verifying} className="btn-primary flex items-center gap-2 ml-auto">
              <CheckCircle2 size={16} />
              {verifying ? '核验中...' : `批量核验通过 (${selectedIds.size})`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无考勤记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">
                    <input type="checkbox" checked={selectedIds.size === records.length && records.length > 0} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">姓名</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">岗位</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">签到时间</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">签到方式</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const Icon = statusMap[record.status]?.icon || AlertCircle;
                  return (
                    <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => toggleSelect(record.id)} className="rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {record.student_name?.[0] || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{record.student_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.job_title}</td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-700">{formatTime(record.checkin_time)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 ${statusMap[record.status]?.className || 'badge-info'}`}>
                          <Icon size={12} />{statusMap[record.status]?.label || record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.method === 'qrcode' ? '扫码' : record.method}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {(record.status === 'late' || record.status === 'absent') && (
                            <button onClick={() => setAppealModal({ id: record.id, reason: '' })} className="text-xs text-accent hover:underline">申诉</button>
                          )}
                          {!record.checkout_time && (
                            <button onClick={() => handleCheckout(record.id)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              <LogOut size={12} />签退
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {appealModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setAppealModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-gray-800 text-lg mb-4">异常申诉</h3>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">申诉原因</label>
              <textarea
                value={appealModal.reason}
                onChange={(e) => setAppealModal({ ...appealModal, reason: e.target.value })}
                className="input-base min-h-[80px] resize-none"
                placeholder="请填写申诉原因..."
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setAppealModal(null)} className="btn-outline flex-1">取消</button>
              <button onClick={handleAppeal} className="btn-accent flex-1">提交申诉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
