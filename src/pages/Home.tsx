import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bus, Building2, FileCheck, GraduationCap, HeartPulse,
  BadgeCheck, ClipboardList, User, QrCode, Shield, Search, Bell,
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import api from '@/lib/api'

interface RecommendItem {
  id: string
  title: string
  usageCount: number
}

const services = [
  { icon: Bus, name: '扫码乘车', desc: '便捷出行', path: '/transport' },
  { icon: Building2, name: '社保公积金', desc: '账户查询', path: '/social-security' },
  { icon: FileCheck, name: '户籍业务', desc: '在线办理', path: '/household' },
  { icon: GraduationCap, name: '教育服务', desc: '招生入学', path: '/education' },
  { icon: HeartPulse, name: '健康码', desc: '健康状态', path: '/health' },
  { icon: BadgeCheck, name: '电子证照', desc: '证照管理', path: '/certificates' },
  { icon: ClipboardList, name: '办理中心', desc: '进度查询', path: '/tracking' },
  { icon: User, name: '用户中心', desc: '个人信息', path: '/profile' },
]

const quickEntries = [
  { icon: QrCode, label: '乘车码', path: '/transport' },
  { icon: Shield, label: '健康码', path: '/health' },
  { icon: Search, label: '社保查询', path: '/social-security' },
]

const mockMessages = [
  { time: '10:30', title: '办理进度通知', summary: '您的户籍迁移申请已进入审核阶段' },
  { time: '09:15', title: '政策更新', summary: '2024年社保缴费基数已调整' },
  { time: '昨日', title: '系统公告', summary: '平台将于本周六凌晨进行维护升级' },
]

export default function Home() {
  const user = useUserStore((s) => s.user)
  const navigate = useNavigate()
  const [recommends, setRecommends] = useState<RecommendItem[]>([])

  useEffect(() => {
    api.get('/recommend/services')
      .then((res) => setRecommends(res.data))
      .catch(() => {})
  }, [])

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`

  return (
    <div className="px-4 pb-6 space-y-6">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-purple-600 p-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">你好，{user?.name || '用户'}</h1>
            <p className="text-white/70 text-sm mt-1">{dateStr} · 晴 28°C</p>
          </div>
          <div className="flex gap-2">
            {quickEntries.map((q) => (
              <Link
                key={q.path}
                to={q.path}
                className="flex flex-col items-center bg-white/15 rounded-xl px-3 py-2 hover:bg-white/25 transition"
              >
                <q.icon className="w-5 h-5" />
                <span className="text-xs mt-1">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {services.map((s, i) => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className="flex flex-col items-center p-3 rounded-xl bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 opacity-0 animate-slideUp"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-text-dark">{s.name}</span>
            <span className="text-[10px] text-text-muted">{s.desc}</span>
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold text-text-dark mb-3">常用服务</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {recommends.length === 0 && (
            <>
              {['社保查询', '乘车码', '电子证照', '户籍办理'].map((t, i) => (
                <div key={i} className="flex-shrink-0 w-28 p-3 rounded-xl bg-white shadow-sm">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-shimmer mb-2" />
                  <span className="text-xs text-text-muted">{t}</span>
                </div>
              ))}
            </>
          )}
          {recommends.map((r) => (
            <div
              key={r.id}
              className="flex-shrink-0 w-28 p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition"
            >
              <p className="text-sm font-medium text-text-dark">{r.title}</p>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {r.usageCount}次
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-dark">消息通知</h2>
          <Bell className="w-4 h-4 text-text-muted" />
        </div>
        <div className="space-y-2">
          {mockMessages.map((m, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-white shadow-sm opacity-0 animate-slideUp"
              style={{ animationDelay: `${(i + 8) * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-dark">{m.title}</span>
                <span className="text-xs text-text-muted">{m.time}</span>
              </div>
              <p className="text-xs text-text-muted line-clamp-1">{m.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
