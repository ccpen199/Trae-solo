import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell, Legend,
} from 'recharts'
import { Lightbulb, Sparkles, TrendingDown } from 'lucide-react'

interface BubbleItem {
  name: string
  ratio: number
  cost: number
  amount: number
  severity: number
  color: string
}

const bubbleData: BubbleItem[] = [
  { name: '材料问题', ratio: 32, cost: 3.2, amount: 128, severity: 85, color: '#F53F3F' },
  { name: '身份不符', ratio: 20, cost: 4.8, amount: 96, severity: 72, color: '#FF7D00' },
  { name: '条件不符', ratio: 16, cost: 2.5, amount: 64, severity: 55, color: '#FFC53D' },
  { name: '信息错误', ratio: 14, cost: 1.8, amount: 42, severity: 40, color: '#165DFF' },
  { name: '其他原因', ratio: 18, cost: 1.2, amount: 28, severity: 25, color: '#86909C' },
]

const suggestions = [
  {
    rank: 1,
    title: '材料不齐全',
    ratio: '32%',
    count: 156,
    suggest: '建议增加上传校验+样例图片展示',
    estimate: '预计降低60%',
    high: true,
  },
  {
    rank: 2,
    title: '身份信息不一致',
    ratio: '20%',
    count: 98,
    suggest: '建议增加人脸识别前置校验环节',
    estimate: '预计降低75%',
    high: true,
  },
  {
    rank: 3,
    title: '不符合申领条件',
    ratio: '16%',
    count: 76,
    suggest: '建议增加智能预审条件校验环节',
    estimate: '预计降低45%',
    high: false,
  },
  {
    rank: 4,
    title: '银行账户信息错误',
    ratio: '11%',
    count: 54,
    suggest: '建议接入银联账户名校验接口',
    estimate: '预计降低55%',
    high: false,
  },
]

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BubbleItem }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg px-3 py-2 text-xs">
        <div className="font-semibold text-gray-800 mb-1">{d.name}</div>
        <div className="text-gray-600">退件占比: <span className="font-medium">{d.ratio}%</span></div>
        <div className="text-gray-600">处理成本: <span className="font-medium">{d.cost}分/件</span></div>
        <div className="text-gray-600">涉及金额: <span className="font-medium">¥{d.amount}万</span></div>
        <div className="text-gray-600">严重程度: <span className="font-medium">{d.severity}/100</span></div>
      </div>
    )
  }
  return null
}

export default function RejectClustering() {
  return (
    <div className="border border-gray-100 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">退件原因智能聚类</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium flex items-center gap-0.5">
            <Sparkles size={10} />
            AI分析
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1 px-2">
          <span>气泡大小 → 涉及金额</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />高严重</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />中</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />低</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
          <XAxis
            type="number"
            dataKey="ratio"
            name="退件占比"
            unit="%"
            domain={[0, 40]}
            tick={{ fontSize: 10, fill: '#86909C' }}
            axisLine={{ stroke: '#E5E6EB' }}
            label={{ value: '退件占比 (%)', position: 'bottom', offset: 0, style: { fontSize: 10, fill: '#86909C' } }}
          />
          <YAxis
            type="number"
            dataKey="cost"
            name="处理成本"
            unit="分"
            domain={[0, 6]}
            tick={{ fontSize: 10, fill: '#86909C' }}
            axisLine={{ stroke: '#E5E6EB' }}
            label={{ value: '处理成本 (分/件)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#86909C' } }}
          />
          <ZAxis type="number" dataKey="amount" range={[80, 600]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            payload={bubbleData.map((d) => ({ value: d.name, type: 'circle', color: d.color }))}
          />
          <Scatter data={bubbleData}>
            {bubbleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.65} stroke={entry.color} strokeWidth={1.2} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Lightbulb size={14} className="text-amber-500" />
          <h4 className="text-xs font-semibold text-gray-700">AI优化建议</h4>
        </div>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {suggestions.map((s) => (
            <div key={s.rank} className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100/70 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    s.high ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                  }`}>{s.rank}</span>
                  <span className="text-xs font-medium text-gray-800">{s.title}</span>
                  <span className="text-[10px] text-gray-500">({s.count}件 · {s.ratio})</span>
                </div>
                <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                  <TrendingDown size={10} />
                  {s.estimate}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 pl-7 leading-relaxed">💡 {s.suggest}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
