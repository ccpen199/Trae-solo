import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, MapPin, Ticket, Trash2, Plus, X, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const tabs = [
  { key: 'orders', label: '我的订单', icon: Package },
  { key: 'address', label: '地址簿', icon: MapPin },
  { key: 'coupons', label: '优惠券', icon: Ticket },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  in_transit: { label: '运输中', cls: 'badge-info' },
  delivered: { label: '已签收', cls: 'badge-success' },
  exception: { label: '异常', cls: 'badge-danger' },
  picked_up: { label: '已揽收', cls: 'badge-warning' },
  pending: { label: '待取件', cls: 'badge-warning' },
  out_for_delivery: { label: '派送中', cls: 'badge-info' },
}

const tagIcon: Record<string, string> = { home: '🏠', office: '🏢', other: '📍' }

const emptyAddr = { name: '', phone: '', province: '', city: '', district: '', address: '', isDefault: false, tag: 'home' as 'home' | 'office' | 'other' }

export default function Profile() {
  const { currentUser, orders, addressBook, coupons, fetchOrders, fetchAddressBook, fetchCoupons, deleteAddress, addAddress } = useAppStore()
  const [tab, setTab] = useState('orders')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyAddr)

  useEffect(() => {
    fetchOrders()
    fetchAddressBook()
    fetchCoupons()
  }, [fetchOrders, fetchAddressBook, fetchCoupons])

  const handleAdd = async () => {
    await addAddress(form)
    setForm(emptyAddr)
    setShowForm(false)
  }

  const now = new Date()
  const usable = coupons.filter((c) => !c.used && new Date(c.expiresAt) > now)
  const used = coupons.filter((c) => c.used)
  const expired = coupons.filter((c) => !c.used && new Date(c.expiresAt) <= now)

  return (
    <div className="space-y-4 pb-4">
      <div className="gradient-navy rounded-2xl p-5 text-white flex items-center gap-4 animate-slide-up relative overflow-hidden">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
          {currentUser?.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">{currentUser?.name || '未登录'}</p>
          <p className="text-white/60 text-xs">{currentUser?.phone || ''}</p>
        </div>
        <Link to="/admin/alerts" className="bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] px-2 py-1 rounded-lg text-white/50 transition-colors">
          管理
        </Link>
      </div>

      <div className="flex gap-1 bg-surface rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-text-light'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="space-y-3 animate-fade-in">
          {orders.length === 0 && (
            <div className="card p-8 text-center text-text-lighter text-sm">暂无订单</div>
          )}
          {orders.map((o) => {
            const st = statusMap[o.status] || { label: o.status, cls: 'badge-info' }
            return (
              <Link to={`/track?q=${o.waybillNo}`} key={o.id} className="card card-hover p-4 block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-navy">{o.waybillNo}</span>
                  <span className={st.cls}>{st.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-light mb-2">
                  <span>{o.senderAddress.slice(0, o.senderAddress.indexOf('区') + 1 || 4)}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{o.receiverAddress.slice(0, o.receiverAddress.indexOf('区') + 1 || 4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-lighter">{o.createdAt}</span>
                  <span className="text-sm font-bold text-accent">¥{o.fee}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {tab === 'address' && (
        <div className="space-y-3 animate-fade-in">
          <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> 新增地址
          </button>

          {showForm && (
            <div className="card p-4 space-y-3 border-2 border-accent/30 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-navy">新增地址</span>
                <button onClick={() => { setShowForm(false); setForm(emptyAddr) }}><X className="w-4 h-4 text-text-lighter" /></button>
              </div>
              <input className="input-field" placeholder="姓名" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="input-field" placeholder="手机号" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <div className="grid grid-cols-3 gap-2">
                <input className="input-field" placeholder="省" value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))} />
                <input className="input-field" placeholder="市" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                <input className="input-field" placeholder="区" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} />
              </div>
              <input className="input-field" placeholder="详细地址" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              <div className="flex items-center gap-3">
                <select className="input-field w-24" value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value as 'home' | 'office' | 'other' }))}>
                  <option value="home">🏠 家</option>
                  <option value="office">🏢 公司</option>
                  <option value="other">📍 其他</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm text-text-light cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="accent-accent" />
                  设为默认
                </label>
              </div>
              <button onClick={handleAdd} className="btn-navy w-full">保存地址</button>
            </div>
          )}

          {addressBook.map((a) => (
            <div key={a.id} className={`card p-4 ${a.isDefault ? 'border-2 border-accent/30' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{tagIcon[a.tag]}</span>
                  <span className="text-sm font-bold text-navy">{a.name}</span>
                  <span className="text-xs text-text-light">{a.phone}</span>
                  {a.isDefault && <span className="badge badge-success text-[10px]">默认</span>}
                </div>
                <button onClick={() => deleteAddress(a.id)} className="p-1 hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
              <p className="text-xs text-text-light">{a.province}{a.city}{a.district}{a.address}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'coupons' && (
        <div className="space-y-4 animate-fade-in">
          {([
            { label: '可使用', list: usable, active: true },
            { label: '已使用', list: used, active: false },
            { label: '已过期', list: expired, active: false },
          ] as const).map((sec) => (
            <div key={sec.label}>
              <h3 className="section-title text-sm mb-2">{sec.label}（{sec.list.length}）</h3>
              {sec.list.length === 0 && <p className="text-xs text-text-lighter pl-1">暂无</p>}
              <div className="space-y-2">
                {sec.list.map((c) => (
                  <div key={c.id} className={`card p-4 flex items-center gap-4 ${!sec.active ? 'opacity-50' : ''}`}>
                    <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      sec.active ? 'gradient-accent text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      <span className="text-xs">{c.type === 'fixed' ? '¥' : ''}</span>
                      <span className={`text-2xl font-bold leading-none ${!sec.active && c === (sec.list.find(x => new Date(x.expiresAt) <= now)) ? 'line-through' : ''}`}>
                        {c.amount}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${sec.active ? 'text-navy' : 'text-gray-400'}`}>{c.code}</p>
                      <p className="text-xs text-text-lighter mt-1">有效期至 {c.expiresAt}</p>
                    </div>
                    {!sec.active && <span className="text-xs text-text-lighter">{sec.label === '已使用' ? '已使用' : '已过期'}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
