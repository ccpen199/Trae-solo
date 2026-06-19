import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Building2,
  ScanFace,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  Heart,
  GraduationCap,
  CreditCard,
  Users,
  FileText,
  FileCheck,
  Clock,
  Tag,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

type Role = 'personal' | 'enterprise' | 'admin'
type LoginStep = 'id' | 'biometric' | 'verify' | 'complete'
type AuthMethod = 'face' | 'fingerprint'

const mockPoliceVerify = (idNumber: string, faceScore: number): Promise<{ passed: boolean; riskLevel: 'low' | 'medium' | 'high'; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (faceScore >= 85 && idNumber.replace(/\*/g, '').length >= 6) {
        resolve({
          passed: true,
          riskLevel: 'low',
          message: '公安人口库比对通过 · 人脸匹配度 96.8% · 身份核验一致',
        })
      } else if (faceScore >= 70) {
        resolve({
          passed: true,
          riskLevel: 'medium',
          message: '公安人口库比对通过 · 人脸匹配度 78.3% · 建议二次活体检测',
        })
      } else {
        resolve({
          passed: false,
          riskLevel: 'high',
          message: '公安人口库比对未通过 · 人脸匹配度不足 · 请确认信息后重试',
        })
      }
    }, 2200)
  })
}

const mockEnterpriseVerify = (creditCode: string): Promise<{ passed: boolean; companyName: string; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (creditCode.length >= 15) {
        resolve({
          passed: true,
          companyName: '江苏信达科技有限公司',
          message: '统一社会信用代码核验通过 · 法人授权有效',
        })
      } else {
        resolve({
          passed: false,
          companyName: '',
          message: '信用代码格式不正确，请检查后重试',
        })
      }
    }, 1800)
  })
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAppStore()
  const [role, setRole] = useState<Role>('personal')
  const [step, setStep] = useState<LoginStep>('id')

  useEffect(() => {
    const urlRole = searchParams.get('role')
    if (urlRole === 'personal' || urlRole === 'enterprise' || urlRole === 'admin') {
      setRole(urlRole)
    }
  }, [searchParams])

  const [idNumber, setIdNumber] = useState('')
  const [realName, setRealName] = useState('')
  const [creditCode, setCreditCode] = useState('')
  const [hrName, setHrName] = useState('')

  const [authMethod, setAuthMethod] = useState<AuthMethod>('face')
  const [faceProgress, setFaceProgress] = useState(0)
  const [matchScore, setMatchScore] = useState(0)

  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<null | { passed: boolean; riskLevel: 'low' | 'medium' | 'high'; message: string }>(null)

  const [operationLogs] = useState([
    { time: '2026-06-19 09:15:23', action: '发起登录认证', ip: '117.89.12.34', device: 'Chrome / macOS' },
  ])

  const [showRiskAlert, setShowRiskAlert] = useState(false)

  useEffect(() => {
    if (step === 'biometric' && authMethod === 'face' && !verifying) {
      const timer = setInterval(() => {
        setFaceProgress((p) => {
          if (p >= 100) {
            clearInterval(timer)
            return 100
          }
          return p + 2
        })
      }, 80)
      return () => clearInterval(timer)
    }
    if (step === 'biometric' && authMethod === 'fingerprint' && !verifying) {
      const timer = setInterval(() => {
        setFaceProgress((p) => {
          if (p >= 100) {
            clearInterval(timer)
            return 100
          }
          return p + 3
        })
      }, 70)
      return () => clearInterval(timer)
    }
  }, [step, authMethod, verifying])

  useEffect(() => {
    if (faceProgress >= 100 && step === 'biometric' && !verifying) {
      const score = role === 'personal' ? 96.8 : 92.5
      setMatchScore(score)
    }
  }, [faceProgress, step, verifying, role])

  async function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('biometric')
    setFaceProgress(0)
    setMatchScore(0)
  }

  async function handleStartVerify() {
    if (matchScore < 50) return
    setVerifying(true)
    setVerifyResult(null)

    if (role === 'personal') {
      const result = await mockPoliceVerify(idNumber, matchScore)
      setVerifyResult(result)
    } else if (role === 'enterprise') {
      const result = await mockEnterpriseVerify(creditCode)
      setVerifyResult({ passed: result.passed, riskLevel: result.passed ? 'low' : 'high', message: result.message })
    } else {
      const result = await mockPoliceVerify(idNumber, matchScore)
      setVerifyResult({ passed: result.passed, riskLevel: result.riskLevel, message: `管理员权限核验 · ${result.message}` })
    }
    setVerifying(false)
  }

  function handleCompleteLogin() {
    const name = role === 'enterprise' ? hrName : realName
    const idNumberValue = role === 'enterprise' ? creditCode : idNumber
    login({
      name: name || '',
      idNumber: idNumberValue || '',
      role,
      authMethod,
      matchScore,
      riskLevel: verifyResult?.riskLevel || 'low',
    })
    const pathMap = { personal: '/personal', enterprise: '/enterprise', admin: '/admin' }
    navigate(pathMap[role])
  }

  function handleBack() {
    if (step === 'biometric') {
      setStep('id')
      setFaceProgress(0)
      setMatchScore(0)
      setVerifyResult(null)
    } else if (step === 'verify') {
      setStep('biometric')
      setVerifyResult(null)
    } else if (step === 'complete') {
      setStep('verify')
    }
  }

  useEffect(() => {
    if (verifyResult?.passed) {
      setShowRiskAlert(verifyResult.riskLevel !== 'low')
      const t = setTimeout(() => setStep('complete'), 1200)
      return () => clearTimeout(t)
    }
  }, [verifyResult])

  const stepLabels = ['身份信息', '生物识别', '权威核验', '登录完成']
  const stepIndex = { id: 0, biometric: 1, verify: 2, complete: 3 }[step]

  return (
    <div className="min-h-screen bg-gov-bg-light">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gov-text-secondary hover:text-gov-blue mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gov-card overflow-hidden"
        >
          <div className="bg-gov-gradient px-8 py-6 text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="relative z-10">
              <h1 className="font-serif text-2xl font-bold mb-2">省级人社一体化政务服务平台</h1>
              <p className="text-white/70 text-sm">实名认证登录 · 对接公安人口库 & 金保工程核心数据库</p>
            </div>
          </div>

          <div className="flex p-8 gap-8">
            <div className="w-56 shrink-0 border-r border-gov-border pr-8">
              <div className="mb-6">
                <p className="text-xs text-gov-text-secondary mb-2 font-medium">登录身份</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setRole('personal'); setStep('id'); setVerifyResult(null); setFaceProgress(0) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border',
                      role === 'personal'
                        ? 'bg-gov-blue/5 border-gov-blue text-gov-blue font-medium'
                        : 'border-transparent text-gov-text-secondary hover:bg-gov-bg-light'
                    )}
                  >
                    <User className="w-4 h-4" />
                    个人用户
                  </button>
                  <button
                    onClick={() => { setRole('enterprise'); setStep('id'); setVerifyResult(null); setFaceProgress(0) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border',
                      role === 'enterprise'
                        ? 'bg-gov-blue/5 border-gov-blue text-gov-blue font-medium'
                        : 'border-transparent text-gov-text-secondary hover:bg-gov-bg-light'
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                    企业HR
                  </button>
                  <button
                    onClick={() => { setRole('admin'); setStep('id'); setVerifyResult(null); setFaceProgress(0) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border',
                      role === 'admin'
                        ? 'bg-gov-blue/5 border-gov-blue text-gov-blue font-medium'
                        : 'border-transparent text-gov-text-secondary hover:bg-gov-bg-light'
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    管理员
                  </button>
                </div>
              </div>

              <p className="text-xs text-gov-text-secondary mb-2 font-medium">认证步骤</p>
              <div className="space-y-0">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                          i < stepIndex
                            ? 'bg-emerald-500 text-white'
                            : i === stepIndex
                            ? 'bg-gov-blue text-white ring-4 ring-gov-blue/10'
                            : 'bg-gov-border text-gov-text-muted'
                        )}
                      >
                        {i < stepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      {i < stepLabels.length - 1 && (
                        <div
                          className={cn(
                            'w-0.5 h-10 my-0.5',
                            i < stepIndex ? 'bg-emerald-500' : 'bg-gov-border'
                          )}
                        />
                      )}
                    </div>
                    <div className={cn(
                      'pt-0.5 text-sm pb-6',
                      i <= stepIndex ? 'text-gov-text font-medium' : 'text-gov-text-muted'
                    )}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {step === 'id' && (
                  <motion.div
                    key="id"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                  >
                    <h2 className="text-lg font-semibold text-gov-text mb-1">
                      {role === 'personal' ? '填写身份信息' : role === 'enterprise' ? '填写企业信息' : '管理员身份核验'}
                    </h2>
                    <p className="text-sm text-gov-text-secondary mb-6">
                      {role === 'personal'
                        ? '信息将与公安人口库及金保工程参保数据库进行比对核验'
                        : role === 'enterprise'
                        ? '请准确填写企业信息，系统将校验法人授权状态'
                        : '管理员账号需经双重身份核验及权限审计'}
                    </p>

                    <form onSubmit={handleIdSubmit} className="space-y-4 max-w-md">
                      {role === 'personal' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gov-text mb-1.5">真实姓名</label>
                            <input
                              required
                              value={realName}
                              onChange={(e) => setRealName(e.target.value)}
                              placeholder="请输入身份证上的姓名"
                              className="w-full h-11 px-4 rounded-lg border border-gov-border focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition text-gov-text"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gov-text mb-1.5">居民身份证号</label>
                            <input
                              required
                              value={idNumber}
                              onChange={(e) => setIdNumber(e.target.value)}
                              placeholder="18位身份证号码"
                              maxLength={18}
                              className="w-full h-11 px-4 rounded-lg border border-gov-border focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition text-gov-text font-mono"
                            />
                          </div>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-gov-blue/5 border border-gov-blue/10">
                            <Shield className="w-4 h-4 text-gov-blue mt-0.5 shrink-0" />
                            <p className="text-xs text-gov-text-secondary leading-relaxed">
                              您的身份信息将加密传输至公安人口库进行权威比对，平台不存储敏感明文数据，符合《个人信息保护法》要求。
                            </p>
                          </div>
                        </>
                      ) : role === 'enterprise' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gov-text mb-1.5">统一社会信用代码</label>
                            <input
                              required
                              value={creditCode}
                              onChange={(e) => setCreditCode(e.target.value)}
                              placeholder="18位统一社会信用代码"
                              maxLength={18}
                              className="w-full h-11 px-4 rounded-lg border border-gov-border focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition text-gov-text font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gov-text mb-1.5">经办人姓名（HR）</label>
                            <input
                              required
                              value={hrName}
                              onChange={(e) => setHrName(e.target.value)}
                              placeholder="请输入经办人真实姓名"
                              className="w-full h-11 px-4 rounded-lg border border-gov-border focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition text-gov-text"
                            />
                          </div>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-gov-blue/5 border border-gov-blue/10">
                            <ShieldCheck className="w-4 h-4 text-gov-blue mt-0.5 shrink-0" />
                            <p className="text-xs text-gov-text-secondary leading-relaxed">
                              企业HR需已完成法人授权登记，首次登录需经人脸识别二次核验并确认授权权限范围。
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gov-text mb-1.5">管理员姓名</label>
                            <input
                              required
                              value={realName}
                              onChange={(e) => setRealName(e.target.value)}
                              placeholder="请输入管理员真实姓名"
                              className="w-full h-11 px-4 rounded-lg border border-gov-border focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition text-gov-text"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gov-text mb-1.5">管理员身份证号</label>
                            <input
                              required
                              value={idNumber}
                              onChange={(e) => setIdNumber(e.target.value)}
                              placeholder="18位身份证号码"
                              maxLength={18}
                              className="w-full h-11 px-4 rounded-lg border border-gov-border focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition text-gov-text font-mono"
                            />
                          </div>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                              管理员登录将生成专属审计单号，所有操作将被全程记录并纳入合规审计。请确保在授权设备上登录。
                            </p>
                          </div>
                        </>
                      )}
                      <button type="submit" className="gov-btn-primary w-full mt-2">
                        下一步 · 进入生物识别
                      </button>
                    </form>

                    <motion.div
                      key={role}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8 max-w-md"
                    >
                      <p className="text-sm font-medium text-gov-text-secondary mb-3">可办理业务预览</p>

                      {role === 'personal' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <Shield className="w-5 h-5 text-gov-blue mb-2" />
                            <p className="text-sm font-medium text-gov-text mb-1">五险一金查询</p>
                            <p className="text-xs text-gov-text-secondary">缴费明细、账户余额、转移进度</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <Heart className="w-5 h-5 text-gov-blue mb-2" />
                            <p className="text-sm font-medium text-gov-text mb-1">医保就医记录</p>
                            <p className="text-xs text-gov-text-secondary">定点医院、药品目录、报销追溯</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <GraduationCap className="w-5 h-5 text-gov-blue mb-2" />
                            <p className="text-sm font-medium text-gov-text mb-1">人事考试报名</p>
                            <p className="text-xs text-gov-text-secondary">考试报名、准考证打印</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <CreditCard className="w-5 h-5 text-gov-blue mb-2" />
                            <p className="text-sm font-medium text-gov-text mb-1">电子社保卡</p>
                            <p className="text-xs text-gov-text-secondary">申领、NFC闪付、动态二维码</p>
                          </div>
                        </div>
                      )}

                      {role === 'enterprise' && (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <div className="flex items-start gap-3">
                              <Users className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gov-text mb-1">员工参保增减员</p>
                                <p className="text-xs text-gov-text-secondary">批量申报、导入导出</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <div className="flex items-start gap-3">
                              <FileText className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gov-text mb-1">失业金申领预审</p>
                                <p className="text-xs text-gov-text-secondary">材料核对、预审意见</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <div className="flex items-start gap-3">
                              <FileCheck className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gov-text mb-1">电子合同存证</p>
                                <p className="text-xs text-gov-text-secondary">劳动关系、区块链存证</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-blue/5 border border-gov-blue/20">
                            <p className="text-xs text-gov-text-secondary">
                              💡 法人授权后可办理上述业务，需完成人脸识别二次核验
                            </p>
                          </div>
                        </div>
                      )}

                      {role === 'admin' && (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gov-text mb-1">超时预警督办</p>
                                <p className="text-xs text-gov-text-secondary">业务超时、自动预警、督办跟踪</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <div className="flex items-start gap-3">
                              <Tag className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gov-text mb-1">政策智能标签</p>
                                <p className="text-xs text-gov-text-secondary">人群/场景/时效打标</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-gov-bg-light border border-gov-border/50 hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all">
                            <div className="flex items-start gap-3">
                              <ShieldCheck className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gov-text mb-1">实名认证审核</p>
                                <p className="text-xs text-gov-text-secondary">生物识别、公安比对、审计追溯</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-xs text-amber-700">
                              ⚠️ 管理员所有操作将生成审计日志，全程可追溯
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {step === 'biometric' && (
                  <motion.div
                    key="biometric"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-semibold text-gov-text">生物识别采集</h2>
                      <button onClick={handleBack} className="text-sm text-gov-text-secondary hover:text-gov-blue flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> 返回修改
                      </button>
                    </div>
                    <p className="text-sm text-gov-text-secondary mb-5">
                      请保持{authMethod === 'face' ? '面部正对摄像头、光线充足' : '手指平放在识别区域'}，系统将进行活体检测
                    </p>

                    <div className="flex gap-2 mb-5">
                      <button
                        onClick={() => { setAuthMethod('face'); setFaceProgress(0); setMatchScore(0); setVerifyResult(null) }}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition',
                          authMethod === 'face'
                            ? 'border-gov-blue bg-gov-blue/5 text-gov-blue font-medium'
                            : 'border-gov-border text-gov-text-secondary hover:bg-gov-bg-light'
                        )}
                      >
                        <ScanFace className="w-4 h-4" /> 人脸识别
                      </button>
                      <button
                        onClick={() => { setAuthMethod('fingerprint'); setFaceProgress(0); setMatchScore(0); setVerifyResult(null) }}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition',
                          authMethod === 'fingerprint'
                            ? 'border-gov-blue bg-gov-blue/5 text-gov-blue font-medium'
                            : 'border-gov-border text-gov-text-secondary hover:bg-gov-bg-light'
                        )}
                      >
                        <Fingerprint className="w-4 h-4" /> 指纹识别
                      </button>
                    </div>

                    <div className="relative rounded-xl border border-gov-border overflow-hidden bg-gov-blue-dark/5 mb-5">
                      <div className="aspect-[16/9] flex items-center justify-center relative">
                        <div
                          className={cn(
                            'relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300',
                            authMethod === 'face'
                              ? 'border-4'
                              : 'border-4',
                            faceProgress >= 100
                              ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                              : 'border-gov-blue/40'
                          )}
                          style={{
                            background: `conic-gradient(#0D3B66 ${faceProgress * 3.6}deg, transparent 0deg)`,
                          }}
                        >
                          <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full bg-white flex flex-col items-center justify-center">
                            {faceProgress < 100 ? (
                              <>
                                {authMethod === 'face' ? (
                                  <ScanFace className="w-16 h-16 text-gov-blue/40 animate-pulse" />
                                ) : (
                                  <Fingerprint className="w-16 h-16 text-gov-blue/40 animate-pulse" />
                                )}
                                <p className="mt-2 text-sm text-gov-text-secondary">
                                  {authMethod === 'face' ? '请保持面部正对' : '请放置手指'}
                                </p>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                <p className="mt-2 text-sm font-medium text-emerald-700">采集完成</p>
                              </>
                            )}
                          </div>
                        </div>

                        {faceProgress > 0 && faceProgress < 100 && (
                          <div className="absolute top-4 right-4 bg-gov-blue text-white px-3 py-1 rounded-full text-xs font-mono">
                            {faceProgress}%
                          </div>
                        )}
                      </div>
                    </div>

                    {matchScore > 0 && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200 mb-5">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium text-emerald-800">生物特征采集完成</p>
                            <p className="text-xs text-emerald-700">活体检测通过 · 匹配度：{matchScore.toFixed(1)}%</p>
                          </div>
                        </div>
                        <button
                          onClick={handleStartVerify}
                          disabled={verifying}
                          className="gov-btn-primary !py-2 text-sm flex items-center gap-2"
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              公安比对中...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              发起公安核验
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {verifying && (
                      <div className="p-4 rounded-lg bg-gov-gold/5 border border-gov-gold/30 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                          <p className="text-sm font-medium text-amber-800">正在对接公安人口库进行权威比对...</p>
                        </div>
                        <ul className="text-xs text-gov-text-secondary space-y-1 ml-7">
                          <li className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            身份信息加密传输
                          </li>
                          <li className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            生物特征与身份证模板比对
                          </li>
                          <li className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            金保工程参保状态核验
                          </li>
                          <li className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            操作环境风控扫描
                          </li>
                        </ul>
                      </div>
                    )}

                    {verifyResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'p-4 rounded-lg border mb-4',
                          verifyResult.passed
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-gov-red/5 border-gov-red/30'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {verifyResult.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-gov-red mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={cn('text-sm font-medium', verifyResult.passed ? 'text-emerald-800' : 'text-gov-red')}>
                              {verifyResult.passed ? '核验通过' : '核验未通过'}
                            </p>
                            <p className="text-xs text-gov-text-secondary mt-1">{verifyResult.message}</p>
                            {verifyResult.passed && verifyResult.riskLevel !== 'low' && (
                              <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-800">
                                  风控提示：匹配度处于中等区间，本次登录已标记。系统将在办理敏感业务时要求二次活体检测。
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-gov-text mb-1">实名认证成功</h2>
                    <p className="text-sm text-gov-text-secondary mb-6">
                      已完成公安人口库比对、金保工程参保核验及生物识别认证
                    </p>

                    <div className="bg-gov-bg-light rounded-lg p-5 text-left mb-6 max-w-md mx-auto">
                      <div className="flex justify-between py-2 border-b border-gov-border/50 text-sm">
                        <span className="text-gov-text-secondary">登录身份</span>
                        <span className="font-medium text-gov-text">
                          {role === 'personal' ? (realName || '个人用户') : role === 'enterprise' ? (hrName || '企业HR') : (realName || '管理员')}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gov-border/50 text-sm">
                        <span className="text-gov-text-secondary">认证方式</span>
                        <span className="font-medium text-gov-text">
                          {authMethod === 'face' ? '人脸识别 + 公安比对' : '指纹识别 + 公安比对'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gov-border/50 text-sm">
                        <span className="text-gov-text-secondary">匹配分值</span>
                        <span className="font-mono font-medium text-emerald-700">{matchScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gov-border/50 text-sm">
                        <span className="text-gov-text-secondary">风控等级</span>
                        <span className={cn(
                          'font-medium',
                          verifyResult?.riskLevel === 'low' ? 'text-emerald-700' :
                          verifyResult?.riskLevel === 'medium' ? 'text-amber-700' : 'text-gov-red'
                        )}>
                          {verifyResult?.riskLevel === 'low' ? '低风险' : verifyResult?.riskLevel === 'medium' ? '中风险' : '高风险'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-gov-text-secondary">登录时间</span>
                        <span className="font-mono text-gov-text">{new Date().toLocaleString('zh-CN')}</span>
                      </div>
                    </div>

                    {showRiskAlert && (
                      <div className="max-w-md mx-auto mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-left flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800">
                          本次登录已生成唯一审计单号并记录操作日志。办理社保转移、公积金提取等敏感业务需进行二次活体检测。
                        </p>
                      </div>
                    )}

                    <div className="max-w-md mx-auto">
                      <p className="text-xs text-gov-text-secondary mb-2 text-left">操作追溯记录</p>
                      <div className="rounded-lg border border-gov-border divide-y divide-gov-border/50">
                        {operationLogs.map((log, i) => (
                          <div key={i} className="px-3 py-2.5 text-xs flex items-start gap-2">
                            <span className="text-gov-text-muted font-mono shrink-0">{log.time}</span>
                            <span className="text-gov-text">{log.action}</span>
                            <span className="ml-auto text-gov-text-muted">{log.device}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6 justify-center">
                      <button onClick={handleBack} className="gov-btn-secondary">
                        返回核验详情
                      </button>
                      <button onClick={handleCompleteLogin} className="gov-btn-primary">
                        进入{role === 'personal' ? '个人服务' : role === 'enterprise' ? '企业服务' : '管理后台'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
