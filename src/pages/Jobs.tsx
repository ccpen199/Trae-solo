import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, Building2, ChevronDown, X, Loader2, Check, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store'

const depts = ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科']
const locs = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京']
const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
const sals = [
  { label: '5K以下', min: 0, max: 5000 },
  { label: '5K-10K', min: 5000, max: 10000 },
  { label: '10K-20K', min: 10000, max: 20000 },
  { label: '20K-30K', min: 20000, max: 30000 },
  { label: '30K-50K', min: 30000, max: 50000 },
  { label: '50K以上', min: 50000, max: 999999 },
]

const jsMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  active: { label: '已上架', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  closed: { label: '已下架', color: 'bg-stone-100 text-stone-600' },
}

interface J {
  id: string; title: string; department: string; institution_name: string
  institution_type: string; location: string; salary_min: number; salary_max: number
  required_title: string; created_at: string; status: string; ai_risk_score?: number
}

const fmtSal = (min: number, max: number) => {
  const f = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${f(min)}-${f(max)}`
}

export default function Jobs() {
  const { user } = useAuthStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState<'all' | 'my'>('all')
  const [sDepts, setSDepts] = useState<string[]>(sp.get('department') ? [sp.get('department')!] : [])
  const [sLoc, setSLoc] = useState('')
  const [sTitles, setSTitles] = useState<string[]>([])
  const [sSal, setSSal] = useState('')
  const [page, setPage] = useState(1)
  const [jobs, setJobs] = useState<J[]>([])
  const [myJobs, setMyJobs] = useState<J[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [actLoad, setActLoad] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{id:number;type:'success'|'error';msg:string}[]>([])
  const ps = 6

  const toast = (type: 'success' | 'error', msg: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, msg }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }

  const fetchJobs = useCallback(async () => {
    if (tab !== 'all') return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(ps), status: 'active' })
      if (sDepts.length) params.set('department', sDepts.join(','))
      if (sLoc) params.set('location', sLoc)
      if (sTitles.length) params.set('title', sTitles.join(','))
      const sr = sals.find(r => r.label === sSal)
      if (sr) { params.set('salary_min', String(sr.min)); params.set('salary_max', String(sr.max)) }
      const res = await apiFetch(`/jobs?${params.toString()}`)
      if (res.success) { setJobs(res.data.items || []); setTotal(res.data.total || 0); setTotalPages(res.data.totalPages || 0) }
    } catch (e: any) { toast('error', e.message || '加载失败') }
    finally { setLoading(false) }
  }, [page, sDepts, sLoc, sTitles, sSal, tab])

  const fetchMyJobs = useCallback(async () => {
    if (tab !== 'my' || user?.role !== 'institution') return
    setLoading(true)
    try {
      const res = await apiFetch('/jobs')
      if (res.success) {
        const all: J[] = res.data.items || []
        setMyJobs(all.filter(j => j.institution_name === user?.institutionName))
      }
    } catch (e: any) { toast('error', e.message || '加载失败') }
    finally { setLoading(false) }
  }, [tab, user])

  useEffect(() => { tab === 'all' ? fetchJobs() : fetchMyJobs() }, [fetchJobs, fetchMyJobs, tab])

  const tDept = (d: string) => { setSDepts(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]); setPage(1) }
  const tTitle = (t: string) => { setSTitles(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]); setPage(1) }
  const clearF = () => { setSDepts([]); setSLoc(''); setSTitles([]); setSSal(''); setPage(1) }
  const hasF = sDepts.length || sLoc || sTitles.length || sSal

  const closeJob = async (id: string) => {
    setActLoad(id)
    try {
      const res = await apiFetch(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'closed' }) })
      if (res.success) { setMyJobs(p => p.map(j => j.id === id ? { ...j, status: 'closed' } : j)); toast('success', '职位已下架') }
    } catch (e: any) { toast('error', e.message || '操作失败') }
    finally { setActLoad(null) }
  }

  const isInst = user?.role === 'institution'
  const btnBase = "px-3 py-1.5 rounded-lg text-sm flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
  const btnSec = `${btnBase} border border-stone-300 text-stone-600 hover:bg-stone-50`
  const cur = tab === 'all' ? jobs : myJobs

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {t.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm">{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {tab === 'all' && (
          <aside className="w-64 shrink-0">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-stone-200 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-800">筛选条件</h3>
                {hasF && <button onClick={clearF} className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1"><X className="w-3 h-3" /> 清除</button>}
              </div>
              <div className="mb-5">
                <h4 className="text-sm font-medium text-stone-600 mb-2">科室</h4>
                <div className="space-y-1.5">
                  {depts.map(d => (
                    <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={sDepts.includes(d)} onChange={() => tDept(d)}
                        className="w-4 h-4 rounded border-stone-300 text-teal-700 focus:ring-teal-500" />
                      <span className="text-stone-700">{d}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <h4 className="text-sm font-medium text-stone-600 mb-2">地域</h4>
                <div className="relative">
                  <select value={sLoc} onChange={e => { setSLoc(e.target.value); setPage(1) }}
                    className="w-full h-9 pl-3 pr-8 border border-stone-300 rounded-lg appearance-none text-sm focus:ring-2 focus:ring-teal-500">
                    <option value="">全部</option>
                    {locs.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="mb-5">
                <h4 className="text-sm font-medium text-stone-600 mb-2">职称</h4>
                <div className="space-y-1.5">
                  {titles.map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={sTitles.includes(t)} onChange={() => tTitle(t)}
                        className="w-4 h-4 rounded border-stone-300 text-teal-700 focus:ring-teal-500" />
                      <span className="text-stone-700">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-stone-600 mb-2">薪资范围</h4>
                <div className="space-y-1.5">
                  {sals.map(r => (
                    <label key={r.label} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="salary" checked={sSal === r.label}
                        onChange={() => { setSSal(r.label); setPage(1) }}
                        className="w-4 h-4 border-stone-300 text-teal-700 focus:ring-teal-500" />
                      <span className="text-stone-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1">
          {isInst && (
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setTab('all'); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                全部职位
              </button>
              <button onClick={() => setTab('my')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'my' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                我的职位
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">共 {tab === 'all' ? total : myJobs.length} 个职位</p>
            {tab === 'my' && isInst && (
              <button onClick={() => nav('/job/post')} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
                发布新职位
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-stone-500 py-12">加载中...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {cur.map(j => (
                <div key={j.id} className="bg-white border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {tab === 'all' ? (
                        <Link to={`/jobs/${j.id}`} className="font-medium text-lg text-stone-800 hover:text-teal-700">{j.title}</Link>
                      ) : <h3 className="font-medium text-lg text-stone-800">{j.title}</h3>}
                      <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{j.department}</span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded">{j.required_title}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-amber-600 font-bold whitespace-nowrap">{fmtSal(j.salary_min, j.salary_max)}</span>
                      {tab === 'my' && (
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${jsMap[j.status]?.color || 'bg-stone-100 text-stone-600'}`}>
                            {jsMap[j.status]?.label || j.status}
                          </span>
                          {j.ai_risk_score && j.ai_risk_score > 50 && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />风险 {j.ai_risk_score}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{j.institution_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{j.location}</span>
                  </div>
                  {tab === 'my' && isInst && (
                    <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
                      {j.status === 'active' && (
                        <button onClick={() => closeJob(j.id)} disabled={actLoad === j.id}
                          className={`${btnBase} border border-red-300 text-red-600 hover:bg-red-50`}>
                          {actLoad === j.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}下架
                        </button>
                      )}
                      <button onClick={() => nav(`/applications?jobId=${j.id}`)} className={btnSec}>查看投递</button>
                      <button onClick={() => nav(`/job/post?id=${j.id}`)} className={btnSec}>编辑</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'all' && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50">上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-teal-700 text-white' : 'border border-stone-300 hover:bg-stone-50'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50">下一页</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
