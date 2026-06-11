import { useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { RadarChart, BarChart, LineChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Activity, Heart, Wrench, TrendingUp } from 'lucide-react'
import { useStore } from '@/store'

echarts.use([RadarChart, BarChart, LineChart, LegendComponent, TooltipComponent, GridComponent, CanvasRenderer])

const DIMS = ['通信稳定性', '故障频率', '使用年限', '负载率', '维护频率']

const scoreColor = (s: number) => s >= 80 ? '#00E5A0' : s >= 60 ? '#FFB800' : '#FF4757'
const riskBadge = (s: number) => s < 60 ? { text: '高风险', cls: 'bg-red-500/20 text-red-400' } : s < 70 ? { text: '中风险', cls: 'bg-orange-500/20 text-orange-400' } : { text: '低风险', cls: 'bg-blue-500/20 text-blue-400' }
const actionText = (s: number) => s < 60 ? '设备严重老化，建议立即停机检修并更换核心部件' : s < 70 ? '设备存在隐患，建议近期安排全面检查和维护' : '设备轻微异常，建议加强巡检频次并关注趋势'

const radarVals = (score: number) => {
  const base = score / 100
  return DIMS.map(() => Math.round((base * 60 + Math.random() * 40) * 10) / 10)
}

const tooltip = { backgroundColor: '#0F1F3A', borderColor: '#243D63', textStyle: { color: '#E2E8F0' } }

export default function Prediction() {
  const { chargingPiles } = useStore()
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? chargingPiles : chargingPiles.slice(0, 6)

  const needsMaint = chargingPiles
    .filter(p => p.health_score < 80)
    .sort((a, b) => a.health_score - b.health_score)

  const repairTypes = ['通信故障', '充电异常', '硬件损坏', '软件BUG', '其他']
  const repairCounts = repairTypes.map(() => Math.floor(Math.random() * 30) + 5)
  const repairDurations = repairTypes.map(() => +(Math.random() * 48 + 4).toFixed(1))

  const weeks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (4 - i) * 7)
    return `${d.getMonth() + 1}/${d.getDate()}周`
  })
  const repairTrend = weeks.map(() => Math.floor(Math.random() * 20) + 3)

  const estDate = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-electric" />
          故障预测与健康管理
        </h1>
        <p className="text-sm text-slate-400 mt-1">基于设备运行数据的智能故障预测与维护建议</p>
      </div>

      <div>
        <div className="section-title flex items-center gap-2"><Heart className="w-4 h-4 text-electric" />设备健康度总览</div>
        <div className="grid grid-cols-3 gap-4">
          {displayed.map(pile => (
            <div key={pile.pile_id} className="card p-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 w-full">
                <span className="text-white font-medium text-sm">{pile.pile_id}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{pile.pile_type}</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: scoreColor(pile.health_score) }}>{pile.health_score}</span>
              <ReactEChartsCore
                echarts={echarts}
                option={{
                  backgroundColor: 'transparent',
                  radar: {
                    indicator: DIMS.map(d => ({ name: d, max: 100 })),
                    shape: 'circle',
                    splitArea: { areaStyle: { color: ['rgba(0,229,160,0.02)', 'rgba(0,229,160,0.05)'] } },
                    axisLine: { lineStyle: { color: '#1C3254' } },
                    splitLine: { lineStyle: { color: '#1C3254' } },
                    name: { color: '#94A3B8', fontSize: 10 },
                  },
                  series: [{
                    type: 'radar',
                    data: [{ value: radarVals(pile.health_score), areaStyle: { color: 'rgba(0,229,160,0.15)' }, lineStyle: { color: '#00E5A0' }, itemStyle: { color: '#00E5A0' } }],
                  }],
                }}
                style={{ height: 160, width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          ))}
        </div>
        {chargingPiles.length > 6 && (
          <button onClick={() => setShowAll(v => !v)} className="mt-3 text-sm text-electric hover:underline">
            {showAll ? '收起' : '查看更多'}
          </button>
        )}
      </div>

      <div>
        <div className="section-title flex items-center gap-2"><Wrench className="w-4 h-4 text-electric" />预测性维护建议</div>
        <div className="space-y-3">
          {needsMaint.map(pile => {
            const risk = riskBadge(pile.health_score)
            const days = Math.floor(Math.random() * 23) + 7
            return (
              <div key={pile.pile_id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${risk.cls}`}>{risk.text}</span>
                  <div>
                    <div className="text-white text-sm font-medium">{pile.pile_id} <span className="text-slate-400 font-normal">{pile.pile_type}</span></div>
                    <div className="text-slate-400 text-xs mt-0.5">健康度 <span style={{ color: scoreColor(pile.health_score) }}>{pile.health_score}</span> · 预计故障日期 {estDate(days)}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{actionText(pile.health_score)}</div>
                  </div>
                </div>
                <button className="btn-primary text-xs px-3 py-1.5">安排维护</button>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="section-title flex items-center gap-2"><Activity className="w-4 h-4 text-electric" />报修数据看板</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="text-slate-300 text-sm mb-2">报修类型分布</div>
            <ReactEChartsCore echarts={echarts} option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', ...tooltip },
              grid: { left: 70, right: 20, top: 10, bottom: 30 },
              xAxis: { type: 'value', axisLabel: { color: '#94A3B8' }, splitLine: { lineStyle: { color: '#1C3254' } } },
              yAxis: { type: 'category', data: repairTypes, axisLabel: { color: '#94A3B8' } },
              series: [{ type: 'bar', data: repairCounts, barWidth: 14, itemStyle: { color: '#00E5A0', borderRadius: [0, 4, 4, 0] } }],
            }} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
          </div>
          <div className="card p-4">
            <div className="text-slate-300 text-sm mb-2">平均修复时长(h)</div>
            <ReactEChartsCore echarts={echarts} option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', ...tooltip },
              grid: { left: 70, right: 20, top: 10, bottom: 30 },
              xAxis: { type: 'value', axisLabel: { color: '#94A3B8' }, splitLine: { lineStyle: { color: '#1C3254' } } },
              yAxis: { type: 'category', data: repairTypes, axisLabel: { color: '#94A3B8' } },
              series: [{ type: 'bar', data: repairDurations, barWidth: 14, itemStyle: { color: '#4DA6FF', borderRadius: [0, 4, 4, 0] } }],
            }} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
          </div>
          <div className="card p-4">
            <div className="text-slate-300 text-sm mb-2">报修趋势(近5周)</div>
            <ReactEChartsCore echarts={echarts} option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', ...tooltip },
              grid: { left: 40, right: 20, top: 20, bottom: 30 },
              xAxis: { type: 'category', data: weeks, axisLabel: { color: '#94A3B8' } },
              yAxis: { type: 'value', axisLabel: { color: '#94A3B8' }, splitLine: { lineStyle: { color: '#1C3254' } } },
              series: [{ type: 'line', smooth: true, data: repairTrend, lineStyle: { color: '#00E5A0' }, itemStyle: { color: '#00E5A0' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,229,160,0.3)' }, { offset: 1, color: 'rgba(0,229,160,0.02)' }] } } }],
            }} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
