import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, QrCode, Shield, Clock, MapPin, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { apiGet, apiPost } from '@/utils/api'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiGet<any>(`/tickets/${id}`)
      .then((data) => setTicket(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-carbon-400">加载中...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <p className="text-wine-400 mb-6">票不存在或无权查看</p>
          <Link to="/orders" className="wine-gradient-btn">返回订单</Link>
        </div>
      </div>
    )
  }

  const generateQRPattern = () => {
    const size = 21
    const arr = []
    for (let i = 0; i < size * size; i++) {
      arr.push(Math.random() > 0.5)
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let x = 0; x < 7; x++) {
          for (let y = 0; y < 7; y++) {
            const idx = (i === 1 ? size - 7 + y : y) * size + (j === 1 ? size - 7 + x : x)
            if (i < 2 || j < 2) {
              if (x === 0 || x === 6 || y === 0 || y === 6) arr[idx] = true
              else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) arr[idx] = true
              else arr[idx] = false
            }
          }
        }
      }
    }
    return arr
  }

  const qrPattern = generateQRPattern()

  return (
    <div className="min-h-screen bg-gradient-dark pb-16">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-md">
        <h1 className="font-display text-2xl text-gold-400 text-center mb-8">电子入场券</h1>

        <div className="glass-card overflow-hidden p-0 mb-6 relative">
          <div className="bg-gradient-to-br from-wine-800 to-wine-950 p-6 text-center relative">
            <div className="text-gold-300/50 text-sm mb-2">ELECTRONIC TICKET</div>
            <div className="font-display text-3xl text-white mb-1 line-clamp-1">{ticket.title}</div>
            <div className="text-gold-400/70 text-sm">{ticket.venue}</div>

            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-dark" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-gradient-dark" />
          </div>

          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-white p-3 rounded-lg">
                <div className="grid gap-[1px]" style={{ gridTemplateColumns: 'repeat(21, 1fr)', width: '100%', height: '100%' }}>
                  {qrPattern.map((filled, i) => (
                    <div key={i} className={filled ? 'bg-carbon-900' : 'bg-white'} />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-carbon-400 text-xs mb-1">防伪码</div>
              <div className="flex items-center justify-center gap-2">
                <code className="font-mono text-gold-400 text-sm">{ticket.antiFakeCode}</code>
                <button onClick={() => copyToClipboard(ticket.antiFakeCode)} className="text-carbon-500 hover:text-gold-400 transition">
                  {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-dashed border-carbon-700 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-carbon-400">场次</span>
                <span className="text-white">
                  {ticket.start_time && new Date(ticket.start_time).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-carbon-400">时间</span>
                <span className="text-white">
                  {ticket.start_time && new Date(ticket.start_time).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-carbon-400">场馆</span>
                <span className="text-white">{ticket.venue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-carbon-400">区域</span>
                <span className="text-white">{ticket.zone_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-carbon-400">座位</span>
                <span className="text-gold-400 font-bold">{ticket.seat_label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={20} className="text-gold-500" />
            <span className="text-white font-medium">票源保真验证</span>
          </div>
          <div className="text-sm text-carbon-400 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>唯一防伪码已绑定至您的身份信息</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span>区块链存证已上链，不可篡改</span>
            </div>
            <div className="mt-3 p-3 bg-carbon-800/50 rounded-lg">
              <div className="text-xs text-carbon-500 mb-1">区块链存证哈希</div>
              <code className="text-xs text-gold-500/70 break-all">{ticket.blockchain_hash}</code>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={20} className="text-gold-500" />
            <span className="text-white font-medium">入场须知</span>
          </div>
          <div className="text-sm text-carbon-400 space-y-2">
            <p>• 请在演出开始前 30 分钟到达场馆</p>
            <p>• 出示电子票二维码，由闸机扫码或工作人员核验入场</p>
            <p>• 一人一票，对号入座，副券撕下无效</p>
            <p>• 实名制购票，请携带本人有效身份证件</p>
          </div>
        </div>

        {ticket.status === 'valid' && (
          <button className="gold-gradient-btn w-full py-4 font-bold text-lg">
            <QrCode size={20} className="inline mr-2 -mt-1" />
            出示二维码入场
          </button>
        )}

        {ticket.status === 'used' && (
          <div className="text-center py-4 text-green-400 bg-green-500/10 rounded-xl border border-green-500/30">
            <CheckCircle size={24} className="inline mr-2 -mt-1" />
            已核验入场
          </div>
        )}
      </div>
    </div>
  )
}
