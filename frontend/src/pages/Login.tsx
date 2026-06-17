import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Truck, Phone, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import type { LoginFormData } from '../types'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      phone: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <div className="bg-white/20 p-3 rounded-xl">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">城运通</h1>
            </motion.div>
            <p className="text-blue-100 text-sm">同城用工物流平台</p>
          </div>

          <div className="px-8 py-8">
            {isAuthenticated ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  登录成功
                </h2>
                <p className="text-gray-500 text-sm">欢迎回来！</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手机号
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="请输入手机号"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      {...register('phone', {
                        required: '请输入手机号',
                        pattern: {
                          value: /^1[3-9]\d{9}$/,
                          message: '请输入正确的手机号',
                        },
                      })}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      {...register('password', {
                        required: '请输入密码',
                        minLength: {
                          value: 6,
                          message: '密码至少6位',
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    记住我
                  </label>
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    忘记密码？
                  </a>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                >
                  {isSubmitting ? '登录中...' : '登 录'}
                </motion.button>

                <p className="text-center text-sm text-gray-500">
                  还没有账号？
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                  >
                    立即注册
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © 2026 城运通 同城用工物流平台
        </p>
      </motion.div>
    </div>
  )
}
