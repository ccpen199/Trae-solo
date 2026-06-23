import * as React from 'react'
import { Check, X, Eye, FileCheck, Heart, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import type { CaseStudy } from '@/types'
import { formatDate } from '@/lib/utils'

const mockPendingCases: CaseStudy[] = [
  {
    id: 'pc1',
    name: '林浩然',
    babyInfo: { gender: '男', birthDate: '2024-05-10' },
    inputSummary: '林姓男宝，喜用神土金，偏好大气风格',
    baziSummary: '甲辰 己巳 己酉 戊辰，日主己土偏旺',
    alternatives: ['林子轩', '林泽宇'],
    finalName: '林浩然',
    explanation: '浩属水，然属金，土金水相生流转。取自"吾善养吾浩然之气"，寓意胸襟开阔、正气凛然。名字音律和谐，朗朗上口。',
    masterId: '4',
    masterName: '张文博',
    isAuthorized: false,
    likes: 0,
    createdAt: '2024-06-18T10:30:00Z',
  },
  {
    id: 'pc2',
    name: '王诗涵',
    babyInfo: { gender: '女', birthDate: '2024-04-22' },
    inputSummary: '王姓女宝，喜用神水木，偏好文雅风格',
    baziSummary: '甲辰 戊辰 壬子 癸卯，日主壬水中和',
    alternatives: ['王雅琴', '王墨兰'],
    finalName: '王诗涵',
    explanation: '诗属金，涵属水，金水相生。取自"诗中有画，涵咏古今"，寓意才情出众、学识渊博。',
    masterId: '5',
    masterName: '刘静怡',
    isAuthorized: false,
    likes: 0,
    createdAt: '2024-06-17T14:20:00Z',
  },
  {
    id: 'pc3',
    name: '陈承祖',
    babyInfo: { gender: '男', birthDate: '2024-03-15' },
    inputSummary: '陈姓男宝，"承"字辈，喜用神火土',
    baziSummary: '甲辰 丁卯 丙午 戊戌，日主丙火偏旺',
    alternatives: ['陈承业', '陈承耀'],
    finalName: '陈承祖',
    explanation: '承属金，祖属金，比和相助。承祖之志，继往开来，寓意继承先祖美德，光大家族事业。',
    masterId: '6',
    masterName: '赵永昌',
    isAuthorized: false,
    likes: 0,
    createdAt: '2024-06-16T09:15:00Z',
  },
]

export default function AdminCaseReview() {
  const [cases, setCases] = React.useState<CaseStudy[]>(mockPendingCases)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true)
        const data = await api.admin.listCasesAdmin({ pageSize: 50 })
        if (data && data.items && data.items.length > 0) {
          const pending = data.items.filter((c) => !c.isAuthorized)
          if (pending.length > 0) setCases(pending)
        }
      } catch {
        // 使用 mock 数据
      } finally {
        setLoading(false)
      }
    }
    loadCases()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await api.admin.toggleCaseAuthorization(id)
      setCases((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setCases((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此案例吗？')) return
    try {
      await api.admin.deleteCase(id)
      setCases((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setCases((prev) => prev.filter((c) => c.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-50 mb-1">案例审核</h1>
          <p className="text-sm text-jade-300">审核命名案例，确保内容质量</p>
        </div>
        <Badge variant="cinnabar" className="bg-cinnabar-900/50 text-cinnabar-300 border-cinnabar-700 px-3 py-1">
          待审核 {cases.length} 条
        </Badge>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-jade-900/50 mx-auto mb-4 flex items-center justify-center">
            <FileCheck className="w-8 h-8 text-jade-400" />
          </div>
          <h3 className="font-serif text-lg text-ink-50 mb-2">暂无待审核案例</h3>
          <p className="text-sm text-jade-300">所有案例已审核完毕</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-serif text-2xl text-ink-50">{c.finalName}</h3>
                    <Badge variant="jade" className="bg-jade-900/50 text-jade-300 border-jade-700">
                      {c.babyInfo.gender}宝
                    </Badge>
                    {c.masterName && (
                      <span className="flex items-center gap-1 text-sm text-jade-300">
                        <User className="w-3.5 h-3.5" />
                        {c.masterName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-jade-400 flex items-center gap-3">
                    <span>提交时间：{formatDate(c.createdAt)}</span>
                    <span>·</span>
                    <span>{c.inputSummary}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-jade-300 hover:text-ink-50 hover:bg-jade-800/50"
                    onClick={() => (window.location.href = `/cases/${c.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    预览
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cinnabar-400 hover:text-cinnabar-300 hover:bg-cinnabar-900/30"
                    onClick={() => handleDelete(c.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(c.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    通过
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div className="p-3 rounded-md bg-ink-900/50 border border-jade-900/30">
                  <div className="text-xs text-jade-400 mb-1">宝宝信息</div>
                  <p className="text-sm text-ink-200">{c.inputSummary}</p>
                </div>
                <div className="p-3 rounded-md bg-ink-900/50 border border-jade-900/30">
                  <div className="text-xs text-jade-400 mb-1">八字分析</div>
                  <p className="text-sm text-ink-200">{c.baziSummary}</p>
                </div>
                <div className="p-3 rounded-md bg-ink-900/50 border border-jade-900/30">
                  <div className="text-xs text-jade-400 mb-1">备选方案</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.alternatives.map((alt) => (
                      <Badge key={alt} variant="default" className="bg-ink-700 text-ink-200 border-ink-600">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md bg-jade-900/20 border border-jade-800/30">
                <div className="text-xs text-jade-400 mb-1">命名释义</div>
                <p className="text-sm text-jade-100 leading-relaxed">{c.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
