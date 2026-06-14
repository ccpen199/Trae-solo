import { useState } from 'react'
import { mockDesignVersions } from '@/store/platformStore'
import {
  Upload,
  FileText,
  Image,
  PenTool,
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
} from 'lucide-react'

const typeIcons: Record<string, typeof FileText> = {
  CAD: FileText,
  效果图: Image,
  施工图: PenTool,
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  已通过: { color: 'badge-accent', icon: CheckCircle2 },
  审核中: { color: 'badge-brand', icon: Clock },
  待修改: { color: 'badge-warn', icon: AlertCircle },
}

const annotations = [
  { id: 'a1', x: 25, y: 30, text: '客厅开间建议扩大到4.2m', author: '陈先生', time: '2026-06-02' },
  { id: 'a2', x: 65, y: 55, text: '阳台推拉门改折叠门', author: '陈先生', time: '2026-06-03' },
  { id: 'a3', x: 40, y: 70, text: '厨房操作台需加长30cm', author: '李设计师', time: '2026-06-04' },
  { id: 'a4', x: 80, y: 20, text: '主卧飘窗改为落地窗', author: '陈先生', time: '2026-06-05' },
]

export default function Design() {
  const [activeTab, setActiveTab] = useState<'versions' | 'annotate' | 'compare'>('versions')
  const [selectedVersion, setSelectedVersion] = useState(mockDesignVersions[0].id)
  const [compareA, setCompareA] = useState('v1')
  const [compareB, setCompareB] = useState('v3')
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  const currentVersion = mockDesignVersions.find((v) => v.id === selectedVersion)

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">设计协作</h1>
          <p className="mt-1 text-surface-500">设计师上传CAD+效果图，业主批注/投票/版本对比</p>
        </div>
        <button className="btn-primary">
          <Upload size={16} className="mr-1.5" /> 上传方案
        </button>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
        {[
          { key: 'versions', label: '版本管理' },
          { key: 'annotate', label: '在线批注' },
          { key: 'compare', label: '版本对比' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-brand-600 shadow-sm dark:bg-surface-700 dark:text-brand-400'
                : 'text-surface-600 hover:text-surface-900 dark:text-surface-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'versions' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
                  <div className="flex items-center gap-2">
                    {currentVersion && (() => {
                      const Icon = typeIcons[currentVersion.type] || FileText
                      return <Icon size={16} className="text-brand-500" />
                    })()}
                    <span className="font-medium text-surface-900 dark:text-white">
                      {currentVersion?.name}
                    </span>
                    {currentVersion && (() => {
                      const sc = statusConfig[currentVersion.status]
                      const StatusIcon = sc.icon
                      return (
                        <span className={sc.color}>
                          <StatusIcon size={10} className="mr-1 inline" />
                          {currentVersion.status}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="btn-secondary p-1.5">
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-xs text-surface-500 w-12 text-center">{zoom}%</span>
                    <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="btn-secondary p-1.5">
                      <ZoomIn size={14} />
                    </button>
                    <button className="btn-secondary p-1.5">
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center justify-center bg-surface-50 p-8 dark:bg-surface-900" style={{ minHeight: 400 }}>
                  <div
                    className="relative bg-white dark:bg-surface-800 shadow-lg transition-transform"
                    style={{ transform: `scale(${zoom / 100})`, width: 600, height: 400 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800">
                      <div className="absolute left-[10%] top-[10%] h-[35%] w-[40%] rounded border-2 border-dashed border-brand-300 dark:border-brand-600 flex items-center justify-center">
                        <span className="text-xs text-brand-500">客厅</span>
                      </div>
                      <div className="absolute left-[55%] top-[10%] h-[35%] w-[35%] rounded border-2 border-dashed border-purple-300 dark:border-purple-600 flex items-center justify-center">
                        <span className="text-xs text-purple-500">主卧</span>
                      </div>
                      <div className="absolute left-[10%] top-[50%] h-[40%] w-[25%] rounded border-2 border-dashed border-accent-300 dark:border-accent-600 flex items-center justify-center">
                        <span className="text-xs text-accent-500">厨房</span>
                      </div>
                      <div className="absolute left-[40%] top-[50%] h-[40%] w-[25%] rounded border-2 border-dashed border-warn-300 dark:border-warn-600 flex items-center justify-center">
                        <span className="text-xs text-warn-500">次卧</span>
                      </div>
                      <div className="absolute left-[70%] top-[50%] h-[40%] w-[20%] rounded border-2 border-dashed border-rose-300 dark:border-rose-600 flex items-center justify-center">
                        <span className="text-xs text-rose-500">卫生间</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[10px] text-surface-400">
                      {currentVersion?.name} · {currentVersion?.uploadedBy} · {currentVersion?.uploadedAt}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-surface-900 dark:text-white">版本列表</h3>
              <div className="space-y-2">
                {mockDesignVersions.map((v) => {
                  const Icon = typeIcons[v.type] || FileText
                  const sc = statusConfig[v.status]
                  const StatusIcon = sc.icon
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVersion(v.id)}
                      className={`card cursor-pointer p-3 transition-all ${
                        selectedVersion === v.id ? 'ring-2 ring-brand-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className="text-brand-500" />
                        <span className="flex-1 text-sm font-medium text-surface-900 dark:text-white truncate">{v.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-surface-500">
                        <span className={sc.color}>
                          <StatusIcon size={10} className="mr-0.5 inline" />{v.status}
                        </span>
                        <span>{v.uploadedBy}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
                        <span className="flex items-center gap-0.5"><MessageSquare size={10} /> {v.annotations}</span>
                        <span className="flex items-center gap-0.5"><ThumbsUp size={10} /> {v.votes}</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {v.uploadedAt}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'annotate' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
                  <div className="flex items-center gap-2">
                    <MousePointer size={16} className="text-brand-500" />
                    <span className="font-medium text-surface-900 dark:text-white">批注模式</span>
                    <span className="badge-brand">点击图纸添加批注</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="btn-secondary p-1.5">
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-xs text-surface-500 w-12 text-center">{zoom}%</span>
                    <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="btn-secondary p-1.5">
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center justify-center bg-surface-50 p-8 dark:bg-surface-900" style={{ minHeight: 400 }}>
                  <div
                    className="relative bg-white dark:bg-surface-800 shadow-lg transition-transform cursor-crosshair"
                    style={{ transform: `scale(${zoom / 100})`, width: 600, height: 400 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800">
                      <div className="absolute left-[10%] top-[10%] h-[35%] w-[40%] rounded border-2 border-dashed border-brand-300 dark:border-brand-600 flex items-center justify-center">
                        <span className="text-xs text-brand-500">客厅</span>
                      </div>
                      <div className="absolute left-[55%] top-[10%] h-[35%] w-[35%] rounded border-2 border-dashed border-purple-300 dark:border-purple-600 flex items-center justify-center">
                        <span className="text-xs text-purple-500">主卧</span>
                      </div>
                      <div className="absolute left-[10%] top-[50%] h-[40%] w-[25%] rounded border-2 border-dashed border-accent-300 dark:border-accent-600 flex items-center justify-center">
                        <span className="text-xs text-accent-500">厨房</span>
                      </div>
                      <div className="absolute left-[40%] top-[50%] h-[40%] w-[25%] rounded border-2 border-dashed border-warn-300 dark:border-warn-600 flex items-center justify-center">
                        <span className="text-xs text-warn-500">次卧</span>
                      </div>
                      <div className="absolute left-[70%] top-[50%] h-[40%] w-[20%] rounded border-2 border-dashed border-rose-300 dark:border-rose-600 flex items-center justify-center">
                        <span className="text-xs text-rose-500">卫生间</span>
                      </div>
                    </div>

                    {annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="absolute"
                        style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                        onMouseEnter={() => setHoveredAnnotation(ann.id)}
                        onMouseLeave={() => setHoveredAnnotation(null)}
                      >
                        <div className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          {ann.id.replace('a', '')}
                        </div>
                        {hoveredAnnotation === ann.id && (
                          <div className="absolute left-4 top-0 z-10 w-52 rounded-lg bg-white p-3 shadow-xl dark:bg-surface-700 border border-surface-200 dark:border-surface-600">
                            <p className="text-xs text-surface-700 dark:text-surface-300">{ann.text}</p>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-surface-400">
                              <span>{ann.author}</span>
                              <span>{ann.time}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-surface-900 dark:text-white">批注列表</h3>
              <div className="space-y-2">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="card p-3 cursor-pointer"
                    onMouseEnter={() => setHoveredAnnotation(ann.id)}
                    onMouseLeave={() => setHoveredAnnotation(null)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold dark:bg-brand-900/30 dark:text-brand-400">
                        {ann.id.replace('a', '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-700 dark:text-surface-300">{ann.text}</p>
                        <div className="mt-1 flex items-center justify-between text-xs text-surface-400">
                          <span>{ann.author}</span>
                          <span>{ann.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h3 className="mb-3 font-semibold text-surface-900 dark:text-white">投票</h3>
                <div className="card p-4">
                  <p className="text-sm text-surface-700 dark:text-surface-300 mb-3">选择您偏好的设计方案</p>
                  <div className="space-y-2">
                    {[
                      { name: '方案A - 开放式布局', votes: 8, pct: 62 },
                      { name: '方案B - 独立分区', votes: 5, pct: 38 },
                    ].map((opt) => (
                      <div key={opt.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-surface-700 dark:text-surface-300">{opt.name}</span>
                          <span className="text-surface-500">{opt.votes}票 ({opt.pct}%)</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: `${opt.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-600 dark:text-surface-400">方案A:</span>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="input-field w-48"
              >
                {mockDesignVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <RefreshCw size={16} className="text-surface-400 cursor-pointer" onClick={() => { setCompareA(compareB); setCompareB(compareA); }} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-600 dark:text-surface-400">方案B:</span>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="input-field w-48"
              >
                {mockDesignVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[compareA, compareB].map((vid, i) => {
              const v = mockDesignVersions.find((x) => x.id === vid)
              if (!v) return null
              const Icon = typeIcons[v.type] || FileText
              return (
                <div key={vid} className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-brand-600' : 'bg-purple-600'}`}>
                        {i === 0 ? 'A' : 'B'}
                      </span>
                      <Icon size={14} className="text-brand-500" />
                      <span className="font-medium text-surface-900 dark:text-white">{v.name}</span>
                    </div>
                    <span className={statusConfig[v.status].color}>{v.status}</span>
                  </div>
                  <div className="flex items-center justify-center bg-surface-50 p-8 dark:bg-surface-900" style={{ minHeight: 300 }}>
                    <div className="bg-white dark:bg-surface-800 shadow-lg" style={{ width: 400, height: 280 }}>
                      <div className="h-full bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-700 dark:to-surface-800 p-4">
                        <div className="grid grid-cols-2 gap-2 h-full">
                          <div className="rounded border-2 border-dashed border-brand-300 dark:border-brand-600 flex items-center justify-center">
                            <span className="text-[10px] text-brand-500">客厅</span>
                          </div>
                          <div className="rounded border-2 border-dashed border-purple-300 dark:border-purple-600 flex items-center justify-center">
                            <span className="text-[10px] text-purple-500">{i === 0 ? '主卧' : '书房'}</span>
                          </div>
                          <div className="rounded border-2 border-dashed border-accent-300 dark:border-accent-600 flex items-center justify-center">
                            <span className="text-[10px] text-accent-500">厨房</span>
                          </div>
                          <div className="rounded border-2 border-dashed border-warn-300 dark:border-warn-600 flex items-center justify-center">
                            <span className="text-[10px] text-warn-500">{i === 0 ? '次卧' : '儿童房'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-surface-200 px-4 py-3 dark:border-surface-700">
                    <div className="flex items-center justify-between text-sm text-surface-500">
                      <span>{v.uploadedBy} · {v.uploadedAt}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-0.5"><MessageSquare size={12} /> {v.annotations}</span>
                        <span className="flex items-center gap-0.5"><ThumbsUp size={12} /> {v.votes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 card p-5">
            <h3 className="mb-4 font-semibold text-surface-900 dark:text-white">对比摘要</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="pb-2 text-left text-surface-500 font-medium">对比项</th>
                    <th className="pb-2 text-left text-brand-600 dark:text-brand-400 font-medium">方案A</th>
                    <th className="pb-2 text-left text-purple-600 dark:text-purple-400 font-medium">方案B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  {[
                    { label: '设计类型', a: 'CAD', b: 'CAD' },
                    { label: '客厅开间', a: '4.2m', b: '3.8m' },
                    { label: '主卧面积', a: '18㎡', b: '15㎡' },
                    { label: '批注数', a: '5', b: '3' },
                    { label: '投票数', a: '8', b: '4' },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-2 text-surface-600 dark:text-surface-400">{row.label}</td>
                      <td className="py-2 text-surface-900 dark:text-white">{row.a}</td>
                      <td className="py-2 text-surface-900 dark:text-white">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
