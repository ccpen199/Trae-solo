import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartDatum {
  name: string
  基础养老金: number
  个人账户: number
  总养老金: number
}

interface PensionComparisonChartProps {
  data: ChartDatum[]
}

export default function PensionComparisonChart({ data }: PensionComparisonChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-xl p-4 border border-gray-100"
    >
      <h3 className="font-medium text-gray-900 text-sm mb-3">缴费方案对比分析</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#86909C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#86909C' }} />
            <Tooltip
              formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E6EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
            <Bar dataKey="基础养老金" fill="#165DFF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="个人账户" fill="#36CFC9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="总养老金" fill="#722ED1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-100">
        {data.map((item) => (
          <div key={item.name} className="text-center">
            <div className="text-xs text-gray-500 mb-1">{item.name}</div>
            <div className="text-sm font-semibold" style={{ color: '#165DFF' }}>
              ¥{item.总养老金.toLocaleString()}/月
            </div>
            <div className="text-xs text-gray-400 mt-1">
              基础 ¥{item.基础养老金.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              账户 ¥{item.个人账户.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
