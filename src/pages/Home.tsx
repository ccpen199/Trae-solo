import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  BookOpen,
  Music,
  Users,
  Target,
  UserCog,
  Heart,
  Star,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Seal } from '@/components/ui/Seal'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Badge } from '@/components/ui/Badge'
import { casesApi, mastersApi } from '@/lib/api'
import type { CaseStudy, Master } from '@/types'

const FEATURES = [
  { icon: Sparkles, title: '八字排盘引擎', desc: '精确计算四柱八字，分析日主强弱、喜用神，提供专业命理参考。' },
  { icon: BookOpen, title: '汉字文化考据', desc: '溯源《说文解字》，考究字义演变，融汇诗词典故，赋予名字深厚文化底蕴。' },
  { icon: Music, title: '音律和谐分析', desc: '分析声调搭配、声母韵母，规避不良谐音，确保名字朗朗上口、音韵优美。' },
  { icon: Users, title: '全国重名查询', desc: '对接权威数据，实时查询全国重名人数及地域分布，助力名字独一无二。' },
  { icon: Target, title: '智能多目标优化', desc: '综合五行补益、音律、字形、寓意等多维指标，智能筛选最优方案。' },
  { icon: UserCog, title: '专家命名服务', desc: '资深命名师一对一服务，深度沟通需求，量身定制专属佳名。' },
]

const PROCESS_STEPS = [
  { step: 1, title: '录入生辰', desc: '宝宝的出生日期及时辰' },
  { step: 2, title: '八字排盘', desc: '精确计算四柱喜用神' },
  { step: 3, title: '智能生成', desc: '匹配海量汉字文化库' },
  { step: 4, title: '多维筛选', desc: '音律五行寓意综合评分' },
  { step: 5, title: '报告导出', desc: '生成专业命名报告书' },
]

const STYLE_TAGS = ['经典', '现代', '诗意', '大气', '儒雅', '灵动']

const TESTIMONIALS = [
  {
    id: 1,
    nickname: '李女士',
    avatar: '',
    rating: 5,
    content: '给女儿起名李婉清，名字温婉雅致，亲朋好友都夸好听。特别是命名师详细的五行分析报告，让我们觉得很专业、很放心。',
  },
  {
    id: 2,
    nickname: '王先生',
    avatar: '',
    rating: 5,
    content: '儿子的名字王思齐出自《论语》，既有文化底蕴又朗朗上口。整个起名过程很顺畅，智能推荐的候选名字质量都很高。',
  },
  {
    id: 3,
    nickname: '陈女士',
    avatar: '',
    rating: 5,
    content: '书香门第对名字要求比较高，雅名轩的文化考据做得非常细致，每一个字的出处、演变、寓意都讲得清清楚楚，物超所值。',
  },
  {
    id: 4,
    nickname: '张先生',
    avatar: '',
    rating: 5,
    content: '双姓起名本来以为会很麻烦，没想到系统支持得很好，生成的名字既有家族传承感又不落俗套，非常满意！',
  },
  {
    id: 5,
    nickname: '刘先生',
    avatar: '',
    rating: 4,
    content: '重名查询功能很实用，最后选的名字全国才两百多人用，很独特。命名报告书也做得很精美，可以直接打印收藏。',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<CaseStudy[]>([])
  const [masters, setMasters] = useState<Master[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, mastersRes] = await Promise.all([
          casesApi.list({ pageSize: 7 }),
          mastersApi.list({ pageSize: 4 }),
        ])
        setCases(casesRes.items || [])
        setMasters(mastersRes.items || [])
      } catch {
        setCases([])
        setMasters([])
      }
    }
    fetchData()
  }, [])

  const displayCases = cases.length > 0 ? cases : []

  return (
    <div className="relative z-10">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-jade-700 via-jade-800 to-jade-900">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="ink1" cx="30%" cy="30%" r="40%">
                <stop offset="0%" stopColor="#3a7a71" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0f2424" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="ink2" cx="70%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#55988e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#071212" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#ink1)" />
            <rect width="100%" height="100%" fill="url(#ink2)" />
          </svg>
        </div>

        <div className="container relative z-10 text-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <Seal text="雅" size="lg" className="mx-auto mb-8" />
          </div>
          <h1
            className="font-serif text-6xl md:text-8xl font-bold text-ink-50 tracking-widest mb-6 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            雅名轩
          </h1>
          <p
            className="text-lg md:text-xl text-ink-100 tracking-wide mb-12 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '160ms' }}
          >
            以文化考据之名，承千年文脉之美
          </p>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            <Button
              variant="seal"
              size="lg"
              onClick={() => navigate('/naming/wizard')}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              立即起名
            </Button>
            <Button variant="secondary" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              了解更多
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-100 animate-float">
          <ChevronRight className="h-8 w-8 rotate-90" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-ink-50">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-serif text-4xl font-bold ink-text-gradient mb-4">匠心六艺</h2>
            <div className="ink-divider w-48 mx-auto mb-4" />
            <p className="text-ink-500 max-w-xl mx-auto">融合传统命理、汉字文化与现代科技，六大维度匠心打造每一个好名</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <Card
                key={feature.title}
                hoverable
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-jade-700 text-ink-50 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-ink-100/50">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-serif text-4xl font-bold ink-text-gradient mb-4">起名流程</h2>
            <div className="ink-divider w-48 mx-auto mb-4" />
            <p className="text-ink-500 max-w-xl mx-auto">五步精心流程，专业可靠，从录入到命名报告一气呵成</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-ink-300 mx-24" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {PROCESS_STEPS.map((item, index) => (
                <div
                  key={item.step}
                  className="relative text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="relative z-10 flex justify-center mb-6">
                    <Seal text={`${item.step}`} size="md" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-ink-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-ink-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-24 bg-ink-50">
        <div className="container">
          <div className="flex items-end justify-between mb-16">
            <div className="animate-fade-in-up">
              <h2 className="font-serif text-4xl font-bold ink-text-gradient mb-4">精选案例</h2>
              <div className="ink-divider w-48 mb-4" />
              <p className="text-ink-500 max-w-xl">真实客户案例，见证每一个好名字的诞生</p>
            </div>
            <Link
              to="/cases"
              className="hidden md:flex items-center gap-1 text-jade-700 hover:text-jade-800 font-medium animate-fade-in-up"
              style={{ animationDelay: '80ms' }}
            >
              查看全部 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(displayCases.length > 0 ? displayCases : Array.from({ length: 6 })).map((c, index) => {
              const caseData = c as CaseStudy | undefined
              const score = 85 + ((index * 7) % 12)
              return (
                <Card
                  key={caseData?.id || `case-${index}`}
                  hoverable
                  variant="bamboo"
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-ink-800 tracking-wider">
                          {caseData?.finalName || ['李墨涵', '王思齐', '陈婉清', '张瑾瑜', '刘轩宇', '周书瑶'][index]}
                        </h3>
                        <p className="text-sm text-ink-500 mt-1">
                          {caseData?.babyInfo?.gender === 'male' ? '男宝' : caseData?.babyInfo?.gender === 'female' ? '女宝' : ['男宝', '男宝', '女宝', '女宝', '男宝', '女宝'][index]}
                        </p>
                      </div>
                      <ProgressRing value={score} size={64} strokeWidth={5} />
                    </div>
                    <p className="text-sm text-ink-600 leading-relaxed mb-4 line-clamp-3">
                      {caseData?.explanation || '墨者，笔墨丹青，含文韬武略之气；涵者，包容涵养，有海纳百川之度。二字并用，补益八字喜用神，寓文采斐然、气度恢弘之意。'}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-ink-200/50">
                      <span className="text-sm text-ink-500">命名师：{caseData?.masterName || '李明远'}</span>
                      <div className="flex items-center gap-1 text-cinnabar-600">
                        <Heart className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{caseData?.likes || 300 + index * 50}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="md:hidden text-center mt-8">
            <Link to="/cases" className="inline-flex items-center gap-1 text-jade-700 hover:text-jade-800 font-medium">
              查看全部案例 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Masters */}
      <section className="py-24 bg-ink-100/50 overflow-hidden">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-serif text-4xl font-bold ink-text-gradient mb-4">命名师团队</h2>
            <div className="ink-divider w-48 mx-auto mb-4" />
            <p className="text-ink-500 max-w-xl mx-auto">深耕传统文化，传承命名匠心，每位命名师均经严格认证</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-6 min-w-max container">
            {(masters.length > 0 ? masters : Array.from({ length: 4 })).map((m, index) => {
              const master = m as Master | undefined
              return (
                <Card
                  key={master?.id || `master-${index}`}
                  hoverable
                  className="w-72 shrink-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-jade-100 border-4 border-gold-300 flex items-center justify-center mb-3 overflow-hidden">
                        {master?.avatar ? (
                          <img src={master.avatar} alt={master.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-serif text-3xl font-bold text-jade-700">{(master?.name || ['李', '王', '张', '陈'][index]).charAt(0)}</span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-ink-800">{master?.name || ['李明远', '王守正', '张清雅', '陈怀远'][index]}</h3>
                      <p className="text-sm text-jade-700 font-medium">{master?.title || ['资深命名师', '首席命名顾问', '新锐命名师', '资深命名顾问'][index]}</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                      {(master?.specialties || [['国学经典', '诗词典故'], ['八字命理', '音律美学'], ['诗意命名', '现代美学'], ['男宝起名', '商品牌号']][index]).map((spec: string) => (
                        <Badge key={spec} variant="jade" dot>
                          {spec}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-ink-200">
                      <span className="text-sm text-ink-500">案例 {master?.caseCount || [2860, 3520, 1580, 2150][index]}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-gold-500 fill-current" />
                        <span className="text-sm font-medium text-ink-700">{master?.rating?.toFixed(1) || ['4.9', '4.9', '4.9', '4.9'][index]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-ink-50 overflow-hidden">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-serif text-4xl font-bold ink-text-gradient mb-4">用户评价</h2>
            <div className="ink-divider w-48 mx-auto mb-4" />
            <p className="text-ink-500 max-w-xl mx-auto">来自真实用户的反馈，口碑见证专业品质</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-6 min-w-max container">
            {TESTIMONIALS.map((item, index) => (
              <Card
                key={item.id}
                variant="bamboo"
                className="w-80 shrink-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-jade-100 flex items-center justify-center overflow-hidden">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif text-sm font-bold text-jade-700">{item.nickname.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-ink-800 text-sm">{item.nickname}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < item.rating ? 'text-gold-500 fill-current' : 'text-ink-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-ink-600 leading-relaxed">{item.content}</p>
                  <div className="flex gap-1 mt-4 flex-wrap">
                    {STYLE_TAGS.slice(index % 3, (index % 3) + 2).map((tag) => (
                      <Badge key={tag} variant="default" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-jade-700 to-jade-900">
        <div className="container text-center animate-fade-in-up">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink-50 mb-6">
            为宝宝献上人生第一份珍贵礼物
          </h2>
          <p className="text-ink-100 mb-8 max-w-xl mx-auto">
            传承千年文脉，融合现代审美，让好名伴随一生
          </p>
          <Button
            variant="seal"
            size="lg"
            onClick={() => navigate('/naming/wizard')}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            立即开启智能起名
          </Button>
        </div>
      </section>
    </div>
  )
}
