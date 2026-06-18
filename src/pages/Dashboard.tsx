import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  GraduationCap,
  ListTodo,
  PenLine,
  Users,
  BookOpen,
  Award,
  FileText,
  TrendingUp,
  Bell,
  ChevronRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Hourglass,
  XCircle,
  Star,
  MapPin,
  Heart,
  PlusCircle,
  MessageCircle,
  TrendingDown,
  Shield,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockActivities } from '@/mock/activities';
import { mockTeams } from '@/mock/teams';
import { mockCreditApplications } from '@/mock/credits';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { getStatusColor, getStatusLabel } from '@/utils/format';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function StudentDashboard() {
  const { user } = useAuthStore();
  const myTeams = mockTeams.filter((t) => t.members.some((m) => m.userId === (user?.id || 'u001')));
  const myCredits = mockCreditApplications.filter((c) => c.userId === (user?.id || 'u001'));
  const pendingCredits = myCredits.filter((c) => c.status === 'pending').length;

  const statCards = [
    { label: '参与活动数', value: 5, change: '+2', icon: Calendar, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-500' },
    { label: '服务时长', value: 128, unit: 'h', change: '+32h', icon: Clock, gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-500' },
    { label: '已获学分', value: 9, change: '+3', icon: GraduationCap, gradient: 'from-orange-400 to-orange-600', bg: 'bg-orange-500' },
    { label: '待办事项', value: 3, change: '2项紧急', icon: ListTodo, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-500' },
  ];

  const quickActions = [
    { label: '报名活动', icon: Calendar, color: 'bg-blue-500 hover:bg-blue-600', to: '/activities' },
    { label: '创建团队', icon: Users, color: 'bg-green-500 hover:bg-green-600', to: '/sanxiaxiang/teams/create' },
    { label: '轨迹打卡', icon: MapPin, color: 'bg-accent-500 hover:bg-accent-600', to: '/sanxiaxiang/checkin' },
    { label: '撰写日志', icon: PenLine, color: 'bg-rose-500 hover:bg-rose-600', to: '/sanxiaxiang/journals' },
    { label: '申请学分', icon: Award, color: 'bg-purple-500 hover:bg-purple-600', to: '/credits/apply' },
    { label: '第二课堂成绩单', icon: FileText, color: 'bg-surface-600 hover:bg-surface-700', to: '/credits/transcript' },
  ];

  const sanxiaxiangFlow = [
    { label: '团队申报', desc: '组建团队·关联学籍', icon: Users, color: 'from-blue-500 to-blue-600', to: '/sanxiaxiang/teams/create' },
    { label: '行程打卡', desc: 'LBS轨迹·照片水印', icon: MapPin, color: 'from-green-500 to-emerald-600', to: '/sanxiaxiang/checkin' },
    { label: '实践日志', desc: 'AI摘要·关键词提取', icon: BookOpen, color: 'from-accent-500 to-amber-500', to: '/sanxiaxiang/journals' },
    { label: '成果认证', desc: '学分认定·成绩单', icon: Award, color: 'from-purple-500 to-purple-600', to: '/credits/transcript' },
  ];

  const notifications = [
    { id: 'n1', title: '您的学分申请已通过', time: '2026-08-15T14:00:00', type: 'success' },
    { id: 'n2', title: '团队"数字赋能乡村振兴实践团"有新打卡记录', time: '2026-07-18T08:45:00', type: 'info' },
    { id: 'n3', title: '2026年秋季社会实践成果汇报会开放报名', time: '2026-08-25T10:00:00', type: 'info' },
    { id: 'n4', title: '您有一条学分申请被驳回', time: '2026-05-10T10:00:00', type: 'warning' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || ''}
              alt={user?.name || ''}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary-100 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white ring-2 ring-white">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-800">
                你好，{user?.name || '张明'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                <GraduationCap className="w-3 h-3" />
                学生身份
              </span>
            </div>
            <p className="text-surface-500 mt-1 text-sm">
              {user?.department || '计算机学院'} · {user?.grade || '2023级'} · 学号 {user?.studentId || '2023010101'}
            </p>
          </div>
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
              className={`${action.color} text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap shadow-md hover:shadow-lg`}
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-5 border-l-4 border-l-primary-500"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            三下乡实践全流程
          </h2>
          <Link to="/sanxiaxiang/teams" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sanxiaxiangFlow.map((item, index) => (
            <Link
              key={item.label}
              to={item.to}
              className="relative group"
            >
              <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-all duration-200 border border-surface-100 hover:border-surface-200 group-hover:shadow-md">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-surface-800 text-sm">{item.label}</h3>
                <p className="text-xs text-surface-500 mt-0.5">{item.desc}</p>
                <div className="mt-2 text-primary-600 text-xs font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  立即进入 <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              {index < sanxiaxiangFlow.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-1.5 -translate-y-1/2 text-surface-300 z-10">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </Link>
          ))}
        </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              学分进度
            </h2>
            <Link to="/credits/transcript" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              查看成绩单 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-500">已获学分</span>
                <span className="font-mono font-semibold text-surface-800">9 / 12 学分</span>
              </div>
              <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-surface-400 mt-1.5">完成度 75% · 教育部第二课堂学分系统对接</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {myCredits.slice(0, 4).map((credit) => (
                <div key={credit.id} className="p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer">
                  <p className="text-xs text-surface-500 truncate">{credit.relatedName}</p>
                  <p className="text-sm font-mono font-semibold text-surface-700 mt-1">{credit.creditHours} 学分</p>
                  <span className={`status-badge text-[10px] mt-1 ${getStatusColor(credit.status)}`}>
                    {getStatusLabel(credit.status)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-surface-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-500 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-success-500" />
                  院系认定复查记录
                </span>
                <Link to="/credits/transcript" className="text-primary-600 hover:underline">
                  查看明细 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuthStore();
  const pendingTeams = mockTeams.filter((t) => t.status === 'pending');
  const pendingCredits = mockCreditApplications.filter((c) => c.status === 'pending');
  const pendingActivities = mockActivities.filter((a) => a.status === 'pending');

  const schoolStats = [
    {
      label: '全校参与率',
      value: '78.6%',
      change: '+5.2%',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      trend: 'up',
    },
    {
      label: '累计服务时长',
      value: '12,486',
      unit: 'h',
      change: '+1,280h',
      icon: Clock,
      gradient: 'from-green-500 to-emerald-600',
      trend: 'up',
    },
    {
      label: '实践基地数',
      value: 86,
      change: '+12个',
      icon: Building2,
      gradient: 'from-orange-400 to-orange-600',
      trend: 'up',
    },
    {
      label: '基地满意度',
      value: '4.8',
      unit: '分',
      change: '↑ 0.2',
      icon: Star,
      gradient: 'from-purple-500 to-purple-600',
      trend: 'up',
    },
  ];

  const topDepartments = [
    { name: '计算机学院', hours: 2840, rate: 92.3 },
    { name: '经济管理学院', hours: 2156, rate: 88.7 },
    { name: '外国语学院', hours: 1824, rate: 85.1 },
    { name: '机械工程学院', hours: 1620, rate: 82.5 },
    { name: '生命科学学院', hours: 1380, rate: 79.8 },
  ];

  const pendingItems = [
    {
      id: 'p1',
      type: '活动审核',
      title: '实践活动待审核',
      desc: '需审核活动申请',
      count: pendingActivities.length,
      link: '/activities',
      color: 'bg-blue-50 text-blue-700',
      icon: Calendar,
    },
    {
      id: 'p2',
      type: '团队申报',
      title: '三下乡团队待审核',
      desc: '团队申报审核处理',
      count: pendingTeams.length,
      link: '/sanxiaxiang/teams',
      color: 'bg-green-50 text-green-700',
      icon: Users,
    },
    {
      id: 'p3',
      type: '学分认定',
      title: '学分申请待审核',
      desc: '学生学分申请审核',
      count: pendingCredits.length,
      link: '/credits/audit',
      color: 'bg-purple-50 text-purple-700',
      icon: GraduationCap,
    },
  ];

  const statusStats = [
    { label: '已通过', count: 156, icon: CheckCircle2, color: 'text-success-500' },
    { label: '审核中', count: 23, icon: Hourglass, color: 'text-amber-500' },
    { label: '已驳回', count: 8, icon: XCircle, color: 'text-danger-500' },
  ];

  const recentActivities = mockActivities.slice(0, 5);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || ''}
              alt={user?.name || ''}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-danger-100 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-danger-500 flex items-center justify-center text-white ring-2 ring-white">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-900">
                管理员工作台
              </h1>
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                user?.role === 'school_admin'
                  ? 'bg-danger-50 text-danger-600'
                  : 'bg-accent-50 text-accent-600'
              )}>
                {user?.role === 'school_admin' ? (
                  <><Crown className="w-3 h-3" /> 校级管理员</>
                ) : (
                  <><Shield className="w-3 h-3" /> 院系管理员</>
                )}
              </span>
            </div>
            <p className="text-surface-500 mt-1 text-sm">
              {user?.name || '管理员'} · {user?.department || '计算机学院'}
            </p>
          </div>
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
        {schoolStats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500">{stat.label}</p>
                <p className="text-3xl font-bold font-mono mt-2 text-surface-800">
                  {stat.value}
                  {stat.unit && <span className="text-base text-surface-500 ml-1">{stat.unit}</span>}
                </p>
                <p className="text-xs text-success-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-5 border-l-4 border-l-accent-500"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-accent-500" />
            待办审核
          </h2>
          <span className="status-badge bg-danger-50 text-danger-600 font-medium">
            共 {pendingActivities.length + pendingTeams.length + pendingCredits.length} 项待处理
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pendingItems.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="status-badge bg-danger-100 text-danger-700 font-bold">
                  {item.count}
                </span>
              </div>
              <h3 className="font-semibold text-surface-800 mt-3">{item.type}</h3>
              <p className="text-sm text-surface-500 mt-1">{item.title}</p>
              <p className="text-xs text-surface-400 mt-0.5">{item.desc}</p>
              <div className="mt-3 text-primary-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                前往处理 <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-5 border-l-4 border-l-primary-500"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            校级数据看板
          </h2>
          <Link to="/dashboard" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
            查看完整看板 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '参与率统计', desc: '各院系参与率', icon: Users, color: 'from-blue-500 to-blue-600' },
            { label: '服务时长排行', desc: 'TOP院系排名', icon: Clock, color: 'from-green-500 to-emerald-600' },
            { label: '基地满意度', desc: '五维满意度评价', icon: Star, color: 'from-amber-400 to-amber-500' },
            { label: '学分认定进度', desc: '认定复查记录', icon: Award, color: 'from-purple-500 to-purple-600' },
          ].map((item) => (
            <Link
              key={item.label}
              to="/dashboard"
              className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-all duration-200 border border-surface-100 hover:border-surface-200 group hover:shadow-md"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md mb-3`}>
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-surface-800 text-sm">{item.label}</h3>
              <p className="text-xs text-surface-500 mt-0.5">{item.desc}</p>
              <div className="mt-2 text-primary-600 text-xs font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                查看详情 <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              服务时长 TOP 院系
            </h2>
            <Link to="/dashboard" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              更多数据 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topDepartments.map((dept, index) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-surface-200 text-surface-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-surface-100 text-surface-500'
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-surface-700">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-surface-800 font-semibold">{dept.hours.toLocaleString()}h</span>
                    <span className="text-xs text-surface-400">参与率 {dept.rate}%</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    style={{ width: `${(dept.hours / 2840) * 100}%` }}
                  />
                </div>
              </div>
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
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-success-500" />
              基地满意度概况
            </h2>
            <Link to="/bases" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              基地列表 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {['综合满意度', '服务质量', '住宿条件', '指导专业度', '合作意愿'].map((item, i) => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-sm text-surface-600 w-20 shrink-0">{item}</span>
                <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full',
                      i === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      i === 1 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      i === 2 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      i === 3 ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                      'bg-gradient-to-r from-rose-400 to-rose-500'
                    )}
                    style={{ width: `${[96, 94, 88, 92, 95][i]}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 w-12 justify-end">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-mono font-semibold text-surface-700">{[4.8, 4.7, 4.4, 4.6, 4.75][i]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-surface-100">
            {statusStats.map((stat) => (
              <div key={stat.label} className="text-center p-2">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-mono font-bold text-surface-800">{stat.count}</p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            近期活动一览
          </h2>
          <Link to="/activities" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
            活动管理 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.status === 'approved' || activity.status === 'open' ? 'bg-success-100' :
                  activity.status === 'pending' ? 'bg-amber-100' :
                  'bg-surface-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    activity.status === 'approved' || activity.status === 'open' ? 'text-success-600' :
                    activity.status === 'pending' ? 'text-amber-600' :
                    'text-surface-500'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-700">{activity.title}</p>
                  <p className="text-xs text-surface-400">
                    {activity.organizer} · {formatDate(activity.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-500">
                  {activity.participants.length} 人参与
                </span>
                <span className={`status-badge ${getStatusColor(activity.status)}`}>
                  {getStatusLabel(activity.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function BaseDashboard() {
  const { user } = useAuthStore();

  const statCards = [
    { label: '在招岗位', value: 8, change: '+2', icon: FileText, gradient: 'from-green-500 to-emerald-600' },
    { label: '接待团队', value: 12, change: '+3', icon: Users, gradient: 'from-blue-500 to-indigo-600' },
    { label: '服务学生', value: 156, change: '+28', icon: GraduationCap, gradient: 'from-accent-500 to-amber-500' },
    { label: '满意度评分', value: '4.8', change: '↑0.2', icon: Star, gradient: 'from-purple-500 to-purple-600' },
  ];

  const quickActions = [
    { label: '发布新岗位', icon: PlusCircle, color: 'bg-green-500 hover:bg-green-600', to: '/bases' },
    { label: '管理岗位', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600', to: '/bases' },
    { label: '查看团队', icon: Users, color: 'bg-accent-500 hover:bg-accent-600', to: '/sanxiaxiang/teams' },
    { label: '满意度评价', icon: Star, color: 'bg-purple-500 hover:bg-purple-600', to: '/bases' },
  ];

  const recentTeams = mockTeams.slice(0, 4);

  const baseFlow = [
    { label: '发布岗位', desc: '实践岗位发布', icon: PlusCircle, color: 'from-green-500 to-emerald-600', to: '/bases' },
    { label: '岗位管理', desc: '在招岗位管理', icon: FileText, color: 'from-blue-500 to-blue-600', to: '/bases' },
    { label: '团队接待', desc: '入驻团队审核', icon: Users, color: 'from-accent-500 to-amber-500', to: '/sanxiaxiang/teams' },
    { label: '满意度评价', desc: '实践效果评价', icon: Star, color: 'from-purple-500 to-purple-600', to: '/bases' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || ''}
              alt={user?.name || ''}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-success-100 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success-500 flex items-center justify-center text-white ring-2 ring-white">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-800">
                {user?.name || '黄山'}基地工作台
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-50 text-success-600 text-xs font-semibold">
                <Building2 className="w-3 h-3" />
                实践基地
              </span>
            </div>
            <p className="text-surface-500 mt-1 text-sm">
              {user?.department || '宏村镇人民政府'} · 实践基地管理
            </p>
          </div>
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
                <p className="text-3xl font-bold font-mono mt-2 text-surface-800">{card.value}</p>
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
              className={`${action.color} text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap shadow-md hover:shadow-lg`}
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-5 border-l-4 border-l-success-500"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-success-500" />
            基地业务管理
          </h2>
          <Link to="/bases" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {baseFlow.map((item, index) => (
            <Link
              key={item.label}
              to={item.to}
              className="relative group"
            >
              <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-all duration-200 border border-surface-100 hover:border-surface-200 group-hover:shadow-md">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-surface-800 text-sm">{item.label}</h3>
                <p className="text-xs text-surface-500 mt-0.5">{item.desc}</p>
                <div className="mt-2 text-primary-600 text-xs font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  立即进入 <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              当前在驻团队
            </h2>
            <Link to="/sanxiaxiang/teams" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              全部团队 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 truncate">{team.name}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {team.members.length} 人 · {team.theme}
                  </p>
                </div>
                <span className={`status-badge ${getStatusColor(team.status)} ml-3`}>
                  {getStatusLabel(team.status)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-accent-500" />
            待处理消息
          </h2>
          <div className="space-y-3">
            {[
              { id: 1, title: '"数字赋能乡村振兴实践团"申请入驻', time: '2小时前', type: 'apply' },
              { id: 2, title: '请确认团队实践完成评价', time: '1天前', type: 'review' },
              { id: 3, title: '新岗位审核通过，已上线发布', time: '2天前', type: 'system' },
            ].map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  msg.type === 'apply' ? 'bg-primary-500' : msg.type === 'review' ? 'bg-amber-500' : 'bg-success-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700">{msg.title}</p>
                  <p className="text-xs text-surface-400 mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DonorDashboard() {
  const { user } = useAuthStore();

  const statCards = [
    { label: '资助项目', value: 5, change: '+1', icon: Award, gradient: 'from-purple-500 to-purple-600' },
    { label: '资助学生', value: 68, change: '+12', icon: Users, gradient: 'from-blue-500 to-indigo-600' },
    { label: '累计金额', value: '¥68万', change: '+15万', icon: Heart, gradient: 'from-rose-500 to-rose-600' },
    { label: '受助故事', value: 24, change: '+6', icon: BookOpen, gradient: 'from-accent-500 to-amber-500' },
  ];

  const quickActions = [
    { label: '发布新项目', icon: PlusCircle, color: 'bg-purple-500 hover:bg-purple-600', to: '/scholarship/projects' },
    { label: '管理项目', icon: Award, color: 'bg-blue-500 hover:bg-blue-600', to: '/scholarship/projects' },
    { label: '查看受助学生', icon: Users, color: 'bg-accent-500 hover:bg-accent-600', to: '/scholarship/projects' },
    { label: '浏览受助故事', icon: Heart, color: 'bg-rose-500 hover:bg-rose-600', to: '/scholarship/stories' },
  ];

  const donorFlow = [
    { label: '发布项目', desc: '资助项目发布', icon: PlusCircle, color: 'from-purple-500 to-purple-600', to: '/scholarship/projects' },
    { label: '项目管理', desc: '在募项目管理', icon: Award, color: 'from-blue-500 to-blue-600', to: '/scholarship/projects' },
    { label: '受助学生', desc: '受助学生管理', icon: Users, color: 'from-accent-500 to-amber-500', to: '/scholarship/projects' },
    { label: '受助故事', desc: '正能量故事', icon: Heart, color: 'from-rose-500 to-rose-600', to: '/scholarship/stories' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || ''}
              alt={user?.name || ''}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-purple-100 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white ring-2 ring-white">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-800">
                {user?.name || '赵科技'}工作台
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold">
                <Heart className="w-3 h-3" />
                捐赠方
              </span>
            </div>
            <p className="text-surface-500 mt-1 text-sm">
              {user?.department || '赵科技基金会'} · 捐赠方管理
            </p>
          </div>
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
                <p className="text-3xl font-bold font-mono mt-2 text-surface-800">{card.value}</p>
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
              className={`${action.color} text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap shadow-md hover:shadow-lg`}
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-5 border-l-4 border-l-purple-500"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            资助业务管理
          </h2>
          <Link to="/scholarship/projects" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {donorFlow.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="group"
            >
              <div className="p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-all duration-200 border border-surface-100 hover:border-surface-200 group-hover:shadow-md">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-surface-800 text-sm">{item.label}</h3>
                <p className="text-xs text-surface-500 mt-0.5">{item.desc}</p>
                <div className="mt-2 text-primary-600 text-xs font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  立即进入 <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              资助项目进度
            </h2>
            <Link to="/scholarship/projects" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              全部项目 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: '赵科技创新创业奖学金', progress: 85, total: 20, current: 17, status: '进行中' },
              { name: '乡村振兴人才资助计划', progress: 100, total: 30, current: 30, status: '已完成' },
              { name: '困难学生助学金', progress: 60, total: 25, current: 15, status: '申请中' },
            ].map((proj, i) => (
              <div key={i} className="p-3 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-surface-700">{proj.name}</p>
                  <span className="text-xs text-surface-500">{proj.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full',
                        i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-success-500' : 'bg-accent-500'
                      )}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-surface-600 w-16 text-right">
                    {proj.current}/{proj.total} 人
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-rose-500" />
            最新受助故事
          </h2>
          <div className="space-y-3">
            {[
              { title: '从大山走出的计算机梦', author: '匿名 · 计算机学院', likes: 128 },
              { title: '感谢资助让我专心科研', author: '匿名 · 生命科学学院', likes: 96 },
              { title: '用知识回报家乡', author: '匿名 · 经济管理学院', likes: 84 },
            ].map((story, i) => (
              <div key={i} className="p-3 bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl border border-rose-100/50">
                <p className="text-sm font-medium text-surface-700">{story.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-surface-500">{story.author}</span>
                  <span className="text-xs text-rose-500 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-current" />
                    {story.likes}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/scholarship/stories"
            className="text-xs text-primary-600 hover:underline flex items-center justify-center gap-1 mt-3"
          >
            查看更多故事 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const role = user?.role;

  if (role === 'school_admin' || role === 'department_admin') {
    return <AdminDashboard />;
  }
  if (role === 'base') {
    return <BaseDashboard />;
  }
  if (role === 'donor') {
    return <DonorDashboard />;
  }
  return <StudentDashboard />;
}
