import { useState } from 'react'
import { QrCode, Download, Share2, User, Package, Calendar, BarChart3, Eye, ScanLine } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { dealerProfile } from '@/data/mockData'

const qrTypes = [
  { key: 'personal', label: '个人二维码', icon: <User size={18} />, desc: '展厅个人主页' },
  { key: 'product', label: '产品二维码', icon: <Package size={18} />, desc: '产品详情页面' },
  { key: 'activity', label: '活动二维码', icon: <Calendar size={18} />, desc: '活动报名页面' },
]

const qrStyles = [
  { key: 'default', label: '默认样式', desc: '标准黑白二维码' },
  { key: 'brand', label: '品牌样式', desc: '品牌色主题二维码' },
  { key: 'minimal', label: '极简样式', desc: '简约线条风格' },
]

const usageStats = [
  { label: '今日扫描', value: 28, change: 12 },
  { label: '本周扫描', value: 156, change: 8 },
  { label: '累计扫描', value: 4820, change: 15 },
  { label: '转化率', value: '3.1%', change: 2 },
]

export default function QRCodePage() {
  const [selectedType, setSelectedType] = useState('personal')
  const [selectedStyle, setSelectedStyle] = useState('default')

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="二维码中心" subtitle="生成和管理各类营销二维码" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">二维码类型</h3>
            <div className="space-y-3">
              {qrTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedType === type.key
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedType === type.key ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {type.icon}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${selectedType === type.key ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-400">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">二维码样式</h3>
            <div className="space-y-3">
              {qrStyles.map((style) => (
                <button
                  key={style.key}
                  onClick={() => setSelectedStyle(style.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                    selectedStyle === style.key
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-sm font-medium ${selectedStyle === style.key ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {style.label}
                    </p>
                    <p className="text-xs text-gray-400">{style.desc}</p>
                  </div>
                  <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                    selectedStyle === style.key ? 'border-emerald-500 bg-emerald-100' : 'border-gray-200'
                  }`}>
                    {selectedStyle === style.key && <div className="w-3 h-3 rounded-sm bg-emerald-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">二维码预览</h3>
            <div className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 border-dashed ${
              selectedStyle === 'brand' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300' :
              selectedStyle === 'minimal' ? 'bg-gray-50 border-gray-300' :
              'bg-white border-gray-200'
            }`}>
              <QrCode size={120} className={`${
                selectedStyle === 'brand' ? 'text-emerald-600' :
                selectedStyle === 'minimal' ? 'text-gray-700' :
                'text-gray-800'
              }`} />
              <p className="mt-4 text-sm text-gray-500">
                {qrTypes.find(t => t.key === selectedType)?.label}
              </p>
              <p className="text-xs text-gray-400 mt-1">{dealerProfile.name} · {dealerProfile.region}</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                <Download size={16} />
                下载
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Share2 size={16} />
                分享
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-emerald-600" />
              <h3 className="font-semibold text-gray-900">使用统计</h3>
            </div>
            <div className="space-y-4">
              {usageStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
                    <span className="text-xs text-emerald-600">+{stat.change}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">最近使用</h3>
            <div className="space-y-3">
              {[
                { name: '个人展厅二维码', time: '今天 14:32', scans: 8 },
                { name: '松花粉片产品码', time: '今天 10:15', scans: 15 },
                { name: '健康讲座活动码', time: '昨天 16:45', scans: 22 },
                { name: '个人展厅二维码', time: '昨天 09:20', scans: 5 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ScanLine size={14} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{item.scans}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
