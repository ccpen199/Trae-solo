import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, FileText, Heart, Users, Award, Loader2, Shield, Zap, CheckCircle, Settings, Wallet, Crown, TrendingUp } from 'lucide-react'
import api from '../utils/api'
import { isAuthenticated, getCurrentUser } from '../utils/auth'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import ContentCard from '../components/ContentCard'

dayjs.locale('zh-cn')

const creatorLevels: Record<number, { name: string; color: string; bg: string; barColor: string; minScore: number }> = {
  0: { name: '新手创作者', color: 'text-gray-600', bg: 'bg-gray-100', barColor: 'bg-gray-400', minScore: 0 },
  1: { name: '活跃创作者', color: 'text-green-600', bg: 'bg-green-100', barColor: 'bg-green-500', minScore: 100 },
  2: { name: '优质创作者', color: 'text-blue-600', bg: 'bg-blue-100', barColor: 'bg-blue-500', minScore: 500 },
  3: { name: '精品创作者', color: 'text-purple-600', bg: 'bg-purple-100', barColor: 'bg-purple-500', minScore: 2000 },
  4: { name: '顶级创作者', color: 'text-amber-600', bg: 'bg-amber-100', barColor: 'bg-amber-500', minScore: 5000 },
}

const levelThresholds = [0, 100, 500, 2000, 5000, 10000]

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'contents' | 'collections' | 'liked'>('contents')
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const currentUser = getCurrentUser()
  const profileId = id || String(currentUser?.id || 1)
  const isSelf = currentUser?.id === parseInt(profileId)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/api/users/${profileId}`)
        if (res.data.code === 0) {
          setUser(res.data.data)
          setIsFollowing(res.data.data.is_following || false)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    const fetchContents = async () => {
      try {
        const res = await api.get(`/api/users/${profileId}/contents`, { params: { limit: 20 } })
        if (res.data.code === 0) {
          setContents(res.data.data.list || res.data.data || [])
        }
      } catch {}
    }
    fetchUser()
    fetchContents()
  }, [profileId])

  const handleFollow = async () => {
    if (!isAuthenticated()) return
    try {
      if (isFollowing) {
        await api.delete(`/api/users/${profileId}/follow`)
      } else {
        await api.post(`/api/users/${profileId}/follow`)
      }
      setIsFollowing(!isFollowing)
      setUser((prev: any) => ({
        ...prev,
        follower_count: prev.follower_count + (isFollowing ? -1 : 1),
      }))
    } catch {}
  }

  const handleTabChange = async (tab: 'contents' | 'collections' | 'liked') => {
    setActiveTab(tab)
    try {
      let res
      if (tab === 'contents') {
        res = await api.get(`/api/users/${profileId}/contents`, { params: { limit: 20 } })
      } else if (tab === 'collections') {
        res = await api.get(`/api/users/${profileId}/collections`, { params: { limit: 20 } })
      } else {
        res = await api.get(`/api/users/${profileId}/liked`, { params: { limit: 20 } })
      }
      if (res.data.code === 0) {
        setContents(res.data.data.list || res.data.data || [])
      }
    } catch {}
  }

  const getRoleBadge = () => {
    if (user?.role === 'admin') {
      return { label: '管理员', color: 'bg-red-100 text-red-600', icon: Shield }
    }
    if (user?.role === 'author') {
      return { label: '创作者', color: 'bg-purple-100 text-purple-600', icon: Zap }
    }
    return { label: '普通用户', color: 'bg-gray-100 text-gray-600', icon: Users }
  }

  const getLevelProgress = () => {
    const currentLevel = user?.author_level || user?.creator_level || 0
    const currentScore = user?.author_score || user?.creator_score || 0
    const nextLevel = Math.min(currentLevel + 1, 4)
    const currentMin = levelThresholds[currentLevel] || 0
    const nextMin = levelThresholds[nextLevel] || levelThresholds[4]
    const progress = nextMin > currentMin
      ? Math.min(100, Math.round(((currentScore - currentMin) / (nextMin - currentMin)) * 100))
      : 100
    return { currentLevel, currentScore, nextLevel, progress }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <div className="text-center py-16 text-gray-400">用户不存在</div>
  }

  const level = creatorLevels[user.author_level || user.creator_level || 0] || creatorLevels[0]
  const levelName = user.author_level_name || level.name
  const roleBadge = getRoleBadge()
  const levelProgress = getLevelProgress()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-6">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
              {user.nickname?.[0] || '?'}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{user.nickname}</h1>
              <span className={`badge ${roleBadge.color} flex items-center gap-0.5`}>
                <roleBadge.icon className="w-3 h-3" />{roleBadge.label}
              </span>
              {user.author_certified === 1 && (
                <span className="badge bg-blue-50 text-blue-600 flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" />
                  认证{user.certified_at ? ` · ${dayjs(user.certified_at).format('YYYY.MM')}` : ''}
                </span>
              )}
              {(user.author_level !== undefined || user.creator_level !== undefined) && (
                <span className={`badge ${level.bg} ${level.color} flex items-center gap-0.5`}>
                  <Crown className="w-3 h-3" />{levelName}
                </span>
              )}
            </div>
            {user.bio && <p className="text-gray-600 text-sm mb-2">{user.bio}</p>}
            {user.city && (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />{user.city}
              </p>
            )}
            <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
              <span><strong className="text-gray-900">{user.content_count || 0}</strong> 内容</span>
              <span><strong className="text-gray-900">{user.follower_count || 0}</strong> 粉丝</span>
              <span><strong className="text-gray-900">{user.following_count || 0}</strong> 关注</span>
              {user.total_earnings !== undefined && (
                <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 text-green-500" /><strong className="text-green-600">¥{user.total_earnings || 0}</strong></span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!isSelf && isAuthenticated() && (
              <button
                onClick={handleFollow}
                className={isFollowing ? 'btn-secondary' : 'btn-primary'}
              >
                {isFollowing ? '已关注' : '关注'}
              </button>
            )}
            {isSelf && (
              <>
                <Link to="/settings" className="btn-secondary flex items-center gap-1 justify-center">
                  <Settings className="w-3.5 h-3.5" />编辑资料
                </Link>
                {user.role === 'author' && (
                  <Link to="/earnings" className="btn-primary flex items-center gap-1 justify-center">
                    <Wallet className="w-3.5 h-3.5" />创作中心
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn-secondary flex items-center gap-1 justify-center">
                    <Shield className="w-3.5 h-3.5" />管理后台
                  </Link>
                )}
              </>
            )}
            {!isSelf && user.role === 'author' && (
              <Link to="/earnings" className="btn-secondary flex items-center gap-1 justify-center">
                <TrendingUp className="w-3.5 h-3.5" />查看收益
              </Link>
            )}
          </div>
        </div>

        {(user.author_level !== undefined || user.creator_level !== undefined) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Award className="w-4 h-4" />创作者等级
              </span>
              <span className="text-xs text-gray-500">
                {levelProgress.currentScore} 积分 · 距离{creatorLevels[Math.min(levelProgress.nextLevel, 4)].name}还差 {Math.max(0, (levelThresholds[levelProgress.nextLevel] || levelThresholds[4]) - levelProgress.currentScore)} 分
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${level.barColor} transition-all duration-500`}
                  style={{ width: `${levelProgress.progress}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${level.color}`}>{levelName}</span>
            </div>
            <div className="flex justify-between mt-1">
              {Object.entries(creatorLevels).map(([lvl, info]) => (
                <div key={lvl} className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${Number(lvl) <= levelProgress.currentLevel ? info.barColor : 'bg-gray-300'}`} />
                  <span className={`text-[10px] mt-0.5 ${Number(lvl) <= levelProgress.currentLevel ? info.color : 'text-gray-400'}`}>
                    {info.name.slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSelf && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                  <Wallet className="w-3.5 h-3.5" />累计收益
                </div>
                <div className="text-xl font-bold text-green-700">¥{user.total_earnings || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />本月收益
                </div>
                <div className="text-xl font-bold text-blue-700">¥{user.monthly_earnings || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
                  <Award className="w-3.5 h-3.5" />可用余额
                </div>
                <div className="text-xl font-bold text-amber-700">¥{user.available_earnings || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {[
          { key: 'contents', label: '内容', icon: FileText },
          { key: 'collections', label: '收藏', icon: Heart },
          { key: 'liked', label: '喜欢', icon: Users },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {contents.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">暂无内容</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contents.map(content => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  )
}
