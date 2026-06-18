import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Camera, CheckCircle, Keyboard } from 'lucide-react'

interface StepBankCardProps {
  cardNumber: string
  onChangeCardNumber: (v: string) => void
  bankName: string
  onChangeBankName: (v: string) => void
  bound: boolean
  onBound: () => void
}

type InputMode = 'ocr' | 'manual'

export default function StepBankCard({
  cardNumber,
  onChangeCardNumber,
  bankName,
  onChangeBankName,
  bound,
  onBound,
}: StepBankCardProps) {
  const [inputMode, setInputMode] = useState<InputMode>('ocr')
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
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setInputMode('ocr')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
            inputMode === 'ocr' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          style={{ color: inputMode === 'ocr' ? '#165DFF' : undefined }}
        >
          <Camera size={14} />
          拍照识别
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
            inputMode === 'manual' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          style={{ color: inputMode === 'manual' ? '#165DFF' : undefined }}
        >
          <Keyboard size={14} />
          手动输入
        </button>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'ocr' && (
          <motion.div
            key="ocr"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <button
              onClick={startOcr}
              disabled={bound}
              className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-colors disabled:opacity-50 hover:bg-gray-50"
              style={{ borderColor: '#165DFF' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#E8F0FF' }}
              >
                <Camera size={28} style={{ color: '#165DFF' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#165DFF' }}>点击拍照识别银行卡</p>
                <p className="text-xs mt-1" style={{ color: '#86909C' }}>支持自动识别卡号和开户行</p>
              </div>
            </button>

            {cardNumber && (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  <span className="text-sm text-white/80">{bankName}</span>
                </div>
                <p className="text-xl font-bold text-white tracking-wider">{cardNumber}</p>
              </div>
            )}
          </motion.div>
        )}

        {inputMode === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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

      <div
        className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: '#F2F3F5' }}
      >
        <p className="text-sm font-medium" style={{ color: '#4E5969' }}>温馨提示</p>
        <ul className="space-y-1 text-xs" style={{ color: '#86909C' }}>
          <li>· 仅支持本人名下的储蓄卡</li>
          <li>· 建议使用工商银行、建设银行、中国银行等大型银行</li>
          <li>· 绑定成功后补贴将发放至该卡</li>
        </ul>
      </div>

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
                  className="w-full h-28 rounded-lg flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: '#E5E6EB' }}
                >
                  <CreditCard size={48} style={{ color: '#86909C' }} />
                  {!ocrDone && (
                    <motion.div
                      className="absolute inset-x-0 h-1"
                      style={{ backgroundColor: '#165DFF', top: '50%' }}
                      animate={{ y: [-40, 40, -40] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
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
