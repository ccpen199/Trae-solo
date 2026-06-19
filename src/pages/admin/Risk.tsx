import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '@/utils/api'
import type { SensitiveWord } from '@/types'

const WORD_CATEGORIES = ['全部', '政治', '欺诈', '色情', '暴力']
const RISK_COLORS = ['#10B981', '#10B981', '#F59E0B', '#F59E0B', '#EF4444']

const mockImages = [
  { id: '1', title: '精装修两室一厅出租', risk: 'suspect' as const },
  { id: '2', title: '高薪招聘网络兼职', risk: 'dangerous' as const },
  { id: '3', title: '二手iPhone低价转让', risk: 'safe' as const },
  { id: '4', title: '专业家政服务', risk: 'safe' as const },
  { id: '5', title: '投资理财日赚千元', risk: 'dangerous' as const },
  { id: '6', title: '宠物狗免费领养', risk: 'suspect' as const },
]

const mockPhones = [
  { phone: '138****5678', reports: 23, status: 'confirmed' },
  { phone: '159****3210', reports: 15, status: 'suspected' },
  { phone: '186****9012', reports: 9, status: 'suspected' },
  { phone: '177****4567', reports: 31, status: 'confirmed' },
  { phone: '135****8901', reports: 5, status: 'pending' },
]

const RISK_BADGE: Record<string, string> = {
  safe: 'badge-success',
  suspect: 'badge-warning',
  dangerous: 'badge-danger',
}
const RISK_LABEL: Record<string, string> = { safe: '安全', suspect: '可疑', dangerous: '高危' }
const PHONE_STATUS: Record<string, string> = { confirmed: 'badge-danger', suspected: 'badge-warning', pending: 'badge-info' }
const PHONE_LABEL: Record<string, string> = { confirmed: '已确认', suspected: '疑似', pending: '待核实' }

export default function Risk() {
  const [distribution, setDistribution] = useState<{ range: string; count: number }[]>([])
  const [highRiskCount, setHighRiskCount] = useState(0)
  const [words, setWords] = useState<SensitiveWord[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newCategory, setNewCategory] = useState('欺诈')
  const [filterCat, setFilterCat] = useState('全部')

  useEffect(() => {
    api.risk.stats().then(d => { setDistribution(d.distribution); setHighRiskCount(d.highRiskCount) }).catch(() => {
      setDistribution([
        { range: '0-20', count: 4520 }, { range: '21-40', count: 2180 },
        { range: '41-60', count: 890 }, { range: '61-80', count: 340 }, { range: '81-100', count: 85 },
      ])
      setHighRiskCount(425)
    })
    api.risk.words().then(d => setWords(d.words)).catch(() => {
      setWords([
        { id: '1', word: '代开发票', category: '欺诈', hitCount: 342 },
        { id: '2', word: '色情服务', category: '色情', hitCount: 128 },
        { id: '3', word: '暴力催收', category: '暴力', hitCount: 87 },
        { id: '4', word: '政治敏感', category: '政治', hitCount: 56 },
        { id: '5', word: '虚假投资', category: '欺诈', hitCount: 219 },
      ])
    })
  }, [])

  const handleAddWord = () => {
    if (!newWord.trim()) return
    api.risk.addWord({ word: newWord, category: newCategory }).then(w => { setWords(prev => [...prev, w]); setNewWord(''); setShowAddForm(false) }).catch(() => {
      setWords(prev => [...prev, { id: String(Date.now()), word: newWord, category: newCategory, hitCount: 0 }])
      setNewWord(''); setShowAddForm(false)
    })
  }

  const handleDeleteWord = (id: string) => {
    api.risk.deleteWord(id).then(() => setWords(prev => prev.filter(w => w.id !== id))).catch(() => {
      setWords(prev => prev.filter(w => w.id !== id))
    })
  }

  const filteredWords = filterCat === '全部' ? words : words.filter(w => w.category === filterCat)

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-navy-800">内容风控引擎</h1>
          <p className="text-sm text-slate-500">实时监测平台内容安全</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-navy-800 mb-3">风险评分分布</h2>
        <div className="flex gap-6">
          <div className="flex-1" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((_, i) => <Cell key={i} fill={RISK_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col items-center justify-center w-40">
            <span className="text-5xl font-bold text-red-500">{highRiskCount}</span>
            <span className="text-sm text-slate-500 mt-1">高风险内容</span>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-navy-800">敏感词库</h2>
          <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" /> 添加
          </button>
        </div>
        {showAddForm && (
          <div className="flex gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
            <input className="input-field flex-1" placeholder="输入敏感词" value={newWord} onChange={e => setNewWord(e.target.value)} />
            <select className="select-field w-32" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              {WORD_CATEGORIES.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn-primary text-sm" onClick={handleAddWord}>提交</button>
          </div>
        )}
        <div className="flex gap-2 mb-3">
          {WORD_CATEGORIES.map(c => (
            <button key={c} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCat === c ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setFilterCat(c)}>{c}</button>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-slate-500"><th className="text-left py-2">敏感词</th><th className="text-left py-2">分类</th><th className="text-left py-2">命中次数</th><th className="text-left py-2">操作</th></tr></thead>
          <tbody>
            {filteredWords.map(w => (
              <tr key={w.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{w.word}</td>
                <td className="py-2"><span className={`badge ${w.category === '欺诈' ? 'badge-warning' : w.category === '色情' ? 'badge-danger' : w.category === '暴力' ? 'badge-danger' : 'badge-info'}`}>{w.category}</span></td>
                <td className="py-2">{w.hitCount}</td>
                <td className="py-2"><button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteWord(w.id)}><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-navy-800 mb-3">图像审核队列</h2>
        <div className="grid grid-cols-3 gap-4">
          {mockImages.map(img => (
            <div key={img.id} className="border rounded-lg overflow-hidden">
              <div className="h-36 bg-slate-200 flex items-center justify-center relative">
                <span className="text-slate-400 text-sm">图片</span>
                <span className={`badge absolute top-2 right-2 ${RISK_BADGE[img.risk]}`}>{RISK_LABEL[img.risk]}</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate mb-2">{img.title}</p>
                <div className="flex gap-2">
                  <button className="btn-primary text-xs px-3 py-1">通过</button>
                  <button className="btn-danger text-xs px-3 py-1">驳回</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 mt-6">
        <h2 className="font-semibold text-navy-800 mb-3">虚假电话识别</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-slate-500"><th className="text-left py-2">电话号码</th><th className="text-left py-2">举报次数</th><th className="text-left py-2">状态</th><th className="text-left py-2">操作</th></tr></thead>
          <tbody>
            {mockPhones.map((p, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 font-mono">{p.phone}</td>
                <td className="py-2">{p.reports}</td>
                <td className="py-2"><span className={`badge ${PHONE_STATUS[p.status]}`}>{PHONE_LABEL[p.status]}</span></td>
                <td className="py-2"><button className="btn-outline text-xs px-3 py-1">处理</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
