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
  AlertTriangle,
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
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
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
            <div className="ml-auto">
              <button className="btn-primary">
                确认投票结果
              </button>
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
                  <div className="flex items-center justify-center bg-surface-50 p-6 dark:bg-surface-900" style={{ minHeight: 280 }}>
                    <div className="bg-white dark:bg-surface-800 shadow-lg" style={{ width: 380, height: 240 }}>
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
                        <span className="flex items-center gap-0.5"><MessageSquare size={12} /> {v.annotations}条批注</span>
                        <span className="flex items-center gap-0.5"><ThumbsUp size={12} /> {v.votes}票</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <MessageSquare size={16} className="text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-white">批注对比</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3 dark:bg-surface-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">A</span>
                    <span className="text-sm text-surface-700 dark:text-surface-300">方案A批注</span>
                  </div>
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {mockDesignVersions.find((v) => v.id === compareA)?.annotations}条
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3 dark:bg-surface-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">B</span>
                    <span className="text-sm text-surface-700 dark:text-surface-300">方案B批注</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {mockDesignVersions.find((v) => v.id === compareB)?.annotations}条
                  </span>
                </div>
                <div className="rounded-lg border border-warn-200 bg-warn-50 p-3 dark:border-warn-800 dark:bg-warn-900/20">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-warn-700 dark:text-warn-300">
                    <AlertTriangle size={14} />
                    新增待修改意见
                  </div>
                  <p className="mt-1 text-xs text-warn-600 dark:text-warn-400">
                    主卧落地窗设计需确认安全措施，厨房操作台面建议抬高5cm
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-900/20">
                  <ThumbsUp size={16} className="text-accent-600 dark:text-accent-400" />
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-white">投票结论</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-surface-700 dark:text-surface-300">方案A - 胜出</span>
                    <span className="font-medium text-brand-600 dark:text-brand-400">
                      {mockDesignVersions.find((v) => v.id === compareA)?.votes}票 (62%)
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                      style={{ width: '62%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-surface-700 dark:text-surface-300">方案B</span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {mockDesignVersions.find((v) => v.id === compareB)?.votes}票 (38%)
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                      style={{ width: '38%' }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-accent-200 bg-accent-50 p-3 dark:border-accent-800 dark:bg-accent-900/20">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-accent-700 dark:text-accent-300">
                    <CheckCircle2 size={14} />
                    投票已生效
                  </div>
                  <p className="mt-1 text-xs text-accent-600 dark:text-accent-400">
                    共13人参与投票，方案A以62%得票率胜出，待设计师确认后进入下一版本
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-50 dark:bg-warn-900/20">
                  <PenTool size={16} className="text-warn-600 dark:text-warn-400" />
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-white">版本流转</h3>
              </div>
              <div className="space-y-2">
                {[
                  { step: '设计提交', version: 'v1', status: 'done', date: '5/20' },
                  { step: '业主批注', version: '5条', status: 'done', date: '5/22-5/25' },
                  { step: '方案投票', version: 'A胜出', status: 'done', date: '5/28' },
                  { step: '设计师修改', version: '待修改', status: 'in_progress', date: '进行中' },
                  { step: '二次确认', version: '-', status: 'pending', date: '待启动' },
                ].map((item, i, arr) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      item.status === 'done'
                        ? 'bg-accent-500 text-white'
                        : item.status === 'in_progress'
                          ? 'bg-brand-500 text-white animate-pulse'
                          : 'bg-surface-200 text-surface-500 dark:bg-surface-700'
                    }`}>
                      {item.status === 'done' ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          item.status === 'pending'
                            ? 'text-surface-400 dark:text-surface-500'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}>
                          {item.step}
                        </span>
                        <span className="text-xs text-surface-400">{item.date}</span>
                      </div>
                      <div className="text-xs text-surface-500">{item.version}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                <button className="btn-secondary w-full text-sm">
                  <Clock size={14} className="mr-1.5" />
                  查看完整版本历史
                </button>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-warn-500" />
                待修改意见汇总
              </h3>
              <span className="badge-warn">{4}条待处理</span>
            </div>
            <div className="space-y-3">
              {[
                { id: 1, content: '主卧落地窗设计需增加安全防护栏，儿童房需考虑', priority: 'high', from: '业主-陈先生', date: '6/2' },
                { id: 2, content: '厨房操作台面建议抬高5cm，符合人体工学', priority: 'medium', from: '业主-陈先生', date: '6/3' },
                { id: 3, content: '客厅电视墙建议增加收纳空间', priority: 'low', from: '业主-陈先生', date: '6/3' },
                { id: 4, content: '阳台需预留洗衣机和烘干机双机位', priority: 'medium', from: '设计师建议', date: '6/5' },
              ].map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-warn-500' : 'bg-brand-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-surface-700 dark:text-surface-300">{item.content}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-surface-400">
                      <span>{item.from}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <button className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    标记已处理
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button className="btn-primary flex-1">
                一键同步到下版本
              </button>
              <button className="btn-outline flex-1">
                设计师回复
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-semibold text-surface-900 dark:text-white">核心参数对比</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="pb-2 text-left font-medium text-surface-500">对比项</th>
                    <th className="pb-2 text-left font-medium text-brand-600 dark:text-brand-400">方案A - {mockDesignVersions.find((v) => v.id === compareA)?.name}</th>
                    <th className="pb-2 text-left font-medium text-purple-600 dark:text-purple-400">方案B - {mockDesignVersions.find((v) => v.id === compareB)?.name}</th>
                    <th className="pb-2 text-center font-medium text-surface-500">差异</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  {[
                    { label: '设计类型', a: 'CAD平面图', b: 'CAD平面图', diff: '相同' },
                    { label: '客厅开间', a: '4.2m', b: '3.8m', diff: 'A大0.4m' },
                    { label: '主卧面积', a: '18㎡', b: '15㎡', diff: 'A大3㎡' },
                    { label: '厨房布局', a: 'U型', b: 'L型', diff: '类型不同' },
                    { label: '储物空间', a: '约8㎡', b: '约6㎡', diff: 'A多2㎡' },
                    { label: '动线长度', a: '12m', b: '15m', diff: 'A更短' },
                    { label: '业主批注数', a: '5条', b: '3条', diff: 'A多2条' },
                    { label: '投票数', a: '8票 (62%)', b: '5票 (38%)', diff: 'A胜出' },
                    { label: '当前状态', a: '已通过', b: '审核中', diff: 'A进度快' },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-surface-600 dark:text-surface-400">{row.label}</td>
                      <td className="py-2.5 text-surface-900 dark:text-white">{row.a}</td>
                      <td className="py-2.5 text-surface-900 dark:text-white">{row.b}</td>
                      <td className="py-2.5 text-center">
                        <span className={row.diff === '相同' ? 'badge-accent' : 'badge-warn'}>
                          {row.diff}
                        </span>
                      </td>
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
