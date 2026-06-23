import * as React from 'react'
import { Check, X, Award, Calendar, FileText, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import type { Master } from '@/types'
import { formatDate } from '@/lib/utils'

const mockPendingMasters: Master[] = [
  {
    id: 'p1',
    name: '张文博',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    title: '申请：资深命名师',
    specialties: ['古典文化', '五行命理'],
    experience: 12,
    introduction: '中文系博士，研究古典文献学十余年，精通诗词曲赋，擅长从经典中汲取命名灵感。',
    certificates: ['博士学位证书', '传统文化培训证书'],
    caseCount: 0,
    rating: 0,
    reviewCount: 0,
    status: 'pending',
  },
  {
    id: 'p2',
    name: '刘静怡',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
    title: '申请：命名师',
    specialties: ['女宝宝命名', '现代风格'],
    experience: 6,
    introduction: '心理学硕士，专注于儿童发展心理学，命名注重名字对孩子心理成长的积极影响。',
    certificates: ['心理咨询师二级', '姓名学培训合格证'],
    caseCount: 0,
    rating: 0,
    reviewCount: 0,
    status: 'pending',
  },
  {
    id: 'p3',
    name: '赵永昌',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
    title: '申请：资深命名师',
    specialties: ['家族字辈', '传统命名'],
    experience: 20,
    introduction: '出身周易世家，家学渊源，深耕传统姓名学二十载，精通八字命理与五格剖象。',
    certificates: ['周易研究会会员', '高级命名师证书'],
    caseCount: 0,
    rating: 0,
    reviewCount: 0,
    status: 'pending',
  },
]

export default function AdminMasterReview() {
  const [masters, setMasters] = React.useState<Master[]>(mockPendingMasters)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const loadMasters = async () => {
      try {
        setLoading(true)
        const data = await api.admin.listMastersAdmin({ status: 'pending', pageSize: 50 })
        if (data && data.items && data.items.length > 0) {
          setMasters(data.items)
        }
      } catch {
        // 使用 mock 数据
      } finally {
        setLoading(false)
      }
    }
    loadMasters()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await api.admin.approveMaster(id)
      setMasters((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setMasters((prev) => prev.filter((m) => m.id !== id))
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝原因：')
    if (!reason) return
    try {
      await api.admin.rejectMaster(id, reason)
      setMasters((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setMasters((prev) => prev.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-50 mb-1">命名师审核</h1>
          <p className="text-sm text-jade-300">审核命名师入驻申请</p>
        </div>
        <Badge variant="cinnabar" className="bg-cinnabar-900/50 text-cinnabar-300 border-cinnabar-700 px-3 py-1">
          待审核 {masters.length} 条
        </Badge>
      </div>

      {masters.length === 0 ? (
        <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-jade-900/50 mx-auto mb-4 flex items-center justify-center">
            <Award className="w-8 h-8 text-jade-400" />
          </div>
          <h3 className="font-serif text-lg text-ink-50 mb-2">暂无待审核申请</h3>
          <p className="text-sm text-jade-300">所有命名师申请已处理完毕</p>
        </div>
      ) : (
        <div className="space-y-4">
          {masters.map((m) => (
            <div
              key={m.id}
              className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-5"
            >
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-jade-700 bg-jade-900 mx-auto sm:mx-0">
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-xl text-ink-50">{m.name}</h3>
                        <Badge variant="default" className="bg-ink-700 text-ink-200 border-ink-600">
                          {m.title}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-jade-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {m.experience} 年从业经验
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {m.certificates.length} 份资质
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-jade-300 hover:text-ink-50 hover:bg-jade-800/50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-cinnabar-400 hover:text-cinnabar-300 hover:bg-cinnabar-900/30"
                        onClick={() => handleReject(m.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        拒绝
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(m.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        通过
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-jade-200 mb-3 leading-relaxed">{m.introduction}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {m.specialties.map((s) => (
                      <Badge key={s} variant="jade" className="bg-jade-900/50 text-jade-300 border-jade-700">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs text-jade-400 mb-1.5">资质证明</div>
                    <div className="flex flex-wrap gap-2">
                      {m.certificates.map((cert) => (
                        <div
                          key={cert}
                          className="px-3 py-1.5 rounded-md bg-ink-900/50 border border-jade-800/50 text-xs text-ink-200 flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-gold-400" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
