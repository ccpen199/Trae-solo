import { useEffect, useState } from 'react'
import {
  FileText, Layers, TrendingUp, ChevronDown, ChevronRight,
  Merge, CheckCircle2, AlertCircle, Wand2, ArrowRight, BarChart4, Eye,
  Users, FileCheck, Clock, Download, Upload,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from 'recharts'
import { apiFetch } from '@/utils/api'
import type { MaterialReduction } from '@/types'

const reductionTrend = [
  { month: '1月', reductionRate: 32, mergedFields: 42, savedSubmissions: 1820, perCapita: 1.8 },
  { month: '2月', reductionRate: 35, mergedFields: 48, savedSubmissions: 2150, perCapita: 1.9 },
  { month: '3月', reductionRate: 38, mergedFields: 55, savedSubmissions: 2540, perCapita: 2.1 },
  { month: '4月', reductionRate: 42, mergedFields: 68, savedSubmissions: 3010, perCapita: 2.4 },
  { month: '5月', reductionRate: 46, mergedFields: 78, savedSubmissions: 3620, perCapita: 2.8 },
  { month: '6月', reductionRate: 51, mergedFields: 92, savedSubmissions: 4280, perCapita: 3.2 },
]

interface FieldDup {
  id: string
  fieldName: string
  fieldType: '身份' | '户籍' | '银行' | '联系' | '房产' | '工作' | '其他'
  repeatCount: number
  occurrenceServices: string[]
  totalAnnualSavings: number
  avgPerSubmission: number
  sourceMaterials: { service: string; material: string }[]
  lastModified: string
  merged: boolean
  mergedBy?: string
}

const defaultDups: FieldDup[] = [
  { id: 'f-001', fieldName: '居民身份证号', fieldType: '身份', repeatCount: 18, occurrenceServices: ['社保缴纳', '公积金提取', '税务预约', '不动产查询', '违章处理', '户籍办理'], totalAnnualSavings: 38200, avgPerSubmission: 18, sourceMaterials: [{ service: '社保', material: '身份证正面' }, { service: '公积金', material: '身份证' }, { service: '不动产', material: '权属人身份证' }], lastModified: '2026-06-08 10:32', merged: true, mergedBy: '系统自动' },
  { id: 'f-002', fieldName: '姓名（中文）', fieldType: '身份', repeatCount: 16, occurrenceServices: ['社保缴纳', '公积金提取', '营业执照办理', '投诉反馈'], totalAnnualSavings: 31500, avgPerSubmission: 15, sourceMaterials: [{ service: '社保', material: '个人信息表' }, { service: '税务', material: '纳税申报表' }], lastModified: '2026-06-08 10:32', merged: true, mergedBy: '系统自动' },
  { id: 'f-003', fieldName: '现居住地址', fieldType: '户籍', repeatCount: 12, occurrenceServices: ['社保缴纳', '户籍办理', '不动产查询', '营业执照办理'], totalAnnualSavings: 24800, avgPerSubmission: 12, sourceMaterials: [{ service: '户籍', material: '常住人口登记表' }, { service: '不动产', material: '房屋买卖合同' }], lastModified: '2026-06-08 10:32', merged: false },
  { id: 'f-004', fieldName: '联系电话（手机）', fieldType: '联系', repeatCount: 11, occurrenceServices: ['水电气缴费', '税务预约', '投诉反馈', '违章处理'], totalAnnualSavings: 22100, avgPerSubmission: 11, sourceMaterials: [{ service: '水务', material: '开户申请表' }, { service: '供电', material: '用电申请书' }], lastModified: '2026-06-08 10:32', merged: false },
  { id: 'f-005', fieldName: '银行卡号（一类）', fieldType: '银行', repeatCount: 9, occurrenceServices: ['社保缴纳', '公积金提取', '水费缴纳'], totalAnnualSavings: 18600, avgPerSubmission: 9, sourceMaterials: [{ service: '公积金', material: '银行借记卡' }, { service: '社保', material: '社保卡关联卡' }], lastModified: '2026-06-08 10:32', merged: false },
  { id: 'f-006', fieldName: '工作单位名称', fieldType: '工作', repeatCount: 7, occurrenceServices: ['社保缴纳', '公积金提取', '税务预约'], totalAnnualSavings: 15200, avgPerSubmission: 7, sourceMaterials: [{ service: '社保', material: '在职证明' }, { service: '税务', material: '收入证明' }], lastModified: '2026-06-08 10:32', merged: false },
  { id: 'f-007', fieldName: '户籍地址', fieldType: '户籍', repeatCount: 6, occurrenceServices: ['户籍办理', '营业执照办理'], totalAnnualSavings: 12100, avgPerSubmission: 6, sourceMaterials: [{ service: '公安', material: '户口簿首页' }, { service: '市监', material: '法人身份材料' }], lastModified: '2026-06-08 10:32', merged: false },
  { id: 'f-008', fieldName: '房屋坐落（详细地址）', fieldType: '房产', repeatCount: 5, occurrenceServices: ['不动产查询', '公积金提取', '水费缴纳'], totalAnnualSavings: 9800, avgPerSubmission: 5, sourceMaterials: [{ service: '自然资源局', material: '不动产权证书' }, { service: '水务', material: '用水地点证明' }], lastModified: '2026-06-08 10:32', merged: false },
]

export default function Material() {
  const [items, setItems] = useState<FieldDup[]>(defaultDups)
  const [expanded, setExpanded] = useState<string | null>('f-003')
  const [selectedId, setSelectedId] = useState<string>('f-003')
  const [totalFields, setTotalFields] = useState(0)
  const [mergedCount, setMergedCount] = useState(0)
  const [savingAnnual, setSavingAnnual] = useState(0)

  useEffect(() => {
    apiFetch<{ reductions?: MaterialReduction[]; summary?: Record<string, unknown> }>('/api/monitor/material-reduction')
      .then((d) => {
        const r = d.reductions || (Array.isArray(d) ? (d as unknown as MaterialReduction[]) : [])
        if (r.length) {
          setTotalFields(Number((d.summary?.totalFields as number) || r.length * 3))
          setMergedCount(Number((d.summary?.mergedFields as number) || Math.floor(r.length * 0.4)))
          setSavingAnnual(Number((d.summary?.annualSavings as number) || 180000))
        }
      }).catch(() => {})
    setTotalFields(312); setMergedCount(92); setSavingAnnual(172300)
  }, [])

  const selected = items.find((x) => x.id === selectedId) || items[0]

  function doMerge(id: string) {
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, merged: true, mergedBy: '管理员操作', lastModified: new Date().toLocaleString('zh-CN').slice(0, 16) } : x))
    setMergedCount((c) => c + 1)
    const it = items.find((x) => x.id === id)
    if (it) setSavingAnnual((s) => s + it.totalAnnualSavings)
  }

  function doMergeAll() {
    setItems((prev) => prev.map((x) => x.merged ? x : { ...x, merged: true, mergedBy: '批量合并', lastModified: new Date().toLocaleString('zh-CN').slice(0, 16) }))
    const add = items.filter((x) => !x.merged).reduce((s, x) => s + x.totalAnnualSavings, 0)
    setMergedCount(items.length); setSavingAnnual((s) => s + add)
  }

  const pending = items.filter((x) => !x.merged).length
  const typeColors: Record<string, string> = {
    身份: 'bg-gov-blue-100 text-gov-blue-700',
    户籍: 'bg-purple-100 text-purple-700',
    银行: 'bg-green-100 text-green-700',
    联系: 'bg-amber-100 text-amber-700',
    房产: 'bg-pink-100 text-pink-700',
    工作: 'bg-convenience/20 text-convenience',
    其他: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '已识别重复字段', value: items.length, unit: '组', icon: FileText, cls: 'from-gov-blue-500 to-gov-blue-600', sub: `覆盖 ${totalFields} 个字段` },
          { label: '已合并共享字段', value: mergedCount, unit: '项', icon: CheckCircle2, cls: 'from-convenience to-teal-500', sub: `合并率 ${Math.round((mergedCount / Math.max(totalFields, 1)) * 100)}%` },
          { label: '年度节省提交量', value: savingAnnual.toLocaleString(), unit: '次', icon: Upload, cls: 'from-purple-500 to-gov-blue-500', sub: `人均减填 ${reductionTrend[reductionTrend.length - 1].perCapita} 项/办件` },
          { label: '待合并建议', value: pending, unit: '组', icon: AlertCircle, cls: 'from-amber-500 to-alert', sub: `预计节省 ${items.filter(x => !x.merged).reduce((s, x) => s + x.totalAnnualSavings, 0).toLocaleString()} 次/年` },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.cls} text-white rounded-lg p-5 shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs opacity-90 mb-1.5"><s.icon className="w-3.5 h-3.5" />{s.label}</div>
                <p className="text-3xl font-bold leading-tight">{s.value}<span className="text-sm opacity-80 ml-1">{s.unit}</span></p>
                <p className="text-[10px] opacity-80 mt-2">{s.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-blue-500" />重复字段识别 · 分析列表
            </h3>
            <button
              onClick={doMergeAll}
              disabled={pending === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-gradient-to-r from-gov-blue-500 to-gov-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow transition-shadow shadow-sm"
            >
              <Merge className="w-3 h-3" />一键合并全部建议
            </button>
          </div>
          <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
            {items.map((f) => {
              const exp = expanded === f.id
              const isSel = selectedId === f.id
              return (
                <div
                  key={f.id}
                  className={`rounded-md border transition-all ${
                    isSel ? 'border-gov-blue-300 bg-gov-blue-50/40 shadow-sm' : 'border-gray-100 bg-white hover:border-gov-blue-100'
                  }`}
                >
                  <button
                    onClick={() => { setExpanded(exp ? null : f.id); setSelectedId(f.id) }}
                    className="w-full flex items-center gap-2 p-3 text-left"
                  >
                    {exp ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                    <div className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium flex-shrink-0 ${f.merged ? 'bg-convenience/15 text-convenience' : 'bg-amber-50 text-amber-700'}`}>
                      {f.merged ? <CheckCircle2 className="w-3.5 h-3.5" /> : f.repeatCount}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">{f.fieldName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[f.fieldType]}`}>{f.fieldType}</span>
                        {f.merged
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />已合并</span>
                          : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">建议合并</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        出现在 {f.occurrenceServices.length} 个服务 · {f.repeatCount} 处重复 · 年节省 {f.totalAnnualSavings.toLocaleString()} 次提交
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                  </button>
                  {exp && (
                    <div className="px-3 pb-3 pt-1 ml-8 space-y-2.5 border-t border-gray-50/80">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-gray-400 flex-shrink-0 w-14">涉及服务</span>
                        <div className="flex-1 flex flex-wrap gap-1">
                          {f.occurrenceServices.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] border border-gray-100">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-gray-400 flex-shrink-0 w-14">来源材料</span>
                        <div className="flex-1 space-y-1">
                          {f.sourceMaterials.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 text-gray-600">
                              <FileText className="w-3 h-3 text-gov-blue-400 flex-shrink-0" />
                              <span className="text-gov-blue-600 w-12">{m.service}</span>
                              <span className="text-gray-500">→ {m.material}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{f.lastModified}</span>
                          {f.mergedBy && <span>合并人：{f.mergedBy}</span>}
                        </div>
                        {!f.merged && (
                          <div className="flex items-center gap-1.5">
                            <button className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded border border-gray-200 text-gray-600 hover:bg-gray-50"><Eye className="w-2.5 h-2.5" />预览</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); doMerge(f.id) }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded bg-convenience text-white hover:opacity-90 shadow-sm"
                            >
                              <Wand2 className="w-2.5 h-2.5" />执行合并
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-convenience" />合并建议详情
            <span className="ml-auto text-[10px] text-gray-400 font-normal">字段ID {selected?.id}</span>
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-convenience/10 via-gov-blue-50/50 to-gov-blue-50 rounded-lg p-4 border border-gov-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">目标字段</p>
                  <p className="text-lg font-bold text-gray-800">{selected?.fieldName}</p>
                </div>
                <div className={`px-2 py-0.5 text-xs rounded ${typeColors[selected?.fieldType || '其他']}`}>{selected?.fieldType}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/70 rounded p-2">
                  <p className="text-[10px] text-gray-400">重复次数</p>
                  <p className="text-lg font-bold text-gov-blue-600">{selected?.repeatCount}</p>
                </div>
                <div className="bg-white/70 rounded p-2">
                  <p className="text-[10px] text-gray-400">年均节省</p>
                  <p className="text-lg font-bold text-convenience">{(selected?.totalAnnualSavings || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/70 rounded p-2">
                  <p className="text-[10px] text-gray-400">覆盖服务</p>
                  <p className="text-lg font-bold text-alert">{selected?.occurrenceServices.length}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Users className="w-3 h-3" />跨委办局影响评估</p>
              <div className="space-y-1.5">
                {[
                  { dept: '人社局', before: 3, after: 1, saving: 67 },
                  { dept: '住建局', before: 2, after: 1, saving: 50 },
                  { dept: '税务局', before: 2, after: 1, saving: 50 },
                  { dept: '自然资源局', before: 2, after: 1, saving: 50 },
                  { dept: '市监局', before: 1, after: 0, saving: 100 },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] p-2 rounded bg-gray-50/60">
                    <span className="w-20 text-gray-700">{d.dept}</span>
                    <span className="font-mono text-gray-500">{d.before}次</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span className={`font-mono font-medium ${d.after === 0 ? 'text-convenience' : 'text-gov-blue-600'}`}>{d.after}次</span>
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-convenience/10 text-convenience text-[10px] font-medium">-{d.saving}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><BarChart4 className="w-3 h-3" />合并方案</p>
              <div className="space-y-2 p-3 rounded-md bg-gov-blue-50/50 border border-gov-blue-100 text-xs text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gov-blue-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                  <p>将身份证号字段纳入<span className="text-gov-blue-600 font-medium">省政务中台共享库</span>，并建立跨委办局字段映射索引。</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gov-blue-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                  <p>市民一次提交后自动同步至各业务系统，后续办件自动预填，<span className="text-convenience font-medium">无需重复上传身份证扫描件</span>。</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gov-blue-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                  <p>接入省CA电子证照库，材料自动比对，<span className="text-alert font-medium">异常告警</span>，确保合规性。</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {!selected?.merged && (
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-gradient-to-r from-gov-blue-500 to-gov-blue-600 text-white text-sm font-medium hover:shadow-md shadow-sm">
                  <Merge className="w-4 h-4" />确认合并此建议
                </button>
              )}
              {selected?.merged && (
                <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" />已合并至电子证照共享库
                </div>
              )}
              <button className="flex items-center gap-1 px-3 py-2 rounded-md border border-gray-200 text-gray-600 text-xs hover:bg-gray-50">
                <Download className="w-3.5 h-3.5" />导出报告
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-medium text-gray-800 mb-3">减免率趋势（6个月）</h4>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={reductionTrend}>
                <defs>
                  <linearGradient id="rr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2EC4B6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2EC4B6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="reductionRate" stroke="#2EC4B6" strokeWidth={2} fill="url(#rr)" name="减免率(%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-medium text-gray-800 mb-3">已合并字段数量</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={reductionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="mergedFields" stroke="#1A5FB4" strokeWidth={2} dot={{ r: 3, fill: '#1A5FB4' }} name="合并字段数" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-convenience" />月度节省提交量
            </h4>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={reductionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="savedSubmissions" fill="#4787DF" radius={[3, 3, 0, 0]} name="节省次数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
