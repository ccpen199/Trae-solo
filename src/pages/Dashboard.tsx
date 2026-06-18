import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, GraduationCap, ListTodo, PenLine, Users, BookOpen, Award, FileText, TrendingUp, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockActivities } from '@/mock/activities';
import { mockTeams } from '@/mock/teams';
import { mockCreditApplications } from '@/mock/credits';
import { getStatusColor, getStatusLabel } from '@/utils/format';
import { formatRelativeTime, formatDate } from '@/utils/date';

const statCards = [
  { label: '参与活动数', value: 5, change: '+2', icon: Calendar, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-500' },
  { label: '服务时长', value: 128, unit: 'h', change: '+32h', icon: Clock, gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-500' },
  { label: '已获学分', value: 9, change: '+3', icon: GraduationCap, gradient: 'from-orange-400 to-orange-600', bg: 'bg-orange-500' },
  { label: '待办事项', value: 3, change: '2项紧急', icon: ListTodo, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-500' },
];

const quickActions = [
  { label: '报名活动', icon: Calendar, color: 'bg-blue-500 hover:bg-blue-600', to: '/activities' },
  { label: '创建团队', icon: Users, color: 'bg-green-500 hover:bg-green-600', to: '/sanxiaxiang/teams/create' },
  { label: '撰写日志', icon: PenLine, color: 'bg-accent-500 hover:bg-accent-600', to: '/sanxiaxiang/journals' },
  { label: '申请学分', icon: Award, color: 'bg-purple-500 hover:bg-purple-600', to: '/credits/apply' },
  { label: '查看成绩单', icon: FileText, color: 'bg-surface-600 hover:bg-surface-700', to: '/credits/transcript' },
];

const notifications = [
  { id: 'n1', title: '您的学分申请已通过', time: '2026-08-15T14:00:00', type: 'success' },
  { id: 'n2', title: '团队"数字赋能乡村振兴实践团"有新打卡记录', time: '2026-07-18T08:45:00', type: 'info' },
  { id: 'n3', title: '2026年秋季社会实践成果汇报会开放报名', time: '2026-08-25T10:00:00', type: 'info' },
  { id: 'n4', title: '您有一条学分申请被驳回', time: '2026-05-10T10:00:00', type: 'warning' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const myTeams = mockTeams.filter((t) => t.members.some((m) => m.userId === (user?.id || 'u001')));
  const myCredits = mockCreditApplications.filter((c) => c.userId === (user?.id || 'u001'));
  const pendingCredits = myCredits.filter((c) => c.status === 'pending').length;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-800">
            你好，{user?.name || '张明'}
          </h1>
          <p className="text-surface-500 mt-1">欢迎回到高校社会实践协同管理平台</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-surface-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(new Date(), 'YYYY年M月D日 dddd')}</span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500">{card.label}</p>
                <p className="text-3xl font-bold font-mono mt-2 text-surface-800">
                  {card.value}
                  {card.unit && <span className="text-lg text-surface-500 ml-1">{card.unit}</span>}
                </p>
                <p className="text-xs text-success-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {card.change}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {quickActions.map((action) => (
          <motion.div key={action.label} variants={itemVariants}>
            <Link
              to={action.to}
              className={`${action.color} text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap`}
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800">近期活动</h2>
            <Link to="/activities" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockActivities.slice(0, 4).map((activity) => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 truncate">{activity.title}</p>
                  <p className="text-xs text-surface-400 mt-1">{activity.organizer} · {formatDate(activity.startTime)}</p>
                </div>
                <span className={`status-badge ${getStatusColor(activity.status)} ml-3`}>
                  {getStatusLabel(activity.status)}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800">我的团队</h2>
            <Link to="/sanxiaxiang/teams" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {myTeams.map((team) => (
              <Link
                key={team.id}
                to={`/sanxiaxiang/teams/${team.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 truncate">{team.name}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {team.theme} · {team.members.length}人
                  </p>
                </div>
                <span className={`status-badge ${getStatusColor(team.status)} ml-3`}>
                  {getStatusLabel(team.status)}
                </span>
              </Link>
            ))}
            {myTeams.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">暂无团队</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent-500" />
              通知
            </h2>
            {pendingCredits > 0 && (
              <span className="status-badge bg-danger-50 text-danger-500">{pendingCredits}条待处理</span>
            )}
          </div>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  n.type === 'success' ? 'bg-success-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-primary-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700">{n.title}</p>
                  <p className="text-xs text-surface-400 mt-1">{formatRelativeTime(n.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary-500" />
            学分进度
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-500">已获学分</span>
                <span className="font-mono font-semibold text-surface-800">9 / 12</span>
              </div>
              <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: '75%' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {myCredits.slice(0, 4).map((credit) => (
                <div key={credit.id} className="p-3 bg-surface-50 rounded-lg">
                  <p className="text-xs text-surface-500 truncate">{credit.relatedName}</p>
                  <p className="text-sm font-mono font-semibold text-surface-700 mt-1">{credit.creditHours} 学分</p>
                  <span className={`status-badge text-[10px] mt-1 ${getStatusColor(credit.status)}`}>
                    {getStatusLabel(credit.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
