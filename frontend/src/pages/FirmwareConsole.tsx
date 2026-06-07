import React, { useEffect, useState } from 'react'
import { HardDrive, Plus, Upload, Sliders, X } from 'lucide-react'
import { firmwareAPI } from '../api'

const statusColors: Record<string, { color: string; bg: string }> = {
  draft: { color: '#8c8c8c', bg: '#f5f5f5' },
  testing: { color: '#1890ff', bg: '#e6f7ff' },
  gray: { color: '#faad14', bg: '#fff7e6' },
  released: { color: '#52c41a', bg: '#f6ffed' },
}

const updateStatusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: '#8c8c8c', bg: '#f5f5f5' },
  downloading: { color: '#1890ff', bg: '#e6f7ff' },
  installing: { color: '#faad14', bg: '#fff7e6' },
  success: { color: '#52c41a', bg: '#f6ffed' },
  failed: { color: '#ff4d4f', bg: '#fff1f0' },
}

const styles: Record<string, React.CSSProperties> = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 600 },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  panel: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '10px 12px', textAlign: 'left' as const, fontSize: 13, fontWeight: 600, color: '#8c8c8c', borderBottom: '2px solid #f0f0f0' },
  td: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '2px 8px', borderRadius: 10, fontSize: 12, display: 'inline-block' },
  slider: { width: '100%', cursor: 'pointer' },
  pushBtn: { padding: '4px 10px', border: '1px solid #1890ff', color: '#1890ff', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}

export default function FirmwareConsole() {
  const [releases, setReleases] = useState<any[]>([])
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ version: '', model: '', description: '', release_notes: '' })
  const [grayValues, setGrayValues] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [relRes, updRes] = await Promise.allSettled([firmwareAPI.listReleases(), firmwareAPI.listUpdates()])
        const rels = relRes.status === 'fulfilled' ? (Array.isArray(relRes.value.data?.data) ? relRes.value.data.data : Array.isArray(relRes.value.data) ? relRes.value.data : []) : []
        setReleases(rels)
        const grayMap: Record<string, number> = {}
        rels.forEach((r: any) => { grayMap[r.id] = r.gray_percentage || 0 })
        setGrayValues(grayMap)
        setUpdates(updRes.status === 'fulfilled' ? (Array.isArray(updRes.value.data?.data) ? updRes.value.data.data : Array.isArray(updRes.value.data) ? updRes.value.data : []) : [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleCreate = async () => {
    try {
      await firmwareAPI.createRelease(form)
      setShowModal(false)
      setForm({ version: '', model: '', description: '', release_notes: '' })
      const res = await firmwareAPI.listReleases()
      setReleases(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }

  const handleGrayChange = (id: string, value: number) => {
    setGrayValues(prev => ({ ...prev, [id]: value }))
  }

  const handleGrayUpdate = async (id: string) => {
    try { await firmwareAPI.updateRelease(id, { gray_percentage: grayValues[id] }) } catch {}
  }

  const handlePush = async (id: string) => {
    try { await firmwareAPI.push(id, { gray_percentage: grayValues[id] || 100 }) } catch {}
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>固件管理控制台</div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}><Plus size={16} /> 新建固件</button>
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}><HardDrive size={18} color="#1890ff" /> 固件版本列表</div>
        {releases.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无固件版本</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>版本</th>
                <th style={styles.th}>适用型号</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>灰度比例</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {releases.map(r => {
                const s = statusColors[r.status] || statusColors.draft
                return (
                  <tr key={r.id}>
                    <td style={styles.td}><strong>v{r.version}</strong></td>
                    <td style={styles.td}>{r.model || '-'}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, color: s.color, background: s.bg }}>{r.status}</span></td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="range" min={0} max={100} value={grayValues[r.id] || 0} style={styles.slider} onChange={e => handleGrayChange(r.id, Number(e.target.value))} onBlur={() => handleGrayUpdate(r.id)} />
                        <span style={{ fontSize: 12, minWidth: 36 }}>{grayValues[r.id] || 0}%</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.pushBtn} onClick={() => handlePush(r.id)}>
                        <Upload size={12} /> 推送
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}><Sliders size={18} color="#faad14" /> 升级状态监控</div>
        {updates.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无升级记录</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>设备</th>
                <th style={styles.th}>目标版本</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>时间</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u, i) => {
                const s = updateStatusColors[u.status] || updateStatusColors.pending
                return (
                  <tr key={i}>
                    <td style={styles.td}>{u.device_id || u.device_name || '-'}</td>
                    <td style={styles.td}>v{u.target_version || u.version || '-'}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, color: s.color, background: s.bg }}>{u.status}</span></td>
                    <td style={styles.td}>{u.updated_at || u.created_at || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>新建固件版本 <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>版本号</label>
              <input style={styles.input} value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="如: 1.2.0" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>适用型号</label>
              <input style={styles.input} value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="如: KFR-35GW" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>版本说明</label>
              <textarea style={styles.textarea} value={form.release_notes} onChange={e => setForm({ ...form, release_notes: e.target.value })} placeholder="更新内容和修复项" />
            </div>
            <button style={styles.submitBtn} onClick={handleCreate}>创建版本</button>
          </div>
        </div>
      )}
    </div>
  )
}
