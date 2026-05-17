import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Music2, Phone, Lock, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'

const Login = () => {
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const { showToast } = useToast()
  const [form, setForm] = useState({ phone: '13800138000', password: '123456' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.phone || !form.password) {
      showToast('请填写完整信息', 'warning')
      return
    }

    setLoading(true)
    try {
      const res = await request.post('/auth/login', form)
      if (res.success) {
        setToken(res.data.token)
        setUser(res.data.user)
        showToast('登录成功', 'success')
        navigate('/')
      } else {
        showToast(res.message || '登录失败', 'error')
      }
    } catch (err) {
      showToast('登录失败，请检查网络', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-primary-500/10 rounded-2xl mb-4">
            <Music2 className="w-12 h-12 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">欢迎回来</h1>
          <p className="text-gray-400">登录您的账户，发现好音乐</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              placeholder="手机号"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-sm text-primary-400 hover:text-primary-300">
              忘记密码？
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                登录
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-900 text-sm text-gray-400">其他登录方式</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            {['微信', 'QQ', '微博'].map((item) => (
              <button
                key={item}
                className="px-6 py-3 glass rounded-xl hover:bg-white/20 transition-colors text-sm"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center mt-8 text-gray-400">
          还没有账号？{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300">
            立即注册
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Login