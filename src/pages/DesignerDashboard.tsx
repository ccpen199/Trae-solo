import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  FileText,
  Star,
  Settings,
  Bell,
  User,
  ChevronRight,
  Plus,
  TrendingUp,
  Eye,
  Award,
  Clock,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  AlertCircle,
  MessageSquare,
  BarChart3,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store';

const menuItems = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { id: 'cases', label: '案例管理', icon: FileText },
  { id: 'ratings', label: '评分中心', icon: Star },
  { id: 'notifications', label: '消息通知', icon: Bell },
  { id: 'settings', label: '设置', icon: Settings },
];

const monthlyTrend = [
  { month: '1月', cases: 3 },
  { month: '2月', cases: 5 },
  { month: '3月', cases: 4 },
  { month: '4月', cases: 7 },
  { month: '5月', cases: 6 },
  { month: '6月', cases: 9 },
];

const styleDistribution = [
  { name: '现代简约', value: 35, color: '#0F766E' },
  { name: '北欧风格', value: 25, color: '#14B8A6' },
  { name: '新中式', value: 18, color: '#F97316' },
  { name: '轻奢风格', value: 12, color: '#8B5CF6' },
  { name: '其他', value: 10, color: '#64748B' },
];

const recentCases = [
  { id: '1', title: '杭州滨江·现代简约三居室', city: '杭州', views: 1256, status: '已发布', score: 4.8, date: '2024-06-12', cover: 'https://picsum.photos/seed/dcase1/120/80' },
  { id: '2', title: '上海浦东·新中式复式', city: '上海', views: 892, status: '审核中', score: 0, date: '2024-06-10', cover: 'https://picsum.photos/seed/dcase2/120/80' },
  { id: '3', title: '北京朝阳·北欧风格两居室', city: '北京', views: 2341, status: '已发布', score: 4.6, date: '2024-06-08', cover: 'https://picsum.photos/seed/dcase3/120/80' },
  { id: '4', title: '深圳南山·轻奢风格四居室', city: '深圳', views: 0, status: '草稿', score: 0, date: '2024-06-05', cover: 'https://picsum.photos/seed/dcase4/120/80' },
  { id: '5', title: '成都锦江·日式禅意三居', city: '成都', views: 1580, status: '已发布', score: 4.9, date: '2024-06-01', cover: 'https://picsum.photos/seed/dcase5/120/80' },
];

const allCases = [
  { id: '1', title: '杭州滨江·现代简约三居室', city: '杭州', status: '已发布', score: 4.8, views: 1256, date: '2024-06-12' },
  { id: '2', title: '上海浦东·新中式复式', city: '上海', status: '审核中', score: 0, views: 892, date: '2024-06-10' },
  { id: '3', title: '北京朝阳·北欧风格两居室', city: '北京', status: '已发布', score: 4.6, views: 2341, date: '2024-06-08' },
  { id: '4', title: '深圳南山·轻奢风格四居室', city: '深圳', status: '草稿', score: 0, views: 0, date: '2024-06-05' },
  { id: '5', title: '成都锦江·日式禅意三居', city: '成都', status: '已发布', score: 4.9, views: 1580, date: '2024-06-01' },
  { id: '6', title: '广州天河·现代简约两居', city: '广州', status: '已驳回', score: 3.2, views: 0, date: '2024-05-28' },
  { id: '7', title: '武汉武昌·法式浪漫四居', city: '武汉', status: '已发布', score: 4.7, views: 2100, date: '2024-05-20' },
];

const todoList = [
  { id: '1', type: '完善资料', title: '深圳南山·轻奢风格四居室', desc: '需要补充水电图纸和验收照片', priority: 'high', time: '2天前' },
  { id: '2', type: '评分反馈', title: '杭州滨江·现代简约三居室', desc: '平台质检评分 4.8，查看详情', priority: 'medium', time: '3天前' },
  { id: '3', type: '完善资料', title: '上海浦东·新中式复式', desc: '案例描述信息不完整，请补充', priority: 'high', time: '5天前' },
  { id: '4', type: '评分反馈', title: '北京朝阳·北欧风格两居室', desc: '用户评分 4.6，获得 12 条评论', priority: 'low', time: '1周前' },
];

export default function DesignerDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, clearUser } = useAppStore();

  const stats = [
    { label: '累计案例数', value: 36, icon: FileText, color: 'from-teal-500 to-cyan-600', change: '+3' },
    { label: '本月新增', value: 9, icon: Plus, color: 'from-blue-500 to-indigo-600', change: '+2' },
    { label: '平均质量评分', value: 4.8, icon: Star, color: 'from-amber-500 to-orange-600', change: '+0.2' },
    { label: '总浏览量', value: 12856, icon: Eye, color: 'from-rose-500 to-pink-600', change: '+12%' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                {stat.change} <span className="text-gray-400">较上月</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">最近6个月案例上传趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#0F766E"
                  strokeWidth={3}
                  dot={{ fill: '#0F766E', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="案例数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">各风格占比</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={styleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {styleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">最近案例</h2>
            <button
              onClick={() => setActiveMenu('cases')}
              className="text-sm text-primary hover:text-primary-600 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCases.map((c) => (
              <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                <img src={c.cover} alt={c.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{c.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{c.city}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {c.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {c.date}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    c.status === '已发布'
                      ? 'bg-green-50 text-green-700'
                      : c.status === '审核中'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">待办事项</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {todoList.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === '完善资料' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {item.type === '完善资料' ? <AlertCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          item.priority === 'high'
                            ? 'bg-red-50 text-red-600'
                            : item.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.priority === 'high' ? '紧急' : item.priority === 'medium' ? '重要' : '普通'}
                      </span>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mt-1 text-sm">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCases = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索案例..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>全部状态</option>
            <option>已发布</option>
            <option>审核中</option>
            <option>草稿</option>
            <option>已驳回</option>
          </select>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" />
          新增案例
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">案例标题</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">城市</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">评分</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">浏览量</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">创建时间</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allCases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{c.title}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{c.city}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.status === '已发布'
                          ? 'bg-green-50 text-green-700'
                          : c.status === '审核中'
                          ? 'bg-amber-50 text-amber-700'
                          : c.status === '草稿'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {c.score > 0 ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-4 h-4 fill-current" />
                        {c.score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{c.views.toLocaleString()}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm">{c.date}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary-50 rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRatings = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">评分中心</h3>
      <p className="text-gray-500">查看案例质量评分和用户反馈</p>
    </div>
  );

  const renderNotifications = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">消息通知</h3>
      <p className="text-gray-500">查看系统通知和消息</p>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">设置</h3>
      <p className="text-gray-500">账号设置和偏好配置</p>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'cases': return renderCases();
      case 'ratings': return renderRatings();
      case 'notifications': return renderNotifications();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${
          sidebarOpen ? '' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg font-heading">
            <Home className="w-5 h-5 text-primary-400" />
            筑家数据
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white truncate">
                {user?.nickname || '张设计师'}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-green-400" />
                已认证设计师
              </div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === item.id
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <button
            onClick={() => clearUser()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 font-heading">
              {menuItems.find((m) => m.id === activeMenu)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-56"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.nickname?.[0] || '张'}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <User className="w-4 h-4" /> 个人资料
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> 账号设置
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => clearUser()}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
