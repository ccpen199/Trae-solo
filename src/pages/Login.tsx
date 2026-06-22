import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, CreditCard, Shield, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { useUserStore, demoUser } from '@/store/user'
import { useToastStore } from '@/store/toast'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { User } from '../../shared/types'

type LoginTab = 'phone' | 'idcard' | 'sso'

interface LoginApiResponse {
  success: boolean
  token: string
  user: User
  error?: string
}

export default function Login() {
  const [activeTab, setActiveTab] = useState<LoginTab>('phone')
  const [phone, setPhone] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [idCard, setIdCard] = useState('')
  const [realName, setRealName] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  const login = useUserStore((state) => state.login)
  const toast = useToastStore((state) => state)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  const validatePhone = (val: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!val) {
      toast.error('请输入手机号')
      return false
    }
    if (!phoneRegex.test(val)) {
      toast.error('请输入正确的11位手机号码')
      return false
    }
    return true
  }

  const validateIdCard = (val: string): boolean => {
    const idRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    if (!val) {
      toast.error('请输入身份证号码')
      return false
    }
    if (!idRegex.test(val)) {
      toast.error('请输入正确的15或18位身份证号码')
      return false
    }
    return true
  }

  const validateVerifyCode = (val: string): boolean => {
    if (!val) {
      toast.error('请输入验证码')
      return false
    }
    if (val.length < 4) {
      toast.error('验证码至少4位')
      return false
    }
    return true
  }

  const validateRealName = (val: string): boolean => {
    if (!val || val.trim().length < 2) {
      toast.error('请输入真实姓名')
      return false
    }
    return true
  }

  const handleGetCode = async () => {
    if (countdown > 0 || loading) return
    if (!validatePhone(phone)) return

    setLoading(true)
    try {
      const res = await api.post('/auth/send-code', { phone })
      if (res.data?.success) {
        toast.success('验证码已发送，测试验证码：123456')
        setCodeSent(true)
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(res.data?.error || '验证码发送失败')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '网络异常，请稍后重试'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (type: LoginTab) => {
    if (loading) return

    if (type === 'phone') {
      if (!validatePhone(phone) || !validateVerifyCode(verifyCode)) return
      if (!codeSent) {
        toast.warning('请先获取验证码')
        return
      }
    } else if (type === 'idcard') {
      if (!validateIdCard(idCard) || !validateRealName(realName)) return
    }

    setLoading(true)
    try {
      let payload: Record<string, string> = {}
      if (type === 'phone') {
        payload = { phone, verifyCode }
      } else if (type === 'idcard') {
        payload = { idCard, realName }
      } else {
        payload = { ssoToken: 'sso-demo-token' }
      }

      const res = await api.post<LoginApiResponse>('/auth/login', payload)
      const data = res.data

      if (!data?.success) {
        throw new Error(data?.error || '登录失败')
      }

      if (!data.token || !data.user) {
        throw new Error('登录数据异常，请重试')
      }

      login(data.user, data.token)
      toast.success(`欢迎回来，${data.user.name}！`)
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || '登录失败，请检查网络'
      toast.error(errorMsg)
      console.error('[Login Error]:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    if (loading) return
    setLoading(true)
    try {
      await api.post('/auth/send-code', { phone: '13800138000' })
      const res = await api.post<LoginApiResponse>('/auth/login', {
        phone: '13800138000',
        verifyCode: '123456',
      })
      if (res.data?.success && res.data.user && res.data.token) {
        login(res.data.user, res.data.token)
        toast.success(`欢迎回来，${res.data.user.name}！`)
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 300)
      } else {
        login(demoUser, 'demo-token')
        toast.success('演示账号登录成功')
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 300)
      }
    } catch {
      login(demoUser, 'demo-token')
      toast.success('演示账号登录成功')
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: LoginTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'phone', label: '手机号登录', icon: Phone },
    { key: 'idcard', label: '身份证登录', icon: CreditCard },
    { key: 'sso', label: '省级SSO', icon: Shield },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 40%)
          `,
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        <svg
          viewBox="0 0 1440 200"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyline" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#skyline)"
            d="M0,200 L0,140 L40,140 L40,110 L80,110 L80,130 L120,130 L120,90 L160,90 L160,70 L200,70 L200,100 L240,100 L240,60 L280,60 L280,40 L320,40 L320,80 L360,80 L360,120 L400,120 L400,50 L440,50 L440,30 L480,30 L480,70 L520,70 L520,100 L560,100 L560,60 L600,60 L600,20 L640,20 L640,50 L680,50 L680,90 L720,90 L720,110 L760,110 L760,40 L800,40 L800,70 L840,70 L840,30 L880,30 L880,60 L920,60 L920,100 L960,100 L960,80 L1000,80 L1000,50 L1040,50 L1040,90 L1080,90 L1080,120 L1120,120 L1120,70 L1160,70 L1160,40 L1200,40 L1200,80 L1240,80 L1240,110 L1280,110 L1280,60 L1320,60 L1320,100 L1360,100 L1360,130 L1400,130 L1400,150 L1440,150 L1440,200 Z"
          />
          <circle cx="1100" cy="60" r="8" fill="rgba(255,255,255,0.15)" />
          <rect x="1096" y="68" width="8" height="30" fill="rgba(255,255,255,0.08)" />
        </svg>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 ring-1 ring-white/20">
              <span className="text-white font-bold text-2xl">长</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">长沙城市服务</h1>
            <p className="text-white/60 text-sm">让城市服务触手可及</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 ring-1 ring-white/20 shadow-2xl">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key)
                      setCodeSent(false)
                    }}
                    disabled={loading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all',
                      activeTab === tab.key
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.replace('登录', '').replace('省级', '')}</span>
                  </button>
                )
              })}
            </div>

            {activeTab === 'phone' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">手机号</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">验证码</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="请输入验证码"
                        maxLength={6}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleGetCode}
                      disabled={countdown > 0 || loading || !phone}
                      className={cn(
                        'h-12 px-4 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                        countdown > 0 || loading || !phone
                          ? 'bg-white/5 text-white/40 cursor-not-allowed'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin inline mr-1" />}
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleLogin('phone')}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      登录
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'idcard' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">证件号码</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={idCard}
                      onChange={(e) => setIdCard(e.target.value.toUpperCase().slice(0, 18))}
                      placeholder="请输入身份证号码"
                      maxLength={18}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">姓名</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                    </svg>
                    <input
                      type="text"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="请输入真实姓名"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleLogin('idcard')}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      登录
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'sso' && (
              <div className="space-y-5">
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/20 mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-medium mb-1">湖南省政务服务网统一认证</h3>
                  <p className="text-white/50 text-sm">使用省级政务服务账号安全登录</p>
                </div>
                <button
                  onClick={() => handleLogin('sso')}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:from-red-600 hover:to-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      跳转中...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      湖南省政务服务网登录
                    </>
                  )}
                </button>
                <p className="text-center text-white/40 text-xs">
                  登录即表示同意《用户服务协议》和《隐私政策》
                </p>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-transparent text-xs text-white/40">或</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:from-amber-500 hover:to-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              演示账号一键登录
            </button>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            © 2024 长沙市数据局 · 长沙城市服务平台
          </p>
        </div>
      </div>
    </div>
  )
}
