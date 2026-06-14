import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Wallet,
  FileText,
  ClipboardCheck,
  PackagePlus,
  Download,
  Wifi,
  Cloud,
  CloudOff,
  Trash2,
  CreditCard,
  Building,
  BadgeCheck,
  FileBadge,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useAuthStore } from '@/stores/authStore'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, logout } = useAuthStore()
  const isDriver = user?.role === 'driver'

  const [isOffline, setIsOffline] = useState(false)
  const [offlineQueued, setOfflineQueued] = useState(8)
  const [offlineTracks, setOfflineTracks] = useState(234)

  const menuItemsDriver = [
    { icon: ShieldCheck, label: '实名认证', desc: '身份证/证件AI核验', path: '/certification' },
    { icon: Wallet, label: '我的银行卡', desc: profile?.bank_name ? `${profile.bank_name} · ${maskCard(profile.bank_card_no)}` : '未绑定' },
    { icon: ClipboardCheck, label: '安全台账', desc: '出车检查/行车日志', path: '/safety' },
    { icon: FileText, label: '电子路单归档', desc: '执法监管数据调取', path: '/safety' },
    { icon: Cloud, label: '离线数据管理', desc: '同步GPS轨迹与离线接单' },
  ]

  const menuItemsShipper = [
    { icon: Building, label: '企业信息', desc: profile?.company_name ? profile.company_name : '未完善' },
    { icon: CreditCard, label: '开票主体管理', desc: '专票开票主体维护', path: '/invoices/entity' },
    { icon: PackagePlus, label: '我发布的货源', path: '/freight' },
    { icon: FileText, label: '电子路单', desc: '合规运单归档', path: '/safety' },
  ]

  const menuItems = isDriver ? menuItemsDriver : menuItemsShipper

  function maskCard(no?: string) {
    if (!no || no.length < 8) return no || '-'
    return no.slice(0, 4) + ' **** **** ' + no.slice(-4)
  }

  const syncOfflineData = () => {
    const n = offlineQueued
    const t = offlineTracks
    setIsOffline(false)
    setOfflineQueued(0)
    setOfflineTracks(0)
    setTimeout(() => {
      alert(`同步完成：${n} 条接单数据 + ${t} 个轨迹点`)
    }, 500)
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout()
      navigate('/login')
    }
  }

  return (
    <div>
      <PageHeader title="个人中心" />

      <div className="bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 rounded-xl p-6 text-white mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5"></div>
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white/5"></div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{user?.name || '未命名用户'}</p>
              <p className="text-sm opacity-80 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {user?.phone || '-'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                  isDriver ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30' : 'bg-mint-400/20 text-mint-200 border border-mint-400/30'
                }`}>
                  {isDriver ? <TruckIcon /> : <Building className="h-3 w-3" />}
                  {isDriver ? '司机用户' : '货主用户'}
                </span>
                {isDriver && profile?.certification_status === 'passed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-mint-400/20 text-mint-200 border border-mint-400/30">
                    <BadgeCheck className="h-3 w-3" />
                    已合规认证
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDriver && (
        <div className={`rounded-xl p-4 mb-6 border-2 transition-all ${
          isOffline ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isOffline ? (
                <>
                  <CloudOff className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">离线模式运行中</span>
                </>
              ) : (
                <>
                  <Wifi className="h-5 w-5 text-mint-600" />
                  <span className="text-sm font-semibold text-mint-700">在线 - 数据已同步</span>
                </>
              )}
            </div>
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                isOffline ? 'bg-white text-amber-700 border border-amber-300' : 'bg-white text-mint-700 border border-mint-300'
              }`}
            >
              {isOffline ? '模拟上线' : '模拟离线'}
            </button>
          </div>
          {isOffline && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg p-3 border border-amber-100">
                  <p className="text-xs text-amber-600">排队接单操作</p>
                  <p className="text-xl font-bold text-amber-700 mt-0.5">{offlineQueued} 条</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-100">
                  <p className="text-xs text-amber-600">GPS轨迹缓存</p>
                  <p className="text-xl font-bold text-amber-700 mt-0.5">{offlineTracks} 点</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={syncOfflineData}
                  className="flex-1 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  立即同步数据
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定清空本地缓存？')) {
                      setOfflineQueued(0)
                      setOfflineTracks(0)
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
          {!isOffline && (
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full"></div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => item.path && navigate(item.path)}
            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left ${
              idx !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-navy-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                {item.desc && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        ))}
      </div>

      {isDriver && profile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileBadge className="h-5 w-5 text-navy-500" />
            证件信息
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">身份证号</p>
              <p className="font-medium text-gray-800 mt-0.5">
                {profile.id_card_no ? maskCard(profile.id_card_no) : '未认证'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">道路运输证</p>
              <p className="font-medium text-gray-800 mt-0.5">
                {profile.transport_license_no || '未认证'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">从业资格证</p>
              <p className="font-medium text-gray-800 mt-0.5">
                {profile.qualification_no || '未认证'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">认证状态</p>
              <p className={`font-medium mt-0.5 ${
                profile.certification_status === 'passed' ? 'text-mint-600' :
                profile.certification_status === 'pending' ? 'text-amber-600' :
                profile.certification_status === 'failed' ? 'text-coral-600' : 'text-gray-500'
              }`}>
                {profile.certification_status === 'passed' ? '已通过' :
                 profile.certification_status === 'pending' ? '审核中' :
                 profile.certification_status === 'failed' ? '未通过' : '未提交'}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="w-full mt-6 py-3 border-2 border-coral-200 text-coral-600 font-medium rounded-xl hover:bg-coral-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="h-5 w-5" />
        退出登录
      </button>
    </div>
  )
}

function TruckIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3"/>
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>
      <circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  )
}
