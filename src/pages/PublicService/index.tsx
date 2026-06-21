import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Bell, AlertTriangle, ChevronDown, ChevronUp, Tag, Video, FileText, Calendar, ChevronRight, Users, Phone, MapPin, Clock } from 'lucide-react'
import { mockAnnouncements, mockServices } from '@/data/mockData'

const tabs = [
  { key: '政策解读', icon: BookOpen },
  { key: '社区公告', icon: Bell },
  { key: '应急广播', icon: AlertTriangle },
]

const policyTags = ['全部', '社保', '公积金', '户籍', '教育']

export default function PublicService() {
  const [activeTab, setActiveTab] = useState('政策解读')
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState('全部')
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [signupEvent, setSignupEvent] = useState<string | null>(null)

  const policies = mockAnnouncements.filter((a) => a.type === '政策公告')
  const community = mockAnnouncements.filter((a) => a.type === '社区活动' || a.type === '服务通知')
  const emergencies = mockAnnouncements.filter((a) => a.type === '应急通知')

  const relatedServices = mockServices.slice(0, 4)

  const filteredPolicies = activeTag === '全部'
    ? policies
    : policies.filter((p) => {
        if (activeTag === '社保') return p.title.includes('社保')
        if (activeTag === '公积金') return p.title.includes('公积金')
        if (activeTag === '户籍') return p.title.includes('户籍')
        if (activeTag === '教育') return p.title.includes('教育')
        return true
      })

  const selected = policies.find((p) => p.id === selectedPolicy) ?? policies[0]

  const handleSignup = (title: string) => {
    setSignupEvent(title)
    setShowSignupModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="section-title">公共服务</h1>

        <div className="flex gap-2 mb-6">
          {tabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === key
                  ? 'gradient-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              <Icon className="w-4 h-4" />
              {key}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === '政策解读' && (
            <motion.div key="policy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="flex gap-2 mb-4 flex-wrap">
                {policyTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`badge cursor-pointer transition-all ${activeTag === tag ? 'bg-primary-50 text-primary-500 ring-1 ring-primary-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 max-h-[600px] overflow-y-auto scrollbar-hide">
                  {filteredPolicies.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPolicy(p.id)}
                      className={`w-full text-left px-4 py-3.5 transition-colors ${selected?.id === p.id ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${selected?.id === p.id ? 'text-primary-600' : 'text-gray-700'}`}>{p.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{p.date}</span>
                            <span className="badge bg-gold-50 text-gold-600 text-[10px]"><Video className="w-2.5 h-2.5 mr-0.5" />视频</span>
                            <span className="badge bg-primary-50 text-primary-500 text-[10px]"><FileText className="w-2.5 h-2.5 mr-0.5" />图解</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  {selected ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-info"><FileText className="w-3 h-3 mr-1" />图解</span>
                        <span className="badge badge-warning"><Video className="w-3 h-3 mr-1" />视频</span>
                      </div>
                      <h2 className="font-semibold text-lg text-gray-800 mt-3">{selected.title}</h2>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{selected.date}</p>
                      <div className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selected.content}</div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-primary-500" />
                          相关服务推荐
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {relatedServices.map((svc) => (
                            <a key={svc.id} href={`${svc.category === '政务办事' ? '/government' : '/city-service'}/${svc.id}`} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-gray-700 truncate">{svc.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">请选择左侧政策查看详情</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === '社区公告' && (
            <motion.div key="community" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="space-y-3">
                {community.map((item) => {
                  const isExpanded = expandedCard === item.id
                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                        className="w-full text-left px-5 py-4 flex items-start gap-3"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === '社区活动' ? 'bg-green-50 text-success' : 'bg-blue-50 text-sky'}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-800 truncate">{item.title}</h3>
                            <span className={`badge flex-shrink-0 ${item.type === '社区活动' ? 'bg-success-light text-success' : 'bg-primary-50 text-primary-500'}`}>{item.type}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                          {!isExpanded && <p className="text-xs text-gray-500 mt-2 line-clamp-1">{item.content}</p>}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                              {item.content}
                              {item.type === '社区活动' && (
                                <div className="mt-4 space-y-3">
                                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />梁溪区崇安寺街道</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />2025-06-25 14:00</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />限50人</span>
                                  </div>
                                  <button onClick={() => handleSignup(item.title)} className="w-full py-2.5 gradient-primary text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                                    立即报名参加
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {activeTab === '应急广播' && (
            <motion.div key="emergency" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">应急求助热线</h2>
                    <p className="text-white/80 text-sm">遇到紧急情况请立即拨打</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a href="tel:110" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors">
                    <p className="text-2xl font-bold">110</p>
                    <p className="text-xs text-white/80">报警电话</p>
                  </a>
                  <a href="tel:120" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors">
                    <p className="text-2xl font-bold">120</p>
                    <p className="text-xs text-white/80">急救电话</p>
                  </a>
                  <a href="tel:12345" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors col-span-2">
                    <p className="text-2xl font-bold">12345</p>
                    <p className="text-xs text-white/80">政务服务热线</p>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                {emergencies.filter((e) => e.priority === '紧急' || e.priority === '特别紧急').map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border-2 border-emergency/40 animate-breathe overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold text-sm">应急通知</span>
                      <span className={`ml-auto badge text-[10px] font-bold ${item.priority === '特别紧急' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-200 text-red-800'}`}>{item.priority}</span>
                    </div>
                    <div className="px-5 py-4">
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{item.date}</p>
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                ))}

                <h3 className="text-sm font-semibold text-gray-500 mt-8 mb-3">历史预警</h3>
                {emergencies.filter((e) => e.priority === '普通').map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-700">{item.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSignupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-2">活动报名</h3>
              <p className="text-sm text-gray-500 mb-4">{signupEvent}</p>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input type="text" placeholder="请输入姓名" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input type="tel" placeholder="请输入手机号" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
                  <input type="text" placeholder="请输入身份证号" className="input-field w-full" />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => { setShowSignupModal(false); alert('报名成功！') }}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
                >
                  确认报名
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
