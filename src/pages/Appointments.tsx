import { useEffect, useMemo, useState } from 'react';
import {
  Search, Filter, CalendarDays, Phone, Clock, X, Check,
  Bell, RefreshCw, AlertTriangle, MessageSquare, Plus, Ban,
  CalendarClock, ListChecks, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Appointment, Schedule, Doctor, Institution } from '@/types';

const statusMap = {
  scheduled: { label: '已预约', class: 'border-blue-200 bg-blue-50 text-blue-700' },
  completed: { label: '已到诊', class: 'border-green-200 bg-green-50 text-green-700' },
  cancelled: { label: '已取消', class: 'border-red-200 bg-red-50 text-red-700' },
  no_show: { label: '爽约', class: 'border-orange-200 bg-orange-50 text-orange-700' },
};

interface SlotInfo {
  time: string;
  status: 'available' | 'booked';
  appointmentId?: number;
  patientName?: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    scheduleId: 0,
    patientName: '',
    patientPhone: '',
    slotTime: '',
  });
  const [createSlots, setCreateSlots] = useState<SlotInfo[]>([]);
  const [createSlotsLoading, setCreateSlotsLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ scheduleId: 0, slotTime: '', reason: '' });
  const [rescheduleSlots, setRescheduleSlots] = useState<SlotInfo[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const doctorById = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);
  const institutionById = useMemo(() => new Map(institutions.map((i) => [i.id, i])), [institutions]);
  const scheduleById = useMemo(() => new Map(schedules.map((s) => [s.id, s])), [schedules]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [appointmentsData, schedulesData, doctorsData, institutionsData] = await Promise.all([
        api.appointments.list(),
        api.schedules.list(),
        api.doctors.list(),
        api.institutions.list(),
      ]);
      setAppointments(appointmentsData);
      setSchedules(schedulesData);
      setDoctors(doctorsData);
      setInstitutions(institutionsData);
    } catch (error) {
      showToast('error', '加载数据失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedScheduleId) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    api.appointments.slots(selectedScheduleId)
      .then((data) => setSlots(data))
      .catch(() => {
        setSlots([]);
        showToast('error', '加载号源失败');
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedScheduleId]);

  useEffect(() => {
    if (!createForm.scheduleId) {
      setCreateSlots([]);
      return;
    }
    setCreateSlotsLoading(true);
    api.appointments.slots(createForm.scheduleId)
      .then((data) => {
        setCreateSlots(data);
        setCreateForm((prev) => ({ ...prev, slotTime: '' }));
      })
      .catch(() => {
        setCreateSlots([]);
        showToast('error', '加载号源失败');
      })
      .finally(() => setCreateSlotsLoading(false));
  }, [createForm.scheduleId]);

  useEffect(() => {
    if (!rescheduleForm.scheduleId) {
      setRescheduleSlots([]);
      return;
    }
    setRescheduleSlotsLoading(true);
    api.appointments.slots(rescheduleForm.scheduleId)
      .then((data) => {
        setRescheduleSlots(data);
        setRescheduleForm((prev) => ({ ...prev, slotTime: '' }));
      })
      .catch(() => {
        setRescheduleSlots([]);
        showToast('error', '加载号源失败');
      })
      .finally(() => setRescheduleSlotsLoading(false));
  }, [rescheduleForm.scheduleId]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.patientName.includes(searchTerm) ||
        appointment.patientPhone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesSchedule = !selectedScheduleId || appointment.scheduleId === selectedScheduleId;
      return matchesSearch && matchesStatus && matchesSchedule;
    });
  }, [appointments, searchTerm, statusFilter, selectedScheduleId]);

  const selectedSchedule = selectedScheduleId ? scheduleById.get(selectedScheduleId) : null;

  const slotStats = useMemo(() => {
    if (!selectedSchedule) return null;
    const total = selectedSchedule.slotCount;
    const booked = slots.filter((s) => s.status === 'booked').length;
    const available = Math.max(0, total - booked);
    return { total, booked, available };
  }, [selectedSchedule, slots]);

  async function handleCreateAppointment() {
    if (!createForm.scheduleId || !createForm.patientName || !createForm.patientPhone || !createForm.slotTime) {
      showToast('error', '请填写完整的预约信息');
      return;
    }
    try {
      await api.appointments.create({
        scheduleId: createForm.scheduleId,
        patientName: createForm.patientName,
        patientPhone: createForm.patientPhone,
        slotTime: createForm.slotTime,
      });
      showToast('success', '预约创建成功');
      setShowCreateModal(false);
      setCreateForm({ scheduleId: 0, patientName: '', patientPhone: '', slotTime: '' });
      loadData();
      if (selectedScheduleId) {
        const data = await api.appointments.slots(selectedScheduleId);
        setSlots(data);
      }
    } catch {
      showToast('error', '预约创建失败');
    }
  }

  async function handleUpdateStatus(id: number, status: Appointment['status']) {
    try {
      await api.appointments.update(id, { status });
      showToast('success', `状态已更新为${statusMap[status].label}`);
      loadData();
    } catch {
      showToast('error', '状态更新失败');
    }
  }

  async function handleCancelAppointment(id: number) {
    if (!confirm('确定要取消该预约吗？患者将收到通知。')) return;
    try {
      await api.appointments.update(id, { status: 'cancelled' });
      showToast('success', '预约已取消');
      loadData();
    } catch {
      showToast('error', '取消预约失败');
    }
  }

  async function handleSuspendSchedule(appointment: Appointment) {
    if (!confirm('确定要停诊吗？该排班下所有预约将被取消。')) return;
    try {
      const scheduleAppts = appointments.filter(
        (a) => a.scheduleId === appointment.scheduleId && a.status === 'scheduled',
      );
      await Promise.all([
        api.schedules.update(appointment.scheduleId, { status: 'cancelled' }),
        ...scheduleAppts.map((a) => api.appointments.update(a.id, { status: 'cancelled' })),
      ]);
      showToast('success', '已停诊，相关预约已取消');
      loadData();
      if (selectedScheduleId === appointment.scheduleId) {
        const data = await api.appointments.slots(appointment.scheduleId);
        setSlots(data);
      }
    } catch {
      showToast('error', '停诊操作失败');
    }
  }

  function handleReschedule(appointment: Appointment) {
    setSelectedAppointment(appointment);
    setRescheduleForm({ scheduleId: 0, slotTime: '', reason: '' });
    setShowRescheduleModal(true);
  }

  async function handleConfirmReschedule() {
    if (!selectedAppointment || !rescheduleForm.scheduleId || !rescheduleForm.slotTime) {
      showToast('error', '请选择新的排班和时段');
      return;
    }
    try {
      await api.appointments.create({
        scheduleId: rescheduleForm.scheduleId,
        patientName: selectedAppointment.patientName,
        patientPhone: selectedAppointment.patientPhone,
        slotTime: rescheduleForm.slotTime,
        rescheduledFrom: selectedAppointment.id,
      });
      await api.appointments.update(selectedAppointment.id, { status: 'cancelled' });
      showToast('success', '改期成功，原预约已取消');
      setShowRescheduleModal(false);
      loadData();
    } catch {
      showToast('error', '改期操作失败');
    }
  }

  function handleViewDetail(appointment: Appointment) {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  }

  function getScheduleInfo(scheduleId: number) {
    const schedule = scheduleById.get(scheduleId);
    if (!schedule) return null;
    const doctor = doctorById.get(schedule.doctorId);
    const institution = institutionById.get(schedule.institutionId);
    return { schedule, doctor, institution };
  }

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const noShow = appointments.filter((a) => a.status === 'no_show').length;
    return { total, scheduled, completed, cancelled, noShow };
  }, [appointments]);

  const scheduleLabel = (s: Schedule) => {
    const doctor = doctorById.get(s.doctorId);
    return `${s.date} ${s.startTime}-${s.endTime} - ${doctor?.name || '未知医生'}`;
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">号源预约管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理患者预约记录、状态与通知</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增预约
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">总预约数</p>
          <strong className="mt-1 block text-2xl font-semibold text-gray-900">{stats.total}</strong>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">已预约</p>
          <strong className="mt-1 block text-2xl font-semibold text-blue-600">{stats.scheduled}</strong>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">已到诊</p>
          <strong className="mt-1 block text-2xl font-semibold text-green-600">{stats.completed}</strong>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">已取消</p>
          <strong className="mt-1 block text-2xl font-semibold text-red-600">{stats.cancelled}</strong>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">爽约</p>
          <strong className="mt-1 block text-2xl font-semibold text-orange-600">{stats.noShow}</strong>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-400" />
          <select
            value={selectedScheduleId ?? ''}
            onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">全部排班</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {scheduleLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索患者姓名、电话..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">全部状态</option>
            <option value="scheduled">已预约</option>
            <option value="completed">已到诊</option>
            <option value="cancelled">已取消</option>
            <option value="no_show">爽约</option>
          </select>
        </div>
      </div>

      {selectedSchedule && slotStats && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <div className="mb-3 flex items-center gap-2 font-medium text-gray-900">
            <ListChecks className="h-4 w-4 text-blue-600" />
            排班号源信息 — {scheduleLabel(selectedSchedule)}
          </div>
          <div className="mb-3 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">总号源</p>
              <strong className="text-xl font-semibold text-gray-900">{slotStats.total}</strong>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">已预约</p>
              <strong className="text-xl font-semibold text-blue-600">{slotStats.booked}</strong>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">剩余号源</p>
              <strong className="text-xl font-semibold text-green-600">{slotStats.available}</strong>
            </div>
          </div>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-4 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              加载号源时段...
            </div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {slots.map((slot) => (
                <div
                  key={slot.time}
                  className={`rounded-lg border px-3 py-2 text-center text-xs ${
                    slot.status === 'available'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  <div className="font-medium">{slot.time}</div>
                  <div>{slot.status === 'available' ? '可预约' : slot.patientName || '已预约'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂无号源时段数据</p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">患者信息</th>
                <th className="px-4 py-3 font-medium text-gray-500">联系电话</th>
                <th className="px-4 py-3 font-medium text-gray-500">就诊日期</th>
                <th className="px-4 py-3 font-medium text-gray-500">时段</th>
                <th className="px-4 py-3 font-medium text-gray-500">医生/机构</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    加载中...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    暂无预约数据
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => {
                  const info = getScheduleInfo(appointment.scheduleId);
                  return (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            {appointment.patientName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{appointment.patientName}</div>
                            {appointment.rescheduledFrom && (
                              <div className="text-xs text-amber-600">改期自 #{appointment.rescheduledFrom}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-gray-600">{appointment.patientPhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{info?.schedule?.date || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{appointment.slotTime}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{info?.doctor?.name || '-'}</div>
                          <div className="text-xs text-gray-500">{info?.institution?.name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMap[appointment.status].class}`}>
                          {statusMap[appointment.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetail(appointment)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                            title="查看详情/通知记录"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          {appointment.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                                title="到诊确认"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReschedule(appointment)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                                title="改期"
                              >
                                <CalendarClock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                title="取消预约"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appointment.id, 'no_show')}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-orange-600"
                                title="标记爽约"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSuspendSchedule(appointment)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-700"
                                title="停诊"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </button>
                            </>
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

      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">预约详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">患者姓名</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-mono font-medium text-gray-900">{selectedAppointment.patientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">预约时段</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.slotTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMap[selectedAppointment.status].class}`}>
                    {statusMap[selectedAppointment.status].label}
                  </span>
                </div>
              </div>
              {selectedAppointment.rescheduledFrom && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  该预约由 #{selectedAppointment.rescheduledFrom} 改期而来
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                  <Bell className="h-4 w-4" />
                  患者通知记录
                </h3>
                {selectedAppointment.notificationLog ? (
                  <div className="space-y-2">
                    {selectedAppointment.notificationLog.split('|').filter(Boolean).map((log, index) => (
                      <div key={index} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无通知记录</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">新增预约</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">选择排班</label>
                <select
                  value={createForm.scheduleId || ''}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, scheduleId: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">请选择排班</option>
                  {schedules
                    .filter((s) => s.status === 'confirmed')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {scheduleLabel(s)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">患者姓名</label>
                <input
                  type="text"
                  value={createForm.patientName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, patientName: e.target.value }))}
                  placeholder="请输入患者姓名"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">患者电话</label>
                <input
                  type="tel"
                  value={createForm.patientPhone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, patientPhone: e.target.value }))}
                  placeholder="请输入患者电话"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">预约时段</label>
                {createSlotsLoading ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载时段...
                  </div>
                ) : createForm.scheduleId ? (
                  createSlots.filter((s) => s.status === 'available').length > 0 ? (
                    <select
                      value={createForm.slotTime}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, slotTime: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">请选择时段</option>
                      {createSlots
                        .filter((s) => s.status === 'available')
                        .map((slot) => (
                          <option key={slot.time} value={slot.time}>
                            {slot.time}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-red-500">该排班暂无可预约时段</p>
                  )
                ) : (
                  <p className="mt-1 text-sm text-gray-400">请先选择排班</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateAppointment}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">改期</h2>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700">改期后将创建新预约，原预约将自动取消，患者将收到通知。</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">当前患者</p>
                <p className="font-medium text-gray-900">{selectedAppointment.patientName} ({selectedAppointment.patientPhone})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">选择新的排班</label>
                <select
                  value={rescheduleForm.scheduleId || ''}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, scheduleId: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">请选择可用排班</option>
                  {schedules
                    .filter((s) => s.status === 'confirmed' && s.id !== selectedAppointment.scheduleId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {scheduleLabel(s)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">选择新时段</label>
                {rescheduleSlotsLoading ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载时段...
                  </div>
                ) : rescheduleForm.scheduleId ? (
                  rescheduleSlots.filter((s) => s.status === 'available').length > 0 ? (
                    <select
                      value={rescheduleForm.slotTime}
                      onChange={(e) => setRescheduleForm((prev) => ({ ...prev, slotTime: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">请选择时段</option>
                      {rescheduleSlots
                        .filter((s) => s.status === 'available')
                        .map((slot) => (
                          <option key={slot.time} value={slot.time}>
                            {slot.time}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-red-500">该排班暂无可预约时段</p>
                  )
                ) : (
                  <p className="mt-1 text-sm text-gray-400">请先选择排班</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                确认改期
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
