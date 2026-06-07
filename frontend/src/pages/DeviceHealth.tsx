import React, { useEffect, useState } from 'react'
import { HeartPulse, Activity, AlertTriangle, Play, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { healthAPI } from '../api'

const riskColors: Record<string, { color: string; bg: string }> = {
  low: { color: '#52c41a', bg: '#f6ffed' },
  medium: { color: '#faad14', bg: '#fff7e6' },
  high: { color: '#ff4d4f', bg: '#fff1f0' },
}

const styles: Record<string, React.CSSProperties> = {
  container: {},
  overviewCards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  overviewCard: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' as const },
  overviewValue: { fontSize: 36, fontWeight: 700 },
  overviewLabel: { fontSize: 14, color: '#8c8c8c', marginTop: 4 },
  panel: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  deviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  deviceCard: { background: '#f6f8fa', borderRadius: 10, padding: 18, border: '1px solid #f0f0f0' },
  deviceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  deviceName: { fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
  scoreCircle: { width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 },
  badge: { padding: '2px 10px', borderRadius: 10, fontSize: 12 },
  detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#595959', padding: '4px 0' },
  predictBtn: { padding: '6px 14px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 },
  runAllBtn: { padding: '8px 16px', background: '#722ed1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#52c41a'
  if (score >= 60) return '#faad14'
  return '#ff4d4f'
}

export default function DeviceHealth() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await healthAPI.listPredictions()
        const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
        setPredictions(list)
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleRunPrediction = async (deviceId: string) => {
    try {
      await healthAPI.runPrediction(deviceId)
      const res = await healthAPI.listPredictions()
      setPredictions(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }

  const handleViewDetail = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    try {
      const res = await healthAPI.getPrediction(deviceId)
      const data = res.data?.data || res.data || {}
      if (data.history || data.trend) {
        setHistory((data.history || data.trend || []).map((h: any) => ({
          date: h.date || h.recorded_at,
          score: h.score || h.health_score,
        })))
      }
    } catch { setHistory([]) }
  }

  const avgScore = predictions.length > 0 ? Math.round(predictions.reduce((sum: number, p: any) => sum + (p.score || p.health_score || 0), 0) / predictions.length) : 0
  const highRiskCount = predictions.filter((p: any) => (p.risk_level || '').toLowerCase() === 'high').length
  const healthyCount = predictions.filter((p: any) => (p.score || p.health_score || 0) >= 80).length

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>设备健康预测</div>
      </div>

      <div style={styles.overviewCards}>
        <div style={styles.overviewCard}>
          <HeartPulse size={28} color={getScoreColor(avgScore)} />
          <div style={{ ...styles.overviewValue, color: getScoreColor(avgScore) }}>{avgScore}</div>
          <div style={styles.overviewLabel}>平均健康分</div>
        </div>
        <div style={styles.overviewCard}>
          <Activity size={28} color="#52c41a" />
          <div style={{ ...styles.overviewValue, color: '#52c41a' }}>{healthyCount}</div>
          <div style={styles.overviewLabel}>健康设备数</div>
        </div>
        <div style={styles.overviewCard}>
          <AlertTriangle size={28} color="#ff4d4f" />
          <div style={{ ...styles.overviewValue, color: '#ff4d4f' }}>{highRiskCount}</div>
          <div style={styles.overviewLabel}>高风险设备数</div>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={styles.panelTitle}><TrendingUp size={18} color="#722ed1" /> 设备健康详情</div>
        </div>
        {predictions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无健康预测数据</div>
        ) : (
          <div style={styles.deviceGrid}>
            {predictions.map((p: any) => {
              const score = p.score || p.health_score || 0
              const risk = (p.risk_level || 'low').toLowerCase()
              const rc = riskColors[risk] || riskColors.low
              return (
                <div key={p.id || p.device_id} style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <div style={styles.deviceName}>
                      <HeartPulse size={16} color={getScoreColor(score)} />
                      {p.device_name || p.device_id}
                    </div>
                    <div style={{ ...styles.scoreCircle, color: getScoreColor(score), background: `${getScoreColor(score)}15` }}>
                      {score}
                    </div>
                  </div>
                  <div style={styles.detailRow}>
                    <span>风险等级</span>
                    <span style={{ ...styles.badge, color: rc.color, background: rc.bg }}>{risk === 'low' ? '低' : risk === 'medium' ? '中' : '高'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span>预测剩余天数</span>
                    <span>{p.days_remaining || p.predicted_days || '-'}</span>
                  </div>
                  {p.analysis && (
                    <div style={styles.detailRow}>
                      <span>分析</span>
                      <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.analysis}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={styles.predictBtn} onClick={() => handleRunPrediction(p.device_id)}>
                      <Play size={12} /> 重新预测
                    </button>
                    <button style={{ ...styles.predictBtn, background: '#722ed1' }} onClick={() => handleViewDetail(p.device_id)}>
                      <TrendingUp size={12} /> 查看趋势
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedDevice && history.length > 0 && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}><TrendingUp size={18} color="#1890ff" /> 健康趋势</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#722ed1" strokeWidth={2} dot={{ fill: '#722ed1', r: 3 }} name="健康分" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
