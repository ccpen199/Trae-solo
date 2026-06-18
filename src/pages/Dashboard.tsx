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
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockActivities } from '@/mock/activities';
import { mockTeams } from '@/mock/teams';
import { mockCreditApplications } from '@/mock/credits';
import { mockUsers } from '@/mock/users';
import { getStatusColor, getStatusLabel } from '@/utils/format';
import { formatRelativeTime, formatDate } from '@/utils/date';
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

function AdminDashboard() {
  const { user } = useAuthStore();
  const pendingTeams = mockTeams.filter((t) => t.status === 'pending');
  const pendingCredits = mockCreditApplications.filter((c) => c.status === 'pending');
  const pendingActivities = mockActivities.filter((a) => a.status === 'pending');
  const studentCount = mockUsers.filter((u) => u.role === 'student').length;

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
      title: '2026年暑期"三下乡"社会实践活动',
      submitter: '校团委',
      time: '2026-06-14T09:30:00',
      count: pendingActivities.length,
      link: '/activities',
      color: 'bg-blue-50 text-blue-700',
      icon: Calendar,
    },
    {
      id: 'p2',
      type: '团队申报',
      title: '三下乡团队申报待审核',
      submitter: '各院系',
      time: '2026-06-15T14:00:00',
      count: pendingTeams.length,
      link: '/sanxiaxiang/teams',
      color: 'bg-green-50 text-green-700',
      icon: Users,
    },
    {
      id: 'p3',
      type: '学分认定',
      title: '实践学分申请待审核',
      submitter: '学生',
      time: '2026-06-16T10:00:00',
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
        <div>
          <h1 className="text-2xl font-bold text-surface-800">
            管理员工作台
          </h1>
          <p className="text-surface-500 mt-1">
            {user?.name || '管理员'} · {user?.department || '计算机学院'}
          </p>
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
          <span className="status-badge bg-danger-50 text-danger-600">
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
              <p className="text-xs text-surface-400 mt-2 flex items-center gap-2">
                <span>{item.submitter}</span>
                <span>·</span>
                <span>{formatRelativeTime(item.time)}</span>
              </p>
              <div className="mt-3 text-primary-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                前往处理 <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              服务时长 TOP 院系
            </h2>
            <Link to="/dashboard" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              查看更多 <ChevronRight className="w-4 h-4" />
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
                  activity.status === 'approved' ? 'bg-success-100' :
                  activity.status === 'pending' ? 'bg-amber-100' :
                  'bg-surface-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    activity.status === 'approved' ? 'text-success-600' :
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

export default function Dashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'school_admin' || user?.role === 'department_admin';

  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
}
