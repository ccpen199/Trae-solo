import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
  WalletCards,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Doctor, Institution, Schedule, Appointment, DashboardStats } from '@/types';

const doctorStatus = {
  active: '执业中',
  pending: '待审核',
  suspended: '已暂停',
};

const scheduleStatus = {
  draft: '草稿',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
};

const appointmentStatus = {
  scheduled: '已预约',
  completed: '已到诊',
  cancelled: '已取消',
  no_show: '爽约',
};

function statusClass(status: string) {
  if (['active', 'confirmed', 'completed', 'scheduled'].includes(status)) {
    return 'border-green-200 bg-green-50 text-green-700';
  }
  if (['pending', 'draft'].includes(status)) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-red-200 bg-red-50 text-red-700';
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    doctorCount: 0,
    institutionCount: 0,
    scheduleCount: 0,
    appointmentCount: 0,
    pendingSettlementAmount: 0,
    monthlyVisits: 0,
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const doctorById = useMemo(() => new Map(doctors.map((doctor) => [doctor.id, doctor])), [doctors]);
  const institutionById = useMemo(
    () => new Map(institutions.map((institution) => [institution.id, institution])),
    [institutions],
  );
  const departmentById = useMemo(() => {
    const map = new Map<number, Institution['departments'][0]>();
    institutions.forEach((institution) => {
      institution.departments.forEach((department) => map.set(department.id, department));
    });
    return map;
  }, [institutions]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [nextStats, nextDoctors, nextInstitutions, nextSchedules, nextAppointments] = await Promise.all([
        api.dashboard.stats(),
        api.doctors.list(),
        api.institutions.list(),
        api.schedules.list(),
        api.appointments.list(),
      ]);
      setStats(nextStats);
      setDoctors(nextDoctors);
      setInstitutions(nextInstitutions);
      setSchedules(nextSchedules);
      setAppointments(nextAppointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const cards = [
    { label: '医生档案', value: stats.doctorCount, icon: Stethoscope, tone: 'text-sky-700 bg-sky-50' },
    { label: '合作机构', value: stats.institutionCount, icon: Building2, tone: 'text-emerald-700 bg-emerald-50' },
    { label: '排班计划', value: stats.scheduleCount, icon: CalendarDays, tone: 'text-violet-700 bg-violet-50' },
    { label: '预约记录', value: stats.appointmentCount, icon: ClipboardList, tone: 'text-amber-700 bg-amber-50' },
  ];

  const conflictCount = schedules.reduce((sum, schedule) => sum + (schedule.conflicts?.length || 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">运营仪表盘</h1>
          <p className="mt-1 text-sm text-gray-500">医生跨机构出诊管理总览</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            <ShieldCheck className="h-4 w-4" />
            后端在线
          </span>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <span className={`rounded-lg p-2 ${card.tone}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
            <strong className="mt-4 block text-3xl font-semibold text-gray-900">{card.value}</strong>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">本月到诊</p>
              <strong className="text-2xl text-gray-900">{stats.monthlyVisits}</strong>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <WalletCards className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">待结算金额</p>
              <strong className="text-2xl text-gray-900">¥{stats.pendingSettlementAmount.toLocaleString()}</strong>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-orange-50 p-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">排班冲突</p>
              <strong className="text-2xl text-gray-900">{conflictCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">近期排班</h2>
              <p className="text-sm text-gray-500">医生、机构、科室与号源状态</p>
            </div>
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">日期</th>
                  <th className="px-5 py-3 font-medium">医生</th>
                  <th className="px-5 py-3 font-medium">机构</th>
                  <th className="px-5 py-3 font-medium">科室</th>
                  <th className="px-5 py-3 font-medium">号源</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={6}>
                      暂无排班计划
                    </td>
                  </tr>
                ) : (
                  schedules.slice(0, 8).map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-900">
                        {schedule.date}
                        <span className="block text-xs text-gray-500">
                          {schedule.startTime}-{schedule.endTime}
                        </span>
                      </td>
                      <td className="px-5 py-3">{doctorById.get(schedule.doctorId)?.name || `#${schedule.doctorId}`}</td>
                      <td className="px-5 py-3">
                        {institutionById.get(schedule.institutionId)?.name || `#${schedule.institutionId}`}
                      </td>
                      <td className="px-5 py-3">{departmentById.get(schedule.departmentId)?.name || `#${schedule.departmentId}`}</td>
                      <td className="px-5 py-3">{schedule.slotCount}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusClass(schedule.status)}`}>
                          {scheduleStatus[schedule.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">医生合规</h2>
              <p className="text-sm text-gray-500">执业范围、资质状态与出诊价格</p>
            </div>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="divide-y divide-gray-100">
            {doctors.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">暂无医生档案</div>
            ) : (
              doctors.slice(0, 6).map((doctor) => (
                <div key={doctor.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div>
                    <strong className="text-gray-900">{doctor.name}</strong>
                    <p className="mt-1 text-sm text-gray-500">
                      {doctor.title} · {doctor.specialty}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{doctor.practiceScope}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusClass(doctor.status)}`}>
                      {doctorStatus[doctor.status]}
                    </span>
                    <p className="mt-2 text-sm font-medium text-gray-900">¥{doctor.visitPrice}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">合作机构</h2>
            <p className="text-sm text-gray-500">机构科室、资质要求与联系方式</p>
          </div>
          <div className="divide-y divide-gray-100">
            {institutions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">暂无合作机构</div>
            ) : (
              institutions.slice(0, 5).map((institution) => (
                <div key={institution.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <strong className="text-gray-900">{institution.name}</strong>
                      <p className="mt-1 text-sm text-gray-500">{institution.address || '地址待维护'}</p>
                    </div>
                    <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusClass(institution.status)}`}>
                      {institution.status === 'active' ? '启用' : '停用'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {institution.departments.length === 0 ? (
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500">未配置科室</span>
                    ) : (
                      institution.departments.map((department) => (
                        <span key={department.id} className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {department.name} · {department.roomCount} 间
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">预约队列</h2>
            <p className="text-sm text-gray-500">患者预约、时段与履约状态</p>
          </div>
          <div className="divide-y divide-gray-100">
            {appointments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">暂无预约记录</div>
            ) : (
              appointments.slice(0, 7).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <strong className="text-gray-900">{appointment.patientName}</strong>
                    <p className="mt-1 text-sm text-gray-500">
                      {appointment.patientPhone} · {appointment.slotTime}
                    </p>
                  </div>
                  <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusClass(appointment.status)}`}>
                    {appointmentStatus[appointment.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
