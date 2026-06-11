import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle, Loader2, ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/store'

const steps = ['基本信息', '材料上传', '确认提交', '提交成功']

interface FormData {
  category: string
  currentTitle: string
  level: string
  experience: string
  materials: Record<string, { uploaded: boolean; ocrData: Record<string, string> | null }>
}

const materialTypes = [
  { key: 'id_card', label: '身份证', demoOcr: { name: '张伟', idCard: '4401061990****2518' } },
  { key: 'certificate', label: '职称证书', demoOcr: { title: '工程师', issueDate: '2020-06' } },
  { key: 'work_proof', label: '工作证明', demoOcr: { company: '广东省建筑设计研究院', years: '6' } },
  { key: 'education', label: '学历证书', demoOcr: { school: '华南理工大学', degree: '硕士' } },
]

const initFormData: FormData = {
  category: '',
  currentTitle: '',
  level: '',
  experience: '',
  materials: Object.fromEntries(materialTypes.map((m) => [m.key, { uploaded: false, ocrData: null }])),
}

export default function Declare() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initFormData)
  const [ocrLoading, setOcrLoading] = useState<string | null>(null)
  const navigate = useNavigate()
  const addLog = useAppStore((s) => s.addLog)

  const updateForm = (patch: Partial<FormData>) => setForm((prev) => ({ ...prev, ...patch }))

  const simulateOcr = (key: string, demoOcr: Record<string, string>) => {
    setOcrLoading(key)
    setTimeout(() => {
      setForm((prev) => ({
        ...prev,
        materials: {
          ...prev.materials,
          [key]: { uploaded: true, ocrData: demoOcr },
        },
      }))
      setOcrLoading(null)
    }, 1200)
  }

  const handleSubmit = () => {
    addLog('提交职称申报材料', '人才服务')
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-gov-bg p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/talent')} className="flex items-center gap-1 text-gov-muted hover:text-primary-500 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>

        <div className="gov-card p-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                    i < step ? 'bg-gov-success text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`mt-1.5 text-xs ${i <= step ? 'text-primary-600 font-medium' : 'text-gov-muted'}`}>{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mt-[-18px] ${i < step ? 'bg-gov-success' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1.5">申报类别</label>
                <select value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="gov-input">
                  <option value="">请选择申报类别</option>
                  <option value="工程技术">工程技术</option>
                  <option value="教育">教育</option>
                  <option value="医疗卫生">医疗卫生</option>
                  <option value="农业技术">农业技术</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1.5">现有职称</label>
                <input type="text" value={form.currentTitle} onChange={(e) => updateForm({ currentTitle: e.target.value })} className="gov-input" placeholder="请输入现有职称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1.5">申报层级</label>
                <select value={form.level} onChange={(e) => updateForm({ level: e.target.value })} className="gov-input">
                  <option value="">请选择申报层级</option>
                  <option value="初级">初级</option>
                  <option value="中级">中级</option>
                  <option value="副高级">副高级</option>
                  <option value="正高级">正高级</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gov-text mb-1.5">工作经历</label>
                <textarea value={form.experience} onChange={(e) => updateForm({ experience: e.target.value })} className="gov-input min-h-[100px] resize-y" placeholder="请简要描述工作经历" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {materialTypes.map((mt) => (
                <div key={mt.key} className="border border-gov-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gov-text">{mt.label}</span>
                    {form.materials[mt.key].uploaded && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-gov-success rounded-full">已上传</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-gov-border rounded-lg text-gov-muted hover:border-primary-400 hover:text-primary-500 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">选择文件</span>
                    </button>
                    <button
                      onClick={() => simulateOcr(mt.key, mt.demoOcr)}
                      disabled={ocrLoading === mt.key}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      {ocrLoading === mt.key ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {ocrLoading === mt.key ? '识别中...' : 'OCR识别'}
                    </button>
                  </div>
                  {form.materials[mt.key].ocrData && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      {Object.entries(form.materials[mt.key].ocrData!).map(([k, v]) => (
                        <div key={k} className="flex gap-2 py-0.5">
                          <span className="text-gov-muted">{k}:</span>
                          <span className="text-gov-text">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium text-gov-text text-lg mb-2">请确认以下信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gov-muted">申报类别</span>
                  <p className="text-gov-text font-medium mt-0.5">{form.category || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gov-muted">现有职称</span>
                  <p className="text-gov-text font-medium mt-0.5">{form.currentTitle || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gov-muted">申报层级</span>
                  <p className="text-gov-text font-medium mt-0.5">{form.level || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gov-muted">工作经历</span>
                  <p className="text-gov-text font-medium mt-0.5 line-clamp-2">{form.experience || '-'}</p>
                </div>
              </div>
              <div className="border-t border-gov-border pt-4">
                <span className="text-sm text-gov-muted">材料上传状态</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {materialTypes.map((mt) => (
                    <span key={mt.key} className={`text-xs px-2.5 py-1 rounded-full ${form.materials[mt.key].uploaded ? 'bg-green-100 text-gov-success' : 'bg-gray-100 text-gray-500'}`}>
                      {mt.label}: {form.materials[mt.key].uploaded ? '已上传' : '未上传'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-10 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gov-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-gov-success" />
              </div>
              <h3 className="text-xl font-semibold text-gov-text mb-2">提交成功</h3>
              <p className="text-gov-muted text-sm mb-6">您的申报材料已成功提交，请耐心等待审核</p>
              <button onClick={() => navigate('/talent')} className="gov-btn-primary">返回首页</button>
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between mt-8 pt-5 border-t border-gov-border">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="gov-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一步
              </button>
              {step < 2 ? (
                <button onClick={() => setStep((s) => s + 1)} className="gov-btn-primary">下一步</button>
              ) : (
                <button onClick={handleSubmit} className="gov-btn-primary">提交申报</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
