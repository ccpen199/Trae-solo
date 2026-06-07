import React, { useEffect, useState } from 'react'
import { Sparkles, Play, Plus, X, Mic, Code, ChevronDown } from 'lucide-react'
import { sceneAPI, deviceAPI } from '../api'

const triggerTypes = [
  { value: 'manual', label: '手动触发' },
  { value: 'voice', label: '语音触发' },
  { value: 'scheduled', label: '定时触发' },
  { value: 'condition', label: '条件触发' },
]

const styles: Record<string, React.CSSProperties> = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 600 },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardName: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#8c8c8c', marginBottom: 12 },
  cardMeta: { display: 'flex', gap: 12, marginBottom: 12 },
  metaTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12, background: '#f0f0f0', color: '#595959' },
  executeBtn: { padding: '6px 14px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 560, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  triggerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  triggerBtn: { padding: '8px 4px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff', textAlign: 'center' as const, transition: 'all 0.2s' },
  triggerBtnActive: { padding: '8px 4px', border: '1px solid #1890ff', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#e6f7ff', color: '#1890ff', textAlign: 'center' as const },
  actionItem: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  removeBtn: { padding: '4px 8px', border: '1px solid #ff4d4f', color: '#ff4d4f', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  addActionBtn: { padding: '6px 12px', border: '1px dashed #1890ff', color: '#1890ff', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, width: '100%' },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  toggle: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#595959' },
  logSection: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  logItem: { padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, display: 'flex', justifyContent: 'space-between' },
}

export default function SceneList() {
  const [scenes, setScenes] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [geekMode, setGeekMode] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', description: '', trigger_type: 'manual', voice_text: '',
    actions: [{ device_id: '', action: '', params: '' }],
    actions_json: '[]',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sceneRes, devRes] = await Promise.allSettled([sceneAPI.list(), deviceAPI.list()])
        setScenes(sceneRes.status === 'fulfilled' ? (Array.isArray(sceneRes.value.data?.data) ? sceneRes.value.data.data : Array.isArray(sceneRes.value.data) ? sceneRes.value.data : []) : [])
        setDevices(devRes.status === 'fulfilled' ? (Array.isArray(devRes.value.data?.data) ? devRes.value.data.data : Array.isArray(devRes.value.data) ? devRes.value.data : []) : [])
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleExecute = async (id: string) => {
    try {
      const res = await sceneAPI.execute(id)
      setLogs(prev => [{ scene_id: id, time: new Date().toLocaleString(), result: res.data?.message || '执行成功' }, ...prev].slice(0, 20))
    } catch {}
  }

  const handleCreate = async () => {
    try {
      const payload: any = { name: form.name, description: form.description, trigger_type: form.trigger_type }
      if (form.trigger_type === 'voice') payload.voice_text = form.voice_text
      if (geekMode) {
        try { payload.actions = JSON.parse(form.actions_json) } catch { payload.actions = [] }
      } else {
        payload.actions = form.actions.filter(a => a.device_id)
      }
      await sceneAPI.create(payload)
      setShowModal(false)
      setForm({ name: '', description: '', trigger_type: 'manual', voice_text: '', actions: [{ device_id: '', action: '', params: '' }], actions_json: '[]' })
      const res = await sceneAPI.list()
      setScenes(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }

  const addAction = () => setForm({ ...form, actions: [...form.actions, { device_id: '', action: '', params: '' }] })
  const removeAction = (i: number) => setForm({ ...form, actions: form.actions.filter((_, idx) => idx !== i) })
  const updateAction = (i: number, field: string, value: string) => {
    const actions = [...form.actions]
    actions[i] = { ...actions[i], [field]: value }
    setForm({ ...form, actions })
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>场景管理</div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}><Plus size={16} /> 创建场景</button>
      </div>

      <div style={styles.grid}>
        {scenes.map(s => (
          <div key={s.id} style={styles.card}>
            <div style={styles.cardName}>{s.name}</div>
            <div style={styles.cardDesc}>{s.description || '暂无描述'}</div>
            <div style={styles.cardMeta}>
              <span style={styles.metaTag}>{triggerTypes.find(t => t.value === s.trigger_type)?.label || s.trigger_type}</span>
              <span style={styles.metaTag}>{Array.isArray(s.actions) ? s.actions.length : 0} 个动作</span>
            </div>
            <button style={styles.executeBtn} onClick={() => handleExecute(s.id)}>
              <Play size={14} /> 执行
            </button>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div style={styles.logSection}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>执行日志</div>
          {logs.map((l, i) => (
            <div key={i} style={styles.logItem}>
              <span>场景 {l.scene_id} - {l.result}</span>
              <span style={{ color: '#8c8c8c' }}>{l.time}</span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>创建场景 <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} /></div>

            <div style={styles.formGroup}>
              <label style={styles.label}>场景名称</label>
              <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如: 回家模式" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>场景描述</label>
              <textarea style={styles.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="描述场景功能" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>触发方式</label>
              <div style={styles.triggerGrid}>
                {triggerTypes.map(t => (
                  <div key={t.value} style={form.trigger_type === t.value ? styles.triggerBtnActive : styles.triggerBtn} onClick={() => setForm({ ...form, trigger_type: t.value })}>
                    {t.value === 'voice' && <Mic size={14} style={{ marginRight: 4 }} />}
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {form.trigger_type === 'voice' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>语音指令</label>
                <input style={styles.input} value={form.voice_text} onChange={e => setForm({ ...form, voice_text: e.target.value })} placeholder="如: 我回家了" />
              </div>
            )}

            <div style={styles.toggle}>
              <Code size={16} />
              <span>极客模式（JSON编辑器）</span>
              <input type="checkbox" checked={geekMode} onChange={e => setGeekMode(e.target.checked)} />
            </div>

            {geekMode ? (
              <div style={styles.formGroup}>
                <label style={styles.label}>动作 JSON</label>
                <textarea style={{ ...styles.textarea, fontFamily: 'monospace', minHeight: 120 }} value={form.actions_json} onChange={e => setForm({ ...form, actions_json: e.target.value })} />
              </div>
            ) : (
              <div style={styles.formGroup}>
                <label style={styles.label}>动作列表</label>
                {form.actions.map((a, i) => (
                  <div key={i} style={styles.actionItem}>
                    <select style={{ ...styles.input, width: 120, flexShrink: 0 }} value={a.device_id} onChange={e => updateAction(i, 'device_id', e.target.value)}>
                      <option value="">选择设备</option>
                      {devices.map(d => <option key={d.id} value={d.id}>{d.name || d.device_name}</option>)}
                    </select>
                    <input style={{ ...styles.input, flex: 1 }} placeholder="动作" value={a.action} onChange={e => updateAction(i, 'action', e.target.value)} />
                    <input style={{ ...styles.input, flex: 1 }} placeholder="参数" value={a.params} onChange={e => updateAction(i, 'params', e.target.value)} />
                    {form.actions.length > 1 && <button style={styles.removeBtn} onClick={() => removeAction(i)}>删除</button>}
                  </div>
                ))}
                <button style={styles.addActionBtn} onClick={addAction}>+ 添加动作</button>
              </div>
            )}

            <button style={styles.submitBtn} onClick={handleCreate}>创建场景</button>
          </div>
        </div>
      )}
    </div>
  )
}
