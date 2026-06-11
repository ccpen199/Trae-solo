import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Printer,
  Download,
  Scale,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Gavel,
  ClipboardList,
  User,
  Building,
  Calendar,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConsultationStore } from '@/store/useConsultationStore'
import type { LegalCaseType } from '@/types'
import { formatDate } from '@/utils/format'

const caseTypeMap: Record<LegalCaseType, { label: string; icon: string }> = {
  marriage: { label: '婚姻家庭', icon: '💍' },
  labor: { label: '劳动纠纷', icon: '💼' },
  debt: { label: '债务纠纷', icon: '💰' },
  property: { label: '房产纠纷', icon: '🏠' },
  contract: { label: '合同纠纷', icon: '📄' },
  traffic: { label: '交通事故', icon: '🚗' },
  criminal: { label: '刑事辩护', icon: '⚖️' },
  other: { label: '其他', icon: '❓' },
}

export default function Summary() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentConsultation, getConsultation } = useConsultationStore()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await getConsultation(id)
      setLoading(false)
    }
    load()
  }, [id, getConsultation])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    alert('下载功能：实际项目中应生成 PDF 文件下载')
  }

  const consultation = currentConsultation
  const caseInfo = consultation ? caseTypeMap[consultation.caseType] : null

  const generateArchiveNumber = (timestamp: number, id: string) => {
    const date = new Date(timestamp)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const random = id.slice(-4).toUpperCase().padStart(4, '0')
    return `FL-${y}${m}${d}-${random}`
  }

  const archiveNumber = consultation
    ? generateArchiveNumber(consultation.completedAt || consultation.createdAt, consultation.id)
    : ''

  const archiveTime = consultation?.completedAt || consultation?.createdAt

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500">未找到该咨询记录</p>
        <button
          onClick={() => navigate('/consultation')}
          className="mt-4 text-blue-500 hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="h-4 w-4 text-blue-500" />
      </div>
      <h2 className="text-base font-semibold text-slate-800">{children}</h2>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-800">法律意见摘要</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  已归档
                </span>
              </div>
              <p className="text-xs text-slate-500">
                归档编号：<span className="font-mono">{archiveNumber}</span>
                {archiveTime && (
                  <>
                    <span className="mx-1 text-slate-300">|</span>
                    归档时间：{formatDate(archiveTime)}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              打印
            </button>
            <button
              onClick={handleDownload}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 pb-20 print:px-0 print:py-0">
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm print:shadow-none print:rounded-none">
          <div className="text-center border-b border-slate-200 pb-6">
            <div className="mb-2 inline-flex items-center gap-2">
              <Scale className="h-7 w-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800">法律咨询意见书</h1>
            </div>
            <p className="text-sm text-slate-500">
              Legal Consultation Opinion
            </p>
          </div>

          <div>
            <SectionTitle icon={FileText}>案件基本信息</SectionTitle>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="w-20 shrink-0 text-slate-500">归档编号</span>
                <span className="font-mono text-slate-700">{archiveNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Gavel className="h-4 w-4 text-slate-400" />
                <span className="w-20 shrink-0 text-slate-500">案由类型</span>
                <span className="text-slate-700">
                  {caseInfo?.icon} {caseInfo?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="w-20 shrink-0 text-slate-500">咨询用户</span>
                <span className="text-slate-700">用户 {consultation.userId.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-slate-400" />
                <span className="w-20 shrink-0 text-slate-500">所属地区</span>
                <span className="text-slate-700">{consultation.region}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="w-20 shrink-0 text-slate-500">咨询时间</span>
                <span className="text-slate-700">{formatDate(consultation.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="w-20 shrink-0 text-slate-500">结案时间</span>
                <span className="text-slate-700">
                  {consultation.completedAt ? formatDate(consultation.completedAt) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle icon={ClipboardList}>案件事实认定</SectionTitle>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-slate-700">咨询事项</h3>
              <p className="mb-3 text-sm font-medium text-slate-800">{consultation.title}</p>
              <h3 className="mb-2 text-sm font-medium text-slate-700">事实陈述</h3>
              <p className="text-sm leading-7 text-slate-600">{consultation.description}</p>
              {consultation.evidences.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium text-slate-700">提交证据</h3>
                  <ul className="space-y-1.5">
                    {consultation.evidences.map((ev, idx) => (
                      <li key={ev.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-xs text-blue-600">
                          {idx + 1}
                        </span>
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{ev.fileName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionTitle icon={Scale}>法律依据援引</SectionTitle>
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="rounded-lg bg-white p-3">
                <h4 className="mb-1 text-sm font-medium text-blue-700">《中华人民共和国民法典》</h4>
                <p className="text-sm leading-6 text-slate-600">
                  第三条 民事主体的人身权利、财产权利以及其他合法权益受法律保护，任何组织或者个人不得侵犯。
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <h4 className="mb-1 text-sm font-medium text-blue-700">
                  {consultation.caseType === 'labor' ? '《中华人民共和国劳动合同法》' : '《中华人民共和国民事诉讼法》'}
                </h4>
                <p className="text-sm leading-6 text-slate-600">
                  {consultation.caseType === 'labor'
                    ? '第三十条 用人单位应当按照劳动合同约定和国家规定，向劳动者及时足额支付劳动报酬。用人单位拖欠或者未足额支付劳动报酬的，劳动者可以依法向当地人民法院申请支付令，人民法院应当依法发出支付令。'
                    : '第六十七条 当事人对自己提出的主张，有责任提供证据。当事人及其诉讼代理人因客观原因不能自行收集的证据，或者人民法院认为审理案件需要的证据，人民法院应当调查收集。'}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <h4 className="mb-1 text-sm font-medium text-blue-700">相关司法解释</h4>
                <p className="text-sm leading-6 text-slate-600">
                  最高人民法院关于适用《中华人民共和国民事诉讼法》的解释相关规定，结合本案具体情况，建议当事人在诉讼时效期间内及时主张权利。
                </p>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle icon={ShieldCheck}>法律意见建议</SectionTitle>
            <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                  1
                </span>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-emerald-800">协商解决</h4>
                  <p className="text-sm leading-6 text-slate-600">
                    建议首先尝试与对方当事人友好协商，争取达成和解协议，协商解决成本低、效率高，是最优选择。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                  2
                </span>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-emerald-800">行政投诉</h4>
                  <p className="text-sm leading-6 text-slate-600">
                    如协商无果，可向相关行政主管部门投诉举报，借助行政力量推动问题解决。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                  3
                </span>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-emerald-800">调解仲裁</h4>
                  <p className="text-sm leading-6 text-slate-600">
                    可向人民调解委员会或行业调解组织申请调解，特定类型纠纷可依法申请仲裁。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                  4
                </span>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-emerald-800">诉讼途径</h4>
                  <p className="text-sm leading-6 text-slate-600">
                    如以上方式均无法解决，可向有管辖权的人民法院提起诉讼，建议聘请专业律师代理。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle icon={AlertTriangle}>风险提示</SectionTitle>
            <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="leading-6 text-slate-600">
                  <span className="font-medium text-amber-700">诉讼时效风险：</span>
                  民事权利的诉讼时效期间一般为三年，请务必在时效期间内主张权利，避免丧失胜诉权。
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="leading-6 text-slate-600">
                  <span className="font-medium text-amber-700">证据风险：</span>
                  请妥善保管相关证据原件，如证据可能灭失或以后难以取得，可向法院申请证据保全。
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="leading-6 text-slate-600">
                  <span className="font-medium text-amber-700">执行风险：</span>
                  即使胜诉，如对方无财产可供执行，可能面临判决难以实际履行的风险。
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="leading-6 text-slate-600">
                  <span className="font-medium text-amber-700">成本风险：</span>
                  诉讼需支付诉讼费、律师费等费用，请综合评估维权成本与预期收益。
                </p>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle icon={ShieldCheck}>免责声明</SectionTitle>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 rounded-md bg-white px-3 py-2">
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">档案编号：</span>
                <span className="font-mono text-xs font-medium text-slate-700">{archiveNumber}</span>
              </div>
              <p className="text-xs leading-6 text-slate-500">
                本法律意见仅基于咨询人提供的信息和现行法律法规作出，仅供参考，不构成正式法律意见或对案件结果的任何保证。
                具体案件处理应以实际事实和证据为准，建议咨询人在采取重大法律行动前，聘请专业律师进行详细分析和代理。
                本平台及提供咨询服务的律师不对因依据本意见采取行动所产生的任何后果承担法律责任。
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-slate-600">
                承办律师：<span className="font-medium">王建国 律师</span>
              </div>
              <div className="text-sm text-slate-600">
                执业机构：<span className="font-medium">北京市正义律师事务所</span>
              </div>
              <div className="text-sm text-slate-600">
                出具日期：<span className="font-medium">{formatDate(Date.now())}</span>
              </div>
              <div className="mt-4">
                <div className="relative h-24 w-48 rounded-lg border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl opacity-30">✍️</div>
                      <p className="mt-1 text-xs text-slate-400">律师签字（模拟）</p>
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-mono">
                    {archiveNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-400">
              — 本意见书一式两份，咨询人与承办律师各执一份 —
            </p>
            <p className="mt-1 text-xs text-slate-300">
              归档编号：{archiveNumber} | 生成时间：{formatDate(Date.now())}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
          <button
            onClick={() => navigate('/consultation')}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            返回咨询列表
          </button>
          <button
            onClick={handleDownload}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
          >
            <Download className="h-4 w-4" />
            导出PDF（模拟）
          </button>
        </div>
      </div>
    </div>
  )
}
