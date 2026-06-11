import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DotLoading, Tag } from 'antd-mobile';
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import Layout from '../components/Layout';
import { alertApi, attendanceApi, fundingApi, statisticsApi, studentApi } from '@/api/endpoints';
import type { AlertRecord, AttendanceRecord, FundingRecord, Student, User } from '@shared/types';

type DashboardData = {
  totalStudents: number;
  todayAttendanceRate: number;
  todayCheckedIn: number;
  totalFundingAmount: number;
  pendingAlerts: number;
  pendingFunding: number;
  students: Student[];
  attendance: AttendanceRecord[];
  funding: FundingRecord[];
  alerts: AlertRecord[];
};

const fallbackData: DashboardData = {
  totalStudents: 1045,
  todayAttendanceRate: 92.8,
  todayCheckedIn: 970,
  totalFundingAmount: 2860000,
  pendingAlerts: 8,
  pendingFunding: 36,
  students: [
    {
      id: 1,
      studentNo: 'HNZZ2024001',
      name: '张明',
      gender: 'male',
      grade: '2024级',
      className: '计算机应用1班',
      schoolId: 1,
      idCard: '410101200801010011',
      phone: '13800138001',
      isPoverty: true,
      isFundingEligible: true,
      status: 'active',
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: '2026-06-08T08:00:00.000Z',
      schoolName: '郑州信息工程中等专业学校',
    },
    {
      id: 2,
      studentNo: 'HNZZ2024002',
      name: '李雪',
      gender: 'female',
      grade: '2024级',
      className: '电子商务2班',
      schoolId: 1,
      idCard: '410101200802020022',
      phone: '13800138002',
      isPoverty: true,
      isFundingEligible: true,
      status: 'active',
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: '2026-06-08T08:00:00.000Z',
      schoolName: '郑州信息工程中等专业学校',
    },
  ],
  attendance: [
    {
      id: 1,
      studentId: 1,
      studentName: '张明',
      schoolId: 1,
      checkInTime: '2026-06-08 07:42:15',
      checkInType: 'face',
      locationLat: 34.75,
      locationLng: 113.62,
      locationAccuracy: 4.2,
      isInFence: true,
      faceMatchScore: 96.4,
      status: 'normal',
      className: '计算机应用1班',
    },
    {
      id: 2,
      studentId: 2,
      studentName: '李雪',
      schoolId: 1,
      checkInTime: '2026-06-08 08:08:30',
      checkInType: 'face',
      locationLat: 34.75,
      locationLng: 113.62,
      locationAccuracy: 5.8,
      isInFence: true,
      faceMatchScore: 93.1,
      status: 'late',
      className: '电子商务2班',
    },
  ],
  funding: [
    {
      id: 1,
      studentId: 1,
      studentName: '张明',
      schoolId: 1,
      schoolName: '郑州信息工程中等专业学校',
      fundingType: '国家助学金',
      amount: 2000,
      batchNo: 'HN202606',
      status: 'approved',
      applyTime: '2026-06-05T09:00:00.000Z',
      className: '计算机应用1班',
    },
    {
      id: 2,
      studentId: 2,
      studentName: '李雪',
      schoolId: 1,
      schoolName: '郑州信息工程中等专业学校',
      fundingType: '免学费补助',
      amount: 1200,
      batchNo: 'HN202606',
      status: 'pending',
      applyTime: '2026-06-05T09:00:00.000Z',
      className: '电子商务2班',
    },
  ],
  alerts: [
    {
      id: 1,
      schoolId: 1,
      type: 'funding_exception',
      level: 'high',
      studentId: 2,
      studentName: '李雪',
      title: '资助名单待复核',
      description: '资助名单与学籍状态存在差异，请核验材料。',
      status: 'pending',
      createdAt: '2026-06-08T08:30:00.000Z',
      schoolName: '郑州信息工程中等专业学校',
    },
    {
      id: 2,
      schoolId: 1,
      type: 'absent',
      level: 'medium',
      studentId: 3,
      studentName: '王强',
      title: '连续缺勤预警',
      description: '学生连续两天未完成校园围栏内打卡。',
      status: 'processing',
      createdAt: '2026-06-08T07:50:00.000Z',
      schoolName: '郑州信息工程中等专业学校',
    },
  ],
};

const formatAmount = (value: number) => {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString('zh-CN');
};

const statusText: Record<string, string> = {
  normal: '正常',
  late: '迟到',
  absent: '缺勤',
  exception: '异常',
  pending: '待审核',
  approved: '已审核',
  distributed: '已发放',
  received: '已领取',
  processing: '处理中',
  resolved: '已处理',
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(null);
  const [dashboard, setDashboard] = React.useState<DashboardData>(fallbackData);
  const [loading, setLoading] = React.useState(true);
  const [apiHealthy, setApiHealthy] = React.useState(true);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const [overview, students, attendance, funding, alerts] = await Promise.all([
        statisticsApi.getOverview(),
        studentApi.getList({ page: 1, pageSize: 4 }),
        attendanceApi.getList({ page: 1, pageSize: 4 }),
        fundingApi.getList({ page: 1, pageSize: 4 }),
        alertApi.getList({ page: 1, pageSize: 4, status: 'pending' }),
      ]);

      setDashboard({
        totalStudents: overview.totalStudents,
        todayAttendanceRate: overview.todayAttendanceRate,
        todayCheckedIn: overview.todayCheckedIn,
        totalFundingAmount: overview.totalFundingAmount,
        pendingAlerts: overview.pendingAlerts,
        pendingFunding: overview.pendingFunding,
        students: students.list,
        attendance: attendance.list,
        funding: funding.list,
        alerts: alerts.list,
      });
      setApiHealthy(true);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setDashboard(fallbackData);
      setApiHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr) as User);
      } catch (error) {
        console.error('Parse user failed:', error);
      }
    }
    void loadDashboard();
  }, [loadDashboard]);

  const statCards = [
    {
      label: '在籍学生',
      value: dashboard.totalStudents.toLocaleString('zh-CN'),
      icon: Users,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: '今日出勤',
      value: `${dashboard.todayAttendanceRate.toFixed(1)}%`,
      icon: CalendarCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: '资助金额',
      value: formatAmount(dashboard.totalFundingAmount),
      icon: Wallet,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: '待处理预警',
      value: dashboard.pendingAlerts.toString(),
      icon: AlertTriangle,
      tone: 'bg-rose-50 text-rose-700',
    },
  ];

  const shortcuts = [
    { label: '人脸考勤', detail: '围栏定位与打卡核验', icon: CalendarCheck, path: '/attendance/checkin' },
    { label: '学生管理', detail: '学籍、贫困标识与人脸库', icon: GraduationCap, path: '/students' },
    { label: '资助发放', detail: '名单比对、凭证和进度', icon: Wallet, path: '/funding' },
    { label: '统计报表', detail: '考勤与资助监管看板', icon: BarChart3, path: '/statistics' },
    { label: '围栏监管', detail: '学校地理围栏与异常位置', icon: MapPin, path: '/attendance' },
    { label: '预警处置', detail: '异常缺勤与资助差异', icon: ShieldCheck, path: '/alerts' },
  ];

  return (
    <Layout
      title="资助监管工作台"
      rightContent={
        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="刷新工作台"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="space-y-4 p-4">
        <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/75">河南省中职学生资助监管服务平台</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight">
                {user ? `${user.name}，今日监管概览` : '今日监管概览'}
              </h1>
            </div>
            <Tag color={apiHealthy ? 'success' : 'warning'}>{apiHealthy ? '接口在线' : '本地缓存'}</Tag>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <p className="text-xs text-white/70">已打卡学生</p>
              <p className="mt-1 text-xl font-semibold">{dashboard.todayCheckedIn.toLocaleString('zh-CN')}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3">
              <p className="text-xs text-white/70">待审核资助</p>
              <p className="mt-1 text-xl font-semibold">{dashboard.pendingFunding}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="rounded-2xl border-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{item.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">核心业务</h2>
            {loading && (
              <span className="text-xs text-gray-400">
                加载中
                <DotLoading />
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                  <p className="mt-3 font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{item.detail}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">预警与待办</h2>
            <button type="button" className="text-sm text-blue-600" onClick={() => navigate('/alerts')}>
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.alerts.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <Tag color={item.level === 'high' ? 'danger' : item.level === 'medium' ? 'warning' : 'primary'}>
                    {item.level === 'high' ? '高' : item.level === 'medium' ? '中' : '低'}
                  </Tag>
                </div>
                <p className="mt-1 text-sm leading-5 text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 pb-3">
          <Card className="rounded-2xl border-0 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">最近考勤</h2>
              <button type="button" className="text-sm text-blue-600" onClick={() => navigate('/attendance')}>
                考勤管理
              </button>
            </div>
            <div className="space-y-2">
              {dashboard.attendance.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.studentName}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.className || '未分班'} · {item.checkInTime}</p>
                  </div>
                  <Tag color={item.status === 'normal' ? 'success' : item.status === 'late' ? 'warning' : 'danger'}>
                    {statusText[item.status] || item.status}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">资助发放</h2>
              <button type="button" className="text-sm text-blue-600" onClick={() => navigate('/funding')}>
                进入处理
              </button>
            </div>
            <div className="space-y-2">
              {dashboard.funding.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.studentName}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.fundingType} · {formatAmount(item.amount)}</p>
                  </div>
                  <Tag color={item.status === 'pending' ? 'warning' : 'success'}>
                    {statusText[item.status] || item.status}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
