import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanFace, CheckCircle, Eye, Smile } from 'lucide-react'

interface StepIdentityProps {
  idNumber: string
  onChange: (v: string) => void
  verified: boolean
  onVerified: () => void
}

const livenessSteps = [
  { key: 'shake', label: '请左右摇头', icon: ScanFace },
  { key: 'blink', label: '请眨眨眼', icon: Eye },
  { key: 'mouth', label: '请张张嘴', icon: Smile },
]

export default function StepIdentityVerify({ idNumber, onChange, verified, onVerified }: StepIdentityProps) {
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [currentLivenessStep, setCurrentLivenessStep] = useState(0)

  const startFaceScan = () => {
    setShowModal(true)
    setScanning(true)
    setScanSuccess(false)
    setCurrentLivenessStep(0)

    let stepIdx = 0
    const stepInterval = setInterval(() => {
      stepIdx++
      if (stepIdx < livenessSteps.length) {
        setCurrentLivenessStep(stepIdx)
      } else {
        clearInterval(stepInterval)
        setScanning(false)
        setScanSuccess(true)
        setTimeout(() => {
          setShowModal(false)
          onVerified()
        }, 1200)
      }
    }, 1500)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: '#4E5969' }}>身份证号</label>
        <input
          type="text"
          value={idNumber}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入18位身份证号码"
          maxLength={18}
          disabled={verified}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 disabled:bg-gray-50"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <button
        onClick={startFaceScan}
        disabled={verified || !idNumber || idNumber.length < 18}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50"
        style={{ backgroundColor: verified ? '#00B42A' : '#165DFF' }}
      >
        {verified ? (
          <>
            <CheckCircle size={18} />
            已完成人脸识别验证
          </>
        ) : (
          <>
            <ScanFace size={18} />
            人脸识别验证
          </>
        )}
      </button>

      <div
        className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: '#F2F3F5' }}
      >
        <p className="text-sm font-medium" style={{ color: '#4E5969' }}>活体检测说明</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#86909C' }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#E8F0FF', color: '#165DFF' }}>1</span>
            请将面部对准识别框，保持光线充足
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#86909C' }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#E8F0FF', color: '#165DFF' }}>2</span>
            根据提示完成摇头、眨眼、张嘴等动作
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#86909C' }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#E8F0FF', color: '#165DFF' }}>3</span>
            验证通过后将自动进入下一步
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
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
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-5 w-80"
            >
              <div className="relative w-48 h-48 flex items-center justify-center">
                {scanning && (
                  <motion.div
                    className="absolute inset-0 border-4 rounded-full"
                    style={{ borderColor: '#00B42A' }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {scanSuccess && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle size={64} style={{ color: '#00B42A' }} />
                  </motion.div>
                )}
                {scanning && (
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{
                        rotate: [0, -15, 15, -15, 0],
                        scale: [1, 1.05, 1, 1.05, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ScanFace size={48} style={{ color: '#86909C' }} />
                    </motion.div>
                    <div className="flex items-center gap-2">
                      {livenessSteps.map((step, idx) => (
                        <motion.div
                          key={step.key}
                          className={`w-2 h-2 rounded-full ${
                            idx < currentLivenessStep ? 'bg-green-500' : idx === currentLivenessStep ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          animate={idx === currentLivenessStep ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium" style={{ color: scanSuccess ? '#00B42A' : '#1D2129' }}>
                {scanSuccess ? '识别成功' : livenessSteps[currentLivenessStep]?.label || '正在验证...'}
              </p>
              {scanning && (
                <p className="text-xs" style={{ color: '#86909C' }}>
                  活体检测中，请保持面部在框内
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
