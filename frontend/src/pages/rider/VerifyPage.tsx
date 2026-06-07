import { useState } from 'react'
import { ShieldCheck, Upload, CheckCircle, ArrowRight, ArrowLeft, Shield } from 'lucide-react'
import { riders } from '../../api'
import { useAuthStore } from '../../store/auth'

type Step = 1 | 2 | 3

export default function VerifyPage() {
  const { rider, updateRider } = useAuthStore()
  const [step, setStep] = useState<Step>(rider?.real_name_verified ? 3 : 1)
  const [realName, setRealName] = useState('')
  const [idCardNo, setIdCardNo] = useState('')
  const [idCardFrontUrl, setIdCardFrontUrl] = useState('')
  const [idCardBackUrl, setIdCardBackUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [insuranceLoading, setInsuranceLoading] = useState(false)

  const handleStep1 = async () => {
    if (!realName || !idCardNo) return
    setLoading(true)
    try {
      await riders.verifyRealname({ name: realName, id_card_number: idCardNo })
      setStep(2)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async () => {
    if (!idCardFrontUrl || !idCardBackUrl) return
    setLoading(true)
    try {
      await riders.verifyIdCard({ id_card_front_url: idCardFrontUrl, id_card_back_url: idCardBackUrl })
      setStep(3)
      updateRider({ real_name_verified: true } as any)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleBindInsurance = async () => {
    setInsuranceLoading(true)
    try {
      await riders.bindInsurance({ insurance_id: 'INS' + Date.now() })
      updateRider({ insurance_id: 'bound' } as any)
    } catch {
    } finally {
      setInsuranceLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display text-2xl font-bold text-secondary">实名认证</h1>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                s < step ? 'bg-success text-white' : s === step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {s < step ? <CheckCircle size={18} /> : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${s < step ? 'bg-success' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-8 text-xs text-gray-500">
        <span className={step >= 1 ? 'text-primary font-medium' : ''}>填写信息</span>
        <span className={step >= 2 ? 'text-primary font-medium' : ''}>上传证件</span>
        <span className={step >= 3 ? 'text-primary font-medium' : ''}>认证完成</span>
      </div>

      {/* Step 1: Real Name + ID Number */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-primary" />
            <h3 className="font-display font-bold text-secondary">填写实名信息</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">真实姓名</label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="请输入您的真实姓名"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">身份证号码</label>
            <input
              type="text"
              value={idCardNo}
              onChange={(e) => setIdCardNo(e.target.value)}
              placeholder="请输入18位身份证号码"
              maxLength={18}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            />
          </div>
          <button
            onClick={handleStep1}
            disabled={loading || !realName || !idCardNo}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            下一步 <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Upload ID Card */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload size={20} className="text-primary" />
            <h3 className="font-display font-bold text-secondary">上传身份证照片</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">身份证正面照URL</label>
            <input
              type="url"
              value={idCardFrontUrl}
              onChange={(e) => setIdCardFrontUrl(e.target.value)}
              placeholder="请输入身份证正面照片链接"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">身份证反面照URL</label>
            <input
              type="url"
              value={idCardBackUrl}
              onChange={(e) => setIdCardBackUrl(e.target.value)}
              placeholder="请输入身份证反面照片链接"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> 上一步
            </button>
            <button
              onClick={handleStep2}
              disabled={loading || !idCardFrontUrl || !idCardBackUrl}
              className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              提交认证 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h3 className="font-display text-xl font-bold text-secondary mb-2">实名认证完成</h3>
            <p className="text-gray-500 text-sm">您的实名认证已通过审核</p>
          </div>

          {/* Insurance Binding */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-primary" />
              <h3 className="font-display font-bold text-secondary">保险绑定</h3>
            </div>
            {rider?.insurance_id ? (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle size={16} /> 已绑定保险
              </div>
            ) : (
              <button
                onClick={handleBindInsurance}
                disabled={insuranceLoading}
                className="w-full py-2.5 bg-secondary text-white font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {insuranceLoading ? '绑定中...' : '绑定保险'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
