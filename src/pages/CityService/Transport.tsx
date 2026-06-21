import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, ArrowLeft, RefreshCw } from 'lucide-react'

type TransportMode = '公交' | '地铁'

function generateQRPattern() {
  const size = 21
  const pattern: boolean[][] = []
  for (let i = 0; i < size; i++) {
    const row: boolean[] = []
    for (let j = 0; j < size; j++) {
      const inCorner =
        (i < 7 && j < 7) || (i < 7 && j >= size - 7) || (i >= size - 7 && j < 7)
      if (inCorner) {
        const ci = i < 7 ? i : i - (size - 7)
        const cj = j < 7 ? j : j - (size - 7)
        const isFinder =
          ci === 0 || ci === 6 || cj === 0 || cj === 6 ||
          (ci >= 2 && ci <= 4 && cj >= 2 && cj <= 4)
        row.push(isFinder)
      } else {
        row.push(Math.random() > 0.5)
      }
    }
    pattern.push(row)
  }
  return pattern
}

export default function Transport() {
  const [mode, setMode] = useState<TransportMode>('公交')
  const [countdown, setCountdown] = useState(60)
  const [qrKey, setQrKey] = useState(0)
  const navigate = useNavigate()

  const qrPattern = useMemo(() => generateQRPattern(), [qrKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setQrKey((k) => k + 1)
          return 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setQrKey((k) => k + 1)
    setCountdown(60)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/city-service')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="section-title mb-0">扫码乘车</h1>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          {(['公交', '地铁'] as TransportMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${mode === m ? 'bg-white text-primary-500 shadow-sm' : 'text-gray-500'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-center mb-4">
            <div className="inline-grid gap-0 p-4 border-4 border-primary-500 rounded-lg bg-white">
              {qrPattern.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((cell, j) => (
                    <div
                      key={j}
                      className="w-2.5 h-2.5"
                      style={{ backgroundColor: cell ? '#0A2E5C' : '#ffffff' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mb-2">
            {mode === '公交' ? '公交乘车码' : '地铁乘车码'}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{countdown}秒后自动刷新</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">账户余额</p>
            <p className="text-xl font-bold text-primary-500">¥126.50</p>
          </div>
          <Bus className="w-6 h-6 text-gray-300" />
        </div>

        <div className="flex gap-3 mb-6">
          {(['公交', '地铁'] as TransportMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all
                ${mode === m
                  ? 'border-primary-500 text-primary-500 bg-primary-50'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          className="w-full py-3.5 gradient-gold text-primary-900 rounded-xl font-semibold
                     hover:from-gold-300 hover:to-gold-400 active:from-gold-500 active:to-gold-600
                     transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          刷新乘车码
        </button>
      </div>
    </div>
  )
}
