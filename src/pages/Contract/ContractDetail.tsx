import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, PenLine, Check } from 'lucide-react'
import { contracts } from '@/mocks'

interface TimelineEntry {
  date: string
  event: string
  done: boolean
}

function buildTimeline(status: string, createDate: string, signDate?: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { date: createDate, event: '合同创建', done: true },
  ]
  if (status === 'draft') {
    entries.push({ date: '', event: '等待签署', done: false })
    entries.push({ date: '', event: '合同签署', done: false })
    entries.push({ date: '', event: '履约执行', done: false })
    entries.push({ date: '', event: '合同完成', done: false })
    return entries
  }
  entries.push({ date: createDate, event: '发起签署', done: true })
  if (signDate) {
    entries.push({ date: signDate, event: '合同签署', done: true })
  } else {
    entries.push({ date: '', event: '合同签署', done: false })
  }
  if (['signed', 'fulfilling', 'completed', 'disputed'].includes(status)) {
    entries.push({ date: signDate || '', event: '签署完成', done: true })
  }
  if (['fulfilling', 'completed'].includes(status)) {
    entries.push({ date: signDate || '', event: '履约执行中', done: true })
  } else if (status === 'disputed') {
    entries.push({ date: '', event: '争议处理', done: false })
  }
  if (status === 'completed') {
    entries.push({ date: '', event: '合同完成', done: true })
  }
  return entries
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const contract = contracts.find((c) => c.id === id)

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">合同未找到</p>
          <button
            onClick={() => navigate('/contract')}
            className="mt-4 text-primary-500 hover:underline"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const canSign = contract.status === 'signing' || contract.status === 'draft'
  const timeline = buildTimeline(contract.status, contract.createDate, contract.signDate)

  return (
    <div className="min-h-screen bg-[#fafaf8] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/contract')}
            className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-8 pb-6 border-b border-gray-200">
                <h1 className="font-serif text-2xl font-bold text-earth-500">{contract.title}</h1>
                <p className="text-gray-400 text-sm mt-1">合同编号：{contract.id}</p>
              </div>

              <div className="mb-6">
                <h2 className="font-serif text-lg font-semibold text-earth-500 mb-3">合同方</h2>
                <div className="grid grid-cols-2 gap-4">
                  {contract.parties.map((party, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-1">{i === 0 ? '甲方' : '乙方'}</p>
                      <p className="font-medium text-earth-500">{party}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="font-serif text-lg font-semibold text-earth-500 mb-3">合同条款</h2>
                <ol className="space-y-2">
                  {contract.terms.map((term, i) => (
                    <li key={i} className="flex gap-3 text-gray-600">
                      <span className="text-primary-500 font-medium min-w-[20px]">{i + 1}.</span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mb-8">
                <h2 className="font-serif text-lg font-semibold text-earth-500 mb-3">合同金额</h2>
                <p className="text-3xl font-bold text-primary-500">
                  ¥{contract.amount.toLocaleString('zh-CN')}
                </p>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-6">
                <h2 className="font-serif text-lg font-semibold text-earth-500 mb-4">签署区域</h2>
                <div className="grid grid-cols-2 gap-6">
                  {contract.parties.map((party, i) => (
                    <div key={i} className="border-2 border-dashed border-gray-200 rounded-lg p-6 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-xs text-gray-400 mb-2">{i === 0 ? '甲方签署' : '乙方签署'}</p>
                      <p className="text-sm text-gray-300">{party}</p>
                      {contract.signDate && i === 0 && (
                        <div className="mt-3 flex items-center gap-1 text-primary-500">
                          <Check className="w-4 h-4" />
                          <span className="text-xs">已签署</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {canSign && (
                <div className="mt-6 text-center">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm">
                    <PenLine className="w-4 h-4" />
                    签署合同
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-serif text-lg font-semibold text-earth-500 mb-4">合同状态</h3>
              <div className="space-y-0">
                {timeline.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        entry.done ? 'bg-primary-500' : 'bg-gray-200'
                      }`} />
                      {i < timeline.length - 1 && (
                        <div className={`w-0.5 h-8 ${
                          entry.done ? 'bg-primary-300' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-medium ${
                        entry.done ? 'text-earth-500' : 'text-gray-400'
                      }`}>
                        {entry.event}
                      </p>
                      {entry.date && (
                        <p className="text-xs text-gray-400 mt-0.5">{entry.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
