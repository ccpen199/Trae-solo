import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

interface SuccessPageProps {
  applicationNo: string
}

export default function SuccessPage({ applicationNo }: SuccessPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 space-y-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
      >
        <CheckCircle size={72} style={{ color: '#00B42A' }} />
      </motion.div>

      <h2 className="text-xl font-bold" style={{ color: '#1D2129' }}>申领提交成功</h2>

      <div
        className="rounded-xl p-5 text-center space-y-2 w-72"
        style={{ backgroundColor: '#F7F8FA' }}
      >
        <div>
          <p className="text-xs" style={{ color: '#86909C' }}>申领编号</p>
          <p className="text-lg font-bold" style={{ color: '#165DFF' }}>{applicationNo}</p>
        </div>
        <div
          className="pt-2"
          style={{ borderTop: '1px solid #E5E6EB' }}
        >
          <p className="text-xs" style={{ color: '#86909C' }}>预计审核时长</p>
          <p className="text-sm font-medium" style={{ color: '#4E5969' }}>5个工作日</p>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: '#86909C' }}>
        审核结果将以短信方式通知您，请保持手机畅通
      </p>
    </motion.div>
  )
}
