import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { FileText, Shield, Check, Stamp, Upload, Clock, AlertCircle, ChevronRight, Building2 } from 'lucide-react'

const steps = [
  { key: 'read', label: '阅读合同' },
  { key: 'sign', label: '双方签署' },
  { key: 'cert', label: '银行存证' },
  { key: 'file', label: '住建备案' },
]

const clauses = [
  '出租方应保证房屋主体结构安全，设施设备正常使用，并承担自然损耗的维修责任。',
  '承租方应按约定时间支付租金及押金，逾期超过15日出租方有权解除合同。',
  '租赁期间，未经出租方书面同意，承租方不得擅自转租或改变房屋用途。',
  '押金于合同期满且房屋验收合格后15个工作日内无息退还。',
  '双方协商一致可提前解除合同，提出方应提前30日书面通知对方。',
  '因不可抗力导致合同无法履行的，双方均不承担违约责任。',
]

function BankSeal() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="animate-stamp">
      <circle cx="60" cy="60" r="54" fill="none" stroke="#C41E24" strokeWidth="3" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="#C41E24" strokeWidth="1.5" />
      <path id="topArc" d="M 18,60 A 42,42 0 0,1 102,60" fill="none" />
      <text fontSize="11" fill="#C41E24" fontFamily="serif" fontWeight="bold"><textPath href="#topArc" startOffset="50%" textAnchor="middle">中国建设银行</textPath></text>
      <path id="bottomArc" d="M 102,60 A 42,42 0 0,1 18,60" fill="none" />
      <text fontSize="9" fill="#C41E24" fontFamily="serif"><textPath href="#bottomArc" startOffset="50%" textAnchor="middle">电子存证专用章</textPath></text>
      <text x="60" y="56" textAnchor="middle" fontSize="16" fill="#C41E24" fontFamily="serif" fontWeight="bold">建行</text>
      <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#C41E24" fontFamily="serif">存证</text>
      <line x1="35" y1="80" x2="85" y2="80" stroke="#C41E24" strokeWidth="0.8" />
    </svg>
  )
}

function GovStamp() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="animate-stamp">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#C41E24" strokeWidth="2.5" />
      <circle cx="40" cy="40" r="31" fill="none" stroke="#C41E24" strokeWidth="1" />
      <path id="govTop" d="M 12,40 A 28,28 0 0,1 68,40" fill="none" />
      <text fontSize="8" fill="#C41E24" fontFamily="serif" fontWeight="bold"><textPath href="#govTop" startOffset="50%" textAnchor="middle">上海市住房和城乡建设管理委员会</textPath></text>
      <path id="govBottom" d="M 68,40 A 28,28 0 0,1 12,40" fill="none" />
      <text fontSize="7" fill="#C41E24" fontFamily="serif"><textPath href="#govBottom" startOffset="50%" textAnchor="middle">备案专用章</textPath></text>
      <text x="40" y="43" textAnchor="middle" fontSize="11" fill="#C41E24" fontFamily="serif" fontWeight="bold">住建</text>
    </svg>
  )
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-space-100 p-4">
      {steps.map((step, i) => {
        const num = i + 1
        const completed = num < currentStep
        const active = num === currentStep
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${completed ? 'bg-green-500 text-white' : active ? 'bg-ccb-500 text-white' : 'bg-space-100 text-space-400'}`}>
                {completed ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap ${completed ? 'text-green-600' : active ? 'text-ccb-600' : 'text-space-400'}`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded transition-colors ${num < currentStep ? 'bg-green-400' : 'bg-space-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Contract() {
  const navigate = useNavigate()
  const { contracts, signContract, fileContract } = useStore()
  const contract = contracts[0]
  const [readSections, setReadSections] = useState<Record<string, boolean>>({
    parties: false, property: false, terms: false, clauses: false,
  })
  const [tenantSigned, setTenantSigned] = useState(contract.signatures.tenant.signed)
  const [sealVisible, setSealVisible] = useState(contract.signatures.tenant.signed && contract.signatures.landlord.signed)
  const [filingProcessing, setFilingProcessing] = useState(false)
  const [filingDone, setFilingDone] = useState(contract.filingInfo.status === 'filed')

  const allRead = Object.values(readSections).every(Boolean)
  const bothSigned = contract.signatures.landlord.signed && tenantSigned
  const currentStep = !allRead ? 1 : !bothSigned ? 2 : !filingDone ? 4 : 5
  const toggleSection = (key: string) => setReadSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSign = () => {
    if (!allRead) return
    signContract(contract.id, 'tenant')
    setTenantSigned(true)
    setTimeout(() => setSealVisible(true), 600)
  }

  const handleFile = () => {
    setFilingProcessing(true)
    setTimeout(() => {
      fileContract(contract.id)
      setFilingProcessing(false)
      setFilingDone(true)
    }, 2000)
  }

  const cb = 'mt-1 w-4 h-4 accent-ccb-500'

  return (
    <div className="min-h-screen bg-space-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ccb-500 flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
          <h1 className="text-2xl font-serif font-semibold text-space-800">电子合同签署</h1>
        </div>
        <StepIndicator currentStep={Math.min(currentStep, 4)} />

        <div className="bg-white rounded-2xl shadow-sm border border-space-100 overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={readSections.parties} onChange={() => toggleSection('parties')} className={cb} />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-space-800 mb-3">合同双方信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-space-50 rounded-lg p-4">
                    <p className="text-xs text-space-400 mb-1">出租方（房东）</p>
                    <p className="font-medium text-space-800">建融家园</p>
                    <p className="text-sm text-space-500">ID: {contract.landlordId}</p>
                  </div>
                  <div className="bg-space-50 rounded-lg p-4">
                    <p className="text-xs text-space-400 mb-1">承租方（租客）</p>
                    <p className="font-medium text-space-800">张明</p>
                    <p className="text-sm text-space-500">ID: {contract.tenantId}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={readSections.property} onChange={() => toggleSection('property')} className={cb} />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-space-800 mb-3">房屋信息</h2>
                <div className="bg-space-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="text-space-400">地址：</span><span className="text-space-700">上海市浦东新区陆家嘴金融贸易区银城中路168号</span></p>
                  <p><span className="text-space-400">户型：</span><span className="text-space-700">2室1厅</span></p>
                  <p><span className="text-space-400">面积：</span><span className="text-space-700">68㎡</span></p>
                  <p><span className="text-space-400">楼层：</span><span className="text-space-700">18/32层</span></p>
                  <p><span className="text-space-400">朝向：</span><span className="text-space-700">南</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={readSections.terms} onChange={() => toggleSection('terms')} className={cb} />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-space-800 mb-3">租赁条款</h2>
                <div className="bg-space-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="text-space-400">月租金：</span><span className="text-space-800 font-semibold">¥{contract.monthlyRent.toLocaleString()}</span></p>
                  <p><span className="text-space-400">押金：</span><span className="text-space-800 font-semibold">¥{contract.deposit.toLocaleString()}</span></p>
                  <p><span className="text-space-400">租期：</span><span className="text-space-700">{contract.startDate} 至 {contract.endDate}</span></p>
                  <p><span className="text-space-400">支付方式：</span><span className="text-space-700">月付</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={readSections.clauses} onChange={() => toggleSection('clauses')} className={cb} />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-space-800 mb-3">条款与条件</h2>
                <ol className="space-y-2 text-sm text-space-700 list-decimal list-inside">
                  {clauses.map((c, i) => <li key={i} className="leading-relaxed">{c}</li>)}
                </ol>
              </div>
            </div>
          </div>
          {!allRead && (
            <div className="px-6 pb-4">
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />请确认阅读所有合同条款后继续
              </p>
            </div>
          )}
        </div>

        {allRead && (
          <div className="bg-white rounded-2xl shadow-sm border border-space-100 p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-space-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-ccb-500" />合同签署
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-space-200 rounded-xl p-4 text-center">
                <p className="text-sm text-space-400 mb-3">房东签署</p>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="text-sm text-green-600 font-medium">已签署</p>
                  <p className="text-xs text-space-400">{new Date(contract.signatures.landlord.timestamp).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <div className="border border-space-200 rounded-xl p-4 text-center">
                <p className="text-sm text-space-400 mb-3">租客签署</p>
                {tenantSigned ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">已签署</p>
                  </div>
                ) : (
                  <button onClick={handleSign} className="w-full h-20 border-2 border-dashed border-ccb-300 text-ccb-500 hover:bg-ccb-50 rounded-lg flex items-center justify-center transition-all cursor-pointer">
                    <span className="text-sm font-medium">点击签署</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {sealVisible && (
          <div className="bg-white rounded-2xl shadow-sm border border-space-100 p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-space-800 mb-4 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-red-500" />建行电子存证
            </h2>
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0"><BankSeal /></div>
              <div className="space-y-3 text-sm flex-1">
                <div><p className="text-space-400">存证编号</p><p className="font-mono text-space-800">{contract.bankCertificate.certificateNo}</p></div>
                <div><p className="text-space-400">区块链哈希</p><p className="font-mono text-space-800">{contract.bankCertificate.hash}</p></div>
                <div><p className="text-space-400">存证时间</p><p className="text-space-800">{new Date(contract.bankCertificate.timestamp).toLocaleString('zh-CN')}</p></div>
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-medium text-red-700 mb-1">存证说明</p>
                  <p className="text-xs text-red-600 leading-relaxed">本合同已通过中国建设银行电子存证系统完成区块链存证，存证数据不可篡改，具有法律效力。</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {sealVisible && (
          <div className="bg-white rounded-2xl shadow-sm border border-space-100 p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-space-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold-500" />住建部备案
            </h2>
            {filingProcessing ? (
              <div className="flex flex-col items-center py-6 gap-4">
                <div className="flex items-center gap-3 text-yellow-600">
                  <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">处理中...</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 line-through">待备案</span>
                  <span className="text-space-300">→</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-600 font-medium animate-pulse">处理中</span>
                  <span className="text-space-300">→</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-400">已备案</span>
                </div>
              </div>
            ) : filingDone ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-50">已备案</span>
                  <div className="flex items-center gap-1 text-xs text-space-400">
                    <Clock className="w-3.5 h-3.5" /><span>{new Date(contract.filingInfo.filedAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex items-start gap-6 p-4 bg-space-50 rounded-xl">
                  <div className="flex-shrink-0"><GovStamp /></div>
                  <div className="space-y-3 text-sm flex-1">
                    <div><p className="text-space-400">备案编号</p><p className="font-mono text-space-800 font-medium">{contract.filingInfo.filingNo}</p></div>
                    <div><p className="text-space-400">备案日期</p><p className="text-space-800">{new Date(contract.filingInfo.filedAt).toLocaleDateString('zh-CN')}</p></div>
                    <div><p className="text-space-400">审核结果</p><p className="text-green-600 font-medium">通过</p></div>
                    <div><p className="text-space-400">审核意见</p><p className="text-space-700 leading-relaxed">{contract.filingInfo.reviewComments}</p></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-sm font-medium text-yellow-600 bg-yellow-50">待备案</span>
                <button onClick={handleFile} className="px-5 py-2 bg-ccb-500 text-white rounded-lg text-sm font-medium hover:bg-ccb-600 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />提交备案
                </button>
              </div>
            )}
          </div>
        )}

        {filingDone && (
          <button onClick={() => navigate('/payment')} className="w-full py-3 bg-ccb-500 text-white rounded-xl text-sm font-medium hover:bg-ccb-600 transition-colors flex items-center justify-center gap-2 animate-fade-in">
            前往支付租金<ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
