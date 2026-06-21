import { useEffect, useState, useCallback } from 'react'
import { Bus, Train, Clock, CreditCard, Wifi } from 'lucide-react'
import api from '@/lib/api'

interface QrData {
  token: string
  expireIn: number
  balance: number
  type: string
}

interface Record {
  id: string
  time: string
  route: string
  amount: number
  type: 'bus' | 'subway'
}

type Tab = 'qr' | 'records'

const mockRecords: Record[] = [
  { id: '1', time: '08:32', route: '地铁2号线·望城坡→五一广场', amount: 3, type: 'subway' },
  { id: '2', time: '18:15', route: '地铁2号线·五一广场→望城坡', amount: 3, type: 'subway' },
  { id: '3', time: '09:10', route: '公交118路·市政府→岳麓山北', amount: 2, type: 'bus' },
  { id: '4', time: '07:45', route: '地铁4号线·汉王陵→黄土岭', amount: 4, type: 'subway' },
  { id: '5', time: '17:50', route: '公交9路·黄土岭→市政府', amount: 2, type: 'bus' },
  { id: '6', time: '08:20', route: '地铁1号线·开福寺→五一广场', amount: 2, type: 'subway' },
]

export default function Transport() {
  const [tab, setTab] = useState<Tab>('qr')
  const [qrData, setQrData] = useState<QrData | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [countdown, setCountdown] = useState(30)
  const [nfcEnabled, setNfcEnabled] = useState(false)

  const fetchQr = useCallback(() => {
    api.get('/transport/qr')
      .then((res) => {
        setQrData(res.data)
        setCountdown(res.data.expireIn || 30)
      })
      .catch(() => {
        setQrData({ token: 'mock-token', expireIn: 30, balance: 86.5, type: 'bus' })
        setCountdown(30)
      })
  }, [])

  useEffect(() => {
    fetchQr()
    const interval = setInterval(fetchQr, 30000)
    return () => clearInterval(interval)
  }, [fetchQr])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    api.get('/transport/records')
      .then((res) => setRecords(res.data))
      .catch(() => setRecords(mockRecords))
  }, [])

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const subwayCount = records.filter((r) => r.type === 'subway').length
  const busCount = records.filter((r) => r.type === 'bus').length

  return (
    <div className="px-4 pb-6 space-y-4 animate-fadeIn">
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(['qr', 'records'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            {t === 'qr' ? '乘车码' : '出行记录'}
          </button>
        ))}
      </div>

      {tab === 'qr' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-6">
            <div
              className="w-56 h-56 rounded-2xl border-4 border-primary/30 shadow-lg animate-pulse-glow flex items-center justify-center relative overflow-hidden"
              style={{
                background: `
                  repeating-conic-gradient(#0052D9 0% 25%, transparent 0% 50%) 0 0 / 14px 14px,
                  repeating-conic-gradient(#0052D9 0% 25%, transparent 0% 50%) 7px 7px / 14px 14px
                `,
                backgroundColor: '#E8F0FE',
              }}
            >
              <div className="absolute inset-6 rounded-xl bg-white flex flex-col items-center justify-center">
                <Bus className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-semibold text-text-dark">长沙地铁/公交乘车码</p>
                <p className="text-xs text-text-muted mt-1">
                  {qrData?.token ? `·${qrData.token.slice(-6)}` : '------'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-text-dark">
                <CreditCard className="w-4 h-4 text-primary" />
                余额：<span className="font-semibold text-primary">¥{qrData?.balance?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <Clock className="w-4 h-4" />
                {countdown}s
              </div>
            </div>

            <div className="w-56 mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-6 rounded-full relative transition-colors ${nfcEnabled ? 'bg-primary' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${nfcEnabled ? 'left-4' : 'left-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-dark">NFC 刷卡模式</p>
                <p className="text-xs text-text-muted">{nfcEnabled ? '已开启，靠近闸机即可' : '关闭'}</p>
              </div>
            </div>
            <button onClick={() => setNfcEnabled(!nfcEnabled)}>
              <Wifi className={`w-5 h-5 ${nfcEnabled ? 'text-primary' : 'text-gray-300'}`} />
            </button>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-text-muted">{dateStr}</div>
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${r.type === 'subway' ? 'bg-primary/10' : 'bg-green-50'}`}>
                    {r.type === 'subway' ? (
                      <Train className="w-4 h-4 text-primary" />
                    ) : (
                      <Bus className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-dark">{r.route}</p>
                    <p className="text-xs text-text-muted">{r.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-dark">-¥{r.amount}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.type === 'subway' ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-600'}`}>
                    {r.type === 'subway' ? '地铁' : '公交'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white">
            <p className="text-sm font-medium mb-2">本月消费统计</p>
            <div className="flex justify-between text-sm">
              <span>地铁 {subwayCount} 次</span>
              <span>公交 {busCount} 次</span>
              <span>合计 ¥{totalAmount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
