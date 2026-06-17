import { Trophy, ChevronRight, Heart, Sun, Gift, Stethoscope } from 'lucide-react'
import { RIDER_LEVELS } from '../../constants'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'

const CURRENT_LEVEL = 3
const CURRENT_ORDERS = 128
const PROGRESS = 56

const MEDALS = [
  { icon: '🎯', name: '精准骑手', unlocked: true },
  { icon: '💯', name: '百分好评', unlocked: true },
  { icon: '👑', name: '单王之星', unlocked: true },
  { icon: '📅', name: '全勤达人', unlocked: true },
  { icon: '⭐', name: '五星闪耀', unlocked: true },
  { icon: '🛡️', name: '安全卫士', unlocked: false },
  { icon: '🏅', name: '元老骑手', unlocked: false },
]

const ACTIVITIES = [
  { icon: Sun, title: '高温补贴', desc: '气温≥35℃每单+2元', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Gift, title: '节日关怀', desc: '节日专属礼品与红包', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Stethoscope, title: '免费体检', desc: '年度健康体检一次', color: 'text-green-500', bg: 'bg-green-50' },
]

export default function RiderGrowth() {
  const currentLevelConfig = RIDER_LEVELS.find((l) => l.level === CURRENT_LEVEL)!
  const nextLevel = RIDER_LEVELS.find((l) => l.level === CURRENT_LEVEL + 1)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">骑手成长</h1>

      <Card className="!bg-gradient-to-br !from-brand-500 !to-brand-600 !border-none text-white overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-lg">{currentLevelConfig.name}</div>
              <div className="text-xs text-white/70">Lv.{CURRENT_LEVEL} · 已完成 {CURRENT_ORDERS} 单</div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70">
              距下一等级还需 <span className="font-bold text-white">{nextLevel ? nextLevel.minOrders - CURRENT_ORDERS : 0}</span> 单
            </span>
            <span className="font-medium">{PROGRESS}%</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${PROGRESS}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
          {currentLevelConfig.benefits.slice(0, 3).map((b, i) => (
            <div key={i} className="text-xs text-white/80 flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-amber-400" />
              {b}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-base font-bold text-gray-900 mb-3">等级体系</div>
        <div className="space-y-2.5">
          {RIDER_LEVELS.map((level) => {
            const isCurrent = level.level === CURRENT_LEVEL
            const isPast = level.level < CURRENT_LEVEL
            return (
              <div
                key={level.level}
                className={`
                  flex items-center justify-between p-3 rounded-xl transition-all
                  ${isCurrent
                    ? 'bg-brand-50 border border-brand-200 shadow-sm'
                    : isPast
                      ? 'bg-gray-50 opacity-75'
                      : 'bg-gray-50/50 opacity-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: level.color }}
                  >
                    Lv{level.level}
                  </div>
                  <div>
                    <div className={`font-medium text-sm ${isCurrent ? 'text-brand-700' : 'text-gray-700'}`}>
                      {level.name}
                    </div>
                    <div className="text-xs text-gray-400">{level.minOrders}单起</div>
                  </div>
                </div>
                {isCurrent && <Tag color="blue" size="sm">当前</Tag>}
                {isPast && <Tag color="green" size="sm">已达成</Tag>}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="text-base font-bold text-gray-900 mb-3">勋章墙</div>
        <div className="grid grid-cols-4 gap-3">
          {MEDALS.map((medal) => (
            <div
              key={medal.name}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all
                ${medal.unlocked
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-gray-50 opacity-40 grayscale'
                }
              `}
            >
              <span className="text-2xl">{medal.icon}</span>
              <span className="text-xs font-medium text-gray-600 text-center">{medal.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-red-500" />
          <div className="text-base font-bold text-gray-900">平台关怀</div>
        </div>
        <div className="space-y-3">
          {ACTIVITIES.map((act) => {
            const Icon = act.icon
            return (
              <div key={act.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.bg}`}>
                  <Icon className={`w-5 h-5 ${act.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{act.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{act.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
