import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, FileText, Building, MapPin, Phone, Calendar, Eye, AlertCircle,
  CheckCircle2, XCircle, ExternalLink, AlertTriangle, Image as ImageIcon,
  HelpCircle, CreditCard, ListChecks, Globe, CheckSquare, Square, Download,
  Printer, Share2, ChevronLeft, ChevronRight, X, BookOpen, Copy, Check
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { categoryLabels, categoryColors, subjectLabels, subjectColors } from '../data/constants'
import { MaterialItem } from '../types'

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getGuideById } = useApp()
  const guide = id ? getGuideById(id) : undefined

  const [activeTab, setActiveTab] = useState('materials')
  const [preparedMaterials, setPreparedMaterials] = useState<Set<string>>(new Set())
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const tabs = [
    { id: 'materials', label: '材料清单', icon: FileText, count: guide?.materials.length || 0 },
    { id: 'process', label: '办理流程', icon: ListChecks, count: guide?.handlingProcess.length || 0 },
    { id: 'locations', label: '办理地点', icon: MapPin, count: guide?.offlineLocations.length || 0 },
    { id: 'online', label: '线上办理', icon: Globe, count: guide?.onlineEntries.length || 0 },
    { id: 'faq', label: '常见问题', icon: HelpCircle, count: guide?.faqs.length || 0 },
  ]

  const materialImages = useMemo(() => {
    return guide?.materials.filter(m => m.exampleImage).map(m => m.exampleImage!) || []
  }, [guide])

  const preparedCount = preparedMaterials.size
  const requiredCount = guide?.materials.filter(m => m.required).length || 0
  const totalCount = guide?.materials.length || 0
  const progressPercent = totalCount > 0 ? Math.round((preparedCount / requiredCount) * 100) : 0

  const togglePrepared = (materialId: string) => {
    setPreparedMaterials(prev => {
      const next = new Set(prev)
      if (next.has(materialId)) {
        next.delete(materialId)
      } else {
        next.add(materialId)
      }
      return next
    })
  }

  const openLightbox = (image: string, index: number) => {
    setLightboxImage(image)
    setLightboxIndex(index)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (materialImages.length === 0) return
    const nextIdx = direction === 'next'
      ? (lightboxIndex + 1) % materialImages.length
      : (lightboxIndex - 1 + materialImages.length) % materialImages.length
    setLightboxIndex(nextIdx)
    setLightboxImage(materialImages[nextIdx])
  }

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!guide) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">办事指南不存在</p>
        <Link to="/" className="text-primary-600 hover:underline mt-4 inline-block">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>返回办事大厅</span>
      </Link>

      <div className="card overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`badge ${categoryColors[guide.category]}`}>
              {categoryLabels[guide.category]}
            </span>
            <span className={`badge ${subjectColors[guide.subjectType]}`}>
              {subjectLabels[guide.subjectType]}
            </span>
            <span className="badge bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              已发布 {guide.version}
            </span>
            <span className="badge bg-purple-100 text-purple-700">
              <BookOpen className="w-3 h-3 mr-1" />
              {guide.views.toLocaleString()} 次浏览
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {guide.title}
              </h1>
              <p className="text-gray-600 mb-4">{guide.description}</p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>承办部门：{guide.department}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>更新时间：{guide.updatedAt}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary text-sm py-1.5">
                <Share2 className="w-4 h-4 mr-1.5" />
                分享
              </button>
              <button className="btn-secondary text-sm py-1.5">
                <Printer className="w-4 h-4 mr-1.5" />
                打印
              </button>
              <button className="btn-secondary text-sm py-1.5">
                <Download className="w-4 h-4 mr-1.5" />
                下载
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50/50">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">法定时限</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{guide.timeLimit.legal}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">承诺时限</span>
            </div>
            <p className="text-lg font-bold text-primary-600">{guide.timeLimit.promise}</p>
            {guide.timeLimit.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{guide.timeLimit.description}</p>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">所需材料</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {guide.materials.filter(m => m.required).length} 项必办
            </p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>已准备</span>
                <span>{preparedCount}/{requiredCount}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">办理费用</span>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{guide.fees}</p>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'materials' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">办理条件</h3>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    需同时满足全部条件
                  </div>
                </div>
                <ul className="space-y-2">
                  {guide.handlingConditions.map((cond, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">材料清单</h3>
                  <span className="text-sm text-gray-500">
                    （共 {guide.materials.length} 项，必办 {guide.materials.filter(m => m.required).length} 项）
                  </span>
                </div>
                <button
                  onClick={() => {
                    const allRequired = guide.materials.filter(m => m.required)
                    const allPrepared = allRequired.every(m => preparedMaterials.has(m.id))
                    if (allPrepared) {
                      setPreparedMaterials(new Set())
                    } else {
                      setPreparedMaterials(new Set(allRequired.map(m => m.id)))
                    }
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {guide.materials.filter(m => m.required).every(m => preparedMaterials.has(m.id))
                    ? '取消全部标记'
                    : '标记全部必办为已准备'
                  }
                </button>
              </div>

              <div className="space-y-4">
                {guide.materials.map((material: MaterialItem, idx: number) => {
                  const isPrepared = preparedMaterials.has(material.id)
                  return (
                    <div
                      key={material.id}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isPrepared ? 'border-green-300 bg-green-50/30' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4 p-5">
                        <button
                          onClick={() => togglePrepared(material.id)}
                          className={`mt-0.5 shrink-0 transition-transform hover:scale-110 ${
                            isPrepared ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'
                          }`}
                          title={isPrepared ? '取消已准备标记' : '标记为已准备'}
                        >
                          {isPrepared ? (
                            <CheckSquare className="w-6 h-6 fill-current" />
                          ) : (
                            <Square className="w-6 h-6" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                              {idx + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900 text-lg">{material.name}</h4>
                            {material.required ? (
                              <span className="badge bg-red-100 text-red-700">必填</span>
                            ) : (
                              <span className="badge bg-gray-100 text-gray-600">选填</span>
                            )}
                            {material.format && (
                              <span className="badge bg-blue-50 text-blue-600 text-xs">
                                {material.format}
                              </span>
                            )}
                            {isPrepared && (
                              <span className="badge bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                已准备
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 pl-9">{material.description}</p>
                          {material.notes && (
                            <p className="text-xs text-gray-500 mt-1.5 pl-9 flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-yellow-500 shrink-0" />
                              <span>💡 {material.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {(material.exampleImage || material.commonErrors.length > 0) && (
                        <div className="border-t border-gray-50 bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                          {material.exampleImage && (
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="font-medium">材料示例</span>
                                </div>
                                <button
                                  onClick={() => openLightbox(material.exampleImage!, materialImages.indexOf(material.exampleImage!))}
                                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  查看大图
                                </button>
                              </div>
                              <div
                                className="aspect-video bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer group relative"
                                onClick={() => openLightbox(material.exampleImage!, materialImages.indexOf(material.exampleImage!))}
                              >
                                <img
                                  src={material.exampleImage}
                                  alt={material.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm text-gray-700 flex items-center gap-1">
                                    <ImageIcon className="w-4 h-4" />
                                    点击放大查看
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {material.commonErrors.length > 0 && (
                            <div className="p-4">
                              <div className="flex items-center gap-1.5 text-sm text-red-600 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-medium">常见错误提示</span>
                                <span className="badge bg-red-100 text-red-600 text-xs ml-auto">
                                  {material.commonErrors.length} 项
                                </span>
                              </div>
                              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                <ul className="space-y-2">
                                  {material.commonErrors.map((err: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                      <span>{err}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                请务必仔细核对，避免因材料问题导致办理失败
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {materialImages.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">所有材料示例图（{materialImages.length}张）</h4>
                  <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
                    {materialImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => openLightbox(img, idx)}
                        className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                      >
                        <img src={img} alt={`示例${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'process' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">办理流程</h3>
                <span className="text-sm text-gray-500">（共 {guide.handlingProcess.length} 步）</span>
              </div>
              <ol className="relative ml-4 space-y-0">
                {guide.handlingProcess.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      {idx < guide.handlingProcess.length - 1 && (
                        <div className="w-0.5 flex-1 bg-primary-200 my-2" />
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                      <p className="text-gray-800 font-medium">{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">线下办理地点</h3>
              </div>
              <div className="grid gap-4">
                {guide.offlineLocations.map((loc, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-5 hover:border-primary-200 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          {loc.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pl-8">
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <span>{loc.address}</span>
                              <button
                                onClick={() => copyToClipboard(loc.address, `addr-${idx}`)}
                                className="ml-2 text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                              >
                                {copiedField === `addr-${idx}` ? (
                                  <><Check className="w-3 h-3" />已复制</>
                                ) : (
                                  <><Copy className="w-3 h-3" />复制</>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <span>{loc.phone}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600 md:col-span-2">
                            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <span>办公时间：{loc.hours}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://map.baidu.com/search/${encodeURIComponent(loc.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        导航
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">线上办理入口</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.onlineEntries.map((entry, idx) => (
                  <a
                    key={idx}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group card p-5 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors text-lg">
                          {entry.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          平台类型：{
                            entry.platform === 'province_gov' ? '省级政务服务网' :
                            entry.platform === 'city_gov' ? '市级政务服务网' :
                            entry.platform === 'wechat_mini' ? '微信小程序' : '官方APP'
                          }
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 transition-colors">
                        <ExternalLink className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">温馨提示</p>
                    <ul className="mt-2 space-y-1.5 text-yellow-700">
                      <li>• 线上办理请确认已完成实名认证，部分业务需先在对应平台注册账号</li>
                      <li>• 如遇系统问题，请拨打 12345 政务服务热线咨询</li>
                      <li>• 建议使用 Chrome、Edge 等现代浏览器访问，以获得最佳体验</li>
                      <li>• 网上办理与窗口办理具有同等法律效力</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">常见问题</h3>
              </div>
              {guide.faqs.length > 0 ? (
                <div className="space-y-3">
                  {guide.faqs.map((faq, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            Q
                          </span>
                          <p className="font-medium text-gray-900 pt-0.5">{faq.question}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            A
                          </span>
                          <p className="text-gray-700 pt-0.5 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-700">暂无常见问题</p>
                  <p className="text-sm mt-1">如有疑问，请拨打 12345 政务服务热线咨询</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null) }}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          {materialImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev') }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next') }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
          <div className="max-w-5xl max-h-[90vh] p-4">
            <img
              src={lightboxImage}
              alt="材料示例大图"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {materialImages.length > 1 && (
              <p className="text-center text-white/70 mt-4 text-sm">
                {lightboxIndex + 1} / {materialImages.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
