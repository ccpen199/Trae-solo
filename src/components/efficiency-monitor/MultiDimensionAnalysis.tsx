import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { AlertTriangle, Clock } from 'lucide-react'

const tabs = [
  { key: 'channel', label: '渠道分析' },
  { key: 'business', label: '业务分析' },
  { key: 'region', label: '区域分析' },
  { key: 'time', label: '时段分析' },
] as const

type TabKey = typeof tabs[number]['key']

const channelTrendData = [
  { month: '1月', Web网站: 3200, 移动H5: 2100, APP: 1800, 窗口: 1500 },
  { month: '2月', Web网站: 3500, 移动H5: 2400, APP: 2000, 窗口: 1400 },
  { month: '3月', Web网站: 3800, 移动H5: 2700, APP: 2300, 窗口: 1300 },
  { month: '4月', Web网站: 4100, 移动H5: 3100, APP: 2600, 窗口: 1200 },
  { month: '5月', Web网站: 4500, 移动H5: 3500, APP: 2900, 窗口: 1100 },
  { month: '6月', Web网站: 4800, 移动H5: 3900, APP: 3200, 窗口: 1000 },
]

const channelLines = [
  { key: 'Web网站', color: '#165DFF' },
  { key: '移动H5', color: '#00B42A' },
  { key: 'APP', color: '#722ED1' },
  { key: '窗口', color: '#FF7D00' },
] as const

const channelPieData = [
  { name: 'Web网站', value: 38, color: '#165DFF' },
  { name: '移动H5', value: 31, color: '#00B42A' },
  { name: 'APP', value: 25, color: '#722ED1' },
  { name: '窗口', value: 6, color: '#FF7D00' },
]

const channelDetailTable = [
  { name: 'Web网站', count: 4800, avgTime: '7.2min', satisfaction: '98.8%' },
  { name: '移动H5', count: 3900, avgTime: '8.5min', satisfaction: '98.2%' },
  { name: 'APP', count: 3200, avgTime: '6.8min', satisfaction: '99.1%' },
  { name: '窗口', count: 1000, avgTime: '15.3min', satisfaction: '96.5%' },
]

const businessStackData = [
  { month: '1月', 参保核验: 2500, 养老金测算: 1800, 失业补贴: 1200, 医保查询: 900, 其他: 400 },
  { month: '2月', 参保核验: 2700, 养老金测算: 1950, 失业补贴: 1300, 医保查询: 950, 其他: 450 },
  { month: '3月', 参保核验: 3000, 养老金测算: 2100, 失业补贴: 1400, 医保查询: 1050, 其他: 500 },
  { month: '4月', 参保核验: 3200, 养老金测算: 2250, 失业补贴: 1500, 医保查询: 1150, 其他: 550 },
  { month: '5月', 参保核验: 3450, 养老金测算: 2400, 失业补贴: 1600, 医保查询: 1200, 其他: 600 },
  { month: '6月', 参保核验: 3700, 养老金测算: 2580, 失业补贴: 1750, 医保查询: 1300, 其他: 650 },
]

const businessBars = [
  { key: '参保核验', color: '#165DFF' },
  { key: '养老金测算', color: '#00B42A' },
  { key: '失业补贴', color: '#FF7D00' },
  { key: '医保查询', color: '#722ED1' },
  { key: '其他', color: '#86909C' },
] as const

const businessRankData = [
  { name: '参保核验', count: 18550, rate: '30.6%', avg: '6.5min' },
  { name: '养老金测算', count: 13080, rate: '21.6%', avg: '9.2min' },
  { name: '失业补贴', count: 8750, rate: '14.4%', avg: '11.3min' },
  { name: '医保查询', count: 6550, rate: '10.8%', avg: '5.1min' },
  { name: '灵活就业参保', count: 4230, rate: '7.0%', avg: '8.7min' },
]

const regionData = [
  { name: 'A区', value: 2850, intensity: 100, change: '+15.2%' },
  { name: 'B区', value: 2340, intensity: 85, change: '+8.6%' },
  { name: 'C区', value: 1980, intensity: 72, change: '+12.1%' },
  { name: 'D区', value: 1560, intensity: 58, change: '-2.3%' },
  { name: 'E区', value: 1320, intensity: 48, change: '+6.8%' },
  { name: 'F区', value: 1050, intensity: 38, change: '+3.2%' },
  { name: 'G区', value: 890, intensity: 32, change: '+9.5%' },
  { name: 'H区', value: 650, intensity: 24, change: '-1.8%' },
  { name: 'I区', value: 520, intensity: 18, change: '+4.1%' },
  { name: 'J区', value: 420, intensity: 14, change: '+2.6%' },
]

const regionGridLayout = [
  ['A区', 'B区', 'C区'],
  ['D区', 'E区', 'F区', 'G区'],
  ['H区', 'I区', 'J区'],
]

const timeData = Array.from({ length: 24 }, (_, h) => {
  let count = 0
  if (h >= 9 && h <= 11) count = 1200 - Math.abs(h - 10) * 100 + Math.floor(Math.random() * 80)
  else if (h >= 14 && h <= 17) count = 1100 - Math.abs(h - 15) * 80 + Math.floor(Math.random() * 60)
  else if (h >= 8 && h <= 18) count = 300 + Math.floor(Math.random() * 200)
  else count = Math.floor(Math.random() * 80)
  return { hour: `${h.toString().padStart(2, '0')}:00`, count }
})

const peakHours = [
  { hour: '09:00-11:00', count: 3350, suggest: '建议提前20分钟取号' },
  { hour: '14:30-16:30', count: 2890, suggest: '可预约15:00后错峰办理' },
  { hour: '11:00-12:00', count: 1870, suggest: '临近午休，建议下午再来' },
]

export default function MultiDimensionAnalysis() {
  const [activeTab, setActiveTab] = useState<TabKey>('channel')

  return (
    <div className="border border-gray-100 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">多维度深度分析</h3>
      </div>

      <div className="flex border-b border-gray-100 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm transition-colors relative ${
              activeTab === tab.key ? 'text-primary font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {activeTab === 'channel' && (
          <>
            <div className="col-span-7">
              <h4 className="text-sm font-medium text-gray-700 mb-3">各渠道申办量趋势（近6个月）</h4>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={channelTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {channelLines.map((l) => (
                    <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">渠道占比与明细</h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={channelPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" label={({ value }) => `${value}%`} labelLine={{ stroke: '#C9CDD4', strokeWidth: 0.8 }}>
                    {channelPieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, '占比']} contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="text-left py-1.5 font-medium">渠道</th>
                    <th className="text-right py-1.5 font-medium">申办量</th>
                    <th className="text-right py-1.5 font-medium">平均时长</th>
                    <th className="text-right py-1.5 font-medium">满意度</th>
                  </tr>
                </thead>
                <tbody>
                  {channelDetailTable.map((r) => (
                    <tr key={r.name} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 text-gray-700">{r.name}</td>
                      <td className="py-1.5 text-right text-gray-600">{r.count.toLocaleString()}</td>
                      <td className="py-1.5 text-right text-gray-600">{r.avgTime}</td>
                      <td className="py-1.5 text-right text-green-600 font-medium">{r.satisfaction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'business' && (
          <>
            <div className="col-span-7">
              <h4 className="text-sm font-medium text-gray-700 mb-3">各业务类型申办量堆叠（近6个月）</h4>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={businessStackData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {businessBars.map((b) => (
                    <Bar key={b.key} dataKey={b.key} stackId="a" fill={b.color} radius={[0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">业务办理排行榜 TOP5</h4>
              <div className="space-y-3 mt-1">
                {businessRankData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? 'bg-amber-50 text-amber-600' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                    }`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 font-medium">{item.name}</div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                        <span>占比 {item.rate}</span>
                        <span>平均 {item.avg}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900">{item.count.toLocaleString()}</div>
                      <div className="h-1 w-16 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(item.count / 18550) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'region' && (
          <>
            <div className="col-span-7">
              <h4 className="text-sm font-medium text-gray-700 mb-3">区域申办热力图</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2 mb-4">
                  {regionGridLayout.map((row, ri) => (
                    <div key={ri} className="flex gap-2 justify-center">
                      {row.map((name) => {
                        const region = regionData.find((r) => r.name === name)!
                        const alpha = 0.1 + (region.intensity / 100) * 0.9
                        return (
                          <div
                            key={name}
                            className="w-24 h-24 rounded-lg flex flex-col items-center justify-center text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
                            style={{ backgroundColor: `rgba(22, 93, 255, ${alpha})` }}
                          >
                            <div className="text-lg font-bold">{name}</div>
                            <div className="text-xs opacity-80 mt-1">{region.value}件</div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span>低</span>
                  <div className="flex">
                    {[0.1, 0.3, 0.5, 0.7, 0.9, 1].map((a, i) => (
                      <div key={i} className="w-6 h-3" style={{ backgroundColor: `rgba(22, 93, 255, ${a})` }} />
                    ))}
                  </div>
                  <span>高</span>
                </div>
              </div>
            </div>
            <div className="col-span-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">区域排名</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="text-left py-1.5 font-medium">排名</th>
                    <th className="text-left py-1.5 font-medium">区域</th>
                    <th className="text-right py-1.5 font-medium">申办量</th>
                    <th className="text-right py-1.5 font-medium">环比</th>
                  </tr>
                </thead>
                <tbody>
                  {regionData.slice(0, 10).map((r, idx) => (
                    <tr key={r.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-2 text-gray-500">{idx + 1}</td>
                      <td className="py-2 text-gray-700 font-medium">{r.name}</td>
                      <td className="py-2 text-right text-gray-600">{r.value.toLocaleString()}</td>
                      <td className={`py-2 text-right font-medium ${r.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{r.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'time' && (
          <>
            <div className="col-span-7">
              <h4 className="text-sm font-medium text-gray-700 mb-3">24小时申办量分布</h4>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={timeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} interval={1} />
                  <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#165DFF" radius={[4, 4, 0, 0]} barSize={16}>
                    {timeData.map((_, i) => {
                      const h = i
                      const isPeak = (h >= 9 && h <= 11) || (h >= 14 && h <= 17)
                      return <Cell key={i} fill={isPeak ? '#FF7D00' : '#165DFF'} fillOpacity={isPeak ? 1 : 0.75} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                <h4 className="text-sm font-medium text-gray-700">高峰时段预警 TOP3</h4>
              </div>
              <div className="space-y-3 mb-4">
                {peakHours.map((p, idx) => (
                  <div key={p.hour} className="p-3 rounded-lg border border-amber-100 bg-amber-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-amber-700 flex items-center gap-1.5">
                        <Clock size={12} />
                        {p.hour}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white">TOP {idx + 1}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      申办量 <span className="font-semibold text-gray-800">{p.count.toLocaleString()}</span> 件
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">💡 {p.suggest}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-xs font-medium text-blue-700 mb-1">智能排队建议</div>
                <ul className="text-[11px] text-blue-600 space-y-0.5">
                  <li>• 推荐办理时段: 13:00-14:00 / 16:30-17:30</li>
                  <li>• 低峰期平均时长: 4.8分钟（节省56%）</li>
                  <li>• 支持提前3天线上预约取号</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
