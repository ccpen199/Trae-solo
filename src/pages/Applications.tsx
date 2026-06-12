import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Building2, Clock, ChevronRight, MessageSquare, Loader2, X, Check } from 'lucide-react'

type S = '投递' | '已读' | '邀约' | '面试' | '录用' | '不合适'
interface TL { status: S; time: string; note?: string }
interface App { id: string; jobId: string; jobTitle: string; dept: string; inst: string; loc: string; sal: string; status: S; tl: TL[]; talentId?: string; talentName?: string; talentTitle?: string }

const sMap: Record<string, S> = { applied: '投递', read: '已读', invited: '邀约', interview: '面试', offered: '录用', rejected: '不合适' }
const sColors: Record<S, string> = { '投递': 'bg-blue-100 text-blue-700', '已读': 'bg-stone-100 text-stone-600', '邀约': 'bg-amber-100 text-amber-700', '面试': 'bg-teal-100 text-teal-700', '录用': 'bg-green-100 text-green-700', '不合适': 'bg-red-100 text-red-700' }
const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
const fmtSal = (min: number, max: number) => `${fmt(min)}-${fmt(max)}`
const parseTL = (str: string): TL[] => {
  try {
    const p = JSON.parse(str)
    return Array.isArray(p) ? p.map((i: any) => ({ status: sMap[i.status] || i.status, time: i.at ? new Date(i.at).toLocaleString('zh-CN') : i.time || '', note: i.note })) : []
  } catch { return [] }
}

export default function Applications() {
  const { user } = useAuthStore()
  const nav = useNavigate()
  const [sel, setSel] = useState<App | null>(null)
  const [fS, setFS] = useState<S | '全部'>('全部')
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [aL, setAL] = useState<string | null>(null)
  const [modal, setModal] = useState<'invite' | 'interview' | null>(null)
  const [note, setNote] = useState('')
  const [itv, setItv] = useState('')
  const [toasts, setToasts] = useState<{id:number;t:'success'|'error';m:string}[]>([])

  const toast = (t: 'success' | 'error', m: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, t, m }])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000)
  }

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/applications')
        if (res.success) setApps((res.data || []).map((a: any) => ({
          id: String(a.id), jobId: String(a.job_id), jobTitle: a.job_title, dept: a.department, inst: a.institution_name,
          loc: a.location, sal: fmtSal(a.salary_min, a.salary_max), status: sMap[a.status] || '投递', tl: parseTL(a.timeline),
          talentId: a.talent_id ? String(a.talent_id) : undefined, talentName: a.talent_name, talentTitle: a.talent_title,
        })))
      } catch (e: any) { toast('error', e.message || '加载失败') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const updateS = async (id: string, ns: string, nt?: string) => {
    setAL(id + ns)
    try {
      const res = await apiFetch(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: ns, note: nt }) })
      if (res.success) {
        setApps(p => p.map(a => a.id === id ? { ...a, status: sMap[ns] as S, tl: parseTL(res.data.timeline) } : a))
        if (sel?.id === id) setSel(p => p ? { ...p, status: sMap[ns] as S, tl: parseTL(res.data.timeline) } : null)
        toast('success', '操作成功')
        return true
      }
    } catch (e: any) { toast('error', e.message || '操作失败') }
    finally { setAL(null) }
    return false
  }

  const createConv = async (tid: string, content: string) => {
    try {
      const res = await apiFetch('/messages/send', { method: 'POST', body: JSON.stringify({ receiver_id: tid, content, type: 'text' }) })
      if (res.success && res.data?.conversation_id) nav(`/messages/${res.data.conversation_id}`)
    } catch (e: any) { toast('error', e.message || '创建会话失败') }
  }

  const hInvite = async () => {
    if (!sel) return
    if (await updateS(sel.id, 'invited', note)) { setModal(null); setNote(''); await createConv(sel.talentId!, note || '我们诚挚邀请您参加面试') }
  }

  const hItv = async () => {
    if (!sel) return
    const full = itv ? `面试时间：${itv}\n${note}`.trim() : note
    if (await updateS(sel.id, 'interview', full)) { setModal(null); setNote(''); setItv('') }
  }

  const sendMsg = async (a: App) => { if (!a.talentId) return toast('error', '无法获取人才信息'); await createConv(a.talentId, '您好，关于您的投递...') }
  const talentResp = async (a: App, accept: boolean) => {
    if (a.status === '邀约') await updateS(a.id, accept ? 'interview' : 'rejected')
    else if (a.status === '面试') toast('success', accept ? '已确认面试' : '改期申请已提交')
  }

  const filtered = fS === '全部' ? apps : apps.filter(a => a.status === fS)
  const isInst = user?.role === 'institution'
  const isTalent = user?.role === 'talent'
  const btn = "px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
  const btnP = `${btn} bg-teal-600 text-white hover:bg-teal-700`
  const btnS = `${btn} border border-stone-300 text-stone-600 hover:bg-stone-50`

  if (loading) return <div className="container mx-auto px-4 py-8"><h1 className="font-heading text-2xl font-bold mb-6">投递追踪</h1><div className="text-center text-stone-500 py-20">加载中...</div></div>

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${t.t === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {t.t === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}<span className="text-sm">{t.m}</span>
          </div>
        ))}
      </div>

      <h1 className="font-heading text-2xl font-bold mb-6">投递追踪</h1>

      <div className="flex gap-2 mb-6">
        {(['全部', '投递', '已读', '邀约', '面试', '录用', '不合适'] as const).map(s => (
          <button key={s} onClick={() => setFS(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${fS === s ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{s}</button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-3">
          {filtered.map(a => (
            <div key={a.id} onClick={() => setSel(a)} className={`bg-white border rounded-lg p-5 cursor-pointer transition-all ${sel?.id === a.id ? 'border-teal-500 shadow-md' : 'border-stone-200 hover:shadow-md'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <Link to={`/jobs/${a.jobId}`} onClick={e => e.stopPropagation()} className="font-medium text-lg text-stone-800 hover:text-teal-700">{a.jobTitle}</Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{a.dept}</span>
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{a.inst}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{a.loc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-600 font-bold">{a.sal}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sColors[a.status]}`}>{a.status}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
              {isTalent && (a.status === '邀约' || a.status === '面试') && (
                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
                  {a.status === '邀约' ? (
                    <>
                      <button onClick={e => { e.stopPropagation(); talentResp(a, true) }} disabled={aL === a.id + 'interview'} className={btnP}>{aL === a.id + 'interview' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}接受邀约</button>
                      <button onClick={e => { e.stopPropagation(); talentResp(a, false) }} disabled={aL === a.id + 'rejected'} className={btnS}>{aL === a.id + 'rejected' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}拒绝</button>
                    </>
                  ) : (
                    <>
                      <button onClick={e => { e.stopPropagation(); talentResp(a, true) }} className={btnP}>确认面试</button>
                      <button onClick={e => { e.stopPropagation(); talentResp(a, false) }} className={btnS}>改期申请</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {sel && (
          <div className="w-96 shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">投递进度</h3>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${sColors[sel.status]}`}>{sel.status}</span>
              </div>
              {isInst && sel.talentName && (
                <div className="mb-4 p-3 bg-stone-50 rounded-lg">
                  <p className="text-sm font-medium text-stone-800">{sel.talentName}</p>
                  {sel.talentTitle && <p className="text-xs text-stone-500">{sel.talentTitle}</p>}
                </div>
              )}
              <div className="space-y-0 mb-6">
                {sel.tl.map((it, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === sel.tl.length - 1 ? 'bg-teal-600 ring-4 ring-teal-100' : 'bg-teal-500'}`} />
                      {i < sel.tl.length - 1 && <div className="w-0.5 h-12 bg-teal-200" />}
                    </div>
                    <div className="pb-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${sColors[it.status]}`}>{it.status}</span>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{it.time}</div>
                      {it.note && <div className="text-xs text-stone-600 mt-1">{it.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {isInst && (
                <div className="border-t border-stone-200 pt-4">
                  <h4 className="font-medium text-sm text-stone-800 mb-3">操作</h4>
                  <div className="space-y-2">
                    {sel.status === '投递' && <button onClick={() => updateS(sel.id, 'read')} disabled={aL === sel.id + 'read'} className={`w-full ${btn} bg-stone-600 text-white hover:bg-stone-700`}>{aL === sel.id + 'read' && <Loader2 className="w-4 h-4 animate-spin" />}标记已读</button>}
                    {sel.status === '已读' && (
                      <>
                        <button onClick={() => setModal('invite')} className={`w-full ${btn} bg-amber-600 text-white hover:bg-amber-700`}>发起邀约</button>
                        <button onClick={() => updateS(sel.id, 'rejected')} disabled={aL === sel.id + 'rejected'} className={`w-full ${btnS}`}>{aL === sel.id + 'rejected' && <Loader2 className="w-4 h-4 animate-spin" />}不合适</button>
                      </>
                    )}
                    {sel.status === '邀约' && <button onClick={() => setModal('interview')} className={`w-full ${btnP}`}>安排面试</button>}
                    {sel.status === '面试' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateS(sel.id, 'offered')} disabled={aL === sel.id + 'offered'} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>{aL === sel.id + 'offered' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}发送录用</button>
                        <button onClick={() => updateS(sel.id, 'rejected')} disabled={aL === sel.id + 'rejected'} className={`${btn} border border-red-300 text-red-600 hover:bg-red-50`}>{aL === sel.id + 'rejected' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}不合适</button>
                      </div>
                    )}
                    {(sel.status === '录用' || sel.status === '不合适') && <span className="w-full block text-center px-4 py-2 bg-stone-100 text-stone-500 rounded-lg text-sm">已完成</span>}
                    {sel.status !== '录用' && sel.status !== '不合适' && <button onClick={() => sendMsg(sel)} className={`w-full ${btn} border border-teal-300 text-teal-600 hover:bg-teal-50`}><MessageSquare className="w-4 h-4" />发送消息</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg">{modal === 'invite' ? '发起邀约' : '安排面试'}</h3>
              <button onClick={() => { setModal(null); setNote(''); setItv('') }} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>
            {modal === 'interview' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">面试时间</label>
                <input type="datetime-local" value={itv} onChange={e => setItv(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">备注信息</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={modal === 'invite' ? '请输入邀约内容或面试安排...' : '请输入面试地点或其他注意事项...'} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 resize-none" rows={modal === 'invite' ? 4 : 3} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setNote(''); setItv('') }} className={`flex-1 ${btnS}`}>取消</button>
              <button onClick={modal === 'invite' ? hInvite : hItv} disabled={!!aL} className={`flex-1 ${modal === 'invite' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'} text-white ${btn}`}>{aL && <Loader2 className="w-4 h-4 animate-spin" />}确认{modal === 'invite' ? '发送' : '安排'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
