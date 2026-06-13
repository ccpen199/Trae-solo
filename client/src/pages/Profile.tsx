import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { User } from '../types'
import { Star, Award, FileText, Mail, MapPin, User as UserIcon } from 'lucide-react'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/users/${id}`)
        setUser(data)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-40 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold">用户不存在</h2>
        <Link to="/tasks" className="text-primary-600 mt-4 inline-block">返回首页</Link>
      </div>
    )
  }

  const completionRate = user.totalOrders > 0
    ? ((user.completedOrders / user.totalOrders) * 100).toFixed(1)
    : '100'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt=""
            className="w-28 h-28 rounded-3xl border-4 border-white/30 shadow-2xl"
          />
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur">
                {user.role === 'ADMIN' ? '平台管理员' : user.role === 'PROVIDER' ? '认证服务商' : user.role === 'BOTH' ? '雇主+服务商' : '雇主用户'}
              </span>
              <span className="px-3 py-1 bg-yellow-400/30 text-yellow-100 rounded-full text-sm flex items-center backdrop-blur">
                <Award className="w-4 h-4 mr-1" />
                Lv.{user.level}
              </span>
            </div>
            {user.bio && (
              <p className="mt-3 text-white/80 max-w-xl">{user.bio}</p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-6 mt-4 flex-wrap">
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-300" />
                <span className="font-semibold">{user.rating.toFixed(1)}</span>
                <span className="text-white/70 text-sm ml-1">评分</span>
              </div>
              {user.location && (
                <div className="flex items-center text-white/80">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.totalOrders > 0 && (
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>{user.completedOrders} / {user.totalOrders}</span>
                  <span className="text-white/70 text-sm ml-1">完成订单</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-gray-900">{user.rating.toFixed(1)}</div>
          <div className="text-sm text-gray-500 mt-1">综合评分</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{completionRate}%</div>
          <div className="text-sm text-gray-500 mt-1">完成率</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-amber-600">{user.experience}</div>
          <div className="text-sm text-gray-500 mt-1">经验值</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-red-600">{user.complaintCount}</div>
          <div className="text-sm text-gray-500 mt-1">投诉次数</div>
        </div>
      </div>

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">专业技能</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <Link
                key={skill.id}
                to={`/tasks?skillId=${skill.id}`}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-100 transition-colors"
              >
                {skill.name}
                <span className="ml-1.5 text-xs text-primary-500">{skill.demandCount}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">用户名</p>
              <p className="font-medium text-gray-900">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">邮箱</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
