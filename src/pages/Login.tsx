import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Stethoscope, User, Lock, Phone, Award, MapPin, Heart, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

type Tab = 'login' | 'register';

export default function Login() {
  const [tab, setTab] = useState<Tab>('login');
  const [role, setRole] = useState<'nurse' | 'family'>('nurse');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    role: 'nurse' as 'nurse' | 'family',
    license_number: '',
    qualification: '',
    patient_name: '',
    address: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const user = await login(loginForm.username, loginForm.password);
      setSuccess(true);
      const map: Record<string, string> = {
        nurse: '/nurse/dashboard',
        family: '/family/dashboard',
        admin: '/admin/dashboard',
        regulator: '/admin/dashboard',
      };
      setTimeout(() => {
        navigate(map[user.role] || '/login');
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data: Record<string, string> = {
        username: regForm.username,
        password: regForm.password,
        name: regForm.name,
        phone: regForm.phone,
        role: regForm.role,
      };
      if (regForm.role === 'nurse') {
        data.license_number = regForm.license_number;
        data.qualification = regForm.qualification;
      } else {
        data.patient_name = regForm.patient_name;
        data.address = regForm.address;
      }
      const user = await register(data);
      const map: Record<string, string> = {
        nurse: '/nurse/dashboard',
        family: '/family/dashboard',
      };
      navigate(map[user.role] || '/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const updateReg = (field: string, value: string) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 animate-fadeIn">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#0F6CBD] flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">护理服务平台</h1>
            <p className="text-xs text-gray-500">专业医护 · 安心服务</p>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); setSuccess(false); }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === 'login'
                ? 'border-[#0F6CBD] text-[#0F6CBD]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            账号登录
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); setSuccess(false); }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === 'register'
                ? 'border-[#0F6CBD] text-[#0F6CBD]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            新用户注册
          </button>
        </div>

        {tab === 'login' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
            <div className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              演示账号一览
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-blue-700">
              <div className="flex justify-between"><span>管理员</span><code className="bg-blue-100 px-1.5 rounded text-xs">admin/admin123</code></div>
              <div className="flex justify-between"><span>平台运营</span><code className="bg-blue-100 px-1.5 rounded text-xs">platform/platform123</code></div>
              <div className="flex justify-between"><span>医疗机构</span><code className="bg-blue-100 px-1.5 rounded text-xs">hospital/hospital123</code></div>
              <div className="flex justify-between"><span>运维</span><code className="bg-blue-100 px-1.5 rounded text-xs">ops/ops123</code></div>
              <div className="flex justify-between"><span>监管员</span><code className="bg-blue-100 px-1.5 rounded text-xs">regulator/regulator123</code></div>
              <div className="flex justify-between"><span>护士</span><code className="bg-blue-100 px-1.5 rounded text-xs">nurse1/nurse123</code></div>
              <div className="flex justify-between"><span>家属</span><code className="bg-blue-100 px-1.5 rounded text-xs">family1/family123</code></div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">登录成功！</div>
              <div className="text-green-600 text-xs">正在跳转到工作台...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">登录失败</div>
              <div className="text-red-600">{error}</div>
            </div>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:border-transparent transition-all"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:border-transparent transition-all"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#0F6CBD] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0D5DA8] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在验证身份...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  登录成功
                </>
              ) : (
                '立即登录'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setRole('nurse'); updateReg('role', 'nurse'); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  role === 'nurse'
                    ? 'bg-[#0F6CBD] text-white border-[#0F6CBD] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#0F6CBD]'
                }`}
              >
                护士注册
              </button>
              <button
                type="button"
                onClick={() => { setRole('family'); updateReg('role', 'family'); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  role === 'family'
                    ? 'bg-[#0F6CBD] text-white border-[#0F6CBD] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#0F6CBD]'
                }`}
              >
                家属注册
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={regForm.username}
                  onChange={(e) => updateReg('username', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                  placeholder="用户名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={regForm.password}
                  onChange={(e) => updateReg('password', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                  placeholder="密码"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={(e) => updateReg('name', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                  placeholder="真实姓名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => updateReg('phone', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                    placeholder="手机号"
                    required
                  />
                </div>
              </div>
            </div>

            {role === 'nurse' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">护士执业证号</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={regForm.license_number}
                      onChange={(e) => updateReg('license_number', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                      placeholder="请输入护士执业证书编号"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">资质等级</label>
                  <select
                    value={regForm.qualification}
                    onChange={(e) => updateReg('qualification', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                    required
                  >
                    <option value="">请选择资质等级</option>
                    <option value="registered_nurse">注册护士</option>
                    <option value="senior_nurse">主管护师</option>
                    <option value="deputy_chief_nurse">副主任护师</option>
                    <option value="chief_nurse">主任护师</option>
                  </select>
                </div>
              </>
            )}

            {role === 'family' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">患者姓名</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={regForm.patient_name}
                      onChange={(e) => updateReg('patient_name', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                      placeholder="患者真实姓名"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务地址</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={regForm.address}
                      onChange={(e) => updateReg('address', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                      placeholder="患者详细居住地址"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F6CBD] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0D5DA8] disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  注册中...
                </>
              ) : (
                '提交注册'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
