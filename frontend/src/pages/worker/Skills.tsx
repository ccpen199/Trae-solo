import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  Plus,
  Award,
  ShieldCheck,
  MapPin,
  Edit3,
  Star,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

interface Skill {
  id: string
  name: string
  level: number
  verified: boolean
  icon: string
}

const mySkills: Skill[] = [
  { id: '1', name: '搬家搬运', level: 3, verified: true, icon: '📦' },
  { id: '2', name: '装卸搬运', level: 2, verified: true, icon: '🏗️' },
  { id: '3', name: '家具组装', level: 3, verified: true, icon: '🪑' },
  { id: '4', name: '家电安装', level: 2, verified: true, icon: '📺' },
  { id: '5', name: '重型搬运', level: 1, verified: false, icon: '🏋️' },
  { id: '6', name: '展会搭建', level: 1, verified: true, icon: '🎪' },
]

const availableSkills = [
  '设备搬运', '钢琴搬运', '鱼缸搬运', '仓库理货', '家政保洁', '打包服务',
]

export default function WorkerSkills() {
  const [radius, setRadius] = useState(5)

  const levelLabels = ['初级', '中级', '高级']
  const levelColors = ['bg-emerald-100 text-emerald-700', 'bg-emerald-100 text-emerald-700', 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white']

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">技能管理</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            我的技能
          </h2>
          <Tag color="green" size="sm">已认证 {mySkills.filter(s => s.verified).length} 项</Tag>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {mySkills.map((skill, index) => (
              <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
            >
              <Card className="!p-4 relative overflow-hidden">
                {skill.verified && (
                  <div className="absolute top-2 right-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
                <div className="text-2xl mb-2">{skill.icon}</div>
                <h3 className="text-sm font-bold text-gray-900">{skill.name}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3].map((lvl) => (
                    <Star
                      key={lvl}
                      className="w-3.5 h-3.5"
                      fill={lvl <= skill.level ? '#10b981' : '#e5e7eb'}
                    />
                  ))}
                </div>
                <Tag
                  key={skill.id}
                  className={`!bg-transparent !border-0 mt-2 text-[10px] px-2 py-0.5 rounded-full ${levelColors[skill.level - 1]}`}
                  size="sm"
                  color="green"
                >
                  {levelLabels[skill.level - 1]}
                </Tag>
              </Card>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-500" />
              服务半径
            </h2>
            <button className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
              <Edit3 className="w-3 h-3" />
              调整
            </button>
          </div>
          <Card className="!p-0 overflow-hidden">
            <div className="relative h-44 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl"
                />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/30 flex items-center justify-center border-2 border-dashed border-emerald-400">
                  <MapPin className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">当前服务范围</span>
                <Tag color="green" size="sm">{radius} km</Tag>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>1km</span>
                <span>20km</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              可申请技能
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((name) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={name}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                {name}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
