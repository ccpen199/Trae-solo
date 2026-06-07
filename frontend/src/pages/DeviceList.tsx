import React, { useEffect, useState } from 'react'
import { Cpu, Plus, Wifi, WifiOff, Power, Send, X } from 'lucide-react'
import { deviceAPI } from '../api'

const brands = [
  { label: '海尔', value: 'Haier' },
  { label: '卡萨帝', value: 'Casarte' },
  { label: 'GE', value: 'GE' },
  { label: '斐雪派克', value: 'Fisher&Paykel' },
]
const types = [
  { label: '空调', value: 'air_conditioner' },
  { label: '冰箱', value: 'fridge' },
  { label: '洗衣机', value: 'washer' },
  { label: '电视', value: 'tv' },
  { label: '窗帘', value: 'curtain' },
  { label: '灯', value: 'light' },
]
const brandMap: Record<string, string> = { Haier: '海尔', Casarte: '卡萨帝', GE: 'GE', 'Fisher&Paykel': '斐雪派克' }
const typeMap: Record<string, string> = { air_conditioner: '空调', fridge: '冰箱', washer: '洗衣机', tv: '电视', curtain: '窗帘', light: '灯' }
const statuses = ['online', 'offline']
const rooms = ['客厅', '卧室', '厨房', '卫生间', '书房', '阳台']

const styles: Record<string, React.CSSProperties> = {
  container: {},
  toolbar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  select: { padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff' },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', transition: 'box-shadow 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#1a1a1a' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  cardInfo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#8c8c8c', marginBottom: 14 },
  cardActions: { display: 'flex', gap: 8 },
  actionBtn: { padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
}

export default function DeviceList() {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ brand: '', type: '', status: '', room: '' })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({ name: '', brand: 'Haier', type: 'air_conditioner', room: '客厅', protocol: 'wifi', model: '', device_id: '' })

  useEffect(() => { fetchDevices() }, [])

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res = await deviceAPI.list(filter)
      setDevices(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch { setDevices([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDevices() }, [filter])

  const handleAdd = async () => {
    try {
      await deviceAPI.create(form)
      setShowModal(false)
      setForm({ name: '', brand: 'Haier', type: 'air_conditioner', room: '客厅', protocol: 'wifi', model: '', device_id: '' })
      fetchDevices()
    } catch {}
  }

  const handlePower = async (d: any) => {
    try {
      await deviceAPI.command(d.id, { command: d.status === 'online' ? 'turn_off' : 'turn_on' })
      fetchDevices()
    } catch {}
  }

  const filtered = devices.filter(d => {
    if (filter.brand && d.brand !== filter.brand) return false
    if (filter.type && d.device_type !== filter.type && d.type !== filter.type) return false
    if (filter.status && d.status !== filter.status) return false
    if (filter.room && d.room !== filter.room) return false
    return true
  })

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <select style={styles.select} value={filter.brand} onChange={e => setFilter({ ...filter, brand: e.target.value })}>
          <option value="">全部品牌</option>
          {brands.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <select style={styles.select} value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
          <option value="">全部类型</option>
          {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select style={styles.select} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">全部状态</option>
          <option value="online">在线</option>
          <option value="offline">离线</option>
        </select>
        <select style={styles.select} value={filter.room} onChange={e => setFilter({ ...filter, room: e.target.value })}>
          <option value="">全部房间</option>
          {rooms.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={16} /> 添加设备
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无设备数据</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(d => (
            <div key={d.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Cpu size={18} color="#1890ff" />
                  <span style={styles.cardName}>{d.name || d.device_name}</span>
                </div>
                <span style={{ ...styles.badge, background: d.status === 'online' ? '#f6ffed' : '#fff1f0', color: d.status === 'online' ? '#52c41a' : '#ff4d4f' }}>
                  {d.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {d.status === 'online' ? '在线' : '离线'}
                </span>
              </div>
              <div style={styles.cardInfo}>
                <span>品牌: {brandMap[d.brand] || d.brand || '-'}</span>
                <span>类型: {typeMap[d.type] || d.type || '-'}</span>
                <span>房间: {d.room || '-'}</span>
                <span>协议: {d.protocol || '-'}</span>
              </div>
              <div style={styles.cardActions}>
                <button style={styles.actionBtn} onClick={() => handlePower(d)}>
                  <Power size={14} /> 电源
                </button>
                <button style={styles.actionBtn} onClick={() => deviceAPI.command(d.id, { command: 'status' })}>
                  <Send size={14} /> 指令
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              添加设备
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>设备ID</label>
              <input style={styles.input} value={form.device_id} onChange={e => setForm({ ...form, device_id: e.target.value })} placeholder="请输入设备唯一标识" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>设备名称</label>
              <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="请输入设备名称" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>品牌</label>
                <select style={styles.input} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}>
                  {brands.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>类型</label>
                <select style={styles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>房间</label>
                <select style={styles.input} value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                  {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>协议</label>
                <select style={styles.input} value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })}>
                  <option value="wifi">WiFi</option>
                  <option value="zigbee">ZigBee</option>
                  <option value="bluetooth">蓝牙</option>
                  <option value="ir">红外</option>
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>型号</label>
              <input style={styles.input} value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="请输入设备型号" />
            </div>
            <button style={styles.submitBtn} onClick={handleAdd}>确认添加</button>
          </div>
        </div>
      )}
    </div>
  )
}
