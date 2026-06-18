import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Clock, CreditCard, FileText, AlertCircle, MapPin, Phone } from 'lucide-react'
import { type ApplicationRecord, statusLabels, statusColors, subsidyTypeLabels } from './data'

interface ApplicationDetailProps {
  application: ApplicationRecord
  onClose: () => void
  onSupplement: (app: ApplicationRecord) => void
  onCancel: (app: ApplicationRecord) => void
}

export default function ApplicationDetail({ application, onClose, onSupplement, onCancel }: ApplicationDetailProps) {
  const uploadedMaterials = application.materials.filter((m) => m.uploaded)
  const deficientMaterials = application.materials.filter((m) => m.isDeficient)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white z-10 px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#1D2129' }}>申领详情</h2>
              <p className="text-xs mt-0.5" style={{ color: '#86909C' }}>{application.applicationNo}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#86909C' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-5 space-y-5">
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: statusColors[application.status] + '10' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: statusColors[application.status] + '20' }}
              >
                {application.status === 'approved' ? (
                  <CheckCircle size={20} style={{ color: statusColors[application.status] }} />
                ) : application.status === 'rejected' ? (
                  <AlertCircle size={20} style={{ color: statusColors[application.status] }} />
                ) : (
                  <Clock size={20} style={{ color: statusColors[application.status] }} />
                )}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: statusColors[application.status] }}>
                  {statusLabels[application.status]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#86909C' }}>
                  申请时间：{application.applyDate}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: '#1D2129' }}>办理进度</h3>
              <div className="relative pl-6">
                {application.progress.map((step, idx) => (
                  <div key={step.key} className="relative pb-5 last:pb-0">
                    {idx < application.progress.length - 1 && (
                      <div
                        className="absolute left-[-17px] top-3 w-0.5 h-full"
                        style={{
                          backgroundColor: step.completed ? '#00B42A' : '#E5E6EB',
                        }}
                      />
                    )}
                    <div
                      className="absolute left-[-22px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: step.completed || step.current ? '#00B42A' : '#E5E6EB',
                        backgroundColor: step.completed ? '#00B42A' : '#fff',
                      }}
                    >
                      {step.completed && <CheckCircle size={10} style={{ color: '#fff' }} />}
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className="text-sm font-medium"
                        style={{ color: step.completed || step.current ? '#1D2129' : '#86909C' }}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs" style={{ color: '#86909C' }}>{step.date}</p>
                      )}
                    </div>
                    {step.current && (
                      <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-xs mt-1"
                        style={{ color: '#165DFF' }}
                      >
                        正在处理中...
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: '#1D2129' }}>补贴明细</h3>
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#F7F8FA' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#86909C' }}>补贴类型</span>
                  <span className="text-sm font-medium" style={{ color: '#4E5969' }}>
                    {subsidyTypeLabels[application.subsidyType]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#86909C' }}>每月金额</span>
                  <span className="text-sm font-medium" style={{ color: '#4E5969' }}>
                    ¥{application.monthlyAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#86909C' }}>补贴月数</span>
                  <span className="text-sm font-medium" style={{ color: '#4E5969' }}>
                    {application.months > 0 ? `${application.months}个月` : '---'}
                  </span>
                </div>
                <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid #E5E6EB' }}>
                  <span className="text-sm font-medium" style={{ color: '#4E5969' }}>累计金额</span>
                  <span className="text-lg font-bold" style={{ color: '#165DFF' }}>
                    ¥{application.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: '#1D2129' }}>银行卡信息</h3>
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#F7F8FA' }}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#E8F0FF' }}
                >
                  <CreditCard size={18} style={{ color: '#165DFF' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#4E5969' }}>{application.bankName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#86909C' }}>{application.cardNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: '#1D2129' }}>联系信息</h3>
              <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: '#F7F8FA' }}>
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: '#86909C' }} />
                  <span className="text-sm" style={{ color: '#4E5969' }}>{application.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: '#86909C' }} />
                  <span className="text-sm" style={{ color: '#4E5969' }}>户籍地：{application.domicile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: '#86909C' }} />
                  <span className="text-sm" style={{ color: '#4E5969' }}>常住地：{application.residence}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: '#1D2129' }}>材料清单</h3>
              <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: '#F7F8FA' }}>
                {uploadedMaterials.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium" style={{ color: '#00B42A' }}>已提交材料</p>
                    {uploadedMaterials.map((mat) => (
                      <div key={mat.id} className="flex items-center gap-2">
                        <FileText size={14} style={{ color: '#00B42A' }} />
                        <span className="text-sm" style={{ color: '#4E5969' }}>{mat.label}</span>
                        {mat.fileName && (
                          <span className="text-xs ml-auto" style={{ color: '#86909C' }}>
                            {mat.fileName} · {mat.fileSize}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {deficientMaterials.length > 0 && (
                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #E5E6EB' }}>
                    <p className="text-xs font-medium" style={{ color: '#F53F3F' }}>容缺材料</p>
                    {deficientMaterials.map((mat) => (
                      <div key={mat.id} className="flex items-center gap-2">
                        <FileText size={14} style={{ color: '#F53F3F' }} />
                        <span className="text-sm" style={{ color: '#4E5969' }}>{mat.label}</span>
                        <span className="text-xs ml-auto" style={{ color: '#F53F3F' }}>待补充</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex gap-3">
            {application.status === 'supplement' && (
              <button
                onClick={() => onSupplement(application)}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#165DFF' }}
              >
                补充材料
              </button>
            )}
            {(application.status === 'pending' || application.status === 'reviewing' || application.status === 'supplement') && (
              <button
                onClick={() => onCancel(application)}
                className={`${application.status === 'supplement' ? '' : 'flex-1'} py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50`}
                style={{ borderColor: '#E5E6EB', color: '#F53F3F' }}
              >
                撤销申请
              </button>
            )}
            {application.status === 'approved' && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#00B42A' }}
              >
                我知道了
              </button>
            )}
            {application.status === 'rejected' && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#F53F3F' }}
              >
                我知道了
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
