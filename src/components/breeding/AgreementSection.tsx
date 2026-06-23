import { useState } from 'react'
import { X, Signature, Handshake, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import StepFlow from '@/components/StepFlow'
import { cn } from '@/lib/utils'

const agreementSteps = [
  { label: '签署协议' },
  { label: '费用托管' },
  { label: '配种执行' },
  { label: '确认完成' },
  { label: '费用划转' },
]

interface Props {
  currentStep: number
  breeding: any
  onSign: () => void
  signing: boolean
}

export default function AgreementSection({ currentStep, breeding, onSign, signing }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-3">
      <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
        <Signature className="w-5 h-5 text-secondary" />
        配种协议
      </h3>
      <StepFlow steps={agreementSteps} currentStep={currentStep} />
      <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-between">
        <div className="text-sm text-text-secondary">
          当前阶段：<span className="text-text-primary font-medium">{agreementSteps[currentStep]?.label || '准备中'}</span>
        </div>
        {currentStep === 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-secondary-700 transition flex items-center gap-2"
          >
            <Signature className="w-4 h-4" />
            签署协议
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h4 className="heading-font text-xl font-bold text-text-primary">配种服务协议</h4>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-text-secondary">
              <div className="bg-stone-50 p-4 rounded-xl">
                <h5 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-secondary" />
                  协议双方
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">甲方（配种方）</p>
                    <p className="font-medium text-text-primary">{breeding?.owner_name || '宠物主人A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">乙方（求配方）</p>
                    <p className="font-medium text-text-primary">待撮合确认</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl">
                <h5 className="font-semibold text-text-primary mb-3">服务费用</h5>
                <p className="text-2xl font-bold text-primary">¥{(breeding?.fee || 0).toLocaleString()}</p>
                <p className="text-xs mt-1">含平台托管服务费（费用的5%）</p>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-text-primary">服务时间与地点</h5>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>配种时间：双方签署协议后30日内协商确定具体时间</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>配种地点：建议选择双方同意的正规宠物医院或配种机构</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-text-primary">幼崽所有权归属</h5>
                <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                  <p>1. 如成功受孕并产下幼崽，幼崽分配由双方协商确定</p>
                  <p>2. 常规情况下，求配方优先挑选1只，其余归配种方所有</p>
                  <p>3. 特殊品种或约定可另行协商并签署补充协议</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-text-primary">双方责任与免责声明</h5>
                <div className="bg-danger/5 p-4 rounded-xl space-y-2 border border-danger/10">
                  <p>• 甲方保证宠物健康状况良好，无传染性疾病和遗传疾病</p>
                  <p>• 乙方保证宠物符合配种适龄要求，已完成必要疫苗接种</p>
                  <p>• 配种过程中发生意外，双方应协商解决，平台不承担责任</p>
                  <p>• 如因不可抗力导致配种失败，费用全额退还乙方</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-stone-100 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary/30"
                  />
                </div>
                <span className="text-sm text-text-primary">
                  我已仔细阅读并同意上述《配种服务协议》全部条款，确认信息真实有效
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-stone-100 text-text-primary font-medium rounded-xl hover:bg-stone-200 transition"
                >
                  取消
                </button>
                <button
                  onClick={() => { if (agreed) { onSign(); setShowModal(false) } }}
                  disabled={!agreed || signing}
                  className={cn(
                    "flex-1 py-3 font-medium rounded-xl transition flex items-center justify-center gap-2",
                    agreed && !signing
                      ? "bg-secondary text-white hover:bg-secondary-700"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed"
                  )}
                >
                  {signing ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Signature className="w-4 h-4" />
                  )}
                  {signing ? '签署中...' : '确认签署协议'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
