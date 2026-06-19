import { useState } from 'react'
import Modal from './Modal'
import AccountModal from './AccountModal'
import { useBusinessStore, Customer, Appointment, QrScanRecord, Task } from '@/store/business'
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
  Factory,
  Truck,
  Eye,
  Layers,
  Database,
  History,
  Zap,
  Gift,
  Percent,
  ArrowRightLeft,
  BarChart2,
  ShieldCheck,
  Hash,
  ArrowRight,
  Barcode,
  QrCode,
  Share2,
  UserCheck,
  Smartphone,
  CheckCircle2,
  XCircle,
  Link2,
  Globe,
  Target,
  Flag,
  MessageSquare,
  Send,
  ClipboardList,
} from 'lucide-react'

export default function BusinessModals() {
  const { modal, closeModal, addCustomer, updateCustomer, addToast, updateAppointmentStatus, addServiceRecord, addTask, updateTask, completeTask, addTaskFollowUp, addAppointment, openModal, customers, appointments } = useBusinessStore()
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

  /* ============ 批次溯源详情 ============ */
  if (modal.type === 'batch_detail' && modal.data) {
    const data = modal.data as Record<string, unknown>
    const productName = (data.productName as string) || '国珍松花粉片（升级版）'
    const sku = (data.sku as string) || 'GZ-SHF-001-180'
    const spec = (data.spec as string) || '0.5g × 180 片'
    const batchNo = (data.batch as string) || '20260315-A'
    const productionDate = (data.productionDate as string) || '2026-03-15'
    const expiryDate = (data.expiryDate as string) || '2028-03-14'
    const reportNo = (data.reportNo as string) || 'QC-20260315-8829'
    const chainHash = (data.chainHash as string) || '0x7f3a8c2e9b4d1f6a...8e291c4b7d3a5f6e'

    const traceChain = [
      { step: 1, name: '原料采购', time: '2026-03-01 08:30', location: '云南香格里拉松花粉基地', operator: '张建国', hash: '0xa1b2c3...4d5e6f', icon: MapPin, status: 'done' },
      { step: 2, name: '工厂生产', time: '2026-03-10 14:20', location: '烟台生产基地 A3 车间', operator: '李明华', hash: '0x2c3d4e...7f8a9b', icon: Factory, status: 'done' },
      { step: 3, name: '质检入库', time: '2026-03-12 09:15', location: '国家级检测实验室', operator: '王晓燕', hash: '0x5e6f7a...0b1c2d', icon: ShieldCheck, status: 'done' },
      { step: 4, name: '大区仓', time: '2026-03-15 16:45', location: '华东区域分拨中心', operator: '赵德伟', hash: '0x8a9b0c...3d4e5f', icon: Database, status: 'done' },
      { step: 5, name: '生活馆', time: '2026-03-18 10:00', location: '上海浦东生活馆', operator: '陈雅婷', hash: '0xb0c1d2...6e7f8a', icon: Building2, status: 'done' },
      { step: 6, name: '直销员/客户', time: '2026-03-20 15:30', location: '客户签收', operator: '刘志强', hash: '0xd2e3f4...9a0b1c', icon: User, status: 'current' },
    ]

    return (
      <Modal open onClose={handleClose} title="批次溯源详情" subtitle={`${productName} · 区块链存证`} size="lg">
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-violet-50 to-sky-50 rounded-2xl border border-violet-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-lg">
                🌰
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">{productName}</h3>
                <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="text-slate-600 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5" /> <span className="font-mono">{sku}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {spec}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-3">
                <div className="text-[11px] text-slate-500">批次号</div>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{batchNo}</div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="text-[11px] text-slate-500">生产日期</div>
                <div className="font-medium text-slate-800 mt-0.5">{productionDate}</div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="text-[11px] text-slate-500">到期日期</div>
                <div className="font-medium text-slate-800 mt-0.5">{expiryDate}</div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="text-[11px] text-slate-500">质检报告</div>
                <div className="font-mono font-medium text-slate-800 mt-0.5">{reportNo}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-violet-600" /> 溯源链路时间线
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-sky-500 to-slate-200" />
              {traceChain.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.step} className="relative pb-6 last:pb-0">
                    <div
                      className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${
                        step.status === 'current'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-100 animate-pulse'
                          : step.status === 'done'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-slate-300'
                      }`}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div
                      className={`ml-4 p-4 rounded-xl border transition ${
                        step.status === 'current'
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-md'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {step.step}. {step.name}
                          </span>
                          {step.status === 'current' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                              当前节点
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {step.time}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {step.location}
                        </div>
                        <div className="text-slate-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          操作人：{step.operator}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-violet-600 font-mono bg-violet-50 px-2 py-1 rounded-md inline-flex">
                        <Hash className="w-3 h-3" />
                        上链哈希：{step.hash}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  区块链存证哈希
                </div>
                <div className="font-mono text-base font-bold text-slate-800 mt-1 break-all">
                  {chainHash}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  国家市场监督管理总局区块链存证 · 不可篡改
                </div>
              </div>
              <button
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: '存证证书',
                    description: '正在从区块链节点加载并验证存证证书...',
                  })
                }
                className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl flex items-center gap-2 hover:shadow-lg transition"
              >
                <Eye className="w-4 h-4" />
                查看存证证书
              </button>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  /* ============ 分布式库存明细 ============ */
  if (modal.type === 'inventory_detail' && modal.data) {
    const data = modal.data as Record<string, unknown>
    const productName = (data.productName as string) || '国珍松花粉片（升级版）'
    const sku = (data.sku as string) || 'GZ-SHF-001-180'
    const image = (data.image as string) || '🌰'
    const totalStock = (data.totalStock as number) || 256

    const storeInventories = [
      { id: 'S001', name: '浦东旗舰店', stock: 58, inTransit: 12, safetyStock: 20, status: 'normal', lastUpdate: '2026-06-19 08:30' },
      { id: 'S002', name: '徐汇体验店', stock: 42, inTransit: 8, safetyStock: 15, status: 'normal', lastUpdate: '2026-06-19 09:15' },
      { id: 'S003', name: '长宁服务中心', stock: 8, inTransit: 20, safetyStock: 15, status: 'warning', lastUpdate: '2026-06-18 16:45' },
      { id: 'S004', name: '闵行生活馆', stock: 36, inTransit: 5, safetyStock: 15, status: 'normal', lastUpdate: '2026-06-19 07:50' },
      { id: 'S005', name: '静安体验中心', stock: 24, inTransit: 0, safetyStock: 15, status: 'normal', lastUpdate: '2026-06-18 20:10' },
    ]

    const stockFlows = [
      { id: 1, type: 'in', store: '浦东旗舰店', quantity: 30, time: '2026-06-19 08:30', operator: '陈雅婷', remark: '华东分仓调拨入库' },
      { id: 2, type: 'out', store: '徐汇体验店', quantity: 12, time: '2026-06-18 19:20', operator: '李明', remark: '客户订单出库' },
      { id: 3, type: 'in', store: '长宁服务中心', quantity: 20, time: '2026-06-18 16:45', operator: '王芳', remark: '紧急调拨入库（在途）' },
      { id: 4, type: 'out', store: '闵行生活馆', quantity: 8, time: '2026-06-18 14:30', operator: '张伟', remark: '直销员提货' },
      { id: 5, type: 'in', store: '静安体验中心', quantity: 25, time: '2026-06-17 10:15', operator: '刘洋', remark: '定期补货入库' },
      { id: 6, type: 'out', store: '浦东旗舰店', quantity: 15, time: '2026-06-17 15:40', operator: '陈雅婷', remark: '活动促销出库' },
      { id: 7, type: 'in', store: '徐汇体验店', quantity: 40, time: '2026-06-16 09:00', operator: '李明', remark: '月度计划补货' },
      { id: 8, type: 'out', store: '长宁服务中心', quantity: 10, time: '2026-06-15 11:20', operator: '王芳', remark: 'VIP 客户提货' },
      { id: 9, type: 'in', store: '闵行生活馆', quantity: 30, time: '2026-06-14 14:50', operator: '张伟', remark: '分仓调拨入库' },
      { id: 10, type: 'out', store: '静安体验中心', quantity: 6, time: '2026-06-13 16:30', operator: '刘洋', remark: '散客零售出库' },
    ]

    const handleStoreClick = (store: typeof storeInventories[0]) => {
      addToast({
        type: 'info',
        title: '门店库存调拨',
        description: `正在为「${store.name}」生成库存调拨申请单...`,
      })
    }

    return (
      <Modal open onClose={handleClose} title="分布式库存明细" subtitle={`${productName} · 实时同步`} size="lg">
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl shadow-lg">
              {image}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">{productName}</h3>
              <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5" /> <span className="font-mono">{sku}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-600">{totalStock}</div>
              <div className="text-xs text-slate-500">总库存（件）</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" /> 各门店库存
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">生活馆</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">现货</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">在途</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">安全库存</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">预警状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">最后更新</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {storeInventories.map((store) => (
                    <tr
                      key={store.id}
                      onClick={() => handleStoreClick(store)}
                      className="hover:bg-emerald-50/50 transition cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-800">{store.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800">{store.stock}</td>
                      <td className="py-3 px-4 text-center text-sky-600 font-medium">{store.inTransit}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{store.safetyStock}</td>
                      <td className="py-3 px-4 text-center">
                        {store.status === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            库存预警
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            正常
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-sm">{store.lastUpdate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" /> 出入库流水（最近 10 条）
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 to-slate-200" />
              {stockFlows.map((flow) => (
                <div key={flow.id} className="relative pb-4 last:pb-0">
                  <div
                    className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${
                      flow.type === 'in'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-rose-500 to-pink-600'
                    }`}
                  >
                    {flow.type === 'in' ? (
                      <Package className="w-3 h-3 text-white" />
                    ) : (
                      <ArrowRightLeft className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="ml-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            flow.type === 'in'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {flow.type === 'in' ? '入库' : '出库'} {flow.quantity} 件
                        </span>
                        <span className="font-medium text-slate-800">{flow.store}</span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {flow.time}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-600">
                      <span className="text-slate-400">操作人：</span>{flow.operator}
                      <span className="text-slate-300 mx-1.5">·</span>
                      {flow.remark}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    )
  }

 /* ============ 展业码溯源详情 ============ */
  if (modal.type === 'qr_detail' && modal.data) {
    const record = modal.data as QrScanRecord

    const traceSteps = [
      { step: 1, name: '展业码生成', time: '2026-03-01 10:00', operator: '系统自动', detail: '李明专属展业码 DS001-LM8888 生成', icon: QrCode, status: 'done' },
      { step: 2, name: '分享传播', time: record.scanTime.slice(0, 10) + ' ' + String(Number(record.scanTime.slice(11, 13)) - 1).padStart(2, '0') + record.scanTime.slice(13), operator: '李明', detail: `通过「${record.channel}」渠道分享`, icon: Share2, status: 'done' },
      { step: 3, name: '客户扫码', time: record.scanTime, operator: record.customerName || '匿名客户', detail: `扫码地点：${record.viewerLocation || '未知'}`, icon: Smartphone, status: 'done' },
      { step: 4, name: '合规风控检测', time: record.scanTime, operator: 'AI 风控系统', detail: record.compliancePassed ? '地理围栏、话术检测、敏感词三项均通过' : (record.riskNote || '存在合规风险，待人工复核'), icon: ShieldCheck, status: record.compliancePassed ? 'done' : 'warning' },
      { step: 5, name: '客户绑定/注册', time: record.registered ? record.scanTime : '待处理', operator: record.registered ? (record.customerName || '系统') : '待操作', detail: record.registered ? `已绑定客户：${record.customerName || '已注册'}` : '未绑定客户，可在扫码记录中操作', icon: UserCheck, status: record.registered ? 'done' : 'pending' },
      { step: 6, name: '消费转化', time: record.registered ? '2026-06-20 14:30' : '—', operator: record.customerName || '—', detail: record.registered ? '产生首单消费：国珍松花粉片 x2，金额 ¥596' : '暂无消费记录', icon: ShoppingBag, status: record.registered ? 'done' : 'pending' },
    ]

    return (
      <Modal open onClose={handleClose} title="展业码溯源详情" subtitle={`扫码记录 ${record.id} · 完整链路`} size="lg">
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl border border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-800">展业码溯源链路</h3>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" /> 编号 {record.id} · 李明专属展业码
                </div>
              </div>
              <div className="text-right">
                <div
                  onClick={() =>
                    addToast({
                      type: record.compliancePassed ? 'success' : 'warning',
                      title: '合规状态',
                      description: record.compliancePassed
                        ? '本次扫码已通过全部合规检测，可正常使用'
                        : `合规检测未通过：${record.riskNote || '存在风险，请联系风控部门'}`,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition ${
                    record.compliancePassed
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {record.compliancePassed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {record.compliancePassed ? '合规通过' : '合规异常'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                onClick={() => addToast({ type: 'info', title: '扫码时间', description: `客户扫码时间：${record.scanTime}` })}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-sm transition border border-slate-100"
              >
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 扫码时间
                </div>
                <div className="font-bold text-slate-800 mt-0.5 text-sm">{record.scanTime}</div>
              </div>
              <div
                onClick={() => addToast({ type: 'info', title: '扫码地点', description: `客户扫码时的地理位置：${record.viewerLocation || '未知'}` })}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-sm transition border border-slate-100"
              >
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> 扫码地点
                </div>
                <div className="font-bold text-slate-800 mt-0.5 text-sm">{record.viewerLocation || '未知'}</div>
              </div>
              <div
                onClick={() => addToast({ type: 'info', title: '传播渠道', description: `展业码通过「${record.channel}」渠道触达客户` })}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-sm transition border border-slate-100"
              >
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> 传播渠道
                </div>
                <div className="font-bold text-slate-800 mt-0.5 text-sm">{record.channel}</div>
              </div>
              <div
                onClick={() =>
                  addToast({
                    type: record.registered ? 'success' : 'info',
                    title: '客户状态',
                    description: record.registered
                      ? `已绑定客户：${record.customerName}（${record.customerId || '已注册'}）`
                      : '该扫码记录尚未绑定客户，可前往扫码记录 Tab 进行绑定',
                  })
                }
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-sm transition border border-slate-100"
              >
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> 绑定客户
                </div>
                <div className={`font-bold mt-0.5 text-sm ${record.registered ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {record.registered ? (record.customerName || '已注册') : '未绑定'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" /> 完整溯源链路
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 via-sky-500 to-slate-200" />
              {traceSteps.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.step}
                    onClick={() =>
                      addToast({
                        type: step.status === 'warning' ? 'warning' : step.status === 'pending' ? 'info' : 'success',
                        title: `${step.name}`,
                        description: `${step.time}\n操作人：${step.operator}\n${step.detail}`,
                      })
                    }
                    className="relative pb-6 last:pb-0 cursor-pointer group"
                  >
                    <div
                      className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white transition ${
                        step.status === 'warning'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-100 group-hover:ring-amber-200'
                          : step.status === 'done'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:scale-110'
                          : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div
                      className={`ml-4 p-4 rounded-xl border transition ${
                        step.status === 'warning'
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm hover:shadow-md'
                          : step.status === 'pending'
                          ? 'bg-slate-50 border-slate-200 border-dashed hover:bg-slate-100'
                          : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {step.step}. {step.name}
                          </span>
                          {step.status === 'warning' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              待复核
                            </span>
                          )}
                          {step.status === 'pending' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-400 text-white rounded-full">
                              待处理
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {step.time}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          操作人：{step.operator}
                        </div>
                        <div className="text-slate-600">{step.detail}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {record.riskNote && (
            <div
              onClick={() =>
                addToast({
                  type: 'warning',
                  title: '风险详情',
                  description: record.riskNote + '\n\n建议：请联系合规风控部门进行人工复核，确认后可解除风险标记。',
                })
              }
              className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 cursor-pointer hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-800">风控提示</div>
                  <p className="text-sm text-amber-700 mt-0.5">{record.riskNote}</p>
                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    点击查看风险详情与申诉渠道
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                addToast({ type: 'success', title: '操作成功', description: '溯源链路已导出为 PDF 报告' })
                handleClose()
              }}
              className="flex-1 py-3 font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> 导出溯源报告
            </button>
            {!record.registered && (
              <button
                onClick={() => {
                  addToast({ type: 'info', title: '跳转中', description: '正在跳转至扫码记录 Tab 进行客户绑定...' })
                  handleClose()
                }}
                className="flex-1 py-3 font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> 绑定客户
              </button>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  /* ============ 促销规则明细 ============ */
  if (modal.type === 'promotion_detail' && modal.data) {
    const data = modal.data as Record<string, unknown>
    const promoName = (data.name as string) || '618 年中大促'
    const promoId = (data.id as string) || 'PRO001'
    const period = (data.period as string) || '2026-06-01 至 2026-06-20'
    const status = (data.status as string) || 'active'

    const statusLabel: Record<string, string> = {
      active: '进行中',
      pending: '未开始',
      ended: '已结束',
    }
    const statusColor: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-sky-50 text-sky-700 border-sky-200',
      ended: 'bg-slate-50 text-slate-600 border-slate-200',
    }

    const rules = [
      { id: 1, name: '满 500 减 50', desc: '订单金额满 500 元立减 50 元，可叠加', icon: DollarSign, type: '满减' },
      { id: 2, name: '满件折扣', desc: '满 2 件 9 折 / 满 3 件 8.5 折', icon: Percent, type: '折扣' },
      { id: 3, name: '赠品策略', desc: '单笔订单满 800 元赠送竹康宁体验装', icon: Gift, type: '赠品' },
      { id: 4, name: '分销佣金加成', desc: '促销期间直销员佣金 +5%', icon: TrendingUp, type: '佣金' },
    ]

    const applicableProducts = [
      { id: 'P001', name: '国珍松花粉片（升级版）', sku: 'GZ-SHF-001-180', price: 398, image: '🌰' },
      { id: 'P002', name: '国珍松花钙奶粉', sku: 'GZ-SHG-002-20', price: 238, image: '🥛' },
      { id: 'P005', name: '国珍玛咖压片糖果', sku: 'GZ-MK-005-120', price: 328, image: '💪' },
      { id: 'P006', name: '国珍冷榨亚麻籽油', sku: 'GZ-YMZ-006-250', price: 198, image: '🫒' },
    ]

    const realtimeData = [
      { label: '参与人数', value: '3,286', icon: Users, color: 'from-sky-500 to-blue-600' },
      { label: 'GMV', value: '¥862,400', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
      { label: 'ROI', value: '4.2x', icon: BarChart2, color: 'from-violet-500 to-purple-600' },
    ]

    return (
      <Modal open onClose={handleClose} title="促销规则明细" subtitle={`${promoName} · 实时数据`} size="lg">
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{promoName}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">{promoId}</div>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColor[status] || statusColor.active}`}
              >
                {statusLabel[status] || '进行中'}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              活动时间：{period}
            </div>
          </div>

          <div className="grid gap-3 grid-cols-3">
            {realtimeData.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="p-4 bg-white rounded-2xl border border-slate-200">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xl font-bold text-slate-800">{item.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                </div>
              )
            })}
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-600" /> 规则引擎
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {rules.map((rule) => {
                const Icon = rule.icon
                return (
                  <div
                    key={rule.id}
                    className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                    onClick={() =>
                      addToast({
                        type: 'info',
                        title: '规则详情',
                        description: `正在查看「${rule.name}」的详细配置与命中逻辑...`,
                      })
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{rule.name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-rose-100 text-rose-700 rounded-full">
                            {rule.type}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">{rule.desc}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-rose-600" /> 适用商品
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {applicableProducts.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() =>
                    addToast({
                      type: 'info',
                      title: '商品详情',
                      description: `正在打开「${p.name}」的产品详情页...`,
                    })
                  }
                  className={`flex items-center gap-3 p-3 hover:bg-rose-50/50 transition cursor-pointer ${
                    i !== applicableProducts.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <span className="text-2xl">{p.image}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-600">¥{p.price}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <button
              onClick={() =>
                addToast({
                  type: 'success',
                  title: '数据导出',
                  description: '活动参与明细报表正在生成，稍后可在消息中心下载...',
                })
              }
              className="py-3 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" /> 导出数据
            </button>
            <button
              onClick={() =>
                addToast({
                  type: 'info',
                  title: '活动分享',
                  description: '正在生成活动专属推广海报与链接...',
                })
              }
              className="py-3 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> 立即推广
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  /* ============ 任务详情 ============ */
  if (modal.type === 'task_detail' && modal.data) {
    const task = modal.data as Task
    const [followUpText, setFollowUpText] = useState('')

    const priorityLabels: Record<string, { label: string; color: string }> = {
      high: { label: '高', color: 'bg-red-100 text-red-700 border-red-200' },
      medium: { label: '中', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      low: { label: '低', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    }

    const statusLabels: Record<string, { label: string; color: string }> = {
      todo: { label: '待处理', color: 'bg-slate-100 text-slate-600' },
      doing: { label: '进行中', color: 'bg-sky-100 text-sky-700' },
      done: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
      cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-500' },
    }

    const typeLabels: Record<string, string> = {
      follow_up: '客户跟进',
      appointment: '预约服务',
      service_review: '服务回访',
      training: '培训学习',
      other: '其他事项',
    }

    const priorityInfo = priorityLabels[task.priority] || priorityLabels.low
    const statusInfo = statusLabels[task.status] || statusLabels.todo

    const relatedCustomer = task.customerId ? customers.find((c) => c.id === task.customerId) : null
    const relatedAppointment = task.appointmentId ? appointments.find((a) => a.id === task.appointmentId) : null

    const handleAddFollowUp = () => {
      if (!followUpText.trim()) return
      addTaskFollowUp(task.id, followUpText.trim())
      addToast({ type: 'success', title: '跟进记录已添加', description: '任务跟进记录已同步保存' })
      setFollowUpText('')
    }

    const handleCreateAppointment = () => {
      if (!relatedCustomer) return
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().slice(0, 10)
      addAppointment({
        customer: relatedCustomer.name,
        customerId: relatedCustomer.id,
        phone: relatedCustomer.phone,
        service: '生活馆体验服务',
        store: '浦东旗舰店',
        date: dateStr,
        time: '10:00',
        status: 'pending',
        avatar: relatedCustomer.avatar,
        taskId: task.id,
      })
      addToast({
        type: 'success',
        title: '预约已创建',
        description: `已为 ${relatedCustomer.name} 创建预约并关联至该任务`,
      })
    }

    const handleComplete = () => {
      completeTask(task.id)
      addToast({ type: 'success', title: '任务已完成', description: task.title })
      handleClose()
    }

    const handleCancel = () => {
      updateTask(task.id, { status: 'cancelled' })
      addToast({ type: 'info', title: '任务已取消', description: task.title })
      handleClose()
    }

    return (
      <Modal open onClose={handleClose} title="任务详情" subtitle={`任务编号 ${task.id}`} size="lg">
        <div className="space-y-5">
          {/* 顶部：标题、优先级、状态 */}
          <div className="flex items-start justify-between gap-4 p-4 bg-gradient-to-r from-violet-50 to-sky-50 rounded-xl border border-violet-100">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-slate-800">{task.title}</h3>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-md border ${priorityInfo.color}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {priorityInfo.label}优先级
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <Target className="w-8 h-8 text-violet-500 flex-shrink-0" />
          </div>

          {/* 信息区 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Clock className="w-5 h-5 text-sky-500 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">截止时间</div>
                <div className="font-medium text-slate-800 mt-0.5">{task.deadline}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <ClipboardList className="w-5 h-5 text-violet-500 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">任务类型</div>
                <div className="font-medium text-slate-800 mt-0.5">{typeLabels[task.type] || '其他事项'}</div>
              </div>
            </div>
            {relatedCustomer && (
              <button
                onClick={() => {
                  openModal('customer_detail', relatedCustomer)
                }}
                className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition text-left"
              >
                <User className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <div className="text-xs text-emerald-600">关联客户（点击查看）</div>
                  <div className="font-medium text-slate-800 mt-0.5">{relatedCustomer.name}</div>
                </div>
              </button>
            )}
            {relatedAppointment && (
              <button
                onClick={() => {
                  openModal('appointment_detail', relatedAppointment)
                }}
                className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition text-left"
              >
                <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-amber-600">关联预约（点击查看）</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {relatedAppointment.date} {relatedAppointment.time}
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* 描述区 */}
          {task.description && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4 text-slate-500" /> 任务描述
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* 新增跟进记录输入框 */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> 添加跟进记录
            </div>
            <div className="flex gap-2">
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="记录本次跟进内容、客户反馈、下次计划..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddFollowUp}
                disabled={!followUpText.trim()}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> 提交跟进
              </button>
            </div>
          </div>

          {/* 跟进记录时间线 */}
          <div>
            <div className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-violet-600" /> 跟进记录时间线
            </div>
            {task.followUpRecords && task.followUpRecords.length > 0 ? (
              <div className="relative pl-8">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-500 via-sky-500 to-slate-200" />
                {task.followUpRecords.map((record, idx) => (
                  <div key={idx} className="relative pb-5 last:pb-0">
                    <div className="absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white bg-gradient-to-br from-violet-500 to-sky-500">
                      <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                    <div className="ml-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {record.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{record.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无跟进记录</p>
              </div>
            )}
          </div>

          {/* 底部操作区 */}
          {task.status !== 'done' && task.status !== 'cancelled' && (
            <div className="pt-4 border-t border-slate-200 grid gap-2 grid-cols-2 md:grid-cols-3">
              {task.customerId && !task.appointmentId && (
                <button
                  onClick={handleCreateAppointment}
                  className="py-3 font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> 为该客户预约服务
                </button>
              )}
              <button
                onClick={handleComplete}
                className="py-3 font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> 标记完成
              </button>
              <button
                onClick={handleCancel}
                className="py-3 font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> 取消任务
              </button>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  if (modal.type === 'account_settings') {
    return <AccountModal onClose={handleClose} />
  }

  return null
}
