import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  QrCode,
  Play,
  User,
  CheckCircle2,
  Eraser,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

export default function DriverWaybill() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setHasSignature(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <h1 className="text-base font-bold text-gray-900">电子运单</h1>
          <Tag color="orange" size="sm" className="ml-auto">运输中</Tag>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-amber-50/50 rounded-2xl p-5 border-2 border-amber-200 shadow-lg overflow-hidden"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.03) 10px, rgba(251, 191, 36, 0.03) 20px)
            `,
          }}
        >
          <div className="absolute top-4 right-4">
            <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
              <QrCode className="w-16 h-16 text-gray-800" />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Waybill No.</p>
            <p className="text-xl font-bold text-gray-900 font-mono tracking-tight">CYT{id || '202406150001'}</p>
          </div>

          <div className="space-y-3 pr-24">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500">装货地 Pickup</p>
                <p className="text-sm font-medium text-gray-900">朝阳区望京SOHO地下车库B2</p>
              </div>
            </div>
            <div className="ml-1 w-px h-4 bg-gray-300" />
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500">卸货地 Delivery</p>
                <p className="text-sm font-medium text-gray-900">海淀区中关村软件园二期8号楼</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="!p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                货物信息
              </h3>
            </div>
            <div className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['货物名称', '电子产品（手机、笔记本）'],
                    ['货物类型', '精密仪器'],
                    ['包装方式', '纸箱+木架'],
                    ['重量', '2.5 吨'],
                    ['体积', '12 立方'],
                    ['件数', '48 件'],
                  ].map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2.5 text-gray-500 w-24">{label}</td>
                      <td className="px-4 py-2.5 text-gray-900 font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="!p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-500" />
                运输信息
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">车牌号</p>
                  <p className="text-sm font-bold text-gray-900">京A·88888</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">司机</p>
                  <p className="text-sm font-bold text-gray-900">王师傅 · 138****8888</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-500">运费</p>
                  <p className="text-sm font-bold text-orange-600">¥680.00</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-500">运输里程</p>
                  <p className="text-sm font-bold text-gray-900">18.5 km</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="text-sm font-bold text-gray-900 mb-3">电子签章</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: '货主', signed: true, color: 'green' },
                { label: '承运方', signed: true, color: 'green' },
                { label: '收货方', signed: false, color: 'gray' },
              ].map((sign) => (
                <div
                  key={sign.label}
                  className={`rounded-xl p-2.5 text-center border ${
                    sign.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 mx-auto mb-1 ${
                      sign.signed ? 'text-green-500' : 'text-gray-300'
                    }`}
                  />
                  <p className={`text-xs font-medium ${sign.signed ? 'text-green-700' : 'text-gray-500'}`}>
                    {sign.label}
                  </p>
                  <p className="text-[10px] mt-0.5">
                    {sign.signed ? '已签章' : '待签章'}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700">司机签名</p>
                <button
                  onClick={clearSignature}
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-red-500"
                >
                  <Eraser className="w-3 h-3" />
                  清除
                </button>
              </div>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={120}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              {!hasSignature && (
                <p className="text-xs text-gray-400 text-center mt-2">请在上方区域签名</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full"
        >
          <Card className="!py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">轨迹回放</p>
                <p className="text-xs text-gray-500">查看运输全程轨迹</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
          </Card>
        </motion.button>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 pb-safe-area-inset-bottom z-40">
        <div className="flex items-center gap-3">
          <Button size="lg" variant="secondary" fullWidth disabled={!hasSignature}>
            <Eraser className="w-5 h-5" />
            清除签名
          </Button>
          <Button
            size="lg"
            fullWidth
            disabled={!hasSignature}
            className="!bg-gradient-to-r !from-orange-500 !to-amber-600 hover:!from-orange-600 hover:!to-amber-700 shadow-orange-500/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            确认签收
          </Button>
        </div>
      </div>
    </div>
  )
}
