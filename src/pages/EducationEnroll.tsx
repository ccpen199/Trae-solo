import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Users, School, Upload, ChevronLeft, ChevronRight, Check, FileText } from 'lucide-react'
import { useUserStore } from '@/store/user'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { School as SchoolType } from '../../shared/types'

const steps = ['儿童信息', '监护人信息', '志愿学校', '材料提交']
const stepIcons = [User, Users, School, FileText]

const defaultSchools: SchoolType[] = [
  { id: '1', name: '青园小学', district: '天心区', address: '天心区青园路168号', level: 'primary' },
  { id: '2', name: '麓山国际实验学校', district: '岳麓区', address: '岳麓区麓山南路36号', level: 'primary' },
  { id: '3', name: '砂子塘小学', district: '雨花区', address: '雨花区砂子塘路12号', level: 'primary' },
  { id: '4', name: '博才梅溪湖小学', district: '岳麓区', address: '岳麓区梅溪湖路58号', level: 'primary' },
]

const materialList = [
  { name: '儿童出生证明', required: true },
  { name: '户口簿', required: true },
  { name: '监护人身份证', required: true },
  { name: '房产证或居住证明', required: true },
  { name: '预防接种证明', required: false },
]

export default function EducationEnroll() {
  const navigate = useNavigate()
  const [curStep, setCurStep] = useState(0)
  const [schools, setSchools] = useState<SchoolType[]>(defaultSchools)
  const [submitted, setSubmitted] = useState(false)
  const [child, setChild] = useState({ name: '', idCard: '', birthDate: '' })
  const [guardian, setGuardian] = useState({ name: '', idCard: '', phone: '', relation: '' })
  const [selected, setSelected] = useState({ district: '', schoolId: '' })
  const [uploads, setUploads] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get('/education/schools').then((res) => { const d = res.data?.data ?? res.data; if (Array.isArray(d)) setSchools(d) }).catch(() => {})
  }, [])

  const districts = [...new Set(schools.map((s) => s.district))]
  const filteredSchools = schools.filter((s) => !selected.district || s.district === selected.district)
  const toggleUpload = (name: string) => setUploads((p) => ({ ...p, [name]: !p[name] }))

  const handleNext = () => {
    if (curStep === 3) {
      setSubmitted(true)
    } else {
      setCurStep((s) => s + 1)
    }
  }
  const handlePrev = () => { if (curStep > 0) setCurStep((s) => s - 1) }

  if (submitted) {
    return (
      <div className="animate-fadeIn text-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-text-dark mb-2">报名提交成功</h2>
        <p className="text-sm text-text-muted mb-1">回执编号：<span className="font-mono text-primary">EN{Date.now().toString(36).toUpperCase()}</span></p>
        <p className="text-sm text-text-muted mb-8">请耐心等待审核结果，预计3-5个工作日</p>
        <button onClick={() => navigate('/education')} className="h-10 px-8 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90">返回教育服务</button>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl font-bold text-text-dark mb-6">幼升小报名</h1>

      <div className="flex items-center justify-center gap-0 mb-8 max-w-lg mx-auto">
        {steps.map((label, i) => {
          const Icon = stepIcons[i]
          const done = i < curStep
          const active = i === curStep
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  done && 'bg-primary text-white',
                  active && 'bg-primary text-white animate-pulse-glow',
                  !done && !active && 'bg-gray-100 text-text-muted',
                )}>
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={cn('text-xs whitespace-nowrap', active ? 'text-primary font-medium' : 'text-text-muted')}>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-2', done ? 'bg-primary' : 'bg-gray-200')} />}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        {curStep === 0 && (
          <div className="space-y-4 animate-slideUp">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">儿童姓名</label>
              <input value={child.name} onChange={(e) => setChild((p) => ({ ...p, name: e.target.value }))} placeholder="请输入儿童姓名" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">身份证号</label>
              <input value={child.idCard} onChange={(e) => setChild((p) => ({ ...p, idCard: e.target.value }))} placeholder="请输入儿童身份证号" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">出生日期</label>
              <input type="date" value={child.birthDate} onChange={(e) => setChild((p) => ({ ...p, birthDate: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
        )}

        {curStep === 1 && (
          <div className="space-y-4 animate-slideUp">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">监护人姓名</label>
              <input value={guardian.name} onChange={(e) => setGuardian((p) => ({ ...p, name: e.target.value }))} placeholder="请输入监护人姓名" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">身份证号</label>
              <input value={guardian.idCard} onChange={(e) => setGuardian((p) => ({ ...p, idCard: e.target.value }))} placeholder="请输入监护人身份证号" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">联系电话</label>
              <input value={guardian.phone} onChange={(e) => setGuardian((p) => ({ ...p, phone: e.target.value }))} placeholder="请输入联系电话" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">与儿童关系</label>
              <select value={guardian.relation} onChange={(e) => setGuardian((p) => ({ ...p, relation: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">请选择</option>
                <option value="father">父亲</option>
                <option value="mother">母亲</option>
                <option value="grandparent">祖父母/外祖父母</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
        )}

        {curStep === 2 && (
          <div className="space-y-4 animate-slideUp">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">选择学区</label>
              <select value={selected.district} onChange={(e) => setSelected((p) => ({ ...p, district: e.target.value, schoolId: '' }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">请选择学区</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">选择学校</label>
              <select value={selected.schoolId} onChange={(e) => setSelected((p) => ({ ...p, schoolId: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">请选择学校</option>
                {filteredSchools.map((s) => <option key={s.id} value={s.id}>{s.name} - {s.address}</option>)}
              </select>
            </div>
          </div>
        )}

        {curStep === 3 && (
          <div className="space-y-3 animate-slideUp">
            {materialList.map((m) => (
              <div key={m.name} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-dark">{m.name}</span>
                  {m.required && <span className="text-xs text-red-400">*</span>}
                </div>
                <button onClick={() => toggleUpload(m.name)} className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  uploads[m.name] ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20',
                )}>
                  {uploads[m.name] ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploads[m.name] ? '已上传' : '上传'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {curStep > 0 && (
          <button onClick={handlePrev} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-text-muted hover:bg-gray-50 flex items-center justify-center gap-1">
            <ChevronLeft className="w-4 h-4" />上一步
          </button>
        )}
        <button onClick={handleNext} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-1">
          {curStep === 3 ? '提交报名' : '下一步'}<ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
