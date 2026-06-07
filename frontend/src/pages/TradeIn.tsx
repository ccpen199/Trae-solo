import React, { useEffect, useState } from 'react'
import { Repeat, Calculator, History } from 'lucide-react'
import { tradeinAPI, productAPI } from '../api'

const conditions = [
  { value: 'excellent', label: '极佳', desc: '外观完好，功能正常' },
  { value: 'good', label: '良好', desc: '轻微划痕，功能正常' },
  { value: 'fair', label: '一般', desc: '明显磨损，功能基本正常' },
  { value: 'poor', label: '较差', desc: '严重损坏，部分功能异常' },
]

const styles: Record<string, React.CSSProperties> = {
  container: {},
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  panel: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  conditionGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  conditionBtn: { padding: '10px 4px', border: '1px solid #d9d9d9', borderRadius: 8, textAlign: 'center' as const, cursor: 'pointer', background: '#fff', transition: 'all 0.2s' },
  conditionBtnActive: { padding: '10px 4px', border: '2px solid #1890ff', borderRadius: 8, textAlign: 'center' as const, cursor: 'pointer', background: '#e6f7ff' },
  conditionLabel: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  conditionDesc: { fontSize: 11, color: '#8c8c8c', marginTop: 2 },
  calcBtn: { width: '100%', padding: '12px 0', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  result: { marginTop: 24, padding: 20, background: '#fff7e6', borderRadius: 8, textAlign: 'center' as const },
  resultValue: { fontSize: 36, fontWeight: 700, color: '#ff4d4f' },
  resultLabel: { fontSize: 14, color: '#8c8c8c', marginTop: 4 },
  savings: { fontSize: 14, color: '#52c41a', marginTop: 8 },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
}

export default function TradeIn() {
  const [form, setForm] = useState({ old_model: '', age_years: 1, condition: 'good', new_product_id: '' })
  const [products, setProducts] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productAPI.list().then(res => {
      setProducts(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
    tradeinAPI.listEstimations().then(res => {
      setHistory(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
  }, [])

  const handleEstimate = async () => {
    setLoading(true)
    try {
      const res = await tradeinAPI.estimate(form)
      setResult(res.data?.data || res.data)
    } catch {} finally { setLoading(false) }
  }

  const newPrice = products.find(p => p.id === form.new_product_id)?.price || 0

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}><Repeat size={18} color="#ff4d4f" /> 以旧换新估价</div>
          <div style={styles.formGroup}>
            <label style={styles.label}>旧设备型号</label>
            <input style={styles.input} value={form.old_model} onChange={e => setForm({ ...form, old_model: e.target.value })} placeholder="如: KFR-35GW/01" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>使用年限: {form.age_years} 年</label>
            <input style={styles.input} type="range" min={0} max={15} value={form.age_years} onChange={e => setForm({ ...form, age_years: Number(e.target.value) })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>设备成色</label>
            <div style={styles.conditionGrid}>
              {conditions.map(c => (
                <div key={c.value} style={form.condition === c.value ? styles.conditionBtnActive : styles.conditionBtn} onClick={() => setForm({ ...form, condition: c.value })}>
                  <div style={styles.conditionLabel}>{c.label}</div>
                  <div style={styles.conditionDesc}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>换新目标</label>
            <select style={styles.input} value={form.new_product_id} onChange={e => setForm({ ...form, new_product_id: e.target.value })}>
              <option value="">选择新产品</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name || p.product_name} - ¥{p.price}</option>)}
            </select>
          </div>
          <button style={{ ...styles.calcBtn, opacity: loading ? 0.7 : 1 }} onClick={handleEstimate} disabled={loading}>
            <Calculator size={18} /> {loading ? '估价中...' : '立即估价'}
          </button>

          {result && (
            <div style={styles.result}>
              <div style={styles.resultLabel}>旧机估价</div>
              <div style={styles.resultValue}>¥{result.estimated_value || result.value || 0}</div>
              {newPrice > 0 && (
                <div style={styles.savings}>
                  换新优惠后仅需 ¥{Math.max(0, newPrice - (result.estimated_value || result.value || 0))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}><History size={18} color="#1890ff" /> 估价记录</div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无估价记录</div>
          ) : history.map((h, i) => (
            <div key={i} style={styles.historyItem}>
              <div>
                <div style={{ fontWeight: 500 }}>{h.old_model || h.model}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>{h.created_at || ''}</div>
              </div>
              <div style={{ fontWeight: 600, color: '#ff4d4f' }}>¥{h.estimated_value || h.value || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
