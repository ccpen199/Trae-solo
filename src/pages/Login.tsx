import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  User,
  Lock,
  ShoppingCart,
  DollarSign,
  Users,
  BarChart3,
  Shield,
  Building2,
  CheckCircle,
  AlertCircle,
  Store
} from 'lucide-react';

interface RoleCard {
  role: string;
  username: string;
  password: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
  todos: string[];
}

const roleCards: RoleCard[] = [
  {
    role: 'cashier',
    username: 'cashier01',
    password: '123456',
    label: '收银员',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'from-yellow-500 to-yellow-600',
    description: '日常收银、订单管理、交接班',
    features: ['收银台下单', '订单查询', '交接班管理', '会员查询'],
    todos: ['开始交班', '核对实收金额', '完成日结交班']
  },
  {
    role: 'store_manager',
    username: 'manager01',
    password: '123456',
    label: '门店店长',
    icon: <Store className="w-6 h-6" />,
    color: 'from-green-500 to-green-600',
    description: '门店日常运营、复核审批',
    features: ['退款审核', '交班复核', '门店数据查看', '商品管理'],
    todos: ['审核待退款', '复核交班差异', '确认门店日结', '处理异常订单']
  },
  {
    role: 'finance',
    username: 'finance01',
    password: '123456',
    label: '财务人员',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    description: '财务对账、报表分析、资金核对',
    features: ['财务对账', '长短款标记', '数据报表', '日结导出'],
    todos: ['完成每日对账', '标记差异项', '导出日结单', '复核异常订单']
  },
  {
    role: 'area_operator',
    username: 'area01',
    password: '123456',
    label: '区域运营',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-orange-500 to-orange-600',
    description: '区域门店数据分析、运营支持',
    features: ['区域数据报表', '多门店对比', '销售趋势分析', '运营指标监控'],
    todos: ['查看区域销售', '分析门店对比', '监控异常指标', '提交运营报告']
  },
  {
    role: 'admin',
    username: 'admin',
    password: '123456',
    label: '系统管理员',
    icon: <Shield className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    description: '系统配置、用户管理、权限控制、操作审计',
    features: ['用户管理', '角色权限', '门店管理', '操作审计', '业务复查'],
    todos: ['配置系统参数', '管理用户权限', '审计操作日志', '复查业务数据']
  }
];

export default function Login() {
  const [username, setUsername] = useState('cashier01');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('cashier');
  const login = useAuthStore(state => state.login);
  const loading = useAuthStore(state => state.loading);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleRoleSelect = (roleCard: RoleCard) => {
    setSelectedRole(roleCard.role);
    setUsername(roleCard.username);
    setPassword(roleCard.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    }
  };

  const getSelectedCard = () => roleCards.find(r => r.role === selectedRole) || roleCards[0];
  const selectedCard = getSelectedCard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              门店收银对账系统
            </h1>
            <p className="text-gray-500 text-lg">
              门店日结 · 财务核对平台
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>订单防篡改</span>
              <span className="mx-2">·</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>财务对账</span>
              <span className="mx-2">·</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>操作审计</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                选择您的身份
              </h2>
              <div className="space-y-3">
                {roleCards.map((card) => (
                  <button
                    key={card.role}
                    onClick={() => handleRoleSelect(card)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedRole === card.role
                        ? `border-transparent bg-gradient-to-r ${card.color} text-white shadow-lg scale-[1.02]`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedRole === card.role
                          ? 'bg-white/20'
                          : 'bg-gray-100'
                      }`}>
                        <span className={selectedRole === card.role ? 'text-white' : 'text-gray-600'}>
                          {card.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          selectedRole === card.role ? 'text-white' : 'text-gray-800'
                        }`}>
                          {card.label}
                        </h3>
                        <p className={`text-sm ${
                          selectedRole === card.role ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {card.description}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedRole === card.role
                          ? 'border-white bg-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedRole === card.role && (
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className={`bg-gradient-to-r ${selectedCard.color} p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      {selectedCard.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCard.label}工作台</h2>
                      <p className="text-white/80 mt-1">{selectedCard.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        功能权限
                      </h3>
                      <div className="space-y-2">
                        {selectedCard.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        待办事项
                      </h3>
                      <div className="space-y-2">
                        {selectedCard.todos.map((todo, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            {todo}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">账号登录</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2 text-gray-400" />
                        用户名
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入用户名"
                        autoComplete="username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="w-4 h-4 inline mr-2 text-gray-400" />
                        密码
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入密码"
                        autoComplete="current-password"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-3.5 px-4 bg-gradient-to-r ${selectedCard.color} hover:opacity-90 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          登录中...
                        </span>
                      ) : (
                        `登录${selectedCard.label}工作台`
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        已为您自动填充测试账号密码
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>门店收银对账系统 v1.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 text-center text-sm text-gray-400">
        <p>© 2024 门店收银对账系统 · 保护您的每一笔交易</p>
      </div>
    </div>
  );
}
