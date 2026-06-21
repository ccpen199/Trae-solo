import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Bell, AlertTriangle, ChevronDown, ChevronUp, Tag, Video, FileText, Calendar } from 'lucide-react'
import { mockAnnouncements } from '@/data/mockData'

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

  const policies = mockAnnouncements.filter((a) => a.type === '政策公告')
  const community = mockAnnouncements.filter((a) => a.type === '社区活动' || a.type === '服务通知')
  const emergencies = mockAnnouncements.filter((a) => a.type === '应急通知')

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
                            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{item.content}</div>
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
    </div>
  )
}
