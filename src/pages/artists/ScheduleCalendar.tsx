import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import ScheduleDay from '@/components/artists/ScheduleDay';
import { mockSchedules, mockCurrentArtistProfile } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Schedule, ScheduleStatus } from '@shared/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const statusOptions: { value: ScheduleStatus; label: string; color: string }[] = [
  { value: 'available', label: '可接通告', color: 'bg-emerald-500' },
  { value: 'booked', label: '已预订', color: 'bg-red-500' },
  { value: 'pending', label: '待确认', color: 'bg-amber-500' },
  { value: 'unavailable', label: '不可用', color: 'bg-midnight-500' },
];

const ScheduleCalendar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>(
    mockSchedules.filter((s) => s.artistProfileId === (id || mockCurrentArtistProfile.id))
  );
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    status: 'available' as ScheduleStatus,
    description: '',
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDay = monthStart.getDay();
    const days: { date: Date; isOutsideMonth: boolean }[] = [];

    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() - i - 1);
      days.push({ date: d, isOutsideMonth: true });
    }

    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    monthDays.forEach((d) => days.push({ date: d, isOutsideMonth: false }));

    while (days.length % 7 !== 0) {
      const lastDate = days[days.length - 1].date;
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      days.push({ date: d, isOutsideMonth: true });
    }

    return days;
  }, [currentMonth]);

  const getScheduleForDate = (date: Date) => {
    return schedules.find((s) => isSameDay(new Date(s.date), date));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const existing = getScheduleForDate(date);
    if (existing) {
      setEditingSchedule(existing);
      setFormData({
        status: existing.status,
        description: existing.description || '',
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        status: 'available',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!selectedDate) return;

    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editingSchedule.id
            ? { ...s, status: formData.status, description: formData.description }
            : s
        )
      );
    } else {
      const newSchedule: Schedule = {
        id: `schedule-${Date.now()}`,
        artistProfileId: id || mockCurrentArtistProfile.id,
        date: selectedDate,
        status: formData.status,
        description: formData.description,
      };
      setSchedules((prev) => [...prev, newSchedule]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteSchedule = () => {
    if (editingSchedule) {
      setSchedules((prev) => prev.filter((s) => s.id !== editingSchedule.id));
      setIsModalOpen(false);
    }
  };

  const handleExportSchedule = () => {
    const csvContent = [
      ['日期', '状态', '描述'].join(','),
      ...schedules
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((s) => [
          format(new Date(s.date), 'yyyy-MM-dd'),
          s.status,
          (s.description || '').replace(/,/g, '，'),
        ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upcomingSchedules = useMemo(() => {
    const today = new Date();
    return schedules
      .filter((s) => new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [schedules]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 animate-fade-in-down">
          <button
            onClick={() => navigate(`/artists/${id || mockCurrentArtistProfile.id}`)}
            className="inline-flex items-center gap-2 text-midnight-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回个人资料
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">日程管理</h1>
              <p className="text-midnight-300">管理你的工作安排和可用档期</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setSelectedDate(new Date());
                  setEditingSchedule(null);
                  setFormData({ status: 'available', description: '' });
                  setIsModalOpen(true);
                }}
              >
                添加日程
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportSchedule}
              >
                导出日程
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card variant="glass" className="animate-fade-in-up">
              <CardHeader className="border-b border-midnight-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="w-10 h-10 rounded-xl bg-midnight-700/50 flex items-center justify-center text-midnight-300 hover:bg-midnight-700 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-white min-w-[160px] text-center">
                      {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
                    </h2>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="w-10 h-10 rounded-xl bg-midnight-700/50 flex items-center justify-center text-midnight-300 hover:bg-midnight-700 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    今天
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-midnight-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, index) => {
                    const schedule = getScheduleForDate(item.date);
                    const isSelected = selectedDate && isSameDay(item.date, selectedDate);
                    return (
                      <ScheduleDay
                        key={index}
                        date={item.date}
                        status={schedule?.status}
                        isSelected={isSelected}
                        isToday={isToday(item.date)}
                        isOutsideMonth={item.isOutsideMonth}
                        onClick={() => !item.isOutsideMonth && handleDayClick(item.date)}
                      />
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-midnight-700/50">
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">图例说明</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="flex items-center gap-2">
                        <span className={cn('w-3 h-3 rounded-full', status.color)} />
                        <span className="text-sm text-midnight-300">{status.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="text-base">即将到来的日程</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {upcomingSchedules.length === 0 ? (
                    <p className="text-center text-midnight-400 text-sm py-8">暂无即将到来的日程</p>
                  ) : (
                    upcomingSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all cursor-pointer hover:border-rose-500/30',
                          schedule.status === 'booked' && 'bg-red-500/5 border-red-500/20',
                          schedule.status === 'available' && 'bg-emerald-500/5 border-emerald-500/20',
                          schedule.status === 'pending' && 'bg-amber-500/5 border-amber-500/20',
                          schedule.status === 'unavailable' && 'bg-midnight-700/30 border-midnight-600'
                        )}
                        onClick={() => {
                          setSelectedDate(new Date(schedule.date));
                          setEditingSchedule(schedule);
                          setFormData({
                            status: schedule.status,
                            description: schedule.description || '',
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-12 h-12 rounded-xl flex flex-col items-center justify-center',
                                schedule.status === 'booked' && 'bg-gradient-to-br from-red-500 to-red-400',
                                schedule.status === 'available' && 'bg-gradient-to-br from-emerald-500 to-emerald-400',
                                schedule.status === 'pending' && 'bg-gradient-to-br from-amber-500 to-amber-400',
                                schedule.status === 'unavailable' && 'bg-gradient-to-br from-midnight-600 to-midnight-500'
                              )}
                            >
                              <span className="text-[10px] text-white/80">
                                {format(new Date(schedule.date), 'MM月', { locale: zhCN })}
                              </span>
                              <span className="text-sm font-bold text-white">
                                {format(new Date(schedule.date), 'dd')}
                              </span>
                            </div>
                            <div>
                              <Badge
                                variant={
                                  schedule.status === 'booked'
                                    ? 'danger'
                                    : schedule.status === 'available'
                                    ? 'success'
                                    : schedule.status === 'pending'
                                    ? 'warning'
                                    : 'default'
                                }
                                size="sm"
                                dot
                              >
                                {schedule.status === 'booked'
                                  ? '已预订'
                                  : schedule.status === 'available'
                                  ? '可接通告'
                                  : schedule.status === 'pending'
                                  ? '待确认'
                                  : '不可用'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(new Date(schedule.date));
                                setEditingSchedule(schedule);
                                setFormData({
                                  status: schedule.status,
                                  description: schedule.description || '',
                                });
                                setIsModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-lg text-midnight-400 hover:bg-midnight-700/50 hover:text-white flex items-center justify-center transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
                              }}
                              className="w-8 h-8 rounded-lg text-midnight-400 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {schedule.description && (
                          <p className="text-sm text-white font-medium mt-2">
                            {schedule.description}
                          </p>
                        )}
                        {isToday(new Date(schedule.date)) && (
                          <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            今天
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="text-base">本月统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {statusOptions.map((status) => {
                    const count = schedules.filter((s) => {
                      const scheduleDate = new Date(s.date);
                      return (
                        s.status === status.value &&
                        isSameMonth(scheduleDate, currentMonth)
                      );
                    }).length;
                    return (
                      <div key={status.value} className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('w-2.5 h-2.5 rounded-full', status.color)} />
                          <span className="text-xs text-midnight-400">{status.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{count}</p>
                        <p className="text-xs text-midnight-400">天</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingSchedule ? '编辑日程' : '添加日程'}
              </ModalTitle>
              <ModalDescription>
                {selectedDate && format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-5 py-2">
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-3">日程状态</label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData((prev) => ({ ...prev, status: option.value }))}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300',
                        formData.status === option.value
                          ? 'border-transparent bg-midnight-700/50'
                          : 'border-midnight-700 hover:border-midnight-600 bg-midnight-800/30'
                      )}
                    >
                      <span className={cn('w-3 h-3 rounded-full flex-shrink-0', option.color)} />
                      <span className={cn(
                        'text-sm font-medium',
                        formData.status === option.value ? 'text-white' : 'text-midnight-300'
                      )}>
                        {option.label}
                      </span>
                      {formData.status === option.value && (
                        <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">描述（选填）</label>
                <Input
                  placeholder="例如：珠宝品牌平面拍摄"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  leftIcon={<CalendarIcon className="w-4 h-4" />}
                />
              </div>
            </div>

            <ModalFooter className="gap-2">
              {editingSchedule && (
                <Button
                  variant="danger"
                  onClick={handleDeleteSchedule}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  className="mr-auto"
                >
                  删除
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleSaveSchedule}>
                {editingSchedule ? '保存修改' : '添加日程'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
