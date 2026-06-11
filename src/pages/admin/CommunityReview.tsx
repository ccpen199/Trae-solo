import { useState, useEffect } from 'react'
import { Shield, Search, Check, X, RotateCcw, MessageCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react'

type PostStatus = 'pending' | 'approved' | 'rejected'

interface Post {
  id: number
  user: string
  avatar: string
  content: string
  topic: string
  time: string
  status: PostStatus
  rejectReason?: string
  riskScore?: number
  aiSuggestion?: string
  similarCount?: number
  appealText?: string
}

const MOCK_POSTS: Post[] = [
  { id: 1, user: '充电侠老王', avatar: '王', content: '国庆从北京开到上海，沿途充电站体验分享。全程1200公里，经过6个服务区充电站，总体体验不错。最满意的是徐州服务区的超充站，4个桩全空闲，30分钟从18%充到85%。最差的是南京江宁服务区，8个桩有3个故障，排队等了40分钟。', topic: '长途出行', time: '2026-06-09 14:23', status: 'pending', riskScore: 12, aiSuggestion: '内容正常，建议通过', similarCount: 3 },
  { id: 2, user: 'EV测评君', avatar: '测', content: '比亚迪汉EV快充实测，30分钟从20%到80%。测试条件：室外温度28°C，使用国家电网120kW直流桩。实测功率曲线前15分钟稳定在98kW左右，之后逐步下降。', topic: '车型讨论', time: '2026-06-09 11:05', status: 'pending', riskScore: 8, aiSuggestion: '内容正常，建议通过', similarCount: 5 },
  { id: 3, user: 'V2G探索者', avatar: '探', content: 'V2G放电月收益居然有300多！上个月参加电网需求响应9次，累计收益327元。电池健康度从98.2%降到97.9%，损耗在可接受范围内。', topic: 'V2G体验', time: '2026-06-08 22:17', status: 'pending', riskScore: 45, aiSuggestion: '包含收益承诺类信息，建议人工审核', similarCount: 2 },
  { id: 4, user: '特斯拉车主会', avatar: '特', content: '从广州到成都自驾游充电攻略：全程1600公里，规划了8个充电站。最推荐贵阳观山湖特斯拉超充，V3桩速度飞快。', topic: '长途出行', time: '2026-06-08 18:42', status: 'pending', riskScore: 15, aiSuggestion: '内容正常，建议通过', similarCount: 4 },
  { id: 5, user: '小鹏G6车主', avatar: '鹏', content: '800V平台充电速度真的绝了！今天在S4超充站实测，5分钟从10%充到50%，最高功率达到285kW。', topic: '充电经验', time: '2026-06-08 15:33', status: 'pending', riskScore: 72, aiSuggestion: '包含广告内容，建议拒绝', similarCount: 8 },
  { id: 6, user: '蔚来换电粉', avatar: '蔚', content: '换电3分钟 vs 超充30分钟，我选换电！今天从杭州到南京，途中在湖州服务区换电站3分钟满电出发。', topic: '充电经验', time: '2026-06-07 20:15', status: 'approved' },
  { id: 7, user: '电车新手小白', avatar: '新', content: '第一次开电车跑高速，差点趴窝！从深圳到汕头，以为续航够就没提前充电。', topic: '长途出行', time: '2026-06-07 16:48', status: 'approved' },
  { id: 8, user: 'V2G深度玩家', avatar: '玩', content: '分享一个V2G赚钱小技巧：关注电网的需求响应通知，夏季傍晚收益最高。', topic: 'V2G体验', time: '2026-06-06 09:22', status: 'rejected', rejectReason: '包含收益承诺类信息，可能误导用户', appealText: '这是我的真实经验分享，并非收益承诺，希望能恢复帖子' },
  { id: 9, user: '充电桩报修侠', avatar: '修', content: '遇到充电桩故障怎么快速报修？分享我的经验：1.拍照记录桩编号和故障代码；2.拨打桩体上的客服电话。', topic: '充电经验', time: '2026-06-05 13:07', status: 'rejected', rejectReason: '内容涉及非平台服务指引，与社区定位不符' },
  { id: 10, user: '理想L7车主', avatar: '理', content: '增程式到底算不算新能源？说说我的看法。纯电续航175km日常通勤完全够用，长途有油不焦虑。', topic: '车型讨论', time: '2026-06-04 21:30', status: 'pending', riskScore: 20, aiSuggestion: '内容正常，建议通过', similarCount: 6 },
]

const TOPIC_COLORS: Record<string, string> = {
  '充电经验': 'bg-ice-blue/15 text-ice-blue border-ice-blue/30',
  '长途出行': 'bg-electric-green/15 text-electric-green border-electric-green/30',
  '车型讨论': 'bg-amber-orange/15 text-amber-orange border-amber-orange/30',
  'V2G体验': 'bg-purple-400/15 text-purple-400 border-purple-400/30',
}
const PRESET_REASONS = ['违规广告', '不实信息', '敏感内容', '其他']

function riskColor(score: number) {
  if (score >= 60) return 'text-red-400'
  if (score >= 30) return 'text-amber-orange'
  return 'text-electric-green'
}
function riskBar(score: number) {
  if (score >= 60) return 'bg-red-400'
  if (score >= 30) return 'bg-amber-orange'
  return 'bg-electric-green'
}

export default function CommunityReview() {
  const [activeTab, setActiveTab] = useState<PostStatus>('pending')
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectPreset, setRejectPreset] = useState('')
  const [viewPost, setViewPost] = useState<Post | null>(null)
  const [detailExpand, setDetailExpand] = useState<number | null>(null)
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/admin/community/reviews').then(res => res.json()).then(data => setPosts(data)).catch(() => setPosts(MOCK_POSTS))
  }, [])

  const counts = {
    pending: posts.filter(p => p.status === 'pending').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
  }
  const total = counts.pending + counts.approved + counts.rejected
  const todayReviewed = 12
  const passRate = total > 0 ? Math.round((counts.approved / total) * 100) : 0

  const filtered = posts.filter(p => {
    const matchTab = p.status === activeTab
    const matchSearch = !search || p.content.includes(search) || p.user.includes(search) || p.topic.includes(search)
    return matchTab && matchSearch
  })

  const updateStatus = (id: number, status: PostStatus, rejectReason?: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status, rejectReason } : p))
  }

  const handleReject = () => {
    if (rejectId == null) return
    const reason = rejectPreset === '其他' ? rejectReason : (rejectPreset || rejectReason)
    if (!reason.trim()) return
    updateStatus(rejectId, 'rejected', reason)
    setRejectId(null); setRejectReason(''); setRejectPreset('')
  }

  const toggleSelect = (id: number) => {
    setSelectedPosts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const batchApprove = () => {
    selectedPosts.forEach(id => updateStatus(id, 'approved'))
    setSelectedPosts(new Set())
  }

  const batchReject = () => {
    selectedPosts.forEach(id => updateStatus(id, 'rejected', '批量拒绝'))
    setSelectedPosts(new Set())
  }

  const tabs: { key: PostStatus; label: string; color: string }[] = [
    { key: 'pending', label: '待审核', color: 'bg-red-500' },
    { key: 'approved', label: '已通过', color: 'bg-electric-green' },
    { key: 'rejected', label: '已拒绝', color: 'bg-amber-orange' },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="section-title flex items-center gap-2"><Shield className="w-5 h-5 text-amber-orange" />社区内容审核</h2>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: '今日审核', value: `${todayReviewed} 篇`, color: 'text-ice-blue' }, { label: '通过率', value: `${passRate}%`, color: 'text-electric-green' }, { label: '平均审核时长', value: '8 分钟', color: 'text-amber-orange' }].map(s => (
          <div key={s.label} className="stat-card"><div className="text-xs text-gray-400 mb-1">{s.label}</div><div className={`data-text text-lg font-bold ${s.color}`}>{s.value}</div></div>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-deep-blue-light/60 rounded-lg p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedPosts(new Set()) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-deep-blue-lighter text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              {tab.label}<span className={`${tab.color} text-white text-xs px-1.5 py-0.5 rounded-full data-text`}>{counts[tab.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户、内容或话题..." className="input-field w-full pl-9" />
        </div>
        {activeTab === 'pending' && selectedPosts.size > 0 && (
          <div className="flex gap-2">
            <button onClick={batchApprove} className="btn-primary flex items-center gap-1 text-xs"><Check className="w-3.5 h-3.5" />批量通过 ({selectedPosts.size})</button>
            <button onClick={batchReject} className="btn-danger flex items-center gap-1 text-xs"><X className="w-3.5 h-3.5" />批量拒绝</button>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-8 text-center text-gray-500"><MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />暂无{tabs.find(t => t.key === activeTab)?.label}内容</div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {filtered.map(post => (
            <div key={post.id} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSelect(post.id)} className="flex-shrink-0">
                    {selectedPosts.has(post.id) ? <div className="w-5 h-5 rounded border-2 border-electric-green bg-electric-green/20 flex items-center justify-center"><Check className="w-3 h-3 text-electric-green" /></div>
                      : <div className="w-5 h-5 rounded border-2 border-white/20" />}
                  </button>
                  <div className="w-10 h-10 rounded-full bg-electric-green/20 text-electric-green flex items-center justify-center text-sm font-semibold border border-electric-green/30">{post.avatar}</div>
                  <div><p className="text-sm font-medium text-gray-100">{post.user}</p><p className="text-xs text-gray-500">{post.time}</p></div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${TOPIC_COLORS[post.topic] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>{post.topic}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{post.content}</p>
              <button onClick={() => setDetailExpand(detailExpand === post.id ? null : post.id)} className="text-ice-blue hover:text-ice-blue/80 text-xs flex items-center gap-1">
                {detailExpand === post.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}审核详情
              </button>
              {detailExpand === post.id && post.riskScore !== undefined && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">内容风险评分</span>
                    <span className={`data-text font-bold ${riskColor(post.riskScore)}`}>{post.riskScore}/100</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${riskBar(post.riskScore)}`} style={{ width: `${post.riskScore}%` }} /></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">AI审核建议：</span>
                    <span className={post.riskScore >= 60 ? 'text-amber-orange' : 'text-electric-green'}>{post.aiSuggestion}</span>
                  </div>
                  <div className="text-gray-400">相似帖子数量：<span className="data-text text-ice-blue">{post.similarCount}</span></div>
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button onClick={() => setConfirmId(post.id)} className="btn-primary flex items-center gap-1.5 text-sm"><Check className="w-4 h-4" /> 通过</button>
                <button onClick={() => { setRejectId(post.id); setRejectReason(''); setRejectPreset('') }} className="btn-danger flex items-center gap-1.5 text-sm"><X className="w-4 h-4" /> 拒绝</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(post => (
            <div key={post.id} className="glass-card p-4 space-y-3 hover:border-electric-green/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-electric-green/20 text-electric-green flex items-center justify-center text-xs font-semibold border border-electric-green/30">{post.avatar}</div>
                  <span className="text-sm text-gray-200">{post.user}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${TOPIC_COLORS[post.topic] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>{post.topic}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{post.content}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">{post.time}</p>
                <button onClick={() => setViewPost(post)} className="text-electric-green hover:text-electric-green/80 text-xs flex items-center gap-1"><Eye className="w-3.5 h-3.5" />查看原文</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rejected' && (
        <div className="space-y-4">
          {filtered.map(post => (
            <div key={post.id} className="glass-card p-5 space-y-4 border-amber-orange/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-orange/20 text-amber-orange flex items-center justify-center text-sm font-semibold border border-amber-orange/30">{post.avatar}</div>
                  <div><p className="text-sm font-medium text-gray-100">{post.user}</p><p className="text-xs text-gray-500">{post.time}</p></div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${TOPIC_COLORS[post.topic] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>{post.topic}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{post.content}</p>
              <div className="bg-amber-orange/5 border border-amber-orange/15 rounded-lg p-3">
                <p className="text-xs text-amber-orange flex items-center gap-1.5"><X className="w-3.5 h-3.5" />拒绝原因：{post.rejectReason || '未说明'}</p>
              </div>
              {post.appealText && (
                <div className="bg-purple-500/5 border border-purple-400/15 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-purple-400 font-medium">用户申诉</p>
                  <p className="text-xs text-gray-300">{post.appealText}</p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { updateStatus(post.id, 'approved') }} className="btn-primary text-xs px-3 py-1">恢复帖子</button>
                    <button onClick={() => { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, appealText: undefined } : p)) }} className="btn-danger text-xs px-3 py-1">维持拒绝</button>
                  </div>
                </div>
              )}
              {!post.appealText && (
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <button onClick={() => updateStatus(post.id, 'approved')} className="btn-secondary flex items-center gap-1.5 text-sm"><RotateCcw className="w-4 h-4" /> 恢复</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmId(null)}>
          <div className="glass-card p-6 w-[360px] space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-gray-100 font-medium text-center">确认通过该帖子？</h3>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setConfirmId(null)} className="btn-secondary text-sm px-6">取消</button>
              <button onClick={() => { updateStatus(confirmId, 'approved'); setConfirmId(null) }} className="btn-primary text-sm px-6">通过</button>
            </div>
          </div>
        </div>
      )}

      {rejectId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectId(null)}>
          <div className="glass-card p-6 w-[420px] space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-gray-100 font-medium">拒绝原因</h3><button onClick={() => setRejectId(null)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button></div>
            <div className="flex flex-wrap gap-2">
              {PRESET_REASONS.map(r => (
                <button key={r} onClick={() => { setRejectPreset(r); if (r !== '其他') setRejectReason('') }}
                  className={`px-3 py-1.5 rounded text-xs border transition-all ${rejectPreset === r ? 'border-amber-orange/50 bg-amber-orange/15 text-amber-orange' : 'border-white/10 text-gray-400 hover:text-gray-200'}`}>
                  {r}
                </button>
              ))}
            </div>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="请输入拒绝原因（必填）..." className="input-field w-full h-20 resize-none" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectId(null)} className="btn-secondary text-sm">取消</button>
              <button onClick={handleReject} disabled={!rejectPreset && !rejectReason.trim()} className={`btn-danger text-sm ${!rejectPreset && !rejectReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>确认拒绝</button>
            </div>
          </div>
        </div>
      )}

      {viewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewPost(null)}>
          <div className="glass-card p-6 w-[560px] max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-electric-green/20 text-electric-green flex items-center justify-center text-sm font-semibold border border-electric-green/30">{viewPost.avatar}</div>
                <div><p className="text-sm font-medium text-gray-100">{viewPost.user}</p><p className="text-xs text-gray-500">{viewPost.time}</p></div>
              </div>
              <button onClick={() => setViewPost(null)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${TOPIC_COLORS[viewPost.topic] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>{viewPost.topic}</span>
            <p className="text-sm text-gray-300 leading-relaxed">{viewPost.content}</p>
          </div>
        </div>
      )}
    </div>
  )
}
