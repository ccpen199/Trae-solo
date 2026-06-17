import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Phone, Lock, Eye, EyeOff, User, Zap, Store, Shield, AlertCircle, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi, type LoginParams } from '../../services/auth.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../components/ui/Toast';
import type { UserRole } from '../../types';

const roleRouteMap: Record<UserRole, string> = { user: '/', rider: '/rider', merchant: '/merchant', admin: '/admin' };
const roleLabelMap: Record<UserRole, string> = { user: '用户端', rider: '骑手端', merchant: '商户端', admin: '运营端' };

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [apiError, setApiError] = useState<string | null>(null);
  const [roleMismatch, setRoleMismatch] = useState<{ expected: UserRole; actual: UserRole } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginParams>({
    defaultValues: { phone: '', password: '', role: 'user' },
  });

  const loginMutation = useMutation({
    mutationFn: (params: LoginParams) => authApi.login(params),
    onSuccess: (data) => {
      setApiError(null);
      setRoleMismatch(null);
      const actualRole = data.user.role as UserRole;
      if (actualRole !== selectedRole) {
        setRoleMismatch({ expected: selectedRole, actual: actualRole });
        login(data.token, data.user);
        showToast(`该账号为${roleLabelMap[actualRole]}账号，已为您跳转`, 'warning');
        navigate(roleRouteMap[actualRole]);
        return;
      }
      login(data.token, data.user);
      showToast('登录成功', 'success');
      navigate(roleRouteMap[actualRole]);
    },
    onError: (error: Error) => {
      const msg = error.message || '登录失败';
      setApiError(msg);
      if (msg.includes('不存在')) showToast('该手机号尚未注册', 'error');
      else if (msg.includes('密码错误')) showToast('密码错误，请重新输入', 'error');
      else if (msg.includes('冻结')) showToast('账号已被冻结，请联系客服', 'error');
      else showToast(msg, 'error');
    },
  });

  const onSubmit = (data: LoginParams) => {
    setApiError(null);
    setRoleMismatch(null);
    loginMutation.mutate({ ...data, role: selectedRole });
  };

  const roles: Array<{ key: UserRole; name: string; icon: typeof User; color: string; desc: string; gradient: string }> = [
    { key: 'user', name: '用户端', icon: User, color: 'text-brand-500', desc: '下单·追踪·评价', gradient: 'from-blue-500 to-blue-600' },
    { key: 'rider', name: '骑手端', icon: Zap, color: 'text-amber-500', desc: '接单·配送·收入', gradient: 'from-amber-400 to-amber-500' },
    { key: 'merchant', name: '商户端', icon: Store, color: 'text-green-500', desc: '店铺·商品·订单', gradient: 'from-green-500 to-green-600' },
    { key: 'admin', name: '运营端', icon: Shield, color: 'text-slate-600', desc: '看板·干预·审批', gradient: 'from-slate-700 to-slate-800' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30 mb-4"><Zap className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">闪跑</h1>
          <p className="text-gray-500">同城跑腿服务平台</p>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">欢迎登录</h2>
          <p className="text-sm text-gray-400 text-center mb-6">选择身份进入对应工作台</p>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole === role.key;
              return (
                <button key={role.key} type="button" onClick={() => { setSelectedRole(role.key); setApiError(null); setRoleMismatch(null); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all ${isActive ? `bg-gradient-to-br ${role.gradient} border-2 border-transparent text-white shadow-md` : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : role.color}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>{role.name}</span>
                </button>
              );
            })}
          </div>

          {roleMismatch && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">角色不匹配</p>
                <p className="text-xs text-amber-600 mt-0.5">您选择了「{roleLabelMap[roleMismatch.expected]}」，但该账号为「{roleLabelMap[roleMismatch.actual]}」账号，已自动跳转至对应端</p>
              </div>
            </div>
          )}

          {apiError && !roleMismatch && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">登录失败</p>
                <p className="text-xs text-red-600 mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          {Object.keys(errors).length > 0 && !apiError && (
            <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2">
              <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-600">请检查表单中的错误信息</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" placeholder="请输入手机号" {...register('phone', { required: '请输入手机号', pattern: { value: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' } })}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} placeholder="请输入密码" {...register('password', { required: '请输入密码', minLength: { value: 6, message: '密码至少6位' } })}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-gray-500 hover:text-brand-600">忘记密码？</button>
              <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">注册账号</Link>
            </div>

            <button type="submit" disabled={isSubmitting || loginMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loginMutation.isPending ? '登录中...' : `登录${roleLabelMap[selectedRole]}`}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">测试账号（密码均为 123456）</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">用户：</span><span className="font-mono text-gray-700">13800000001</span></div>
              <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">骑手：</span><span className="font-mono text-gray-700">13800000002</span></div>
              <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">商户：</span><span className="font-mono text-gray-700">13800000005</span></div>
              <div className="p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">管理：</span><span className="font-mono text-gray-700">13800000000</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
