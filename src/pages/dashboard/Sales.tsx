import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import PageHeader from '@/components/PageHeader'
import { salesAnalysisData } from '@/data/mockData'

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']

export default function Sales() {
  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="销售分析" subtitle="销售趋势、品类分布与区域对比" />

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-emerald-600" />
          <h3 className="text-base font-semibold text-gray-800">销售趋势</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={salesAnalysisData.trend}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === '销售额' || name === '目标') return [`${(value / 10000).toFixed(1)}万元`, name]
                return [`${value}%`, name]
              }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
            />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="sales" name="销售额" stroke="#059669" fill="url(#actualGrad)" strokeWidth={2} />
            <Area yAxisId="left" type="monotone" dataKey="target" name="目标" stroke="#9CA3AF" fill="url(#targetGrad)" strokeWidth={1.5} strokeDasharray="5 5" />
            <Area yAxisId="right" type="monotone" dataKey="rate" name="达成率" stroke="#F59E0B" fill="none" strokeWidth={1.5} strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={18} className="text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-800">品类分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={salesAnalysisData.byCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name?: string; percent?: number }) => name && percent ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              >
                {salesAnalysisData.byCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}%`, name]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-800">区域对比</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesAnalysisData.byRegion}>
              <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === '销售额') return [`${(value / 10000).toFixed(1)}万元`, name]
                  return [`${value}%`, name]
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
              />
              <Bar dataKey="sales" name="销售额" fill="#059669" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="growth" name="增长率" fill="#FCD34D" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
