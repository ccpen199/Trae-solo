import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Music, Theater, Mic, LayoutGrid, MapPin, Building, Clock, ChevronLeft } from 'lucide-react'
import useEventStore from '@/stores/eventStore'
import useAuthStore from '@/stores/authStore'
import { apiGet } from '@/utils/api'

const categoryConfig: Record<string, { label: string; icon: any; gradient: string }> = {
  concert: { label: '演唱会', icon: Music, gradient: 'from-wine-700 to-wine-950' },
  drama: { label: '话剧', icon: Theater, gradient: 'from-purple-700 to-wine-950' },
  talkshow: { label: '脱口秀', icon: Mic, gradient: 'from-amber-700 to-wine-950' },
  other: { label: '其他', icon: LayoutGrid, gradient: 'from-teal-700 to-wine-950' },
}

const tierColors: Record<string, string> = {
  early_bird: 'border-green-500/40 bg-green-500/10',
  presale: 'border-blue-500/40 bg-blue-500/10',
  full: 'border-wine-500/40 bg-wine-500/10',
  vip: 'border-gold-500/40 bg-gold-500/10',
  discount: 'border-purple-500/40 bg-purple-500/10',
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentEvent, showtimes, fetchEventDetail, loading } = useEventStore()
  const { isLoggedIn, user, login } = useAuthStore()
  const [selectedShowtime, setSelectedShowtime] = useState<number | null>(null)
  const [showtimeDetail, setShowtimeDetail] = useState<any>(null)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [seatsData, setSeatsData] = useState<any>(null)

  useEffect(() => {
    if (id) fetchEventDetail(parseInt(id))
  }, [id, fetchEventDetail])

  useEffect(() => {
    if (showtimes.length > 0 && !selectedShowtime) {
      setSelectedShowtime(showtimes[0].id)
    }
  }, [showtimes, selectedShowtime])

  useEffect(() => {
    if (selectedShowtime) {
      apiGet<any>(`/showtimes/${selectedShowtime}`).then(setShowtimeDetail).catch(() => {})
      apiGet<any>(`/showtimes/${selectedShowtime}/seats`).then(setSeatsData).catch(() => {})
      const stored = localStorage.getItem(`pending_seats_${selectedShowtime}`)
      if (stored) setSelectedSeats(JSON.parse(stored))
      else setSelectedSeats([])
    }
  }, [selectedShowtime])

  const toggleSeat = (seatId: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId)
      if (prev.length >= 4) return prev
      const next = [...prev, seatId]
      return next
    })
  }

  const totalPrice = () => {
    if (!seatsData || selectedSeats.length === 0) return 0
    let total = 0
    const tiers = showtimeDetail?.pricingTiers || []
    const tierMap = new Map(tiers.map((t: any) => [t.id, t.price]))
    const zones = seatsData.zones || []
    for (const zone of zones) {
      const rows = seatsData.seatsMap?.[zone.id] || []
      for (const row of rows) {
        for (const seat of row) {
          if (selectedSeats.includes(seat.id)) {
            const tierId = seat.pricingTierId ?? seat.pricing_tier_id
            total += (tierMap.get(tierId) as number) || 380
          }
        }
      }
    }
    return total
  }

  const findFirstAvailableSeat = () => {
    if (!seatsData?.zones) return null
    for (const zone of seatsData.zones) {
      const rows = seatsData.seatsMap?.[zone.id] || []
      for (const row of rows) {
        for (const seat of row) {
          if (seat.status === 'available') return seat.id
        }
      }
    }
    return null
  }

  const handleGoQueue = async () => {
    if (!selectedShowtime) return
    if (!isLoggedIn) {
      await login('user1', '123456')
    }
    const seatIds = selectedSeats.length > 0 ? selectedSeats : [findFirstAvailableSeat()].filter(Boolean)
    if (seatIds.length === 0) {
      alert('暂无可选座位，请切换场次')
      return
    }
    localStorage.setItem(`pending_seats_${selectedShowtime}`, JSON.stringify(seatIds))
    navigate(`/queue/${selectedShowtime}`)
  }

  const cfg = currentEvent ? categoryConfig[currentEvent.category] || categoryConfig.other : categoryConfig.other
  const Icon = cfg.icon

  return (
    <div className="min-h-screen bg-gradient-dark">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          {isLoggedIn ? (
            <span className="text-gold-400 text-sm">{user?.realName}</span>
          ) : (
            <Link to="/login" className="wine-gradient-btn text-sm">登录</Link>
          )}
        </div>
      </nav>

      {loading ? (
        <div className="text-center text-carbon-400 py-20">加载中...</div>
      ) : currentEvent ? (
        <div className="container mx-auto px-6 py-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card overflow-hidden p-0">
                <div className={`h-72 bg-gradient-to-br ${cfg.gradient} flex items-center justify-center relative`}>
                  <Icon size={140} className="text-white/20" />
                  <div className="absolute bottom-6 right-6 text-right text-white/70 text-sm flex items-center gap-2">
                    <Clock size={16} />
                    <span>约120分钟</span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-wine-800/50 text-wine-300 text-sm">{cfg.label}</span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">热销中</span>
                  </div>
                  <h1 className="font-display text-3xl text-white mb-4">{currentEvent.title}</h1>
                  <div className="flex flex-wrap gap-6 text-carbon-400 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{currentEvent.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building size={16} />
                      <span>主办方: 星耀文化</span>
                    </div>
                  </div>
                  <p className="text-carbon-300 leading-relaxed line-clamp-4">{currentEvent.description}</p>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="section-title mb-4">选择场次</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {showtimes.map((st) => {
                    const isActive = selectedShowtime === st.id
                    const startDate = new Date((st as any).startTime || (st as any).start_time)
                    const dateStr = startDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
                    const timeStr = startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedShowtime(st.id)}
                        className={`min-w-[180px] p-4 rounded-xl border cursor-pointer transition-all flex-shrink-0 ${
                          isActive ? 'border-gold-500 bg-wine-800/20 shadow-glow-gold' : 'border-carbon-700 hover:border-carbon-600'
                        }`}
                      >
                        <div className="font-display text-xl text-gold-400 mb-1">{dateStr}</div>
                        <div className="text-sm text-carbon-300 mb-3">{timeStr}</div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            st.status === 'on_sale'
                              ? 'bg-green-500/20 text-green-400'
                              : st.status === 'presale'
                              ? 'bg-blue-500/20 text-blue-400'
                              : st.status === 'sold_out'
                              ? 'bg-wine-500/20 text-wine-400'
                              : 'bg-carbon-700 text-carbon-400'
                          }`}
                        >
                          {st.status === 'on_sale' ? '在售' : st.status === 'presale' ? '预售' : st.status === 'sold_out' ? '售罄' : '即将开售'}
                        </span>
                        <div className="text-xs text-carbon-500 mt-2">剩余 {(st as any).availableSeats ?? (st as any).available_seats} 座</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="section-title mb-4">选择座位</h2>
                <div className="py-4 text-center mb-8 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent rounded-lg">
                  <span className="font-display text-xl text-gold-400">STAGE 舞台</span>
                </div>

                {seatsData && seatsData.zones && seatsData.zones.length > 0 ? (
                  <div className="space-y-8">
                    {seatsData.zones.map((zone: any) => {
                      const rows = seatsData.seatsMap?.[zone.id] || []
                      return (
                        <div key={zone.id}>
                          <div className="text-center mb-3 font-medium" style={{ color: zone.color }}>
                            {zone.name}
                          </div>
                          <div
                            className="flex flex-col items-center gap-1"
                            style={{ justifyContent: 'center' }}
                          >
                            {rows.map((row: any[], rowIdx: number) => (
                              <div key={rowIdx} className="flex gap-1">
                                {row.map((seat: any) => {
                                  const isSelected = selectedSeats.includes(seat.id)
                                  const isSold = seat.status === 'sold'
                                  const isHeld = seat.status === 'held'
                                  const isDisabled = seat.status === 'disabled'
                                  let seatClass = 'w-5 h-5 rounded text-[10px] flex items-center justify-center transition-all '
                                  if (isDisabled) seatClass += 'bg-carbon-800/30 cursor-not-allowed '
                                  else if (isSold) seatClass += 'bg-wine-800/50 cursor-not-allowed '
                                  else if (isHeld) seatClass += 'bg-gold-500/40 cursor-wait '
                                  else if (isSelected) seatClass += 'bg-gold-500 scale-110 shadow-glow-gold text-carbon-950 font-bold cursor-pointer '
                                  else seatClass += 'bg-carbon-600 hover:bg-gold-500 hover:scale-110 cursor-pointer '
                                  return (
                                    <div
                                      key={seat.id}
                                      className={seatClass}
                                      onClick={() => !isSold && !isDisabled && !isHeld && toggleSeat(seat.id)}
                                      title={seat.seatLabel}
                                    >
                                      {isSelected ? seat.seatLabel : ''}
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-carbon-500 py-8">加载座位信息中...</div>
                )}

                <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-carbon-700/50 text-sm">
                  <div className="flex items-center gap-2 text-carbon-400">
                    <div className="w-4 h-4 bg-carbon-600 rounded" />
                    可选
                  </div>
                  <div className="flex items-center gap-2 text-carbon-400">
                    <div className="w-4 h-4 bg-gold-500 rounded" />
                    已选
                  </div>
                  <div className="flex items-center gap-2 text-carbon-400">
                    <div className="w-4 h-4 bg-gold-500/40 rounded" />
                    锁定
                  </div>
                  <div className="flex items-center gap-2 text-carbon-400">
                    <div className="w-4 h-4 bg-wine-800/50 rounded" />
                    已售
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="section-title mb-4">阶梯票价</h2>
                {showtimeDetail?.pricingTiers?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {showtimeDetail.pricingTiers.map((tier: any) => (
                      <div key={tier.id} className={`border rounded-xl p-5 ${tierColors[tier.tierType || tier.tier_type] || tierColors.full}`}>
                        <div className="text-sm font-medium text-white mb-2">{tier.name}</div>
                        <div className="font-display text-3xl text-gold-500 mb-3">¥{tier.price}</div>
                        <div className="h-1.5 bg-carbon-700 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-gradient-gold rounded-full"
                            style={{ width: `${tier.quota > 0 ? (tier.sold / tier.quota) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="text-xs text-carbon-400">已售 {tier.sold}/{tier.quota}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-carbon-500 py-4">加载票价信息中...</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="glass-card p-6">
                  <h3 className="font-display text-xl text-gold-400 mb-4">订单摘要</h3>
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between text-carbon-400">
                      <span>已选座位</span>
                      <span className="text-white">{selectedSeats.length} 张</span>
                    </div>
                    <div className="flex justify-between text-carbon-400">
                      <span>演出场次</span>
                      <span className="text-white">
                        {selectedShowtime && showtimes.find((s) => s.id === selectedShowtime)
                          ? new Date(((showtimes.find((s) => s.id === selectedShowtime) as any).startTime || (showtimes.find((s) => s.id === selectedShowtime) as any).start_time)).toLocaleDateString('zh-CN', {
                              month: 'numeric',
                              day: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-carbon-700/50">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-carbon-300">应付总额</span>
                      <span className="font-display text-4xl text-gold-500">¥{totalPrice()}</span>
                    </div>
                    <button
                      onClick={handleGoQueue}
                      className="gold-gradient-btn w-full py-4 text-lg font-bold"
                    >
                      {isLoggedIn ? '进入抢票队列' : '演示登录并购票'}
                    </button>
                    {selectedSeats.length === 0 && (
                      <p className="text-center text-carbon-500 text-sm mt-3">未选座时将自动选择第一张可售座位</p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-carbon-700/50 text-xs text-carbon-500 space-y-1">
                    <p>✓ 每张票绑定唯一防伪码</p>
                    <p>✓ 区块链存证，票源保真</p>
                    <p>✓ 支持先看后付（芝麻信用 600+）</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-carbon-400 py-20">演出不存在</div>
      )}

      <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-carbon-950/95 backdrop-blur-xl border-t border-carbon-800 lg:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-carbon-400">已选 {selectedSeats.length} 张</div>
            <div className="font-display text-2xl text-gold-500">¥{totalPrice()}</div>
          </div>
          <button onClick={handleGoQueue} className="gold-gradient-btn">
            {isLoggedIn ? '进入抢票队列' : '演示登录并购票'}
          </button>
        </div>
      </div>
    </div>
  )
}
