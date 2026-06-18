import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, MapPin, Star, Gift, ArrowRightLeft } from 'lucide-react'
import { api } from '@/api/client'
import { useStore } from '@/store'
import type { Member, PointRecord, CrossCityBenefit, Product } from '@/types'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  bronze: { label: '青铜会员', color: 'bg-amber-800/30 text-amber-600' },
  silver: { label: '白银会员', color: 'bg-gray-400/20 text-gray-300' },
  gold: { label: '黄金会员', color: 'bg-jinguan-400/20 text-jinguan-400' },
  diamond: { label: '钻石会员', color: 'bg-cyan-400/20 text-cyan-300' },
}

function ProfileCard({ member }: { member: Member }) {
  const level = LEVEL_MAP[member.level]

  return (
    <motion.div
      {...fadeUp}
      className="rounded-2xl bg-gradient-to-br from-wudu-800 to-wudu-900 p-6 border border-wudu-700/50"
    >
      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-jinguan-400 animate-pulse-gold">
            <img
              src={member.avatar}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white text-lg font-medium">{member.phone}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs ${level.color}`}>
              <Crown className="w-3 h-3 inline mr-1" />
              {level.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs bg-wudu-700 text-wudu-300">
              {member.city}
            </span>
            <span className="flex items-center gap-1 text-xs text-shujin-500">
              <MapPin className="w-3 h-3" />
              当前定位: {member.lbsCity}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {member.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[10px] bg-wudu-700 text-wudu-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PointsOverview({ member }: { member: Member }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.1 }}
      className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50"
    >
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-jinguan-400 text-4xl font-bold">
          {member.points.toLocaleString()}
        </span>
        <span className="text-wudu-400 text-sm">可用积分</span>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg border border-jinguan-400/40 text-jinguan-400 text-sm hover:bg-jinguan-400/10 transition-colors">
          积分明细
        </button>
        <button className="px-4 py-2 rounded-lg border border-jinguan-400/40 text-jinguan-400 text-sm hover:bg-jinguan-400/10 transition-colors">
          兑换商城
        </button>
        <button className="px-4 py-2 rounded-lg border border-jinguan-400/40 text-jinguan-400 text-sm hover:bg-jinguan-400/10 transition-colors">
          积分转赠
        </button>
      </div>
    </motion.div>
  )
}

function PointsTimeline({ records }: { records: PointRecord[] }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.15 }}
      className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50"
    >
      <h3 className="font-serif text-lg text-white mb-5">积分流水</h3>
      <div className="relative">
        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-wudu-600" />
        <div className="space-y-4">
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-start gap-4 pl-7 relative"
            >
              <div
                className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                  record.type === 'earn'
                    ? 'bg-jinguan-400/20 border-2 border-jinguan-400'
                    : 'bg-shujin-600/20 border-2 border-shujin-600'
                }`}
              >
                {record.type === 'earn' ? (
                  <Star className="w-3 h-3 text-jinguan-400" />
                ) : (
                  <Gift className="w-3 h-3 text-shujin-600" />
                )}
              </div>
              <div className="flex-1 bg-wudu-900 rounded-lg p-3 border border-wudu-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">{record.description}</span>
                  <span
                    className={`font-bold text-sm ${
                      record.type === 'earn' ? 'text-jinguan-400' : 'text-shujin-600'
                    }`}
                  >
                    {record.type === 'earn' ? '+' : '-'}{record.amount}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-wudu-500">
                  <span>{record.datetime}</span>
                  <span className="px-1.5 py-0.5 rounded bg-wudu-700 text-wudu-400">
                    {record.city}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function CrossCityBenefits({ benefits }: { benefits: CrossCityBenefit[] }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.2 }}
      className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50"
    >
      <h3 className="font-serif text-lg text-white mb-5">跨城权益互认</h3>
      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.08 }}
            className={`rounded-xl p-4 border ${
              benefit.enabled
                ? 'bg-wudu-900 border-jinguan-400/30'
                : 'bg-wudu-900 border-wudu-700/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <ArrowRightLeft className="w-4 h-4 text-jinguan-400" />
                {benefit.fromCity} → {benefit.toCity}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={benefit.enabled}
                  className="sr-only peer"
                  readOnly
                />
                <div
                  className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${
                    benefit.enabled ? 'bg-jinguan-400' : 'bg-wudu-600'
                  }`}
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-wudu-400 text-sm">积分兑换比例</span>
              <span
                className={`text-xl font-bold ${
                  benefit.enabled ? 'text-jinguan-400' : 'text-wudu-500'
                }`}
              >
                1:{benefit.pointsRatio}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function Recommendations({ recommendations, currentCity }: { recommendations: Product[]; currentCity: string }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.25 }}
      className="rounded-2xl bg-wudu-800 p-6 border border-wudu-700/50"
    >
      <h3 className="font-serif text-lg text-white mb-5">猜你喜欢</h3>
      <div className="grid grid-cols-2 gap-4">
        {recommendations.slice(0, 6).map((product, index) => {
          const isCityFallback = product.city !== currentCity
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-xl bg-wudu-900 border border-wudu-700/50 overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {isCityFallback && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] bg-jinguan-400/80 text-wudu-900 font-medium">
                    城市偏好推荐
                  </span>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-white text-sm font-medium truncate mb-1">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-shujin-500 font-bold">¥{product.price}</span>
                  {product.rating != null && (
                    <span className="flex items-center gap-1 text-xs text-wudu-400">
                      <Star className="w-3 h-3 text-jinguan-400 fill-jinguan-400" />
                      {product.rating}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function Member() {
  const currentCity = useStore((s) => s.currentCity)
  const [member, setMember] = useState<Member | null>(null)
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([])
  const [benefits, setBenefits] = useState<CrossCityBenefit[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, pointsData, benefitsData, recsData] = await Promise.all([
          api.member.profile(),
          api.member.points(),
          api.member.benefits(),
          api.member.recommendations(currentCity),
        ])
        setMember(profileData)
        setPointRecords(pointsData.records)
        setBenefits(benefitsData)
        setRecommendations(recsData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentCity])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!member) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <ProfileCard member={member} />
      <PointsOverview member={member} />
      <PointsTimeline records={pointRecords} />
      <CrossCityBenefits benefits={benefits} />
      <Recommendations recommendations={recommendations} currentCity={currentCity} />
    </div>
  )
}
