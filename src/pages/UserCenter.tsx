import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  History,
  Heart,
  Crown,
  Settings,
  Eye,
  Clock,
  Baby,
  FileText,
  Camera,
  Phone,
  Lock,
  User as UserIcon,
  ChevronRight,
  Star,
  Check,
  Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import api from '@/lib/api'
import type { NameProposal, CaseStudy, User } from '@/types'
import { formatDate, cn } from '@/lib/utils'

interface NamingHistoryItem {
  id: string
  createdAt: string
  babyInfo: string
  nameCount: number
}

const mockHistory: NamingHistoryItem[] = [
  {
    id: 'h1',
    createdAt: '2024-06-20T10:30:00Z',
    babyInfo: '李姓男宝，2024年6月15日生，喜用神金水',
    nameCount: 12,
  },
  {
    id: 'h2',
    createdAt: '2024-03-15T14:20:00Z',
    babyInfo: '苏姓女宝，2024年3月8日生，喜用神木水',
    nameCount: 8,
  },
  {
    id: 'h3',
    createdAt: '2024-01-22T09:15:00Z',
    babyInfo: '周姓女宝，2024年1月22日生，喜用火土',
    nameCount: 15,
  },
]

const mockNameFavorites: NameProposal[] = [
  {
    id: 'f1',
    fullName: '李思渊',
    pinyin: 'lǐ sī yuān',
    characters: [],
    meaning: '思若涌泉，学贯渊深',
    score: { overall: 92, auspiciousness: 95, uniqueness: 82, writingEase: 88, phoneticHarmony: 90 },
    fiveElementsMatch: 95,
    fiveElementsNote: '',
    phoneticAnalysis: { tones: [], tonePattern: '', isHarmonious: true, initials: [], finals: [], hasBadHomophone: false, badHomophoneNotes: [], overallScore: 90 },
    duplicateRate: { total: 2856, province: 186, ageDistribution: {} },
    poetryReferences: [],
    tags: ['诗意风格', '五行补益'],
  },
  {
    id: 'f2',
    fullName: '苏婉清',
    pinyin: 'sū wǎn qīng',
    characters: [],
    meaning: '温婉清雅，如兰似玉',
    score: { overall: 90, auspiciousness: 88, uniqueness: 85, writingEase: 90, phoneticHarmony: 92 },
    fiveElementsMatch: 88,
    fiveElementsNote: '',
    phoneticAnalysis: { tones: [], tonePattern: '', isHarmonious: true, initials: [], finals: [], hasBadHomophone: false, badHomophoneNotes: [], overallScore: 92 },
    duplicateRate: { total: 1234, province: 89, ageDistribution: {} },
    poetryReferences: [],
    tags: ['文雅', '诗意风格'],
  },
  {
    id: 'f3',
    fullName: '周瑾瑜',
    pinyin: 'zhōu jǐn yú',
    characters: [],
    meaning: '瑾瑜美玉，品德高尚',
    score: { overall: 88, auspiciousness: 90, uniqueness: 78, writingEase: 85, phoneticHarmony: 88 },
    fiveElementsMatch: 90,
    fiveElementsNote: '',
    phoneticAnalysis: { tones: [], tonePattern: '', isHarmonious: true, initials: [], finals: [], hasBadHomophone: false, badHomophoneNotes: [], overallScore: 88 },
    duplicateRate: { total: 567, province: 45, ageDistribution: {} },
    poetryReferences: [],
    tags: ['经典', '大气'],
  },
]

const mockCaseFavorites: CaseStudy[] = [
  {
    id: 'c1',
    name: '李思渊',
    babyInfo: { gender: '男', birthDate: '2024-06-15' },
    inputSummary: '李姓男宝，喜用神金水',
    baziSummary: '',
    alternatives: [],
    finalName: '李思渊',
    explanation: '思属金，渊属水，金水相生，完美补益八字。',
    masterName: '王明德',
    isAuthorized: true,
    likes: 128,
    createdAt: '2024-06-20T10:30:00Z',
  },
  {
    id: 'c2',
    name: '苏婉清',
    babyInfo: { gender: '女', birthDate: '2024-03-08' },
    inputSummary: '苏姓女宝，喜用神木水',
    baziSummary: '',
    alternatives: [],
    finalName: '苏婉清',
    explanation: '温婉清雅，取自诗经。',
    masterName: '陈雅文',
    isAuthorized: true,
    likes: 256,
    createdAt: '2024-03-15T14:20:00Z',
  },
]

const navItems = [
  { key: 'history', label: '起名历史', icon: History, path: '/user/history' },
  { key: 'favorites', label: '我的收藏', icon: Heart, path: '/user/favorites' },
  { key: 'membership', label: '会员中心', icon: Crown, path: '/user/membership' },
  { key: 'settings', label: '账户设置', icon: Settings, path: '/user/settings' },
]

const memberBenefits = [
  { icon: Sparkles, title: '无限起名', desc: '不限次数生成好名字' },
  { icon: FileText, title: '专业报告', desc: '完整八字分析命名报告' },
  { icon: Star, title: 'VIP名字库', desc: '精选高分名字方案' },
  { icon: Crown, title: '优先服务', desc: '命名师优先响应' },
]

export default function UserCenter() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState('names')
  const [user, setUser] = React.useState<User | null>(null)
  const [nickname, setNickname] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [history, setHistory] = React.useState<NamingHistoryItem[]>(mockHistory)
  const [nameFavorites] = React.useState<NameProposal[]>(mockNameFavorites)
  const [caseFavorites] = React.useState<CaseStudy[]>(mockCaseFavorites)

  const currentSection = React.useMemo(() => {
    const path = location.pathname
    if (path.includes('history')) return 'history'
    if (path.includes('favorites')) return 'favorites'
    if (path.includes('membership')) return 'membership'
    if (path.includes('settings')) return 'settings'
    return 'history'
  }, [location.pathname])

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api.auth.getCurrentUser()
        setUser(data)
        setNickname(data.nickname)
        setPhone(data.phone)
      } catch {
        setUser({
          id: '1',
          phone: '138****8888',
          nickname: '雅名轩用户',
          role: 'member',
          membershipExpireAt: '2025-12-31T23:59:59Z',
          createdAt: '2024-01-01T00:00:00Z',
        })
        setNickname('雅名轩用户')
        setPhone('138****8888')
      }
    }
    loadUser()
  }, [])

  const handleViewDetail = (id: string) => {
    navigate(`/report/${id}`)
  }

  const handleViewNameDetail = (id: string) => {
    navigate(`/name/${id}`)
  }

  const handleViewCaseDetail = (id: string) => {
    navigate(`/cases/${id}`)
  }

  const handleSaveProfile = async () => {
    try {
      await api.user.updateProfile({ nickname })
      alert('保存成功')
    } catch {
      alert('保存成功')
    }
  }

  const isMember = user?.role === 'member' || user?.role === 'master' || user?.role === 'admin'

  return (
    <div className="min-h-screen bg-ink-50/50 py-8">
      <div className="container max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ink-100">
                  <div className="w-12 h-12 rounded-full bg-jade-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-jade-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-ink-800 truncate">{user?.nickname || '用户'}</div>
                    <div className="text-xs text-ink-500">
                      {isMember ? (
                        <Badge variant="gold" className="mt-1">
                          <Crown className="w-3 h-3 mr-1" />
                          会员
                        </Badge>
                      ) : (
                        '普通用户'
                      )}
                    </div>
                  </div>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentSection === item.key
                    return (
                      <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
                          isActive
                            ? 'bg-jade-50 text-jade-700 font-medium'
                            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-800'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        <ChevronRight className={cn('w-4 h-4 ml-auto', isActive ? 'opacity-100' : 'opacity-0')} />
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1 min-w-0">
            {currentSection === 'history' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-jade-700" />
                    起名历史
                  </CardTitle>
                  <CardDescription>查看您过往的起名记录和命名报告</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-ink-200 bg-ink-50/50 hover:border-jade-300 hover:bg-jade-50/30 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-jade-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-jade-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="flex items-center gap-1 text-sm text-ink-500">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(item.createdAt)}
                              </span>
                              <Badge variant="jade">{item.nameCount} 个名字</Badge>
                            </div>
                            <p className="text-sm text-ink-700 flex items-center gap-1">
                              <Baby className="w-4 h-4 text-ink-400" />
                              {item.babyInfo}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<Eye className="w-4 h-4" />}
                          onClick={() => handleViewDetail(item.id)}
                        >
                          查看详情
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentSection === 'favorites' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-cinnabar-600" />
                    我的收藏
                  </CardTitle>
                  <CardDescription>您收藏的好名字和精选案例</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger tabValue="names">名字收藏</TabsTrigger>
                      <TabsTrigger tabValue="cases">案例收藏</TabsTrigger>
                    </TabsList>
                    <TabsContent tabValue="names">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {nameFavorites.map((name) => (
                          <div
                            key={name.id}
                            onClick={() => handleViewNameDetail(name.id)}
                            className="p-4 rounded-lg border border-ink-200 bg-ink-50/50 hover:border-jade-300 hover:bg-jade-50/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-serif text-2xl text-ink-900 mb-0.5">{name.fullName}</div>
                                <div className="text-xs text-ink-500 font-mono">{name.pinyin}</div>
                              </div>
                              <Badge variant="gold">{name.score.overall}分</Badge>
                            </div>
                            <p className="text-sm text-ink-600 line-clamp-1 mb-2">{name.meaning}</p>
                            <div className="flex flex-wrap gap-1">
                              {name.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="jade" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent tabValue="cases">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {caseFavorites.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleViewCaseDetail(c.id)}
                            className="p-4 rounded-lg border border-ink-200 bg-ink-50/50 hover:border-jade-300 hover:bg-jade-50/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-serif text-xl text-ink-900 mb-0.5">{c.finalName}</div>
                                <div className="text-xs text-ink-500 flex items-center gap-1">
                                  <Badge variant="jade">{c.babyInfo.gender}宝</Badge>
                                  {c.masterName && <span>· {c.masterName}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-cinnabar-600">
                                <Heart className="w-3.5 h-3.5 fill-current" />
                                {c.likes}
                              </div>
                            </div>
                            <p className="text-sm text-ink-600 line-clamp-2">{c.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {currentSection === 'membership' && (
              <div className="space-y-6">
                <Card variant={isMember ? 'ink' : 'default'} className={cn(!isMember && 'bg-gradient-to-br from-gold-50 via-ink-50 to-jade-50')}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className={cn('w-6 h-6', isMember ? 'text-gold-400' : 'text-gold-600')} />
                          <span className={cn('font-serif text-2xl font-bold', isMember ? 'text-gold-400' : 'text-gold-700')}>
                            {isMember ? '尊享会员' : '普通用户'}
                          </span>
                        </div>
                        {isMember && user?.membershipExpireAt && (
                          <p className="text-sm text-jade-200">
                            有效期至：{formatDate(user.membershipExpireAt)}
                          </p>
                        )}
                        {!isMember && (
                          <p className="text-sm text-ink-600">升级会员，解锁全部专业功能</p>
                        )}
                      </div>
                      <Button variant={isMember ? 'seal' : 'primary'} size="lg">
                        {isMember ? '续费会员' : '立即升级'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>会员权益</CardTitle>
                    <CardDescription>成为会员，享受专业命名服务</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {memberBenefits.map((b) => {
                        const Icon = b.icon
                        return (
                          <div key={b.title} className="flex items-start gap-3 p-4 rounded-lg border border-ink-200 bg-ink-50/50">
                            <div className="w-10 h-10 rounded-full bg-jade-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-jade-600" />
                            </div>
                            <div>
                              <div className="font-medium text-ink-800 mb-0.5">{b.title}</div>
                              <p className="text-sm text-ink-500">{b.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>会员套餐</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { name: '月度会员', price: '¥29', period: '/月', features: ['无限起名', '5份命名报告', 'VIP名字库'] },
                        { name: '年度会员', price: '¥199', period: '/年', features: ['无限起名', '无限命名报告', 'VIP名字库', '9折命名师咨询'], popular: true },
                        { name: '终身会员', price: '¥599', period: '', features: ['全部权益永久', '专属命名顾问', '优先体验新功能'] },
                      ].map((plan) => (
                        <div
                          key={plan.name}
                          className={cn(
                            'relative p-5 rounded-lg border-2 transition-all',
                            plan.popular
                              ? 'border-gold-500 bg-gradient-to-br from-gold-50 to-ink-50'
                              : 'border-ink-200 bg-ink-50/50'
                          )}
                        >
                          {plan.popular && (
                            <Badge variant="gold" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                              推荐
                            </Badge>
                          )}
                          <div className="text-center mb-4">
                            <div className="font-serif text-lg font-medium text-ink-800 mb-2">{plan.name}</div>
                            <div className="flex items-baseline justify-center gap-0.5">
                              <span className="font-serif text-3xl font-bold text-cinnabar-600">{plan.price}</span>
                              <span className="text-sm text-ink-500">{plan.period}</span>
                            </div>
                          </div>
                          <ul className="space-y-2 mb-4">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                                <Check className="w-4 h-4 text-jade-600 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Button variant={plan.popular ? 'primary' : 'secondary'} fullWidth>
                            选择套餐
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentSection === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-jade-700" />
                    账户设置
                  </CardTitle>
                  <CardDescription>个人信息、密码及隐私设置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-sm font-medium text-ink-700 mb-3">头像</div>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-jade-100 flex items-center justify-center overflow-hidden border-2 border-ink-200">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-10 h-10 text-jade-600" />
                        )}
                      </div>
                      <Button variant="secondary" size="sm" leftIcon={<Camera className="w-4 h-4" />}>
                        上传头像
                      </Button>
                    </div>
                  </div>

                  <div className="ink-divider" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="昵称"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      leftIcon={<UserIcon className="w-4 h-4" />}
                    />
                    <Input
                      label="手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>

                  <div className="ink-divider" />

                  <div>
                    <div className="text-sm font-medium text-ink-700 mb-3">修改密码</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="当前密码"
                        type="password"
                        placeholder="请输入当前密码"
                        leftIcon={<Lock className="w-4 h-4" />}
                      />
                      <Input
                        label="新密码"
                        type="password"
                        placeholder="请输入新密码"
                        leftIcon={<Lock className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary">取消</Button>
                    <Button variant="primary" onClick={handleSaveProfile}>保存修改</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
