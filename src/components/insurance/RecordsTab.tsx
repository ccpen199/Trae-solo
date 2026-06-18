import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown } from 'lucide-react'
import { paymentRecordsData, availableYears } from './mockData'

type InsuranceType = 'pension' | 'medical' | 'unemployment'

const tabs = [
  { key: 'pension' as const, label: '养老保险' },
  { key: 'medical' as const, label: '医疗保险' },
  { key: 'unemployment' as const, label: '失业保险' },
]

export default function RecordsTab() {
  const [activeType, setActiveType] = useState<InsuranceType>('pension')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)

  const records = paymentRecordsData[activeType]

  const totalBase = records.reduce((sum, r) => sum + Number(r.base.replace(',', '')), 0)
  const totalPersonal = records.reduce((sum, r) => sum + Number(r.personal.replace(',', '')), 0)
  const totalUnit = records.reduce((sum, r) => sum + Number(r.unit.replace(',', '')), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeType === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              {selectedYear}年
              <ChevronDown size={14} className={`transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {yearDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 min-w-[100px]"
                >
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setYearDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        selectedYear === year ? 'text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      {year}年
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            <Download size={14} />
            导出缴费证明
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left px-5 py-3 font-medium">缴费月份</th>
              <th className="text-left px-5 py-3 font-medium">缴费基数</th>
              <th className="text-left px-5 py-3 font-medium">个人缴纳</th>
              <th className="text-left px-5 py-3 font-medium">单位缴纳</th>
              <th className="text-left px-5 py-3 font-medium">缴费单位</th>
              <th className="text-left px-5 py-3 font-medium">缴费地</th>
              <th className="text-left px-5 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <AnimatePresence>
              {records.map((r, i) => (
                <motion.tr
                  key={r.month}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-5 py-3 text-gray-700">{r.month}</td>
                  <td className="px-5 py-3 text-gray-700">{r.base}元</td>
                  <td className="px-5 py-3 text-gray-700">{r.personal}元</td>
                  <td className="px-5 py-3 text-gray-700">{r.unit}元</td>
                  <td className="px-5 py-3 text-gray-700">{r.company}</td>
                  <td className="px-5 py-3 text-gray-700">{r.location}</td>
                  <td className="px-5 py-3">
                    <span className="text-success text-xs font-medium">{r.status}</span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-5"
      >
        <div className="text-sm font-medium text-gray-900 mb-3">{selectedYear}年度汇总</div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">总缴费基数</div>
            <div className="text-xl font-bold text-gray-900 mt-1">¥{totalBase.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">总个人缴费</div>
            <div className="text-xl font-bold text-primary mt-1">¥{totalPersonal.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">总单位缴费</div>
            <div className="text-xl font-bold text-success mt-1">¥{totalUnit.toLocaleString()}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
