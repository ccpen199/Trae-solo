import { useEffect, useState } from 'react'
import { User, MapPin, Phone, Settings, LogOut, FileText, Users, ShoppingBag, Heart } from 'lucide-react'

interface UserData {
  id: number
  phone: string
  nickname: string
  avatar: string
  region: string
  role: string
}

export default function Profile() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    fetch('/api/users/me?user_id=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setUser(data.data)
        }
      })
      .catch(() => {
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = () => {
    if (!phone.trim()) {
      alert('请输入手机号')
      return
    }
    setLoggingIn(true)
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setUser(data.data)
          setShowLogin(false)
        }
      })
      .catch(() => {
        setUser({
          id: 1,
          phone,
          nickname: '红河阿鹏',
          avatar: '',
          region: '蒙自市',
          role: 'user',
        })
        setShowLogin(false)
      })
      .finally(() => setLoggingIn(false))
  }

  const menuItems = [
    { icon: FileText, label: '我的资讯投稿' },
    { icon: Users, label: '我的圈子' },
    { icon: ShoppingBag, label: '我的订单', to: '/shop/orders' },
    { icon: Heart, label: '我的交友资料', to: '/match/profile' },
    { icon: Settings, label: '账号设置' },
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="section-title mb-6">个人中心</h1>

      {loading ? (
        <div className="card-static p-6 animate-pulse">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-warm-100 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-warm-100 rounded w-1/3" />
              <div className="h-4 bg-warm-100 rounded w-1/4" />
            </div>
          </div>
        </div>
      ) : user ? (
        <>
          <div className="card-static p-6 mb-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-honghe-red to-honghe-red-dark flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-warm-800 text-lg">{user.nickname}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-warm-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {user.phone}
                  </span>
                  {user.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.region}
                    </span>
                  )}
                  {user.role === 'merchant' && <span className="tag-gold">商家</span>}
                  {user.role === 'admin' && <span className="tag-red">管理员</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="card-static overflow-hidden">
            {menuItems.map((item, idx) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-warm-50 transition-colors ${
                  idx !== menuItems.length - 1 ? 'border-b border-warm-100' : ''
                }`}
              >
                <item.icon className="w-5 h-5 text-warm-500" />
                <span className="flex-1 text-warm-700">{item.label}</span>
                <span className="text-warm-300">›</span>
              </button>
            ))}
          </div>

          <button className="mt-6 w-full card-static p-4 flex items-center justify-center gap-2 text-warm-500 hover:text-honghe-red transition-colors">
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </>
      ) : (
        <>
          <div className="card-static p-8 text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-warm-100 mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-warm-400" />
            </div>
            <h2 className="text-lg font-medium text-warm-800 mb-2">欢迎来到红河生活</h2>
            <p className="text-sm text-warm-500 mb-6">登录后可使用更多功能</p>
            <button
              onClick={() => setShowLogin(true)}
              className="btn-primary"
            >
              登录 / 注册
            </button>
          </div>

          <div className="card-static overflow-hidden">
            {menuItems.map((item, idx) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-6 py-4 text-left opacity-50 ${
                  idx !== menuItems.length - 1 ? 'border-b border-warm-100' : ''
                }`}
                disabled
              >
                <item.icon className="w-5 h-5 text-warm-400" />
                <span className="flex-1 text-warm-600">{item.label}</span>
                <span className="text-warm-300">›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="font-serif text-xl font-semibold mb-6 text-center">登录</h3>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="input-field mb-6"
              maxLength={11}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogin(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loggingIn ? '登录中...' : '登录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
