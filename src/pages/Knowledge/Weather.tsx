import { motion } from 'framer-motion'
import { Thermometer, Droplets, Wind, Sun, AlertTriangle, Leaf } from 'lucide-react'
import type { WeatherAlert } from '@/types'
import { weatherAlerts } from '@/mocks'

const LEVEL_CONFIG: Record<WeatherAlert['level'], { color: string; border: string; bg: string; label: string }> = {
  red: { color: 'text-red-600', border: 'border-l-red-500', bg: 'bg-red-50', label: '红色预警' },
  orange: { color: 'text-orange-600', border: 'border-l-orange-500', bg: 'bg-orange-50', label: '橙色预警' },
  yellow: { color: 'text-yellow-600', border: 'border-l-yellow-500', bg: 'bg-yellow-50', label: '黄色预警' },
  blue: { color: 'text-blue-600', border: 'border-l-blue-500', bg: 'bg-blue-50', label: '蓝色预警' },
}

const CURRENT_WEATHER = {
  temperature: 28,
  humidity: 65,
  wind: '东南风 3级',
  condition: '多云',
}

const AGRI_ADVICE = [
  {
    icon: Sun,
    title: '高温防护',
    desc: '近期气温偏高，建议大棚种植户做好通风降温，露地作物适当遮阴，灌溉避开正午时段',
  },
  {
    icon: Droplets,
    title: '灌溉管理',
    desc: '土壤蒸发加快，注意及时补充水分，建议早晚灌溉，采用滴灌方式减少水分浪费',
  },
  {
    icon: Leaf,
    title: '病虫害防治',
    desc: '高温高湿环境下病害易发，注意巡查田间病虫害情况，及时采取防治措施',
  },
]

export default function WeatherPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-earth-500">气象预警</h1>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-serif text-xl font-semibold text-earth-500 mb-4">活跃预警</h2>
              <div className="space-y-3">
                {weatherAlerts.map((alert, i) => {
                  const cfg = LEVEL_CONFIG[alert.level]
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} p-5`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                        <span className="font-semibold text-earth-500">{alert.type}</span>
                        <span className="text-sm text-gray-400 ml-auto">{alert.region}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                        <span>{alert.startTime} 至 {alert.endTime}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{alert.description}</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{alert.advice}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="font-serif text-lg font-semibold text-earth-500 mb-4">当前天气</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-earth-500">{CURRENT_WEATHER.temperature}°C</p>
                  <p className="text-sm text-gray-400">{CURRENT_WEATHER.condition}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-sm">体感温度</span>
                  </div>
                  <span className="text-sm font-medium text-earth-500">30°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Droplets className="w-4 h-4" />
                    <span className="text-sm">湿度</span>
                  </div>
                  <span className="text-sm font-medium text-earth-500">{CURRENT_WEATHER.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Wind className="w-4 h-4" />
                    <span className="text-sm">风力</span>
                  </div>
                  <span className="text-sm font-medium text-earth-500">{CURRENT_WEATHER.wind}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="font-serif text-lg font-semibold text-earth-500 mb-4">农事建议</h3>
              <div className="space-y-4">
                {AGRI_ADVICE.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-earth-500">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
