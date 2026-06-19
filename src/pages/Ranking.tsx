import { useState } from 'react'
import {
  Award,
  TrendingUp,
  Users,
  Crown,
  Medal,
  Trophy,
  ChevronRight,
  Target,
  Star,
  Filter,
} from 'lucide-react'
import { useBusinessStore } from '@/store/business'

type PeriodKey = 'month' | 'quarter' | 'year'

export default function Ranking() {
  const [period, setPeriod] = useState<PeriodKey>('month')
  const [category, setCategory] = useState('业绩')
  const { addToast, openModal } = useBusinessStore()

  const periods: { key: PeriodKey; label: string }[] = [
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季度' },
    { key: 'year', label: '本年度' },
  ]

  const categories = ['业绩', '新增客户', '团队规模', '合规评分']

  const myRanking = {
    rank: 12,
    total: 356,
    performance: 128600,
    target: 200000,
    aboveAverage: '+32.5%',
  }

  const rankings = [
    { rank: 1, name: '刘晓燕', id: 'DS0089', region: '华东区-上海', performance: 486500, growth: '+56.2%', team: 28, avatar: '刘' },
    { rank: 2, name: '陈志强', id: 'DS0023', region: '华南区-广州', performance: 425800, growth: '+41.8%', team: 24, avatar: '陈' },
    { rank: 3, name: '王丽华', id: 'DS0156', region: '华北区-北京', performance: 398200, growth: '+38.5%', team: 32, avatar: '王' },
    { rank: 4, name: '张建国', id: 'DS0078', region: '西南区-成都', performance: 312600, growth: '+29.3%', team: 18, avatar: '张' },
    { rank: 5, name: '李秀兰', id: 'DS0134', region: '华东区-杭州', performance: 289400, growth: '+35.1%', team: 15, avatar: '李' },
    { rank: 6, name: '赵伟明', id: 'DS0201', region: '华中区-武汉', performance: 256800, growth: '+22.7%', team: 12, avatar: '赵' },
    { rank: 7, name: '孙美玲', id: 'DS0178', region: '华东区-南京', performance: 234500, growth: '+28.9%', team: 10, avatar: '孙' },
    { rank: 8, name: '周鹏飞', id: 'DS0056', region: '东北区-沈阳', performance: 212300, growth: '+19.4%', team: 14, avatar: '周' },
    { rank: 9, name: '吴雅婷', id: 'DS0092', region: '华南区-深圳', performance: 198600, growth: '+31.2%', team: 8, avatar: '吴' },
    { rank: 10, name: '郑海涛', id: 'DS0145', region: '华东区-苏州', performance: 185200, growth: '+24.8%', team: 11, avatar: '郑' },
    { rank: 11, name: '冯晓东', id: 'DS0189', region: '西北区-西安', performance: 168900, growth: '+17.3%', team: 9, avatar: '冯' },
    { rank: 12, name: '李明', id: 'DS001', region: '华东区-上海市', performance: 128600, growth: '+23.5%', team: 3, avatar: '李', isMe: true },
  ]

  const rankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'from-amber-400 to-yellow-500', icon: Crown, shadow: 'shadow-amber-500/50' }
    if (rank === 2) return { bg: 'from-slate-300 to-slate-400', icon: Medal, shadow: 'shadow-slate-400/50' }
    if (rank === 3) return { bg: 'from-orange-400 to-amber-600', icon: Trophy, shadow: 'shadow-orange-500/50' }
    return { bg: 'from-slate-200 to-slate-300', icon: Award, shadow: '' }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-600" />
            业绩排行榜
          </h1>
          <p className="text-slate-500 text-sm mt-1">全国直销员业绩排名 · 实时更新</p>
        </div>
        <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition flex items-center gap-2">
          <Filter className="w-4 h-4" />
          区域筛选
        </button>
      </div>

      {/* 我的排名卡片 */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-4 items-center">
          <div className="lg:col-span-2">
            <div className="text-white/70 text-sm flex items-center gap-1">
              <Target className="w-4 h-4" />
              我的排名 · {periods.find((p) => p.key === period)?.label}
            </div>
            <div className="mt-2 flex items-end gap-4">
              <div className="text-6xl lg:text-7xl font-black">#{myRanking.rank}</div>
              <div className="pb-3 text-white/70">
                / 共 {myRanking.total} 人
                <div className="flex items-center gap-1 mt-1 text-emerald-300 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  超越 {myRanking.aboveAverage}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/70">月度目标进度</span>
                <span className="font-medium">
                  ¥{myRanking.performance.toLocaleString()} / ¥{myRanking.target.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  style={{ width: `${(myRanking.performance / myRanking.target) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <div
              onClick={() => openModal('performance_detail', { type: 'performance' })}
              className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition"
            >
              <Award className="w-5 h-5 text-white/70" />
              <div className="text-2xl font-bold mt-2">¥{myRanking.performance.toLocaleString()}</div>
              <div className="text-xs text-white/70 mt-1">当前业绩</div>
            </div>
            <div
              onClick={() => openModal('performance_detail', { type: 'growth' })}
              className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition"
            >
              <TrendingUp className="w-5 h-5 text-white/70" />
              <div className="text-2xl font-bold mt-2">+23.5%</div>
              <div className="text-xs text-white/70 mt-1">环比增长</div>
            </div>
            <div
              onClick={() => openModal('performance_detail', { type: 'customers' })}
              className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition"
            >
              <Users className="w-5 h-5 text-white/70" />
              <div className="text-2xl font-bold mt-2">186</div>
              <div className="text-xs text-white/70 mt-1">客户总数</div>
            </div>
            <div
              onClick={() => openModal('performance_detail', { type: 'team' })}
              className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition"
            >
              <Star className="w-5 h-5 text-white/70" />
              <div className="text-2xl font-bold mt-2">3</div>
              <div className="text-xs text-white/70 mt-1">团队成员</div>
            </div>
          </div>
        </div>
      </div>

      {/* 周期切换 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200 inline-flex">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPeriod(p.key)
                addToast({ type: 'info', title: '切换排行周期', description: `已切换至${p.label}排行榜` })
              }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                period === p.key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === c
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">全国业绩排行榜 TOP 100</h3>
          <span className="text-xs text-slate-500">
            数据更新于 {new Date().toLocaleString('zh-CN')}
          </span>
        </div>

        {/* 前三名 */}
        <div className="px-6 py-8 bg-gradient-to-b from-slate-50 to-white">
          <div className="grid gap-4 md:grid-cols-3 items-end">
            {/* 第二名 */}
            <div className="order-1 md:order-1">
              <div
                onClick={() => openModal('performance_detail', { type: 'team', name: rankings[1].name, id: rankings[1].id })}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center relative hover:shadow-lg transition cursor-pointer"
              >                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/50">
                    <Medal className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {rankings[1].avatar}
                </div>
                <div className="mt-3 font-bold text-slate-800 text-lg">{rankings[1].name}</div>
                <div className="text-xs text-slate-500">{rankings[1].region}</div>
                <div className="mt-3 text-2xl font-black text-slate-800">
                  ¥{(rankings[1].performance / 10000).toFixed(1)}万
                </div>
                <div className="text-xs text-emerald-600 mt-1">{rankings[1].growth}</div>
              </div>
            </div>

            {/* 第一名 */}
            <div className="order-0 md:order-2 md:-mt-6">
              <div
                onClick={() => openModal('performance_detail', { type: 'team', name: rankings[0].name, id: rankings[0].id })}
                className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 text-center relative hover:shadow-xl transition cursor-pointer"
              >                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/50 ring-4 ring-white">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="mt-6 w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-amber-200">
                  {rankings[0].avatar}
                </div>
                <div className="mt-3 font-bold text-slate-800 text-xl">{rankings[0].name}</div>
                <div className="text-sm text-slate-500">{rankings[0].region}</div>
                <div className="mt-3 text-3xl font-black text-amber-600">
                  ¥{(rankings[0].performance / 10000).toFixed(1)}万
                </div>
                <div className="text-sm text-emerald-600 mt-1 font-medium">{rankings[0].growth}</div>
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  <Users className="w-3 h-3" />
                  团队 {rankings[0].team} 人
                </div>
              </div>
            </div>

            {/* 第三名 */}
            <div className="order-2 md:order-3">
              <div
                onClick={() => openModal('performance_detail', { type: 'team', name: rankings[2].name, id: rankings[2].id })}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center relative hover:shadow-lg transition cursor-pointer"
              >                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/50">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {rankings[2].avatar}
                </div>
                <div className="mt-3 font-bold text-slate-800 text-lg">{rankings[2].name}</div>
                <div className="text-xs text-slate-500">{rankings[2].region}</div>
                <div className="mt-3 text-2xl font-black text-slate-800">
                  ¥{(rankings[2].performance / 10000).toFixed(1)}万
                </div>
                <div className="text-xs text-emerald-600 mt-1">{rankings[2].growth}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4名及以后 */}
        <div className="divide-y divide-slate-100">
          {rankings.slice(3).map((r) => {
            const style = rankStyle(r.rank)
            const RankIcon = style.icon
            return (
              <div
                key={r.id}
                onClick={() => {
                  addToast({ type: 'info', title: '查看业绩详情', description: `正在加载 ${r.name} 的业绩数据...` })
                  openModal('performance_detail', { type: 'team', name: r.name, id: r.id })
                }}
                className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition cursor-pointer ${
                  r.isMe ? 'bg-gradient-to-r from-violet-50 to-indigo-50' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center ${
                    style.shadow ? `shadow-md ${style.shadow}` : ''
                  }`}
                >
                  {r.rank <= 3 ? (
                    <RankIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{r.rank}</span>
                  )}
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-bold text-lg">
                  {r.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{r.name}</span>
                    {r.isMe && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-500 text-white rounded-full">
                        我
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">{r.id}</span>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                    <span>{r.region}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      团队 {r.team} 人
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-800">
                    ¥{r.performance.toLocaleString()}
                  </div>
                  <div className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {r.growth}
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 text-center">
          <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            查看完整排行榜 TOP 100
          </button>
        </div>
      </div>
    </div>
  )
}
