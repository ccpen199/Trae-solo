import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Camera, CheckCircle } from 'lucide-react'

interface StepBankCardProps {
  cardNumber: string
  onChangeCardNumber: (v: string) => void
  bankName: string
  onChangeBankName: (v: string) => void
  bound: boolean
  onBound: () => void
}

export default function StepBankCard({
  cardNumber,
  onChangeCardNumber,
  bankName,
  onChangeBankName,
  bound,
  onBound,
}: StepBankCardProps) {
  const [showOcr, setShowOcr] = useState(false)
  const [ocrDone, setOcrDone] = useState(false)

  const startOcr = () => {
    setShowOcr(true)
    setOcrDone(false)
    setTimeout(() => {
      setOcrDone(true)
      onChangeCardNumber('6222 **** **** 1234')
      onChangeBankName('中国工商银行')
      setTimeout(() => {
        setShowOcr(false)
      }, 800)
    }, 1500)
  }

  return (
    <div className="space-y-5">
      <button
        onClick={startOcr}
        disabled={bound}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
        style={{ borderColor: '#165DFF', color: '#165DFF' }}
      >
        <Camera size={18} />
        拍照识别银行卡
      </button>

      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px" style={{ backgroundColor: '#E5E6EB' }} />
        <span className="relative bg-white px-3 text-xs" style={{ color: '#86909C' }}>或手动输入</span>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <CreditCard size={15} /> 银行卡号
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => onChangeCardNumber(e.target.value)}
          placeholder="请输入银行卡号"
          disabled={bound}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 disabled:bg-gray-50"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: '#4E5969' }}>开户行</label>
        <input
          type="text"
          value={bankName}
          onChange={(e) => onChangeBankName(e.target.value)}
          placeholder="请输入开户行名称"
          disabled={bound}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 disabled:bg-gray-50"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      {!bound ? (
        <button
          onClick={onBound}
          disabled={!cardNumber || !bankName}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#165DFF' }}
        >
          确认绑定
        </button>
      ) : (
        <div
          className="flex items-center gap-2 justify-center py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#E8FFEA', color: '#00B42A' }}
        >
          <CheckCircle size={18} /> 银行卡已绑定
        </div>
      )}

      <AnimatePresence>
        {showOcr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-80 space-y-4"
            >
              <div
                className="rounded-xl p-5 flex flex-col items-center gap-3"
                style={{ backgroundColor: '#F2F3F5' }}
              >
                <div
                  className="w-full h-28 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#E5E6EB' }}
                >
                  <CreditCard size={48} style={{ color: '#86909C' }} />
                </div>
                {!ocrDone && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-sm"
                    style={{ color: '#86909C' }}
                  >
                    正在识别银行卡信息...
                  </motion.div>
                )}
                {ocrDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: '#00B42A' }}
                  >
                    <CheckCircle size={16} /> 识别完成
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
