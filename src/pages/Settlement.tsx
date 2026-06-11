import { useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Wallet, TrendingUp, Building2, FileSpreadsheet } from 'lucide-react'
import { useStore } from '@/store'

echarts.use([PieChart, LegendComponent, TooltipComponent, CanvasRenderer])

const COLORS = { grid: '#4DA6FF', property: '#FF8C42', operator: '#00E5A0' }

export default function Settlement() {
  const { settlementDetails, profitRules, updateProfitRules } = useStore()
  const [editing, setEditing] = useState(profitRules.map(r => ({ ...r })))
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

  const totalGrid = editing.reduce((s, r) => s + r.grid_ratio, 0)
  const totalProperty = editing.reduce((s, r) => s + r.property_ratio, 0)
  const totalOperator = editing.reduce((s, r) => s + r.operator_ratio, 0)
  const valid = totalGrid + totalProperty + totalOperator === editing.length * 100

  const pieOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0F1F3A',
      borderColor: '#243D63',
      textStyle: { color: '#E2E8F0', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8', fontSize: 11 },
      itemWidth: 12, itemHeight: 12,
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      label: { show: true, color: '#E2E8F0', formatter: '{b}: {d}%' },
      data: [
        { value: totalGrid, name: '电网公司', itemStyle: { color: COLORS.grid } },
        { value: totalProperty, name: '物业', itemStyle: { color: COLORS.property } },
        { value: totalOperator, name: '运营方', itemStyle: { color: COLORS.operator } },
      ],
    }],
  }

  const updateRatio = (idx: number, field: 'grid_ratio' | 'property_ratio' | 'operator_ratio', val: string) => {
    const next = [...editing]
    next[idx] = { ...next[idx], [field]: parseFloat(val) || 0 }
    setEditing(next)
  }

  const filtered = settlementDetails.filter(s => s.settled_at.startsWith(month))
  const sumTotal = filtered.reduce((s, r) => s + r.total_amount, 0)
  const sumGrid = filtered.reduce((s, r) => s + r.grid_share, 0)
  const sumProperty = filtered.reduce((s, r) => s + r.property_share, 0)
  const sumOperator = filtered.reduce((s, r) => s + r.operator_share, 0)

  const summaryCards = [
    { label: '本月总收入', value: sumTotal, icon: Wallet, color: '#4DA6FF' },
    { label: '电网分成', value: sumGrid, icon: TrendingUp, color: COLORS.grid },
    { label: '物业分成', value: sumProperty, icon: Building2, color: COLORS.property },
    { label: '运营方分成', value: sumOperator, icon: FileSpreadsheet, color: COLORS.operator },
  ]

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-electric" />
          分润规则配置
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 280 }} />
          <div className="space-y-3">
            {editing.map((r, i) => (
              <div key={r.id} className="bg-dark-700 rounded-lg p-3 space-y-2">
                <div className="text-sm text-white font-medium">{r.name}</div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['grid_ratio', '电网', COLORS.grid],
                    ['property_ratio', '物业', COLORS.property],
                    ['operator_ratio', '运营方', COLORS.operator],
                  ] as const).map(([field, label, color]) => (
                    <div key={field} className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400">{label}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0} max={100}
                          value={r[field]}
                          onChange={e => updateRatio(i, field, e.target.value)}
                          className="input-field w-full text-center font-mono text-sm"
                        />
                        <span className="text-xs" style={{ color }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!valid && (
              <p className="text-xs text-alert-red">每条规则比例之和必须等于 100%</p>
            )}
            <button
              onClick={() => { if (valid) updateProfitRules(editing) }}
              className={`btn-primary w-full flex items-center justify-center gap-1.5 ${!valid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Wallet className="w-3.5 h-3.5" />
              保存规则
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">清分流水</h2>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="input-field w-44 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                {['订单号', '总金额', '电网公司', '物业管理', '运营方', '结算时间'].map(h => (
                  <th key={h} className="text-xs text-slate-400 uppercase tracking-wider py-3 px-4 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.settlement_id} className="table-row">
                  <td className="text-sm py-3 px-4 text-slate-300 font-mono">{s.order_id}</td>
                  <td className="text-sm py-3 px-4 font-bold text-white">¥{s.total_amount.toFixed(2)}</td>
                  <td className="text-sm py-3 px-4 font-bold" style={{ color: COLORS.grid }}>¥{s.grid_share.toFixed(2)}</td>
                  <td className="text-sm py-3 px-4 font-bold" style={{ color: COLORS.property }}>¥{s.property_share.toFixed(2)}</td>
                  <td className="text-sm py-3 px-4 font-bold" style={{ color: COLORS.operator }}>¥{s.operator_share.toFixed(2)}</td>
                  <td className="text-sm py-3 px-4 text-slate-400">{s.settled_at}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-dark-700">
                <td className="text-sm py-3 px-4 text-slate-300 font-medium">合计</td>
                <td className="text-sm py-3 px-4 font-bold text-white">¥{sumTotal.toFixed(2)}</td>
                <td className="text-sm py-3 px-4 font-bold" style={{ color: COLORS.grid }}>¥{sumGrid.toFixed(2)}</td>
                <td className="text-sm py-3 px-4 font-bold" style={{ color: COLORS.property }}>¥{sumProperty.toFixed(2)}</td>
                <td className="text-sm py-3 px-4 font-bold" style={{ color: COLORS.operator }}>¥{sumOperator.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">对账报表</h2>
          <button
            onClick={() => alert('报表已生成')}
            className="btn-primary flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            导出报表
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(c => (
            <div key={c.label} className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className="w-4 h-4" style={{ color: c.color }} />
                <span className="text-xs text-slate-400">{c.label}</span>
              </div>
              <p className="text-xl font-bold text-white">¥{c.value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
