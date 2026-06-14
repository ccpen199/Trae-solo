import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Bug, BookOpen, CloudRain } from 'lucide-react'
import type { QATicket } from '@/types'
import { qaTickets } from '@/mocks'

const QA_STATUS: Record<QATicket['status'], { label: string; color: string }> = {
  pending: { label: '待处理', color: 'text-yellow-600 bg-yellow-50' },
  assigned: { label: '已指派', color: 'text-blue-600 bg-blue-50' },
  answered: { label: '已回复', color: 'text-primary-600 bg-primary-50' },
  closed: { label: '已关闭', color: 'text-gray-500 bg-gray-100' },
}

const FEATURE_CARDS = [
  {
    title: '专家问答',
    icon: MessageCircle,
    gradient: 'from-primary-400 to-primary-600',
    desc: '提交问题，专家在线解答',
    path: '/knowledge/qa',
  },
  {
    title: '病虫害识别',
    icon: Bug,
    gradient: 'from-gold-400 to-gold-600',
    desc: 'AI图像识别，快速诊断',
    path: '/knowledge/diagnose',
  },
  {
    title: '知识文章',
    icon: BookOpen,
    gradient: 'from-sky-400 to-sky-600',
    desc: '分类浏览，视频教程',
    path: '/knowledge/articles',
  },
  {
    title: '气象预警',
    icon: CloudRain,
    gradient: 'from-orange-400 to-orange-600',
    desc: '实时天气，灾害推送',
    path: '/knowledge/weather',
  },
]

export default function KnowledgePage() {
  const navigate = useNavigate()
  const recentTickets = qaTickets.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#fafaf8] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-earth-500">农技知识库</h1>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {FEATURE_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(card.path)}
              className="cursor-pointer group"
            >
              <div className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white shadow-sm hover:shadow-lg transition-all group-hover:scale-[1.02]`}>
                <card.icon className="w-8 h-8 mb-3 opacity-90" />
                <h3 className="font-serif text-lg font-semibold">{card.title}</h3>
                <p className="text-sm opacity-80 mt-1">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-serif text-xl font-semibold text-earth-500 mb-4">最近问答</h2>
          <div className="space-y-3">
            {recentTickets.map((ticket) => {
              const statusCfg = QA_STATUS[ticket.status]
              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate('/knowledge/qa')}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-earth-500 truncate">{ticket.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{ticket.category}</span>
                      <span className="text-xs text-gray-400">{ticket.asker}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
