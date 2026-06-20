import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ShieldCheck, Calendar, FileText, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CaseCard from '@/components/CaseCard'
import { STYLES, LEVELS, CERT_LABELS, CERT_COLORS } from '@/lib/types'
import { fetchApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { useAppStore } from '@/hooks/useAppStore'
import type { DesignerItem, CaseItem } from '@/lib/types'

const TIME_SLOTS = ['上午9-12', '下午1-5', '晚上6-8']
const HOUSE_TYPES = ['一居', '两居', '三居', '四居', '复式', '别墅']

const AVATAR_FALLBACK =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional+architect+portrait+headshot&image_size=square_hd'

const inputCls = 'w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 outline-none focus:border-sand-400'

function AppointmentModal({ designerId, onClose }: { designerId: string; onClose: () => void }) {
  const { currentUserId } = useAppStore()
  const [date, setDate] = useState('')
  const [time, setTime] = useState(TIME_SLOTS[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const onSubmit = async () => {
    if (!date) return
    setSubmitting(true)
    try {
      await fetchApi(`/api/designers/${designerId}/appointment`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUserId, preferred_date: date, preferred_time: time, message: notes }),
      })
      setSuccess(true)
    } catch { } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-sand-900">预约量房</h3>
          <button onClick={onClose} className="text-sand-900/40 hover:text-sand-900"><X size={20} /></button>
        </div>
        {success ? (
          <div className="py-8 text-center">
            <p className="font-display text-lg text-sand-900">预约成功！</p>
            <p className="mt-2 text-sm text-sand-900/60">设计师将在24小时内与您联系</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">日期</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">时间段</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} className={inputCls}>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">备注</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={cn(inputCls, 'resize-none')} placeholder="请描述您的需求…" />
            </div>
            <button onClick={onSubmit} disabled={!date || submitting} className="w-full rounded-lg bg-sand-400 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sand-500 disabled:opacity-50">
              {submitting ? '提交中…' : '提交预约'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function QuoteModal({ designerId, onClose }: { designerId: string; onClose: () => void }) {
  const [area, setArea] = useState('')
  const [houseType, setHouseType] = useState<string>(HOUSE_TYPES[2])
  const [style, setStyle] = useState<string>(STYLES[0])
  const [level, setLevel] = useState<string>(LEVELS[1].value)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ total: number; breakdown: { designFee: number; constructionFee: number; materialFee: number }; priceRange: { min: number; max: number } } | null>(null)

  const onSubmit = async () => {
    if (!area) return
    setSubmitting(true)
    try {
      const data = await fetchApi<{ total: number; breakdown: { designFee: number; constructionFee: number; materialFee: number }; priceRange: { min: number; max: number } }>(`/api/designers/${designerId}/quote`, {
        method: 'POST',
        body: JSON.stringify({ house_type: houseType, area: Number(area), style, quality: level }),
      })
      setResult(data)
    } catch { } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-sand-900">获取报价</h3>
          <button onClick={onClose} className="text-sand-900/40 hover:text-sand-900"><X size={20} /></button>
        </div>
        {result ? (
          <div className="mt-4 space-y-3">
            <div className="text-center">
              <p className="text-sm text-sand-900/60">预估总价</p>
              <p className="font-display text-3xl font-bold text-sand-900">¥{formatPrice(result.total)}</p>
              <p className="mt-1 text-xs text-sand-900/40">参考范围 ¥{formatPrice(result.priceRange.min)} - ¥{formatPrice(result.priceRange.max)}</p>
            </div>
            <div className="space-y-2 rounded-xl bg-sand-50 p-4 text-sm">
              <div key="designFee" className="flex justify-between">
                <span className="text-sand-900/60">设计费</span>
                <span className="font-medium text-sand-900">¥{formatPrice(result.breakdown.designFee)}</span>
              </div>
              <div key="constructionFee" className="flex justify-between">
                <span className="text-sand-900/60">施工费</span>
                <span className="font-medium text-sand-900">¥{formatPrice(result.breakdown.constructionFee)}</span>
              </div>
              <div key="materialFee" className="flex justify-between">
                <span className="text-sand-900/60">材料费</span>
                <span className="font-medium text-sand-900">¥{formatPrice(result.breakdown.materialFee)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">面积 (㎡)</label>
              <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="100" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">户型</label>
              <select value={houseType} onChange={(e) => setHouseType(e.target.value)} className={inputCls}>
                {HOUSE_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">风格</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className={inputCls}>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">档次</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <button onClick={onSubmit} disabled={!area || submitting} className="w-full rounded-lg bg-sand-400 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sand-500 disabled:opacity-50">
              {submitting ? '计算中…' : '获取报价'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function DesignerDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<DesignerItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAppointment, setShowAppointment] = useState(false)
  const [showQuote, setShowQuote] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchApi<DesignerItem>(`/api/designers/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100">
        <Navbar />
        <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <div className="h-28 w-28 animate-pulse rounded-full bg-sand-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-sand-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-sand-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-sand-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-sand-100">
        <Navbar />
        <div className="mx-auto max-w-8xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="font-display text-2xl text-sand-900/40">设计师未找到</p>
          <Link to="/designers" className="mt-4 inline-block text-sand-400 hover:underline">返回设计师列表</Link>
        </div>
      </div>
    )
  }

  const cases: CaseItem[] = (data as DesignerItem & { cases?: CaseItem[] }).cases || []

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/designers" className="mb-6 inline-flex items-center gap-2 text-sm text-sand-900/60 transition-colors hover:text-sand-400">
          <ArrowLeft size={16} /> 返回设计师列表
        </Link>

        <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <img src={data.avatar || AVATAR_FALLBACK} alt={data.name} className="h-28 w-28 flex-shrink-0 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-sand-900">{data.name}</h1>
                <span className={`flex items-center gap-1 text-sm font-medium ${CERT_COLORS[data.certification]}`}>
                  <ShieldCheck size={16} />{CERT_LABELS[data.certification]}
                </span>
              </div>
              <p className="mt-1 text-sm text-sand-900/60">{data.region}</p>
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(data.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-sand-200'} />
                ))}
                <span className="ml-1 text-sm text-sand-900/60">{data.rating}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-sand-900/70">{data.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.styles.map((s) => (
                  <span key={s} className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-sand-600">{s}</span>
                ))}
              </div>
              <div className="mt-3 text-sm text-sand-400">
                ¥{formatPrice(data.priceMin)}-{formatPrice(data.priceMax)}/㎡
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setShowAppointment(true)} className="flex items-center gap-2 rounded-lg bg-sand-400 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sand-500">
              <Calendar size={16} /> 预约量房
            </button>
            <button onClick={() => setShowQuote(true)} className="flex items-center gap-2 rounded-lg border border-sand-200 bg-white px-6 py-2.5 text-sm font-semibold text-sand-900 transition-colors hover:bg-sand-50">
              <FileText size={16} /> 获取报价
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-sand-900">作品集</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => <CaseCard key={c.id} item={c} />)}
          </div>
          {cases.length === 0 && (
            <div className="py-16 text-center text-sand-900/40">
              <p className="font-display text-lg">暂无作品</p>
            </div>
          )}
        </div>
      </div>

      {showAppointment && <AppointmentModal designerId={id!} onClose={() => setShowAppointment(false)} />}
      {showQuote && <QuoteModal designerId={id!} onClose={() => setShowQuote(false)} />}

      <Footer />
    </div>
  )
}
