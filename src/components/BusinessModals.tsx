import { useState } from 'react'
import Modal from './Modal'
import { useBusinessStore, Customer, Appointment } from '@/store/business'
import { useAuthStore } from '@/store/auth'
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Heart,
  ShoppingBag,
  TrendingUp,
  FileText,
  Plus,
  Package,
  Wallet,
  Users,
  BarChart3,
  Star,
  Clock,
  Building2,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Award,
  ArrowUpRight,
} from 'lucide-react'

export default function BusinessModals() {
  const { modal, closeModal, addCustomer, updateCustomer, addToast, updateAppointmentStatus, addServiceRecord } = useBusinessStore()
  const { user } = useAuthStore()

  const handleClose = () => closeModal()

  /* ============ 客户详情 ============ */
  if (modal.type === 'customer_detail' && modal.data) {
    const c = modal.data as unknown as Customer
    const [tab, setTab] = useState<'info' | 'orders' | 'follow' | 'records'>('info')
    const [noteText, setNoteText] = useState(c.notes || '')

    const handleSaveNote = () => {
      updateCustomer(c.id, { notes: noteText, lastContact: '刚刚' })
      addToast({ type: 'success', title: '备注已保存', description: '客户跟进记录已同步到云端' })
    }

    return (
      <Modal open onClose={handleClose} title={`${c.name} · 客户详情`} subtitle={`客户编号 ${c.id} · ${c.level}`} size="lg">
        <div>
          {/* 客户头部 */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-sky-50 to-violet-50 rounded-xl border border-sky-100 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {c.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800">{c.name}</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full border border-amber-200">{c.tag}</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full border border-violet-200">{c.level}</span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : c.status === 'new' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {c.status === 'active' ? '活跃' : c.status === 'new' ? '新增' : '待跟进'}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="w-3.5 h-3.5" /> {c.phone}
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5" /> {c.region}
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3.5 h-3.5" /> {c.registerDate}
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <TrendingUp className="w-3.5 h-3.5" /> {c.lastContact}联系
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="px-3 py-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-emerald-600">¥{c.totalAmount.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">累计消费</div>
              </div>
              <div className="px-3 py-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-sky-600">{c.orderCount}</div>
                <div className="text-[10px] text-slate-500">订单数</div>
              </div>
              <div className="px-3 py-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-violet-600">{c.source}</div>
                <div className="text-[10px] text-slate-500">来源</div>
              </div>
            </div>
          </div>

          {/* Tab */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl">
            {[
              { key: 'info', label: '基本信息', icon: User },
              { key: 'orders', label: '消费订单', icon: ShoppingBag },
              { key: 'follow', label: '跟进记录', icon: FileText },
              { key: 'records', label: '服务记录', icon: FileText },
            ].map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                    tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {tab === 'info' && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500" /> 健康关注
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.healthConcerns.map((h) => (
                    <span key={h} className="px-3 py-1.5 text-sm bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-amber-500" /> 下次跟进
                </div>
                <input
                  type="date"
                  defaultValue={c.followUpDate}
                  onChange={(e) => updateCustomer(c.id, { followUpDate: e.target.value })}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4 text-sky-500" /> 客户标签
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    {c.tag}
                  </span>
                  <button className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> 添加标签
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-2">
              {c.orderCount === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>暂无订单记录</p>
                </div>
              ) : (
                Array.from({ length: Math.min(c.orderCount, 5) }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-emerald-600" />
                      <div>
                        <div className="font-medium text-slate-800 text-sm">订单 #{String(10000 + i).padStart(6, '0')}</div>
                        <div className="text-xs text-slate-500">2026-0{6 - i}-{15 + i} · 国珍松花粉片等</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">¥{((c.totalAmount / c.orderCount) * (1 + Math.random() * 0.3)).toFixed(0)}</div>
                      <div className="text-[10px] text-emerald-600">已完成</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'follow' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="记录本次跟进内容、客户反馈、下次计划..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                  取消
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition"
                >
                  保存跟进记录
                </button>
              </div>
              {c.notes && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-600 mb-1">上次跟进 · {c.lastContact}</div>
                  <p className="text-sm text-slate-700">{c.notes}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'records' && (
            <div className="space-y-2">
              <div className="p-4 bg-slate-50 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-slate-800">松花粉体验+体质检测</div>
                  <div className="text-xs text-slate-500 mt-0.5">浦东旗舰店 · 2026-06-15 · 王芳顾问</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">存证: 0x8f3a...e291</div>
                </div>
              </div>
              <button className="w-full py-3 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl border border-dashed border-emerald-300 transition flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> 关联预约，新增服务记录
              </button>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  /* ============ 新增客户 ============ */
  if (modal.type === 'add_customer') {
    const [form, setForm] = useState({
      name: '',
      phone: '',
      tag: '潜在客户',
      region: '',
      source: '展业码扫码',
      healthConcerns: [] as string[],
    })

    const concerns = ['免疫调节', '睡眠改善', '心脑血管', '骨骼健康', '肠胃调理', '抗氧化', '体重管理', '美容养颜', '内分泌', '抗疲劳']

    const toggleConcern = (c: string) => {
      setForm((f) => ({
        ...f,
        healthConcerns: f.healthConcerns.includes(c) ? f.healthConcerns.filter((x) => x !== c) : [...f.healthConcerns, c],
      }))
    }

    const handleSubmit = () => {
      if (!form.name || !form.phone) {
        addToast({ type: 'error', title: '信息不完整', description: '请填写姓名和手机号' })
        return
      }
      addCustomer({
        name: form.name,
        avatar: form.name.charAt(0),
        phone: form.phone.slice(0, 3) + '****' + form.phone.slice(7),
        level: '新客户',
        tag: form.tag,
        totalAmount: 0,
        orderCount: 0,
        lastContact: '刚刚',
        status: 'new',
        registerDate: new Date().toISOString().slice(0, 10),
        region: form.region || '待完善',
        healthConcerns: form.healthConcerns,
        source: form.source,
      })
      addToast({
        type: 'success',
        title: '客户添加成功',
        description: `${form.name} 已自动绑定归属关系，可在客户列表查看`,
      })
      handleClose()
    }

    return (
      <Modal
        open
        onClose={handleClose}
        title="新增客户"
        subtitle="客户将自动绑定到您的展业归属关系"
        size="md"
        footer={
          <>
            <button onClick={handleClose} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition"
            >
              保存客户
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">客户姓名 *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入姓名"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号 *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="请输入手机号"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">客户标签</label>
              <select
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>潜在客户</option>
                <option>核心客户</option>
                <option>高净值</option>
                <option>待跟进</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">获客来源</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>展业码扫码</option>
                <option>微信分享</option>
                <option>生活馆体验</option>
                <option>线下活动</option>
                <option>老客户推荐</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">所在地区</label>
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="如：上海市浦东新区"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">健康关注（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {concerns.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleConcern(c)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    form.healthConcerns.includes(c)
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  /* ============ 业绩明细 ============ */
  if (modal.type === 'performance_detail') {
    const modalData = modal.data as Record<string, unknown> | undefined
    const type = (modalData?.type as string) || 'revenue'

    const detailConfig: Record<string, { title: string; icon: typeof Wallet; color: string; items: { label: string; value: string; note?: string }[] }> = {
      revenue: {
        title: '本月业绩明细',
        icon: TrendingUp,
        color: 'from-emerald-500 to-teal-600',
        items: [
          { label: '个人销售业绩', value: '¥86,200', note: '占比 67.0%' },
          { label: '团队管理津贴', value: '¥28,400', note: '团队 3 人，津贴比例 22%' },
          { label: '辅导奖金', value: '¥14,000', note: '培育 2 位新经销商' },
        ],
      },
      commission: {
        title: '待结算佣金明细',
        icon: Wallet,
        color: 'from-amber-500 to-orange-600',
        items: [
          { label: '产品销售佣金', value: '¥8,620', note: '比例 10%' },
          { label: '团队业绩佣金', value: '¥4,200', note: '比例 15%' },
          { label: '月度达标奖金', value: '¥2,500', note: '达成 ¥10万 目标' },
        ],
      },
      team: {
        title: '团队明细',
        icon: Users,
        color: 'from-violet-500 to-purple-600',
        items: [
          { label: '直接推荐', value: '12 人', note: '本月新增 3 人' },
          { label: '二级团队', value: '28 人', note: '本月新增 8 人' },
          { label: '三级及以下', value: '146 人', note: '活跃率 68%' },
        ],
      },
      customers: {
        title: '客户明细',
        icon: User,
        color: 'from-sky-500 to-blue-600',
        items: [
          { label: 'VIP/钻石客户', value: '32 人', note: '贡献 78% 业绩' },
          { label: '普通活跃客户', value: '96 人', note: '近 30 天有消费' },
          { label: '待激活/沉睡', value: '58 人', note: '建议唤醒跟进' },
        ],
      },
    }

    const cfg = detailConfig[type] || detailConfig.revenue
    const Icon = cfg.icon
    const total = cfg.items.reduce((sum, it) => sum + (parseFloat(it.value.replace(/[^\d.]/g, '')) || 0), 0)

    return (
      <Modal open onClose={handleClose} title={cfg.title} subtitle="数据实时同步，可点击查看来源记录" size="md">
        <div>
          <div className={`p-5 rounded-2xl bg-gradient-to-br ${cfg.color} text-white mb-5`}>
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8" />
              <div>
                <div className="text-white/80 text-sm">合计</div>
                <div className="text-3xl font-bold mt-0.5">
                  {cfg.items[0].value.includes('¥') ? `¥${total.toLocaleString()}` : `${total.toLocaleString()} 人`}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {cfg.items.map((it, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} opacity-15 flex items-center justify-center`}>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${cfg.color}`} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{it.label}</div>
                    {it.note && <div className="text-xs text-slate-500 mt-0.5">{it.note}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">{it.value}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 py-3 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center justify-center gap-1">
            <BarChart3 className="w-4 h-4" /> 导出完整报表
          </button>
        </div>
      </Modal>
    )
  }

  /* ============ 预约详情 ============ */
  if (modal.type === 'appointment_detail' && modal.data) {
    const apt = modal.data as unknown as Appointment
    const statusLabels: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
    }
    const statusColors: Record<string, string> = {
      pending: 'bg-amber-500',
      confirmed: 'bg-sky-500',
      completed: 'bg-emerald-500',
      cancelled: 'bg-slate-400',
    }

    const handleStatusChange = (status: Appointment['status']) => {
      updateAppointmentStatus(apt.id, status)
      addToast({
        type: 'success',
        title: `预约已${statusLabels[status]}`,
        description: `${apt.customer} 的预约状态已更新`,
      })
      if (status === 'completed') {
        addServiceRecord({
          customer: apt.customer,
          avatar: apt.avatar,
          service: apt.service,
          store: apt.store,
          date: new Date().toISOString().slice(0, 10),
          duration: '60 分钟',
          consultant: user?.name || '当前顾问',
          products: ['定制服务方案 x1'],
        })
      }
      handleClose()
    }

    return (
      <Modal open onClose={handleClose} title="预约详情" subtitle={`预约编号 ${apt.id}`} size="md">
        <div>
          <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-amber-50 to-sky-50 rounded-xl border border-amber-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
              {apt.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-800">{apt.customer}</span>
                <span className={`w-2 h-2 rounded-full ${statusColors[apt.status]}`} />
                <span className="text-sm text-slate-600">{statusLabels[apt.status]}</span>
              </div>
              <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {apt.phone}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Heart className="w-5 h-5 text-rose-500 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">服务项目</div>
                <div className="font-medium text-slate-800 mt-0.5">{apt.service}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Building2 className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">服务门店</div>
                <div className="font-medium text-slate-800 mt-0.5">{apt.store}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-5 h-5 text-sky-500 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">预约时间</div>
                <div className="font-medium text-slate-800 mt-0.5">{apt.date} {apt.time}</div>
              </div>
            </div>
            {apt.note && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-amber-700">注意事项</div>
                  <div className="font-medium text-amber-800 mt-0.5">{apt.note}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {apt.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  className="py-3 font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition"
                >
                  确认预约
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="py-3 font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                >
                  取消预约
                </button>
              </>
            )}
            {apt.status === 'confirmed' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="col-span-2 py-3 font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> 标记服务完成（自动上链）
              </button>
            )}
            {apt.status === 'completed' && (
              <div className="col-span-2 py-3 text-center text-sm text-emerald-600 bg-emerald-50 rounded-xl flex items-center justify-center gap-1">
                <Award className="w-4 h-4" /> 服务已完成并写入区块链存证
              </div>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  return null
}
