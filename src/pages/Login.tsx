import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Smartphone, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/Button';
import type { LoginProvider } from '../../shared/types';

export default function Login() {
  const [loginType, setLoginType] = useState<'personal' | 'enterprise' | 'government'>('personal');
  const [provider, setProvider] = useState<LoginProvider>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(provider, { phone, password });
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (oauthProvider: LoginProvider) => {
    setLoading(true);
    setError('');

    try {
      const mockCode = `mock_${oauthProvider}_${Date.now()}`;
      const result = await login(oauthProvider, { code: mockCode });
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const quickAccounts = [
    { type: 'personal', phone: '13800138001', password: '123456', label: '个人用户' },
    { type: 'enterprise', phone: '13800138002', password: '123456', label: '企业用户' },
    { type: 'government', phone: '13800138003', password: '123456', label: '基层治理人员' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex-1 lg:block"
        >
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              厦门市民
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                一站式数字服务中枢
              </span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              对接全市30+委办局系统，为市民、企业和基层治理人员提供统一的政务与民生服务入口。
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: '统一身份认证', desc: '闽政通/微信/支付宝OAuth2.0桥接，一次登录全网通行' },
              { title: '数据授权网关', desc: '依场景最小化获取用户数据，保障隐私安全' },
              { title: '服务编排引擎', desc: '将分散接口封装为"一件事"服务，多事项联办' },
              { title: '等保三级', desc: '所有政务数据不出市云，满足国家安全等级保护要求' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">厦门市民</h2>
              <p className="text-sm text-gray-500">一站式数字服务中枢</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">欢迎回来</h2>
              <p className="text-gray-500 text-sm">请选择登录方式以继续</p>
            </div>

            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              {['personal', 'enterprise', 'government'].map((type) => (
                <button
                  key={type}
                  onClick={() => setLoginType(type as typeof loginType)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    loginType === type
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'personal' ? '个人' : type === 'enterprise' ? '企业' : '治理'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              {[
                { key: 'password', label: '账号密码' },
                { key: 'minzhengtong', label: '闽政通' },
                { key: 'wechat', label: '微信' },
                { key: 'alipay', label: '支付宝' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setProvider(p.key as LoginProvider)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    provider === p.key
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {provider === 'password' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    手机号
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  登录
                </Button>
              </form>
            )}

            {provider !== 'password' && (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => handleOAuthLogin(provider)}
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  使用{provider === 'minzhengtong' ? '闽政通' : provider === 'wechat' ? '微信' : '支付宝'}登录
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  跳转到{provider === 'minzhengtong' ? '闽政通' : provider === 'wechat' ? '微信' : '支付宝'}完成授权后自动登录
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">快速体验账号：</p>
              <div className="space-y-2">
                {quickAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLoginType(acc.type as typeof loginType);
                      setPhone(acc.phone);
                      setPassword(acc.password);
                      setProvider('password');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
                  >
                    <span className="text-gray-600">
                      <span className="font-medium text-gray-800">{acc.label}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      {acc.phone}
                    </span>
                    <span className="text-gray-400">点击填充</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            登录即表示同意《用户服务协议》和《隐私政策》
            <br />
            本系统通过等保三级认证，所有数据加密传输存储
          </p>
        </motion.div>
      </div>
    </div>
  );
}
