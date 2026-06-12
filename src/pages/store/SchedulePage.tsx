import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Users,
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag, Avatar } from '@/components/common/BadgeTagAvatar';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { cn, formatCurrency } from '@/utils/common';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function SchedulePage() {
  const { schedules, employees, appointments, fetchSchedules, fetchEmployees, fetchAppointments, createSchedule, isLoading } = useAppointmentStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '18:00',
    shiftType: 'full' as const,
  });

  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
    fetchAppointments();
  }, [fetchSchedules, fetchEmployees, fetchAppointments]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const selectedDateSchedules = schedules.filter((s) => s.date === selectedDate);
  const selectedDateAppointments = appointments.filter((a) => a.scheduledDate === selectedDate);

  const timeSlots = [];
  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  const handleCreateSchedule = async () => {
    if (!newSchedule.employeeId) return;
    await createSchedule(newSchedule);
    setShowNewSchedule(false);
    setNewSchedule({
      employeeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'full',
    });
  };

  const getEmployeeSchedules = (employeeId: string) => {
    return selectedDateSchedules.filter((s) => s.employeeId === employeeId);
  };

  const getEmployeeAppointments = (employeeId: string) => {
    return selectedDateAppointments.filter((a) => a.staffId === employeeId);
  };

  const isSlotOccupied = (employeeId: string, time: string) => {
    const apt = getEmployeeAppointments(employeeId).find(
      (a) => a.startTime <= time && a.endTime > time
    );
    const sch = getEmployeeSchedules(employeeId).find(
      (s) => s.startTime <= time && s.endTime > time
    );
    return { appointment: apt, schedule: sch };
  };

  const prevWeek = () => setCurrentDate((d) => addDays(d, -7));
  const nextWeek = () => setCurrentDate((d) => addDays(d, 7));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">排班调度</h1>
          <p className="text-neutral-500 mt-1">管理员工排班与预约安排</p>
        </div>
        <Button onClick={() => setShowNewSchedule(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建排班
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              日期选择
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevWeek} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-neutral-900">
                {format(weekStart, 'MM月dd日', { locale: zhCN })} - {format(weekEnd, 'MM月dd日', { locale: zhCN })}
              </span>
              <button onClick={nextWeek} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                  className={cn(
                    'w-full p-3 rounded-xl text-left transition-all flex items-center justify-between',
                    selectedDate === format(day, 'yyyy-MM-dd')
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-neutral-50'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{format(day, 'EEEE', { locale: zhCN })}</p>
                    <p className="text-xs opacity-75">{format(day, 'MM月dd日', { locale: zhCN })}</p>
                  </div>
                  <Badge variant={selectedDate === format(day, 'yyyy-MM-dd') ? 'primary' : 'neutral'} size="sm">
                    {appointments.filter((a) => a.scheduledDate === format(day, 'yyyy-MM-dd')).length}单
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3" padded={false}>
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">
                {format(new Date(selectedDate), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
              </h3>
              <p className="text-sm text-neutral-500">
                共 {selectedDateSchedules.length} 人排班 · {selectedDateAppointments.length} 单预约
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-200" />
                <span className="text-neutral-600">排班</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-neutral-600">预约</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="flex border-b border-neutral-100">
                <div className="w-32 p-4 flex-shrink-0 border-r border-neutral-100">
                  <span className="text-sm font-medium text-neutral-700">员工/时间</span>
                </div>
                {timeSlots.slice(0, 12).map((time) => (
                  <div key={time} className="flex-1 p-2 text-center border-r border-neutral-100 last:border-0">
                    <span className="text-xs text-neutral-500">{time}</span>
                  </div>
                ))}
              </div>

              {employees.map((emp) => (
                <div key={emp.id} className="flex border-b border-neutral-100 last:border-0">
                  <div className="w-32 p-3 flex-shrink-0 border-r border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                        name={emp.name}
                        size="xs"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{emp.name}</p>
                        <p className="text-xs text-neutral-500">{emp.position}</p>
                      </div>
                    </div>
                  </div>
                  {timeSlots.slice(0, 12).map((time) => {
                    const { appointment, schedule } = isSlotOccupied(emp.id, time);
                    return (
                      <div
                        key={time}
                        className={cn(
                          'flex-1 h-16 border-r border-neutral-100 last:border-0 p-0.5',
                          schedule && !appointment ? 'bg-primary-50' : ''
                        )}
                      >
                        {appointment && time === appointment.startTime && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              'h-full rounded-lg p-2 overflow-hidden cursor-pointer',
                              appointment.status === 'completed' ? 'bg-green-100' :
                              appointment.status === 'in_service' ? 'bg-amber-100' :
                              appointment.status === 'cancelled' ? 'bg-red-50' :
                              'bg-primary-100 hover:bg-primary-200'
                            )}
                          >
                            <p className="text-xs font-medium text-neutral-800 truncate">
                              {appointment.petName}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {appointment.startTime}-{appointment.endTime}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">当日预约详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {selectedDateAppointments.map((apt) => (
              <motion.div
                key={apt.id}
                whileHover={{ y: -2 }}
                className="p-4 bg-neutral-50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={
                    apt.status === 'completed' ? 'success' :
                    apt.status === 'cancelled' ? 'danger' :
                    apt.status === 'in_service' ? 'warning' : 'info'
                  }>
                    {apt.status === 'confirmed' ? '待服务' :
                     apt.status === 'in_service' ? '服务中' :
                     apt.status === 'completed' ? '已完成' :
                     apt.status === 'cancelled' ? '已取消' : apt.status}
                  </Badge>
                  <span className="text-sm text-neutral-500">{apt.orderNo}</span>
                </div>
                <h4 className="font-semibold text-neutral-900">{apt.ownerName} · {apt.petName}</h4>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {apt.serviceId === 'srv_001' ? '精致洗护套餐' :
                   apt.serviceId === 'srv_002' ? '体内外驱虫服务' :
                   apt.serviceId === 'srv_003' ? '疫苗接种服务' : '服务预约'}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200">
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.startTime} - {apt.endTime}
                  </span>
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(apt.totalPrice)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNewSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewSchedule(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-[480px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold mb-6">新建排班</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">选择员工</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setNewSchedule((s) => ({ ...s, employeeId: emp.id }))}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left flex items-center gap-2 transition-all',
                        newSchedule.employeeId === emp.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <Avatar
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                        name={emp.name}
                        size="xs"
                      />
                      <div>
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-neutral-500">{emp.position}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">开始时间</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule((s) => ({ ...s, startTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">结束时间</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule((s) => ({ ...s, endTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewSchedule(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={handleCreateSchedule} isLoading={isLoading}>
                  <Check className="w-4 h-4 mr-2" />
                  确认排班
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
