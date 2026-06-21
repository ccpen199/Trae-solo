import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Home, Users, Bus, Stethoscope, GraduationCap,
  Mic, User, Grid3X3, QrCode, Plus, Minus, Volume2,
  ChevronLeft, Check, X, Clock, Settings, Bell,
  ArrowLeft, ArrowRight,
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const services = [
  { name: '社保查询', icon: Shield, to: '/government/s001', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
  { name: '公积金提取', icon: Home, to: '/government/s002', color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50' },
  { name: '公交乘车', icon: Bus, to: '/city-service/transport', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50' },
  { name: '医院挂号', icon: Stethoscope, to: '/city-service/hospital', color: 'from-rose-400 to-red-500', bg: 'bg-rose-50' },
  { name: '户籍登记', icon: Users, to: '/government/s003', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50' },
  { name: '教育缴费', icon: GraduationCap, to: '/city-service/education', color: 'from-indigo-400 to-blue-600', bg: 'bg-indigo-50' },
]

const voiceCommands = [
  { pattern: /社保/, to: '/government/s001', label: '社保查询' },
  { pattern: /公积金/, to: '/government/s002', label: '公积金提取' },
  { pattern: /公交|乘车/, to: '/city-service/transport', label: '公交乘车' },
  { pattern: /医院|挂号/, to: '/city-service/hospital', label: '医院挂号' },
  { pattern: /景点|旅游/, to: '/city-service/scenic', label: '景点预约' },
  { pattern: /回家|首页/, to: '/', label: '首页' },
]

const bottomNav = [
  { label: '首页', icon: Home, to: '/' },
  { label: '服务', icon: Grid3X3, to: '/government' },
  { label: '语音', icon: Mic, action: 'voice' },
  { label: '我的', icon: User, to: '/profile' },
]

type VoiceState = 'idle' | 'listening' | 'processing'

export default function Elderly() {
  const navigate = useNavigate()
  const { user, elderlyMode, toggleElderlyMode, fontSize, setFontSize } = useStore()
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [voiceText, setVoiceText] = useState('')
  const [activeNav, setActiveNav] = useState(0)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCountdown, setQrCountdown] = useState(60)

  useEffect(() => {
    if (!elderlyMode) toggleElderlyMode()
  }, [elderlyMode, toggleElderlyMode])

  useEffect(() => {
    if (showQRModal && qrCountdown > 0) {
      const t = setTimeout(() => setQrCountdown(qrCountdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [showQRModal, qrCountdown])

  const handleVoice = () => {
    if (voiceState !== 'idle') return
    setVoiceState('listening')
    setVoiceText('')
    setTimeout(() => {
      const cmd = voiceCommands[Math.floor(Math.random() * voiceCommands.length)]
      setVoiceText(cmd.label)
      setVoiceState('processing')
      setTimeout(() => {
        setVoiceState('idle')
        setVoiceText('')
        navigate(cmd.to)
      }, 1500)
    }, 2000)
  }

  const handleFontSize = (delta: number) => {
    setFontSize(Math.max(18, Math.min(28, fontSize + delta)))
  }

  const proxyBindings = user?.proxyBindings || []

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FFF8E8', fontSize: `${fontSize}px` }}>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
          <ArrowLeft className="w-7 h-7 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">长辈模式</h1>
        <button className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
          <Bell className="w-7 h-7 text-gray-700" />
        </button>
      </div>

      <div className="px-6 pb-2">
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 shadow-sm border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-800">您好，{user?.name || '用户'} 👋</h2>
          <p className="text-lg text-gray-600 mt-1">今天天气晴朗，适合出门活动</p>
        </div>
      </div>

      <div className="px-6 mt-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          字体大小
        </h2>
        <div className="bg-white rounded-2xl p-5 shadow-md border border-amber-100">
          <div className="flex items-center gap-4">
            <button onClick={() => handleFontSize(-2)} disabled={fontSize <= 18}
              className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors disabled:opacity-40">
              <Minus className="w-8 h-8 text-amber-700" />
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">小</span>
                <span className="text-xl font-bold text-amber-600">{fontSize}px</span>
                <span className="text-sm text-gray-500">大</span>
              </div>
              <input type="range" min={18} max={28} step={2} value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((fontSize - 18) / 10) * 100}%, #fef3c7 ${((fontSize - 18) / 10) * 100}%, #fef3c7 100%)` }} />
            </div>
            <button onClick={() => handleFontSize(2)} disabled={fontSize >= 28}
              className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors disabled:opacity-40">
              <Plus className="w-8 h-8 text-amber-700" />
            </button>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-xl">
            <p className="text-center text-gray-700" style={{ fontSize: `${fontSize}px` }}>
              这是字体预览文字，您可以调节大小
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" />
          高频服务
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {services.map((svc, i) => {
            const Icon = svc.icon
            return (
              <motion.button
                key={svc.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(svc.to)}
                className={`${svc.bg} rounded-2xl p-5 min-h-[120px] flex flex-col items-center justify-center gap-3 shadow-md border border-amber-100`}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">{svc.name}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="px-6 mt-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-600" />
          子女代办
        </h2>
        <div className="bg-white rounded-2xl p-5 shadow-md border border-amber-100">
          {proxyBindings.length > 0 ? (
            <div className="space-y-4 mb-5">
              {proxyBindings.map((proxy) => (
                <div key={proxy.proxyUserId} className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-gray-800">{proxy.proxyName}</p>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {proxy.relation}
                      </span>
                    </div>
                    <p className="text-base text-gray-500 mt-1">授权：{proxy.authorizedScopes.join('、')}</p>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />绑定于 {proxy.boundAt}
                    </p>
                  </div>
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6">暂无代办人</p>
          )}
          <button
            onClick={() => { setShowQRModal(true); setQrCountdown(60) }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-7 h-7" />添加代办人
          </button>
        </div>
      </div>

      <div className="px-6 mt-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Mic className="w-6 h-6 text-amber-600" />
          语音导航
        </h2>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-100 flex flex-col items-center">
          <button
            onClick={handleVoice}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform">
            <AnimatePresence>
              {voiceState === 'listening' && (
                <>
                  <motion.span initial={{ opacity: 0.6, scale: 1 }} animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-amber-400" />
                  <motion.span initial={{ opacity: 0.4, scale: 1 }} animate={{ opacity: 0, scale: 1.8 }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="absolute inset-0 rounded-full bg-orange-300" />
                </>
              )}
            </AnimatePresence>
            {voiceState === 'processing' ? (
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-8 bg-white rounded-full" />
                ))}
              </div>
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
          {voiceState === 'listening' && (
            <div className="flex gap-1 mt-5 h-10 items-end">
              {[...Array(7)].map((_, i) => (
                <motion.div key={i} animate={{ height: ['12px', '32px', '12px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                  className="w-2 bg-gradient-to-t from-amber-400 to-orange-500 rounded-full" />
              ))}
            </div>
          )}
          {voiceText && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-xl text-amber-700 font-bold">
              {voiceState === 'processing' ? `已识别：${voiceText}` : '正在聆听...'}
            </motion.p>
          )}
          <p className="mt-3 text-base text-gray-400">点击麦克风，说出您要办理的业务</p>
        </div>
      </div>

      <AnimatePresence>
        {showQRModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowQRModal(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl font-bold text-gray-800">添加代办人</h3>
                <button onClick={() => setShowQRModal(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-52 h-52 bg-white border-4 border-amber-200 rounded-2xl p-4 flex items-center justify-center">
                  <div className="w-full h-full grid grid-cols-10 gap-0.5">
                    {[...Array(100)].map((_, i) => {
                      const corner = (i < 30 && i % 10 < 3) || (i < 30 && i % 10 >= 7) || (i >= 70 && i % 10 < 3)
                      const rand = Math.random() > 0.5
                      return <div key={i} className={`${(corner || rand) ? 'bg-gray-800' : 'bg-white'}`} />
                    })}
                  </div>
                </div>
                <p className="mt-5 text-xl font-bold text-gray-800">让子女用手机微信扫码绑定</p>
                <div className="mt-4 w-full bg-amber-50 rounded-xl p-4">
                  <p className="text-base text-gray-600 font-semibold mb-2">操作步骤：</p>
                  <p className="text-sm text-gray-500">1. 打开微信</p>
                  <p className="text-sm text-gray-500">2. 扫一扫</p>
                  <p className="text-sm text-gray-500">3. 确认授权</p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-lg text-gray-600">
                    二维码有效期：<span className="font-bold text-amber-600">{qrCountdown}秒</span>
                  </span>
                </div>
                <button onClick={() => setQrCountdown(60)} disabled={qrCountdown > 0}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-100 text-amber-700 px-6 py-3 rounded-xl text-lg font-bold hover:bg-amber-200 transition-colors disabled:opacity-50">
                  <ChevronLeft className="w-5 h-5 rotate-90" />刷新二维码
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-200 shadow-lg z-40 h-16">
        <div className="grid grid-cols-4 max-w-lg mx-auto h-full">
          {bottomNav.map((item, i) => {
            const Icon = item.icon
            const isActive = activeNav === i
            return (
              <button key={item.label} onClick={() => {
                setActiveNav(i)
                if (item.action === 'voice') handleVoice()
                else if (item.to) navigate(item.to)
              }}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-amber-500' : 'text-gray-400'}`}>
                <Icon className="w-7 h-7" />
                <span className="text-base font-bold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
