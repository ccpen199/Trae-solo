import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, ShieldCheck, MapPin, Phone, Clock } from 'lucide-react'
import { merchants } from '@/data'

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const merchant = merchants.find(m => m.id === id)

  if (!merchant) {
    return (
      <div className="min-h-screen bg-rock-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rock-500 mb-2">未找到商户信息</p>
          <button onClick={() => navigate(-1)} className="text-jade-500 text-sm">返回上一页</button>
        </div>
      </div>
    )
  }

  const similar = merchants.filter(m => m.township === merchant.township && m.id !== merchant.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-rock-50 pb-8">
      <div className="relative">
        <img
          src={merchant.images[0]}
          alt={merchant.name}
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-serif font-semibold text-white">{merchant.name}</h1>
            {merchant.verified && <ShieldCheck className="w-5 h-5 text-jade-300" />}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-yellow-400 text-sm">
              <Star className="w-4 h-4 fill-yellow-400" /> {merchant.rating}
            </span>
            <span className={`flex items-center gap-1 text-sm ${merchant.status === 'open' ? 'text-jade-300' : 'text-rock-300'}`}>
              <span className={`w-2 h-2 rounded-full ${merchant.status === 'open' ? 'bg-jade-400' : 'bg-rock-400'}`} />
              {merchant.status === 'open' ? '营业中' : '休息中'}
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 -mt-2"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-rock-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rock-700">{merchant.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-rock-400 flex-shrink-0" />
            <p className="text-sm text-rock-700">{merchant.phone}</p>
          </div>
          {merchant.businessHours && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-rock-400 flex-shrink-0" />
              <p className="text-sm text-rock-700">{merchant.businessHours}</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 mt-4"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-serif font-semibold text-rock-900 mb-2">简介</h2>
          <p className="text-sm text-rock-600 leading-relaxed">{merchant.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {merchant.category.map(c => (
              <span key={c} className="px-3 py-1 rounded-full bg-jade-50 text-jade-700 text-xs border border-jade-200">
                {c}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {similar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 mt-4"
        >
          <h2 className="font-serif font-semibold text-rock-900 mb-3">附近商户</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {similar.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/merchant/${s.id}`)}
                className="flex-shrink-0 w-40 bg-white rounded-xl overflow-hidden shadow-sm card-hover text-left"
              >
                <img src={s.images[0]} alt={s.name} className="w-full h-24 object-cover" />
                <div className="p-2">
                  <p className="text-sm font-medium text-rock-900 truncate">{s.name}</p>
                  <span className="flex items-center gap-1 text-xs text-rock-500">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {s.rating}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
