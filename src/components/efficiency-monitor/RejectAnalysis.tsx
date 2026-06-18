import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

const rejectReasons = [
  { reason: '材料不齐全', count: 156, rate: '32%' },
  { reason: '身份信息不一致', count: 98, rate: '20%' },
  { reason: '不符合申领条件', count: 76, rate: '16%' },
  { reason: '银行账户信息错误', count: 54, rate: '11%' },
  { reason: '申请表填写错误', count: 43, rate: '9%' },
]

const businessRejects = [
  { type: '失业补贴申领', total: 2450, rejected: 186, rate: '7.6%', trend: 'up' as const },
  { type: '参保核验', total: 4403, rejected: 220, rate: '5.0%', trend: 'down' as const },
  { type: '养老金测算', total: 3145, rejected: 157, rate: '5.0%', trend: 'flat' as const },
  { type: '医保查询', total: 1887, rejected: 75, rate: '4.0%', trend: 'down' as const },
]

const trendIcon = {
  up: <ArrowUp size={14} className="text-red-500" />,
  down: <ArrowDown size={14} className="text-green-500" />,
  flat: <Minus size={14} className="text-gray-400" />,
}

export default function RejectAnalysis() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-6">
        <div className="border border-gray-100 rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">退件原因TOP5</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rejectReasons} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
              <YAxis
                type="category"
                dataKey="reason"
                tick={{ fontSize: 12, fill: '#4E5969' }}
                axisLine={{ stroke: '#E5E6EB' }}
                width={120}
              />
              <Tooltip
                formatter={(value: number) => [`${value}件`, '退件数']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#165DFF" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-6">
        <div className="border border-gray-100 rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">各业务退件率</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 text-gray-500 font-medium">业务类型</th>
                <th className="text-right py-2.5 text-gray-500 font-medium">申办量</th>
                <th className="text-right py-2.5 text-gray-500 font-medium">退件量</th>
                <th className="text-right py-2.5 text-gray-500 font-medium">退件率</th>
                <th className="text-right py-2.5 text-gray-500 font-medium">趋势</th>
              </tr>
            </thead>
            <tbody>
              {businessRejects.map((item) => (
                <tr key={item.type} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 text-gray-900">{item.type}</td>
                  <td className="py-2.5 text-right text-gray-700">{item.total.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-gray-700">{item.rejected}</td>
                  <td className="py-2.5 text-right font-medium text-gray-900">{item.rate}</td>
                  <td className="py-2.5 text-right">{trendIcon[item.trend]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
