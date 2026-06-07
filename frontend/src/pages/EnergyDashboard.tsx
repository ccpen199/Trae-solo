import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Zap, TreePine, Leaf } from 'lucide-react'
import { energyAPI } from '../api'

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#ff4d4f', '#13c2c2', '#eb2f96']

const styles: Record<string, React.CSSProperties> = {
  container: {},
  row: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 },
  panel: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  greenCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  greenCard: { background: '#fff', borderRadius: 10, padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  greenValue: { fontSize: 28, fontWeight: 700, color: '#52c41a' },
  greenLabel: { fontSize: 13, color: '#8c8c8c', marginTop: 4 },
  greenIcon: { width: 44, height: 44, borderRadius: '50%', background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' },
  periodTabs: { display: 'flex', gap: 8, marginBottom: 16 },
  periodTab: { padding: '4px 12px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 12, cursor: 'pointer', background: '#fff' },
  periodTabActive: { padding: '4px 12px', border: '1px solid #1890ff', borderRadius: 4, fontSize: 12, cursor: 'pointer', background: '#e6f7ff', color: '#1890ff' },
  pointsBanner: { background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', borderRadius: 10, padding: 20, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
}

export default function EnergyDashboard() {
  const [energyData, setEnergyData] = useState<any[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([])
  const [greenData, setGreenData] = useState<any>({ total_kwh: 0, saved_kwh: 0, carbon_reduction: 0, trees: 0 })
  const [points, setPoints] = useState(0)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [energyRes, greenRes] = await Promise.allSettled([
          energyAPI.list({ period }),
          energyAPI.greenReport(),
        ])
        const energy = energyRes.status === 'fulfilled' ? (energyRes.value.data?.data || energyRes.value.data || {}) : {}
        const energyList = Array.isArray(energy) ? energy : (Array.isArray(energy.list) ? energy.list : [])
        setEnergyData(energyList.map((e: any) => ({ name: e.date || e.label || e.device_name, value: e.kwh || e.consumption || e.value || 0 })))

        const green = greenRes.status === 'fulfilled' ? (greenRes.value.data?.data || greenRes.value.data || {}) : {}
        const reportData = green.report_data || {}
        setGreenData({
          total_kwh: green.total_kwh || 0,
          saved_kwh: green.saved_kwh || 0,
          carbon_reduction: reportData.carbon_reduction || 0,
          trees: reportData.equivalent_trees || 0,
        })

        if (energyList.length > 0) {
          const breakdown: Record<string, number> = {}
          energyList.forEach((e: any) => {
            const name = e.device_name || `设备${e.device_id}` || '其他'
            breakdown[name] = (breakdown[name] || 0) + (e.kwh || e.consumption || e.value || 0)
          })
          setDeviceBreakdown(Object.entries(breakdown).map(([name, value]) => ({ name, value })))
        }

        if (green.points_earned || green.points) {
          setPoints(green.points_earned || green.points || 0)
        }
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [period])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  const greenCards = [
    { label: '总耗电', value: `${greenData.total_kwh || 0}`, unit: 'kWh', icon: Zap, color: '#1890ff', bg: '#e6f7ff' },
    { label: '节约电量', value: `${greenData.saved_kwh || 0}`, unit: 'kWh', icon: Leaf, color: '#52c41a', bg: '#f6ffed' },
    { label: '碳减排', value: `${greenData.carbon_reduction || 0}`, unit: 'kg', icon: TreePine, color: '#13c2c2', bg: '#e6fffb' },
    { label: '等效植树', value: `${greenData.trees || 0}`, unit: '棵', icon: TreePine, color: '#722ed1', bg: '#f9f0ff' },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.greenCards}>
        {greenCards.map((c, i) => (
          <div key={i} style={styles.greenCard}>
            <div style={{ ...styles.greenIcon, background: c.bg }}><c.icon size={22} color={c.color} /></div>
            <div style={{ ...styles.greenValue, color: c.color }}>{c.value}</div>
            <div style={styles.greenLabel}>{c.label} ({c.unit})</div>
          </div>
        ))}
      </div>

      <div style={styles.row}>
        <div style={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={styles.panelTitle}><Zap size={18} color="#1890ff" /> 能耗趋势</div>
            <div style={styles.periodTabs}>
              {(['day', 'week', 'month'] as const).map(p => (
                <div key={p} style={period === p ? styles.periodTabActive : styles.periodTab} onClick={() => setPeriod(p)}>
                  {p === 'day' ? '日' : p === 'week' ? '周' : '月'}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} unit="kWh" />
              <Tooltip />
              <Bar dataKey="value" fill="#1890ff" radius={[4, 4, 0, 0]} name="能耗(kWh)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}><Leaf size={18} color="#52c41a" /> 设备能耗占比</div>
          {deviceBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={deviceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {deviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {points > 0 && (
        <div style={styles.pointsBanner}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>节能积分奖励</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>通过节能环保行为获得的积分</div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>+{points}</div>
        </div>
      )}
    </div>
  )
}
