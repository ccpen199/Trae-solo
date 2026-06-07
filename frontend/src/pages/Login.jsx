import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { authAPI } from '../api/client'
import useAuthStore from '../store/authStore'

const roleOptions = [
  {
    value: 'user',
    label: '职场人',
    icon: UserIcon,
    description: '社保测算 / AI面试 / 法律咨询 / 福利商城',
    gradient: 'from-blue-500 to-indigo-600',
    activeGradient: 'from-blue-600 to-indigo-700',
  },
  {
    value: 'enterprise',
    label: '企业HR',
    icon: BuildingOffice2Icon,
    description: '员工管理 / 社保开户 / 合规巡检 / 风险预警',
    gradient: 'from-emerald-500 to-teal-600',
    activeGradient: 'from-emerald-600 to-teal-700',
  },
  {
    value: 'admin',
    label: '福利商城运营',
    icon: Cog6ToothIcon,
    description: '商品上架 / 订单审核 / 审计日志 / 用户管理',
    gradient: 'from-amber-500 to-orange-600',
    activeGradient: 'from-amber-600 to-orange-700',
  },
]

const stepLabels = {
  role: '选择身份',
  credentials: '账号密码',
  twofa: '二次验证',
}

const Login = () => {
  const [step, setStep] = useState('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secondFactorCode, setSecondFactorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tempUserData, setTempUserData] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  const redirectPath = location.state?.from || null

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setError(null)
    setEmail('')
    setPassword('')
    setTimeout(() => {
      setStep('credentials')
    }, 200)
  }

  const goToNextStep = (nextStep) => {
    setStep(nextStep)
    setError(null)
  }

  const goToPrevStep = () => {
    if (step === 'credentials') {
      setStep('role')
      setSelectedRole('')
    } else if (step === 'twofa') {
      setStep('credentials')
      setSecondFactorCode('')
    }
    setError(null)
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authAPI.login(email, password, selectedRole)
      const { user, token, redirectUrl, permissions } = res.data
      setTempUserData({ user, token, redirectUrl, permissions })
      goToNextStep('twofa')
    } catch (err) {
      const errData = err.response?.data || {}
      setError({
        title: getErrorTitle(errData.code),
        message: errData.message || '登录失败，请检查邮箱和密码',
        suggestion: errData.suggestion,
        code: errData.code,
        actualRole: errData.actualRole,
      })
      if (errData.code === 'ROLE_MISMATCH' && errData.actualRole) {
        setTimeout(() => {
          setSelectedRole(errData.actualRole)
          setStep('credentials')
          setError(null)
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  const getErrorTitle = (code) => {
    const titles = {
      USER_NOT_FOUND: '账号不存在',
      WRONG_PASSWORD: '密码验证失败',
      ROLE_MISMATCH: '身份不匹配',
      MISSING_CREDENTIALS: '请完善信息',
      SYSTEM_ERROR: '系统异常',
    }
    return titles[code] || '登录失败'
  }

  const getErrorIcon = (code) => {
    if (code === 'ROLE_MISMATCH') return InformationCircleIcon
    return ExclamationTriangleIcon
  }

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (tempUserData) {
        login(tempUserData.user, tempUserData.token, tempUserData.permissions)
      }
      await authAPI.verify2FA(secondFactorCode)
      const targetPath = redirectPath || tempUserData?.redirectUrl || '/'
      navigate(targetPath, { replace: true })
    } catch (err) {
      const errData = err.response?.data || {}
      logout()
      setError({
        title: '二次验证失败',
        message: errData.message || '验证码不正确',
        suggestion: '测试环境默认验证码为 123456',
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = ['role', 'credentials', 'twofa']
    const currentIndex = steps.indexOf(step)

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                idx < currentIndex
                  ? 'bg-green-500 text-white'
                  : idx === currentIndex
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {idx < currentIndex ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                idx + 1
              )}
            </div>
            <span className={`text-sm font-medium ${
              idx === currentIndex ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              {stepLabels[s]}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${
                idx < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">职场助手</h1>
          <p className="text-indigo-300">全生命周期数字平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {renderStepIndicator()}

          {error && (
            <div className={`mb-6 p-4 rounded-lg border ${
              error.code === 'ROLE_MISMATCH'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex gap-3">
                {(() => {
                  const Icon = getErrorIcon(error.code)
                  return <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    error.code === 'ROLE_MISMATCH' ? 'text-blue-600' : 'text-red-600'
                  }`} />
                })()}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${
                    error.code === 'ROLE_MISMATCH' ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {error.title}
                  </p>
                  <p className={`text-sm ${
                    error.code === 'ROLE_MISMATCH' ? 'text-blue-700' : 'text-red-700'
                  }`}>
                    {error.message}
                  </p>
                  {error.suggestion && (
                    <p className={`text-sm mt-1 ${
                      error.code === 'ROLE_MISMATCH' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      💡 {error.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'role' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">选择您的身份</h2>
              <p className="text-sm text-gray-500 mb-6">
                不同身份将进入不同的业务工作台，获得专属服务</p>

              <div className="space-y-3">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelect(role.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === role.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <role.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{role.label}</p>
                          {selectedRole === role.value && (
                            <CheckCircleIcon className="w-4 h-4 text-indigo-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'credentials' && (
            <div>
              <button
                onClick={goToPrevStep}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                返回选择身份
              </button>

              <h2 className="text-xl font-bold text-gray-800 mb-6">
                登录「{roleOptions.find(r => r.value === selectedRole)?.label}」工作台</h2>

              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="请输入邮箱"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="请输入密码"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <div className="flex gap-3">
                      <ShieldCheckIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-indigo-800">敏感操作保护</p>
                        <p className="text-sm text-indigo-600 mt-1">
                          为保障您的账号安全，登录后需完成二次验证
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors"
                  >
                    {loading ? '验证中...' : '验证账号'}
                  </button>
                </form>
              </div>
            )}

          {step === 'twofa' && (
            <div>
              <button
                onClick={goToPrevStep}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                返回账号验证
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">二次验证</h2>
                <p className="text-sm text-gray-500 mt-1">请输入6位验证码以完成登录</p>
              </div>

              <form onSubmit={handleTwoFactorSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">验证码</label>
                  <input
                    type="text"
                    value={secondFactorCode}
                    onChange={(e) => setSecondFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-widest py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-mono"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">操作水印提示</p>
                      <p className="text-sm text-amber-700">
                        本次登录将生成操作水印（SHA-256哈希），包含您的身份信息和时间戳，全链路可追溯
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">测试环境：</span>
                    验证码为 <span className="font-mono font-bold text-indigo-600">123456</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || secondFactorCode.length < 6}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
                >
                  {loading ? '登录中...' : '完成登录'}
                </button>
              </form>
            </div>
          )}

          {step === 'role' && (
            <p className="mt-6 text-center text-sm text-gray-500">
              还没有账号？{' '}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                立即注册
              </Link>
            </p>
          )}
        </div>

        {tempUserData?.user && (
          <div className="mt-4 text-center text-indigo-200 text-sm">
            欢迎 <span className="font-medium">{tempUserData.user.name}</span>
            ，您将进入
            <span className="font-medium">「{tempUserData.user.roleName}」</span>
            工作台
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
