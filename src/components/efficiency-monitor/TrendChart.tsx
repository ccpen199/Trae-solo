import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: '1月', 线上网站: 3200, 移动端: 2800, 窗口: 1500 },
  { month: '2月', 线上网站: 3500, 移动端: 3100, 窗口: 1400 },
  { month: '3月', 线上网站: 3800, 移动端: 3400, 窗口: 1300 },
  { month: '4月', 线上网站: 4100, 移动端: 3800, 窗口: 1200 },
  { month: '5月', 线上网站: 4500, 移动端: 4200, 窗口: 1100 },
  { month: '6月', 线上网站: 4800, 移动端: 4600, 窗口: 1000 },
]

const lines = [
  { key: '线上网站', color: '#165DFF' },
  { key: '移动端', color: '#00B42A' },
  { key: '窗口', color: '#FF7D00' },
] as const

export default function TrendChart() {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">各渠道申办量趋势</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
          <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
