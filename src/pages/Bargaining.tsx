import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Send, CheckCircle, XCircle, Gauge } from 'lucide-react'

interface Message {
  id: string
  sender: 'shipper' | 'driver'
  content: string
  price?: number
  time: string
}

const defaultMessages: Message[] = [
  { id: '1', sender: 'shipper', content: '你好，这批货我期望运价 ¥2,800', price: 2800, time: '14:30' },
  { id: '2', sender: 'driver', content: '价格偏低，考虑油费和路费，最低 ¥3,200', price: 3200, time: '14:32' },
  { id: '3', sender: 'shipper', content: '可以加到 ¥3,000 吗？长期合作', price: 3000, time: '14:35' },
  { id: '4', sender: 'driver', content: '如果是长期合作，¥3,050 可以接受', price: 3050, time: '14:38' },
]

export default function Bargaining() {
  const location = useLocation()
  const navigate = useNavigate()
  const matchId = (location.state as { matchId?: string })?.matchId
  const [messages, setMessages] = useState<Message[]>(defaultMessages)
  const [input, setInput] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [settled, setSettled] = useState(false)

  const refPrice = 2900
  const minPrice = 2500
  const maxPrice = 3500

  const handleSend = () => {
    if (!input.trim()) return
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'shipper',
      content: input,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([...messages, newMsg])
    setInput('')
  }

  const handleOffer = () => {
    const price = Number(offerPrice)
    if (price <= 0) return
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'shipper',
      content: `报价 ¥${price.toLocaleString()}`,
      price,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([...messages, newMsg])
    setOfferPrice('')
  }

  const gaugePosition = Math.min(100, Math.max(0, ((refPrice - minPrice) / (maxPrice - minPrice)) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">运费议价</h1>
        <p className="text-sm text-secondary mt-0.5">与司机协商运费价格</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">议价对话</h3>
              {matchId && <span className="text-xs text-muted font-mono">订单 #{matchId}</span>}
            </div>

            <div className="h-[400px] overflow-y-auto space-y-3 mb-4 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'shipper' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                      msg.sender === 'shipper'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-gray-100 text-primary rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    {msg.price && (
                      <p className={`text-lg font-bold font-mono mt-1 ${msg.sender === 'shipper' ? 'text-accent-light' : 'text-accent'}`}>
                        ¥{msg.price.toLocaleString()}
                      </p>
                    )}
                    <p className={`text-[10px] mt-1 ${msg.sender === 'shipper' ? 'text-white/60' : 'text-muted'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!settled ? (
              <div className="border-t border-border pt-4">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入消息..."
                    className="flex-1 h-10 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <button onClick={handleSend} className="btn-primary px-3">
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="输入报价金额"
                    className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <button onClick={handleOffer} className="btn-accent text-sm">
                    报价
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-border pt-4 text-center">
                <CheckCircle size={40} className="text-mint mx-auto mb-2" />
                <p className="font-semibold text-primary">议价已达成</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Gauge size={16} /> 参考价格
            </h3>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-red-100" style={{ width: '25%' }} />
                <div className="h-full bg-yellow-100" style={{ width: '30%' }} />
                <div className="h-full bg-green-100" style={{ width: '45%' }} />
              </div>
              <div
                className="absolute top-0 h-full w-0.5 bg-primary"
                style={{ left: `${gaugePosition}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono">
                <span>¥{minPrice.toLocaleString()}</span>
                <span className="font-bold text-primary">¥{refPrice.toLocaleString()}</span>
                <span>¥{maxPrice.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted">
              <span>偏低</span>
              <span>合理</span>
              <span>偏高</span>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-primary mb-3">订单信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">线路</span>
                <span className="font-medium text-primary">上海 → 杭州</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">货物</span>
                <span className="font-medium text-primary">生鲜 · 15吨</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">车型</span>
                <span className="font-medium text-primary">冷藏车</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">司机</span>
                <span className="font-medium text-primary">张伟</span>
              </div>
            </div>
          </div>

          {!settled && (
            <div className="flex gap-3">
              <button
                onClick={() => setSettled(true)}
                className="flex-1 btn-primary flex items-center justify-center gap-1 text-sm"
              >
                <CheckCircle size={14} /> 接受报价
              </button>
              <button
                onClick={() => navigate('/matching')}
                className="flex-1 btn-secondary flex items-center justify-center gap-1 text-sm"
              >
                <XCircle size={14} /> 拒绝
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
