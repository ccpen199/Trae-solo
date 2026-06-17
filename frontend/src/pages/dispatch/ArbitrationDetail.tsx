import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Gavel,
  User,
  MapPin,
  Clock,
  Phone,
  FileText,
  Image,
  Music,
  Play,
  Pause,
  Volume2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Star,
  ZoomIn,
} from 'lucide-react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDisputeDetail,
  resolveDispute,
  type DisputeDetail,
  type DisputeEvidence,
  type ResolveDisputeData,
} from '../../services/dispatch.api'

// Fix default marker icon in react-leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

const startIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'start-marker',
})

const endIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'end-marker',
})

const mockDetail: DisputeDetail = {
  id: 'dispute-1',
  orderId: 'order-101',
  orderNo: 'DD202606150001',
  orderCategory: 'moving',
  type: 'damage',
  typeLabel: '物品损坏',
  status: 'pending',
  severity: 'high',
  priority: 95,
  complainant: {
    id: 'emp-1',
    name: '张伟',
    phone: '13812345678',
    role: 'employer',
  },
  respondent: {
    id: 'worker-5',
    name: '王师傅',
    phone: '13987654321',
    role: 'worker',
  },
  claimAmount: 2500,
  description: '搬家过程中，一台价值约5000元的实木餐桌被刮伤，桌角严重破损，另有两个陶瓷花瓶碎裂。工人拒绝承担责任，要求平台介入仲裁。',
  slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  orderDetail: {
    id: 'order-101',
    orderNo: 'DD202606150001',
    scheduledAt: '2026-06-15 09:00',
    price: 1280,
    description: '朝阳区阳光花园3号楼2单元501 → 海淀区中关村小区5号楼3单元802，两室一厅搬家，含拆装家具',
  },
  gpsTrack: [
    { lat: 39.9342, lng: 116.4474, time: '08:45' },
    { lat: 39.9388, lng: 116.4421, time: '08:52' },
    { lat: 39.9452, lng: 116.4356, time: '09:01' },
    { lat: 39.9581, lng: 116.4125, time: '09:18' },
    { lat: 39.9724, lng: 116.3892, time: '09:35' },
    { lat: 39.9812, lng: 116.3528, time: '09:52' },
    { lat: 39.9867, lng: 116.3301, time: '10:08' },
    { lat: 39.9845, lng: 116.3215, time: '10:15' },
  ],
  timeline: [
    { id: 't1', action: '工单创建', operator: '系统', remark: '雇主提交纠纷申请', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 't2', action: '已受理', operator: '调度员-李明', remark: '已分配至仲裁组处理', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 't3', action: '证据上传', operator: '雇主-张伟', remark: '上传了5张现场照片', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 't4', action: '证据上传', operator: '工人-王师傅', remark: '上传了1段录音和2张照片', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ],
  evidence: [
    { id: 'e1', type: 'image', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150', description: '餐桌桌角破损情况', uploadedAt: '4小时前', uploader: '张伟' },
    { id: 'e2', type: 'image', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150', description: '桌面划痕特写', uploadedAt: '4小时前', uploader: '张伟' },
    { id: 'e3', type: 'image', url: 'https://images.unsplash.com/photo-1612691172726-2ba2cd0200c0?w=400', thumbnail: 'https://images.unsplash.com/photo-1612691172726-2ba2cd0200c0?w=150', description: '碎裂的陶瓷花瓶', uploadedAt: '4小时前', uploader: '张伟' },
    { id: 'e4', type: 'audio', url: '/demo-audio.mp3', description: '现场沟通录音（3分25秒）', uploadedAt: '2小时前', uploader: '王师傅' },
    { id: 'e5', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400', thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150', description: '包装材料完整度', uploadedAt: '2小时前', uploader: '王师傅' },
    { id: 'e6', type: 'image', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150', description: '搬运前家具状态', uploadedAt: '2小时前', uploader: '王师傅' },
  ],
}

function TrackController({ trackIndex, setTrackIndex, trackLength }: {
  trackIndex: number
  setTrackIndex: (i: number) => void
  trackLength: number
}) {
  const map = useMap()
  return null
}

interface WaveformPlayerProps {
  audioUrl: string
  duration: string
}

function WaveformPlayer({ audioUrl, duration }: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(35)
  const [volume, setVolume] = useState(80)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bars = 80
    const barWidth = canvas.width / bars - 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < bars; i++) {
      const height = Math.random() * 40 + 10
      const isPast = (i / bars) * 100 < progress
      ctx.fillStyle = isPast ? '#06B6D4' : '#334155'
      ctx.fillRect(i * (barWidth + 1), canvas.height - height, barWidth, height)
    }
  }, [progress])

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/30"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="flex-1">
          <canvas ref={canvasRef} width={300} height={50} className="w-full h-12" />
        </div>
        <div className="text-xs font-mono text-slate-400 w-20 text-right">
          01:12 / {duration}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-slate-500" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-cyan-500
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  )
}

export default function ArbitrationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [trackIndex, setTrackIndex] = useState(mockDetail.gpsTrack?.length || 0)
  const [previewImage, setPreviewImage] = useState<DisputeEvidence | null>(null)
  const [responsibleParty, setResponsibleParty] = useState<ResolveDisputeData['responsibleParty']>('worker')
  const [compensationAmount, setCompensationAmount] = useState(2500)
  const [creditAdjustment, setCreditAdjustment] = useState(-10)
  const [remark, setRemark] = useState('')

  const { data: detail } = useQuery({
    queryKey: ['dispute-detail', id],
    queryFn: () => (id ? getDisputeDetail(id) : Promise.resolve(mockDetail)),
    initialData: mockDetail,
  })

  const resolveMutation = useMutation({
    mutationFn: (data: ResolveDisputeData) => resolveDispute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      navigate('/dispatch/arbitration')
    },
  })

  const trackData = detail.gpsTrack || []
  const imageEvidence = detail.evidence.filter((e) => e.type === 'image')
  const audioEvidence = detail.evidence.filter((e) => e.type === 'audio')

  const centerLat = trackData.length ? trackData.reduce((s, p) => s + p.lat, 0) / trackData.length : 39.95
  const centerLng = trackData.length ? trackData.reduce((s, p) => s + p.lng, 0) / trackData.length : 116.40

  const handleSubmit = () => {
    if (!id) return
    resolveMutation.mutate({
      id,
      responsibleParty,
      compensationAmount,
      creditAdjustment,
      remark,
    })
  }

  return (
    <div className="p-6 min-w-[1440px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/dispatch/arbitration')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            仲裁详情
            <span className="text-base font-mono text-cyan-400">#{detail.orderNo}</span>
            <span className="text-sm font-normal px-2.5 py-1 rounded-md bg-red-500/15 text-red-400">
              {detail.typeLabel}
            </span>
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              创建于 {new Date(detail.createdAt).toLocaleString('zh-CN')}
            </span>
            <span className="text-orange-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              SLA剩余 12小时05分
            </span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-10 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-3 space-y-4"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              工单基本信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between text-sm">
                <span className="text-slate-400">订单号</span>
                <span className="text-white font-mono">{detail.orderNo}</span>
              </div>
              <div className="flex items-start justify-between text-sm">
                <span className="text-slate-400">订单类型</span>
                <span className="text-white">
                  {detail.orderCategory === 'labor' ? '用工服务' : detail.orderCategory === 'vehicle' ? '找车服务' : '搬家服务'}
                </span>
              </div>
              <div className="flex items-start justify-between text-sm">
                <span className="text-slate-400">订单金额</span>
                <span className="text-cyan-400 font-mono font-medium">¥{detail.orderDetail?.price.toLocaleString()}</span>
              </div>
              <div className="flex items-start justify-between text-sm">
                <span className="text-slate-400">预约时间</span>
                <span className="text-white">{detail.orderDetail?.scheduledAt}</span>
              </div>
              <div className="pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">订单描述</p>
                <p className="text-sm text-slate-300 leading-relaxed">{detail.orderDetail?.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              申诉方（雇主）
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                {detail.complainant.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium">{detail.complainant.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {detail.complainant.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400 ml-1">4.9 (128单)</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
              被诉方（{detail.respondent.role === 'worker' ? '工人' : '司机'}）
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-lg font-bold">
                {detail.respondent.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium">{detail.respondent.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {detail.respondent.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs text-slate-400 ml-1">4.2 (256单)</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              申诉描述
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{detail.description}</p>
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-400">索赔金额</span>
              <span className="text-lg font-mono font-bold text-orange-400">
                ¥{detail.claimAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-4 space-y-4"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                GPS轨迹回放
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTrackIndex(Math.max(0, trackIndex - 1))}
                  className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 font-mono min-w-[80px] text-center">
                  {trackIndex}/{trackData.length}
                </span>
                <button
                  onClick={() => setTrackIndex(Math.min(trackData.length, trackIndex + 1))}
                  className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-80 dark-map">
              <MapContainer
                center={[centerLat, centerLng]}
                zoom={12}
                className="w-full h-full"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <TrackController
                  trackIndex={trackIndex}
                  setTrackIndex={setTrackIndex}
                  trackLength={trackData.length}
                />
                {trackData.length > 1 && (
                  <Polyline
                    positions={trackData.slice(0, trackIndex + 1).map((p) => [p.lat, p.lng])}
                    color="#06B6D4"
                    weight={4}
                    opacity={0.8}
                  />
                )}
                {trackData.slice(0, trackIndex + 1).map((point, idx) => (
                  <Marker
                    key={idx}
                    position={[point.lat, point.lng]}
                    icon={idx === 0 ? startIcon : idx === trackIndex ? endIcon : defaultIcon}
                  >
                    <Popup>
                      <p className="text-sm">位置点 {idx + 1}</p>
                      <p className="text-xs text-slate-500">{point.time}</p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="p-3 bg-slate-900/50">
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {trackData.map((point, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTrackIndex(idx)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      idx <= trackIndex
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-700/30 text-slate-500'
                    }`}
                  >
                    {point.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              处理时间线
            </h3>
            <div className="space-y-4">
              {detail.timeline.map((item, idx) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${idx === detail.timeline.length - 1 ? 'bg-cyan-500 ring-4 ring-cyan-500/20' : 'bg-slate-600'}`} />
                    {idx < detail.timeline.length - 1 && <div className="w-px flex-1 bg-slate-700/50 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{item.action}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{item.operator}</p>
                    {item.remark && <p className="text-xs text-slate-500 mt-0.5">{item.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-3 space-y-4"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Image className="w-4 h-4 text-cyan-400" />
              证据画廊 ({imageEvidence.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {imageEvidence.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setPreviewImage(ev)}
                  className="relative aspect-square rounded-lg overflow-hidden group bg-slate-900/50"
                >
                  <img
                    src={ev.thumbnail || ev.url}
                    alt={ev.description}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {imageEvidence.map((ev) => (
                <div key={ev.id} className="flex items-start gap-2 text-xs">
                  <Image className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 truncate">{ev.description}</p>
                    <p className="text-slate-500">{ev.uploader} · {ev.uploadedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {audioEvidence.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Music className="w-4 h-4 text-orange-400" />
                录音证据
              </h3>
              <div className="space-y-3">
                {audioEvidence.map((ev) => (
                  <div key={ev.id}>
                    <div className="flex items-start gap-2 mb-2">
                      <Music className="w-4 h-4 text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-white">{ev.description}</p>
                        <p className="text-xs text-slate-500">{ev.uploader} · {ev.uploadedAt}</p>
                      </div>
                    </div>
                    <WaveformPlayer audioUrl={ev.url} duration="03:25" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
      >
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-cyan-400" />
          责任判定
        </h3>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5">
            <p className="text-sm text-slate-400 mb-3">责任方认定</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'employer', label: '雇主' },
                { value: 'worker', label: '工人' },
                { value: 'driver', label: '司机' },
                { value: 'both', label: '共同' },
                { value: 'none', label: '无责' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setResponsibleParty(opt.value as ResolveDisputeData['responsibleParty'])}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    responsibleParty === opt.value
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-900/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  赔付金额
                </label>
                <span className="text-sm font-mono font-semibold text-orange-400">¥{compensationAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-orange-500
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-orange-500/50
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400 flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  信用分调整
                </label>
                <span className={`text-sm font-mono font-semibold ${creditAdjustment < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {creditAdjustment > 0 ? '+' : ''}{creditAdjustment} 分
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={10}
                step={5}
                value={creditAdjustment}
                onChange={(e) => setCreditAdjustment(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-cyan-500
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-cyan-500/50
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>-50</span>
                <span>0</span>
                <span>+10</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                调整后预计信用分: <span className="text-white font-medium">825 → {Math.max(0, 825 + creditAdjustment)}</span> (B级)
              </p>
            </div>
          </div>

          <div className="col-span-7">
            <label className="text-sm text-slate-400 mb-2 block">仲裁意见</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请详细说明仲裁判定依据和处理意见..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button className="px-5 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-600/50 hover:text-white transition-colors">
                暂存草稿
              </button>
              <button
                onClick={handleSubmit}
                disabled={resolveMutation.isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
              >
                <Gavel className="w-4 h-4 inline mr-2" />
                出具仲裁结果
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.description}
              className="max-w-full max-h-[80vh] rounded-xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{previewImage.description}</p>
              <p className="text-sm text-slate-400 mt-1">
                {previewImage.uploader} · {previewImage.uploadedAt}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
