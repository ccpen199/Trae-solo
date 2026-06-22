import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Briefcase, Home as HomeIcon, UtensilsCrossed, Heart,
  Shield, Zap, Building2, Phone, Stethoscope, Bus, Eye
} from 'lucide-react'
import { useStore } from '@/store'
import { newsArticles, jobPosts, housingPosts, foodPosts, datingPosts } from '@/data'
import type { InfoPost } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

const categoryMap: Record<string, string> = {
  job: '/category/jobs',
  housing: '/category/housing',
  food: '/category/food',
  dating: '/category/dating',
}

const typeLabel: Record<string, string> = {
  job: '招聘', housing: '房产', food: '美食', dating: '交友',
}

const categoryIcons = [
  { label: '招聘', icon: Briefcase, to: '/category/jobs', gradient: 'from-jade-500 to-jade-700' },
  { label: '房产', icon: HomeIcon, to: '/category/housing', gradient: 'from-jade-400 to-jade-600' },
  { label: '美食', icon: UtensilsCrossed, to: '/category/food', gradient: 'from-jade-600 to-jade-800' },
  { label: '交友', icon: Heart, to: '/category/dating', gradient: 'from-jade-300 to-jade-500' },
]

const civicServices = [
  { label: '社保查询', icon: Shield }, { label: '水电缴费', icon: Zap },
  { label: '政务服务', icon: Building2 }, { label: '便民电话', icon: Phone },
  { label: '医疗挂号', icon: Stethoscope }, { label: '交通查询', icon: Bus },
]

const newsCategoryLabel: Record<string, string> = {
  local: '本地', policy: '政策', township: '乡镇', guide: '攻略',
}

export default function Home() {
  const { currentTownship } = useStore()
  const [slide, setSlide] = useState(0)
  const topNews = newsArticles.slice(0, 4)

  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % topNews.length), 4000)
    return () => clearInterval(timer)
  }, [topNews.length])

  const allPosts: InfoPost[] = [...jobPosts, ...housingPosts, ...foodPosts, ...datingPosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const filteredPosts = currentTownship === '全部'
    ? allPosts
    : allPosts.filter(p => p.location.township === currentTownship)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <section className="mountain-bg px-5 pt-8 pb-14 text-white">
        <p className="text-sm opacity-90 flex items-center gap-1">
          <MapPin size={14} /> 当前定位：{currentTownship}
        </p>
        <h1 className="font-serif text-2xl font-bold mt-3">镇雄本地通</h1>
        <p className="text-sm opacity-80 mt-1">一平台知镇雄</p>
      </section>

      <section className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-4 gap-3">
          {categoryIcons.map(({ label, icon: Icon, to, gradient }, i) => (
            <Link key={to} to={to}
              className={`animate-fade-in-up stagger-${i + 1} flex flex-col items-center gap-2`}>
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                <Icon size={24} className="text-white" />
              </div>
              <span className="text-xs text-rock-700 font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 mt-6">
        <h2 className="font-serif text-lg font-semibold mb-3">热点资讯</h2>
        <div className="relative rounded-xl overflow-hidden aspect-[16/9]">
          {topNews.map((n, i) => (
            <Link key={n.id} to={`/news/${n.id}`}
              className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <img src={n.coverImage} alt={n.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-xs bg-jade-500 text-white px-2 py-0.5 rounded-full mr-2">
                  {newsCategoryLabel[n.category] || n.category}
                </span>
                <h3 className="text-white font-medium mt-1 line-clamp-2 text-sm">{n.title}</h3>
              </div>
            </Link>
          ))}
          <div className="absolute bottom-2 right-4 flex gap-1.5">
            {topNews.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === slide ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 mt-6">
        <h2 className="font-serif text-lg font-semibold mb-3">信息流</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPosts.slice(0, 12).map(post => (
            <Link key={post.id} to={categoryMap[post.type]}
              className="card-hover bg-white rounded-xl overflow-hidden border border-rock-100">
              {post.images[0] && (
                <img src={post.images[0]} alt={post.title} className="w-full h-32 object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    post.type === 'job' || post.type === 'housing' ? 'tag-ember' : 'tag-jade'}`}>
                    {typeLabel[post.type]}
                  </span>
                  {post.type === 'job' && post.structuredData?.salary && (
                    <span className="text-ember-400 font-number text-sm font-semibold ml-auto">
                      {post.structuredData.salary}
                    </span>
                  )}
                  {post.type === 'housing' && post.structuredData?.price && (
                    <span className="text-ember-400 font-number text-sm font-semibold ml-auto">
                      {post.structuredData.price}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-rock-900 line-clamp-2">{post.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-rock-400">
                  <span>{post.location.township}</span>
                  <span>·</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  <Eye size={12} className="ml-auto" />
                  <span>{post.views}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 mt-6 mb-6">
        <h2 className="font-serif text-lg font-semibold mb-3">便民服务</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {civicServices.map(({ label, icon: Icon }) => (
            <Link key={label} to="/services"
              className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16 p-2 rounded-xl border border-jade-200 bg-white hover:bg-jade-50 transition-colors">
              <Icon size={20} className="text-jade-500" />
              <span className="text-xs text-rock-700 whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
