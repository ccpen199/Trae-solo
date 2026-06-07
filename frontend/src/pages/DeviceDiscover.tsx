import React, { useState } from 'react'
import { Search, Plus, Radio, Loader } from 'lucide-react'
import { deviceAPI, irBridgeAPI } from '../api'

const styles: Record<string, React.CSSProperties> = {
  container: {},
  scanSection: { background: '#fff', borderRadius: 10, padding: 32, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 },
  scanIcon: { width: 80, height: 80, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  scanBtn: { padding: '12px 32px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  scanningText: { fontSize: 14, color: '#8c8c8c', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  resultsSection: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  deviceItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f6f8fa', borderRadius: 8, marginBottom: 10 },
  deviceInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  deviceName: { fontWeight: 500, color: '#1a1a1a' },
  deviceMeta: { fontSize: 12, color: '#8c8c8c' },
  addBtn: { padding: '6px 14px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  irSection: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  irGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  irCard: { padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #f0f0f0' },
  formGroup: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#595959', marginBottom: 4 },
  input: { width: '100%', padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
  pairBtn: { padding: '8px 16px', background: '#722ed1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 },
  spinner: { animation: 'spin 1s linear infinite', display: 'inline-block' },
}

export default function DeviceDiscover() {
  const [scanning, setScanning] = useState(false)
  const [discovered, setDiscovered] = useState<any[]>([])
  const [bridges, setBridges] = useState<any[]>([])
  const [pairingBridge, setPairingBridge] = useState('')
  const [pairCode, setPairCode] = useState('')

  React.useEffect(() => {
    irBridgeAPI.list().then(res => {
      setBridges(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
  }, [])

  const handleScan = async () => {
    setScanning(true)
    setDiscovered([])
    try {
      const res = await deviceAPI.discover()
      const list = res.data?.data || res.data || []
      setDiscovered(Array.isArray(list) ? list : [])
    } catch { setDiscovered([]) }
    finally { setScanning(false) }
  }

  const handleAdd = async (d: any) => {
    try {
      await deviceAPI.create({
        name: d.name || d.device_name,
        brand: d.brand,
        type: d.type || d.device_type,
        protocol: d.protocol || 'wifi',
        model: d.model,
      })
      setDiscovered(prev => prev.filter(x => x !== d))
    } catch {}
  }

  const handlePair = async () => {
    if (!pairingBridge || !pairCode) return
    try {
      await irBridgeAPI.learn(pairingBridge, { code_name: pairCode })
      setPairCode('')
    } catch {}
  }

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <div style={styles.scanSection}>
        <div style={{ ...styles.scanIcon, background: scanning ? '#fff7e6' : '#e6f7ff' }}>
          {scanning ? <Loader size={36} color="#faad14" style={styles.spinner} /> : <Search size={36} color="#1890ff" />}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {scanning ? '正在扫描附近设备...' : '设备自动发现'}
        </div>
        <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 20 }}>
          {scanning ? '请确保设备已开启并处于配网模式' : '扫描局域网内所有支持自动发现的智能设备'}
        </div>
        <button style={{ ...styles.scanBtn, opacity: scanning ? 0.6 : 1 }} onClick={handleScan} disabled={scanning}>
          <Search size={18} />
          {scanning ? '扫描中...' : '开始扫描'}
        </button>
      </div>

      {discovered.length > 0 && (
        <div style={styles.resultsSection}>
          <div style={styles.sectionTitle}><Search size={18} color="#1890ff" /> 发现的设备 ({discovered.length})</div>
          {discovered.map((d, i) => (
            <div key={i} style={styles.deviceItem}>
              <div style={styles.deviceInfo}>
                <div>
                  <div style={styles.deviceName}>{d.name || d.device_name || `设备 ${i + 1}`}</div>
                  <div style={styles.deviceMeta}>{d.brand || ''} {d.type || d.device_type || ''} {d.model || ''}</div>
                </div>
              </div>
              <button style={styles.addBtn} onClick={() => handleAdd(d)}>
                <Plus size={14} /> 添加
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.irSection}>
        <div style={styles.sectionTitle}><Radio size={18} color="#722ed1" /> 红外网关配对</div>
        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 16 }}>适用于非WiFi设备（如空调、电视遥控器），通过红外网关控制</div>
        <div style={styles.irGrid}>
          <div style={styles.irCard}>
            <div style={styles.formGroup}>
              <label style={styles.label}>选择红外网关</label>
              <select style={styles.input} value={pairingBridge} onChange={e => setPairingBridge(e.target.value)}>
                <option value="">请选择</option>
                {bridges.map(b => <option key={b.id} value={b.id}>{b.name || b.bridge_name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>遥控器名称</label>
              <input style={styles.input} value={pairCode} onChange={e => setPairCode(e.target.value)} placeholder="如: 客厅空调遥控" />
            </div>
            <button style={styles.pairBtn} onClick={handlePair}>
              <Radio size={14} /> 开始学习红外码
            </button>
          </div>
          <div style={styles.irCard}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>配对步骤</div>
            <div style={{ fontSize: 13, color: '#595959', lineHeight: 2 }}>
              1. 选择已添加的红外网关<br/>
              2. 输入遥控器名称<br/>
              3. 点击"开始学习红外码"<br/>
              4. 对准网关按下遥控器按键<br/>
              5. 红外码学习成功后即可控制
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
