import React, { useState } from 'react'
import { useAppStore } from '../store'
import { mockSkillTags } from '../data/mockData'
import { Modal } from '../components/Modal'
import { createCertificateFromImage } from '../utils/ocr'
import type { Certificate } from '../types'
import {
  Upload,
  X,
  FileCheck,
  Shield,
  Star,
  MapPin,
  BadgeCheck,
  AlertTriangle,
  Unlock,
  Loader2,
  Plus,
} from 'lucide-react'
import { StarRating } from '../components/StarRating'

export const TechProfile: React.FC = () => {
  const { currentTechnician, technicians, updateTechnician, unfreezeTechnician, reviews } = useAppStore()
  const [showCertModal, setShowCertModal] = useState(false)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [newCert, setNewCert] = useState<Certificate | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [serviceRadius, setServiceRadius] = useState(currentTechnician?.serviceRadius || 10)

  if (!currentTechnician) {
    return (
      <div className="card text-center text-gray-500 py-12">
        请在顶部切换至师傅模式
      </div>
    )
  }

  const myReviews = reviews.filter(r => r.toUserId === currentTechnician.id)
  const avgRating = myReviews.length > 0
    ? myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length
    : currentTechnician.rating

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCert(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const cert = await createCertificateFromImage(ev.target?.result as string, file.name)
      setNewCert(cert)
      setUploadingCert(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveCert = async () => {
    if (!newCert || !currentTechnician) return
    const updated = {
      ...currentTechnician,
      certificates: [...currentTechnician.certificates, newCert],
    }
    await updateTechnician(updated)
    setNewCert(null)
    setShowCertModal(false)
  }

  const handleSaveRadius = async () => {
    if (!currentTechnician) return
    await updateTechnician({ ...currentTechnician, serviceRadius })
  }

  const handleUnfreeze = async () => {
    if (!currentTechnician) return
    await unfreezeTechnician(currentTechnician.id)
  }

  const techSkills = mockSkillTags.filter(s => currentTechnician.skillTags.includes(s.id))

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">师傅档案</h2>

      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
            {currentTechnician.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{currentTechnician.name}</h3>
              {currentTechnician.certificates.some(c => c.verified) && (
                <BadgeCheck className="w-5 h-5 text-primary-600" />
              )}
              {currentTechnician.frozen && (
                <span className="badge-danger">已冻结</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{currentTechnician.phone}</p>
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm text-gray-500">
                {avgRating.toFixed(1)} · {myReviews.length || currentTechnician.reviewCount}条评价
              </span>
            </div>
          </div>
        </div>

        {currentTechnician.frozen && (
          <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-danger-800">账号已被冻结</p>
                <p className="text-sm text-danger-700 mt-1">
                  原因：{currentTechnician.frozenReason || '收到差评触发自动冻结'}
                </p>
                <button onClick={handleUnfreeze} className="btn-danger mt-3 text-sm">
                  <Unlock className="w-4 h-4 inline mr-1" />
                  人工复核解禁
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            服务范围
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={50}
            value={serviceRadius}
            onChange={e => setServiceRadius(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="font-medium text-primary-600 w-20 text-right">{serviceRadius} 公里</span>
        </div>
        <button onClick={handleSaveRadius} className="btn-primary w-full mt-3">
          保存服务范围
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-600" />
            技能标签
          </h3>
        </div>
        {techSkills.length === 0 ? (
          <p className="text-sm text-gray-500">暂无技能标签</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {techSkills.map(s => (
              <span key={s.id} className="badge-info">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            资质证书
          </h3>
          <button
            onClick={() => setShowCertModal(true)}
            className="text-sm text-primary-600 flex items-center gap-1"
            disabled={currentTechnician.frozen}
          >
            <Plus className="w-4 h-4" /> 上传证书
          </button>
        </div>
        {currentTechnician.certificates.length === 0 ? (
          <p className="text-sm text-gray-500">暂无资质证书，上传证书可提升接单优先级</p>
        ) : (
          <div className="space-y-2">
            {currentTechnician.certificates.map(cert => (
              <div key={cert.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    {cert.name}
                    {cert.verified ? (
                      <span className="badge-success">已认证</span>
                    ) : (
                      <span className="badge-warning">待审核</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{cert.ocrData}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-600" />
            历史评价
          </h3>
          <button onClick={() => setShowReviewModal(true)} className="text-sm text-primary-600">
            查看全部 ({myReviews.length})
          </button>
        </div>
        {myReviews.length === 0 ? (
          <p className="text-sm text-gray-500">暂无评价</p>
        ) : (
          <div className="space-y-3">
            {myReviews.slice(0, 3).map(review => (
              <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <StarRating value={review.rating} readonly size="sm" />
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600">{review.content || '未填写评价内容'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCertModal}
        onClose={() => {
          setShowCertModal(false)
          setNewCert(null)
          setUploadingCert(false)
        }}
        title="上传资质证书"
      >
        <div className="space-y-4">
          {!newCert ? (
            <div>
              <label className="label">选择证书图片（支持OCR自动识别）</label>
              <label className="block w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500">
                {uploadingCert ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    <span className="text-sm text-gray-500">正在识别证书信息...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500 mt-2">点击上传证书照片</span>
                    <span className="text-xs text-gray-400 mt-1">支持电工证、焊工证、维修资格证等</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCertUpload}
                  disabled={uploadingCert}
                />
              </label>
            </div>
          ) : (
            <>
              <div>
                <label className="label">证书预览</label>
                <img src={newCert.imageUrl} alt="" className="w-full rounded-lg max-h-48 object-contain bg-gray-100" />
              </div>
              <div>
                <label className="label">证书名称</label>
                <input
                  type="text"
                  className="input"
                  value={newCert.name}
                  onChange={e => setNewCert({ ...newCert, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">OCR识别信息</label>
                <textarea
                  className="input min-h-[80px] text-sm text-gray-600"
                  value={newCert.ocrData || ''}
                  onChange={e => setNewCert({ ...newCert, ocrData: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowCertModal(false)
                setNewCert(null)
              }}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            {newCert && (
              <button onClick={handleSaveCert} className="btn-primary flex-1">
                保存证书
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="全部评价"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {myReviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无评价</p>
          ) : (
            myReviews.map(review => (
              <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <StarRating value={review.rating} readonly size="sm" />
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600">{review.content || '未填写评价内容'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {review.fromRole === 'user' ? '来自客户' : '来自师傅'}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
