import React, { useEffect, useState } from 'react'
import { Radio, Plus, Send, BookOpen, X, Loader, GraduationCap } from 'lucide-react'
import { irBridgeAPI } from '../api'

const styles: Record<string, React.CSSProperties> = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 600 },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginTop: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
  codeItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f6f8fa', borderRadius: 6, marginBottom: 6 },
  codeName: { fontSize: 13, fontWeight: 500 },
  sendBtn: { padding: '4px 10px', background: '#722ed1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  learnBtn: { padding: '6px 14px', background: '#faad14', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  learnFlow: { background: '#fffbe6', borderRadius: 8, padding: 16, border: '1px solid #ffe58f', marginBottom: 12 },
  learnStep: { fontSize: 13, lineHeight: 2, color: '#595959' },
}

export default function IRBridgeManager() {
  const [bridges, setBridges] = useState<any[]>([])
  const [bridgeCodes, setBridgeCodes] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', location: '' })
  const [learnBridgeId, setLearnBridgeId] = useState('')
  const [learnCodeName, setLearnCodeName] = useState('')
  const [learning, setLearning] = useState(false)
  const [sendCode, setSendCode] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchBridges()
  }, [])

  const fetchBridges = async () => {
    try {
      const res = await irBridgeAPI.list()
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setBridges(list)
      list.forEach(async (b: any) => {
        try {
          const codeRes = await irBridgeAPI.getCodes(b.id)
          setBridgeCodes(prev => ({ ...prev, [b.id]: Array.isArray(codeRes.data?.data) ? codeRes.data.data : Array.isArray(codeRes.data) ? codeRes.data : [] }))
        } catch {}
      })
    } catch {} finally { setLoading(false) }
  }

  const handleAdd = async () => {
    try {
      await irBridgeAPI.create(addForm)
      setShowAddModal(false)
      setAddForm({ name: '', location: '' })
      fetchBridges()
    } catch {}
  }

  const handleLearn = async () => {
    if (!learnBridgeId || !learnCodeName) return
    setLearning(true)
    try {
      await irBridgeAPI.learn(learnBridgeId, { code_name: learnCodeName })
      setLearnCodeName('')
      setLearnBridgeId('')
      const codeRes = await irBridgeAPI.getCodes(learnBridgeId)
      setBridgeCodes(prev => ({ ...prev, [learnBridgeId]: Array.isArray(codeRes.data?.data) ? codeRes.data.data : Array.isArray(codeRes.data) ? codeRes.data : [] }))
    } catch {} finally { setLearning(false) }
  }

  const handleSend = async (bridgeId: string, codeName: string) => {
    try {
      await irBridgeAPI.send(bridgeId, { code_name: codeName })
    } catch {}
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>红外网关管理</div>
        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}><Plus size={16} /> 添加网关</button>
      </div>

      {bridges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无红外网关</div>
      ) : (
        <div style={styles.grid}>
          {bridges.map(b => (
            <div key={b.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardName}>
                  <Radio size={18} color="#722ed1" />
                  {b.name || b.bridge_name}
                </div>
                <span style={{ ...styles.statusDot, background: b.status === 'online' ? '#52c41a' : '#ff4d4f' }} />
              </div>
              <div style={{ fontSize: 13, color: '#8c8c8c' }}>位置: {b.location || '-'}</div>

              <div style={styles.sectionTitle}><BookOpen size={14} color="#722ed1" /> 红外码库</div>
              {(bridgeCodes[b.id] || []).length === 0 ? (
                <div style={{ fontSize: 12, color: '#bfbfbf' }}>暂无学习记录</div>
              ) : (bridgeCodes[b.id] || []).map((c: any, i: number) => (
                <div key={i} style={styles.codeItem}>
                  <span style={styles.codeName}>{c.code_name || c.name}</span>
                  <button style={styles.sendBtn} onClick={() => handleSend(b.id, c.code_name || c.name)}>
                    <Send size={12} /> 发送
                  </button>
                </div>
              ))}

              <button style={styles.learnBtn} onClick={() => { setLearnBridgeId(b.id); setLearnCodeName('') }}>
                <GraduationCap size={14} /> 学习新红外码
              </button>
            </div>
          ))}
        </div>
      )}

      {learnBridgeId && (
        <div style={styles.modal} onClick={() => setLearnBridgeId('')}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>学习红外码 <X size={20} style={{ cursor: 'pointer' }} onClick={() => setLearnBridgeId('')} /></div>
            <div style={styles.learnFlow}>
              <div style={styles.learnStep}>
                1. 将遥控器对准红外网关<br/>
                2. 输入红外码名称<br/>
                3. 点击"开始学习"<br/>
                4. 按下遥控器按键
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>红外码名称</label>
              <input style={styles.input} value={learnCodeName} onChange={e => setLearnCodeName(e.target.value)} placeholder="如: 开关、温度+" />
            </div>
            <button style={{ ...styles.submitBtn, background: learning ? '#d9d9d9' : '#faad14' }} onClick={handleLearn} disabled={learning}>
              {learning ? '学习中...' : '开始学习'}
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={styles.modal} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>添加红外网关 <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>网关名称</label>
              <input style={styles.input} value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="如: 客厅红外网关" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>安装位置</label>
              <input style={styles.input} value={addForm.location} onChange={e => setAddForm({ ...addForm, location: e.target.value })} placeholder="如: 客厅电视柜" />
            </div>
            <button style={styles.submitBtn} onClick={handleAdd}>添加网关</button>
          </div>
        </div>
      )}
    </div>
  )
}
