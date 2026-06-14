import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store, Star, ShieldCheck, Package, ArrowRight, Info } from 'lucide-react'
import { shops } from '@/mocks'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.floor(rating)
              ? 'fill-gold-400 text-gold-400'
              : i < rating
              ? 'fill-gold-200 text-gold-300'
              : 'text-gray-200'
          }
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">{rating}</span>
    </div>
  )
}

export default function Shop() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-earth-500">店铺管理</h1>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium shadow-md hover:bg-primary-600 transition-colors"
        >
          <Store size={20} />
          免费入驻开店
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {shops.map((shop, idx) => (
          <motion.div
            key={shop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-serif font-bold text-xl shrink-0">
                  {shop.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-earth-500 text-lg truncate">
                    {shop.name}
                  </h3>
                  <StarRating rating={shop.rating} />
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  营业中
                </span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                {shop.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Package size={14} className="text-primary-500" />
                    {shop.products.length} 件商品
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <ShieldCheck size={14} className="text-gold-500" />
                    保证金 ¥{shop.deposit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50">
              <Link
                to={`/shop/${shop.id}`}
                className="flex items-center justify-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                进入店铺
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={20} className="text-primary-500" />
          <h3 className="font-serif text-lg font-bold text-earth-500">保证金制度说明</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary-500" />
            </div>
            <div>
              <h4 className="font-medium text-earth-500 mb-1">信用保障</h4>
              <p className="text-sm text-gray-500">缴纳保证金后即可开店营业，保证金作为信用担保，保障交易安全</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center shrink-0">
              <Package size={20} className="text-gold-500" />
            </div>
            <div>
              <h4 className="font-medium text-earth-500 mb-1">全额退还</h4>
              <p className="text-sm text-gray-500">无违规记录且申请退出时，保证金将全额退还至原支付账户</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-earth-50 flex items-center justify-center shrink-0">
              <Star size={20} className="text-earth-400" />
            </div>
            <div>
              <h4 className="font-medium text-earth-500 mb-1">信用评级</h4>
              <p className="text-sm text-gray-500">保证金金额与信用等级挂钩，高信用店铺享更多平台流量扶持</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
