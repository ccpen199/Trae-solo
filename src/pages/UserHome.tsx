import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Tv,
  Zap,
  Hammer,
  Droplets,
  Plus,
  MapPin,
  Clock,
  Upload,
  X,
  ChevronRight,
  Search,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useAppStore } from '../store'
import { getSubCategories, getCategoryPath, getCategoryById, mockSkillTags } from '../data/mockData'
import type { ServiceCategory } from '../types'
import { Modal } from '../components/Modal'
import { matchTechnicians } from '../utils/matching'
import { formatDistance } from '../utils/geo'

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'cat-1': Tv,
  'cat-2': Zap,
  'cat-3': Hammer,
  'cat-4': Droplets,
}

const hotItemToCategory: Record<string, string> = {
  '空调不制冷': 'cat-1-1',
  '水管漏水': 'cat-2-2',
  '电路跳闸': 'cat-2-1',
  '马桶堵塞': 'cat-4-1',
}

export const UserHome: React.FC = () => {
  const navigate = useNavigate()
  const { createTask, technicians } = useAppStore()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [subCategory, setSubCategory] = useState<ServiceCategory | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('上海市黄浦区南京东路100号')
  const [lat, setLat] = useState(31.2304)
  const [lng, setLng] = useState(121.4737)
  const [expectedResponseTime, setExpectedResponseTime] = useState(30)
  const [images, setImages] = useState<string[]>([])
  const [matchedTechs, setMatchedTechs] = useState<ReturnType<typeof matchTechnicians>>([])
  const [showMatchingResult, setShowMatchingResult] = useState(false)
  const [riskAcknowledged, setRiskAcknowledged] = useState(false)

  const mainCategories = getSubCategories(null)

  const openCreateForm = (presetTitle?: string, presetCategoryId?: string) => {
    setSelectedCategory(null)
    setSubCategory(null)
    setTitle(presetTitle || '')
    setDescription('')
    setImages([])
    setRiskAcknowledged(false)
    if (presetCategoryId) {
      const cat = getCategoryById(presetCategoryId)
      if (cat) {
        setSubCategory(cat)
        if (cat.parentId) {
          const parent = getCategoryById(cat.parentId)
          if (parent) setSelectedCategory(parent)
        }
      }
    }
    setShowCreateModal(true)
  }

  const handleSubmit = async () => {
    if (!subCategory || !title || !description || !address || !riskAcknowledged) return

    const task = await createTask({
      categoryId: subCategory.id,
      title,
      description,
      images,
      address,
      location: { lat, lng },
      expectedResponseTime,
    })

    const matched = matchTechnicians(task, technicians, task.location)
    setMatchedTechs(matched)
    setShowCreateModal(false)
    setShowMatchingResult(true)

    resetForm()
  }

  const resetForm = () => {
    setSelectedCategory(null)
    setSubCategory(null)
    setTitle('')
    setDescription('')
    setImages([])
    setRiskAcknowledged(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target?.result as string].slice(0, 6))
      }
      reader.readAsDataURL(file)
    })
  }

  const toggleCategory = (catId: string) => {
    setExpandedCategory(expandedCategory === catId ? null : catId)
  }

  const isFormValid = subCategory && title && description && address && riskAcknowledged

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索维修服务..."
            className="flex-1 bg-transparent outline-none text-gray-700"
          />
        </div>
      </div>

      <div className="card bg-gradient-to-br from-warning-50 to-white border-warning-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-warning-800">安全交易 · 防预收费陷阱</h3>
            <p className="text-sm text-warning-700 mt-1">
              本平台零佣金，所有交易由双方自主协商。建议维修完成并<b>验收合格后再付款</b>，
              警惕"上门费""检测费"等预收费！预付款请务必留存凭证拍照上传。
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">服务品类</h2>
          <span className="text-xs text-primary-600 font-medium">点击大类展开 → 选择细分服务立即发单</span>
        </div>
        <div className="space-y-1">
          {mainCategories.map(cat => {
            const Icon = categoryIcons[cat.id] || Zap
            const subCats = getSubCategories(cat.id)
            const isExpanded = expandedCategory === cat.id
            const relatedSkills = mockSkillTags.filter(s => subCats.some(sc => sc.id === s.categoryId))

            return (
              <div key={cat.id} className="rounded-xl overflow-hidden border border-gray-100">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center gap-3 p-4 transition-colors ${
                    isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    isExpanded ? 'bg-primary-100' : 'bg-primary-50'
                  }`}>
                    <Icon className={`w-5 h-5 ${isExpanded ? 'text-primary-700' : 'text-primary-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {subCats.length} 项细分服务 · {relatedSkills.length} 个专业技能
                    </p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </button>

                {isExpanded && (
                  <div className="bg-gray-50 px-4 pb-4">
                    <p className="text-xs text-gray-400 mb-2 pt-2">👇 点击下方卡片直接进入完整发单表单</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {subCats.map(sub => {
                        const subSkills = mockSkillTags.filter(s => s.categoryId === sub.id)
                        return (
                          <button
                            key={sub.id}
                            onClick={() => openCreateForm(sub.name, sub.id)}
                            className="p-3 rounded-lg bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50 hover:shadow-sm transition-all text-left"
                          >
                            <p className="font-medium text-sm flex items-center gap-1">
                              {sub.name}
                              <ChevronRight className="w-3.5 h-3.5 text-primary-500 ml-auto" />
                            </p>
                            {subSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {subSkills.slice(0, 2).map(s => (
                                  <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600">
                                    {s.name}
                                  </span>
                                ))}
                                {subSkills.length > 2 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                    +{subSkills.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">热门维修快捷发单</h2>
          <span className="text-xs text-gray-400">一键直达完整表单</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(hotItemToCategory).map(([item, catId]) => {
            const cat = getCategoryById(catId)
            const parentCat = cat?.parentId ? getCategoryById(cat.parentId) : null
            return (
              <button
                key={item}
                onClick={() => openCreateForm(item, catId)}
                className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 hover:border-primary-400 hover:shadow-md transition-all text-left group"
              >
                <p className="font-medium flex items-center justify-between">
                  {item}
                  <ChevronRight className="w-4 h-4 text-primary-500 group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {parentCat?.name} / {cat?.name}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-success-50 text-success-600 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> 已含风险提示
                  </span>
                  <span className="text-[10px] text-gray-400">填写完整派单信息</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card border-2 border-dashed border-primary-200 bg-primary-50/30">
        <div className="text-center">
          <p className="font-medium text-gray-700 mb-2">还没找到合适的服务？</p>
          <button
            onClick={() => openCreateForm()}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            手动新建维修任务
          </button>
        </div>
      </div>

      <button
        onClick={() => openCreateForm()}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 hover:scale-105 transition-all z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="发布维修任务 · 完整派单信息"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-800">🚨 安全交易风险提示（请务必阅读）</p>
                <ul className="text-xs text-warning-700 mt-1 space-y-0.5">
                  <li>• 本平台零佣金，交易由双方自主协商</li>
                  <li>• 建议维修完成并验收合格后再付款</li>
                  <li>• 警惕"上门费""检测费"等预收费陷阱</li>
                  <li>• 预付款请拍照留存支付凭证，后续可上传</li>
                </ul>
              </div>
            </div>
            <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
              riskAcknowledged ? 'bg-success-50 border border-success-200' : 'bg-white border border-gray-200'
            }`}>
              <input
                type="checkbox"
                checked={riskAcknowledged}
                onChange={(e) => setRiskAcknowledged(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600"
              />
              <span className={`text-sm ${
                riskAcknowledged ? 'text-success-700 font-medium' : 'text-gray-600'
              }`}>
                {riskAcknowledged ? '✓ 我已阅读并知晓以上风险提示' : '我已阅读并知晓以上风险提示'}
              </span>
            </label>
          </div>

          <div>
            <label className="label">服务分类 <span className="text-danger-500">*</span></label>
            {!selectedCategory ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">① 先选择服务大类：</p>
                <div className="grid grid-cols-2 gap-2">
                  {mainCategories.map(cat => {
                    const Icon = categoryIcons[cat.id] || Zap
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat)
                          setSubCategory(null)
                        }}
                        className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-primary-600" />
                        <span className="font-medium">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <span>当前路径：</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {getCategoryPath(subCategory?.id || selectedCategory.id).map(c => c.name).join(' / ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">② 选择细分服务：</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSubCategory(null)
                    }}
                    className="flex items-center gap-1 p-3 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    返回重选大类
                  </button>
                  {getSubCategories(selectedCategory.id).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSubCategory(cat)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        subCategory?.id === cat.id
                          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.name}</span>
                        {subCategory?.id === cat.id && (
                          <ShieldCheck className="w-4 h-4 text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label">故障标题 <span className="text-danger-500">*</span></label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：空调不制冷、水管漏水、电路跳闸（简短描述核心问题）"
            />
          </div>

          <div>
            <label className="label">故障描述 <span className="text-danger-500">*</span></label>
            <textarea
              className="input min-h-[100px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请详细描述故障现象，如：品牌型号、出现的具体问题、持续多久了、有无异常声音/气味等，有助于师傅更快诊断"
            />
          </div>

          <div>
            <label className="label">上传故障图片（最多6张）</label>
            <p className="text-xs text-gray-400 -mt-2 mb-2">建议拍摄：整体环境、故障位置特写、设备品牌型号</p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">上传图片</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <MapPin className="w-4 h-4" /> 服务地址 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="请输入详细地址（精确到门牌号，如：XX小区X栋X单元X室）"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">📍 纬度 (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  className="input text-sm mt-1"
                  value={lat}
                  onChange={e => setLat(parseFloat(e.target.value))}
                  placeholder="如：31.2304"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">📍 经度 (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  className="input text-sm mt-1"
                  value={lng}
                  onChange={e => setLng(parseFloat(e.target.value))}
                  placeholder="如：121.4737"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 经纬度用于计算师傅距离，系统将自动匹配最近的专业人员（默认使用上海中心坐标）
            </p>
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <Clock className="w-4 h-4" /> 期望响应时间（分钟）
            </label>
            <select
              className="input"
              value={expectedResponseTime}
              onChange={e => setExpectedResponseTime(parseInt(e.target.value))}
            >
              <option value={15}>⚡ 15分钟内（加急）</option>
              <option value={30}>🚀 30分钟内</option>
              <option value={60}>⏰ 1小时内</option>
              <option value={120}>📅 2小时内</option>
              <option value={240}>🕐 4小时内</option>
              <option value={480}>🌆 今日内</option>
            </select>
          </div>

          <div className={`p-3 rounded-lg border transition-colors ${
            isFormValid
              ? 'bg-success-50 border-success-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start gap-2">
              {isFormValid ? (
                <ShieldCheck className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isFormValid ? 'text-success-700' : 'text-gray-600'
                }`}>
                  {isFormValid
                    ? '✓ 派单信息已填写完整'
                    : '派单信息待完善'}
                </p>
                <p className={`text-xs mt-0.5 ${
                  isFormValid ? 'text-success-600' : 'text-gray-500'
                }`}>
                  {isFormValid
                    ? '发布后系统将向周边匹配师傅实时广播派单，师傅接单前可随时取消'
                    : '请填写：服务分类细分项、故障标题、故障描述、服务地址，并确认风险提示'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`flex-1 font-medium transition-all ${
                isFormValid
                  ? 'btn-primary hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed rounded-lg px-4 py-2.5'
              }`}
            >
              ✓ 确认发布 · 广播派单
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMatchingResult}
        onClose={() => {
          setShowMatchingResult(false)
          navigate('/my-tasks')
        }}
        title="🎉 派单成功！已通知匹配师傅"
      >
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-r from-success-50 to-primary-50 border border-success-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-success-800">订单已加密存储 · 实时广播推送中</p>
                <p className="text-sm text-success-700 mt-0.5">
                  系统正在向 <b className="text-primary-600">{matchedTechs.length}</b> 位匹配的师傅实时广播推送。
                  师傅接单后您将在订单详情中看到实时状态变化。
                </p>
              </div>
            </div>
          </div>
          {matchedTechs.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">当前暂无匹配的师傅</p>
              <p className="text-sm text-gray-400 mt-1">订单仍在广播中，请稍后前往订单详情查看响应</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {matchedTechs.map((m, idx) => (
                <div key={m.technician.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
                    {m.technician.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{m.technician.name}</span>
                      {idx === 0 && <span className="badge-info">✨ 最佳匹配</span>}
                      {m.technician.certificates.some(c => c.verified) && <span className="badge-success">✓ 已认证</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {formatDistance(m.distanceKm)} · 评分{m.technician.rating} · {m.technician.reviewCount}单历史
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {mockSkillTags.filter(s => m.technician.skillTags.includes(s.id)).slice(0, 3).map(s => (
                        <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600">
                          {s.name}
                        </span>
                      ))}
                      {mockSkillTags.filter(s => m.technician.skillTags.includes(s.id)).length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          +{mockSkillTags.filter(s => m.technician.skillTags.includes(s.id)).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-400">综合匹配度</div>
                    <div className="text-xl font-bold text-primary-600">{Math.round(m.totalScore * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setShowMatchingResult(false)
              navigate('/my-tasks')
            }}
            className="btn-primary w-full font-medium py-3"
          >
            👉 前往订单详情查看师傅实时响应
          </button>
        </div>
      </Modal>
    </div>
  )
}
