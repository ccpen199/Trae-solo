import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crown, Store, ShoppingBag, BarChart3 } from 'lucide-react'
import { api } from '@/api/client'
import { useStore } from '@/store'
import type { Product, City } from '@/types'

const businessEntries = [
  { icon: Crown, title: '会员权益', desc: '跨城积分通兑，权益无忧享', path: '/member' },
  { icon: Store, title: '商户入驻', desc: '一键开通，共享联盟流量', path: '/merchant' },
  { icon: ShoppingBag, title: '消费场景', desc: '观影美食购物，一站尽享', path: '/scenarios' },
  { icon: BarChart3, title: '运营看板', desc: '数据驱动，精准决策', path: '/dashboard' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function formatNumber(n: number): string {
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '万'
  }
  return n.toLocaleString()
}

export default function Home() {
  const navigate = useNavigate()
  const currentCity = useStore((s) => s.currentCity)
  const [cityProducts, setCityProducts] = useState<Product[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [totalMerchants, setTotalMerchants] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [crossCityTransactions, setCrossCityTransactions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, summaryData, citiesData] = await Promise.all([
          api.products.list({ city: currentCity }),
          api.dashboard.summary(),
          api.cities.list(),
        ])
        setCityProducts(productsData)
        setCities(citiesData)
        setTotalMerchants(summaryData.totalMerchants)
        setTotalMembers(summaryData.totalMembers)
        setCrossCityTransactions(summaryData.crossCityTransactions)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentCity])

  if (loading) {
    return (
      <div className="min-h-screen bg-wudu-950 overflow-x-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const stats = [
    { value: cities.length, label: '联盟城市' },
    { value: formatNumber(totalMerchants), label: '入驻商户' },
    { value: formatNumber(totalMembers), label: '会员总数' },
    { value: formatNumber(crossCityTransactions), label: '跨城交易' },
  ]

  return (
    <div className="min-h-screen bg-wudu-950 overflow-x-hidden">
      <section className="relative flex flex-col items-center justify-center py-24 px-4 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(196,18,48,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 30% 60%, rgba(212,168,67,0.06) 0%, transparent 60%)',
          }}
        />
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="font-serif text-4xl md:text-5xl text-white text-center relative z-10"
        >
          川渝城市会员权益融合平台
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          className="mt-4 text-jinguan-400 text-lg md:text-xl tracking-widest relative z-10"
        >
          一城入会，十城通行
        </motion.p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {businessEntries.map((entry) => (
            <motion.div
              key={entry.title}
              variants={itemVariants}
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px 2px rgba(212,168,67,0.25)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(entry.path)}
              className="cursor-pointer rounded-2xl bg-gradient-to-br from-shujin-600 to-shujin-800 p-6 border border-shujin-700/40 transition-shadow duration-300"
            >
              <entry.icon className="w-8 h-8 text-white/90 mb-3" />
              <h3 className="text-white font-semibold text-lg mb-1">{entry.title}</h3>
              <p className="text-wudu-400 text-sm">{entry.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-serif text-2xl text-white mb-6">城市热门推荐</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {cityProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -6 }}
              className="flex-shrink-0 w-52 rounded-xl bg-wudu-800 border border-wudu-700/50 overflow-hidden"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h4 className="text-white text-sm font-medium truncate">{product.name}</h4>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-wudu-700 text-wudu-300">
                  {product.city}
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-shujin-600 font-bold text-lg">¥{product.price}</span>
                  <span className="text-wudu-500 text-xs line-through">¥{product.originalPrice}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {cityProducts.length === 0 && (
            <p className="text-wudu-500 text-sm py-8">当前城市暂无热门推荐</p>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-wudu-800 border border-jinguan-400/20 p-5 text-center"
            >
              <p className="text-jinguan-400 text-2xl md:text-3xl font-bold">{stat.value}</p>
              <p className="text-white/80 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
