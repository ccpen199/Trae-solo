import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { medicalRecords, designatedHospitals } from '@/mocks/data'

const ratioDistribution = [
  {
    name: '80%及以上',
    value: medicalRecords.filter((r) => r.reimbursementRatio >= 0.8).length,
    color: '#0D3B66',
  },
  {
    name: '60%-79%',
    value: medicalRecords.filter(
      (r) => r.reimbursementRatio >= 0.6 && r.reimbursementRatio < 0.8
    ).length,
    color: '#2E86AB',
  },
  {
    name: '60%以下',
    value: medicalRecords.filter((r) => r.reimbursementRatio < 0.6).length,
    color: '#D4A843',
  },
]

const hospitalOptions = [...new Set(medicalRecords.map((r) => r.hospitalName))]

export default function MedicalPage() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [hospital, setHospital] = useState('')
  const [department, setDepartment] = useState('')
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  const filteredRecords = medicalRecords.filter((r) => {
    if (dateRange.start && r.visitDate < dateRange.start) return false
    if (dateRange.end && r.visitDate > dateRange.end) return false
    if (hospital && r.hospitalName !== hospital) return false
    if (department && !r.department.includes(department)) return false
    return true
  })

  const resetFilters = () => {
    setDateRange({ start: '', end: '' })
    setHospital('')
    setDepartment('')
  }

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">医保就医记录</h1>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <div className="gov-card p-4 space-y-4 sticky top-4">
            <h3 className="font-semibold text-gov-text">筛选条件</h3>
            <div>
              <label className="text-sm text-gov-text-secondary block mb-1">
                就诊日期起
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full border border-gov-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue"
              />
            </div>
            <div>
              <label className="text-sm text-gov-text-secondary block mb-1">
                就诊日期止
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full border border-gov-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue"
              />
            </div>
            <div>
              <label className="text-sm text-gov-text-secondary block mb-1">
                就诊医院
              </label>
              <select
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full border border-gov-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue"
              >
                <option value="">全部医院</option>
                {hospitalOptions.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gov-text-secondary block mb-1">
                科室
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="输入科室名称"
                className="w-full border border-gov-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue"
              />
            </div>
            <button
              onClick={resetFilters}
              className="gov-btn-secondary w-full text-sm py-2"
            >
              重置筛选
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="gov-card p-8 text-center text-gov-text-secondary">
              无匹配记录
            </div>
          ) : (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.recordId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="gov-card p-5"
              >
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedRecord(
                      expandedRecord === record.recordId
                        ? null
                        : record.recordId
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gov-text">
                          {record.hospitalName}
                        </h3>
                        <span className="gov-badge-blue">
                          {record.department}
                        </span>
                      </div>
                      <p className="text-sm text-gov-text-secondary mt-1">
                        {record.visitDate} · {record.diagnosis}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gov-text-secondary">总费用</p>
                      <p className="font-mono font-semibold text-gov-text">
                        ¥{record.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gov-border/50">
                    <div className="flex gap-6 text-sm">
                      <span className="text-gov-text-secondary">
                        医保报销：
                        <span className="font-mono text-emerald-600">
                          ¥{record.reimbursement.toFixed(2)}
                        </span>
                      </span>
                      <span className="text-gov-text-secondary">
                        报销比例：
                        <span className="font-mono text-gov-blue">
                          {(record.reimbursementRatio * 100).toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    {expandedRecord === record.recordId ? (
                      <ChevronUp className="w-4 h-4 text-gov-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gov-text-muted" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedRecord === record.recordId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-gov-border/50">
                        <h4 className="text-sm font-medium text-gov-text mb-2">
                          药品清单
                        </h4>
                        <table className="gov-table text-xs">
                          <thead>
                            <tr>
                              <th>药品名称</th>
                              <th>类别</th>
                              <th>价格</th>
                              <th>医保覆盖</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.drugs.map((drug) => (
                              <tr key={drug.name}>
                                <td>{drug.name}</td>
                                <td>
                                  <span
                                    className={
                                      drug.category === '甲类'
                                        ? 'gov-badge-green'
                                        : 'gov-badge-gold'
                                    }
                                  >
                                    {drug.category}
                                  </span>
                                </td>
                                <td className="font-mono">
                                  ¥{drug.price.toFixed(2)}
                                </td>
                                <td>
                                  {drug.isCovered ? (
                                    <span className="gov-badge-green">是</span>
                                  ) : (
                                    <span className="gov-badge-red">否</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">报销比例分布</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={ratioDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${value}次`}
            >
              {ratioDistribution.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">定点医院</h2>
        <table className="gov-table">
          <thead>
            <tr>
              <th>医院名称</th>
              <th>等级</th>
              <th>地址</th>
              <th>签约状态</th>
            </tr>
          </thead>
          <tbody>
            {designatedHospitals.map((h) => (
              <tr key={h.id}>
                <td className="font-medium">{h.name}</td>
                <td>
                  <span className="gov-badge-blue">{h.level}</span>
                </td>
                <td className="text-gov-text-secondary">{h.address}</td>
                <td>
                  {h.isContracted ? (
                    <span className="gov-badge-green">已签约</span>
                  ) : (
                    <span className="gov-badge-gray">未签约</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
