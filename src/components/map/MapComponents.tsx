import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { RegionData } from '@/store'

const regionCoords: Record<string, { x: number; y: number }> = {
  '濮院': { x: 580, y: 310 },
  '大朗': { x: 490, y: 470 },
  '汕头': { x: 520, y: 490 },
  '苏州': { x: 600, y: 290 },
  '杭州': { x: 575, y: 330 },
  '宁波': { x: 600, y: 345 },
  '绍兴': { x: 570, y: 340 },
  '桐乡': { x: 575, y: 315 },
}

function getHeatColor(utilization: number): string {
  if (utilization >= 85) return '#D4A853'
  if (utilization >= 80) return '#2E8B8B'
  if (utilization >= 75) return '#59708F'
  return '#9EABBF'
}

function getRadius(factoryCount: number): number {
  return Math.max(12, Math.min(28, factoryCount / 100))
}

const trendData = [
  { month: '1月', 产能: 72, 订单: 65 },
  { month: '2月', 产能: 65, 订单: 58 },
  { month: '3月', 产能: 78, 订单: 75 },
  { month: '4月', 产能: 82, 订单: 80 },
  { month: '5月', 产能: 85, 订单: 83 },
  { month: '6月', 产能: 87, 订单: 86 },
]

interface ChinaMapProps {
  regions: RegionData[]
  selected: string | null
  onSelect: (region: string) => void
}

export default function ChinaMap({ regions, selected, onSelect }: ChinaMapProps) {
  return (
    <svg viewBox="0 0 720 560" className="w-full">
      <path
        d="M80,80 L200,40 L350,30 L500,45 L620,70 L680,150 L670,250 L650,350 L600,420 L520,480 L430,510 L350,500 L270,470 L200,420 L150,350 L100,270 L70,180 Z"
        fill="#E8EBF0"
        stroke="#C5CCD9"
        strokeWidth={1.5}
        opacity={0.6}
      />
      {regions.map((r) => {
        const coord = regionCoords[r.region]
        if (!coord) return null
        const isSelected = selected === r.region
        const radius = getRadius(r.factoryCount)
        return (
          <g key={r.region} onClick={() => onSelect(r.region)} className="cursor-pointer">
            <circle cx={coord.x} cy={coord.y} r={radius + 8} fill={getHeatColor(r.capacityUtilization)} opacity={0.15} />
            <circle cx={coord.x} cy={coord.y} r={radius} fill={getHeatColor(r.capacityUtilization)} opacity={0.5}
              className="transition-all duration-300" />
            <circle cx={coord.x} cy={coord.y} r={radius - 4} fill={getHeatColor(r.capacityUtilization)}
              stroke={isSelected ? '#1B2A4A' : 'white'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              className="transition-all duration-300" />
            <text x={coord.x} y={coord.y + radius + 14} textAnchor="middle" className="text-[10px] fill-navy-700 font-medium">
              {r.region}
            </text>
          </g>
        )
      })}
      <g>
        {regions.map((r) => {
          const coord = regionCoords[r.region]
          if (!coord) return null
          return (
            <text key={`count-${r.region}`} x={coord.x} y={coord.y + 3} textAnchor="middle"
              className="text-[9px] fill-white font-bold pointer-events-none">
              {(r.factoryCount / 1000).toFixed(1)}k
            </text>
          )
        })}
      </g>
    </svg>
  )
}

export function RegionPanel({ region }: { region: RegionData | null }) {
  if (!region) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 flex items-center justify-center h-full">
        <p className="text-sm text-navy-300">点击地图上的区域查看详情</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="font-serif text-lg font-semibold text-navy-700 mb-4">{region.region}</h3>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-navy-400">工厂数量</p>
          <p className="text-xl font-bold text-navy-700">{region.factoryCount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-navy-400 mb-1">产能利用率</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${region.capacityUtilization}%` }} />
            </div>
            <span className="text-sm font-medium text-amber-600">{region.capacityUtilization}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-navy-400">订单量</p>
          <p className="text-xl font-bold text-navy-700">{region.orderVolume.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-navy-400">供需比</p>
          <p className={`text-lg font-bold ${region.supplyDemandRatio >= 1 ? 'text-teal-600' : 'text-amber-600'}`}>
            {region.supplyDemandRatio.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 mb-1">主要工艺</p>
          <div className="flex flex-wrap gap-1">
            {region.mainCrafts.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CapacityTrend() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="font-serif text-base font-semibold text-navy-700 mb-4">产能趋势</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#59708F' }} />
          <YAxis tick={{ fontSize: 11, fill: '#59708F' }} domain={[50, 100]} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="产能" stroke="#2E8B8B" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="订单" stroke="#D4A853" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
