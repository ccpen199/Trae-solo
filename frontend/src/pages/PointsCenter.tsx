import React, { useEffect, useState } from 'react'
import { Star, TrendingUp, TrendingDown, Gift } from 'lucide-react'
import { pointsAPI } from '../api'

const styles: Record<string, React.CSSProperties> = {
  container: {},
  topRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  balanceCard: { background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', borderRadius: 10, padding: 32, color: '#fff', textAlign: 'center' as const },
  balanceValue: { fontSize: 48, fontWeight: 700, margin: '12px 0' },
  balanceLabel: { fontSize: 14, opacity: 0.9 },
  actionsCard: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 },
  actionBtn: { padding: '14px 18px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', transition: 'all 0.2s' },
  panel: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '10px 12px', textAlign: 'left' as const, fontSize: 13, fontWeight: 600, color: '#8c8c8c', borderBottom: '2px solid #f0f0f0' },
  td: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f0f0f0' },
  earn: { color: '#52c41a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 },
  spend: { color: '#ff4d4f', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 400 },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { width: '100%', padding: '10px 0', background: '#fff', color: '#595959', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, cursor: 'pointer', marginTop: 8 },
}

export default function PointsCenter() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSpend, setShowSpend] = useState(false)
  const [spendForm, setSpendForm] = useState({ points: 0, reason: '' })

  const fetchData = async () => {
    try {
      const [balRes, txRes] = await Promise.allSettled([pointsAPI.balance(), pointsAPI.transactions()])
      if (balRes.status === 'fulfilled') {
        const b = balRes.value.data?.data || balRes.value.data
        setBalance(b?.balance ?? b ?? 0)
      }
      if (txRes.status === 'fulfilled') {
        setTransactions(Array.isArray(txRes.value.data?.data) ? txRes.value.data.data : Array.isArray(txRes.value.data) ? txRes.value.data : [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleEarn = async () => {
    try {
      await pointsAPI.earn({ source: 'energy_saving', points: 10 })
      fetchData()
    } catch {}
  }

  const handleSpend = async () => {
    try {
      await pointsAPI.spend(spendForm)
      setShowSpend(false)
      setSpendForm({ points: 0, reason: '' })
      fetchData()
    } catch {}
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <div style={styles.balanceCard}>
          <Star size={32} />
          <div style={styles.balanceLabel}>当前积分余额</div>
          <div style={styles.balanceValue}>{balance}</div>
          <div style={styles.balanceLabel}>积分</div>
        </div>
        <div style={styles.actionsCard}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>积分操作</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>通过节能行为获取积分，或兑换好礼</div>
          <button style={{ ...styles.actionBtn, background: '#52c41a', color: '#fff' }} onClick={handleEarn}>
            <TrendingUp size={18} /> 领取节能积分
          </button>
          <button style={{ ...styles.actionBtn, background: '#ff4d4f', color: '#fff' }} onClick={() => setShowSpend(true)}>
            <Gift size={18} /> 积分兑换
          </button>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}><Star size={18} color="#faad14" /> 积分明细</div>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无积分记录</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>类型</th>
                <th style={styles.th}>积分</th>
                <th style={styles.th}>原因</th>
                <th style={styles.th}>余额</th>
                <th style={styles.th}>日期</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i}>
                  <td style={styles.td}>{t.type === 'earn' ? '获取' : t.type === 'spend' ? '消耗' : t.type}</td>
                  <td style={styles.td}>
                    <span style={t.type === 'earn' ? styles.earn : styles.spend}>
                      {t.type === 'earn' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {t.type === 'earn' ? '+' : '-'}{t.points}
                    </span>
                  </td>
                  <td style={styles.td}>{t.reason || t.description || '-'}</td>
                  <td style={styles.td}>{t.balance_after ?? t.balance ?? '-'}</td>
                  <td style={styles.td}>{t.created_at || t.date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showSpend && (
        <div style={styles.modal} onClick={() => setShowSpend(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>积分兑换</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>兑换积分数量</label>
              <input style={styles.input} type="number" value={spendForm.points} onChange={e => setSpendForm({ ...spendForm, points: Number(e.target.value) })} min={1} max={balance} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>兑换原因</label>
              <input style={styles.input} value={spendForm.reason} onChange={e => setSpendForm({ ...spendForm, reason: e.target.value })} placeholder="如: 兑换优惠券" />
            </div>
            <button style={styles.submitBtn} onClick={handleSpend}>确认兑换</button>
            <button style={styles.cancelBtn} onClick={() => setShowSpend(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
