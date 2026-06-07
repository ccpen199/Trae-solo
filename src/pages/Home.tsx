import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, TrendingUp, Users, Home as HomeIcon, Building2, PlayCircle, ArrowRight, MapPin, Star, MessageSquare, Phone, Video, Gift, Eye, Palette, Scale, Shield, LayoutDashboard, Calendar, CheckCircle } from 'lucide-react'
import LiveCard from '@/components/LiveCard'
import PropertyCard from '@/components/PropertyCard'
import ContentCard from '@/components/ContentCard'
import SmartImage from '@/components/SmartImage'
import { useAuthStore, useUIStore } from '@/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const demoLives = [
  { id: 1, coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800&h=450', title: '朝阳公园旁精品三居室 直播带看中', hostName: '张顾问', viewerCount: 1256, status: 'live' as const, category: 'house_viewing' },
  { id: 2, coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800&h=450', title: '现代简约风格装修设计分享', hostName: '李设计师', viewerCount: 892, status: 'live' as const, category: 'design' },
  { id: 3, coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=450', title: '二手房交易法律风险避坑指南', hostName: '王律师', viewerCount: 2341, status: 'live' as const, category: 'legal' },
  { id: 4, coverImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800&h=450', title: '全屋定制材料选择攻略', hostName: '陈工长', viewerCount: 567, status: 'scheduled' as const, category: 'renovation', scheduledAt: '2024-01-15 14:00' },
]

const demoProperties = [
  { id: 1, title: '朝阳区豪华三居室 南北通透 学区房', price: 8900000, area: 125, layout: '3室2厅2卫', address: '望京SOHO附近', city: '北京', district: '朝阳区', images: JSON.stringify(['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 2, title: '海淀区中关村精装两居室 近地铁', price: 6200000, area: 89, layout: '2室1厅1卫', address: '中关村大街', city: '北京', district: '海淀区', images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 3, title: '国贸CBD高端公寓 精装修拎包入住', price: 12500000, area: 156, layout: '4室2厅3卫', address: '国贸三期旁', city: '北京', district: '朝阳区', images: JSON.stringify(['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'new' },
  { id: 4, title: '通州副中心河景别墅 带花园车库', price: 15800000, area: 280, layout: '5室3厅4卫', address: '大运河森林公园旁', city: '北京', district: '通州区', images: JSON.stringify(['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'villa', listingType: 'new' },
]

const demoCases = [
  { id: 1, image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=600&h=800', title: '现代简约风三居室', budget: '25万', area: '120㎡', style: '现代简约' },
  { id: 2, image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=600&h=500', title: '北欧风小清新两居', budget: '18万', area: '85㎡', style: '北欧' },
  { id: 3, image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=600&h=700', title: '新中式典雅大宅', budget: '45万', area: '180㎡', style: '新中式' },
  { id: 4, image: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=600&h=600', title: '工业风loft公寓', budget: '32万', area: '95㎡', style: '工业风' },
  { id: 5, image: 'https://images.unsplash.com/photo-1600566753086-00f18fc6ab05?auto=format&fit=crop&q=80&w=600&h=450', title: '日式原木风四居', budget: '38万', area: '150㎡', style: '日式' },
]

const demoBrands = [
  { id: 1, name: '索菲亚', logo: 'https://picsum.photos/seed/brand1/120/60' },
  { id: 2, name: '欧派', logo: 'https://picsum.photos/seed/brand2/120/60' },
  { id: 3, name: '诺贝尔瓷砖', logo: 'https://picsum.photos/seed/brand3/120/60' },
  { id: 4, name: '大自然地板', logo: 'https://picsum.photos/seed/brand4/120/60' },
  { id: 5, name: '方太厨电', logo: 'https://picsum.photos/seed/brand5/120/60' },
  { id: 6, name: '科勒卫浴', logo: 'https://picsum.photos/seed/brand6/120/60' },
  { id: 7, name: '宜家家居', logo: 'https://picsum.photos/seed/brand7/120/60' },
  { id: 8, name: '居然之家', logo: 'https://picsum.photos/seed/brand8/120/60' },
]

const demoContents = [
  { id: 1, title: '2024年北京房价走势分析与预测', excerpt: '结合最新政策和市场数据，为您解读北京房地产市场的未来走向...', contentType: 'article' as const, authorName: '房产研究员', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 2341, collectCount: 856 },
  { id: 2, title: '装修避坑指南：10个最容易忽略的细节', excerpt: '过来人总结的装修经验，帮你少走弯路，省钱又省心...', contentType: 'video' as const, authorName: '装修达人', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 5672, collectCount: 2134 },
  { id: 3, title: 'VR看房攻略：如何在线选到心仪的房子', excerpt: '利用VR技术足不出户就能全方位了解房源，教你看门道...', contentType: 'article' as const, authorName: '科技宅', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800&h=600']), likeCount: 1893, collectCount: 621 },
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [cases, setCases] = useState<any[]>([])
  const [casesLoading, setCasesLoading] = useState(true)
  const showLoginModal = useUIStore((state) => state.showLoginModal)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setCasesLoading(true)
        const response = await api.renovation.cases({ pageSize: 6 }) as any
        if (response.success && response.data) {
          setCases(response.data.list)
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error)
      } finally {
        setCasesLoading(false)
      }
    }
    fetchCases()
  }, [])

  const stats = [
    { icon: HomeIcon, value: '12,847', label: '优质房源', color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: PlayCircle, value: '342', label: '正在直播', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Building2, value: '1,256', label: '装修公司', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Users, value: '56.8万', label: '注册用户', color: 'text-blue-500', bg: 'bg-blue-50' },
  ]

  return (
    <div className="min-h-screen bg-amber-50">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 gradient-animated"
          style={{ transform: `translateY(${scrollPosition * 0.3}px)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,148,136,0.3),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
              <span className="w-2 h-2 bg-amber-400 rounded-full live-pulse" />
              342 场直播正在进行中
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              从看房到入住
              <br />
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                一站式服务平台
              </span>
            </h1>

            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              直播带看 · VR样板间 · 装修设计 · 报价对比
              <br />
              专业团队为您的置业和装修保驾护航
            </p>

            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl blur-xl opacity-30" />
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const query = searchQuery.trim()
                  navigate(query ? `/search?q=${encodeURIComponent(query)}&type=all` : '/search?type=all')
                }}
                className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex-1 flex items-center gap-3 px-6 py-4">
                  <Search className="text-slate-400" size={22} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索房源、直播、装修案例..."
                    className="flex-1 bg-transparent text-slate-700 placeholder-slate-400 outline-none text-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="h-full px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:from-teal-700 hover:to-teal-600 transition-all"
                >
                  搜索
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/properties" className="btn-primary px-8 py-3.5 text-base flex items-center gap-2">
                <HomeIcon size={20} strokeWidth={1.5} />
                找房源
              </Link>
              <Link to="/live" className="px-8 py-3.5 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30">
                <PlayCircle size={20} strokeWidth={1.5} />
                看直播
              </Link>
              <button onClick={showLoginModal} className="px-8 py-3.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/30">
                <Users size={20} strokeWidth={1.5} />
                立即注册
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-amber-50 to-transparent" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={24} className={color} strokeWidth={1.5} />
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">核心功能</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Link to="/live/1" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
              <MessageSquare size={24} className="text-red-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">弹幕提问</p>
            <p className="text-xs text-slate-500 mt-1">实时互动答疑</p>
          </Link>
          <Link to="/live/1" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Phone size={24} className="text-blue-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">连麦答疑</p>
            <p className="text-xs text-slate-500 mt-1">一对一连线咨询</p>
          </Link>
          <Link to="/live/1" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <Gift size={24} className="text-amber-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">红包抽奖</p>
            <p className="text-xs text-slate-500 mt-1">直播间专属福利</p>
          </Link>
          <Link to="/properties/1" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-100 transition-colors">
              <Eye size={24} className="text-teal-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">VR全景看房</p>
            <p className="text-xs text-slate-500 mt-1">家具材质切换</p>
          </Link>
          <Link to="/renovation/quote-compare" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
              <Scale size={24} className="text-purple-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">报价对比</p>
            <p className="text-xs text-slate-500 mt-1">智能差异识别</p>
          </Link>
          <Link to="/materials" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
              <span className="text-2xl">🧱</span>
            </div>
            <p className="font-medium text-slate-900 text-sm">建材选购</p>
            <p className="text-xs text-slate-500 mt-1">全球集采直供</p>
          </Link>
          <Link to="/renovation" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
              <Shield size={24} className="text-emerald-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">施工进度</p>
            <p className="text-xs text-slate-500 mt-1">全程可复查</p>
          </Link>
          <Link to="/renovation" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
              <CheckCircle size={24} className="text-indigo-500" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-slate-900 text-sm">验收交付</p>
            <p className="text-xs text-slate-500 mt-1">节点验收保障</p>
          </Link>
          {user?.role === 'admin' && (
            <>
              <Link to="/admin" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-rose-100 transition-colors">
                  <Shield size={24} className="text-rose-500" strokeWidth={1.5} />
                </div>
                <p className="font-medium text-slate-900 text-sm">内容审核</p>
                <p className="text-xs text-slate-500 mt-1">敏感词+人工复审</p>
              </Link>
              <Link to="/admin" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                  <LayoutDashboard size={24} className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <p className="font-medium text-slate-900 text-sm">KOL管理</p>
                <p className="text-xs text-slate-500 mt-1">排期/分成/数据</p>
              </Link>
              <Link to="/admin" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-slate-100 transition-colors">
                  <Calendar size={24} className="text-slate-600" strokeWidth={1.5} />
                </div>
                <p className="font-medium text-slate-900 text-sm">年审提醒</p>
                <p className="text-xs text-slate-500 mt-1">资质年审管理</p>
              </Link>
            </>
          )}
          {user && (
            <Link to="/dashboard" className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-teal-200">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-100 transition-colors">
                <LayoutDashboard size={24} className="text-teal-600" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-slate-900 text-sm">工作台</p>
              <p className="text-xs text-slate-500 mt-1">角色专属页面</p>
            </Link>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-6 bg-teal-600 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900">热门直播</h2>
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full live-pulse" />
                直播中
              </span>
            </div>
            <p className="text-slate-500 ml-3">专业顾问实时带看，互动答疑</p>
          </div>
          <Link to="/live" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium">
            查看更多 <ChevronRight size={18} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="relative">
          <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
            {demoLives.map((live) => (
              <div key={live.id} className="w-80 shrink-0">
                <LiveCard {...live} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900">热门房源</h2>
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-teal-100 text-teal-600 text-xs font-medium rounded-full">
                <TrendingUp size={12} strokeWidth={1.5} />
                热门
              </span>
            </div>
            <p className="text-slate-500 ml-3">精选优质房源，VR全景在线看房</p>
          </div>
          <Link to="/properties" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium">
            查看更多 <ChevronRight size={18} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900">装修案例</h2>
            </div>
            <p className="text-slate-500 ml-3">真实装修案例，风格多样，参考性强</p>
          </div>
          <Link to="/renovation" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium">
            查看更多 <ChevronRight size={18} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="masonry-grid">
          {casesLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="masonry-item">
                <div className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="aspect-[3/4] bg-slate-200" />
                  <div className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : cases.length > 0 ? (
            cases.map((caseItem) => (
              <div key={caseItem.id} className="masonry-item">
                <Link to={`/renovation#case-${caseItem.id}`} className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all card-hover group">
                  <div className="relative overflow-hidden">
                    <SmartImage
                      src={caseItem.images?.[0] || `https://picsum.photos/seed/case${caseItem.id}/600/800`}
                      alt={caseItem.title}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackText="装修案例"
                      aspectRatio="3/4"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                        {caseItem.style}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">{caseItem.title}</span>
                        <span className="text-amber-300 font-bold text-sm">
                          {caseItem.budget ? `¥${(caseItem.budget / 10000).toFixed(0)}万` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin size={14} strokeWidth={1.5} />
                        {caseItem.area ? `${caseItem.area}㎡` : ''}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={12} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
                        ))}
                      </div>
                    </div>
                    {caseItem.company_name && (
                      <div className="mt-2 text-xs text-slate-500">
                        {caseItem.company_name}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500">
              暂无装修案例
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">合作建材品牌</h2>
            <p className="text-slate-500">严选优质品牌，品质有保障</p>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex marquee">
              {[...demoBrands, ...demoBrands].map((brand, index) => (
                <div
                  key={`${brand.id}-${index}`}
                  className="shrink-0 w-40 h-16 mx-6 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-teal-50 transition-colors overflow-hidden"
                >
                  <SmartImage
                    src={brand.logo}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain"
                    fallbackText={brand.name.slice(0, 2)}
                    aspectRatio="2/1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-6 bg-rose-500 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900">精选内容</h2>
            </div>
            <p className="text-slate-500 ml-3">专业房产知识，装修干货分享</p>
          </div>
          <Link to="/content" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium">
            查看更多 <ChevronRight size={18} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoContents.map((content) => (
            <ContentCard key={content.id} {...content} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-500 p-10 md:p-14">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              准备好开始您的置业装修之旅了吗？
            </h2>
            <p className="text-white/80 text-lg mb-8">
              立即注册，获取专属顾问服务，免费获取装修报价和房源推荐
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={showLoginModal}
                className="px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-lg flex items-center gap-2"
              >
                免费注册
                <ArrowRight size={20} strokeWidth={1.5} />
              </button>
              <Link
                to="/renovation/quote-compare"
                className="px-8 py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
              >
                获取装修报价
                <ArrowRight size={20} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
