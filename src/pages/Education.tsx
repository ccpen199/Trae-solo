import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, GraduationCap, BookOpen, ArrowRight, Filter } from 'lucide-react'
import { useUserStore } from '@/store/user'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { School, District } from '../../shared/types'

type Tab = 'district' | 'enroll' | 'policy'

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'district', label: '学区查询', icon: MapPin },
  { key: 'enroll', label: '入学报名', icon: GraduationCap },
  { key: 'policy', label: '入学政策', icon: BookOpen },
]

const policies = [
  { title: '2024年长沙市义务教育阶段招生入学工作通知', date: '2024-03-15', summary: '明确义务教育阶段招生入学政策，规范招生秩序，保障适龄儿童少年平等接受义务教育的权利。' },
  { title: '关于进一步做好义务教育免试就近入学工作的通知', date: '2024-02-28', summary: '严格落实免试就近入学要求，严禁以各类考试、竞赛、培训成绩或证书证明等作为招生依据。' },
  { title: '长沙市义务教育阶段学区划分调整公告', date: '2024-01-20', summary: '根据城市发展和人口分布变化，对部分学区范围进行优化调整，确保教育资源均衡配置。' },
]

const levelLabels: Record<string, string> = { primary: '小学', junior: '初中', senior: '高中' }

const defaultSchools: School[] = [
  { id: '1', name: '青园小学', district: '天心区', address: '天心区青园路168号', level: 'primary' },
  { id: '2', name: '麓山国际实验学校', district: '岳麓区', address: '岳麓区麓山南路36号', level: 'primary' },
  { id: '3', name: '长沙市长郡中学', district: '天心区', address: '天心区学院街24号', level: 'senior' },
  { id: '4', name: '砂子塘小学', district: '雨花区', address: '雨花区砂子塘路12号', level: 'primary' },
  { id: '5', name: '湘郡培粹实验中学', district: '芙蓉区', address: '芙蓉区解放中路89号', level: 'junior' },
  { id: '6', name: '博才梅溪湖小学', district: '岳麓区', address: '岳麓区梅溪湖路58号', level: 'primary' },
]

export default function Education() {
  const [activeTab, setActiveTab] = useState<Tab>('district')
  const [schools, setSchools] = useState<School[]>(defaultSchools)
  const [districts, setDistricts] = useState<District[]>([])
  const [selDistrict, setSelDistrict] = useState('')
  const [selLevel, setSelLevel] = useState('')
  const [hoverSchool, setHoverSchool] = useState<string | null>(null)

  useEffect(() => {
    api.get('/education/schools').then((res) => { const d = res.data?.data ?? res.data; if (Array.isArray(d)) setSchools(d) }).catch(() => {})
    api.get('/education/districts').then((res) => { const d = res.data?.data ?? res.data; if (Array.isArray(d)) setDistricts(d) }).catch(() => {})
  }, [])

  const filtered = schools.filter((s) => (!selDistrict || s.district === selDistrict) && (!selLevel || s.level === selLevel))
  const mapSchools = filtered.slice(0, 6)

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl font-bold text-text-dark mb-6">教育服务</h1>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 max-w-md">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-dark',
            )}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'district' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slideUp">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-text-muted" />
              <h3 className="font-semibold text-text-dark text-sm">筛选</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">区域</label>
                <select value={selDistrict} onChange={(e) => setSelDistrict(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">全部区域</option>
                  {districts.map((d) => <option key={d.code} value={d.name}>{d.name}</option>)}
                  {[...new Set(schools.map((s) => s.district))].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">学校级别</label>
                <select value={selLevel} onChange={(e) => setSelLevel(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">全部级别</option>
                  <option value="primary">小学</option>
                  <option value="junior">初中</option>
                  <option value="senior">高中</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 relative">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: 360 }}>
              <svg viewBox="0 0 800 400" className="w-full h-auto">
                <defs>
                  <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E8F0FE" />
                    <stop offset="100%" stopColor="#D1E3FF" />
                  </linearGradient>
                </defs>
                <rect width="800" height="400" fill="url(#mapBg)" rx="12" />
                <path d="M200,50 Q400,80 600,40 L650,200 Q500,250 300,220 Z" fill="#c7d9f5" opacity="0.5" />
                <path d="M100,250 Q250,200 400,280 L500,350 Q300,380 150,340 Z" fill="#b8cfea" opacity="0.4" />
                <line x1="100" y1="120" x2="700" y2="150" stroke="#a3b8d4" strokeWidth="1.5" strokeDasharray="6,4" />
                <line x1="200" y1="30" x2="250" y2="370" stroke="#a3b8d4" strokeWidth="1.5" strokeDasharray="6,4" />
                {mapSchools.map((s, i) => {
                  const cx = 130 + (i % 3) * 240
                  const cy = 100 + Math.floor(i / 3) * 180
                  const isHover = hoverSchool === s.id
                  return (
                    <g key={s.id} onMouseEnter={() => setHoverSchool(s.id)} onMouseLeave={() => setHoverSchool(null)} className="cursor-pointer">
                      <circle cx={cx} cy={cy} r={isHover ? 16 : 12} fill={isHover ? '#0052D9' : '#4A7FE0'} opacity={0.9} className="transition-all" />
                      <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{levelLabels[s.level]?.[0] ?? '校'}</text>
                      {isHover && (
                        <>
                          <rect x={cx - 90} y={cy - 70} width="180" height="60" rx="8" fill="white" stroke="#e5e7eb" />
                          <text x={cx} y={cy - 50} textAnchor="middle" fill="#1F2937" fontSize="11" fontWeight="bold">{s.name}</text>
                          <text x={cx} y={cy - 35} textAnchor="middle" fill="#6B7280" fontSize="9">{s.address}</text>
                          <text x={cx} y={cy - 20} textAnchor="middle" fill="#0052D9" fontSize="9">{levelLabels[s.level]} · {s.district}</text>
                        </>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'enroll' && (
        <div className="text-center py-16 animate-slideUp">
          <GraduationCap className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-dark mb-2">幼升小入学报名</h3>
          <p className="text-sm text-text-muted mb-6">在线填报入学信息，上传相关材料</p>
          <Link to="/education/enroll" className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            进入报名 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {activeTab === 'policy' && (
        <div className="space-y-4 animate-slideUp">
          {policies.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-dark mb-1 line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-text-muted line-clamp-2 mb-2">{p.summary}</p>
                  <span className="text-xs text-text-muted">{p.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
