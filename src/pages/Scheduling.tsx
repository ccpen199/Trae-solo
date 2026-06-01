import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CalendarDays,
  User,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Schedule, Doctor, Institution, ConflictItem } from '@/types';

const statusMap: Record<
  Schedule['status'],
  { label: string; class: string }
> = {
  draft: { label: '草稿', class: 'border-amber-200 bg-amber-50 text-amber-700' },
  confirmed: { label: '已确认', class: 'border-green-200 bg-green-50 text-green-700' },
  cancelled: { label: '已取消', class: 'border-red-200 bg-red-50 text-red-700' },
  completed: { label: '已完成', class: 'border-blue-200 bg-blue-50 text-blue-700' },
};

const conflictTypeLabels: Record<ConflictItem['type'], string> = {
  hospital_shift: '本院班次冲突',
  cross_institution: '跨机构冲突',
  practice_scope: '执业范围冲突',
  rest_time: '休息时间不足',
};

const conflictSeverityMap: Record<
  ConflictItem['severity'],
  { icon: typeof AlertCircle; class: string; border: string }
> = {
  warning: { icon: AlertCircle, class: 'text-amber-600 bg-amber-50', border: 'border-amber-200' },
  error: { icon: AlertTriangle, class: 'text-red-600 bg-red-50', border: 'border-red-200' },
};

const monthNames = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

interface FormData {
  doctorId: number;
  institutionId: number;
  departmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  slotCount: number;
  isHospitalShift: boolean;
  status: 'draft' | 'confirmed';
}

const initialFormData = (date?: string): FormData => ({
  doctorId: 0,
  institutionId: 0,
  departmentId: 0,
  date: date || new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '12:00',
  slotCount: 20,
  isHospitalShift: false,
  status: 'draft',
});

export default function Scheduling() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData());
  const [validationConflicts, setValidationConflicts] = useState<ConflictItem[]>([]);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const doctorById = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);
  const institutionById = useMemo(
    () => new Map(institutions.map((i) => [i.id, i])),
    [institutions],
  );
  const departmentById = useMemo(() => {
    const map = new Map<number, Institution['departments'][0]>();
    institutions.forEach((inst) => {
      inst.departments.forEach((dept) => map.set(dept.id, dept));
    });
    return map;
  }, [institutions]);

  const selectedInstitutionDepartments = useMemo(
    () =>
      formData.institutionId
        ? institutionById.get(formData.institutionId)?.departments || []
        : [],
    [formData.institutionId, institutionById],
  );

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [schedulesData, doctorsData, institutionsData] = await Promise.all([
        api.schedules.list(),
        api.doctors.list(),
        api.institutions.list(),
      ]);
      setSchedules(schedulesData);
      setDoctors(doctorsData);
      setInstitutions(institutionsData);
    } catch {
      showFeedback('error', '加载数据失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal(date?: string) {
    setFormData(initialFormData(date));
    setValidationConflicts([]);
    setShowModal(true);
  }

  async function validateSchedule() {
    if (!formData.doctorId || !formData.institutionId || !formData.departmentId || !formData.date) {
      return;
    }
    setValidating(true);
    try {
      const submitData = {
        ...formData,
        isHospitalShift: formData.isHospitalShift ? 1 : 0,
      };
      const result = await api.schedules.validate(submitData as Partial<Schedule>);
      setValidationConflicts(result.conflicts || []);
    } catch {
      setValidationConflicts([]);
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    if (formData.doctorId && formData.institutionId && formData.departmentId && formData.date) {
      const timer = setTimeout(validateSchedule, 500);
      return () => clearTimeout(timer);
    } else {
      setValidationConflicts([]);
    }
  }, [formData.doctorId, formData.institutionId, formData.departmentId, formData.date, formData.startTime, formData.endTime]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hasBlockingConflict = validationConflicts.some((c) => c.severity === 'error');
    if (hasBlockingConflict) {
      showFeedback('error', '存在严重冲突，无法创建排班');
      return;
    }
    setSaving(true);
    try {
      await api.schedules.create({
        ...formData,
        isHospitalShift: formData.isHospitalShift ? 1 : 0,
        conflicts: validationConflicts,
      } as Partial<Schedule>);
      showFeedback('success', '排班创建成功');
      setShowModal(false);
      loadData();
    } catch {
      showFeedback('error', '创建排班失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(id: number, status: Schedule['status']) {
    try {
      await api.schedules.update(id, { status });
      showFeedback('success', `排班状态已更新为${statusMap[status].label}`);
      loadData();
    } catch {
      showFeedback('error', '状态更新失败');
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dayDate = new Date(year, month - 1, d);
      days.push({ date: dayDate.toISOString().split('T')[0], day: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({ date: dayDate.toISOString().split('T')[0], day: i, isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push({ date: dayDate.toISOString().split('T')[0], day: i, isCurrentMonth: false });
    }

    return days;
  };

  const getSchedulesForDate = (dateStr: string) =>
    schedules.filter((s) => s.date === dateStr);

  const monthSchedules = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return schedules
      .filter((s) => s.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [schedules, currentMonth]);

  const calendarDays = getDaysInMonth(currentMonth);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">排班计划管理</h1>
          <p className="mt-1 text-sm text-gray-500">月历视图管理医生跨机构出诊排班</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增排班
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              今天
            </button>
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const daySchedules = getSchedulesForDate(day.date);
            const isToday = day.date === todayStr;

            return (
              <div
                key={index}
                onClick={() => day.isCurrentMonth && openCreateModal(day.date)}
                className={`min-h-[100px] border-b border-r border-gray-100 p-2 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                  {day.day}
                </div>
                <div className="mt-1 space-y-1">
                  {daySchedules.slice(0, 2).map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`rounded px-1 py-0.5 text-xs truncate ${
                        schedule.status === 'cancelled'
                          ? 'bg-red-100 text-red-700 line-through'
                          : schedule.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : schedule.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                      title={`${doctorById.get(schedule.doctorId)?.name || '未知医生'} - ${
                        institutionById.get(schedule.institutionId)?.name || '未知机构'
                      } ${schedule.startTime}-${schedule.endTime}`}
                    >
                      {doctorById.get(schedule.doctorId)?.name || '未知'}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-gray-500">+{daySchedules.length - 2} 更多</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule list */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            排班列表
            <span className="ml-2 text-sm font-normal text-gray-500">
              {monthSchedules.length} 条记录
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">日期</th>
                <th className="px-4 py-3 font-medium text-gray-500">医生</th>
                <th className="px-4 py-3 font-medium text-gray-500">机构</th>
                <th className="px-4 py-3 font-medium text-gray-500">科室</th>
                <th className="px-4 py-3 font-medium text-gray-500">时间段</th>
                <th className="px-4 py-3 font-medium text-gray-500">号源</th>
                <th className="px-4 py-3 font-medium text-gray-500">本院</th>
                <th className="px-4 py-3 font-medium text-gray-500">冲突</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={10}>
                    加载中...
                  </td>
                </tr>
              ) : monthSchedules.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={10}>
                    当月暂无排班数据，点击"新增排班"或日历日期创建
                  </td>
                </tr>
              ) : (
                monthSchedules.map((schedule) => {
                  const hasConflict = schedule.conflicts && schedule.conflicts.length > 0;
                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{schedule.date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{doctorById.get(schedule.doctorId)?.name || `#${schedule.doctorId}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{institutionById.get(schedule.institutionId)?.name || `#${schedule.institutionId}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {departmentById.get(schedule.departmentId)?.name || `#${schedule.departmentId}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {schedule.startTime}-{schedule.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900">{schedule.bookedCount || 0}</span>
                        <span className="text-gray-400">/{schedule.slotCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        {schedule.isHospitalShift ? (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">是</span>
                        ) : (
                          <span className="text-xs text-gray-400">否</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasConflict ? (
                          <div className="space-y-0.5">
                            {schedule.conflicts.map((c, ci) => {
                              const sev = conflictSeverityMap[c.severity];
                              return (
                                <div key={ci} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${sev.class}`}>
                                  <sev.icon className="h-3 w-3" />
                                  {conflictTypeLabels[c.type]}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs">无冲突</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMap[schedule.status].class}`}
                        >
                          {statusMap[schedule.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {schedule.status === 'draft' && (
                            <button
                              onClick={() => handleUpdateStatus(schedule.id, 'confirmed')}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                            >
                              确认
                            </button>
                          )}
                          {schedule.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(schedule.id, 'cancelled')}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              取消
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">新增排班</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {validationConflicts.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">冲突检测结果：</p>
                {validationConflicts.map((conflict, index) => {
                  const severity = conflictSeverityMap[conflict.severity];
                  const Icon = severity.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-2 rounded-lg border ${severity.border} ${severity.class} px-3 py-2`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium">{conflictTypeLabels[conflict.type]}</span>
                        <p className="text-xs mt-0.5 opacity-80">{conflict.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">选择医生</label>
                <select
                  value={formData.doctorId || ''}
                  onChange={(e) => setFormData({ ...formData, doctorId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择医生</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">选择机构</label>
                <select
                  value={formData.institutionId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, institutionId: Number(e.target.value), departmentId: 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择机构</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">选择科室</label>
                <select
                  value={formData.departmentId || ''}
                  onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={!formData.institutionId}
                >
                  <option value="">{formData.institutionId ? '请选择科室' : '请先选择机构'}</option>
                  {selectedInstitutionDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">出诊日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">开始时间</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">结束时间</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">号源数量</label>
                <input
                  type="number"
                  min="1"
                  value={formData.slotCount}
                  onChange={(e) => setFormData({ ...formData, slotCount: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHospitalShift"
                  checked={formData.isHospitalShift}
                  onChange={(e) => setFormData({ ...formData, isHospitalShift: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isHospitalShift" className="text-sm font-medium text-gray-700">
                  是否本院班次
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'confirmed' })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="draft">草稿</option>
                  <option value="confirmed">已确认</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving || validating}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="h-4 w-4" />
                  {saving ? '保存中...' : validating ? '验证中...' : '创建排班'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
