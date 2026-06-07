import React, { useEffect, useState } from 'react'
import { GitBranch, Plus, Link, Unlink, Shield, X } from 'lucide-react'
import { channelAPI, deviceAPI } from '../api'

const permissionLabels: Record<string, string> = { view: '查看', control: '控制', admin: '管理' }
const permissionColors: Record<string, string> = { view: '#1890ff', control: '#faad14', admin: '#ff4d4f' }

const styles: Record<string, React.CSSProperties> = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 600 },
  addBtn: { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  panel: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  panelTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  treeNode: { padding: '8px 12px', cursor: 'pointer', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, transition: 'background 0.2s' },
  treeNodeActive: { padding: '8px 12px', cursor: 'pointer', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, background: '#e6f7ff', borderLeft: '3px solid #1890ff' },
  treeChild: { marginLeft: 24 },
  deviceItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f6f8fa', borderRadius: 8, marginBottom: 8 },
  deviceName: { fontWeight: 500, fontSize: 13 },
  permBadge: { padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 },
  unbindBtn: { padding: '4px 8px', border: '1px solid #ff4d4f', color: '#ff4d4f', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 },
  bindSection: { marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 },
  bindRow: { display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 },
  formGroup: { flex: 1 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#595959', marginBottom: 4 },
  input: { width: '100%', padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
  bindBtn: { padding: '6px 14px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 12, padding: 32, width: 400 },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: { width: '100%', padding: '10px 0', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
}

export default function ChannelManager() {
  const [channels, setChannels] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [boundDevices, setBoundDevices] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' })
  const [bindForm, setBindForm] = useState({ device_id: '', permission: 'view' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chRes, devRes] = await Promise.allSettled([channelAPI.list(), deviceAPI.list()])
        const chs = chRes.status === 'fulfilled' ? (Array.isArray(chRes.value.data?.data) ? chRes.value.data.data : Array.isArray(chRes.value.data) ? chRes.value.data : []) : []
        setChannels(chs)
        setDevices(devRes.status === 'fulfilled' ? (Array.isArray(devRes.value.data?.data) ? devRes.value.data.data : Array.isArray(devRes.value.data) ? devRes.value.data : []) : [])
        if (chs.length > 0) setSelectedChannel(chs[0].id)
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedChannel) return
    channelAPI.getDevices(selectedChannel).then(res => {
      setBoundDevices(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    }).catch(() => setBoundDevices([]))
  }, [selectedChannel])

  const handleCreate = async () => {
    try {
      await channelAPI.create(form)
      setShowModal(false)
      setForm({ name: '', description: '', parent_id: '' })
      const res = await channelAPI.list()
      setChannels(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }

  const handleBind = async () => {
    if (!selectedChannel || !bindForm.device_id) return
    try {
      await channelAPI.bindDevice(selectedChannel, bindForm)
      setBindForm({ device_id: '', permission: 'view' })
      const res = await channelAPI.getDevices(selectedChannel)
      setBoundDevices(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [])
    } catch {}
  }

  const handleUnbind = async (deviceId: string) => {
    if (!selectedChannel) return
    try {
      await channelAPI.unbindDevice(selectedChannel, deviceId)
      setBoundDevices(prev => prev.filter(d => d.device_id !== deviceId && d.id !== deviceId))
    } catch {}
  }

  const rootChannels = channels.filter(c => !c.parent_id)
  const getChildren = (parentId: string) => channels.filter(c => c.parent_id === parentId)

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>渠道管理</div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}><Plus size={16} /> 添加渠道</button>
      </div>

      <div style={styles.row}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}><GitBranch size={18} color="#1890ff" /> 渠道树</div>
          {rootChannels.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无渠道</div>
          ) : rootChannels.map(c => (
            <div key={c.id}>
              <div style={selectedChannel === c.id ? styles.treeNodeActive : styles.treeNode} onClick={() => setSelectedChannel(c.id)}>
                <GitBranch size={14} /> {c.name}
              </div>
              {getChildren(c.id).map(child => (
                <div key={child.id} style={styles.treeChild}>
                  <div style={{ ...styles.treeNode, marginLeft: 24 }} onClick={() => setSelectedChannel(child.id)}>
                    <GitBranch size={12} /> {child.name}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}><Shield size={18} color="#faad14" /> 绑定设备</div>
          {boundDevices.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无绑定设备</div>
          ) : boundDevices.map((d, i) => (
            <div key={i} style={styles.deviceItem}>
              <div>
                <span style={styles.deviceName}>{d.device_name || d.device_id}</span>
                <span style={{ ...styles.permBadge, color: permissionColors[d.permission] || '#8c8c8c', background: '#f5f5f5', marginLeft: 8 }}>
                  {permissionLabels[d.permission] || d.permission}
                </span>
              </div>
              <button style={styles.unbindBtn} onClick={() => handleUnbind(d.device_id || d.id)}>
                <Unlink size={12} /> 解绑
              </button>
            </div>
          ))}

          <div style={styles.bindSection}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>绑定新设备</div>
            <div style={styles.bindRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>设备</label>
                <select style={styles.input} value={bindForm.device_id} onChange={e => setBindForm({ ...bindForm, device_id: e.target.value })}>
                  <option value="">选择设备</option>
                  {devices.map(d => <option key={d.id} value={d.id}>{d.name || d.device_name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>权限</label>
                <select style={styles.input} value={bindForm.permission} onChange={e => setBindForm({ ...bindForm, permission: e.target.value })}>
                  <option value="view">查看</option>
                  <option value="control">控制</option>
                  <option value="admin">管理</option>
                </select>
              </div>
              <button style={styles.bindBtn} onClick={handleBind}><Link size={14} /> 绑定</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>添加渠道 <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>渠道名称</label>
              <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如: 华东区" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>描述</label>
              <input style={styles.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="渠道描述" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>父级渠道</label>
              <select style={styles.input} value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}>
                <option value="">无（顶级渠道）</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button style={styles.submitBtn} onClick={handleCreate}>创建渠道</button>
          </div>
        </div>
      )}
    </div>
  )
}
