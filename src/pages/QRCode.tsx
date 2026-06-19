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
} from 'lucide-react'
import { useBusinessStore } from '@/store/business'

export default function QRCodePage() {
  const { addToast, addShareTrack } = useBusinessStore()
  const [qrStyle, setQrStyle] = useState<'minimal' | 'business' | 'guochao' | 'fresh'>('business')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

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

  return (
    <div className="space-y-6">
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
              {[
                { region: '上海市 · 浦东新区', time: '5 分钟前', device: 'iPhone 15 Pro', converted: true },
                { region: '江苏省 · 苏州市', time: '28 分钟前', device: '华为 Mate 60', converted: true },
                { region: '浙江省 · 杭州市', time: '1 小时前', device: '小米 14', converted: false },
                { region: '上海市 · 徐汇区', time: '2 小时前', device: 'iPhone 14', converted: true },
                { region: '北京市 · 朝阳区', time: '3 小时前', device: 'OPPO Find X7', converted: false },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{r.region}</div>
                    <div className="text-xs text-slate-500">
                      {r.device} · {r.time}
                    </div>
                  </div>
                  {r.converted ? (
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
    </div>
  )
}
