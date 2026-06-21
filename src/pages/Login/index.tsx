import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Loader2, Camera, ArrowRight, Eye, EyeOff, AlertCircle, User, Building2, Building, FileCheck, CreditCard, Home, Users, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockCertificates, mockApplications } from '@/data/mockData'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const scanVariants = {
  initial: { y: -40, opacity: 0 },
  animate: { y: 40, opacity: 1, transition: { repeat: Infinity, repeatType: 'reverse' as const, duration: 1.5 } }
}

const roleTypes = [
  { key: 'personal', label: '个人用户', icon: User, desc: '自然人办理个人事项' },
  { key: 'enterprise', label: '企业法人', icon: Building2, desc: '企业/工商户办理业务' },
  { key: 'institution', label: '事业单位', icon: Building, desc: '机关事业单位办理' },
]

const previewCerts = mockCertificates.slice(0, 4)
const unfinishedApps = mockApplications.filter(a => a.status === '审核中' || a.status === '补正中')

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithSSO, isAuthenticating, loginError } = useStore()
  
  const [showIdLogin, setShowIdLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [idNumber, setIdNumber] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('personal')
  const [showPreview, setShowPreview] = useState(false)

  const from = (location.state as { from?: string })?.from || '/'

  const handleSSOLogin = async () => {
    const success = await loginWithSSO()
    if (success) {
      navigate(from, { replace: true })
    }
  }

  const handleIdLogin = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const certIconMap: Record<string, React.ElementType> = {
    '身份证': CreditCard,
    '户口簿': Home,
    '社会保障卡': Shield,
    '不动产权证': Building,
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-2xl relative z-10"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-gold-400" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary-500 mb-2">
              无锡<span className="text-gradient-gold">政务</span>
            </h1>
            <p className="text-sm text-gray-500">无锡市市级人口库 · 电子证照库 · 统一身份认证</p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">选择用户类型</label>
            <div className="grid grid-cols-3 gap-3">
              {roleTypes.map((role) => {
                const Icon = role.icon
                const active = selectedRole === role.key
                return (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${active
                      ? 'border-gold-400 bg-gold-50'
                      : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-gold-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${active ? 'text-primary-600' : 'text-gray-700'}`}>{role.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{role.desc}</p>
                  </button>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {isAuthenticating ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
                    <div className="absolute inset-2 rounded-full border-2 border-primary-500/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-primary-500" />
                    </div>
                    <motion.div
                      className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full"
                      variants={scanVariants}
                      initial="initial"
                      animate="animate"
                    />
                  </div>
                  <p className="text-primary-500 font-medium">正在进行人脸认证...</p>
                  <p className="text-xs text-gray-400 mt-2">正在对接无锡市人口库进行身份核验</p>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleSSOLogin}
                    disabled={isAuthenticating}
                    className="w-full btn-gold py-4 text-lg flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        认证中...
                      </>
                    ) : (
                      <>
                        统一身份认证登录
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{loginError}</span>
                    </motion.div>
                  )}

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white/80 text-xs text-gray-400">或</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIdLogin(!showIdLogin)}
                    className="w-full btn-outline py-3 text-sm"
                  >
                    {showIdLogin ? '收起' : '身份证号登录'}
                  </button>

                  <AnimatePresence>
                    {showIdLogin && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleIdLogin}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
                            <input
                              type="text"
                              value={idNumber}
                              onChange={(e) => setIdNumber(e.target.value)}
                              className="input-field"
                              placeholder="请输入身份证号"
                              maxLength={18}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pr-12"
                                placeholder="请输入密码"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <button type="submit" className="w-full btn-primary py-3">
                            登录
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-primary-700">电子证照自动带入</p>
                  <p className="text-xs text-gray-500">登录后以下证照将自动填充到表单</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showPreview ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 grid grid-cols-2 gap-2">
                    {previewCerts.map((cert) => {
                      const Icon = certIconMap[cert.type] ?? CreditCard
                      return (
                        <div key={cert.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{cert.type}</p>
                            <p className="text-xs text-green-600">✓ {cert.status}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {unfinishedApps.length > 0 && (
            <motion.div variants={itemVariants} className="mt-4">
              <div className="p-4 bg-gold-50 rounded-xl border border-gold-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="w-5 h-5 text-gold-600" />
                  <p className="text-sm font-medium text-gold-800">您有 {unfinishedApps.length} 项未完成的办件</p>
                </div>
                <div className="space-y-2">
                  {unfinishedApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={handleSSOLogin}
                      className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gold-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${app.status === '补正中' ? 'bg-gold-500' : 'bg-blue-500'}`} />
                        <span className="text-sm text-gray-700">{app.serviceName}</span>
                      </div>
                      <span className="text-xs text-gold-600 font-medium">继续办理 →</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                人口库核验
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                证照库对接
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                统一身份认证
              </span>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          登录即表示同意《无锡市政务服务平台用户协议》和《隐私政策》
        </p>
      </motion.div>
    </div>
  )
}
