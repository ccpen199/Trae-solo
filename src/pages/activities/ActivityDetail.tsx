import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Clock, Building2, BookOpen, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockActivities } from '@/mock/activities';
import { ActivityStatus } from '@/constants/enums';
import { useAuthStore } from '@/store/useAuthStore';
import dayjs from 'dayjs';

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const activity = mockActivities.find((a) => a.id === id);

  if (!activity) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400">活动未找到</p>
        <Link to="/activities" className="text-primary-600 hover:underline mt-2 inline-block">返回活动列表</Link>
      </div>
    );
  }

  const deadline = dayjs(activity.registrationDeadline);
  const now = dayjs();
  const diff = deadline.diff(now);
  const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const isAdmin = user?.role === 'school_admin' || user?.role === 'department_admin';

  const timeline = [
    { label: '创建', date: activity.createdAt, done: true },
    { label: '开放报名', date: activity.createdAt, done: activity.status !== 'draft' },
    { label: '报名截止', date: activity.registrationDeadline, done: ['closed', 'ongoing', 'completed'].includes(activity.status) },
    { label: '活动开始', date: activity.startTime, done: ['ongoing', 'completed'].includes(activity.status) },
    { label: '活动结束', date: activity.endTime, done: activity.status === 'completed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/activities" className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回活动列表
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 h-48 lg:h-auto bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl overflow-hidden">
            {activity.coverImage ? (
              <img src={activity.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Calendar className="w-16 h-16 text-primary-300" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-bold text-surface-900">{activity.title}</h1>
              <span className={`status-badge ${ActivityStatus[activity.status as keyof typeof ActivityStatus]?.color}`}>
                {ActivityStatus[activity.status as keyof typeof ActivityStatus]?.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-surface-600">
              <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-surface-400" />{activity.organizer}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-surface-400" />{activity.location}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-surface-400" />{dayjs(activity.startTime).format('YYYY-MM-DD HH:mm')} - {dayjs(activity.endTime).format('YYYY-MM-DD HH:mm')}</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4 text-surface-400" />{activity.registeredCount}/{activity.maxParticipants} 人</span>
              <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-surface-400" />学分标准: {activity.creditStandard} 学分</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-900">活动详情</h2>
        <p className="text-surface-600 leading-relaxed">{activity.description}</p>
      </div>

      {activity.status === 'open' && user?.role === 'student' && (
        <div className="card p-6 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-800">立即报名</h2>
              <p className="text-sm text-primary-600 mt-1">报名截止: {deadline.format('YYYY-MM-DD HH:mm')}</p>
              <p className="text-sm text-accent-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                剩余 {daysLeft}天 {hoursLeft}小时
              </p>
            </div>
            <button className="btn-primary">立即报名</button>
          </div>
        </div>
      )}

      {isAdmin && activity.participants.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            报名人员 ({activity.participants.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">用户ID</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">状态</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">报名时间</th>
                </tr>
              </thead>
              <tbody>
                {activity.participants.map((p) => (
                  <tr key={p.userId} className="border-b border-surface-100">
                    <td className="py-2 px-3 text-surface-700">{p.userId}</td>
                    <td className="py-2 px-3">
                      <span className="status-badge bg-success-50 text-success-600">{p.status}</span>
                    </td>
                    <td className="py-2 px-3 text-surface-500">{dayjs(p.registeredAt).format('YYYY-MM-DD HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-900">活动进度</h2>
        <div className="flex items-center gap-1">
          {timeline.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-primary-800 text-white' : 'bg-surface-200 text-surface-400'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className="text-xs mt-1 text-surface-500">{step.label}</span>
              </div>
              {i < timeline.length - 1 && (
                <div className={`h-0.5 flex-1 ${step.done ? 'bg-primary-800' : 'bg-surface-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
