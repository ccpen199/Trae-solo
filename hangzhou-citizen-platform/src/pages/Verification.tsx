import { useState, useEffect } from 'react'
import { TrainFront, Mountain, School, Shield, CheckCircle, XCircle, ScanLine } from 'lucide-react'
import { verificationRecords } from '../data/mockData'

const statusCards = [
  { icon: TrainFront, title: '地铁闸机核验', count: '2,156万次', rate: 99.2, color: 'blue', bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-500', ring: 'ring-blue-500/20' },
  { icon: Mountain, title: '景区闸机核验', count: '856万次', rate: 98.7, color: 'green', bg: 'bg-green-500', bgLight: 'bg-green-50', text: 'text-green-500', ring: 'ring-green-500/20' },
  { icon: School, title: '校园门禁核验', count: '423万次', rate: 99.5, color: 'purple', bg: 'bg-purple-500', bgLight: 'bg-purple-50', text: 'text-purple-500', ring: 'ring-purple-500/20' },
] as const

const citizenNames = ['张伟', '李芳', '王强', '赵丽', '陈明', '刘洋', '周婷', '吴刚', '孙丽', '郑华']
const verifyTypes = ['地铁闸机', '景区闸机', '校园门禁'] as const
const verifyStages = ['等待扫码...', '核验中...', '核验通过 ✓'] as const

type FilterTab = '全部' | '地铁' | '景区' | '校园'

const filterMap: Record<FilterTab, string[]> = {
  '全部': ['subway', 'scenic', 'campus'],
  '地铁': ['subway'],
  '景区': ['scenic'],
  '校园': ['campus'],
}

const typeLabels: Record<string, string> = { subway: '地铁', scenic: '景区', campus: '校园' }
const typeColors: Record<string, string> = {
  subway: 'bg-blue-100 text-blue-700',
  scenic: 'bg-green-100 text-green-700',
  campus: 'bg-purple-100 text-purple-700',
}

export default function Verification() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('全部')
  const [stage, setStage] = useState<number>(0)
  const [simName, setSimName] = useState('张伟')
  const [simType, setSimType] = useState<string>('地铁闸机')
  const [glow, setGlow] = useState(false)

  useEffect(() => {
    const cycle = () => {
      setStage(0)
      setGlow(false)
      const t1 = setTimeout(() => setStage(1), 1500)
      const t2 = setTimeout(() => {
        setStage(2)
        setGlow(true)
        setSimName(citizenNames[Math.floor(Math.random() * citizenNames.length)])
        setSimType(verifyTypes[Math.floor(Math.random() * verifyTypes.length)])
      }, 3000)
      const t3 = setTimeout(() => setGlow(false), 4500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
    cycle()
    const interval = setInterval(cycle, 5000)
    return () => clearInterval(interval)
  }, [])

  const filtered = verificationRecords.filter((r) =>
    filterMap[activeFilter].includes(r.type)
  )

  const tabs: FilterTab[] = ['全部', '地铁', '景区', '校园']

  return (
    <div className="space-y-6">
      {/* 状态总览卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {statusCards.map((card) => (
          <div key={card.title} className="rounded-xl bg-bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg} text-white`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-secondary">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">{card.count}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-text-secondary">核验成功率</span>
                <span className={`text-sm font-semibold ${card.text}`}>{card.rate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${card.bg} transition-all duration-700`}
                  style={{ width: `${card.rate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 实时核验模拟 */}
      <div className="rounded-xl bg-bg-card p-6 shadow-sm ring-1 ring-border">
        <h2 className="mb-5 text-base font-semibold text-text-primary">实时核验模拟</h2>
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div
            className={`relative flex h-56 w-full max-w-xs flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 md:w-72 ${
              glow ? 'border-green-400 bg-green-50 shadow-[0_0_30px_rgba(82,196,26,0.25)]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-3">
              <rect x="8" y="16" width="64" height="48" rx="6" stroke={glow ? '#52c41a' : '#9ca3af'} strokeWidth="2.5" fill={glow ? '#f0fff0' : '#f9fafb'} />
              <rect x="20" y="16" width="40" height="48" rx="3" stroke={glow ? '#52c41a' : '#9ca3af'} strokeWidth="2" fill={glow ? '#e6ffe6' : '#f3f4f6'} />
              <line x1="40" y1="16" x2="40" y2="64" stroke={glow ? '#52c41a' : '#d1d5db'} strokeWidth="2" strokeDasharray="4 3" />
              {glow && <circle cx="40" cy="40" r="10" fill="#52c41a" fillOpacity="0.2" stroke="#52c41a" strokeWidth="1.5" />}
              {glow && <path d="M36 40L39 43L45 37" stroke="#52c41a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              {!glow && <ScanLine x="24" y="30" width="32" height="20" className="text-gray-300" />}
            </svg>
            <p className={`text-lg font-semibold transition-colors duration-300 ${
              stage === 2 ? 'text-green-600' : stage === 1 ? 'text-hangzhou-blue' : 'text-text-secondary'
            }`}>
              {verifyStages[stage]}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {simName} · {simType}
            </p>
            {stage === 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-hangzhou-blue/20 border-t-hangzhou-blue" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded-lg bg-bg-main p-4">
              <p className="text-xs text-text-secondary">当前模拟市民</p>
              <p className="mt-1 text-base font-semibold text-text-primary">{simName}</p>
            </div>
            <div className="rounded-lg bg-bg-main p-4">
              <p className="text-xs text-text-secondary">核验方式</p>
              <p className="mt-1 text-base font-semibold text-text-primary">{simType}</p>
            </div>
            <div className="rounded-lg bg-bg-main p-4">
              <p className="text-xs text-text-secondary">核验状态</p>
              <p className={`mt-1 text-base font-semibold ${stage === 2 ? 'text-success' : stage === 1 ? 'text-hangzhou-blue' : 'text-text-secondary'}`}>
                {verifyStages[stage]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 核验记录表 */}
      <div className="rounded-xl bg-bg-card p-6 shadow-sm ring-1 ring-border">
        <h2 className="mb-4 text-base font-semibold text-text-primary">核验记录</h2>

        <div className="mb-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab
                  ? 'bg-primary text-white'
                  : 'bg-bg-main text-text-secondary hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-3 text-left font-medium">序号</th>
                <th className="py-3 text-left font-medium">核验时间</th>
                <th className="py-3 text-left font-medium">市民姓名</th>
                <th className="py-3 text-left font-medium">核验地点</th>
                <th className="py-3 text-left font-medium">核验类型</th>
                <th className="py-3 text-left font-medium">核验状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, idx) => (
                <tr key={record.id} className={`border-b border-border/50 ${idx % 2 === 1 ? 'bg-gray-50/60' : ''}`}>
                  <td className="py-3 text-text-secondary">{idx + 1}</td>
                  <td className="py-3 text-text-primary">{record.time}</td>
                  <td className="py-3 text-text-primary">{record.citizenName}</td>
                  <td className="py-3 text-text-primary">{record.location}</td>
                  <td className="py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${typeColors[record.type]}`}>
                      {typeLabels[record.type]}
                    </span>
                  </td>
                  <td className="py-3">
                    {record.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
                        <CheckCircle className="h-3.5 w-3.5" />成功
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-danger">
                        <XCircle className="h-3.5 w-3.5" />失败
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-text-secondary">共 {filtered.length} 条记录</p>
      </div>

      {/* 合规声明 */}
      <div className="rounded-xl bg-bg-card p-5 shadow-sm ring-1 ring-border">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hangzhou-blue/10">
            <Shield className="h-5 w-5 text-hangzhou-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">核验协议合规声明</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              所有核验接口调用均遵循《杭州市公共数据开放条例》，数据采集遵循最小必要原则，核验记录保留期限为90天。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
