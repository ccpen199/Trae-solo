import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Bus, Stethoscope, Mountain, Home, Users,
  Mic, User, Grid3X3, QrCode, Plus, Minus, Volume2,
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const services = [
  { name: '社保查询', icon: Shield, desc: '查询社保缴纳明细', to: '/government/s001' },
  { name: '公交乘车', icon: Bus, desc: '扫码乘车一键通', to: '/city-service/transport' },
  { name: '医院挂号', icon: Stethoscope, desc: '在线预约挂号', to: '/city-service/hospital' },
  { name: '景点预约', icon: Mountain, desc: '景区门票预约', to: '/city-service/scenic' },
  { name: '公积金提取', icon: Home, desc: '公积金在线提取', to: '/government/s004' },
  { name: '户籍登记', icon: Users, desc: '户籍业务办理', to: '/government/s005' },
]

const bottomNav: { label: string; icon: React.ElementType; to?: string; action?: string }[] = [
  { label: '首页', icon: Home, to: '/' },
  { label: '服务', icon: Grid3X3, to: '/government' },
  { label: '语音', icon: Mic, action: 'voice' },
  { label: '我的', icon: User, to: '/profile' },
]

export default function Elderly() {
  const navigate = useNavigate()
  const { elderlyMode, fontSize, toggleElderlyMode, setFontSize } = useStore()
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [activeNav, setActiveNav] = useState(0)

  useEffect(() => {
    if (!elderlyMode) toggleElderlyMode()
  }, [elderlyMode, toggleElderlyMode])

  const handleVoice = () => {
    if (isListening) return
    setIsListening(true)
    setVoiceText('')
    setTimeout(() => {
      setVoiceText('正在为您打开社保查询...')
      setTimeout(() => {
        setIsListening(false)
        setVoiceText('')
        navigate('/government/s001')
      }, 1500)
    }, 2000)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FFFBF0', fontSize: `${fontSize}px` }}>
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-4xl font-bold text-gray-800">
          您好，张明华 👋
        </h1>
        <p className="text-2xl text-gray-500 mt-2">
          2025年6月20日 周五 晴 28°C
        </p>
      </div>

      <div className="px-6 mt-2 mb-4">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">常用服务</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <button
                onClick={() => navigate(svc.to)}
                className="w-full bg-white rounded-2xl p-6 min-h-[120px] flex flex-col items-center justify-center gap-3
                           shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border border-amber-100"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <svc.icon className="w-9 h-9 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{svc.name}</span>
                <span className="text-lg text-gray-500">{svc.desc}</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-6 mb-4">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">语音导航</h2>
        <div className="flex flex-col items-center">
          <button
            onClick={handleVoice}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                       flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30" />
                <span className="absolute -inset-2 rounded-full bg-amber-300 animate-pulse opacity-20" />
              </>
            )}
            <Mic className="w-10 h-10 text-white" />
          </button>
          {voiceText && (
            <p className="mt-4 text-2xl text-amber-700 font-semibold animate-pulse">
              {voiceText}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 mt-6 mb-4">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">子女代办</h2>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">子女: 张晓明</p>
              <p className="text-lg text-gray-500">授权范围: 社保查询、公积金提取</p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-amber-50 text-amber-700 px-6 py-3 rounded-xl
                             text-xl font-semibold hover:bg-amber-100 transition-colors">
            <QrCode className="w-6 h-6" />
            添加代办人
          </button>
        </div>
      </div>

      <div className="px-6 mt-6 mb-4">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">字体大小</h2>
        <div className="bg-white rounded-2xl p-5 shadow-md border border-amber-100 flex items-center gap-4">
          <button
            onClick={() => setFontSize(Math.max(18, fontSize - 2))}
            className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
          >
            <Minus className="w-6 h-6 text-amber-700" />
          </button>
          <div className="flex-1 text-center">
            <Volume2 className="w-6 h-6 text-amber-600 mx-auto mb-1" />
            <span className="text-xl font-bold text-gray-800">{fontSize}px</span>
          </div>
          <button
            onClick={() => setFontSize(Math.min(28, fontSize + 2))}
            className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
          >
            <Plus className="w-6 h-6 text-amber-700" />
          </button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-200 shadow-lg z-50">
        <div className="grid grid-cols-4 max-w-lg mx-auto">
          {bottomNav.map((item, i) => {
            const Icon = item.icon
            const isActive = activeNav === i
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(i)
                  if (item.action === 'voice') handleVoice()
                  else if (item.to) navigate(item.to)
                }}
                className={`flex flex-col items-center py-4 gap-1 transition-colors
                  ${isActive ? 'text-amber-500' : 'text-gray-400'}`}
              >
                <Icon className="w-8 h-8" />
                <span className="text-lg font-bold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
