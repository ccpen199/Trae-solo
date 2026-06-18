import { motion } from 'framer-motion'
import { Download, QrCode, ShieldCheck, Clock } from 'lucide-react'
import { certificateData } from './mockData'

export default function CertificateTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-md mx-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={24} />
              <span className="font-semibold text-lg">电子参保凭证</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">有效</span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-5">
            <div className="text-center mb-4">
              <div className="w-28 h-28 mx-auto bg-white rounded-lg flex items-center justify-center">
                <QrCode size={80} className="text-gray-800" />
              </div>
              <p className="text-xs text-white/70 mt-2">扫码验证</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">凭证编号</span>
                <span className="font-mono">{certificateData.certificateNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">姓名</span>
                <span>{certificateData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">身份证号</span>
                <span className="font-mono">{certificateData.idCard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">参保类型</span>
                <span>{certificateData.insuranceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">参保状态</span>
                <span className="text-success">{certificateData.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/80">
            <Clock size={14} />
            <span>有效期：{certificateData.validFrom} 至 {certificateData.validTo}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex gap-3 mt-5"
      >
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Download size={16} />
          下载凭证
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
          <QrCode size={16} />
          出示二维码
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="text-xs text-gray-400 text-center mt-4"
      >
        本电子凭证与纸质凭证具有同等法律效力
      </motion.p>
    </motion.div>
  )
}
