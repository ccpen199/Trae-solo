import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

const API = '/api';

interface Job {
  id: number;
  title: string;
}

interface QrCodeData {
  qrcode_token: string;
  job_id: number;
  job_title: string;
  expires_at: string;
}

interface RecentRecord {
  id: number;
  student_name: string;
  checkin_time: string;
  status: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

export default function AttendanceCheckin() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [qrcodeData, setQrcodeData] = useState<QrCodeData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownActive = countdown > 0;

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ items: Job[]; total: number }>('/jobs?status=published&pageSize=100');
        setJobs(data.items || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const fetchRecentRecords = useCallback(async (jobId: string) => {
    try {
      const data = await apiFetch<{ items: { id: number; student_name: string; checkin_time: string; status: string }[]; total: number }>(`/attendance?job_id=${jobId}&pageSize=5`);
      setRecentRecords(
        (data.items || []).map(r => ({
          id: r.id,
          student_name: r.student_name,
          checkin_time: r.checkin_time,
          status: r.status,
        }))
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setQrcodeData(null);
      setCountdown(0);
      setRecentRecords([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<QrCodeData>(`/attendance/qrcode?job_id=${selectedJobId}`);
        setQrcodeData(data);
        const expires = new Date(data.expires_at).getTime();
        const now = Date.now();
        setCountdown(Math.max(0, Math.floor((expires - now) / 1000)));
        fetchRecentRecords(selectedJobId);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedJobId, fetchRecentRecords]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!countdownActive) return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdownActive]);

  const handleCheckIn = async () => {
    if (!selectedJobId) return;
    setCheckingIn(true);
    try {
      await apiFetch('/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: Number(selectedJobId), student_id: 1, method: 'qrcode' }),
      });
      setCheckedIn(true);
      fetchRecentRecords(selectedJobId);
      setTimeout(() => setCheckedIn(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCheckingIn(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const generateQrGrid = (token: string) => {
    const cells: boolean[] = [];
    for (let i = 0; i < 49; i++) {
      const code = token.charCodeAt(i % token.length);
      cells.push((code * (i + 1)) % 3 !== 0);
    }
    return cells;
  };

  const formatTime = (t: string) => {
    if (!t) return '-';
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/attendance')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-heading font-bold text-gray-800">扫码签到</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card-base p-5">
          <label className="text-sm font-medium text-gray-700 mb-2 block">选择岗位</label>
          <select
            value={selectedJobId}
            onChange={(e) => { setSelectedJobId(e.target.value); setCheckedIn(false); }}
            className="input-base"
          >
            <option value="">请选择岗位</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        {loading && (
          <div className="card-base p-8 text-center text-gray-400">加载中...</div>
        )}

        {qrcodeData && !loading && (
          <div className="card-base p-8 text-center animate-fade-in">
            <h3 className="font-heading font-semibold text-gray-800 mb-2">{qrcodeData.job_title} · 签到</h3>
            <p className="text-sm text-gray-500 mb-6">请使用手机扫描下方二维码完成签到</p>

            <div className="relative inline-block">
              <div className={`w-56 h-56 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${
                checkedIn ? 'border-emerald-400 shadow-lg shadow-emerald-200' : 'border-primary/20'
              }`}>
                {checkedIn ? (
                  <div className="animate-fade-in flex flex-col items-center">
                    <CheckCircle2 size={64} className="text-emerald-500" />
                    <p className="text-emerald-600 font-medium mt-2">签到成功！</p>
                  </div>
                ) : countdown > 0 ? (
                  <div className="w-44 h-44 bg-white rounded-xl shadow-inner flex items-center justify-center">
                    <div className="grid grid-cols-7 gap-0.5">
                      {generateQrGrid(qrcodeData.qrcode_token).map((filled, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-sm ${filled ? 'bg-primary' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <p className="text-sm">二维码已过期</p>
                    <button
                      onClick={() => setSelectedJobId(selectedJobId)}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      重新获取
                    </button>
                  </div>
                )}
              </div>
            </div>

            {countdown > 0 && !checkedIn && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="font-mono text-lg text-gray-600">
                  倒计时 {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            )}

            <button
              onClick={handleCheckIn}
              disabled={checkingIn || !selectedJobId}
              className="mt-6 btn-accent px-8 py-3 text-base disabled:opacity-50"
            >
              {checkingIn ? '签到中...' : '模拟签到'}
            </button>
          </div>
        )}

        {selectedJobId && (
          <div className="card-base p-5 animate-fade-in">
            <h4 className="font-heading font-semibold text-gray-800 mb-3">最近签到</h4>
            {recentRecords.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无签到记录</p>
            ) : (
              <div className="space-y-2">
                {recentRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                      {r.student_name?.[0] || '?'}
                    </div>
                    <span className="text-sm text-gray-700">{r.student_name}</span>
                    <span className="ml-auto font-mono text-sm text-gray-500">{formatTime(r.checkin_time)}</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
