import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Package, Monitor, Wrench, Coins, DollarSign, Clock, Eye, TrendingUp,
  MapPin, Camera, Timer, Check, X, Star, ChevronLeft, Send, Shield, User
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/task'

const categoryConfig = {
  physical: { icon: Package, label: '实物交付', bg: 'bg-blue-500/20', color: 'text-blue-400' },
  online: { icon: Monitor, label: '线上代办', bg: 'bg-purple-500/20', color: 'text-purple-400' },
  skill: { icon: Wrench, label: '技能支援', bg: 'bg-amber-primary/20', color: 'text-amber-primary' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: '待接单', color: 'bg-emerald-primary/20 text-emerald-primary' },
  in_progress: { label: '进行中', color: 'bg-blue-500/20 text-blue-400' },
  verifying: { label: '验证中', color: 'bg-purple-500/20 text-purple-400' },
  completed: { label: '已完成', color: 'bg-green-500/20 text-green-400' },
  disputed: { label: '争议中', color: 'bg-amber-primary/20 text-amber-primary' },
  cancelled: { label: '已取消', color: 'bg-cyber-dim/20 text-cyber-dim' },
}

const creditLevelConfig: Record<string, { color: string; bg: string; sparkle?: boolean }> = {
  bronze: { color: 'text-gray-400', bg: 'bg-navy-600' },
  silver: { color: 'text-gray-300', bg: 'bg-navy-600' },
  gold: { color: 'text-amber-primary', bg: 'bg-amber-primary/20' },
  diamond: { color: 'text-emerald-primary', bg: 'bg-emerald-primary/20', sparkle: true },
}

interface Evidence {
  type: 'photo' | 'location' | 'timestamp'
  data: string
  time: string
}

const evIconMap = { photo: Camera, location: MapPin, timestamp: Timer }

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, login } = useAuthStore()
  const { currentTask: task, loading, fetchTaskById, acceptTask, completeTask, rateTask, verifyTask } = useTaskStore()

  const [showConfirm, setShowConfirm] = useState(false)
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [evUrl, setEvUrl] = useState('')
  const [evAddr, setEvAddr] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [verifyComment, setVerifyComment] = useState('')

  useEffect(() => {
    if (id) fetchTaskById(id)
  }, [id])

  if (loading || !task) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="text-cyber-dim animate-pulse">加载中...</div>
    </div>
  )

  const cat = categoryConfig[task.category] || categoryConfig.physical
  const CatIcon = cat.icon
  const status = statusConfig[task.status] || statusConfig.open
  const BountyIcon = task.bounty_type === 'coins' ? Coins : DollarSign
  const creditCfg = creditLevelConfig[task.publisher_credit_level] || creditLevelConfig.bronze
  const isPublisher = user?.id === task.publisher_id
  const isAssignee = user?.id === task.assignee_id
  const isVerifier = user?.is_verifier
  const showEvidence = ['in_progress', 'verifying', 'completed', 'disputed'].includes(task.status)
  const canAccept = task.status === 'open'

  const handleAccept = async () => {
    if (!id) return
    if (isPublisher) {
      await login('13800000002', '123456')
    }
    const ok = await acceptTask(id)
    if (ok) { setShowConfirm(false); fetchTaskById(id) }
  }

  const submitEvidence = async () => {
    if (!id) return
    const items: Evidence[] = []
    if (evUrl) items.push({ type: 'photo', data: evUrl, time: new Date().toLocaleString('zh-CN') })
    if (evAddr) items.push({ type: 'location', data: evAddr, time: new Date().toLocaleString('zh-CN') })
    if (items.length === 0) {
      items.push(
        { type: 'photo', data: 'https://example.com/evidence/demo-complete.jpg', time: new Date().toLocaleString('zh-CN') },
        { type: 'location', data: '现场定位已确认', time: new Date().toLocaleString('zh-CN') },
      )
    }
    if (items.length) {
      const ok = await completeTask(id, items.map(({ type, data }) => ({ type, data })))
      if (ok) {
        setEvidenceList([...evidenceList, ...items])
        setEvUrl('')
        setEvAddr('')
        fetchTaskById(id)
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 pb-8">
      <div className="mx-auto max-w-4xl p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-cyber-muted hover:text-emerald-primary mb-4">
          <ChevronLeft className="w-4 h-4" />返回
        </button>

        <div className="card-dark p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold font-heading text-cyber-text truncate">{task.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge ${cat.bg} ${cat.color} flex items-center gap-1`}><CatIcon className="w-3 h-3" />{cat.label}</span>
                <span className={`badge ${status.color}`}>{status.label}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <BountyIcon className={`w-5 h-5 ${task.bounty_type === 'coins' ? 'text-amber-primary' : 'text-emerald-primary'}`} />
                <span className={`text-2xl font-bold ${task.bounty_type === 'coins' ? 'text-amber-primary' : 'text-emerald-primary'}`}>
                  {task.bounty_amount}
                </span>
              </div>
              <span className="text-xs text-cyber-dim">{task.bounty_type === 'coins' ? '助利币' : '元'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-cyber-dim">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(task.deadline).toLocaleDateString('zh-CN')}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{task.view_count}</span>
            {task.exposure_weight > 1 && (
              <span className="flex items-center gap-1 text-amber-primary"><TrendingUp className="w-3.5 h-3.5" />×{task.exposure_weight}</span>
            )}
          </div>
        </div>

        <div className="card-dark p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center text-cyber-text font-bold text-lg">
            {task.publisher_nickname?.[0] || <User className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-cyber-text font-medium truncate">{task.publisher_nickname}</span>
              {task.publisher_credit_level && (
                <span className={`badge text-[10px] ${creditCfg.bg} ${creditCfg.color}`}>
                  {creditCfg.sparkle ? `✦ ${task.publisher_credit_level}` : task.publisher_credit_level}
                </span>
              )}
            </div>
            <span className="text-xs text-cyber-dim">信用分: {task.publisher_credit_level}</span>
          </div>
          <button className="text-emerald-primary text-sm hover:underline shrink-0">查看主页</button>
        </div>

        <div className="card-dark p-5 mb-4">
          <p className="text-cyber-muted leading-relaxed whitespace-pre-wrap">{task.description}</p>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {task.tags.map((tag) => <span key={tag} className="badge bg-emerald-primary/15 text-emerald-primary">{tag}</span>)}
            </div>
          )}
          {task.geo_fence && Object.keys(task.geo_fence).length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-cyber-dim text-sm">
              <MapPin className="w-3.5 h-3.5 text-emerald-primary shrink-0" />
              <span>{(task.geo_fence as { address?: string }).address || '地理围栏限制'}</span>
            </div>
          )}
          {task.verify_rules.length > 0 && (
            <div className="mt-3 space-y-1">
              {task.verify_rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-cyber-muted">
                  <Check className="w-3.5 h-3.5 text-emerald-primary shrink-0" />{rule}
                </div>
              ))}
            </div>
          )}
        </div>

        {showEvidence && (
          <div className="card-dark p-5 mb-4">
            <h3 className="text-cyber-text font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-primary" />证据链
            </h3>
            {evidenceList.length > 0 && (
              <div className="space-y-2 mb-4">
                {evidenceList.map((ev, i) => {
                  const EvIcon = evIconMap[ev.type]
                  return (
                    <div key={i} className="flex items-center gap-2 bg-navy-800 rounded-lg p-2.5">
                      <EvIcon className="w-4 h-4 text-emerald-primary shrink-0" />
                      <span className="text-sm text-cyber-muted flex-1 truncate">{ev.data}</span>
                      <span className="text-xs text-cyber-dim shrink-0">{ev.time}</span>
                    </div>
                  )
                })}
              </div>
            )}
            {isAssignee && task.status === 'in_progress' && (
              <div className="space-y-2 border-t border-navy-600 pt-3">
                <input className="input-dark" placeholder="图片证据 URL" value={evUrl} onChange={(e) => setEvUrl(e.target.value)} />
                <input className="input-dark" placeholder="位置证据地址" value={evAddr} onChange={(e) => setEvAddr(e.target.value)} />
                <button className="btn-primary flex items-center gap-1" onClick={submitEvidence}>
                  <Send className="w-3.5 h-3.5" />提交证据
                </button>
              </div>
            )}
          </div>
        )}

        {canAccept && (
          <div className="card-dark p-5 mb-4 text-center">
            <button className="btn-primary text-lg px-8 py-2.5" onClick={() => setShowConfirm(true)}>
              {isPublisher ? '切换为承接人并接单' : '接单'}
            </button>
          </div>
        )}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowConfirm(false)}>
            <div className="card-dark p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-cyber-text mb-4">
                {isPublisher ? '当前为发布者账号，演示流程将切换为承接人账号后接单。' : '确认接单？您将承诺按时完成此任务，信用值将受到影响。'}
              </p>
              <div className="flex gap-3 justify-end">
                <button className="btn-secondary" onClick={() => setShowConfirm(false)}>取消</button>
                <button className="btn-primary" onClick={handleAccept}>确认</button>
              </div>
            </div>
          </div>
        )}

        {task.status === 'completed' && (
          <div className="card-dark p-5 mb-4">
            <h3 className="text-cyber-text font-semibold mb-3">评价与验证</h3>
            <div className="flex items-center gap-6 mb-4">
              <div>
                <p className="text-xs text-cyber-dim mb-1">发布者评分</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'fill-amber-primary text-amber-primary' : 'text-navy-600'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-cyber-dim mb-1">验证者投票</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-emerald-primary"><Check className="w-3.5 h-3.5" />3</span>
                  <span className="flex items-center gap-1 text-danger"><X className="w-3.5 h-3.5" />0</span>
                </div>
              </div>
            </div>
            <div className="border-t border-navy-600 pt-3 space-y-2">
              <p className="text-sm text-cyber-muted">提交评分</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s}
                    className={`w-5 h-5 cursor-pointer transition-colors ${(hoverRating || rating) >= s ? 'fill-amber-primary text-amber-primary' : 'text-navy-600'}`}
                    onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}
                  />
                ))}
              </div>
              <textarea className="input-dark min-h-[60px]" placeholder="评价内容..." value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
              <button className="btn-primary" onClick={() => id && rateTask(id, { rating, comment: ratingComment, type: 'publisher' })}>提交评分</button>
            </div>
            {isVerifier && (
              <div className="border-t border-navy-600 pt-3 mt-3 space-y-2">
                <p className="text-sm text-cyber-muted">验证投票</p>
                <textarea className="input-dark min-h-[60px]" placeholder="验证意见..." value={verifyComment} onChange={(e) => setVerifyComment(e.target.value)} />
                <div className="flex gap-2">
                  <button className="btn-primary flex items-center gap-1" onClick={() => id && verifyTask(id, { approved: true, comment: verifyComment })}>
                    <Check className="w-3.5 h-3.5" />通过
                  </button>
                  <button className="btn-secondary flex items-center gap-1 !text-danger !border-danger/50" onClick={() => id && verifyTask(id, { approved: false, comment: verifyComment })}>
                    <X className="w-3.5 h-3.5" />驳回
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
