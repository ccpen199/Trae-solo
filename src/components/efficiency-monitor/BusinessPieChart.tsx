import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const data = [
  { name: '参保核验', value: 35, color: '#165DFF' },
  { name: '养老金测算', value: 25, color: '#00B42A' },
  { name: '失业补贴申领', value: 20, color: '#FF7D00' },
  { name: '医保查询', value: 15, color: '#722ED1' },
  { name: '其他', value: 5, color: '#86909C' },
]

export default function BusinessPieChart() {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">业务类型分布</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name} ${value}%`}
            labelLine={{ stroke: '#C9CDD4' }}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, '占比']}
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
