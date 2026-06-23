import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  QrCode,
  Keyboard,
  X,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { cn } from '@shared/utils'

export default function ScanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showInput, setShowInput] = useState(false)
  const [cabinetCode, setCabinetCode] = useState('')
  const [scanning, setScanning] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)

  useEffect(() => {
    if (scanning && !scanSuccess) {
      const timer = setTimeout(() => {
        setScanSuccess(true)
        setScanning(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [scanning, scanSuccess])

  useEffect(() => {
    if (scanSuccess) {
      const timer = setTimeout(() => {
        navigate('/rider/swap/CAB-001')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [scanSuccess, navigate])

  const handleBack = () => {
    navigate(-1)
  }

  const handleSubmitCode = () => {
    if (cabinetCode.trim()) {
      setScanSuccess(true)
      setScanning(false)
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === 'del') {
      setCabinetCode((prev) => prev.slice(0, -1))
    } else if (key === 'ok') {
      handleSubmitCode()
    } else if (cabinetCode.length < 8) {
      setCabinetCode((prev) => prev + key)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-cyber-darker relative"
    >
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-cyber-border bg-cyber-dark/50 backdrop-blur z-20">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-cyber-muted hover:text-cyber-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-rajdhani font-semibold text-lg text-cyber-text">
          扫码换电
        </h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-cyber-darker/80 via-transparent to-cyber-darker/80" />

        <div className="relative h-full flex items-center justify-center px-8">
          <motion.div
            className="relative w-full max-w-[280px] aspect-square"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 border-2 border-cyber-accent/30 rounded-lg" />

            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyber-accent rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyber-accent rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyber-accent rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyber-accent rounded-br-lg" />

            <AnimatePresence mode="wait">
              {scanning && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 overflow-hidden"
                >
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-accent to-transparent"
                    style={{
                      boxShadow: '0 0 20px rgba(0, 229, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.4)',
                    }}
                    animate={{
                      top: ['0%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <motion.div
                    className="absolute left-0 right-0 h-16 bg-gradient-to-b from-cyber-accent/20 to-transparent"
                    animate={{
                      top: ['0%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              )}

              {scanSuccess && (
                <motion.div
                  key="success"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-cyber-success/30"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <div className="w-20 h-20 rounded-full bg-cyber-success/20 border-2 border-cyber-success flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-cyber-success" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="absolute bottom-32 left-0 right-0 text-center">
          <AnimatePresence mode="wait">
            {scanning && (
              <motion.div
                key="scanning-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-cyber-text font-medium">将二维码放入框内</p>
                <p className="text-cyber-muted text-sm mt-1">自动识别换电柜二维码</p>
              </motion.div>
            )}
            {scanSuccess && (
              <motion.div
                key="success-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-cyber-success font-medium">识别成功</p>
                <p className="text-cyber-muted text-sm mt-1">正在进入换电流程...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInput(true)}
          className="w-full py-3.5 px-4 rounded-xl border border-cyber-border bg-cyber-dark/50 text-cyber-text font-medium flex items-center justify-center gap-2 hover:border-cyber-accent/50 transition-colors"
        >
          <Keyboard className="w-5 h-5 text-cyber-accent" />
          手动输入柜体编号
        </motion.button>
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-cyber-darker/95 backdrop-blur z-30 flex flex-col"
          >
            <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-cyber-border">
              <span className="font-rajdhani font-semibold text-lg text-cyber-text">
                输入柜体编号
              </span>
              <button
                onClick={() => {
                  setShowInput(false)
                  setCabinetCode('')
                }}
                className="p-2 -mr-2 text-cyber-muted hover:text-cyber-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center px-6">
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        'w-8 h-10 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-bold',
                        cabinetCode[index]
                          ? 'border-cyber-accent bg-cyber-accent/10 text-cyber-accent'
                          : 'border-cyber-border bg-cyber-dark text-cyber-muted'
                      )}
                      animate={
                        cabinetCode[index]
                          ? { scale: [1, 1.1, 1] }
                          : {}
                      }
                      transition={{ duration: 0.2 }}
                    >
                      {cabinetCode[index] || ''}
                    </motion.div>
                  ))}
                </div>
                <p className="text-center text-cyber-muted text-sm">
                  请输入柜体编号，如 CAB-001
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CAB', '0', 'del'].map((key) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeyPress(key === 'CAB' ? 'CAB-' : key === 'del' ? 'del' : key)}
                    className={cn(
                      'h-12 rounded-lg font-rajdhani font-semibold text-lg flex items-center justify-center transition-colors',
                      key === 'del'
                        ? 'bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/50'
                        : key === 'CAB'
                        ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50 text-sm'
                        : 'bg-cyber-dark text-cyber-text border border-cyber-border'
                    )}
                  >
                    {key === 'del' ? '←' : key}
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitCode}
                disabled={cabinetCode.length < 5}
                className={cn(
                  'mt-8 w-full max-w-xs mx-auto py-3.5 px-4 rounded-xl font-rajdhani font-bold text-base flex items-center justify-center gap-2 transition-all',
                  cabinetCode.length >= 5
                    ? 'bg-gradient-to-r from-cyber-accent to-cyber-success text-cyber-darker shadow-neon-cyan'
                    : 'bg-cyber-border text-cyber-muted cursor-not-allowed'
                )}
              >
                <Zap className="w-5 h-5" />
                确认换电
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
