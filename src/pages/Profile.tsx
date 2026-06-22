import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  User, MapPin, FileText, Heart, Tags, Bell, Search, Info, LogOut,
  ChevronRight, ChevronDown, X, Check
} from 'lucide-react'
import { useStore } from '@/store'
import { jobPosts, housingPosts, foodPosts, datingPosts, townships } from '@/data'
import type { InfoPost } from '@/types'

const allTags = ['招聘', '美食', '房产', '交友', '教育', '医疗', '购物', '生活服务', '农资', '交通']
const typeLabel: Record<string, string> = { job: '招聘', housing: '房产', food: '美食', dating: '交友' }
const typeColor: Record<string, string> = { job: 'tag-ember', housing: 'tag-ember', food: 'tag-jade', dating: 'tag-jade' }

const allPosts: InfoPost[] = [...jobPosts, ...housingPosts, ...foodPosts, ...datingPosts]

function MenuItem({ icon: Icon, label, right, onClick }: {
  icon: React.ElementType; label: string; right?: React.ReactNode; onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="flex items-center w-full px-4 py-3.5 hover:bg-rock-50 transition-colors">
      <Icon size={18} className="text-jade-500 mr-3" />
      <span className="flex-1 text-left text-sm text-rock-900">{label}</span>
      {right}
      <ChevronRight size={16} className="text-rock-300 ml-1" />
    </button>
  )
}

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Profile() {
  const nav = useNavigate()
  const { user, setUser, currentTownship, setCurrentTownship, interestTags, setInterestTags,
    favorites, toggleFavorite, searchHistory, clearSearchHistory, notifications } = useStore()
  const [openTags, setOpenTags] = useState(false)
  const [openFav, setOpenFav] = useState(false)
  const [openLocation, setOpenLocation] = useState(false)
  const [openSearch, setOpenSearch] = useState(false)
  const [openNotify, setOpenNotify] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [selectTown, setSelectTown] = useState(currentTownship)
  const favRef = useRef<HTMLDivElement>(null)

  const favPosts = favorites.map(id => allPosts.find(p => p.id === id)).filter(Boolean) as InfoPost[]

  const handleFavClick = () => {
    const next = !openFav
    setOpenFav(next)
    if (next) setTimeout(() => favRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }

  const toggleTag = (tag: string) => {
    setInterestTags(interestTags.includes(tag) ? interestTags.filter(t => t !== tag) : [...interestTags, tag])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="max-w-lg mx-auto pb-8">

      <section className="mountain-bg px-5 pt-10 pb-16 text-white relative">
        <div className="flex items-start justify-between">
          <div />
          <div className="relative">
            <Bell size={20} className="cursor-pointer" onClick={() => setOpenNotify(!openNotify)} />
            {notifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-number">
                {notifications}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className="w-20 h-20 rounded-full bg-white/20 border-[3px] border-white flex items-center justify-center">
            <User size={36} className="text-white/80" />
          </div>
          <h2 className="font-serif text-xl mt-3">{user?.nickname || '未登录'}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">普通用户</span>
            <span className="text-xs flex items-center gap-1 opacity-90">
              <MapPin size={12} /> {currentTownship}
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-xl shadow-sm flex divide-x divide-rock-100">
          {[
            { n: 0, label: '发布' },
            { n: favorites.length, label: '收藏', ref: favRef, onClick: handleFavClick },
            { n: 0, label: '关注' },
          ].map(({ n, label, onClick }) => (
            <button key={label} onClick={onClick}
              className="flex-1 py-3 flex flex-col items-center hover:bg-rock-50 transition-colors">
              <span className="font-number text-xl text-rock-900">{n}</span>
              <span className="text-sm text-rock-500">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm divide-y divide-rock-50">
          <MenuItem icon={FileText} label="我的发布" onClick={() => nav('/publish')} />
          <MenuItem icon={Heart} label="我的收藏"
            right={favorites.length > 0 ? <span className="text-xs text-rock-400 mr-1">{favorites.length}</span> : undefined}
            onClick={handleFavClick} />
          <MenuItem icon={Tags} label="兴趣标签"
            right={<ChevronDown size={16} className={`text-rock-300 ml-1 transition-transform ${openTags ? 'rotate-180' : ''}`} />}
            onClick={() => setOpenTags(!openTags)} />
          <MenuItem icon={MapPin} label="位置设置"
            right={<ChevronDown size={16} className={`text-rock-300 ml-1 transition-transform ${openLocation ? 'rotate-180' : ''}`} />}
            onClick={() => setOpenLocation(!openLocation)} />
        </div>

        <Collapsible open={openTags}>
          <div className="bg-white rounded-xl shadow-sm mt-2 p-4">
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                    interestTags.includes(tag)
                      ? 'bg-jade-500 text-white'
                      : 'bg-rock-100 text-rock-600 border border-rock-200'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </Collapsible>
      </section>

      <section ref={favRef} className="px-4 mt-2">
        <Collapsible open={openFav}>
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {favPosts.length === 0 ? (
              <p className="text-sm text-rock-400 text-center py-4">暂无收藏</p>
            ) : favPosts.map(post => (
              <div key={post.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-rock-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-rock-900 truncate">{post.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[post.type]}`}>
                      {typeLabel[post.type]}
                    </span>
                    <span className="text-xs text-rock-400">{post.location.township}</span>
                  </div>
                </div>
                <button onClick={() => toggleFavorite(post.id)}
                  className="p-1.5 hover:bg-red-50 rounded-full transition-colors">
                  <X size={14} className="text-rock-400" />
                </button>
              </div>
            ))}
          </div>
        </Collapsible>
      </section>

      <section className="px-4 mt-2">
        <Collapsible open={openLocation}>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <select value={selectTown} onChange={e => setSelectTown(e.target.value)}
              className="w-full p-2.5 border border-rock-200 rounded-lg text-sm text-rock-900 bg-white focus:outline-none focus:border-jade-500">
              {townships.map(t => (
                <option key={t.code} value={t.name}>{t.name}</option>
              ))}
            </select>
            <button onClick={() => { setCurrentTownship(selectTown); setOpenLocation(false) }}
              className="mt-3 w-full py-2.5 bg-jade-500 text-white rounded-lg text-sm font-medium hover:bg-jade-600 transition-colors flex items-center justify-center gap-1">
              <Check size={16} /> 保存
            </button>
          </div>
        </Collapsible>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm divide-y divide-rock-50">
          <div>
            <MenuItem icon={Search} label="搜索历史"
              right={<ChevronDown size={16} className={`text-rock-300 ml-1 transition-transform ${openSearch ? 'rotate-180' : ''}`} />}
              onClick={() => setOpenSearch(!openSearch)} />
            <Collapsible open={openSearch}>
              <div className="px-4 pb-3">
                {searchHistory.length === 0 ? (
                  <p className="text-sm text-rock-400 text-center py-3">暂无搜索记录</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map(s => (
                      <span key={s} className="text-sm px-3 py-1 bg-rock-100 text-rock-600 rounded-full">{s}</span>
                    ))}
                    <button onClick={clearSearchHistory}
                      className="text-sm px-3 py-1 text-red-400 hover:text-red-500 transition-colors">
                      清空
                    </button>
                  </div>
                )}
              </div>
            </Collapsible>
          </div>
          <MenuItem icon={Bell} label="消息通知"
            right={notifications > 0 ? <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-number">{notifications}</span> : undefined}
            onClick={() => setOpenNotify(!openNotify)} />
          <MenuItem icon={Info} label="关于我们" onClick={() => setShowAbout(true)} />
          <MenuItem icon={LogOut} label="退出登录" onClick={() => setShowLogout(true)} />
        </div>
      </section>

      <Collapsible open={openNotify}>
        <div className="px-4 mt-2">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Bell size={32} className="text-rock-300 mx-auto mb-2" />
            <p className="text-sm text-rock-400">暂无新消息</p>
          </div>
        </div>
      </Collapsible>

      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
            onClick={() => setShowAbout(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-serif text-lg text-center text-rock-900">镇雄本地通</h3>
              <p className="text-sm text-rock-500 text-center mt-2">一平台知镇雄</p>
              <p className="text-sm text-rock-400 text-center mt-4">版本 1.0.0</p>
              <p className="text-xs text-rock-300 text-center mt-1">为镇雄人打造的本地信息平台</p>
              <button onClick={() => setShowAbout(false)}
                className="mt-5 w-full py-2.5 bg-jade-500 text-white rounded-lg text-sm hover:bg-jade-600 transition-colors">
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
            onClick={() => setShowLogout(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-serif text-lg text-center text-rock-900">确认退出</h3>
              <p className="text-sm text-rock-500 text-center mt-2">退出后需重新登录</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowLogout(false)}
                  className="flex-1 py-2.5 border border-rock-200 text-rock-600 rounded-lg text-sm hover:bg-rock-50 transition-colors">
                  取消
                </button>
                <button onClick={() => { setUser(null); setShowLogout(false) }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
                  退出
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
