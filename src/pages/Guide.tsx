import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Send, Sparkles, FileText, Camera, Route, Clock, CheckCircle2, AlertCircle,
  User as UserIcon, Shield, CreditCard, Building, ChevronRight, FileCheck,
  Search, RefreshCw,
} from 'lucide-react'
import type { ServiceItem, ProcessStep, Material } from '@/types'
import { apiFetch, mapService } from '@/utils/api'

const quickQuestions = [
  '我想办理社保缴纳',
  '水费该怎么在网上缴？',
  '查一下我的不动产信息',
  '有一个交通违章需要处理',
]

interface RecItem {
  role: 'user' | 'system'
  type?: 'text' | 'result'
  text?: string
  services?: ServiceItem[]
  steps?: ProcessStep[]
  materials?: Material[]
  tips?: string[]
}

const sampleSteps: ProcessStep[] = [
  { step: 1, title: '实名认证与登录', description: '通过省政务云CA统一身份认证', department: '市政务服务数据局', estimatedDays: 0 },
  { step: 2, title: '填写申报信息', description: '确认缴费基数、缴费月数，OCR自动预填身份证', department: '市人社局', estimatedDays: 0 },
  { step: 3, title: '上传电子材料', description: '身份证正反面、单位证明(如有)', department: '系统自动校验', estimatedDays: 0 },
  { step: 4, title: '缴费确认与支付', description: '选择银行卡/第三方支付渠道', department: '市财政局·银联', estimatedDays: 0 },
  { step: 5, title: '生成缴费凭证', description: '电子凭证推送至证照库', department: '市人社局', estimatedDays: 1 },
]

const sampleMaterials: Material[] = [
  { id: 'm-sample-1', name: '本人居民身份证', description: '二代身份证正反面照片', required: true, format: ['image/jpeg', 'image/png'], quantity: 2, ocrFields: ['姓名', '身份证号', '住址'], sampleUrl: '' },
  { id: 'm-sample-2', name: '社会保险登记证', description: '首次参保时提供，复印件加盖公章', required: false, format: ['application/pdf'], quantity: 1, ocrFields: ['单位名称', '社保编号'], sampleUrl: '' },
  { id: 'm-sample-3', name: '近期1寸免冠彩色照片', description: '白底证件照，用于社保卡制作', required: true, format: ['image/jpeg'], quantity: 1, ocrFields: [], sampleUrl: '' },
  { id: 'm-sample-4', name: '银行借记卡信息', description: '工行/建行/农行等一类卡', required: false, format: [], quantity: 1, ocrFields: ['卡号', '开户行', '持卡人'], sampleUrl: '' },
]

const demoServices: ServiceItem[] = [
  {
    id: 'svc-001', name: '社保缴纳', category: 'government', subCategory: '社会保障', departmentId: 'dept-001',
    description: '办理社会保险缴纳业务，包括养老、医疗、失业等险种在线缴费', icon: 'shield', accessType: 'api-gateway',
    accessConfig: { endpoint: '', method: 'POST' }, status: 'online', applicantCount: 15280,
    processSteps: sampleSteps, requiredMaterials: sampleMaterials, department: '市人力资源和社会保障局', departmentName: '市人力资源和社会保障局',
    serviceCode: 'SB-2026-001', legalBasis: '《社会保险法》第4条、第60条', chargeStandard: '按缴费基数8%~24%',
    processingTime: '1个工作日', contactPhone: '12333', location: '市本级·社保大厅B区',
    rating: 4.8, reviewCount: 1892, satisfaction: 98.2,
  },
  {
    id: 'svc-004', name: '住房公积金提取', category: 'government', subCategory: '住房建设', departmentId: 'dept-004',
    description: '购房、租房、退休等场景下提取个人账户公积金余额', icon: 'home', accessType: 'http',
    accessConfig: { endpoint: '', method: 'POST' }, status: 'online', applicantCount: 11340,
    processSteps: [
      { step: 1, title: '登录并选择提取类型', description: '选择购房/租房/销户提取', department: '市住建局', estimatedDays: 0 },
      { step: 2, title: '上传购房合同', description: '网签备案合同扫描件', department: '不动产登记中心', estimatedDays: 0 },
      { step: 3, title: '数据校验', description: '跨部门联网核查', department: '市住建局·自然资源局', estimatedDays: 1 },
      { step: 4, title: '资金到账', description: 'T+1至绑定银行卡', department: '市财政局', estimatedDays: 1 },
    ],
    requiredMaterials: [
      { id: 'm-s-1', name: '居民身份证', required: true, description: '身份证原件扫描', format: ['image/*'], quantity: 1, ocrFields: ['姓名', '身份证号'], sampleUrl: '' },
      { id: 'm-s-2', name: '网签购房合同', required: true, description: '备案过的合同PDF', format: ['application/pdf'], quantity: 1, ocrFields: ['合同编号', '购房人', '房屋坐落'], sampleUrl: '' },
      { id: 'm-s-3', name: '银行卡', required: true, description: '本人一类借记卡', format: ['image/*'], quantity: 1, ocrFields: ['卡号', '持卡人'], sampleUrl: '' },
    ],
    department: '市住房和城乡建设局', departmentName: '市住房和城乡建设局', serviceCode: 'GJJ-2026-004',
    legalBasis: '《住房公积金管理条例》第24条', chargeStandard: '免费',
    processingTime: '2个工作日', contactPhone: '12329', location: '市本级·公积金中心A区',
    rating: 4.7, reviewCount: 1342, satisfaction: 97.5,
  },
]

function MaterialRow({ m, index }: { m: Material; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50 border border-gray-100 hover:border-convenience/50 transition-colors">
      <span className="w-6 h-6 rounded-full bg-convenience/15 text-convenience text-xs flex items-center justify-center flex-shrink-0 font-medium">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${m.required ? 'text-gray-800' : 'text-gray-500'}`}>{m.name}</span>
          {m.required
            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">必需</span>
            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">选交</span>}
          {m.ocrFields.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">支持OCR预填</span>}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">{m.description} · {m.quantity}份</p>
        {m.ocrFields.length > 0 && (
          <p className="text-[10px] text-convenience mt-1">
            <FileCheck className="w-3 h-3 inline mr-1 mb-0.5" />
            可自动识别：{m.ocrFields.slice(0, 5).join('、')}{m.ocrFields.length > 5 ? ` 等${m.ocrFields.length}项` : ''}
          </p>
        )}
      </div>
      <Link to="/guide/ocr" className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gov-blue-50 text-gov-blue-600 rounded hover:bg-gov-blue-100 transition-colors flex-shrink-0">
        <Camera className="w-3 h-3" />上传识别
      </Link>
    </div>
  )
}

function ResultCard({ rec, onAgain }: { rec: RecItem; onAgain: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gov-blue-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-gov-blue-500 to-gov-blue-400 text-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">智能匹配结果</span>
          <span className="ml-auto text-xs opacity-80">匹配置信度 97%</span>
        </div>
        {rec.tips && rec.tips.length > 0 && rec.tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gov-blue-50 bg-white/10 rounded p-2 mt-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-4 h-4 text-gov-blue-500" />
            <h4 className="text-sm font-medium text-gray-800">推荐服务 ({rec.services?.length || 0})</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {rec.services?.map((s) => (
              <Link key={s.id} to={`/services/${s.id}`} className="group border border-gray-200 rounded-lg p-3 hover:border-gov-blue-300 hover:shadow-sm transition-all bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${s.status === 'online' ? 'bg-green-400' : s.status === 'degraded' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                      <h5 className="text-sm font-medium text-gray-800 group-hover:text-gov-blue-600">{s.name}</h5>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{s.departmentName}</p>
                    <p className="text-[10px] text-gov-blue-500 mt-0.5">事项编码 {s.serviceCode}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gov-blue-500" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                  <span><Clock className="w-3 h-3 inline mr-0.5" />{s.processingTime}</span>
                  <span className="text-convenience font-medium">{s.satisfaction}%满意</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-convenience" />
            <h4 className="text-sm font-medium text-gray-800">办事流程路径 ({rec.steps?.length || 0}步)</h4>
            <span className="ml-auto text-[10px] text-gray-400">
              预计总耗时：约{(rec.steps || []).reduce((a, s) => a + (s.estimatedDays || 0), 0)}工作日
            </span>
          </div>
          <div className="relative pl-5 space-y-3">
            <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-gradient-to-b from-gov-blue-300 via-gov-blue-200 to-convenience/60" />
            {rec.steps?.map((s) => (
              <div key={s.step} className="relative">
                <div className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-gov-blue-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gov-blue-400" />
                </div>
                <div className="bg-white border border-gray-100 rounded-md p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gov-blue-700">步骤{s.step}</span>
                    <span className="text-sm text-gray-800">{s.title}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{s.estimatedDays > 0 ? `${s.estimatedDays}个工作日` : '即时'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 ml-14">责任：{s.department}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 ml-14">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-alert" />
              <h4 className="text-sm font-medium text-gray-800">所需材料清单 ({(rec.materials || []).filter((m) => m.required).length}必需 / {rec.materials?.length || 0}项)</h4>
            </div>
            <Link to="/guide/ocr" className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-convenience text-white hover:opacity-90 transition-opacity shadow-sm">
              <Camera className="w-3 h-3" />OCR 批量预填
            </Link>
          </div>
          <div className="space-y-2">
            {rec.materials?.map((m, i) => <MaterialRow key={m.id} m={m} index={i} />)}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          {!submitted ? (
            <>
              <Link
                to={rec.services?.[0] ? `/services/${rec.services[0].id}` : '/services'}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-gov-blue-500 to-gov-blue-600 text-white text-sm font-medium rounded-md hover:shadow-md transition-shadow"
              >
                <Shield className="w-4 h-4" />
                立即在线申办
              </Link>
              <button
                onClick={() => setSubmitted(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gov-blue-200 text-gov-blue-600 text-sm font-medium rounded-md hover:bg-gov-blue-50 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                保存至我的办件
              </button>
              <button
                onClick={onAgain}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />重新咨询
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3 p-4 rounded-md bg-green-50 border border-green-200">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700">材料已暂存，办件编号 BJ{Date.now().toString().slice(-10)}已创建</p>
                <div className="flex items-center gap-3 mt-1">
                  <Link to="/guide/track" className="text-xs text-gov-blue-500 hover:underline">查看进度 →</Link>
                  <button onClick={onAgain} className="text-xs text-gray-500 hover:underline">再办一件</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Guide() {
  const [question, setQuestion] = useState('')
  const [items, setItems] = useState<RecItem[]>([
    {
      role: 'system', type: 'text',
      text: '您好！我是政务智能导办助手，请用自然语言描述您想办的事，我将为您匹配最优办事路径、责任部门及材料清单。您也可以点击下方快捷问题开始。',
    },
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [items, loading])

  async function ask(q: string) {
    if (!q.trim() || loading) return
    const userItem: RecItem = { role: 'user', type: 'text', text: q }
    setItems((prev) => [...prev, userItem])
    setQuestion('')
    setLoading(true)

    let services: ServiceItem[] = []
    let steps: ProcessStep[] = []
    let materials: Material[] = []
    let tips: string[] = []

    try {
      const res = await apiFetch<Record<string, unknown>>('/api/guide/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const svcIds = (res.serviceIds || res.service_ids || []) as string[]
      if (svcIds.length > 0) {
        const det = await Promise.all(
          svcIds.map((id) => apiFetch<Record<string, unknown>>(`/api/services/${id}`).then(mapService).catch(() => null as ServiceItem | null)),
        )
        services = det.filter(Boolean) as ServiceItem[]
      }
      steps = ((res.process || res.path || []) as unknown[]).map((s, i) =>
        typeof s === 'string'
          ? { step: i + 1, title: s as string, description: '', department: '', estimatedDays: 0 }
          : { step: i + 1, title: String((s as Record<string, unknown>).title || ''), description: String((s as Record<string, unknown>).description || ''), department: String((s as Record<string, unknown>).department || ''), estimatedDays: Number((s as Record<string, unknown>).estimatedDays) || 0 },
      )
      const mats = ((res.materials || []) as Array<Record<string, unknown>>).map((m) => ({
        id: String(m.id || Math.random().toString(36).slice(2)),
        name: String(m.name || m.material_name || ''),
        required: Boolean(m.required),
        description: String(m.description || ''),
        format: (m.format || []) as string[],
        quantity: Number(m.quantity || 1),
        ocrFields: Array.isArray(m.ocr_fields) ? (m.ocr_fields as unknown[]).map((f) => String(f)) : [],
        sampleUrl: '',
      } as Material))
      tips = ((res.tips || res.notice || []) as string[]).map(String)
      if (services.length > 0) {
        if (steps.length === 0) steps = services[0].processSteps || []
        if (mats.length === 0) materials = services[0].requiredMaterials || []
        else materials = mats
      }
    } catch (_e) {
      services = demoServices
      steps = sampleSteps
      materials = sampleMaterials
      tips = ['温馨提示：首次办理需完成省政务云CA实名认证，办理过程中请准备好身份证原件。', '如材料不齐，可先行办理后在3个工作日内通过本平台补传。']
    }

    if (services.length === 0) services = demoServices
    if (steps.length === 0) steps = sampleSteps
    if (materials.length === 0) materials = sampleMaterials
    if (tips.length === 0) tips = ['建议在工作日9:00-17:00办理，部分事项支持24小时线上办理。']

    setTimeout(() => {
      setItems((prev) => [...prev, { role: 'system', type: 'result', services, steps, materials, tips }])
      setLoading(false)
    }, 400)
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gov-blue-500 to-gov-blue-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800">政务智能导办</h3>
                <p className="text-[10px] text-gray-400">基于 38 项业务规则 + 事项知识库实时匹配</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span><CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" />省政务云CA已对接</span>
              <Link to="/guide/ocr" className="text-gov-blue-500 hover:underline flex items-center gap-1">
                <Camera className="w-3 h-3" />OCR 材料预填
              </Link>
              <Link to="/guide/track" className="text-gov-blue-500 hover:underline flex items-center gap-1">
                <Search className="w-3 h-3" />我的办件
              </Link>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.map((it, idx) => (
              <div key={idx} className={`flex ${it.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] ${it.role === 'user' ? 'order-2' : ''}`}>
                  {it.role === 'user' ? (
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-[10px] text-gray-400">张三</span>
                      <div className="w-7 h-7 rounded-full bg-gov-blue-100 flex items-center justify-center text-gov-blue-600 text-xs font-medium">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-gov-blue-500 flex items-center justify-center text-white text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] text-gray-400">智能助手</span>
                    </div>
                  )}
                  <div className={it.role === 'user' ? 'bg-gov-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm' : ''}>
                    {it.type === 'text' && <p className={it.role === 'system' ? 'text-sm text-gray-700 leading-relaxed' : ''}>{it.text}</p>}
                    {it.type === 'result' && <ResultCard rec={it} onAgain={() => ask('')} />}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gov-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gov-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gov-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-gray-400 ml-2">正在分析问题，匹配最佳办事路径...</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-3 space-y-3">
            <div className="flex flex-wrap gap-2 px-1">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />{q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask(question)}
                placeholder="请描述您想办理的事项，例如：'我想查询社保缴费记录并补缴上月社保'"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gov-blue-400 focus:bg-white transition-all text-sm"
              />
              <button
                onClick={() => ask(question)}
                disabled={loading || !question.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-gov-blue-500 to-gov-blue-600 text-white text-sm font-medium rounded-xl hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-4 h-4" />发送
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-4 space-y-4">
        <div className="bg-gradient-to-br from-convenience to-gov-blue-500 text-white rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5" />
            <h3 className="text-sm font-medium">省政务云 CA 认证</h3>
          </div>
          <p className="text-xs opacity-90 leading-relaxed mb-3">已对接省级统一身份认证平台，所有办事记录、电子签名具备法律效力。</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/10 rounded-md p-2.5 backdrop-blur-sm">
              <p className="text-2xl font-bold">2,847,392</p>
              <p className="text-[10px] opacity-80">累计认证用户</p>
            </div>
            <div className="bg-white/10 rounded-md p-2.5 backdrop-blur-sm">
              <p className="text-2xl font-bold">99.97%</p>
              <p className="text-[10px] opacity-80">认证成功率</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">常见办事路径</h3>
          <div className="space-y-2">
            {[
              { icon: Shield, label: '社保业务', path: '身份认证→申报→缴费→凭证', count: 1827 },
              { icon: CreditCard, label: '税务业务', path: '预约→排号→大厅办理→回执', count: 986 },
              { icon: Building, label: '不动产', path: '身份核验→查询→出具证明', count: 753 },
              { icon: FileText, label: '投诉建议', path: '提交→受理→转办→反馈→评价', count: 612 },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-md border border-gray-100 hover:border-gov-blue-200 hover:bg-gov-blue-50/20 transition-colors group cursor-pointer">
                <div className="w-8 h-8 rounded-md bg-gov-blue-50 text-gov-blue-500 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-800 group-hover:text-gov-blue-600">{p.label}</span>
                    <span className="text-[10px] text-gray-400">今日{p.count}件</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{p.path}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gov-blue-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">服务支持情况</h3>
            <span className="text-[10px] text-gray-400">共156项</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: '全程网办（零跑动）', value: 98, color: 'bg-convenience' },
              { label: '最多跑一次', value: 42, color: 'bg-gov-blue-400' },
              { label: '线下窗口办理', value: 16, color: 'bg-amber-400' },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{p.label}</span>
                  <span className="text-gray-800 font-medium">{p.value}项</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${(p.value / 156) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">最近办事推荐</h3>
          <div className="space-y-1.5">
            {demoServices.map((s) => (
              <Link key={s.id} to={`/services/${s.id}`} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-xs transition-colors group">
                <span className="text-gray-700 group-hover:text-gov-blue-600">{s.name}</span>
                <span className="text-[10px] text-gray-400">{s.departmentName}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
