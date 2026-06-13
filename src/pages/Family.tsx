import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Heart, Baby, User, Phone,
  Calendar, ChevronRight, Shield, X,
} from 'lucide-react'
import { mockFamilyMembers, mockServices } from '@/data/mockData'
import { useUserStore } from '@/stores/useUserStore'
import type { FamilyMember, Relation } from '@/types'
import { cn } from '@/lib/utils'

const relationColorMap: Record<Relation, string> = {
  parent: 'bg-blue-500',
  spouse: 'bg-pink-500',
  child: 'bg-green-500',
  sibling: 'bg-gray-400',
  other: 'bg-gray-400',
}

const relationBadgeMap: Record<Relation, string> = {
  parent: 'badge-gov',
  spouse: 'badge-warm',
  child: 'badge-success',
  sibling: 'badge',
  other: 'badge',
}

const relationIconMap: Record<Relation, React.ReactNode> = {
  parent: <User className="w-4 h-4" />,
  spouse: <Heart className="w-4 h-4" />,
  child: <Baby className="w-4 h-4" />,
  sibling: <Users className="w-4 h-4" />,
  other: <User className="w-4 h-4" />,
}

const relationOptions: { value: Relation; label: string }[] = [
  { value: 'parent', label: '父母' },
  { value: 'spouse', label: '配偶' },
  { value: 'child', label: '子女' },
  { value: 'sibling', label: '兄弟姐妹' },
  { value: 'other', label: '其他' },
]

interface AddMemberForm {
  name: string
  relation: Relation
  idCard: string
  phone: string
}

const initialForm: AddMemberForm = {
  name: '',
  relation: 'parent',
  idCard: '',
  phone: '',
}

export default function Family() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const [members, setMembers] = useState<FamilyMember[]>(() =>
    mockFamilyMembers.filter((m) => m.userId === (user?.id ?? 'U001'))
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<AddMemberForm>(initialForm)
  const [activeTab, setActiveTab] = useState<'members' | 'proxy'>('members')
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const hotServices = mockServices.filter((s) => s.isHot)

  const handleAddMember = () => {
    if (!form.name.trim() || !form.idCard.trim()) return
    const relationLabel = relationOptions.find((r) => r.value === form.relation)?.label ?? '其他'
    const newMember: FamilyMember = {
      id: 'F' + Date.now(),
      userId: user?.id ?? 'U001',
      name: form.name.trim(),
      relation: form.relation,
      relationText: relationLabel,
      idCard: form.idCard.trim(),
      phone: form.phone.trim() || undefined,
      birthDate: '1970-01-01',
      isVerified: false,
    }
    setMembers((prev) => [...prev, newMember])
    setForm(initialForm)
    setShowAddModal(false)
  }

  const handleProxy = () => {
    if (!selectedMember || !selectedService) return
    const svc = hotServices.find((s) => s.id === selectedService)
    navigate(`/service/${selectedService}`, {
      state: { proxyFor: selectedMember.name, serviceName: svc?.name },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-gov-gradient px-6 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" />
          家庭空间
        </h1>
        <p className="mt-2 text-white/80 text-sm">
          管理家庭成员信息，为亲属代办政务服务事项
        </p>
        <button
          className="mt-4 btn-warm text-sm"
          onClick={() => setShowAddModal(true)}
        >
          <UserPlus className="w-4 h-4" />
          添加成员
        </button>
      </div>

      <div className="px-4 -mt-4">
        <div className="flex gap-2 mb-4">
          <button
            className={cn(activeTab === 'members' ? 'tab-btn-active' : 'tab-btn')}
            onClick={() => setActiveTab('members')}
          >
            亲属列表
          </button>
          <button
            className={cn(activeTab === 'proxy' ? 'tab-btn-active' : 'tab-btn')}
            onClick={() => setActiveTab('proxy')}
          >
            代办服务
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gov-100 flex items-center justify-center text-gov-700 font-bold text-lg">
                      {member.name[0]}
                    </div>
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white',
                        relationColorMap[member.relation]
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{member.name}</span>
                      <span className={cn(relationBadgeMap[member.relation])}>
                        {relationIconMap[member.relation]}
                        {member.relationText}
                      </span>
                      {member.isVerified ? (
                        <span className="badge-success">
                          <Shield className="w-3 h-3" />
                          已认证
                        </span>
                      ) : (
                        <span className="badge-warning">
                          待验证
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {member.phone ?? '未填写'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {member.birthDate}
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 text-gov-600 hover:text-gov-700 p-1"
                    onClick={() => {
                      setSelectedMember(member)
                      setActiveTab('proxy')
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无家庭成员，点击上方按钮添加</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'proxy' && (
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3">选择代办亲属</h3>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                      selectedMember?.id === m.id
                        ? 'border-gov-500 bg-gov-50 text-gov-700'
                        : 'border-slate-200 text-slate-600 hover:border-gov-300'
                    )}
                    onClick={() => setSelectedMember(m)}
                  >
                    {m.name}
                    <span className="ml-1 text-xs opacity-70">({m.relationText})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3">热门代办服务</h3>
              <div className="space-y-2">
                {hotServices.slice(0, 8).map((svc) => (
                  <button
                    key={svc.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                      selectedService === svc.id
                        ? 'border-gov-500 bg-gov-50'
                        : 'border-slate-100 hover:border-gov-300 hover:bg-slate-50'
                    )}
                    onClick={() => setSelectedService(svc.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{svc.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{svc.bureau}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <button
              className="w-full btn-primary py-3 disabled:opacity-40"
              disabled={!selectedMember || !selectedService}
              onClick={handleProxy}
            >
              {selectedMember ? `为 ${selectedMember.name} 代办` : '请选择亲属和服务'}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">添加亲属</h2>
              <button
                className="p-1 text-slate-400 hover:text-slate-600"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
              <input
                className="input-field"
                placeholder="请输入亲属姓名"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">关系</label>
              <div className="flex flex-wrap gap-2">
                {relationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                      form.relation === opt.value
                        ? 'border-gov-500 bg-gov-50 text-gov-700'
                        : 'border-slate-200 text-slate-600 hover:border-gov-300'
                    )}
                    onClick={() => setForm((f) => ({ ...f, relation: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">身份证号</label>
              <input
                className="input-field"
                placeholder="请输入身份证号"
                maxLength={18}
                value={form.idCard}
                onChange={(e) => setForm((f) => ({ ...f, idCard: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
              <input
                className="input-field"
                placeholder="请输入手机号（选填）"
                maxLength={11}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <button
              className="w-full btn-primary py-2.5"
              onClick={handleAddMember}
              disabled={!form.name.trim() || !form.idCard.trim()}
            >
              确认添加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
