import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { AlertCircle, Clock } from 'lucide-react'

const durationRanges = ['<1min', '1-3min', '3-5min', '5-10min', '10-30min', '>30min']

const durationData = durationRanges.map((range) => {
  let base1 = 0, base2 = 0, base3 = 0, base4 = 0
  if (range === '<1min') { base1 = 180; base2 = 50; base3 = 30; base4 = 420 }
  else if (range === '1-3min') { base1 = 520; base2 = 280; base3 = 180; base4 = 680 }
  else if (range === '3-5min') { base1 = 890; base2 = 620; base3 = 420; base4 = 380 }
  else if (range === '5-10min') { base1 = 450; base2 = 580; base3 = 350; base4 = 180 }
  else if (range === '10-30min') { base1 = 120; base2 = 240; base3 = 280; base4 = 50 }
  else { base1 = 28; base2 = 45; base3 = 62; base4 = 12 }
  return {
    range,
    参保核验: base1,
    养老金测算: base2,
    失业补贴: base3,
    医保查询: base4,
  }
})

const durationBars = [
  { key: '参保核验', color: '#165DFF' },
  { key: '养老金测算', color: '#00B42A' },
  { key: '失业补贴', color: '#FF7D00' },
  { key: '医保查询', color: '#722ED1' },
] as const

const timeoutCases = [
  { id: 'SB20260618001', type: '失业补贴申领', duration: '45分钟', reason: '材料多次补充', region: 'A区窗口' },
  { id: 'SB20260618002', type: '养老金资格认证', duration: '38分钟', reason: '系统接口超时', region: 'B区窗口' },
  { id: 'SB20260617089', type: '工伤待遇核算', duration: '52分钟', reason: '异地数据核验', region: 'D区窗口' },
  { id: 'SB20260617067', type: '社保转移接续', duration: '41分钟', reason: '多地账户合并', region: 'C区窗口' },
  { id: 'SB20260617045', type: '灵活就业参保', duration: '33分钟', reason: '历史欠费补缴', region: 'E区窗口' },
]

const metrics = [
  { label: '平均时长', value: '8.5', unit: '分钟', color: 'text-primary' },
  { label: '中位数', value: '6.2', unit: '分钟', color: 'text-green-600' },
  { label: 'P95时长', value: '22.8', unit: '分钟', color: 'text-amber-600' },
]

export default function DurationDistribution() {
  return (
    <div className="border border-gray-100 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">办理时长分布（按业务类型）</h3>
        <div className="flex items-center gap-4 text-xs">
          {metrics.map((m) => (
            <div key={m.label} className="text-right">
              <div className="text-gray-400">{m.label}</div>
              <div className={`text-sm font-bold ${m.color}`}>
                {m.value}<span className="text-[10px] font-normal ml-0.5">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={durationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
          <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
          <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E6EB', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {durationBars.map((b) => (
            <Bar key={b.key} dataKey={b.key} stackId="a" fill={b.color} radius={[0, 0, 0, 0]}>
              {durationData.map((_, i) => (
                <Cell key={i} fill={b.color} fillOpacity={i === 5 ? 1 : 1} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle size={14} className="text-red-500" />
          <h4 className="text-xs font-semibold text-gray-700">超时预警案例（&gt;30分钟）</h4>
        </div>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
          {timeoutCases.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={12} className="text-red-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 font-mono flex-shrink-0">{c.id.slice(-8)}</span>
                <span className="text-xs text-gray-700 truncate">{c.type}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-gray-400">{c.region}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-500 text-white font-medium">{c.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
