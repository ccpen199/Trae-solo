import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Home, Users, CreditCard, Landmark, FileText, Clock, CheckCircle, User, ArrowRight, AlertTriangle, FileCheck, Lock } from 'lucide-react'
import { mockServices } from '@/data/mockData'
import { useStore } from '@/store/useStore'

const iconMap: Record<string, React.ElementType> = {
  Shield, Home, Users, CreditCard, Landmark, FileText,
}

const subCategories = [
  { key: '社保', icon: Shield, label: '社保' },
  { key: '公积金', icon: Home, label: '公积金' },
  { key: '户籍', icon: Users, label: '户籍' },
]

const statusColors: Record<string, string> = {
  '待提交': 'bg-gray-100 text-gray-500',
  '审核中': 'bg-blue-50 text-blue-600',
  '补正中': 'bg-gold-50 text-gold-600',
  '已办结': 'bg-success-light text-success',
  '已驳回': 'bg-emergency-light text-emergency',
}

export default function Government() {
  const [activeCategory, setActiveCategory] = useState('社保')
  const navigate = useNavigate()
  const { user, isAuthenticated, applications, certificates, loginWithSSO } = useStore()

  const govServices = mockServices.filter((s) => s.category === '政务办事')
  const filteredServices = govServices.filter((s) => s.subCategory === activeCategory)

  const inProgress = applications.filter(a => a.status === '审核中' || a.status === '补正中')
  const needCorrection = applications.filter(a => a.status === '补正中')
  const completed = applications.filter(a => a.status === '已办结')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="section-title">政务办事</h1>

        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 mb-8 text-white shadow-lg"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Lock className="w-8 h-8 text-gold-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">登录后办理政务服务</h2>
                <p className="text-primary-100 mb-4">完成统一身份认证后，自动调取您的电子证照、续办历史办件、查看办理进度</p>
                <div className="flex flex-wrap gap-4 mb-5 text-sm">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-gold-300" />
                    证照自动填充
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-gold-300" />
                    材料AI预审
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-gold-300" />
                    办件进度跟踪
                  </span>
                </div>
                <button
                  onClick={loginWithSSO}
                  className="px-8 py-3 bg-gold-400 text-primary-900 rounded-full font-semibold hover:bg-gold-300 transition-colors shadow-lg"
                >
                  统一身份认证登录
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary-900">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">您好，{user?.name}</h2>
                <p className="text-sm text-gray-400">已实名认证 · {certificates.length} 份电子证照可用</p>
              </div>
              <Link to="/profile" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
                个人中心 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/government" className="block">
                <div className="bg-primary-50 rounded-xl p-4 hover:bg-primary-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{inProgress.length}</p>
                  <p className="text-sm text-gray-500">办理中</p>
                </div>
              </Link>
              <Link to="/government" className="block">
                <div className="bg-gold-50 rounded-xl p-4 hover:bg-gold-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    {needCorrection.length > 0 && (
                      <span className="text-xs bg-gold-500 text-white px-1.5 py-0.5 rounded-full">待补正</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{needCorrection.length}</p>
                  <p className="text-sm text-gray-500">待补正</p>
                </div>
              </Link>
              <Link to="/profile" className="block">
                <div className="bg-success-light rounded-xl p-4 hover:bg-green-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{completed.length}</p>
                  <p className="text-sm text-gray-500">已办结</p>
                </div>
              </Link>
              <Link to="/profile" className="block">
                <div className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{certificates.length}</p>
                  <p className="text-sm text-gray-500">电子证照</p>
                </div>
              </Link>
            </div>

            {needCorrection.length > 0 && (
              <div className="mt-6 p-4 bg-gold-50 border border-gold-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-gold-600" />
                  <span className="font-semibold text-gold-800">您有 {needCorrection.length} 项办件需要补正材料</span>
                </div>
                <div className="space-y-2">
                  {needCorrection.map(app => (
                    <button
                      key={app.id}
                      onClick={() => navigate(`/government/${app.serviceId}`)}
                      className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gold-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gold-500" />
                        <span className="text-sm font-medium text-gray-800">{app.serviceName}</span>
                      </div>
                      <span className="text-sm text-gold-600 font-medium">立即补正 →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {inProgress.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  进行中的办件
                </h3>
                <div className="space-y-2">
                  {inProgress.slice(0, 3).map(app => (
                    <button
                      key={app.id}
                      onClick={() => navigate(`/government/${app.serviceId}`)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${app.status === '补正中' ? 'bg-gold-500' : 'bg-blue-500'}`} />
                        <span className="text-sm text-gray-800">{app.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge ${statusColors[app.status]}`}>{app.status}</span>
                        <span className="text-xs text-gray-400">预计 {app.estimatedCompletion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="flex gap-6">
          <div className="w-32 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {subCategories.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full flex flex-col items-center gap-1.5 py-5 px-2 text-sm font-medium transition-colors
                    ${activeCategory === key
                      ? 'bg-primary-50 text-primary-500 border-l-4 border-l-gold-400'
                      : 'text-gray-500 hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredServices.map((svc) => {
                const Icon = iconMap[svc.iconName] ?? Shield
                return (
                  <Link
                    key={svc.id}
                    to={`/government/${svc.id}`}
                    className="bg-white rounded-xl p-5 card-hover shadow-sm border border-gray-100 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 truncate">{svc.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-primary-50 text-primary-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {svc.avgProcessingDays === 0 ? '即时' : `${svc.avgProcessingDays}天`}
                      </span>
                      {svc.onlineProcessing && (
                        <span className="badge bg-success-light text-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          网办
                        </span>
                      )}
                    </div>
                    {svc.requiredCerts.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {svc.requiredCerts.map((cert) => (
                          <span key={cert} className="badge bg-gold-50 text-gold-600">{cert}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">点击立即办理</span>
                      <ArrowRight className="w-4 h-4 text-primary-500" />
                    </div>
                  </Link>
                )
              })}
            </motion.div>
          </div>
        </div>

        {isAuthenticated && applications.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title">我的办事</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/government/${app.serviceId}`)}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    app.status === '已办结' ? 'bg-success' :
                    app.status === '补正中' ? 'bg-gold-500' :
                    app.status === '已驳回' ? 'bg-emergency' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{app.serviceName}</p>
                      <span className={`badge flex-shrink-0 ${statusColors[app.status] ?? 'badge-info'}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      申请编号 {app.id} · 提交于 {app.submittedAt}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">预计完成</p>
                    <p className="text-sm font-medium text-gray-700">{app.estimatedCompletion}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {app.status === '补正中' && (
                      <span className="text-sm text-gold-600 font-medium">补正材料 →</span>
                    )}
                    {app.status === '审核中' && (
                      <span className="text-sm text-blue-600 font-medium">查看进度 →</span>
                    )}
                    {app.status === '已办结' && (
                      <span className="text-sm text-success font-medium">查看结果 →</span>
                    )}
                    {app.status === '已驳回' && (
                      <span className="text-sm text-emergency font-medium">重新申请 →</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
