import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Star,
  User,
  WalletCards,
} from 'lucide-react'
import { mockContracts, mockServices, mockWorkOrders } from '@/mocks/data'

interface ProfileSummary {
  orderCount: number
  completedCount: number
  warrantyCount: number
  savedAmount: number
}

const fallbackSummary: ProfileSummary = {
  orderCount: mockWorkOrders.length,
  completedCount: mockWorkOrders.filter((order) => order.status === 'completed' || order.status === 'signed').length,
  warrantyCount: mockContracts.filter((contract) => contract.status === 'signed' || contract.status === 'archived').length,
  savedAmount: 436,
}

export default function Profile() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<ProfileSummary>(fallbackSummary)
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'fallback'>('loading')

  useEffect(() => {
    let cancelled = false

    fetch('/api/profile/summary')
      .then((res) => {
        if (!res.ok) throw new Error('profile api failed')
        return res.json()
      })
      .then((payload) => {
        if (cancelled) return
        setSummary({ ...fallbackSummary, ...(payload.data || {}) })
        setApiStatus('ok')
      })
      .catch(() => {
        if (cancelled) return
        setSummary(fallbackSummary)
        setApiStatus('fallback')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const recentOrders = useMemo(() => mockWorkOrders.slice(0, 4), [])
  const favoriteServices = useMemo(() => mockServices.slice(0, 3), [])

  return (
    <div className="space-y-8">
      <section className="glass-card cyber-border p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-400 to-cyber-600 text-2xl font-bold text-navy-900 shadow-lg shadow-cyber-400/20">
              刘
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="tag-cyber">个人中心</span>
                <span className="tag-warm">{apiStatus === 'loading' ? '接口加载中' : apiStatus === 'ok' ? 'API已连接' : '本地数据'}</span>
              </div>
              <h1 className="text-2xl font-bold text-navy-50 md:text-3xl">刘女士的我的家修</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-navy-200">
                <MapPin className="h-4 w-4" />
                阳光花园3栋502室 · 已实名 · 服务保障中
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/compare')} className="btn-primary flex items-center justify-center gap-2">
            继续预约 <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ClipboardList} label="我的订单" value={summary.orderCount} />
        <Metric icon={CalendarCheck} label="已完成服务" value={summary.completedCount} />
        <Metric icon={ShieldCheck} label="质保档案" value={summary.warrantyCount} />
        <Metric icon={WalletCards} label="比价节省" value={`¥${summary.savedAmount}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card cyber-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy-50">
              <ClipboardList className="h-5 w-5 text-cyber-400" />
              我的订单
            </h2>
            <button onClick={() => navigate('/engineer/order/wo2')} className="text-sm text-cyber-400">
              查看电子工单
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-cyber-400/10 bg-navy-700/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-navy-50">{order.orderId}</span>
                      <span className="tag-cyber">{order.categoryLabel}</span>
                    </div>
                    <p className="text-sm text-navy-200">{order.faultDescription}</p>
                    <p className="mt-2 text-xs text-navy-300">{order.createdAt} · {order.customerAddress}</p>
                  </div>
                  <span className="tag-warm">{statusLabel(order.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card cyber-border p-5">
          <div className="mb-4 flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-cyber-400" />
            <h2 className="text-xl font-bold text-navy-50">我的保障</h2>
          </div>
          <div className="space-y-4">
            <Guarantee title="明码标价" desc="服务商报价拆分上门费、人工费、配件费，选择前可比价。" />
            <Guarantee title="质保可追踪" desc="合同、照片、签名和AI质检结果留存到合规存证。" />
            <Guarantee title="工程师信用" desc="展示工程师信用等级、完成率、评价和质检通过率。" />
          </div>
          <button onClick={() => navigate('/admin')} className="btn-secondary mt-5 w-full">
            查看平台后台治理
          </button>
        </div>
      </section>

      <section className="glass-card cyber-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy-50">
            <Star className="h-5 w-5 text-warm-500 fill-warm-500" />
            我的常用服务
          </h2>
          <button onClick={() => navigate('/discover')} className="text-sm text-cyber-400">
            发现更多分类
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {favoriteServices.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => navigate('/compare')}
              className="rounded-lg border border-cyber-400/10 bg-navy-700/40 p-4 text-left transition hover:border-cyber-400/40"
            >
              <span className="tag-cyber">{service.categoryLabel}</span>
              <h3 className="mt-3 font-semibold text-navy-50">{service.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-navy-200">{service.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof User; label: string; value: number | string }) {
  return (
    <div className="glass-card cyber-border p-5">
      <Icon className="mb-3 h-7 w-7 text-cyber-400" />
      <div className="text-2xl font-bold text-navy-50">{value}</div>
      <div className="mt-1 text-sm text-navy-200">{label}</div>
    </div>
  )
}

function Guarantee({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-cyber-400/10 bg-navy-700/40 p-4">
      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyber-400" />
      <div>
        <div className="font-medium text-navy-50">{title}</div>
        <p className="mt-1 text-sm text-navy-200">{desc}</p>
      </div>
    </div>
  )
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cost_confirmed: '费用已确认',
    signed: '已签署',
    archived: '已存证',
  }
  return map[status] || status
}
