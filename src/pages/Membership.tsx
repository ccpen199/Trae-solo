import { useState, useEffect } from 'react'
import {
  Crown, Coins, TrendingUp, TrendingDown, Clock,
  Star, Shield, Headphones, Package, Percent, Gift, MapPin,
  FileText, ArrowRight, CheckCircle, AlertCircle, User, Calendar, Search,
  Tag, Award, Clock as ClockIcon, X,
} from 'lucide-react'
import { useMembershipStore } from '@/store'

const levelColors: Record<string, string> = {
  normal: 'badge-neutral',
  silver: 'badge-info',
  gold: 'badge-warning',
  svip: 'text-amber-900 bg-gradient-to-r from-amber-400 to-amber-500',
}

const levelLabels: Record<string, string> = {
  normal: '普通会员',
  silver: '白银会员',
  gold: '黄金会员',
  svip: 'SVIP会员',
}

const svipSubLevels = ['', '白银SVIP', '黄金SVIP', '钻石SVIP']
const svipSourceLabels: Record<string, string> = {
  purchase: '购买开通', activity: '活动赠送', upgrade: '等级晋升', gift: '礼品卡兑换',
}

const benefitIconMap: Record<string, any> = {
  headphones: Headphones,
  percent: Percent,
  package: Package,
  clock: Clock,
  star: Star,
  shield: Shield,
  gift: Gift,
  'map-pin': MapPin,
}

const exchangeItems = [
  { id: 'e1', name: '运费抵扣券10元', cost: 500, desc: '所有寄送服务通用' },
  { id: 'e2', name: '免费包材券', cost: 200, desc: '标准纸箱/泡沫等包材' },
  { id: 'e3', name: '保价服务券', cost: 300, desc: '最高1000元保价' },
  { id: 'e4', name: 'SVIP体验卡7天', cost: 1000, desc: '畅享全部SVIP权益' },
]

export default function Membership() {
  const { info, fetchInfo, fetchPoints, fetchAuditLogs } = useMembershipStore()
  const [tab, setTab] = useState<'points' | 'svip' | 'audit'>('points')
  const [pointsRecords, setPointsRecords] = useState<any[]>([])
  const [benefits, setBenefits] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditFilter, setAuditFilter] = useState<string>('all')
  const [svipLogs, setSvipLogs] = useState<any[]>([])
  const [svipPage, setSvipPage] = useState(1)
  const [svipTotal, setSvipTotal] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [exchangeResult, setExchangeResult] = useState<any>(null)
  const [exchangeLoadingId, setExchangeLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchInfo()
    fetchPointsData()
    fetchBenefits()
  }, [])

  useEffect(() => {
    if (tab === 'audit') {
      fetchAuditLogsData()
    } else if (tab === 'svip') {
      fetchSvipAuditLogs()
    }
  }, [tab, auditPage, auditFilter, svipPage])

  const fetchPointsData = async () => {
    try {
      const res = await fetch('/api/membership/points')
      const data = await res.json()
      setPointsRecords(data.records ?? data)
    } catch {}
  }

  const fetchBenefits = async () => {
    try {
      const res = await fetch('/api/membership/svip/benefits')
      const data = await res.json()
      setBenefits(data)
    } catch {}
  }

  const fetchAuditLogsData = async () => {
    try {
      const typeParam = auditFilter !== 'all' ? `&type=${auditFilter}` : ''
      const res = await fetch(`/api/membership/audit-logs?page=${auditPage}&limit=10${typeParam}`)
      const data = await res.json()
      setAuditLogs(data.data ?? data)
      setAuditTotal(data.pagination?.total ?? (data.data ?? data).length)
    } catch {}
  }

  const fetchSvipAuditLogs = async () => {
    try {
      const res = await fetch(`/api/membership/svip/audit-logs?page=${svipPage}&limit=5`)
      const data = await res.json()
      setSvipLogs(data.data ?? data)
      setSvipTotal(data.pagination?.total ?? (data.data ?? data).length)
    } catch {}
  }

  const handleExchange = async (item: any) => {
    setExchangeLoadingId(item.id)
    try {
      const res = await fetch('/api/membership/points/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: item.cost, item: item.name }),
      })
      if (res.ok) {
        const data = await res.json()
        setExchangeResult(data)
        fetchInfo()
        fetchPointsData()
        fetchAuditLogsData()
        fetchSvipAuditLogs()
      }
    } catch {}
    setExchangeLoadingId(null)
  }

  const formatDate = (s: string) => s?.replace('T', ' ').slice(0, 16) ?? ''

  const filteredAuditLogs = auditLogs.filter((log: any) => {
    if (!searchKeyword) return true
    const kw = searchKeyword.toLowerCase()
    return log.operator?.toLowerCase().includes(kw)
      || log.actionLabel?.toLowerCase().includes(kw)
      || log.detail?.toLowerCase().includes(kw)
      || log.target?.toLowerCase().includes(kw)
  })

  const progressPercent = info ? Math.min(100, (info.points / 5000) * 100) : 0
  const expiringPoints = 350

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="card relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${
          info?.level === 'svip'
            ? 'from-amber-500/20 via-orange-500/10 to-transparent'
            : 'from-amber-500/10 to-transparent'
        } rounded-full -translate-y-1/2 translate-x-1/2`} />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              info?.level === 'svip'
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-amber-500'
            }`}>
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{info ? levelLabels[info.level] : '加载中...'}</h2>
                {info?.level === 'svip' && info?.svipLevel && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900">
                    {svipSubLevels[info.svipLevel] || `Lv.${info.svipLevel}`}
                  </span>
                )}
                {info && info.level !== 'svip' && (
                  <span className={levelColors[info.level] + ' badge'}>{levelLabels[info.level]}</span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                累计获得 {info?.totalEarned ?? 0} 积分 · 已使用 {info?.totalUsed ?? 0} · 过期 {info?.totalExpired ?? 0}
              </p>
              {info?.level === 'svip' && (
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  {info.svipSource && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Tag className="w-3 h-3" />来源: {svipSourceLabels[info.svipSource] || info.svipSource}
                    </span>
                  )}
                  {info.svipGrantedBy && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Award className="w-3 h-3" />发放: {info.svipGrantedBy}
                    </span>
                  )}
                  {info.svipGrantedAt && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <ClockIcon className="w-3 h-3" />{formatDate(info.svipGrantedAt).slice(0, 10)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="md:ml-auto flex flex-wrap gap-6">
            <div className="text-center">
              <div className="stat-value text-amber-500">{info?.points ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 justify-center">
                积分余额
                {expiringPoints > 0 && (
                  <span className="text-amber-400 animate-pulse">
                    · 即将过期 {expiringPoints}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="stat-value text-emerald-400">{info?.totalEarned ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">累计获得</div>
            </div>
            <div className="text-center">
              <div className="stat-value text-red-400">{info?.totalUsed ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">已使用</div>
            </div>
            {info?.svipExpiry && (
              <div className="text-center">
                <div className="stat-value text-amber-400 text-2xl">
                  {formatDate(info.svipExpiry).slice(0, 10)}
                </div>
                <div className="text-xs text-slate-500 mt-1">SVIP有效期至</div>
              </div>
            )}
          </div>
        </div>
        {info?.level !== 'svip' && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">距离下一级还需 {Math.max(0, 5000 - (info?.points ?? 0))} 积分</span>
              <span className="text-sm text-amber-400 font-mono-num">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-800">
        {[
          { key: 'points', label: '积分管理', icon: Coins },
          { key: 'svip', label: 'SVIP权益', icon: Crown },
          { key: 'audit', label: '审计日志', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'points' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {exchangeItems.map((item) => {
              const isSvip = item.name.includes('SVIP')
              return (
              <div key={item.id} className={`card card-hover flex flex-col ${isSvip ? 'border-amber-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isSvip && <Crown className="w-4 h-4 text-amber-400" />}
                    <h3 className="font-medium">{item.name}</h3>
                  </div>
                  <span className={isSvip ? 'badge-info !bg-gradient-to-r !from-amber-400/20 !to-orange-500/20 !text-amber-400 !border-amber-500/30' : 'badge-warning'}>
                    {item.cost} 积分
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4 flex-1">{item.desc}</p>
                <button
                  onClick={() => handleExchange(item)}
                  disabled={(info?.points ?? 0) < item.cost || exchangeLoadingId === item.id}
                  className={`btn-secondary text-sm w-full ${isSvip ? '!bg-gradient-to-r !from-amber-500/20 !to-orange-500/10 !border-amber-500/30 !text-amber-400 hover:!from-amber-500/30' : ''}`}
                  style={(info?.points ?? 0) < item.cost ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {exchangeLoadingId === item.id ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />兑换中...
                    </span>
                  ) : isSvip ? '立即激活权益' : '立即兑换'}
                </button>
              </div>
            )})}
          </div>

          <div>
            <h3 className="section-title">积分记录</h3>
            <div className="card divide-y divide-slate-800">
              {pointsRecords.length === 0 && (
                <p className="text-slate-500 text-sm py-6 text-center">暂无积分记录</p>
              )}
              {pointsRecords.map((record: any) => (
                <div key={record.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    record.type === 'earn' ? 'bg-emerald-500/10 text-emerald-400' :
                    record.type === 'use' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-700/50 text-slate-500'
                  }`}>
                    {record.type === 'earn' ? <TrendingUp className="w-4 h-4" /> :
                     record.type === 'use' ? <TrendingDown className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{record.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(record.createdAt)}</p>
                  </div>
                  <div className={`font-mono-num font-semibold ${
                    record.type === 'earn' ? 'text-emerald-400' :
                    record.type === 'use' ? 'text-amber-400' :
                    'text-slate-500'
                  }`}>
                    {record.type === 'earn' ? '+' : '-'}{record.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'svip' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((benefit) => {
              const IconComp = benefitIconMap[benefit.icon] || Star
              const isActive = benefit.active
              return (
                <div
                  key={benefit.id}
                  className={`card p-5 ${
                    isActive ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : 'opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{benefit.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{benefit.description}</p>
                  <div className="mt-3">
                    <span className={isActive ? 'badge-success' : 'badge-neutral'}>
                      {isActive ? '已激活' : '未激活'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                权益发放记录
              </h3>
              <button onClick={fetchSvipAuditLogs} className="btn-secondary text-sm px-3 py-1.5">
                刷新
              </button>
            </div>
            <div className="card divide-y divide-slate-800">
              {svipLogs.length === 0 && (
                <p className="text-slate-500 text-sm py-6 text-center">暂无权益发放记录</p>
              )}
              {svipLogs.map((log: any) => (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      log.action === 'svip_grant' || log.action === 'svip_upgrade'
                        ? 'bg-amber-500/20 text-amber-400'
                        : log.action === 'svip_revoke'
                        ? 'bg-red-500/20 text-red-400'
                        : log.action === 'review'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.action === 'svip_revoke' ? <AlertCircle className="w-4 h-4" /> :
                       log.action === 'review' ? <CheckCircle className="w-4 h-4" /> :
                       <Crown className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-info">{log.actionLabel}</span>
                        <span className="text-sm font-medium">{log.target}</span>
                      </div>
                      <div className="text-sm text-slate-400 mb-2">{log.detail}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />发放人: {log.operator}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{formatDate(log.createdAt)}
                        </span>
                      </div>
                      {log.parsed && (
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {log.parsed['变更前'] && (
                            <div className="bg-slate-800/50 rounded px-2 py-1.5">
                              <span className="text-slate-500">变更前: </span>
                              <span className="text-slate-400">{log.parsed['变更前']}</span>
                            </div>
                          )}
                          {log.parsed['变更后'] && (
                            <div className="bg-amber-500/10 rounded px-2 py-1.5">
                              <span className="text-amber-500/70">变更后: </span>
                              <span className="text-amber-400">{log.parsed['变更后']}</span>
                              <ArrowRight className="w-3 h-3 inline ml-1" />
                            </div>
                          )}
                          {log.parsed['原因'] && (
                            <div className="bg-slate-800/50 rounded px-2 py-1.5">
                              <span className="text-slate-500">原因: </span>
                              <span className="text-slate-400">{log.parsed['原因']}</span>
                            </div>
                          )}
                          {log.parsed['审核人'] && (
                            <div className="bg-emerald-500/10 rounded px-2 py-1.5">
                              <span className="text-emerald-500/70">审核: </span>
                              <span className="text-emerald-400">{log.parsed['审核人']}</span>
                            </div>
                          )}
                          {log.parsed['复核人'] && (
                            <div className="bg-blue-500/10 rounded px-2 py-1.5">
                              <span className="text-blue-500/70">复核: </span>
                              <span className="text-blue-400">{log.parsed['复核人']}</span>
                            </div>
                          )}
                          {log.parsed['有效期'] && (
                            <div className="bg-slate-800/50 rounded px-2 py-1.5">
                              <span className="text-slate-500">有效期: </span>
                              <span className="text-slate-400">{log.parsed['有效期']}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {svipTotal > 5 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setSvipPage((p) => Math.max(1, p - 1))}
                  disabled={svipPage === 1}
                  className="btn-secondary text-sm px-3 py-1.5"
                  style={svipPage === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  上一页
                </button>
                <span className="text-sm text-slate-500">
                  第 {svipPage} / {Math.ceil(svipTotal / 5)} 页 · 共 {svipTotal} 条
                </span>
                <button
                  onClick={() => setSvipPage((p) => p + 1)}
                  disabled={svipPage >= Math.ceil(svipTotal / 5)}
                  className="btn-secondary text-sm px-3 py-1.5"
                  style={svipPage >= Math.ceil(svipTotal / 5) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input-field w-full pl-9"
                placeholder="搜索操作人/类型/详情..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'svip', label: 'SVIP相关' },
                { key: 'points', label: '积分相关' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setAuditFilter(f.key); setAuditPage(1) }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    auditFilter === f.key
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">操作类型</th>
                  <th className="pb-3 font-medium">操作人</th>
                  <th className="pb-3 font-medium">操作对象</th>
                  <th className="pb-3 font-medium">详情</th>
                  <th className="pb-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">暂无审计日志</td>
                  </tr>
                )}
                {filteredAuditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <span className={`badge ${
                        log.action.startsWith('svip') ? 'badge-warning' :
                        log.action.startsWith('benefit') ? 'badge-info' :
                        log.action.startsWith('points') ? 'badge-success' :
                        log.action === 'review' ? 'badge-success' :
                        'badge-neutral'
                      }`}>
                        {log.actionLabel}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{log.operator}</td>
                    <td className="py-3 font-mono-num text-xs text-slate-400">{log.target}</td>
                    <td className="py-3 text-slate-500 max-w-xs truncate" title={log.detail}>
                      {log.detail}
                    </td>
                    <td className="py-3 text-slate-500 text-xs font-mono-num whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditTotal > 10 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage === 1}
                className="btn-secondary text-sm px-3 py-1.5"
                style={auditPage === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">
                第 {auditPage} / {Math.ceil(auditTotal / 10)} 页 · 共 {auditTotal} 条
              </span>
              <button
                onClick={() => setAuditPage((p) => p + 1)}
                disabled={auditPage >= Math.ceil(auditTotal / 10)}
                className="btn-secondary text-sm px-3 py-1.5"
                style={auditPage >= Math.ceil(auditTotal / 10) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {exchangeResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setExchangeResult(null)}>
          <div className="card w-full max-w-xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                兑换成功
              </h3>
              <button onClick={() => setExchangeResult(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Gift className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg">{exchangeResult.item}</p>
                <div className="flex flex-wrap gap-3 text-xs mt-1.5 text-slate-400">
                  <span>消耗积分: <b className="text-amber-400 font-mono-num">-{exchangeResult.exchangedPoints}</b></span>
                  <span>剩余积分: <b className="text-emerald-400 font-mono-num">{exchangeResult.remainingPoints}</b></span>
                </div>
              </div>
            </div>

            {exchangeResult.svipGranted && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30">
                  <p className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="text-amber-400 font-semibold">SVIP 权益已发放</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      权益激活
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/60 rounded p-2.5">
                      <p className="text-slate-500 mb-1">SVIP等级</p>
                      <p className="text-slate-200 font-medium">
                        {svipSubLevels[exchangeResult.svipGranted.level] || `Lv.${exchangeResult.svipGranted.level}`}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2.5">
                      <p className="text-slate-500 mb-1">有效期限</p>
                      <p className="text-slate-200 font-medium">{exchangeResult.svipGranted.days} 天</p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2.5">
                      <p className="text-slate-500 mb-1">有效期至</p>
                      <p className="text-slate-200 font-medium font-mono-num">
                        {formatDate(exchangeResult.svipGranted.expiry)}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 rounded p-2.5">
                      <p className="text-slate-500 mb-1">发放人</p>
                      <p className="text-slate-200 font-medium flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        {exchangeResult.svipGranted.grantedBy}
                      </p>
                    </div>
                  </div>
                </div>

                {exchangeResult.reviewLogs && exchangeResult.reviewLogs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      发放复查记录
                    </p>
                    <div className="relative pl-6 space-y-3">
                      {exchangeResult.reviewLogs.map((log: any, i: number) => {
                        const isLast = i === exchangeResult.reviewLogs.length - 1
                        const labelMap: Record<string, string> = {
                          submit: '提交申请', approve: '积分审核', issue: '权益发放', review: '系统复核',
                        }
                        const clsMap: Record<string, string> = {
                          submit: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                          approve: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                          issue: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                          review: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
                        }
                        return (
                          <div key={i} className="relative">
                            <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${isLast ? 'bg-amber-500 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-800 border-slate-600'}`} />
                            {!isLast && <div className="absolute left-[-19px] top-4 w-0.5 h-full bg-slate-700" />}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${clsMap[log.action] || clsMap.submit}`}>
                                {labelMap[log.action] || log.action}
                              </span>
                              <span className="text-xs font-mono-num text-slate-500">{formatDate(log.time)}</span>
                              <span className="text-xs text-slate-400">{log.operator}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{log.note}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-800">
              <button onClick={() => setTab('audit')} className="btn-secondary text-sm flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />查看审计日志
              </button>
              <button onClick={() => setExchangeResult(null)} className="btn-primary text-sm">完成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
