import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, CheckCircle2, Plus, X, Clock } from 'lucide-react'
import { merchants } from '@/data'

const stats = [
  { label: '浏览量', value: '1,234', trend: 'up' as const },
  { label: '咨询量', value: '56', trend: 'up' as const },
  { label: '发布量', value: '8', trend: 'down' as const },
]

const verificationSteps = ['提交申请', '资质审核', '审核通过']

const recentActivity = [
  { action: '新增招聘信息', time: '10分钟前' },
  { action: '更新了营业时间', time: '2小时前' },
  { action: '收到新咨询', time: '昨天 18:30' },
  { action: '修改了联系方式', time: '昨天 14:00' },
  { action: '新增房屋租售信息', time: '3天前' },
]

export default function MerchantDashboard() {
  const merchant = merchants[0]
  const [isOpen, setIsOpen] = useState(true)
  const [categories, setCategories] = useState<string[]>([...merchant.category])
  const [showAddInput, setShowAddInput] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  const addCategory = () => {
    const trimmed = newCategory.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed])
    }
    setNewCategory('')
    setShowAddInput(false)
  }

  const removeCategory = (c: string) => setCategories(categories.filter(x => x !== c))

  return (
    <div className="min-h-screen bg-rock-50 pb-8">
      <div className="px-4 pt-6">
        <h1 className="text-xl font-serif font-semibold text-rock-900">商户管理后台</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mt-4 grid grid-cols-3 gap-3"
      >
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs text-rock-500 mb-1">{s.label}</p>
            <div className="flex items-end gap-1">
              <span className="font-number text-xl font-semibold text-rock-900">{s.value}</span>
              {s.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-jade-500 mb-0.5" />
              ) : (
                <TrendingDown className="w-4 h-4 text-ember-400 mb-0.5" />
              )}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mt-4"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-serif font-semibold text-rock-900 mb-3">认证状态</h2>
          <div className="flex items-center justify-between mb-4">
            {verificationSteps.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-jade-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-rock-600 mt-1 text-center">{step}</p>
                </div>
                {i < verificationSteps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-jade-500 mx-1 mt-[-12px]" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-jade-50">
            <CheckCircle2 className="w-5 h-5 text-jade-500" />
            <span className="text-sm text-jade-700 font-medium">已通过</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mt-4"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-serif font-semibold text-rock-900 mb-3">营业状态</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-jade-500' : 'bg-rock-400'}`} />
              <span className="text-sm font-medium text-rock-900">
                {isOpen ? '营业中' : '休息中'}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isOpen ? 'bg-jade-500' : 'bg-rock-300'}`}
            >
              <motion.div
                animate={{ x: isOpen ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 mt-4"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-semibold text-rock-900">经营类目</h2>
            {!showAddInput && (
              <button
                onClick={() => setShowAddInput(true)}
                className="flex items-center gap-1 text-sm text-jade-500 hover:text-jade-600"
              >
                <Plus className="w-4 h-4" /> 添加类目
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-jade-50 text-jade-700 text-sm border border-jade-200"
              >
                {c}
                <button onClick={() => removeCategory(c)}>
                  <X className="w-3.5 h-3.5 text-jade-500" />
                </button>
              </span>
            ))}
          </div>
          {showAddInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 mt-3"
            >
              <input
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory() }}
                placeholder="输入新类目"
                className="flex-1 px-3 py-1.5 rounded-lg border border-rock-200 text-sm outline-none focus:border-jade-500 transition-colors"
                autoFocus
              />
              <button onClick={addCategory} className="px-3 py-1.5 rounded-lg bg-jade-500 text-white text-sm">
                添加
              </button>
              <button onClick={() => { setShowAddInput(false); setNewCategory('') }} className="px-3 py-1.5 rounded-lg border border-rock-200 text-sm text-rock-500">
                取消
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-4"
      >
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-serif font-semibold text-rock-900 mb-3">最近动态</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-rock-100 last:border-0">
                <p className="text-sm text-rock-700">{a.action}</p>
                <span className="flex items-center gap-1 text-xs text-rock-400">
                  <Clock className="w-3 h-3" /> {a.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
