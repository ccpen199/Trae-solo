import React, { useState } from 'react'
import { useAppStore } from '../store'
import { Modal } from '../components/Modal'
import { StarRating } from '../components/StarRating'
import { mockSkillTags } from '../data/mockData'
import { formatDateTime } from '../utils/geo'
import type { Technician } from '../types'
import {
  Shield,
  Lock,
  Database,
  User as UserIcon,
  Phone,
  Star,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  FileCheck,
  ShieldCheck,
  Clock,
  MapPin,
  AlertTriangle,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react'

export const Profile: React.FC = () => {
  const { currentUser, tasks, reviews, technicians, unfreezeTechnician } = useAppStore()
  const [expandedTechId, setExpandedTechId] = useState<string | null>(null)
  const [showTechDetail, setShowTechDetail] = useState<Technician | null>(null)

  const myTasks = tasks.filter(t => t.userId === currentUser?.id)
  const myReviews = reviews.filter(r => r.fromUserId === currentUser?.id)

  const toggleExpand = (techId: string) => {
    setExpandedTechId(expandedTechId === techId ? null : techId)
  }

  const getTechReviews = (techId: string) => reviews.filter(r => r.toUserId === techId)
  const getTechAvgRating = (techId: string) => {
    const techReviews = getTechReviews(techId)
    if (techReviews.length === 0) return 0
    return techReviews.reduce((sum, r) => sum + r.rating, 0) / techReviews.length
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">个人中心</h2>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {currentUser?.name[0] || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{currentUser?.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {currentUser?.phone}
            </p>
          </div>
          <span className="badge-info">
            {currentUser?.role === 'user' ? '发单方' : '接单方'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-primary-600">{myTasks.length}</p>
          <p className="text-sm text-gray-500 mt-1">我的订单</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-warning-500">{myReviews.length}</p>
          <p className="text-sm text-gray-500 mt-1">我的评价</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-success-600">
            {myTasks.filter(t => t.status === 'completed' || t.status === 'paid' || t.status === 'reviewed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">已完成</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          数据安全与隐私
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
            <Lock className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-success-800 text-sm">本地 AES-256 加密存储</p>
              <p className="text-xs text-success-700 mt-1">
                所有订单、评价、支付凭证均使用 AES-256 加密存储在浏览器本地 IndexedDB 中，
                平台不存储任何交易数据，保障您的交易自主权。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
            <Database className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-800 text-sm">零佣金 · 去中心化交易</p>
              <p className="text-xs text-primary-700 mt-1">
                平台不收取任何佣金，交易由发单方和接单方直接协商完成。
                所有数据仅存储在您的设备本地，完全自主可控。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
            <UserIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-800 text-sm">双向互评 · 差评自动冻结</p>
              <p className="text-xs text-warning-700 mt-1">
                用户与师傅可互相评价。差评将触发对方账号自动冻结，
                需人工复核后方可解禁，有效保障交易双方权益。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-600" />
            平台师傅列表
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success-500"></span>
              在线 {technicians.filter(t => !t.frozen).length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-danger-500"></span>
              冻结 {technicians.filter(t => t.frozen).length}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {technicians.map(tech => {
            const isExpanded = expandedTechId === tech.id
            const techReviews = getTechReviews(tech.id)
            const avgRating = getTechAvgRating(tech.id)
            const techSkills = mockSkillTags.filter(s => tech.skillTags.includes(s.id))

            return (
              <div key={tech.id} className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleExpand(tech.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {tech.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{tech.name}</span>
                      {tech.frozen ? (
                        <span className="badge-danger flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> 已冻结
                        </span>
                      ) : tech.certificates.some(c => c.verified) ? (
                        <span className="badge-success flex items-center gap-0.5">
                          <BadgeCheck className="w-3 h-3" /> 已认证
                        </span>
                      ) : (
                        <span className="badge-warning">待认证</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <StarRating value={Math.round(avgRating || tech.rating)} readonly size="sm" />
                      <span>{(avgRating || tech.rating).toFixed(1)}分</span>
                      <span>·</span>
                      <span>{techReviews.length || tech.reviewCount}单</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {tech.serviceRadius}km
                      </span>
                    </div>
                    {techSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {techSkills.slice(0, 4).map(s => (
                          <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600">
                            {s.name}
                          </span>
                        ))}
                        {techSkills.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            +{techSkills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTechDetail(tech)
                      }}
                      className="p-2 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600"
                      title="查看完整档案"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3 bg-gray-50/50">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> 专业技能标签
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {techSkills.length > 0 ? (
                          techSkills.map(s => (
                            <span key={s.id} className="badge-info">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">暂无技能标签</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" /> 资质证书（OCR识别记录）
                      </p>
                      {tech.certificates.length === 0 ? (
                        <p className="text-xs text-gray-400 bg-white rounded-lg p-2 border border-dashed border-gray-200">
                          该师傅暂未上传资质证书
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {tech.certificates.map(cert => (
                            <div key={cert.id} className="p-2.5 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{cert.name}</span>
                                {cert.verified ? (
                                  <span className="badge-success flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3" /> 人工复核通过
                                  </span>
                                ) : (
                                  <span className="badge-warning">待人工复核</span>
                                )}
                              </div>
                              {cert.ocrData && (
                                <p className="text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded">
                                  📷 OCR识别：{cert.ocrData}
                                </p>
                              )}
                              {cert.verifiedAt && (
                                <p className="text-[11px] text-gray-400 mt-1">
                                  <Clock className="w-3 h-3 inline mr-0.5" />
                                  复核时间：{formatDateTime(cert.verifiedAt)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> 历史评价详情
                      </p>
                      {techReviews.length === 0 ? (
                        <p className="text-xs text-gray-400 bg-white rounded-lg p-2 border border-dashed border-gray-200">
                          暂无历史评价
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {techReviews.slice(0, 5).map(review => (
                            <div key={review.id} className="p-2.5 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <StarRating value={review.rating} readonly size="sm" />
                                <span className="text-[11px] text-gray-400">
                                  {formatDateTime(review.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {review.content || '未填写评价内容'}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {review.fromRole === 'user' ? '来自客户评价' : '来自同行互评'}
                              </p>
                            </div>
                          ))}
                          {techReviews.length > 5 && (
                            <button
                              onClick={() => setShowTechDetail(tech)}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                            >
                              查看全部 {techReviews.length} 条评价
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {tech.frozen && (
                      <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-danger-800">账号已被冻结</p>
                            <p className="text-[11px] text-danger-700 mt-0.5">
                              冻结原因：{tech.frozenReason || '收到差评触发自动冻结'}
                            </p>
                            <button
                              onClick={() => unfreezeTechnician(tech.id)}
                              className="btn-danger text-xs mt-2"
                            >
                              <Unlock className="w-3 h-3 inline mr-1" />
                              人工复核解禁
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        isOpen={!!showTechDetail}
        onClose={() => setShowTechDetail(null)}
        title="师傅完整档案"
        size="lg"
      >
        {showTechDetail && (() => {
          const tech = showTechDetail
          const techReviews = getTechReviews(tech.id)
          const avgRating = getTechAvgRating(tech.id)
          const techSkills = mockSkillTags.filter(s => tech.skillTags.includes(s.id))

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
                  {tech.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{tech.name}</h3>
                    {tech.frozen ? (
                      <span className="badge-danger flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> 已冻结
                      </span>
                    ) : tech.certificates.some(c => c.verified) ? (
                      <span className="badge-success flex items-center gap-0.5">
                        <BadgeCheck className="w-3 h-3" /> 资质已认证
                      </span>
                    ) : (
                      <span className="badge-warning">待资质认证</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{tech.phone}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <StarRating value={Math.round(avgRating || tech.rating)} readonly size="sm" />
                    <span className="text-sm font-medium text-gray-700">
                      {(avgRating || tech.rating).toFixed(1)} 分
                    </span>
                    <span className="text-sm text-gray-500">·</span>
                    <span className="text-sm text-gray-500">{techReviews.length || tech.reviewCount} 单历史</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">📍 服务范围</p>
                  <p className="font-medium">{tech.serviceRadius} 公里</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">📋 累计接单</p>
                  <p className="font-medium">{tech.reviewCount} 单</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning-500" /> 专业技能标签
                </p>
                <div className="flex flex-wrap gap-2">
                  {techSkills.length > 0 ? (
                    techSkills.map(s => (
                      <span key={s.id} className="badge-info">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">该师傅暂无技能标签</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FileCheck className="w-4 h-4 text-primary-600" /> 资质证书（含OCR识别记录）
                </p>
                {tech.certificates.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                    <EyeOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">该师傅暂未上传任何资质证书</p>
                    <p className="text-xs text-gray-400 mt-1">上传证书并通过OCR识别和人工复核后可提升接单优先级</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tech.certificates.map(cert => (
                      <div key={cert.id} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-primary-600" />
                            {cert.name}
                          </span>
                          {cert.verified ? (
                            <span className="badge-success flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> 人工复核通过
                            </span>
                          ) : (
                            <span className="badge-warning">待人工复核</span>
                          )}
                        </div>
                        {cert.ocrData && (
                          <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                            <p className="text-[11px] text-gray-400 mb-0.5">📷 OCR 智能识别结果：</p>
                            <p className="text-xs text-gray-600">{cert.ocrData}</p>
                          </div>
                        )}
                        {cert.verifiedAt && (
                          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            人工复核时间：{formatDateTime(cert.verifiedAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning-500" /> 全部历史评价（{techReviews.length}）
                </p>
                {techReviews.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                    <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">暂无历史评价</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {techReviews.map(review => (
                      <div key={review.id} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <StarRating value={review.rating} readonly size="sm" />
                          <span className="text-[11px] text-gray-400">
                            {formatDateTime(review.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {review.content || '未填写评价内容'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-gray-400">
                            {review.fromRole === 'user' ? '👤 来自客户评价' : '🔧 来自师傅互评'}
                          </span>
                          {review.rating <= 2 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-danger-50 text-danger-600">
                              差评（触发冻结）
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {tech.frozen && (
                <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-danger-800">该师傅账号已被系统自动冻结</p>
                      <p className="text-sm text-danger-700 mt-1">
                        冻结原因：{tech.frozenReason || '收到差评触发自动冻结机制'}
                      </p>
                      <button
                        onClick={() => {
                          unfreezeTechnician(tech.id)
                          setShowTechDetail(null)
                        }}
                        className="btn-danger text-sm mt-3"
                      >
                        <Unlock className="w-4 h-4 inline mr-1" />
                        申请人工复核解禁
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
