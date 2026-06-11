import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import type { Supplier } from '@/store'

interface CreditScoreProps {
  supplier: Supplier
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'AAA', color: 'bg-amber-400 text-white' }
  if (score >= 80) return { grade: 'AA', color: 'bg-teal-500 text-white' }
  if (score >= 70) return { grade: 'A', color: 'bg-navy-500 text-white' }
  return { grade: 'B', color: 'bg-navy-300 text-white' }
}

export default function CreditScore({ supplier }: CreditScoreProps) {
  const radarData = [
    { dimension: '履约率', value: supplier.fulfillmentRate },
    { dimension: '质检合格率', value: supplier.qcPassRate },
    { dimension: '低客诉率', value: 100 - supplier.complaintRate * 10 },
  ]

  const barData = [
    { name: '履约率', value: supplier.fulfillmentRate, fill: '#2E8B8B' },
    { name: '质检合格率', value: supplier.qcPassRate, fill: '#D4A853' },
    { name: '低客诉率', value: Math.min(100, 100 - supplier.complaintRate * 10), fill: '#59708F' },
  ]

  const { grade, color } = getGrade(supplier.creditScore)

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="font-serif text-base font-semibold text-navy-700 mb-4">信用评分</h3>
      <div className="flex gap-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E8EBF0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#59708F' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="#D4A853" fill="#D4A853" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-40 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-navy-700 font-serif">{supplier.creditScore}</p>
          <span className={`mt-2 px-4 py-1 rounded-full text-sm font-bold ${color}`}>{grade}</span>
          <p className="text-xs text-navy-400 mt-2">综合信用等级</p>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#59708F' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#3B5779' }} width={70} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
