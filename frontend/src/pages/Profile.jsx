import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Package, Heart, MessageCircle, Settings, Wallet, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store'

export default function Profile() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuthStore()

  const menuItems = [
    { icon: Package, label: '我的订单', path: '/orders' },
    { icon: Wallet, label: '我的钱包', path: '/wallet' },
    { icon: Heart, label: '我的收藏', path: '#' },
    { icon: MessageCircle, label: '我的消息', path: '#' },
    { icon: Settings, label: '设置', path: '#' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 pb-10">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <div className="ml-4 text-white">
            {token ? (
              <>
                <h2 className="text-xl font-bold">{user?.nickname || '用户'}</h2>
                <p className="text-sm opacity-80 mt-1">{user?.phone || ''}</p>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-white/20 px-4 py-1.5 rounded-full text-sm"
              >
                登录/注册
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white mx-4 -mt-6 rounded-xl shadow-sm">
        <div className="grid grid-cols-3 divide-x py-4">
          <div className="text-center">
            <p className="text-xl font-bold text-red-500">0</p>
            <p className="text-xs text-gray-500 mt-1">订单</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-500">0</p>
            <p className="text-xs text-gray-500 mt-1">收藏</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-500">0</p>
            <p className="text-xs text-gray-500 mt-1">关注</p>
          </div>
        </div>
      </div>

      <div className="bg-white mx-4 mt-4 rounded-xl">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => item.path !== '#' && navigate(item.path)}
            className={`flex items-center w-full p-4 ${
              index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <item.icon className="w-5 h-5 text-gray-500" />
            <span className="ml-3 flex-1 text-left">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {token && (
        <div className="px-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-white text-red-500 py-3 rounded-xl flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
