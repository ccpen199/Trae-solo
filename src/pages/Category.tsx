import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronDown, X, Eye } from 'lucide-react'
import { useStore } from '@/store'
import { jobPosts, housingPosts, foodPosts, datingPosts, townships } from '@/data'
import type { InfoPost } from '@/types'

const tabs = [
  { key: 'jobs', label: '招聘求职' },
  { key: 'housing', label: '房屋租售' },
  { key: 'food', label: '美食推荐' },
  { key: 'dating', label: '交友互动' },
]

const postMap: Record<string, InfoPost[]> = {
  jobs: jobPosts, housing: housingPosts, food: foodPosts, dating: datingPosts,
}

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

function JobCard({ post, onClick }: { post: InfoPost; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="card-hover bg-white rounded-xl border border-rock-100 border-l-4 border-l-jade-500 p-4 cursor-pointer">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-rock-900 line-clamp-1 flex-1">{post.title}</h3>
        <span className="text-ember-400 font-number text-lg font-bold ml-2 shrink-0">
          {post.structuredData?.salary}
        </span>
      </div>
      {post.structuredData?.company && (
        <p className="text-xs text-rock-500 mt-1">{post.structuredData.company}</p>
      )}
      {post.structuredData?.requirements && (
        <div className="flex flex-wrap gap-1 mt-2">
          {post.structuredData.requirements.split('，').map((r, i) => (
            <span key={i} className="tag-jade text-xs px-1.5 py-0.5 rounded">{r}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 text-xs text-rock-400">
        <MapPin size={12} /><span>{post.location.township}</span>
        <span>·</span><span>{timeAgo(post.createdAt)}</span>
        <Eye size={12} className="ml-auto" /><span>{post.views}</span>
      </div>
    </div>
  )
}

function HousingCard({ post, onClick }: { post: InfoPost; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="card-hover bg-white rounded-xl border border-rock-100 border-l-4 border-l-blue-500 p-4 cursor-pointer">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-rock-900 line-clamp-1 flex-1">{post.title}</h3>
        <span className="text-ember-400 font-number text-lg font-bold ml-2 shrink-0">
          {post.structuredData?.price}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-rock-500">
        {post.structuredData?.area && <span>{post.structuredData.area}</span>}
        {post.structuredData?.deposit && <span>{post.structuredData.deposit}</span>}
      </div>
      {post.structuredData?.furniture && (
        <div className="flex flex-wrap gap-1 mt-2">
          {post.structuredData.furniture.split('、').slice(0, 4).map((f, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-1.5 py-0.5 rounded">{f}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 text-xs text-rock-400">
        <MapPin size={12} /><span>{post.location.township}</span>
        <span>·</span><span>{timeAgo(post.createdAt)}</span>
        <Eye size={12} className="ml-auto" /><span>{post.views}</span>
      </div>
    </div>
  )
}

function FoodCard({ post, onClick }: { post: InfoPost; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="card-hover bg-white rounded-xl border border-rock-100 flex overflow-hidden cursor-pointer">
      {post.images[0] && (
        <img src={post.images[0]} alt={post.title} className="w-28 h-28 object-cover shrink-0" />
      )}
      <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-rock-900 line-clamp-1">{post.title}</h3>
          <p className="text-xs text-rock-500 mt-1 line-clamp-2">{post.content}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-rock-400">
          <MapPin size={12} /><span>{post.location.township}</span>
          <span>·</span><span>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

function DatingCard({ post, onClick }: { post: InfoPost; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="card-hover bg-white rounded-xl border border-rock-100 p-4 cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {post.author.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-rock-900 line-clamp-1">{post.title}</h3>
          <p className="text-xs text-rock-500 mt-1 line-clamp-2">{post.content}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map(t => (
              <span key={t} className="tag-jade text-xs px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-rock-400">
            <MapPin size={12} /><span>{post.location.township}</span>
            <span>·</span><span>{timeAgo(post.createdAt)}</span>
            <Eye size={12} className="ml-auto" /><span>{post.views}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ post, onClose }: { post: InfoPost; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-5 z-10">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-rock-400 hover:text-rock-700">
          <X size={20} />
        </button>
        <h2 className="font-serif text-lg font-semibold text-rock-900 pr-8">{post.title}</h2>
        <div className="flex items-center gap-2 mt-2 text-xs text-rock-400">
          <span>{post.author}</span><span>·</span>
          <span>{post.location.township}</span><span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <Eye size={12} className="ml-1" /><span>{post.views}</span>
        </div>
        {post.images[0] && (
          <img src={post.images[0]} alt={post.title} className="w-full rounded-lg mt-3 max-h-48 object-cover" />
        )}
        <p className="text-sm text-rock-700 mt-3 leading-relaxed">{post.content}</p>
        {post.structuredData && (
          <div className="mt-3 bg-rock-50 rounded-lg p-3 space-y-1.5">
            {Object.entries(post.structuredData).map(([k, v]) => (
              <div key={k} className="text-xs flex">
                <span className="text-rock-400 w-16 shrink-0">{k}</span>
                <span className="text-rock-700">{v}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-3">
          {post.tags.map(t => (
            <span key={t} className="tag-jade text-xs px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default function Category() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const { currentTownship } = useStore()
  const [activeTownship, setActiveTownship] = useState('全部')
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest')
  const [selectedPost, setSelectedPost] = useState<InfoPost | null>(null)
  const [showTownshipDropdown, setShowTownshipDropdown] = useState(false)

  const activeTab = type || 'jobs'

  const posts = postMap[activeTab] || []
  const filtered = posts
    .filter(p => activeTownship === '全部' || p.location.township === activeTownship)
    .sort((a, b) => sortBy === 'latest'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : b.views - a.views
    )

  const cardMap: Record<string, React.FC<{ post: InfoPost; onClick: () => void }>> = {
    jobs: JobCard, housing: HousingCard, food: FoodCard, dating: DatingCard,
  }
  const CardComponent = cardMap[activeTab] || JobCard

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="border-b border-rock-100 bg-white sticky top-16 z-20">
        <div className="flex">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => navigate(`/category/${tab.key}`)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                activeTab === tab.key ? 'text-jade-500' : 'text-rock-400 hover:text-rock-700'}`}>
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-jade-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-rock-100">
        <div className="relative">
          <button onClick={() => setShowTownshipDropdown(v => !v)}
            className="flex items-center gap-1 text-sm text-rock-700 bg-rock-50 px-3 py-1.5 rounded-lg">
            {activeTownship === '全部' ? (currentTownship === '全部' ? '全部乡镇' : currentTownship) : activeTownship}
            <ChevronDown size={14} />
          </button>
          {showTownshipDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-rock-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30 w-36">
              <button onClick={() => { setActiveTownship('全部'); setShowTownshipDropdown(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-jade-50">全部</button>
              {townships.map(t => (
                <button key={t.code} onClick={() => { setActiveTownship(t.name); setShowTownshipDropdown(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-jade-50">{t.name}</button>
              ))}
            </div>
          )}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'latest' | 'views')}
          className="text-sm text-rock-700 bg-rock-50 px-3 py-1.5 rounded-lg border-0 outline-none cursor-pointer">
          <option value="latest">最新发布</option>
          <option value="views">最多浏览</option>
        </select>
      </div>

      <div className="px-4 py-3 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-rock-400 py-12">暂无相关信息</p>
        )}
        {filtered.map(post => (
          <CardComponent key={post.id} post={post} onClick={() => setSelectedPost(post)} />
        ))}
      </div>

      <AnimatePresence>
        {selectedPost && <DetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
