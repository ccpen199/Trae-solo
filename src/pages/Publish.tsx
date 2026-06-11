import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Monitor, Wrench, Plus, Minus, Check, Send,
  Camera, Navigation, Timer, ArrowRight, Tag, FileText,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/task'

const categoryOptions = [
  { value: 'physical' as const, label: '实物交付', icon: Package, desc: '需要实物交付的任务', bg: 'bg-blue-500/20', color: 'text-blue-400', border: 'border-blue-500' },
  { value: 'online' as const, label: '线上代办', icon: Monitor, desc: '可远程完成的任务', bg: 'bg-purple-500/20', color: 'text-purple-400', border: 'border-purple-500' },
  { value: 'skill' as const, label: '技能支援', icon: Wrench, desc: '需要专业技能的任务', bg: 'bg-amber-primary/20', color: 'text-amber-primary', border: 'border-amber-primary' },
]

const verifyOptions = [
  { value: 'photo', label: '照片验证', icon: Camera },
  { value: 'location', label: '定位确认', icon: Navigation },
  { value: 'timestamp', label: '时间戳', icon: Timer },
]

const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些', '么', '什么', '吗', '吧', '呢', '啊', '哦', '哈', '嗯', '呀', '啦', '唉', '帮', '需', '需要', '帮忙'])

function extractTags(text: string): string[] {
  const words = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !stopWords.has(w))
  const freq = new Map<string, number>()
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1))
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w)
}

export default function Publish() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { createTask } = useTaskStore()

  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'physical' | 'online' | 'skill'>('physical')
  const [bountyType, setBountyType] = useState<'coins' | 'cash'>('coins')
  const [bountyAmount, setBountyAmount] = useState(10)
  const [deadline, setDeadline] = useState('')
  const [address, setAddress] = useState('')
  const [verifyRules, setVerifyRules] = useState<string[]>([])
  const [customRule, setCustomRule] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdTaskId, setCreatedTaskId] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/')
  }, [isAuthenticated])

  const autoTags = useMemo(() => extractTags(title + ' ' + description), [title, description])

  const toggleVerify = (value: string) => {
    setVerifyRules((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value])
  }

  const addCustomRule = () => {
    const trimmed = customRule.trim()
    if (trimmed && !verifyRules.includes(trimmed)) {
      setVerifyRules((prev) => [...prev, trimmed])
      setCustomRule('')
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const result = await createTask({
      title,
      description,
      category,
      tags: autoTags,
      bounty_type: bountyType,
      bounty_amount: bountyAmount,
      deadline,
      geo_fence: address ? { address } : {},
      verify_rules: verifyRules,
    })
    setSubmitting(false)
    if (result) {
      setCreatedTaskId(result.id)
      setShowSuccess(true)
    }
  }

  const canProceedStep1 = title.trim().length > 0 && description.trim().length > 0
  const canSubmit = canProceedStep1 && deadline && bountyAmount > 0

  return (
    <div className="min-h-screen bg-navy-900 py-6">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 rounded bg-navy-700">
            <div className="h-full rounded bg-emerald-primary transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
        </div>
        <div className="flex gap-4 mb-6">
          {[{ n: 1, label: '基础信息' }, { n: 2, label: '高级选项' }].map((s) => (
            <div key={s.n} className={`flex items-center gap-2 ${step >= s.n ? 'text-emerald-primary' : 'text-cyber-dim'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s.n ? 'bg-emerald-primary text-navy-900' : step === s.n ? 'bg-emerald-primary/20 text-emerald-primary border border-emerald-primary' : 'bg-navy-700 text-cyber-dim'
              }`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />任务标题
              </label>
              <input className="input-dark" maxLength={50} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入任务标题" />
              <div className="text-right text-xs text-cyber-dim mt-1">{title.length}/50</div>
            </div>

            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">任务描述</label>
              <textarea className="input-dark resize-none" rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="详细描述任务内容..." />
              <div className="text-right text-xs text-cyber-dim mt-1">{description.length}/500</div>
            </div>

            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">任务类型</label>
              <div className="grid grid-cols-3 gap-2">
                {categoryOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button key={opt.value} className={`p-3 rounded-lg border text-center transition-all ${
                      category === opt.value ? `${opt.border} ${opt.bg}` : 'border-navy-600 bg-navy-800 hover:bg-navy-700'
                    }`} onClick={() => setCategory(opt.value)}>
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${category === opt.value ? opt.color : 'text-cyber-dim'}`} />
                      <div className={`text-sm font-medium ${category === opt.value ? opt.color : 'text-cyber-muted'}`}>{opt.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {autoTags.length > 0 && (
              <div>
                <label className="block text-cyber-muted text-sm mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />自动标签
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {autoTags.map((tag) => (
                    <span key={tag} className="badge bg-emerald-primary/15 text-emerald-primary animate-fade-in">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary w-full flex items-center justify-center gap-2 mt-4" disabled={!canProceedStep1} onClick={() => setStep(2)}>
              下一步 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">悬赏</label>
              <div className="flex gap-2 mb-2">
                {(['coins', 'cash'] as const).map((t) => (
                  <button key={t} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    bountyType === t ? 'bg-amber-primary/20 text-amber-primary border border-amber-primary' : 'bg-navy-700 text-cyber-muted border border-navy-600'
                  }`} onClick={() => setBountyType(t)}>
                    {t === 'coins' ? '助利币' : '现金'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center text-cyber-muted hover:bg-navy-600" onClick={() => setBountyAmount(Math.max(1, bountyAmount - 10))}>
                  <Minus className="w-4 h-4" />
                </button>
                <input type="number" className="input-dark text-center flex-1" value={bountyAmount} onChange={(e) => setBountyAmount(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
                <button className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center text-cyber-muted hover:bg-navy-600" onClick={() => setBountyAmount(bountyAmount + 10)}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">截止时间</label>
              <input type="datetime-local" className="input-dark" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>

            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">任务地点</label>
              <input className="input-dark" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="输入任务地点" />
            </div>

            <div>
              <label className="block text-cyber-muted text-sm mb-1.5">验证规则</label>
              <div className="space-y-2">
                {verifyOptions.map((opt) => {
                  const Icon = opt.icon
                  const checked = verifyRules.includes(opt.value)
                  return (
                    <button key={opt.value} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      checked ? 'border-emerald-primary bg-emerald-primary/10' : 'border-navy-600 bg-navy-800'
                    }`} onClick={() => toggleVerify(opt.value)}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        checked ? 'bg-emerald-primary border-emerald-primary' : 'border-navy-500'
                      }`}>
                        {checked && <Check className="w-3 h-3 text-navy-900" />}
                      </div>
                      <Icon className={`w-4 h-4 ${checked ? 'text-emerald-primary' : 'text-cyber-dim'}`} />
                      <span className={`text-sm ${checked ? 'text-cyber-text' : 'text-cyber-muted'}`}>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <input className="input-dark flex-1" value={customRule} onChange={(e) => setCustomRule(e.target.value)} placeholder="自定义规则" onKeyDown={(e) => e.key === 'Enter' && addCustomRule()} />
                <button className="btn-secondary px-3" onClick={addCustomRule}><Plus className="w-4 h-4" /></button>
              </div>
              {verifyRules.filter((r) => !['photo', 'location', 'timestamp'].includes(r)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {verifyRules.filter((r) => !['photo', 'location', 'timestamp'].includes(r)).map((r) => (
                    <span key={r} className="badge bg-amber-primary/15 text-amber-primary">{r}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>返回修改</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                <Send className="w-4 h-4" />{submitting ? '发布中...' : '发布任务'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSuccess(false)}>
          <div className="glass p-8 max-w-sm w-full mx-4 text-center glow-primary" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-emerald-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-primary" />
            </div>
            <h3 className="text-xl font-bold text-cyber-text mb-2">发布成功</h3>
            <p className="text-cyber-muted text-sm mb-6">你的任务已成功发布到互助链市场</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => { setShowSuccess(false); navigate('/') }}>返回首页</button>
              <button className="btn-primary flex-1" onClick={() => navigate(`/task/${createdTaskId}`)}>查看任务</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
