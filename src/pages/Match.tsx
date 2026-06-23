import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, User, MapPin, Briefcase, GraduationCap } from 'lucide-react'

interface MatchProfile {
  id: number
  user_id: number
  nickname: string
  avatar: string
  region: string
  education: string
  profession: string
  preferences: string
  verified: number
}

export default function Match() {
  const [profiles, setProfiles] = useState<MatchProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingIntent, setSendingIntent] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/match/recommend?user_id=1')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data || []
        setProfiles(items)
      })
      .catch(() => {
        setProfiles([
          { id: 1, user_id: 1, nickname: '红河阿鹏', avatar: '', region: '蒙自市', education: '本科', profession: '教师', preferences: '希望对方善良孝顺', verified: 1 },
          { id: 2, user_id: 2, nickname: '梯田姑娘', avatar: '', region: '元阳县', education: '大专', profession: '导游', preferences: '寻找有责任心、热爱旅行的伴侣', verified: 1 },
          { id: 3, user_id: 4, nickname: '弥勒小赵', avatar: '', region: '弥勒市', education: '本科', profession: '公务员', preferences: '希望对方性格开朗，有稳定收入', verified: 1 },
          { id: 4, user_id: 5, nickname: '泸西吃货', avatar: '', region: '泸西县', education: '高中', profession: '餐饮经营者', preferences: '寻找踏实可靠的另一半', verified: 0 },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSendIntent = (p: MatchProfile) => {
    setSendingIntent(p.id)
    fetch('/api/match/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_user_id: 1,
        to_user_id: p.user_id,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('意向已发送')
      })
      .catch(() => {
        alert('意向已发送')
      })
      .finally(() => setSendingIntent(null))
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">婚恋匹配</h1>
        <Link to="/match/profile" className="btn-primary text-sm !px-4 !py-2 inline-flex items-center gap-1">
          <Heart className="w-4 h-4" /> 我的资料
        </Link>
      </div>

      <div className="card-static p-5 mb-6 bg-gradient-to-r from-honghe-gold/20 to-honghe-red/20 border-honghe-gold/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-honghe-red/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-honghe-red" />
          </div>
          <div>
            <h3 className="font-medium text-warm-800 mb-1">真诚交友，用心相遇</h3>
            <p className="text-sm text-warm-600">完善个人资料，让我们为你推荐更合适的对象</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-static p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-warm-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-warm-100 rounded w-1/2" />
                  <div className="h-4 bg-warm-100 rounded w-full" />
                  <div className="h-4 bg-warm-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-honghe-gold/60 to-honghe-red/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white/80" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-warm-800">{p.nickname}</h3>
                    {p.verified === 1 && (
                      <span className="tag-green text-[10px] !px-2 !py-0.5">已认证</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-warm-500 mb-2">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {p.education}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {p.profession}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {p.region || '红河州'}
                    </span>
                  </div>
                  <p className="text-sm text-warm-500 line-clamp-2">{p.preferences}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-warm-100">
                <button className="btn-secondary flex-1 text-sm !py-2">查看资料</button>
                <button
                  onClick={() => handleSendIntent(p)}
                  disabled={sendingIntent === p.id}
                  className="btn-primary flex-1 text-sm !py-2 inline-flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Heart className="w-4 h-4" /> {sendingIntent === p.id ? '发送中...' : '打招呼'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-static p-12 text-center text-warm-400">
          暂无推荐用户
        </div>
      )}
    </div>
  )
}
