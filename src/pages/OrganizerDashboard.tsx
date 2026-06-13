import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Building, Calendar, Ticket, TrendingUp, Shield, FileText } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useOrganizerStore from '@/stores/organizerStore'
import { apiGet } from '@/utils/api'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const { organizer, application, fetchOrganizer } = useOrganizerStore()
  const [applyOpen, setApplyOpen] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    license: '',
    contactName: '',
    contactPhone: '',
  })
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (isLoggedIn) fetchOrganizer()
  }, [isLoggedIn, fetchOrganizer])

  useEffect(() => {
    if (organizer?.status === 'approved') {
      apiGet<any>('/analytics/sales-ranking?type=event').then(d => {
        const data = d.rankings?.[0] || {}
        setStats({
          totalEvents: 3,
          totalSales: data.sales || 0,
          totalRevenue: data.revenue || 0,
          totalTickets: 328,
        })
      }).catch(() => {
        setStats({
          totalEvents: 3,
          totalSales: 0,
          totalRevenue: 0,
          totalTickets: 328,
        })
      })
    }
  }, [organizer])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 模拟申请
      setApplyOpen(false)
      alert('申请已提交，等待审核')
    } catch {}
  }

  const menuItems = [
    { icon: Calendar, label: '演出管理', path: '/organizer/events', color: 'text-gold-500' },
    { icon: Ticket, label: '场次配置', path: '/organizer/events', color: 'text-blue-400' },
    { icon: TrendingUp, label: '销售数据', path: '/admin', color: 'text-green-400' },
    { icon: Shield, label: '核验记录', path: '/organizer/events', color: 'text-purple-400' },
  ]

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <Building size={48} className="mx-auto text-gold-500 mb-4" />
          <p className="text-white mb-6">请先登录</p>
          <Link to="/login" className="wine-gradient-btn">前往登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark pb-16">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <span className="text-gold-400 text-sm">{user?.realName}</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="font-display text-3xl text-gold-400 mb-8">主办方工作台</h1>

        {!organizer && (
          <div className="glass-card p-10 text-center">
            <Building size={48} className="mx-auto text-gold-500 mb-4" />
            <h2 className="text-xl text-white mb-2">成为主办方</h2>
            <p className="text-carbon-400 mb-6">提交资质审核，入驻平台发布演出</p>
            <button onClick={() => setApplyOpen(true)} className="wine-gradient-btn">
              立即申请
            </button>
          </div>
        )}

        {organizer && organizer.status !== 'approved' && (
          <div className="glass-card p-10 text-center">
            <FileText size={48} className="mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl text-white mb-2">审核中</h2>
            <p className="text-carbon-400 mb-4">
              您的主办方申请已提交，工作人员将在 1-3 个工作日内完成审核
            </p>
            <div className="text-sm text-carbon-500">
              公司: {organizer.companyName}
            </div>
            {application?.reviewReason && (
              <div className="mt-4 p-4 bg-wine-800/20 rounded-lg text-wine-400 text-sm">
                审核未通过: {application.reviewReason}
              </div>
            )}
          </div>
        )}

        {organizer && organizer.status === 'approved' && (
          <>
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-wine-700 rounded-xl flex items-center justify-center">
                  <Building size={32} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{organizer.companyName}</div>
                  <div className="text-sm text-carbon-400">{organizer.contactName} · {organizer.contactPhone}</div>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                    已认证
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: '演出场次', value: stats?.totalEvents || 0, icon: Calendar, color: 'text-gold-500' },
                { label: '累计售票', value: stats?.totalTickets || 0, icon: Ticket, color: 'text-blue-400' },
                { label: '销售总额', value: `¥${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-400' },
                { label: '待核验', value: stats?.totalTickets - 42 || 0, icon: Shield, color: 'text-purple-400' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="glass-card p-5">
                    <Icon size={20} className={`${item.color} mb-3`} />
                    <div className="font-display text-2xl text-white mb-1">{item.value}</div>
                    <div className="text-xs text-carbon-400">{item.label}</div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {menuItems.map((item, i) => {
                const Icon = item.icon
                return (
                  <Link
                    key={i}
                    to={item.path}
                    className="glass-card p-6 text-center card-hover"
                  >
                    <Icon size={32} className={`mx-auto ${item.color} mb-3`} />
                    <div className="text-white font-medium">{item.label}</div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      {applyOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-2xl text-gold-400 mb-6">主办方入驻申请</h3>
            <form onSubmit={handleApply}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">公司名称</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">营业执照号</label>
                  <input
                    type="text"
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-carbon-300 mb-2">联系人</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-carbon-300 mb-2">联系电话</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">资质文件</label>
                  <div className="border-2 border-dashed border-carbon-600 rounded-lg p-8 text-center text-carbon-500 hover:border-gold-500/50 transition cursor-pointer">
                    点击上传营业执照等资质文件
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
                >
                  取消
                </button>
                <button type="submit" className="flex-1 wine-gradient-btn">
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
