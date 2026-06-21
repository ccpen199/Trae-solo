import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Home, Users, CreditCard, Landmark, FileText, Clock, CheckCircle } from 'lucide-react'
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
  const applications = useStore((s) => s.applications)

  const govServices = mockServices.filter((s) => s.category === '政务办事')
  const filteredServices = govServices.filter((s) => s.subCategory === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="section-title">政务办事</h1>

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
                  </Link>
                )
              })}
            </motion.div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="section-title">我的办事</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/government/${app.serviceId}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{app.serviceName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    提交于 {app.submittedAt} · 预计 {app.estimatedCompletion}
                  </p>
                </div>
                <span className={`badge flex-shrink-0 ${statusColors[app.status] ?? 'badge-info'}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
