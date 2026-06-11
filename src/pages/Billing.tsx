import { useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Clock, Save } from 'lucide-react'
import { useStore } from '@/store'

echarts.use([LineChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

const periodColor: Record<string, string> = {
  '峰时': '#FF4757',
  '平时': '#4A90D9',
  '谷时': '#00E5A0',
}

export default function Billing() {
  const { pricingRules, updatePricingRules } = useStore()
  const [editing, setEditing] = useState(pricingRules.map(r => ({ ...r })))

  const hours = Array.from({ length: 24 }, (_, h) => {
    const rule = pricingRules.find(r => {
      if (r.start_hour < r.end_hour) return h >= r.start_hour && h < r.end_hour
      return h >= r.start_hour || h < r.end_hour
    })
    return { hour: h, price: rule?.price ?? 0, period: rule?.period ?? '平时', service: rule?.service_fee ?? 0 }
  })

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0F1F3A',
      borderColor: '#243D63',
      textStyle: { color: '#E2E8F0', fontSize: 12 },
      formatter: (params: any) => {
        const d = params[0]
        const h = hours[d.dataIndex]
        return `${h.hour}:00<br/>时段: ${h.period}<br/>电价: ¥${h.price}/kWh<br/>服务费: ¥${h.service}/kWh`
      },
    },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: hours.map(h => `${h.hour}`),
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1C3254' } },
    },
    yAxis: {
      type: 'value',
      name: '元/kWh',
      nameTextStyle: { color: '#94A3B8', fontSize: 11 },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#1C3254' } },
      min: 0,
      max: 1.6,
    },
    series: [
      {
        type: 'line',
        data: hours.map(h => h.price),
        step: 'middle',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: '#00E5A0' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,229,160,0.25)' }, { offset: 1, color: 'rgba(0,229,160,0.02)' }] },
        },
        markArea: {
          silent: true,
          data: [
            [{ xAxis: '8', itemStyle: { color: 'rgba(255,71,87,0.08)' } }, { xAxis: '10' }],
            [{ xAxis: '18', itemStyle: { color: 'rgba(255,71,87,0.08)' } }, { xAxis: '20' }],
            [{ xAxis: '23', itemStyle: { color: 'rgba(0,229,160,0.06)' } }, { xAxis: '6' }],
          ],
        },
      },
    ],
  }

  const handleSave = () => {
    updatePricingRules(editing)
  }

  const updateField = (idx: number, field: 'price' | 'service_fee', value: string) => {
    const next = [...editing]
    next[idx] = { ...next[idx], [field]: parseFloat(value) || 0 }
    setEditing(next)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white flex items-center gap-2">
        <Clock className="w-5 h-5 text-electric" />
        分时电价配置
      </h1>

      <div className="card">
        <div className="flex items-center gap-4 mb-3">
          {Object.entries(periodColor).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5 text-sm text-slate-300">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <ReactEChartsCore echarts={echarts} option={chartOption} style={{ height: 280 }} />
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-700">
              {['时段', '时间范围', '电价(元/kWh)', '服务费(元/kWh)', '操作'].map(h => (
                <th key={h} className="text-xs text-slate-400 uppercase tracking-wider py-3 px-4 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editing.map((r, i) => (
              <tr key={i} className="table-row">
                <td className="text-sm py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: periodColor[r.period] }} />
                    <span className="text-slate-200">{r.period}</span>
                  </span>
                </td>
                <td className="text-sm py-3 px-4 text-slate-300">
                  {r.start_hour}:00 — {r.end_hour}:00
                </td>
                <td className="text-sm py-3 px-4">
                  <input
                    type="number"
                    step="0.01"
                    value={r.price}
                    onChange={e => updateField(i, 'price', e.target.value)}
                    className="input-field w-24 text-center font-mono"
                  />
                </td>
                <td className="text-sm py-3 px-4">
                  <input
                    type="number"
                    step="0.01"
                    value={r.service_fee}
                    onChange={e => updateField(i, 'service_fee', e.target.value)}
                    className="input-field w-24 text-center font-mono"
                  />
                </td>
                <td className="text-sm py-3 px-4">
                  {i === editing.length - 1 && (
                    <button onClick={handleSave} className="btn-primary flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      保存
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
