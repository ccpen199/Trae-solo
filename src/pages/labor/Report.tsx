import { useState, useRef } from 'react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { Upload, X, CheckCircle } from 'lucide-react'

export default function Report() {
  const addLog = useAppStore((s) => s.addLog)
  const [companyName, setCompanyName] = useState('')
  const [creditCode, setCreditCode] = useState('')
  const [amount, setAmount] = useState('')
  const [months, setMonths] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [anonymous, setAnonymous] = useState(true)
  const [phone, setPhone] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [workOrderNo, setWorkOrderNo] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileAdd = () => {
    const fakeNames = ['工资条.pdf', '银行流水.png', '考勤记录.docx', '微信截图.jpg', '劳动合同.pdf']
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)]
    if (!files.includes(name)) {
      setFiles([...files, name])
    }
  }

  const handleFileRemove = (name: string) => {
    setFiles(files.filter((f) => f !== name))
  }

  const handleSubmit = () => {
    const no = `WO${Date.now()}`
    setWorkOrderNo(no)
    setShowSuccess(true)
    addLog('提交欠薪线索举报', '劳动维权')
  }

  const isFormValid = companyName.trim() && creditCode.trim() && amount && months && files.length > 0 && (anonymous || phone.trim())

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gov-text mb-2">举报提交成功</h2>
          <p className="text-gov-muted mb-4">您的欠薪线索已成功提交，我们将尽快处理</p>
          <div className="gov-card p-4 mb-6">
            <p className="text-sm text-gov-muted">工单编号</p>
            <p className="text-lg font-bold text-primary-500 mt-1">{workOrderNo}</p>
          </div>
          <p className="text-sm text-gov-muted">您可在"我的举报记录"中查看处理进度</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="gov-section-title">欠薪线索直报</h2>
        <p className="text-gov-muted text-sm mt-2 pl-4">如实填写欠薪线索信息，我们将依法处理</p>
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          企业信息
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gov-text mb-1.5">企业名称</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="请输入欠薪企业全称"
              className="gov-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gov-text mb-1.5">统一社会信用代码</label>
            <input
              type="text"
              value={creditCode}
              onChange={(e) => setCreditCode(e.target.value)}
              placeholder="请输入18位统一社会信用代码"
              className="gov-input"
            />
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-accent-500 rounded-full" />
          欠薪情况
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gov-text mb-1.5">欠薪金额（元）</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入欠薪金额"
              className="gov-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gov-text mb-1.5">欠薪月数</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="请输入欠薪月数"
              className="gov-input"
            />
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-green-500 rounded-full" />
          证据材料
        </h3>
        <div
          onClick={handleFileAdd}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
        >
          <Upload className="w-8 h-8 text-gov-muted mx-auto mb-2" />
          <p className="text-sm text-gov-muted">拖拽或点击上传</p>
          <p className="text-xs text-gov-muted mt-1">支持 PDF、图片、Word 等格式</p>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" />
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((f) => (
              <div key={f} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gov-text">{f}</span>
                <button onClick={() => handleFileRemove(f)} className="text-gov-muted hover:text-gov-error transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
          举报方式
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gov-text">匿名举报</span>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              anonymous ? 'bg-primary-500' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                anonymous ? 'left-0.5' : 'left-[26px]'
              )}
            />
          </button>
          <span className="text-sm text-gov-text">实名举报</span>
        </div>
      </div>

      {!anonymous && (
        <div className="gov-card p-6 animate-slide-up">
          <h3 className="font-semibold text-gov-text mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
            联系方式
          </h3>
          <div>
            <label className="block text-sm font-medium text-gov-text mb-1.5">联系电话</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入您的手机号码"
              className="gov-input"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={cn(
            'px-8 py-2.5 rounded-lg font-medium text-white transition-all duration-200',
            isFormValid
              ? 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 shadow-sm hover:shadow-md active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          提交举报
        </button>
      </div>
    </div>
  )
}
