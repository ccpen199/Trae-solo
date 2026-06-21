import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Car, Heart, ChevronRight, BadgeCheck, AlertTriangle, XCircle } from 'lucide-react'
import api from '@/lib/api'
import type { Certificate } from '../../shared/types'

const CARD_CONFIG: Record<string, {
  gradient: string
  icon: React.ReactNode
  label: string
}> = {
  idcard: { gradient: 'from-blue-500 to-blue-700', icon: <CreditCard className="w-6 h-6" />, label: '身份证' },
  driver: { gradient: 'from-amber-700 to-amber-900', icon: <Car className="w-6 h-6" />, label: '驾驶证' },
  marriage: { gradient: 'from-red-500 to-rose-700', icon: <Heart className="w-6 h-6" />, label: '结婚证' },
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  valid: { label: '有效', color: 'bg-green-100 text-green-700', icon: <BadgeCheck className="w-3 h-3" /> },
  expiring: { label: '即将过期', color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-3 h-3" /> },
  expired: { label: '已过期', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
}

function CertFront({ cert }: { cert: Certificate }) {
  const cfg = CARD_CONFIG[cert.type]
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${cfg.gradient} p-6 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span className="font-semibold">{cfg.label}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[cert.status].color}`}>
          {STATUS_MAP[cert.status].icon}
          {STATUS_MAP[cert.status].label}
        </span>
      </div>
      <div className="relative z-10 space-y-2">
        {cert.type === 'idcard' && (
          <>
            <p className="text-lg font-bold">{cert.holder}</p>
            <p className="text-sm opacity-80">{cert.numberMasked}</p>
            <p className="text-xs opacity-60">有效期至 {cert.expireDate}</p>
          </>
        )}
        {cert.type === 'driver' && (
          <>
            <p className="text-lg font-bold">{cert.holder}</p>
            <p className="text-sm opacity-80">证号：{cert.numberMasked}</p>
            <p className="text-xs opacity-60">准驾车型：C1</p>
          </>
        )}
        {cert.type === 'marriage' && (
          <>
            <p className="text-lg font-bold">持证人：{cert.holder}</p>
            <p className="text-sm opacity-80">登记日期：{cert.issueDate}</p>
          </>
        )}
      </div>
    </div>
  )
}

function CertBack({ cert }: { cert: Certificate }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl bg-white border-2 border-gray-100 p-6 shadow-lg flex flex-col justify-between">
      <div className="space-y-3">
        <p className="text-sm text-text-muted">发证机关</p>
        <p className="text-sm font-medium">{cert.issueBy}</p>
        <p className="text-sm text-text-muted mt-3">完整编号</p>
        <p className="text-sm font-medium">{cert.numberMasked}</p>
        <p className="text-sm text-text-muted mt-3">签发日期</p>
        <p className="text-sm font-medium">{cert.issueDate}</p>
      </div>
      <button
        onClick={() => navigate(`/certificates/${cert.id}`)}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        亮证核验
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function Certificates() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [flipped, setFlipped] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get<Certificate[]>('/certificates').then((res) => setCerts(res.data)).catch(() => {})
  }, [])

  const toggle = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fadeIn">
      <h1 className="text-xl font-bold text-text-dark">电子证照</h1>
      <div className="space-y-5">
        {certs.map((cert) => (
          <div
            key={cert.id}
            className="cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => toggle(cert.id)}
          >
            <div
              className="relative transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped.has(cert.id) ? 'rotateY(180deg)' : 'rotateY(0)',
              }}
            >
              <div style={{ backfaceVisibility: 'hidden' }}>
                <CertFront cert={cert} />
              </div>
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <CertBack cert={cert} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {certs.length === 0 && (
        <div className="text-center py-16 text-text-muted animate-slideUp">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>暂无电子证照</p>
          <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">返回首页</Link>
        </div>
      )}
    </div>
  )
}
