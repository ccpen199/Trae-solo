import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Star,
  User,
  CalendarDays,
  Bookmark,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RadarChart, type RadarDimension } from '@/components/ui/RadarChart'
import { casesApi, mastersApi } from '@/lib/api'
import { cn, formatDate, type WuXingElement, getWuXingColor, getWuXingName } from '@/lib/utils'
import type { CaseStudy, Master } from '@/types'
import { casesSeed } from '@/data/mockCases'
import { mastersSeed } from '@/data/mockMasters'

const genderMap: Record<string, { label: string; variant: 'jade' | 'cinnabar' | 'default' }> = {
  male: { label: '男宝', variant: 'jade' },
  female: { label: '女宝', variant: 'cinnabar' },
  neutral: { label: '中性', variant: 'default' },
}

const mockWuXingData: RadarDimension[] = [
  { key: 'metal', label: '金', value: 35 },
  { key: 'wood', label: '木', value: 85 },
  { key: 'water', label: '水', value: 45 },
  { key: 'fire', label: '火', value: 55 },
  { key: 'earth', label: '土', value: 60 },
]

const mockFavorableElements: WuXingElement[] = ['water']

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

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [caseData, setCaseData] = React.useState<CaseStudy | null>(null)
  const [master, setMaster] = React.useState<Master | null>(null)
  const [liked, setLiked] = React.useState(false)
  const [bookmarked, setBookmarked] = React.useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (id) {
          const result = await casesApi.get(id)
          setCaseData(result)
          if (result.masterId) {
            try {
              const m = await mastersApi.get(result.masterId)
              setMaster(m)
            } catch {
              const m = mastersSeed.find((mm) => mm.id === result.masterId) || null
              setMaster(m)
            }
          }
        }
      } catch {
        const found = casesSeed.find((c) => c.id === id) || casesSeed[0]
        setCaseData(found)
        if (found.masterId) {
          const m = mastersSeed.find((mm) => mm.id === found.masterId) || null
          setMaster(m)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading || !caseData) {
    return (
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-24 bg-ink-200 rounded" />
            <div className="h-16 w-1/3 bg-ink-300 rounded mx-auto" />
            <div className="h-96 bg-ink-200 rounded-lg" />
            <div className="h-64 bg-ink-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  const gender = genderMap[caseData.babyInfo.gender] || genderMap.neutral

  return (
    <div className="relative z-10 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-8"
        >
          返回列表
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge variant={gender.variant}>{gender.label}</Badge>
            {caseData.isAuthorized && (
              <Badge variant="gold">已授权</Badge>
            )}
          </div>
          <h1 className="font-serif text-[64px] font-bold ink-text-gradient leading-none mb-6 tracking-wider">
            {caseData.name}
          </h1>
          <div className="flex items-center justify-center gap-6 text-ink-500 mb-6">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span>{formatDate(caseData.babyInfo.birthDate)}</span>
            </div>
          </div>
          {master && (
            <div
              className="inline-flex items-center gap-3 p-3 rounded-lg bg-ink-50/80 border border-ink-200 cursor-pointer hover:bg-jade-50/50 transition-colors"
              onClick={() => navigate(`/masters/${master.id}`)}
            >
              <div className="w-12 h-12 rounded-full bg-jade-100 flex items-center justify-center border-2 border-gold-400">
                {master.avatar ? (
                  <img
                    src={master.avatar}
                    alt={master.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-jade-600" />
                )}
              </div>
              <div className="text-left">
                <div className="font-serif font-bold text-ink-800">{master.name}</div>
                <div className="text-xs text-ink-500">{master.title}</div>
              </div>
            </div>
          )}
        </div>

        <div className="ink-divider mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-1 h-5 bg-jade-600 rounded" />
                起名背景
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-ink-500 mb-1.5">宝宝信息</h4>
                <p className="text-ink-700">
                  {gender.label} · {formatDate(caseData.babyInfo.birthDate)}出生
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-ink-500 mb-1.5">父母期望</h4>
                <p className="text-ink-700 leading-relaxed">{caseData.inputSummary}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-1 h-5 bg-jade-600 rounded" />
                八字排盘摘要
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-ink-500 mb-3">四柱干支</h4>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['甲子', '丙寅', '甲戌', '己巳'].map((gz, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded bg-jade-50 border border-jade-200 flex flex-col items-center justify-center"
                      >
                        <span className="font-serif text-xl font-bold text-jade-700">
                          {gz.charAt(0)}
                        </span>
                        <span className="font-serif text-sm text-jade-600">
                          {gz.charAt(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-ink-500 mb-2">喜用神</h4>
                    <div className="flex gap-2">
                      {mockFavorableElements.map((el) => (
                        <Badge key={el} variant="wuxing" element={el} dot>
                          {getWuXingName(el)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <RadarChart dimensions={mockWuXingData} size={200} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-1 h-5 bg-jade-600 rounded" />
              备选方案
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {caseData.alternatives.map((name, i) => (
                <div
                  key={i}
                  className="bamboo-card rounded-lg p-4 text-center"
                >
                  <div className="font-serif text-2xl font-bold text-ink-800 mb-2">
                    {name}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 mb-2">
                    {renderStars(4.5 - i * 0.2)}
                  </div>
                  <p className="text-xs text-ink-500 line-clamp-2">
                    备选方案，{92 - i * 3}分，符合八字五行
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10" variant="ink">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-50">
              <span className="w-1 h-5 bg-gold-400 rounded" />
              最终方案详解
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-ink-100">
            <div>
              <h4 className="font-serif text-lg font-bold text-gold-300 mb-2">
                名字释义
              </h4>
              <p className="leading-relaxed">{caseData.explanation}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-serif text-lg font-bold text-gold-300 mb-2">
                  五行补益
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(['water', 'wood'] as WuXingElement[]).map((el) => (
                    <Badge
                      key={el}
                      className="!bg-opacity-20"
                      style={{
                        backgroundColor: `${getWuXingColor(el)}30`,
                        color: getWuXingColor(el),
                        borderColor: getWuXingColor(el),
                      }}
                    >
                      {getWuXingName(el)} · 喜用
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-gold-300 mb-2">
                  音律分析
                </h4>
                <p className="text-sm leading-relaxed">
                  声调抑扬顿挫，平仄搭配合理，读来朗朗上口，音律和谐优美，无不良谐音。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {caseData.isAuthorized && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-1 h-5 bg-jade-600 rounded" />
                用户评价
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-ink-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-ink-800">用户***</span>
                    <div className="flex">{renderStars(5)}</div>
                    <span className="text-xs text-ink-400 ml-auto">
                      {formatDate(caseData.createdAt)}
                    </span>
                  </div>
                  <p className="text-ink-600 leading-relaxed">
                    非常满意！命名师专业细致，名字既有文化底蕴又符合八字，家人都很喜欢。整个过程沟通顺畅，强烈推荐！
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-3 bg-ink-50 border border-ink-200 rounded-full px-4 py-2 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLiked(!liked)}
              className={cn(liked ? 'text-cinnabar-600' : '')}
              leftIcon={
                <Heart className={cn('h-4 w-4', liked ? 'fill-current' : '')} />
              }
            >
              {caseData.likes + (liked ? 1 : 0)}
            </Button>
            <div className="w-px h-5 bg-ink-200" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBookmarked(!bookmarked)}
              className={cn(bookmarked ? 'text-gold-600' : '')}
              leftIcon={
                <Bookmark className={cn('h-4 w-4', bookmarked ? 'fill-current' : '')} />
              }
            >
              收藏
            </Button>
            {master && (
              <>
                <div className="w-px h-5 bg-ink-200" />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/masters/${master.id}`)}
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                >
                  咨询该命名师
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
