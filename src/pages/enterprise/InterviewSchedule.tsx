import { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, MessageSquare, Video, Phone, Users, Check, X, ChevronLeft, ChevronRight, Bell, Send } from 'lucide-react';
import { mockInterviews, mockResumes, mockJobs } from '@/mock/data';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Interview, InterviewFormat } from '@/types';

export default function InterviewSchedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [inviteForm, setInviteForm] = useState({
    resumeId: '',
    jobId: '',
    scheduledDate: '',
    scheduledTime: '10:00',
    format: 'onsite' as InterviewFormat,
    reminderMinutes: 60,
    note: '',
  });

  const firstDayMonth = startOfMonth(currentMonth);
  const lastDayMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayMonth, end: lastDayMonth });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const filteredInterviews = mockInterviews.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesDate =
      !selectedDate ||
      format(new Date(i.scheduledTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    return matchesStatus && matchesDate;
  });

  const hasInterviewOnDay = (day: Date) => {
    return mockInterviews.some((i) =>
      isSameDay(new Date(i.scheduledTime), day)
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-sand-100 text-sand-700',
      confirmed: 'bg-spruce-100 text-spruce-700',
      rejected: 'bg-terracotta-100 text-terracotta-700',
      expired: 'bg-ash-100 text-ash-600',
      completed: 'bg-spruce-100 text-spruce-700',
    };
    return badges[status] || 'bg-ash-100 text-ash-600';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      rejected: '已拒绝',
      expired: '已过期',
      completed: '已完成',
    };
    return labels[status] || status;
  };

  const getFormatIcon = (fmt: string) => {
    const icons: Record<string, typeof Phone> = {
      onsite: MapPin,
      video: Video,
      phone: Phone,
    };
    return icons[fmt] || Phone;
  };

  const getFormatLabel = (fmt: string) => {
    const labels: Record<string, string> = {
      onsite: '现场面试',
      video: '视频面试',
      phone: '电话面试',
    };
    return labels[fmt] || fmt;
  };

  const handleSendInvite = () => {
    if (!inviteForm.resumeId || !inviteForm.jobId || !inviteForm.scheduledDate || !inviteForm.scheduledTime) {
      alert('请填写完整的邀约信息');
      return;
    }
    alert('面试邀约已发送，短信提醒将自动发送！');
    setShowInviteModal(false);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)] animate-fade-in">
      <div className="w-96 card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-ash-700">
            {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1.5 hover:bg-ash-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-ash-500" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1.5 hover:bg-ash-100 rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-ash-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-ash-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 flex-1 content-start">
          {Array.from({ length: firstDayMonth.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {daysInMonth.map((day) => {
            const hasInterview = hasInterviewOnDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const past = isBefore(day, startOfDay(new Date()));
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-lg text-sm relative transition-all ${
                  isSelected
                    ? 'bg-terracotta-500 text-white font-medium'
                    : today
                      ? 'bg-terracotta-50 text-terracotta-600 font-medium'
                      : past
                        ? 'text-ash-300'
                        : 'hover:bg-ash-50 text-ash-700'
                }`}
              >
                {format(day, 'd')}
                {hasInterview && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-terracotta-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          新建面试邀约
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待确认' },
              { value: 'confirmed', label: '已确认' },
              { value: 'completed', label: '已完成' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-white border border-ash-200 text-ash-600 hover:bg-ash-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-terracotta-600 hover:text-terracotta-700"
            >
              清除日期筛选
            </button>
          )}
        </div>

        <div className="flex-1 card overflow-y-auto">
          {filteredInterviews.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-ash-400 p-12">
              <Calendar size={48} className="mb-4 opacity-40" />
              <p>{selectedDate ? format(selectedDate, 'M月d日') + ' 暂无面试安排' : '暂无面试安排'}</p>
            </div>
          ) : (
            <div className="divide-y divide-ash-100">
              {filteredInterviews.map((interview) => {
                const FormatIcon = getFormatIcon(interview.format);
                return (
                  <div
                    key={interview.id}
                    onClick={() => setSelectedInterview(interview)}
                    className={`p-5 hover:bg-ash-50/50 cursor-pointer transition-colors ${
                      selectedInterview?.id === interview.id ? 'bg-terracotta-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-16">
                        <p className="text-xs text-ash-400">
                          {format(new Date(interview.scheduledTime), 'MMM', { locale: zhCN })}
                        </p>
                        <p className="text-2xl font-bold text-ash-700 font-serif">
                          {format(new Date(interview.scheduledTime), 'd')}
                        </p>
                        <p className="text-xs text-ash-500">
                          {format(new Date(interview.scheduledTime), 'HH:mm')}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-ash-700">{interview.resumeName}</p>
                          <span className={`badge ${getStatusBadge(interview.status)}`}>
                            {getStatusLabel(interview.status)}
                          </span>
                          <span className="badge bg-ash-100 text-ash-600 flex items-center gap-1">
                            <FormatIcon size={12} />
                            {getFormatLabel(interview.format)}
                          </span>
                        </div>
                        <p className="text-sm text-ash-500 mb-2">
                          面试岗位：{interview.jobTitle} · {interview.currentRound === 'first' ? '初试' : interview.currentRound === 'second' ? '复试' : '终面'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-ash-400">
                          {interview.smsReminderSent && (
                            <span className="flex items-center gap-1">
                              <Bell size={12} className="text-spruce-500" />
                              短信提醒已发送
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {interview.rounds.length}/3 轮面试
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {interview.status !== 'completed' && (
                          <button className="btn-secondary text-sm px-3 py-1.5">
                            填写反馈
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-bold text-ash-700 mb-6">一键邀约面试</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">候选人</label>
                <select
                  value={inviteForm.resumeId}
                  onChange={(e) => setInviteForm({ ...inviteForm, resumeId: e.target.value })}
                  className="input-field"
                >
                  <option value="">请选择候选人</option>
                  {mockResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - 匹配度{r.matchScore}分
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">面试岗位</label>
                <select
                  value={inviteForm.jobId}
                  onChange={(e) => setInviteForm({ ...inviteForm, jobId: e.target.value })}
                  className="input-field"
                >
                  <option value="">请选择岗位</option>
                  {mockJobs.filter((j) => j.status === 'active').map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ash-600 mb-1.5">面试日期</label>
                  <input
                    type="date"
                    value={inviteForm.scheduledDate}
                    onChange={(e) => setInviteForm({ ...inviteForm, scheduledDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ash-600 mb-1.5">面试时间</label>
                  <select
                    value={inviteForm.scheduledTime}
                    onChange={(e) => setInviteForm({ ...inviteForm, scheduledTime: e.target.value })}
                    className="input-field"
                  >
                    {['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-2">面试形式</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'onsite' as InterviewFormat, icon: MapPin, label: '现场面试' },
                    { value: 'video' as InterviewFormat, icon: Video, label: '视频面试' },
                    { value: 'phone' as InterviewFormat, icon: Phone, label: '电话面试' },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    const active = inviteForm.format === fmt.value;
                    return (
                      <button
                        key={fmt.value}
                        onClick={() => setInviteForm({ ...inviteForm, format: fmt.value })}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          active ? 'border-terracotta-500 bg-terracotta-50' : 'border-ash-100 hover:border-ash-200'
                        }`}
                      >
                        <Icon size={20} className={active ? 'text-terracotta-500 mx-auto' : 'text-ash-400 mx-auto'} />
                        <p className={`text-sm mt-1.5 ${active ? 'text-terracotta-600 font-medium' : 'text-ash-600'}`}>
                          {fmt.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">短信提醒时间</label>
                <select
                  value={inviteForm.reminderMinutes}
                  onChange={(e) => setInviteForm({ ...inviteForm, reminderMinutes: Number(e.target.value) })}
                  className="input-field"
                >
                  <option value={15}>面试前 15 分钟</option>
                  <option value={30}>面试前 30 分钟</option>
                  <option value={60}>面试前 1 小时</option>
                  <option value={120}>面试前 2 小时</option>
                  <option value={1440}>面试前 1 天</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">备注信息</label>
                <textarea
                  value={inviteForm.note}
                  onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
                  placeholder="请输入面试地址、会议链接或其他注意事项..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="p-4 bg-spruce-50 rounded-xl flex items-start gap-3">
                <Send size={18} className="text-spruce-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-spruce-700">邀约内容预览</p>
                  <p className="text-spruce-600 mt-1">
                    【云聘·云南】您好，您已通过「高级前端开发工程师」初筛，请于 {inviteForm.scheduledDate || '____'} {inviteForm.scheduledTime} 参加{getFormatLabel(inviteForm.format)}。{inviteForm.note || '请携带相关证件准时参加。'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSendInvite}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                发送邀约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
