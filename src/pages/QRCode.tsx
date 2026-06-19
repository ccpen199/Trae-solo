import { useState } from 'react'
import {
  QrCode,
  Share2,
  Download,
  Copy,
  Smartphone,
  UserPlus,
  Eye,
  RefreshCw,
  Check,
  Link,
  MessageCircle,
  Mail,
  Users,
  ListTodo,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  BarChart3,
  FileCheck,
  UserCheck,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from 'lucide-react'
import { useBusinessStore, QrScanRecord, Customer } from '@/store/business'

type TabKey = 'records' | 'spread' | 'compliance'

export default function QRCodePage() {
  const {
    addToast,
    addShareTrack,
    qrScanRecords,
    customers,
    shareTracks,
    bindScanToCustomer,
    addCustomer,
    openModal,
  } = useBusinessStore()
  const [qrStyle, setQrStyle] = useState<'minimal' | 'business' | 'guochao' | 'fresh'>('business')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('records')
  const [bindingScanId, setBindingScanId] = useState<string | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', region: '' })

  const shareLink = 'https://health.example.com/s/DS001-LM8888'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    addToast({ type: 'success', title: '链接已复制', description: '推广链接已复制到剪贴板' })
  }

  const handleDownload = () => {
    addToast({ type: 'success', title: '下载成功', description: '二维码图片已保存到本地' })
  }

  const handleSaveToAlbum = () => {
    addToast({ type: 'success', title: '已保存到相册', description: '二维码图片已保存至手机相册' })
  }

  const handleRegenerate = () => {
    setRegenerating(true)
    setTimeout(() => setRegenerating(false), 1200)
  }

  const handleStyleChange = (style: typeof qrStyle, label: string) => {
    setQrStyle(style)
    addToast({ type: 'success', title: '风格已切换', description: `已切换至${label}` })
  }

  const handleShareChannel = (channel: string) => {
    addToast({ type: 'success', title: '分享已就绪', description: '正在跳转分享渠道...' })
    addShareTrack({ materialId: 'QR001', materialTitle: '个人展业码', views: 0, clicks: 0, conversions: 0, channel })
  }

  const handleStatClick = (label: string, value: string) => {
    addToast({ type: 'success', title: `${label}明细`, description: `${label}：${value}，数据实时更新中` })
  }

  const handleBindExisting = (scanId: string, customer: Customer) => {
    bindScanToCustomer(scanId, customer.id, customer.name)
    addToast({ type: 'success', title: '绑定成功', description: `已将扫码记录绑定到客户 ${customer.name}` })
    setBindingScanId(null)
  }

  const handleAddAndBind = (scanId: string) => {
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      addToast({ type: 'error', title: '信息不完整', description: '请填写客户姓名和手机号' })
      return
    }
    const newCustomer = addCustomer({
      name: newCustomerForm.name,
      avatar: newCustomerForm.name.charAt(0),
      phone: newCustomerForm.phone.slice(0, 3) + '****' + newCustomerForm.phone.slice(7),
      level: '新客户',
      tag: '潜在客户',
      totalAmount: 0,
      orderCount: 0,
      lastContact: '刚刚',
      status: 'new',
      registerDate: new Date().toISOString().slice(0, 10),
      region: newCustomerForm.region || '待完善',
      healthConcerns: [],
      source: '展业码扫码',
    })
    bindScanToCustomer(scanId, newCustomer.id, newCustomer.name)
    addToast({ type: 'success', title: '绑定成功', description: `已创建新客户 ${newCustomer.name} 并绑定扫码记录` })
    setShowAddCustomer(false)
    setBindingScanId(null)
    setNewCustomerForm({ name: '', phone: '', region: '' })
  }

  const handleScanDetailClick = (record: QrScanRecord) => {
    openModal('qr_detail', record)
  }

  const stats = [
    { label: '扫码次数', value: '1,286', icon: Eye, color: 'from-emerald-500 to-teal-600' },
    { label: '新增客户', value: '142', icon: UserPlus, color: 'from-sky-500 to-blue-600' },
    { label: '产生订单', value: '89', icon: Smartphone, color: 'from-violet-500 to-purple-600' },
    { label: '转化率', value: '11.0%', icon: Check, color: 'from-amber-500 to-orange-500' },
  ]

  const qrStyles = [
    { key: 'minimal', label: '简约风' },
    { key: 'business', label: '商务风' },
    { key: 'guochao', label: '国潮风' },
    { key: 'fresh', label: '清新风' },
  ]

  const channelData = [
    { name: '微信朋友圈', count: 486, color: 'from-emerald-400 to-teal-500' },
    { name: '微信好友', count: 312, color: 'from-sky-400 to-blue-500' },
    { name: '线下海报', count: 198, color: 'from-violet-400 to-purple-500' },
    { name: '名片二维码', count: 156, color: 'from-amber-400 to-orange-500' },
    { name: '微信群转发', count: 134, color: 'from-rose-400 to-pink-500' },
  ]

  const maxChannel = Math.max(...channelData.map((c) => c.count))

  const weekTrend = [
    { day: '6/13', count: 142 },
    { day: '6/14', count: 186 },
    { day: '6/15', count: 165 },
    { day: '6/16', count: 213 },
    { day: '6/17', count: 198 },
    { day: '6/18', count: 245 },
    { day: '6/19', count: 137 },
  ]

  const maxWeek = Math.max(...weekTrend.map((w) => w.count))

  const complianceChecks = [
    { time: '2026-06-19 08:32', content: '分享图文「国珍松花粉功效介绍」', passed: true },
    { time: '2026-06-18 20:15', content: '分享海报「夏季养生方案」', passed: true },
    { time: '2026-06-18 15:44', content: '群发消息「本月促销活动」', passed: true },
    { time: '2026-06-17 11:08', content: '转发链接「健康讲座直播」', passed: false, note: '含疑似夸大宣传词「根治」' },
    { time: '2026-06-17 09:22', content: '分享图文「产品对比评测」', passed: true },
    { time: '2026-06-16 18:30', content: '群发言「客户见证案例」', passed: true },
    { time: '2026-06-16 14:15', content: '分享海报「会员招募」', passed: true },
    { time: '2026-06-15 10:05', content: '朋友圈转发「公司介绍」', passed: true },
    { time: '2026-06-14 19:42', content: '私聊客户「产品推荐」', passed: true },
    { time: '2026-06-14 11:20', content: '分享图文「体质养生指南」', passed: true },
  ]

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <QrCode className="w-7 h-7 text-emerald-600" />
          我的展业码
        </h1>
        <p className="text-slate-500 text-sm mt-1">专属二维码动态生成 · 客户扫码即绑定归属关系</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-lg">二维码样式</h3>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                重新生成
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {qrStyles.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStyleChange(s.key as typeof qrStyle, s.label)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    qrStyle === s.key
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl p-12 flex items-center justify-center border border-slate-100">
              <div className="relative">
                {qrStyle === 'business' && (
                  <div className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-200" />
                )}
                {qrStyle === 'guochao' && (
                  <div className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-3xl bg-gradient-to-br from-red-500/10 to-amber-500/10 border-2 border-red-200" />
                )}
                {qrStyle === 'fresh' && (
                  <div className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-3xl bg-gradient-to-br from-green-300/10 to-cyan-300/10 border-2 border-green-200" />
                )}
                <div className="relative bg-white p-6 rounded-2xl shadow-xl">
                  <div className="w-56 h-56 grid grid-cols-16 gap-0.5" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                    {Array.from({ length: 256 }).map((_, i) => {
                      const row = Math.floor(i / 16)
                      const col = i % 16
                      const isCorner =
                        (row < 4 && col < 4) ||
                        (row < 4 && col >= 12) ||
                        (row >= 12 && col < 4)
                      const isFinderCorner =
                        (row === 0 || row === 3 || (row >= 1 && row <= 2 && (col === 0 || col === 3))) &&
                        col < 4
                      const isFinderCorner2 =
                        (row === 0 || row === 3 || (row >= 1 && row <= 2 && (col === 12 || col === 15))) &&
                        col >= 12
                      const isFinderCorner3 =
                        (row === 12 || row === 15 || (row >= 13 && row <= 14 && (col === 0 || col === 3))) &&
                        col < 4
                      const shouldFill = isCorner || Math.random() > 0.55
                      const isFinderBorder = isFinderCorner || isFinderCorner2 || isFinderCorner3
                      let colorClass = 'bg-gradient-to-br from-emerald-600 to-teal-700'
                      if (qrStyle === 'minimal') colorClass = 'bg-slate-800'
                      if (qrStyle === 'guochao') colorClass = 'bg-gradient-to-br from-red-600 to-amber-600'
                      if (qrStyle === 'fresh') colorClass = 'bg-gradient-to-br from-green-500 to-cyan-500'
                      return (
                        <div
                          key={i}
                          className={`${
                            shouldFill || isFinderBorder
                              ? colorClass
                              : 'bg-transparent'
                          } rounded-[1px]`}
                        />
                      )
                    })}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      qrStyle === 'guochao'
                        ? 'bg-gradient-to-br from-red-500 to-amber-600'
                        : qrStyle === 'fresh'
                        ? 'bg-gradient-to-br from-green-500 to-cyan-600'
                        : qrStyle === 'minimal'
                        ? 'bg-slate-800'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      <span className="text-white font-bold text-sm">国珍</span>
                    </div>
                  </div>
                </div>
              </div>

              {regenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <div className="text-lg font-bold text-slate-800">李明 专属展业码</div>
              <div className="text-sm text-slate-500 mt-1">编号 DS001 · 高级经销商</div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">推广链接</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 font-mono overflow-x-auto">
                  {shareLink}
                </code>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制链接
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:shadow-lg transition"
                >
                  <Download className="w-4 h-4" />
                  下载二维码
                </button>
                <button
                  onClick={handleSaveToAlbum}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:shadow-lg transition"
                >
                  <Smartphone className="w-4 h-4" />
                  保存到相册
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-slate-700 mb-3">分享到</div>
              <div className="flex gap-3">
                {[
                  { icon: MessageCircle, label: '微信', color: 'from-green-500 to-emerald-600', channel: '微信' },
                  { icon: Users, label: '朋友圈', color: 'from-sky-500 to-blue-600', channel: '朋友圈' },
                  { icon: Share2, label: 'QQ', color: 'from-indigo-500 to-blue-700', channel: 'QQ' },
                  { icon: Mail, label: '微博', color: 'from-red-500 to-rose-600', channel: '微博' },
                  { icon: Link, label: '复制链接', color: 'from-slate-500 to-slate-600', channel: '复制链接' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleShareChannel(item.channel)}
                      className={`flex-1 py-3 bg-gradient-to-r ${item.color} text-white rounded-xl font-medium text-sm flex flex-col items-center gap-1 hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 grid-cols-2">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  onClick={() => handleStatClick(s.label, s.value)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 cursor-pointer hover:shadow-lg transition"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg mb-3`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              最近扫码记录
              <button className="text-sm font-normal text-emerald-600 hover:text-emerald-700">
                查看全部
              </button>
            </h3>
            <div className="space-y-3">
              {qrScanRecords.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleScanDetailClick(r)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{r.viewerLocation}</div>
                    <div className="text-xs text-slate-500">
                      {r.channel} · {r.scanTime}
                    </div>
                  </div>
                  {r.registered ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                      已注册
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                      浏览中
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-amber-800">合规展业提示</div>
                <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                  展业码仅限合规渠道传播，请勿发送敏感话术或夸大宣传。系统已接入 AI 风控审核，请规范使用。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================ 底部 Tab 区域 ================ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {[
            { key: 'records' as TabKey, label: '扫码记录', icon: ListTodo },
            { key: 'spread' as TabKey, label: '传播效果', icon: TrendingUp },
            { key: 'compliance' as TabKey, label: '合规风控复查', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key)
                  addToast({ type: 'info', title: '切换视图', description: `已切换到${t.label}` })
                }}
                className={`flex-1 py-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  activeTab === t.key
                    ? 'text-emerald-600 bg-white border-b-2 border-emerald-500 -mb-px'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-6">
          {/* ========== Tab 1: 扫码记录 ========== */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">扫码记录详情</h3>
                <span className="text-sm text-slate-500">共 {qrScanRecords.length} 条记录</span>
              </div>

              <div className="space-y-3">
                {qrScanRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`rounded-xl border p-4 transition ${
                      !record.compliancePassed
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {record.viewerLocation || '未知地点'}
                          </span>
                          {!record.compliancePassed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              合规异常
                            </span>
                          )}
                          {record.registered ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                              已注册
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                              未注册
                            </span>
                          )}
                          {record.customerName && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700 rounded-full border border-sky-200">
                              绑定：{record.customerName}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {record.scanTime}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Share2 className="w-3 h-3" />
                            渠道：{record.channel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className={`w-3 h-3 ${record.compliancePassed ? 'text-emerald-500' : 'text-red-500'}`} />
                            合规：{record.compliancePassed ? '通过' : '未通过'}
                          </span>
                        </div>
                        {!record.compliancePassed && record.riskNote && (
                          <div className="mt-2 p-2.5 bg-red-100/50 rounded-lg text-xs text-red-700 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            {record.riskNote}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleScanDetailClick(record)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          详情
                        </button>
                        {!record.registered && (
                          <>
                            {bindingScanId !== record.id && (
                              <button
                                onClick={() => {
                                  setBindingScanId(record.id)
                                  setShowAddCustomer(false)
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-md rounded-lg transition flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                绑定客户
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {bindingScanId === record.id && !record.registered && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-700">选择绑定方式</span>
                          <button
                            onClick={() => setBindingScanId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setShowAddCustomer(false)}
                            className={`px-4 py-2 text-xs font-medium rounded-lg transition ${
                              !showAddCustomer
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            绑定已有客户
                          </button>
                          <button
                            onClick={() => setShowAddCustomer(true)}
                            className={`px-4 py-2 text-xs font-medium rounded-lg transition ${
                              showAddCustomer
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            新增客户并绑定
                          </button>
                        </div>

                        {!showAddCustomer ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {customers.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                    {c.avatar}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-800">{c.name}</div>
                                    <div className="text-xs text-slate-500">{c.phone} · {c.tag}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleBindExisting(record.id, c)}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition"
                                >
                                  绑定
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">客户姓名 *</label>
                                <input
                                  value={newCustomerForm.name}
                                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                  placeholder="请输入姓名"
                                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">手机号 *</label>
                                <input
                                  value={newCustomerForm.phone}
                                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                  placeholder="请输入手机号"
                                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">所在地区</label>
                              <input
                                value={newCustomerForm.region}
                                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, region: e.target.value })}
                                placeholder="如：上海市浦东新区"
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <button
                              onClick={() => handleAddAndBind(record.id)}
                              className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:shadow-md transition"
                            >
                              创建客户并绑定
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== Tab 2: 传播效果 ========== */}
          {activeTab === 'spread' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4">传播数据概览</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '总扫码', value: '1,286', icon: Eye, color: 'from-emerald-500 to-teal-600' },
                    { label: '注册转化', value: '142', icon: UserPlus, color: 'from-sky-500 to-blue-600' },
                    { label: '订单转化', value: '89', icon: ShoppingBag, color: 'from-violet-500 to-purple-600' },
                    { label: '转化率', value: '11.0%', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
                  ].map((s) => {
                    const Icon = s.icon
                    return (
                      <div
                        key={s.label}
                        onClick={() => addToast({ type: 'success', title: `${s.label}详情`, description: `${s.label}：${s.value}，数据每日凌晨同步更新` })}
                        className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-xl font-bold text-slate-800">{s.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  渠道分布
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                  {channelData.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => addToast({ type: 'info', title: c.name, description: `该渠道累计扫码 ${c.count} 次，占比 ${((c.count / maxChannel) * 100).toFixed(1)}%` })}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-700 font-medium">{c.name}</span>
                        <span className="text-slate-500">{c.count} 次</span>
                      </div>
                      <div className="h-6 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full bg-gradient-to-r ${c.color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                          style={{ width: `${(c.count / maxChannel) * 100}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">
                            {((c.count / channelData.reduce((a, b) => a + b.count, 0)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-600" />
                  最近 7 天扫码趋势
                </h3>
                <div className="bg-slate-50 rounded-xl p-5">
                  <div className="flex items-end justify-between gap-2 h-40">
                    {weekTrend.map((w) => (
                      <div
                        key={w.day}
                        onClick={() => addToast({ type: 'info', title: w.day, description: `当日扫码 ${w.count} 次` })}
                        className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <div className="text-xs font-medium text-slate-600 group-hover:text-emerald-600 transition">
                          {w.count}
                        </div>
                        <div className="w-full bg-white rounded-t-lg border border-slate-200 overflow-hidden flex-1 flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:from-emerald-600 group-hover:to-teal-500"
                            style={{ height: `${(w.count / maxWeek) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500">{w.day}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-violet-600" />
                    分享传播记录
                  </span>
                  <span className="text-sm font-normal text-slate-500">共 {shareTracks.length} 条</span>
                </h3>
                {shareTracks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl">
                    <Share2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">暂无分享记录，点击上方分享按钮开始传播</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shareTracks.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => addToast({ type: 'info', title: s.materialTitle, description: `分享时间：${s.shareTime} · 渠道：${s.channel} · 浏览 ${s.views} · 点击 ${s.clicks} · 转化 ${s.conversions}` })}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:border hover:border-emerald-200 hover:shadow-sm cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{s.materialTitle}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{s.shareTime} · {s.channel}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-700">{s.views}</div>
                            <div className="text-[10px] text-slate-400">浏览</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-sky-600">{s.clicks}</div>
                            <div className="text-[10px] text-slate-400">点击</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-emerald-600">{s.conversions}</div>
                            <div className="text-[10px] text-slate-400">转化</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== Tab 3: 合规风控复查 ========== */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4">合规风控总览</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div
                    onClick={() => addToast({ type: 'success', title: '地理围栏状态', description: '当前活动区域：上海市（合规区域），最近 30 天扫码 95% 位于合规范围' })}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold text-emerald-800">地理围栏正常</div>
                    <div className="text-sm text-emerald-700 mt-1">当前区域合规 ✓</div>
                    <div className="text-xs text-emerald-600/80 mt-2">活动区域：上海市</div>
                  </div>

                  <div
                    onClick={() => addToast({ type: 'success', title: '话术合规评分', description: '近 30 天话术合规评分：92 分，优秀水平。历史记录：最高 96 分，最低 85 分' })}
                    className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-5 border border-sky-200 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-sky-600">92</div>
                    </div>
                    <div className="text-lg font-bold text-sky-800">话术合规评分</div>
                    <div className="text-sm text-sky-700 mt-1">近 30 天综合评分</div>
                    <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
                    </div>
                  </div>

                  <div
                    onClick={() => addToast({ type: 'warning', title: '敏感内容检测', description: '最近 10 次分享：9 次通过，1 次检测异常（含疑似夸大宣传词「根治」），已自动打标待复核' })}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-lg font-bold text-amber-800">敏感内容检测</div>
                    <div className="text-sm text-amber-700 mt-1">最近 10 次分享：9/10 通过</div>
                    <div className="text-xs text-amber-600/80 mt-2">⚠️ 1 条待人工复核</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  最近 10 次分享合规检测记录
                </h3>
                <div className="space-y-2">
                  {complianceChecks.map((check, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        addToast({
                          type: check.passed ? 'success' : 'warning',
                          title: check.passed ? '合规检测通过' : '合规检测异常',
                          description: `${check.time}\n内容：${check.content}${check.note ? '\n备注：' + check.note : ''}`,
                        })
                      }
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition hover:shadow-sm ${
                        check.passed
                          ? 'bg-white border-slate-200 hover:border-emerald-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          check.passed ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {check.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-medium truncate ${check.passed ? 'text-slate-800' : 'text-red-800'}`}>
                            {check.content}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{check.time}</div>
                          {check.note && (
                            <div className="text-xs text-red-600 mt-1">⚠️ {check.note}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-violet-800">合规风控保障</div>
                    <p className="text-sm text-violet-700 mt-1 leading-relaxed">
                      系统已接入多层合规风控体系：AI 话术检测、地理围栏验证、敏感词实时拦截、传播链路溯源。
                      所有展业行为自动上链存证，确保合规可追溯。
                    </p>
                    <button
                      onClick={() => addToast({ type: 'info', title: '合规培训', description: '正在跳转到合规培训中心，请认真学习展业规范' })}
                      className="mt-3 px-4 py-2 text-sm font-medium bg-white text-violet-700 rounded-lg hover:bg-violet-100 transition border border-violet-200"
                    >
                      查看合规培训资料
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
