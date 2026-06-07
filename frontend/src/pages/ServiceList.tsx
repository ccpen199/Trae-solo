import React, { useEffect, useState } from 'react'
import { Wrench, Plus, X, Activity, Shield, Clock } from 'lucide-react'
import { serviceAPI, deviceAPI } from '../api'

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: '#faad14', bg: '#fff7e6' },
  diagnosing: { label: '诊断中', color: '#1890ff', bg: '#e6f7ff' },
  repairing: { label: '维修中', color: '#722ed1', bg: '#f9f0ff' },
  completed: { label: '已完成', color: '#52c41a', bg: '#f6ffed' },
}

const styles: Record<string, React.CSSProperties> = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 600 },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  badge: { padding: '2px 10px', borderRadius: 10, fontSize: 12 },
  cardInfo: { fontSize: 13, color: '#8c8c8c', lineHeight: 2 },
  timeline: { marginTop: 16, paddingLeft: 20, borderLeft: '2px solid #f0f0f0' },
  timelineItem: { position: 'relative', paddingBottom: 14, paddingLeft: 16, fontSize: 13 },
  timelineDot: { position: 'absolute', left: -27, top: 4, width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff' },
  cardActions: { display: 'flex', gap: 8, marginTop: 12 },
  actionBtn: { padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 4 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
}

export default function ServiceList() {
  const [orders, setOrders] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ device_id: '', type: 'repair', fault_description: '', appointment_time: '' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [svcRes, devRes] = await Promise.allSettled([serviceAPI.list(), deviceAPI.list()])
        setOrders(svcRes.status === 'fulfilled' ? (Array.isArray(svcRes.value.data?.data) ? svcRes.value.data.data : Array.isArray(svcRes.value.data) ? svcRes.value.data : []) : [])
        setDevices(devRes.status === 'fulfilled' ? (Array.isArray(devRes.value.data?.data) ? devRes.value.data.data : Array.isArray(devRes.value.data) ? devRes.value.data : []) : [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleCreate = async () => {
    try {
      await serviceAPI.create(form)
      setShowModal(false)
      setForm({ device_id: '', type: 'repair', fault_description: '', appointment_time: '' })
      const res = await serviceAPI.list()
      setOrders(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }

  const handleDiagnose = async (id: string) => {
    try { await serviceAPI.diagnose(id) } catch {}
  }

  const handleExtendWarranty = async (id: string) => {
    try { await serviceAPI.extendWarranty(id, { months: 12 }) } catch {}
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>服务工单</div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}><Plus size={16} /> 创建工单</button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无工单数据</div>
      ) : (
        <div style={styles.grid}>
          {orders.map(o => {
            const s = statusMap[o.status] || statusMap.pending
            const timeline = o.timeline || o.history || []
            return (
              <div key={o.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wrench size={16} color="#1890ff" />
                    <span style={styles.cardTitle}>{o.type === 'repair' ? '维修' : o.type === 'install' ? '安装' : o.type === 'maintain' ? '保养' : '其他'}工单</span>
                  </div>
                  <span style={{ ...styles.badge, color: s.color, background: s.bg }}>{s.label}</span>
                </div>
                <div style={styles.cardInfo}>
                  <div>工单号: {o.id}</div>
                  <div>故障描述: {o.fault_description || '-'}</div>
                  <div>预约时间: {o.appointment_time || '-'}</div>
                  {o.diagnosis && <div>诊断结果: {o.diagnosis}</div>}
                </div>
                {timeline.length > 0 && (
                  <div style={styles.timeline}>
                    {timeline.map((t: any, i: number) => (
                      <div key={i} style={styles.timelineItem}>
                        <div style={{ ...styles.timelineDot, background: statusMap[t.status]?.color || '#1890ff' }} />
                        <div style={{ fontWeight: 500 }}>{statusMap[t.status]?.label || t.status}</div>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>{t.time || t.created_at}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={styles.cardActions}>
                  <button style={styles.actionBtn} onClick={() => handleDiagnose(o.id)}>
                    <Activity size={14} /> 自动诊断
                  </button>
                  <button style={styles.actionBtn} onClick={() => handleExtendWarranty(o.id)}>
                    <Shield size={14} /> 延保
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>创建工单 <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>选择设备</label>
              <select style={styles.input} value={form.device_id} onChange={e => setForm({ ...form, device_id: e.target.value })}>
                <option value="">请选择设备</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name || d.device_name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>工单类型</label>
              <select style={styles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="repair">维修</option>
                <option value="install">安装</option>
                <option value="maintain">保养</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>故障描述</label>
              <textarea style={styles.textarea} value={form.fault_description} onChange={e => setForm({ ...form, fault_description: e.target.value })} placeholder="请描述设备故障情况" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>预约时间</label>
              <input style={styles.input} type="datetime-local" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} />
            </div>
            <button style={styles.submitBtn} onClick={handleCreate}>提交工单</button>
          </div>
        </div>
      )}
    </div>
  )
}
