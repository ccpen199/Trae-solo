import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, HeartPulse, UserCog, ScanFace, CreditCard, Check, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

const ROLES: { key: UserRole; icon: typeof Users; desc: string; account: string; password: string }[] = [
  { key: 'insured', icon: Users, desc: '社保参保与权益查询', account: 'zhangming', password: '123456' },
  { key: 'employed', icon: Briefcase, desc: '就业登记与失业保障', account: 'lifang', password: '123456' },
  { key: 'retired', icon: HeartPulse, desc: '养老金领取与认证', account: 'wangjianguo', password: '123456' },
  { key: 'agent', icon: UserCog, desc: '业务经办与审核', account: 'zhaoxiaohong', password: '123456' },
]

function DecorativePattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M0 40h30M50 40h30M40 0v30M40 50v30" stroke="#C9A84C" strokeWidth="0.8" fill="none" />
          <circle cx="40" cy="40" r="3" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
          <circle cx="0" cy="40" r="2" fill="#C9A84C" />
          <circle cx="80" cy="40" r="2" fill="#C9A84C" />
          <circle cx="40" cy="0" r="2" fill="#C9A84C" />
          <circle cx="40" cy="80" r="2" fill="#C9A84C" />
          <rect x="32" y="32" width="16" height="16" rx="2" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)" />
      <line x1="10%" y1="30%" x2="60%" y2="10%" stroke="#C9A84C" strokeWidth="0.5" opacity="0.3" />
      <line x1="20%" y1="80%" x2="70%" y2="50%" stroke="#C9A84C" strokeWidth="0.5" opacity="0.2" />
      <circle cx="50%" cy="25%" r="60" fill="none" stroke="#C9A84C" strokeWidth="0.4" opacity="0.15" />
      <circle cx="50%" cy="25%" r="100" fill="none" stroke="#C9A84C" strokeWidth="0.3" opacity="0.1" />
    </svg>
  )
}

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
              i < current ? 'bg-gov-gold text-white' : i === current ? 'bg-gov-blue text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`w-8 h-0.5 transition-colors duration-300 ${i < current ? 'bg-gov-gold' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-gov-blue-dark">{labels[current] ?? ''}</p>
    </div>
  )
}

function Step0RoleSelect({ onSelect }: { onSelect: (role: UserRole) => void }) {
  const [hovered, setHovered] = useState<UserRole | null>(null)

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-lg font-semibold text-gov-blue-dark mb-1">选择您的身份</h2>
      <p className="text-xs text-gray-500 mb-5">请选择与您社保身份相符的角色进入认证</p>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(({ key, icon: Icon, desc }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              hovered === key
                ? 'border-gov-gold bg-gov-gold/5 shadow-card-hover -translate-y-0.5'
                : 'border-gray-200 bg-white hover:border-gov-gold/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
              hovered === key ? 'bg-gov-gold/15 text-gov-gold-dark' : 'bg-gov-blue/8 text-gov-blue'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm text-gov-blue-dark">{ROLE_LABELS[key]}</span>
            <span className="text-[10px] text-gray-400">{desc}</span>
            <ChevronRight className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-200 ${
              hovered === key ? 'text-gov-gold opacity-100' : 'text-gray-300 opacity-0'
            }`} />
          </button>
        ))}
      </div>
    </div>
  )
}

function Step1AccountPassword({
  role,
  onVerified,
  onBack,
}: {
  role: UserRole
  onVerified: () => void
  onBack: () => void
}) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const expected = ROLES.find((r) => r.key === role)!

  const handleSubmit = () => {
    setError('')
    if (!account.trim()) { setError('请输入账号'); return }
    if (!password.trim()) { setError('请输入密码'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (account.trim() === expected.account && password === expected.password) {
        onVerified()
      } else {
        setError('账号或密码错误，请重新输入')
      }
    }, 800)
  }

  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gov-blue mb-4 flex items-center gap-1">
        <ChevronRight className="w-3 h-3 rotate-180" />返回选择角色
      </button>
      <h2 className="text-lg font-semibold text-gov-blue-dark mb-1">账号密码登录</h2>
      <p className="text-xs text-gray-500 mb-5">
        当前身份：<span className="text-gov-gold font-medium">{ROLE_LABELS[role]}</span>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">账号</label>
          <input
            value={account}
            onChange={(e) => { setAccount(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={`请输入账号（演示：${expected.account}）`}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">密码</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="请输入密码（演示：123456）"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="gov-btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? '验证中...' : '验证账号密码'}
      </button>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-[10px] text-blue-600 leading-relaxed">
          演示环境账号密码：{expected.account} / 123456。生产环境须使用社保卡号+实名密码登录，并配合双因子认证。
        </p>
      </div>
    </div>
  )
}

function Step2DualAuth({ onVerified, onBack }: { onVerified: () => void; onBack: () => void }) {
  const [bioVerified, setBioVerified] = useState(false)
  const [cardVerified, setCardVerified] = useState(false)
  const [bioScanning, setBioScanning] = useState(false)
  const [cardScanning, setCardScanning] = useState(false)

  useEffect(() => {
    if (bioVerified && cardVerified) {
      const t = setTimeout(onVerified, 600)
      return () => clearTimeout(t)
    }
  }, [bioVerified, cardVerified, onVerified])

  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gov-blue mb-4 flex items-center gap-1">
        <ChevronRight className="w-3 h-3 rotate-180" />返回
      </button>
      <h2 className="text-lg font-semibold text-gov-blue-dark mb-1">双重身份认证</h2>
      <p className="text-xs text-gray-500 mb-5">请依次完成生物识别和社保卡芯片认证</p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => { if (!bioVerified && !bioScanning) { setBioScanning(true); setTimeout(() => { setBioScanning(false); setBioVerified(true) }, 2000) } }}
          disabled={bioVerified || bioScanning}
          className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            bioVerified ? 'border-status-success bg-status-success/5' : bioScanning ? 'border-gov-gold bg-gov-gold/5' : 'border-gray-200 bg-white hover:border-gov-gold/50 cursor-pointer'
          }`}
        >
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            {bioScanning && <div className="absolute inset-0 rounded-full border-2 border-gov-gold animate-pulse" />}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
              bioVerified ? 'bg-status-success/15 text-status-success' : bioScanning ? 'bg-gov-gold/15 text-gov-gold' : 'bg-gov-blue/8 text-gov-blue'
            }`}>
              {bioVerified ? <Check className="w-5 h-5" /> : <ScanFace className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex-1">
            <p className={`font-medium text-sm ${bioVerified ? 'text-status-success' : 'text-gov-blue-dark'}`}>
              {bioVerified ? '生物识别通过' : '人脸生物识别'}
            </p>
            <p className="text-xs text-gray-400">
              {bioVerified ? '身份已确认' : bioScanning ? '正在进行面部扫描认证...' : '点击开始人脸识别'}
            </p>
          </div>
        </button>

        <button
          onClick={() => { if (!cardVerified && !cardScanning) { setCardScanning(true); setTimeout(() => { setCardScanning(false); setCardVerified(true) }, 1800) } }}
          disabled={cardVerified || cardScanning}
          className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            cardVerified ? 'border-status-success bg-status-success/5' : cardScanning ? 'border-gov-gold bg-gov-gold/5' : 'border-gray-200 bg-white hover:border-gov-gold/50 cursor-pointer'
          }`}
        >
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            {cardScanning && <div className="absolute inset-0 rounded-full border-2 border-gov-gold animate-pulse" />}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
              cardVerified ? 'bg-status-success/15 text-status-success' : cardScanning ? 'bg-gov-gold/15 text-gov-gold' : 'bg-gov-blue/8 text-gov-blue'
            }`}>
              {cardVerified ? <Check className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex-1">
            <p className={`font-medium text-sm ${cardVerified ? 'text-status-success' : 'text-gov-blue-dark'}`}>
              {cardVerified ? '芯片读取通过' : '社保卡芯片读取'}
            </p>
            <p className="text-xs text-gray-400">
              {cardVerified ? '社保卡已验证' : cardScanning ? '正在读取社保卡芯片信息...' : '点击模拟芯片读取'}
            </p>
          </div>
        </button>
      </div>

      {bioVerified && cardVerified && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fade-in-up">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-xs text-green-700 font-medium">双因子认证通过，正在进入工作台...</span>
        </div>
      )}
    </div>
  )
}

function Step3Success({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex flex-col items-center justify-center py-10 animate-bounce-in">
      <div className="w-16 h-16 rounded-full bg-status-success/15 flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-status-success" />
      </div>
      <h2 className="text-xl font-bold text-status-success mb-1">认证成功</h2>
      <p className="text-sm text-gray-500">正在进入角色工作台...</p>
      <div className="mt-4 w-28 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-status-success rounded-full animate-[progress_1.2s_ease-out_forwards]" />
      </div>
    </div>
  )
}

const STEP_LABELS = ['选择身份角色', '账号密码验证', '双因子认证', '认证完成']

export default function Login() {
  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep(1)
  }

  const handleAccountVerified = () => {
    setStep(2)
  }

  const handleDualAuthVerified = useCallback(() => {
    setStep(3)
  }, [])

  const handleDone = useCallback(() => {
    if (selectedRole) {
      login(selectedRole)
      navigate('/dashboard')
    }
  }, [selectedRole, login, navigate])

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[55%] relative bg-gradient-to-br from-gov-blue-dark via-gov-blue to-gov-blue-light flex flex-col items-center justify-center overflow-hidden">
        <DecorativePattern />
        <div className="relative z-10 text-center px-12">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gov-gold/20 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <rect x="4" y="4" width="32" height="32" rx="4" fill="none" stroke="#C9A84C" strokeWidth="2" />
              <path d="M12 20h16M20 12v16" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
              <circle cx="20" cy="20" r="6" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-wider mb-2">
            社保服务一体化工作台
          </h1>
          <p className="text-gov-gold-light/80 text-sm tracking-widest font-light">
            全国统一社保核心服务平台
          </p>
          <div className="mt-10 space-y-3">
            {[
              { icon: '🔒', text: '生物识别+社保卡芯片 双因子实名认证' },
              { icon: '🛡️', text: '个人数据仅本人可查 经办员按行政区划授权' },
              { icon: '📋', text: '操作留痕全程可追溯 异常登录实时风控' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/50 text-xs">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 left-0 right-0 text-center text-white/20 text-xs">
          © 中华人民共和国人力资源和社会保障部
        </div>
      </div>

      <div className="w-[45%] bg-surface-primary flex items-center justify-center px-10">
        <div className="w-full max-w-sm">
          <div className="mb-1 text-xs text-gray-400 tracking-wider">统一身份认证</div>
          <StepIndicator current={step} total={4} labels={STEP_LABELS} />

          {step === 0 && <Step0RoleSelect onSelect={handleRoleSelect} />}
          {step === 1 && selectedRole && (
            <Step1AccountPassword
              role={selectedRole}
              onVerified={handleAccountVerified}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <Step2DualAuth
              onVerified={handleDualAuthVerified}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && <Step3Success onDone={handleDone} />}
        </div>
      </div>
    </div>
  )
}
