import { useState, useRef, useEffect } from 'react'
import { contractTemplates } from '@/mocks/labor'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { Check, FileText } from 'lucide-react'

const contractText = `甲方（用人单位）：________________\n乙方（劳动者）：________________\n\n根据《中华人民共和国劳动合同法》及相关法律法规，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同，并共同遵守以下条款：\n\n第一条 合同期限\n本合同为固定期限劳动合同，自____年____月____日起至____年____月____日止。其中试用期为____个月，自____年____月____日起至____年____月____日止。\n\n第二条 工作内容与工作地点\n甲方安排乙方在____部门担任____岗位工作，工作地点为____。甲方根据工作需要及乙方能力，经双方协商可以变更乙方的工作岗位和工作地点。\n\n第三条 工作时间与休息休假\n甲方实行标准工时制度，即每日工作8小时，每周工作40小时，每周至少休息一日。甲方因生产经营需要，经与乙方协商后可以延长工作时间，但应按照法律规定支付加班工资。`

const highlightedClauses = [
  '试用期内，甲方支付乙方的工资不得低于本岗位最低档工资的80%，并不得低于甲方所在地的最低工资标准。',
  '甲方未按时足额支付乙方劳动报酬的，乙方有权要求甲方按应付金额百分之百支付，并加付赔偿金。',
  '甲方违法解除或终止本合同的，应当依照法律规定向乙方支付赔偿金。',
]

export default function Contract() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const addLog = useAppStore((s) => s.addLog)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1A4B8C'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [selectedTemplate])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signed) return
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getMousePos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signed) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getMousePos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleSign = () => {
    if (!hasSignature) return
    setSigned(true)
    addLog('签署劳动合同', '劳动维权')
  }

  const handleReset = () => {
    setSigned(false)
    setHasSignature(false)
    setSelectedTemplate(null)
  }

  if (!selectedTemplate) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="gov-section-title">劳动合同签署</h2>
          <p className="text-gov-muted text-sm mt-2 pl-4">选择合同模板，在线完成电子签署</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {contractTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className="gov-card p-6 text-left cursor-pointer group hover:border-primary-500"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <FileText className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gov-text mb-2">{t.name}</h3>
              <p className="text-sm text-gov-muted">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const templateName = contractTemplates.find((t) => t.id === selectedTemplate)?.name

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="gov-section-title">合同预览与签署</h2>
          <p className="text-gov-muted text-sm mt-2 pl-4">模板：{templateName}</p>
        </div>
        {!signed && (
          <button onClick={handleReset} className="gov-btn-secondary text-sm">
            重新选择
          </button>
        )}
      </div>

      <div className="gov-card p-6">
        <h3 className="font-serif text-lg font-semibold text-gov-text mb-4">{templateName}</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-sm text-gov-text leading-relaxed whitespace-pre-line">
          {contractText}
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-4">重点条款提示</h3>
        <div className="space-y-3">
          {highlightedClauses.map((clause, i) => (
            <div key={i} className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
              <p className="text-sm text-gov-text">{clause}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-4">签名区域</h3>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={cn(
              'w-full h-32 border-2 border-dashed rounded-lg bg-white cursor-crosshair',
              signed ? 'border-green-300 cursor-default' : 'border-primary-300'
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {!hasSignature && !signed && (
            <p className="absolute inset-0 flex items-center justify-center text-gov-muted text-sm pointer-events-none">
              请在此处签名
            </p>
          )}
          {signed && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center rotate-[-15deg]">
                <span className="text-red-500 font-serif font-bold text-lg">已签署</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {signed ? (
          <div className="flex items-center gap-3 animate-slide-up">
            <div className="flex items-center gap-2 text-gov-success">
              <Check className="w-5 h-5" />
              <span className="font-medium">合同签署成功</span>
            </div>
            <button onClick={handleReset} className="gov-btn-secondary">
              返回重选
            </button>
          </div>
        ) : (
          <button
            onClick={handleSign}
            disabled={!hasSignature}
            className={cn(
              'px-8 py-2.5 rounded-lg font-medium text-white transition-all duration-200',
              hasSignature
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-sm hover:shadow-md active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            确认签署
          </button>
        )}
      </div>
    </div>
  )
}
