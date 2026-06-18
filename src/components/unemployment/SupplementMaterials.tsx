import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react'
import { type ApplicationRecord, type MaterialItem } from './data'

interface SupplementMaterialsProps {
  application: ApplicationRecord
  onBack: () => void
  onSubmit: () => void
}

export default function SupplementMaterials({ application, onBack, onSubmit }: SupplementMaterialsProps) {
  const deficientMaterials = application.materials.filter((m) => m.isDeficient)
  const [materials, setMaterials] = useState<MaterialItem[]>(deficientMaterials)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const allUploaded = materials.every((m) => m.uploaded)

  const simulateUpload = (id: string) => {
    if (uploadingId) return
    setUploadingId(id)
    setUploadProgress(0)

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadProgress(100)
        setTimeout(() => {
          setMaterials((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, uploaded: true, fileName: `${m.label}.pdf`, fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)}MB` }
                : m
            )
          )
          setUploadingId(null)
          setUploadProgress(0)
        }, 300)
      } else {
        setUploadProgress(progress)
      }
    }, 200)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => {
      onSubmit()
    }, 1500)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          <CheckCircle size={72} style={{ color: '#00B42A' }} />
        </motion.div>
        <h2 className="text-xl font-bold" style={{ color: '#1D2129' }}>补充材料提交成功</h2>
        <p className="text-sm text-center" style={{ color: '#86909C' }}>
          已重新提交审核，请耐心等待结果
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs"
          style={{ color: '#165DFF' }}
        >
          即将返回申领详情...
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#4E5969' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#1D2129' }}>补充材料</h2>
          <p className="text-xs mt-0.5" style={{ color: '#86909C' }}>
            申领编号：{application.applicationNo}
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: '#FFF7E8' }}
      >
        <AlertCircle size={18} style={{ color: '#FF7D00' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium" style={{ color: '#FF7D00' }}>请补充以下材料</p>
          <p className="text-xs mt-1" style={{ color: '#86909C' }}>
            带 <span style={{ color: '#F53F3F' }}>*</span> 为必填项，请在规定时间内完成补充
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className="rounded-xl p-4 border transition-colors"
            style={{
              borderColor: mat.uploaded ? '#00B42A' : '#E5E6EB',
              backgroundColor: mat.uploaded ? '#F0FFF4' : '#fff',
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} style={{ color: mat.uploaded ? '#00B42A' : '#86909C' }} />
                <span className="text-sm font-medium" style={{ color: '#1D2129' }}>
                  {mat.label}
                </span>
                <span style={{ color: '#F53F3F' }}>*</span>
              </div>
              {mat.uploaded && (
                <span className="text-xs font-medium" style={{ color: '#00B42A' }}>已上传</span>
              )}
            </div>

            {mat.uploaded && mat.fileName && (
              <div className="flex items-center justify-between text-xs" style={{ color: '#86909C' }}>
                <span>{mat.fileName}</span>
                <span>{mat.fileSize}</span>
              </div>
            )}

            {!mat.uploaded && uploadingId === mat.id && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#165DFF' }}>上传中...</span>
                  <span style={{ color: '#86909C' }}>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E6EB' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: '#165DFF', width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {!mat.uploaded && uploadingId !== mat.id && (
              <button
                onClick={() => simulateUpload(mat.id)}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: '#165DFF', color: '#165DFF' }}
              >
                <Upload size={16} />
                点击上传
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allUploaded}
        className="w-full py-3 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#165DFF' }}
      >
        提交补充材料
      </button>
    </div>
  )
}
