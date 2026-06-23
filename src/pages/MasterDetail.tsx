import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  User,
  Briefcase,
  Award,
  ShieldCheck,
  MessageCircle,
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CaseCard } from '@/components/cases/CaseCard'
import { mastersApi } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import type { Master, CaseStudy, PaginatedResponse } from '@/types'
import { mastersSeed } from '@/data/mockMasters'
import { casesSeed } from '@/data/mockCases'

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        'h-4 w-4',
        i < Math.floor(rating) ? 'fill-gold-500 text-gold-500' : 'text-ink-300'
      )}
    />
  ))
}

const mockReviews = [
  {
    id: 'r1',
    user: '李女士',
    avatar: '',
    rating: 5,
    content: '李老师非常专业，对我们的需求理解很到位，给出的名字既有文化底蕴又符合八字命理，家人都非常满意！整个沟通过程耐心细致，强烈推荐！',
    date: '2024-05-15',
  },
  {
    id: 'r2',
    user: '王先生',
    avatar: '',
    rating: 5,
    content: '慕名而来，果然名不虚传。命名师对诗词典故信手拈来，每个名字都有详尽的文化考据和五行分析，最终选的名字越品越有味道。',
    date: '2024-04-28',
  },
  {
    id: 'r3',
    user: '张女士',
    avatar: '',
    rating: 4.5,
    content: '服务态度很好，响应及时，名字方案也不错，只是在备选数量上希望能再多一些。总体还是很满意的，给女儿起的名字亲友都夸好听。',
    date: '2024-03-20',
  },
]

export default function MasterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [master, setMaster] = React.useState<Master | null>(null)
  const [cases, setCases] = React.useState<PaginatedResponse<CaseStudy>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 9,
  })
  const [showConsult, setShowConsult] = React.useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (id) {
          const m = await mastersApi.get(id)
          setMaster(m)
          try {
            const c = await mastersApi.getCases(id)
            setCases(c)
          } catch {
            const relatedCases = casesSeed.filter((c) => c.masterId === id)
            setCases({
              items: relatedCases,
              total: relatedCases.length,
              page: 1,
              pageSize: 9,
            })
          }
        }
      } catch {
        const found = mastersSeed.find((m) => m.id === id) || mastersSeed[0]
        setMaster(found)
        const relatedCases = casesSeed.filter((c) => c.masterId === found.id)
        setCases({
          items: relatedCases,
          total: relatedCases.length,
          page: 1,
          pageSize: 9,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading || !master) {
    return (
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-24 bg-ink-200 rounded" />
            <div className="h-48 bg-ink-200 rounded-lg" />
            <div className="h-64 bg-ink-200 rounded-lg" />
            <div className="h-96 bg-ink-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-8"
        >
          返回列表
        </Button>

        <Card className="mb-10 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-jade-700 via-jade-600 to-jade-700 relative">
            <div className="absolute inset-0 opacity-20">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
            </div>
          </div>
          <CardContent className="pt-0 -mt-16">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-ink-50 flex items-center justify-center border-4 border-gold-400 shadow-xl">
                  {master.avatar ? (
                    <img
                      src={master.avatar}
                      alt={master.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-14 w-14 text-jade-600" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-serif text-4xl font-bold text-ink-800">
                    {master.name}
                  </h1>
                  <Badge variant="jade">
                    <Award className="h-3 w-3" />
                    {master.title}
                  </Badge>
                  <Badge variant="gold">
                    <ShieldCheck className="h-3 w-3" />
                    平台认证
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-ink-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>{master.experience}年从业经验</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    <span>{master.caseCount}个成功案例</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex">{renderStars(master.rating)}</div>
                    <span className="font-medium text-ink-700">
                      {master.rating.toFixed(2)}
                    </span>
                    <span className="text-xs">({master.reviewCount}条评价)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {master.specialties.map((s, i) => (
                    <Badge key={i} variant="default">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-1 h-5 bg-jade-600 rounded" />
              个人简介
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-ink-700 leading-relaxed">{master.introduction}</p>
            <div>
              <h4 className="font-serif text-lg font-bold text-ink-800 mb-3">
                擅长领域
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {master.specialties.map((s, i) => (
                  <div
                    key={i}
                    className="bg-jade-50/50 rounded-lg p-4 border border-jade-100"
                  >
                    <div className="font-medium text-jade-800 mb-1">{s}</div>
                    <p className="text-sm text-ink-500">
                      深耕{s}领域{master.experience}年，累计服务超过
                      {Math.round(master.caseCount / master.specialties.length)}
                      位客户。
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-ink-800 mb-3">
                资质认证
              </h4>
              <div className="flex flex-wrap gap-2">
                {master.certificates.map((c, i) => (
                  <Badge key={i} variant="gold" className="py-1 px-3">
                    <ShieldCheck className="h-3 w-3" />
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-jade-600 rounded" />
                案例作品
                <span className="text-sm font-normal text-ink-400">
                  ({cases.total})
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cases.items.length === 0 ? (
              <p className="text-center text-ink-500 py-8">暂无案例</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.items.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseData={caseItem}
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-1 h-5 bg-jade-600 rounded" />
              用户评价
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockReviews.map((r) => (
                <div
                  key={r.id}
                  className="pb-6 border-b border-ink-100 last:border-0 last:pb-0"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-ink-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-ink-800">{r.user}</span>
                        <div className="flex">{renderStars(r.rating)}</div>
                        <span className="text-xs text-ink-400 ml-auto">
                          <CalendarDays className="h-3 w-3 inline mr-1" />
                          {formatDate(r.date)}
                        </span>
                      </div>
                      <p className="text-ink-600 leading-relaxed">{r.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowConsult(true)}
            leftIcon={<MessageCircle className="h-5 w-5" />}
            className="shadow-gold-glow px-10"
          >
            在线咨询 {master.name}
          </Button>
        </div>

        {showConsult && (
          <div
            className="fixed inset-0 bg-ink-900/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConsult(false)}
          >
            <Card
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle>咨询 {master.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-ink-500">
                  请留下您的联系方式，命名师将尽快与您联系。
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="您的姓名"
                    className="w-full h-10 px-3 bg-ink-50 border-b-2 border-ink-300 focus:border-cinnabar-500 focus:outline-none rounded"
                  />
                  <input
                    type="tel"
                    placeholder="联系电话"
                    className="w-full h-10 px-3 bg-ink-50 border-b-2 border-ink-300 focus:border-cinnabar-500 focus:outline-none rounded"
                  />
                  <textarea
                    placeholder="留言（选填）"
                    rows={3}
                    className="w-full px-3 py-2 bg-ink-50 border-b-2 border-ink-300 focus:border-cinnabar-500 focus:outline-none rounded resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowConsult(false)}
                  >
                    取消
                  </Button>
                  <Button variant="primary" fullWidth>
                    提交咨询
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
