import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, CreditCard, Shield, Home, FileText, Users,
  Star, QrCode, ChevronRight, Clock, X,
  Edit, BookOpen, UserCheck,
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const tabs = ['证照库', '办事记录', '代办管理'] as const
type TabKey = typeof tabs[number]

const certIcons: Record<string, React.ElementType> = {
  '身份证': CreditCard,
  '户口簿': Home,
  '社保卡': Shield,
  '营业执照': FileText,
  '结婚证': BookOpen,
}

const statusStyles: Record<string, string> = {
  '有效': 'bg-green-50 text-green-600',
  '过期': 'bg-red-50 text-red-600',
  '即将过期': 'bg-amber-50 text-amber-600',
}

const appStatusStyles: Record<string, string> = {
  '待提交': 'bg-gray-100 text-gray-500',
  '审核中': 'bg-blue-50 text-blue-600',
  '补正中': 'bg-amber-50 text-amber-600',
  '已办结': 'bg-green-50 text-green-600',
  '已驳回': 'bg-red-50 text-red-600',
}

export default function Profile() {
  const { user, certificates, applications, submitSatisfaction } = useStore()
  const [activeTab, setActiveTab] = useState<TabKey>('证照库')
  const [expandedCertId, setExpandedCertId] = useState<string | null>(null)
  const [ratingApp, setRatingApp] = useState<string | null>(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [showRatingModal, setShowRatingModal] = useState(false)

  const handleRate = (appId: string) => {
    setRatingApp(appId)
    setRatingScore(5)
    setRatingFeedback('')
    setShowRatingModal(true)
  }

  const submitRating = () => {
    if (ratingApp) {
      submitSatisfaction(ratingApp, ratingScore, ratingFeedback)
      setShowRatingModal(false)
      setRatingApp(null)
    }
  }

  const maskedId = user.idCard.replace(/^(.{4})(.+)(.{4})$/, '$1**********$3')
  const maskedPhone = user.phone.replace(/^(.{3})(.+)(.{4})$/, '$1****$3')

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="gradient-hero px-6 pt-10 pb-12">
        <div className="container mx-auto flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-gold-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              {user.verified && (
                <span className="bg-green-500 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  已实名
                </span>
              )}
            </div>
            <p className="text-gold-200 text-sm mt-1">身份证: {maskedId}</p>
            <p className="text-gold-200 text-sm">手机: {maskedPhone}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <Edit className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative
                ${activeTab === tab ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="profile-tab"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === '证照库' && (
            <motion.div
              key="certs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {certificates.map((cert) => {
                const Icon = certIcons[cert.type] ?? CreditCard
                const isExpanded = expandedCertId === cert.id
                return (
                  <motion.div
                    key={cert.id}
                    layout
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer"
                    onClick={() => setExpandedCertId(isExpanded ? null : cert.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{cert.type}</p>
                        <p className="text-xs text-gray-400">{cert.holderName}</p>
                      </div>
                      <span className={`badge text-xs ${statusStyles[cert.status] ?? 'badge-info'}`}>
                        {cert.status}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {Object.entries(cert.details).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-sm">
                                <span className="text-gray-400">{k}</span>
                                <span className="text-gray-700">{v}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {activeTab === '办事记录' && (
            <motion.div
              key="records"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0
                      ${app.status === '已办结' ? 'bg-green-500' : app.status === '已驳回' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{app.serviceName}</p>
                        <span className={`badge text-xs ${appStatusStyles[app.status] ?? 'badge-info'}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        提交于 {app.submittedAt} · 预计 {app.estimatedCompletion}
                      </p>
                      {app.status === '已办结' && (
                        <div className="mt-2 flex items-center gap-2">
                          {app.satisfaction ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < app.satisfaction! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRate(app.id)}
                              className="text-xs bg-primary-50 text-primary-500 px-3 py-1 rounded-full font-medium hover:bg-primary-100 transition-colors"
                            >
                              评价
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === '代办管理' && (
            <motion.div
              key="proxy"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {user.proxyBindings.map((binding) => (
                <div
                  key={binding.proxyUserId}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{binding.proxyName}</p>
                      <p className="text-xs text-gray-400">{binding.relation}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {binding.authorizedScopes.map((scope) => (
                      <span key={scope} className="badge bg-gold-50 text-gold-600 text-xs">{scope}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">绑定于 {binding.boundAt}</span>
                    <button className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      解除绑定
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-dashed border-gray-300
                                  flex items-center justify-center gap-2 text-primary-500 font-semibold
                                  hover:bg-primary-50 transition-colors">
                <QrCode className="w-5 h-5" />
                添加代办人
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">服务评价</h3>
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRatingScore(i + 1)}>
                  <Star className={`w-8 h-8 transition-colors
                    ${i < ratingScore ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="请输入您的评价..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={submitRating}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
              >
                提交
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
