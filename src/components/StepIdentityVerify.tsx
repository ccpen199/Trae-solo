import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanFace, CheckCircle } from 'lucide-react'

interface StepIdentityProps {
  idNumber: string
  onChange: (v: string) => void
  verified: boolean
  onVerified: () => void
}

export default function StepIdentityVerify({ idNumber, onChange, verified, onVerified }: StepIdentityProps) {
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  const startFaceScan = () => {
    setShowModal(true)
    setScanning(true)
    setScanSuccess(false)
    setTimeout(() => {
      setScanning(false)
      setScanSuccess(true)
      setTimeout(() => {
        setShowModal(false)
        onVerified()
      }, 1200)
    }, 2000)
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
        disabled={verified || !idNumber}
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
                    className="absolute inset-0 border-4 rounded-lg"
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
                  <ScanFace size={48} style={{ color: '#86909C' }} />
                )}
              </div>
              <p className="text-sm font-medium" style={{ color: scanSuccess ? '#00B42A' : '#1D2129' }}>
                {scanSuccess ? '识别成功' : '请将面部对准框内'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
