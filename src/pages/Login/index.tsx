import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Loader2, Camera, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'

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

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithSSO, isAuthenticating, loginError } = useStore()
  
  const [showIdLogin, setShowIdLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [idNumber, setIdNumber] = useState('')
  const [password, setPassword] = useState('')

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

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
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
            <p className="text-sm text-gray-500">无锡市市级人口库统一身份认证</p>
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

          <motion.p
            variants={itemVariants}
            className="text-center text-xs text-gray-400 mt-8"
          >
            登录即表示同意
            <a href="#" className="text-primary-500 hover:underline">《用户服务协议》</a>
            和
            <a href="#" className="text-primary-500 hover:underline">《隐私政策》</a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
