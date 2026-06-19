import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Nfc, RefreshCw, Wifi } from 'lucide-react'

const QR_SIZE = 21

function generateQRPattern() {
  const grid: boolean[][] = []
  for (let i = 0; i < QR_SIZE; i++) {
    const row: boolean[] = []
    for (let j = 0; j < QR_SIZE; j++) {
      const isFinderPattern =
        (i < 7 && j < 7) ||
        (i < 7 && j >= QR_SIZE - 7) ||
        (i >= QR_SIZE - 7 && j < 7)
      const isFinderBorder =
        isFinderPattern &&
        (i === 0 || i === 6 || j === 0 || j === 6 ||
         i === QR_SIZE - 7 || i === QR_SIZE - 1 ||
         j === QR_SIZE - 7 || j === QR_SIZE - 1)
      const isFinderInner =
        isFinderPattern &&
        ((i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
        (i >= 2 && i <= 4 && j >= QR_SIZE - 5 && j <= QR_SIZE - 3) ||
        (i >= QR_SIZE - 5 && i <= QR_SIZE - 3 && j >= 2 && j <= 4))

      if (isFinderBorder || isFinderInner) {
        row.push(true)
      } else if (isFinderPattern) {
        row.push(false)
      } else {
        row.push(Math.random() > 0.5)
      }
    }
    grid.push(row)
  }
  return grid
}

export default function EsscPage() {
  const [countdown, setCountdown] = useState(60)
  const [refreshing, setRefreshing] = useState(false)

  const qrPattern = useMemo(() => generateQRPattern(), [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setCountdown(60)
      setRefreshing(false)
    }, 500)
  }

  useEffect(() => {
    if (countdown <= 0) {
      handleRefresh()
      return
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">电子社保卡</h1>

      <div className="max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="rounded-xl bg-gov-gradient p-6 text-white shadow-gov-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-card-shine pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gov-gold" />
                <span className="text-sm text-white/70">社会保障卡</span>
              </div>
              <span className="text-xs text-white/50">JS·SI</span>
            </div>

            <p className="font-serif text-base tracking-widest text-center mb-6 text-white/90">
              中华人民共和国社会保障卡
            </p>

            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/50">持卡人</p>
                  <p className="text-xl font-bold tracking-wider">张明</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">证件号码</p>
                  <p className="text-sm font-mono tracking-wider">320102****2345</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">卡号</p>
                  <p className="text-sm font-mono tracking-wider">6217 **** **** 8901</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-11 rounded-md bg-gradient-to-br from-gov-gold to-amber-600 shadow-gold flex items-center justify-center">
                  <div className="w-10 h-7 rounded-sm border-2 border-amber-800/30 grid grid-cols-3 grid-rows-2 gap-px p-0.5">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <span key={idx} className="bg-amber-800/40 rounded-[1px]" />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-white/40">芯片</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/15">
              <div>
                <p className="text-xs text-white/50">发卡银行</p>
                <p className="text-sm">中国工商银行</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">有效期</p>
                <p className="text-sm font-mono">2026.01 - 2036.01</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gov-card p-4 flex items-center gap-3"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gov-text">NFC已开通</p>
            <p className="text-xs text-gov-text-secondary">支持社保卡NFC闪付功能</p>
          </div>
          <Nfc className="w-5 h-5 text-emerald-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="gov-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gov-text">动态二维码</h3>
            <div className="flex items-center gap-1.5 text-sm text-gov-text-secondary">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              刷新倒计时：
              <span className="font-mono font-bold text-gov-blue">{countdown}s</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-lg border border-gov-border">
              <div
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`,
                  width: '168px',
                  height: '168px',
                }}
              >
                {qrPattern.map((row, i) =>
                  row.map((cell, j) => (
                    <span
                      key={`${i}-${j}`}
                      className="rounded-[0.5px]"
                      style={{
                        backgroundColor: cell ? '#0D3B66' : 'transparent',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gov-text-muted mt-2">
            二维码每60秒自动刷新，请勿截图使用
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          <button className="gov-btn-primary !py-3 text-sm">
            <Wifi className="w-4 h-4 inline mr-1.5" />
            申领电子社保卡
          </button>
          <button className="gov-btn-secondary !py-3 text-sm">
            <Nfc className="w-4 h-4 inline mr-1.5" />
            NFC闪付设置
          </button>
          <button
            className="gov-btn-secondary !py-3 text-sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 inline mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            二维码刷新
          </button>
        </motion.div>
      </div>
    </div>
  )
}
