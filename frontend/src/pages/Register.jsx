import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Music2, Phone, Lock, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'

const Register = () => {
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const { showToast } = useToast()
  const [form, setForm] = useState({ phone: '', password: '', nickname: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.phone || !form.password) {
      showToast('请填写完整信息', 'warning')
      return
    }
    if (form.password.length < 6) {
      showToast('密码至少6位', 'warning')
      return
    }

    setLoading(true)
    try {
      const res = await request.post('/auth/register', form)
      if (res.success) {
        setToken(res.data.token)
        setUser(res.data.user)
        showToast('注册成功', 'success')
        navigate('/')
      } else {
        showToast(res.message || '注册失败', 'error')
      }
    } catch (err) {
      showToast('注册失败，请检查网络', 'error')
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
          <h1 className="text-3xl font-bold mb-2">创建账号</h1>
          <p className="text-gray-400">加入音乐世界，开启您的音乐之旅</p>
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
              placeholder="密码（至少6位）"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>

          <div className="relative">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="昵称（选填）"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
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
                <UserPlus className="w-5 h-5" />
                注册
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400">
          已有账号？{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">
            立即登录
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Register