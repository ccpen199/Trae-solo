import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Clock, CheckCircle, XCircle, Calendar, Plus, ToggleLeft, ToggleRight, Users,
} from 'lucide-react';
import type { Counselor, TimeSlot, Session } from '@/types';

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: '已预约', color: 'text-sky-500', bg: 'bg-sky-50' },
  in_progress: { label: '进行中', color: 'text-lavender-500', bg: 'bg-lavender-50' },
  completed: { label: '已完成', color: 'text-mint-500', bg: 'bg-mint-50' },
  cancelled: { label: '已取消', color: 'text-coral-500', bg: 'bg-coral-50' },
};

function OcrIcon({ status }: { status: string }) {
  if (status === 'verified') return <CheckCircle size={18} className="text-mint-500" />;
  if (status === 'rejected') return <XCircle size={18} className="text-coral-500" />;
  return <Clock size={18} className="text-yellow-500" />;
}

function DbMatchIcon({ status }: { status: string }) {
  if (status === 'matched') return <CheckCircle size={18} className="text-mint-500" />;
  if (status === 'mismatched') return <XCircle size={18} className="text-coral-500" />;
  return <Clock size={18} className="text-yellow-500" />;
}

const ocrLabel: Record<string, string> = { pending: '待核验', verified: '已通过', rejected: '已拒绝' };
const dbLabel: Record<string, string> = { pending: '待核验', matched: '已匹配', mismatched: '未匹配' };

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export default function CounselorWorkbench() {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [counselorId, setCounselorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [autoMatch, setAutoMatch] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');

  useEffect(() => {
    fetch('/api/counselors')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          const first = json.data[0];
          setCounselor(first);
          setCounselorId(first.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!counselorId) return;
    fetch(`/api/counselors/${counselorId}/slots`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTimeSlots(json.data);
      })
      .catch(() => {});
  }, [counselorId]);

  useEffect(() => {
    if (!counselorId) return;
    fetch(`/api/sessions/history?profileId=${counselorId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSessions(json.data);
        }
      })
      .catch(() => {
        setSessions([]);
      });
  }, [counselorId]);

  const handleUpload = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`/api/counselors/${counselorId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocr_status: 'verified', db_match_status: 'matched' }),
      });
      const json = await res.json();
      if (json.success) setCounselor(json.data);
    } catch { /* noop */ } finally {
      setUploading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlotDate || !newSlotStart || !newSlotEnd) return;
    try {
      const res = await fetch(`/api/counselors/${counselorId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_date: newSlotDate, start_time: newSlotStart, end_time: newSlotEnd }),
      });
      const json = await res.json();
      if (json.success) {
        setTimeSlots((prev) => [...prev, json.data]);
        setShowAddSlot(false);
        setNewSlotDate('');
        setNewSlotStart('09:00');
        setNewSlotEnd('10:00');
      }
    } catch { /* noop */ }
  };

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const slotsByDay = weekDates.map((date) =>
    timeSlots.filter((s) => s.slot_date === date && s.is_available === 1)
  );

  const tabs = ['资质核验', '排班管理', '来访列表'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-lavender-600">咨询师工作台</h1>
            <p className="text-slate-dark-400 text-sm mt-1">管理资质、排班与来访匹配</p>
          </div>
          {counselor && (
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-soft">
              <div className="w-10 h-10 rounded-full bg-lavender-100 text-lavender-600 flex items-center justify-center font-serif text-lg">
                {counselor.anonymous_name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-dark-800 truncate">{counselor.anonymous_name}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded ${counselor.ocr_status === 'verified' ? 'bg-mint-100 text-mint-500' : counselor.ocr_status === 'rejected' ? 'bg-coral-100 text-coral-500' : 'bg-yellow-100 text-yellow-500'}`}>
                    OCR: {ocrLabel[counselor.ocr_status]}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${counselor.db_match_status === 'matched' ? 'bg-mint-100 text-mint-500' : counselor.db_match_status === 'mismatched' ? 'bg-coral-100 text-coral-500' : 'bg-yellow-100 text-yellow-500'}`}>
                    DB: {dbLabel[counselor.db_match_status]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1 bg-white rounded-full p-1 shadow-soft">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i as 0 | 1 | 2)}
              className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === i ? 'bg-lavender-500 text-white' : 'text-slate-dark-400 hover:text-lavender-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div key="cred" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="space-y-6">
              <h2 className="font-serif text-2xl text-lavender-600">资质核验状态</h2>
              {counselor && (
                <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-dark-500 text-sm">证书类型</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      counselor.credential_type === '二级' ? 'bg-mint-100 text-mint-500' : 'bg-sky-100 text-sky-500'
                    }`}>
                      国家{counselor.credential_type}心理咨询师
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-dark-500 text-sm">OCR核验</span>
                    <OcrIcon status={counselor.ocr_status} />
                    <span className={`text-sm ${counselor.ocr_status === 'verified' ? 'text-mint-500' : counselor.ocr_status === 'rejected' ? 'text-coral-500' : 'text-yellow-500'}`}>
                      {ocrLabel[counselor.ocr_status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-dark-500 text-sm">数据库比对</span>
                    <DbMatchIcon status={counselor.db_match_status} />
                    <span className={`text-sm ${counselor.db_match_status === 'matched' ? 'text-mint-500' : counselor.db_match_status === 'mismatched' ? 'text-coral-500' : 'text-yellow-500'}`}>
                      {dbLabel[counselor.db_match_status]}
                    </span>
                  </div>
                </div>
              )}

              <div
                onClick={uploading ? undefined : handleUpload}
                className={`border-2 border-dashed border-lavender-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
                  uploading ? 'bg-lavender-50 cursor-wait' : 'hover:bg-lavender-50 cursor-pointer'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-lavender-100 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-lavender-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-lavender-500 text-sm font-medium">OCR识别中...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-lavender-50 flex items-center justify-center">
                      <Upload size={24} className="text-lavender-400" />
                    </div>
                    <p className="text-lavender-500 text-sm font-medium">上传国家二/三级心理咨询师证书</p>
                    <p className="text-slate-dark-300 text-xs">点击模拟上传并完成OCR核验</p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div key="schedule" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-lavender-600">排班日历</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAutoMatch(!autoMatch)}
                    className="flex items-center gap-1.5 text-sm text-slate-dark-500"
                  >
                    {autoMatch ? (
                      <ToggleRight size={22} className="text-lavender-500" />
                    ) : (
                      <ToggleLeft size={22} className="text-slate-dark-300" />
                    )}
                    自动匹配
                  </button>
                  <button
                    onClick={() => setShowAddSlot(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-lavender-500 text-white rounded-full text-sm font-medium hover:bg-lavender-600 transition-colors"
                  >
                    <Plus size={16} />
                    添加时段
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-soft overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-8 gap-px bg-slate-dark-100">
                    <div className="bg-slate-dark-50 p-2 text-xs text-slate-dark-400 text-center">时段</div>
                    {DAYS.map((day, i) => (
                      <div key={day} className="bg-slate-dark-50 p-2 text-center">
                        <div className="text-xs font-medium text-slate-dark-600">{day}</div>
                        <div className="text-[10px] text-slate-dark-400">{weekDates[i]?.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="grid grid-cols-8 gap-px bg-slate-dark-100">
                      <div className="bg-white p-2 text-xs text-slate-dark-400 text-center flex items-center justify-center">{time}</div>
                      {weekDates.map((date, dayIdx) => {
                        const slot = slotsByDay[dayIdx]?.find(
                          (s) => s.start_time <= time && s.end_time > time
                        );
                        return (
                          <div key={date} className="bg-white p-1 min-h-[32px] flex items-center justify-center">
                            {slot && time === slot.start_time && (
                              <span className="bg-lavender-100 text-lavender-600 text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                                {slot.start_time}-{slot.end_time}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {showAddSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-2xl p-6 shadow-soft-md space-y-4"
                  >
                    <h3 className="font-serif text-lg text-lavender-600">添加可预约时段</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-slate-dark-500 mb-1 block">日期</label>
                        <input
                          type="date"
                          value={newSlotDate}
                          onChange={(e) => setNewSlotDate(e.target.value)}
                          className="w-full border border-slate-dark-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-lavender-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-dark-500 mb-1 block">开始时间</label>
                        <input
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="w-full border border-slate-dark-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-lavender-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-dark-500 mb-1 block">结束时间</label>
                        <input
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="w-full border border-slate-dark-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-lavender-400"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowAddSlot(false)}
                        className="px-4 py-2 text-sm text-slate-dark-500 hover:text-slate-dark-700 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddSlot}
                        className="px-5 py-2 bg-lavender-500 text-white rounded-full text-sm font-medium hover:bg-lavender-600 transition-colors"
                      >
                        确认添加
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div key="visitors" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="space-y-4">
              <h2 className="font-serif text-2xl text-lavender-600">来访匹配</h2>
              {sessions.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-soft text-center">
                  <div className="w-20 h-20 rounded-full bg-lavender-50 flex items-center justify-center mx-auto mb-4">
                    <Users size={36} className="text-lavender-300" />
                  </div>
                  <p className="text-slate-dark-400 text-lg font-medium">暂无来访匹配</p>
                  <p className="text-slate-dark-300 text-sm mt-2">开启自动匹配后，系统将为你推送合适的来访者</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sessions.map((session, idx) => {
                    const sc = statusBadge[session.status] || statusBadge.scheduled;
                    const scheduledDate = new Date(session.scheduled_at);
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-soft-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center text-sm font-serif">
                              匿
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-dark-800">匿名来访者</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-600`}>
                                  中风险
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-dark-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {scheduledDate.toLocaleDateString('zh-CN')}
                          </span>
                          <span className="flex items-center gap-1">
                            {scheduledDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
