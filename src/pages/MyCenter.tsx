import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, FileText, Heart, LayoutDashboard, ShieldCheck, UserRound } from 'lucide-react'
import { api } from '@/utils/api'
import type { Building } from '@/types'
import Loading from '@/components/Loading'

interface ComplaintItem {
  id: string
  title: string
  status: string
  buildingId: string
  createdAt: string
}

const statusLabelMap: Record<string, string> = {
  pending: '待处理',
  accepted: '已受理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
}

export default function MyCenter() {
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [savedBuildings, setSavedBuildings] = useState<Building[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [complaintsRes, buildingsRes] = await Promise.all([
          api.getComplaints(),
          api.getBuildings(),
        ])

        setComplaints((complaintsRes.data || []).slice(0, 3))
        setSavedBuildings((buildingsRes.data || []).slice(0, 3))
      } catch {
        setComplaints([])
        setSavedBuildings([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <Loading text="加载个人中心..." />

  const pendingCount = complaints.filter((item) => ['pending', 'accepted', 'processing'].includes(item.status)).length
  const stats = [
    { label: '我的收藏', value: savedBuildings.length, icon: Heart },
    { label: '我的投诉', value: complaints.length, icon: FileText },
    { label: '待处理', value: pendingCount, icon: Bell },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <section className="card p-8 bg-brand text-white overflow-hidden relative">
        <div className="absolute inset-y-0 right-0 w-48 bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/85">
              <UserRound size={16} />
              <span>个人中心</span>
            </div>
            <h1 className="mt-5 font-serif text-4xl font-bold">我的账号与服务进度</h1>
            <p className="mt-3 max-w-2xl text-white/80 leading-relaxed">
              当前为演示账号，可统一查看我的投诉、收藏楼盘、账号设置与后台管理入口。
            </p>
            <p className="mt-4 text-sm text-white/70">体验账号：购房人 Chen · 最近登录于今天</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/complaint" className="rounded-xl bg-white px-5 py-3 font-medium text-brand transition hover:bg-cream">
              我的投诉
            </Link>
            <Link to="/admin" className="rounded-xl border border-white/20 px-5 py-3 font-medium text-white transition hover:bg-white/10">
              后台管理
            </Link>
            <Link to="/verify" className="rounded-xl border border-white/20 px-5 py-3 font-medium text-white transition hover:bg-white/10">
              账号设置与五证校验
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal/55">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold text-brand">{item.value}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">我的投诉</h2>
              <p className="mt-2 text-sm text-charcoal/55">查看投诉详情、处理状态和最新进度。</p>
            </div>
            <Link to="/complaint" className="text-sm font-medium text-brand hover:text-brand-light">
              提交投诉
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {complaints.length > 0 ? complaints.map((item) => (
              <Link
                key={item.id}
                to={`/complaint/${item.id}`}
                className="block rounded-2xl border border-brand/10 bg-cream/60 p-4 transition hover:border-brand/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-charcoal">{item.title}</p>
                    <p className="mt-2 text-sm text-charcoal/55">
                      投诉详情 · {statusLabelMap[item.status] || item.status} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                    查看详情
                  </span>
                </div>
              </Link>
            )) : (
              <div className="rounded-2xl border border-dashed border-brand/20 p-6 text-sm text-charcoal/55">
                暂无投诉记录，可从黑猫投诉页面发起第一条反馈。
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">后台管理</h2>
            <p className="mt-2 text-sm text-charcoal/55">运营后台可查看内容管理、数据统计和业务概览。</p>
            <Link
              to="/admin"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-light"
            >
              <LayoutDashboard size={18} />
              <span>进入后台管理</span>
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-brand">
              <ShieldCheck size={18} />
              <h2 className="section-title">我的收藏楼盘</h2>
            </div>
            <div className="mt-5 space-y-4">
              {savedBuildings.map((building) => (
                <Link
                  key={building.id}
                  to={`/building/${building.id}`}
                  className="block rounded-2xl border border-brand/10 p-4 transition hover:border-brand/30 hover:shadow-md"
                >
                  <p className="font-semibold text-charcoal">{building.name}</p>
                  <p className="mt-1 text-sm text-charcoal/55">{building.district} · {building.address}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-gold">{(building.avgPrice / 10000).toFixed(0)} 万/m²</span>
                    <span className="text-brand">查看详情</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
