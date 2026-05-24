import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  CarFront,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  ClipboardList,
  FileCheck,
  FileText,
  Users,
  Activity,
  PlusCircle,
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Award,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { UserRole, RoleLabels, TodoItem, QuickAction, ActivityItem } from '@/types';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: { value: number; isUp: boolean };
}

const roleStatConfigs: Record<UserRole, Array<Omit<StatCard, 'value' | 'trend'>>> = {
  admin: [
    { title: '总车源', icon: Car, color: 'text-primary-700', bgColor: 'bg-primary-100' },
    { title: '在售车源', icon: CarFront, color: 'text-success-600', bgColor: 'bg-success-100' },
    { title: '已售车源', icon: CheckCircle, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
    { title: '预约数', icon: Calendar, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { title: '订金数', icon: DollarSign, color: 'text-success-700', bgColor: 'bg-success-50' },
    { title: '结算金额', icon: TrendingUp, color: 'text-secondary-700', bgColor: 'bg-secondary-50' },
    { title: '转化率', icon: Award, color: 'text-primary-700', bgColor: 'bg-primary-100' },
  ],
  dealer: [
    { title: '我的车源', icon: Car, color: 'text-primary-700', bgColor: 'bg-primary-100' },
    { title: '在售车源', icon: CarFront, color: 'text-success-600', bgColor: 'bg-success-100' },
    { title: '已售车源', icon: CheckCircle, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
    { title: '预约数', icon: Calendar, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { title: '待结算', icon: DollarSign, color: 'text-success-700', bgColor: 'bg-success-50' },
  ],
  buyer: [
    { title: '我的预约', icon: Calendar, color: 'text-primary-700', bgColor: 'bg-primary-100' },
    { title: '我的订金', icon: DollarSign, color: 'text-success-600', bgColor: 'bg-success-100' },
    { title: '我的合同', icon: FileText, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
  ],
  inspector: [
    { title: '待检测', icon: Clock, color: 'text-danger-600', bgColor: 'bg-danger-100' },
    { title: '检测中', icon: RefreshCw, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
    { title: '已检测', icon: FileCheck, color: 'text-success-600', bgColor: 'bg-success-100' },
  ],
  sales: [
    { title: '今日预约', icon: Calendar, color: 'text-primary-700', bgColor: 'bg-primary-100' },
    { title: '待跟进', icon: ClipboardList, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
    { title: '已成交', icon: CheckCircle, color: 'text-success-600', bgColor: 'bg-success-100' },
  ],
  customer_service: [
    { title: '待处理', icon: AlertCircle, color: 'text-danger-600', bgColor: 'bg-danger-100' },
    { title: '处理中', icon: RefreshCw, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
    { title: '已解决', icon: CheckCircle, color: 'text-success-600', bgColor: 'bg-success-100' },
  ],
  finance: [
    { title: '待结算', icon: DollarSign, color: 'text-primary-700', bgColor: 'bg-primary-100' },
    { title: '已结算', icon: CheckCircle, color: 'text-success-600', bgColor: 'bg-success-100' },
    { title: '待退款', icon: AlertCircle, color: 'text-danger-600', bgColor: 'bg-danger-100' },
  ],
};

const roleQuickActions: Record<UserRole, QuickAction[]> = {
  admin: [
    { id: '1', title: '发布车源', icon: 'PlusCircle', path: '/cars/publish', roles: ['admin', 'dealer'] },
    { id: '2', title: '用户管理', icon: 'Users', path: '/users', roles: ['admin'] },
    { id: '3', title: '运营统计', icon: 'BarChart3', path: '/statistics', roles: ['admin'] },
    { id: '4', title: '审计日志', icon: 'Activity', path: '/audit', roles: ['admin'] },
  ],
  dealer: [
    { id: '1', title: '发布车源', icon: 'PlusCircle', path: '/cars/publish', roles: ['admin', 'dealer'] },
    { id: '2', title: '我的车源', icon: 'Car', path: '/cars', roles: ['admin', 'dealer', 'sales'] },
    { id: '3', title: '结算管理', icon: 'DollarSign', path: '/settlements', roles: ['admin', 'finance', 'dealer'] },
  ],
  buyer: [
    { id: '1', title: '浏览车源', icon: 'Search', path: '/cars', roles: ['admin', 'dealer', 'sales', 'buyer', 'inspector'] },
    { id: '2', title: '创建预约', icon: 'PlusCircle', path: '/appointments/create', roles: ['admin', 'buyer', 'sales'] },
    { id: '3', title: '我的预约', icon: 'Calendar', path: '/appointments', roles: ['admin', 'buyer', 'sales'] },
  ],
  inspector: [
    { id: '1', title: '待检测列表', icon: 'ClipboardList', path: '/inspections', roles: ['admin', 'inspector', 'sales'] },
  ],
  sales: [
    { id: '1', title: '创建预约', icon: 'PlusCircle', path: '/appointments/create', roles: ['admin', 'buyer', 'sales'] },
    { id: '2', title: '预约列表', icon: 'Calendar', path: '/appointments', roles: ['admin', 'buyer', 'sales'] },
    { id: '3', title: '创建合同', icon: 'FileText', path: '/contracts', roles: ['admin', 'sales'] },
  ],
  customer_service: [
    { id: '1', title: '异常工单', icon: 'AlertCircle', path: '/exceptions', roles: ['admin', 'customer_service'] },
  ],
  finance: [
    { id: '1', title: '订金管理', icon: 'DollarSign', path: '/deposits', roles: ['admin', 'finance', 'sales', 'buyer'] },
    { id: '2', title: '结算管理', icon: 'DollarSign', path: '/settlements', roles: ['admin', 'finance', 'dealer'] },
  ],
};

const mockTodos: TodoItem[] = [
  { id: 1, title: '审核新发布的车源', description: '宝马5系 2023款', priority: 'high', status: 'pending', createdAt: '2025-05-20' },
  { id: 2, title: '处理订金退款申请', description: '订单号: D20250519001', priority: 'high', status: 'in_progress', createdAt: '2025-05-19' },
  { id: 3, title: '跟进待确认预约', description: '张先生 - 奔驰E级', priority: 'medium', status: 'pending', createdAt: '2025-05-19' },
  { id: 4, title: '完成月度结算', description: '5月份车商结算', priority: 'medium', status: 'pending', createdAt: '2025-05-18' },
  { id: 5, title: '更新用户资料', description: '李检测师联系方式变更', priority: 'low', status: 'completed', createdAt: '2025-05-17' },
];

const mockActivities: ActivityItem[] = [
  { id: 1, user: '王销售', action: '创建了预约', target: '宝马5系 - 张先生', time: '10分钟前', type: 'create' },
  { id: 2, user: '李检测师', action: '上传了检测报告', target: '奔驰E级', time: '30分钟前', type: 'update' },
  { id: 3, user: '孙财务', action: '处理了订金', target: '订单 D20250519002', time: '1小时前', type: 'status' },
  { id: 4, user: '诚信二手车行', action: '发布了新车源', target: '奥迪A6L 2024款', time: '2小时前', type: 'create' },
  { id: 5, user: '系统管理员', action: '更新了用户权限', target: '赵客服', time: '3小时前', type: 'update' },
];

const iconMap: Record<string, React.ElementType> = {
  Car,
  CarFront,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  ClipboardList,
  FileCheck,
  FileText,
  Users,
  Activity,
  PlusCircle,
  Search,
  AlertCircle,
  RefreshCw,
  Award,
  BarChart3,
  Settings,
  Bell,
};

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const config = roleStatConfigs[user.role];
      const mockStatsData = generateMockStats(user.role);
      const cards: StatCard[] = config.map((item, index) => ({
        ...item,
        value: mockStatsData[index],
        trend: Math.random() > 0.3 ? { value: Math.floor(Math.random() * 20) + 1, isUp: Math.random() > 0.4 } : undefined,
      }));
      setStats(cards);
      setQuickActions(roleQuickActions[user.role] || []);
      setLoading(false);
    }
  }, [user]);

  const generateMockStats = (role: UserRole): (string | number)[] => {
    switch (role) {
      case 'admin':
        return [1256, 892, 234, 156, 89, '¥2,456,800', '23.5%'];
      case 'dealer':
        return [45, 28, 12, 8, '¥156,000'];
      case 'buyer':
        return [3, 1, 1];
      case 'inspector':
        return [5, 3, 42];
      case 'sales':
        return [8, 15, 56];
      case 'customer_service':
        return [3, 5, 28];
      case 'finance':
        return [12, 45, 2];
      default:
        return [];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger-100 text-danger-700';
      case 'medium': return 'bg-secondary-100 text-secondary-700';
      case 'low': return 'bg-neutral-100 text-neutral-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary-100 text-secondary-700';
      case 'in_progress': return 'bg-primary-100 text-primary-700';
      case 'completed': return 'bg-success-100 text-success-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'in_progress': return '处理中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <PlusCircle className="w-4 h-4 text-success-600" />;
      case 'update': return <RefreshCw className="w-4 h-4 text-primary-600" />;
      case 'delete': return <AlertCircle className="w-4 h-4 text-danger-600" />;
      case 'status': return <CheckCircle className="w-4 h-4 text-secondary-600" />;
      default: return <Activity className="w-4 h-4 text-neutral-600" />;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-noto-serif-sc text-lg font-semibold text-neutral-800">汽车交易管理系统</h1>
                <p className="text-xs text-neutral-500">工作台</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-neutral-800">{user.name}</p>
                  <p className="text-xs text-neutral-500">{RoleLabels[user.role]}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-neutral-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-2">
            欢迎回来，{user.name}
          </h2>
          <p className="text-neutral-500">
            今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full" />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-700" />
                数据概览
              </h3>
              <div className={`grid gap-4 ${
                stats.length <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                stats.length <= 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="card p-5 group hover:-translate-y-1 transition-all duration-300"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 mb-1">{stat.title}</p>
                          <p className="font-noto-serif-sc text-2xl font-bold text-neutral-800 group-hover:text-primary-700 transition-colors">
                            {stat.value}
                          </p>
                          {stat.trend && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${stat.trend.isUp ? 'text-success-600' : 'text-danger-600'}`}>
                              <TrendingUp className={`w-4 h-4 ${!stat.trend.isUp ? 'rotate-180' : ''}`} />
                              <span>{stat.trend.value}% 较上周</span>
                            </div>
                          )}
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mb-8">
              <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary-700" />
                快捷操作
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = iconMap[action.icon] || PlusCircle;
                  return (
                    <Link
                      key={action.id}
                      to={action.path}
                      className="card p-5 flex flex-col items-center gap-3 group hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-700 transition-colors">
                        {action.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary-700" />
                    待办事项
                  </h3>
                  <Link to="/appointments" className="text-sm text-primary-700 hover:text-primary-800 flex items-center gap-1 transition-colors">
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="card divide-y divide-neutral-100">
                  {mockTodos.map((todo, index) => (
                    <div
                      key={todo.id}
                      className="p-4 hover:bg-neutral-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-neutral-800 truncate">{todo.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(todo.priority)}`}>
                              {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 truncate">{todo.description}</p>
                          <p className="text-xs text-neutral-400 mt-1">{todo.createdAt}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(todo.status)}`}>
                          {getStatusLabel(todo.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-700" />
                    最近动态
                  </h3>
                  <Link to="/audit" className="text-sm text-primary-700 hover:text-primary-800 flex items-center gap-1 transition-colors">
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="card divide-y divide-neutral-100">
                  {mockActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-neutral-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {activity.user.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.type)}
                            <span className="text-sm text-neutral-800">
                              <span className="font-medium">{activity.user}</span>
                              {' '}{activity.action}{' '}
                              <span className="text-primary-700 font-medium">{activity.target}</span>
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1 ml-6">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
