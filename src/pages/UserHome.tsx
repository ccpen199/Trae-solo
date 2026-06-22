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
} from 'lucide-react'
import { useAppStore } from '../store'
import { getSubCategories, getCategoryPath, getCategoryById, mockSkillTags } from '../data/mockData'
import type { ServiceCategory } from '../types'
import { RiskWarningModal } from '../components/RiskWarningModal'
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
  const [showRiskWarning, setShowRiskWarning] = useState(false)
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

  const mainCategories = getSubCategories(null)

  const openCreateForm = (presetTitle?: string, presetCategoryId?: string) => {
    setShowRiskWarning(true)
    if (presetTitle) setTitle(presetTitle)
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
  }

  const handleSubmit = async () => {
    if (!subCategory || !title || !description || !address) return

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

  const handleRiskConfirm = () => {
    setShowRiskWarning(false)
    setShowCreateModal(true)
  }

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

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">服务品类</h2>
          <span className="text-xs text-gray-400">点击展开查看细分服务</span>
        </div>
        <div className="space-y-1">
          {mainCategories.map(cat => {
            const Icon = categoryIcons[cat.id] || Zap
            const subCats = getSubCategories(cat.id)
            const isExpanded = expandedCategory === cat.id
            const relatedSkills = mockSkillTags.filter(s => subCats.some(sc => sc.id === s.categoryId))

            return (
              <div key={cat.id} className="rounded-xl overflow-hidden">
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
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      {subCats.map(sub => {
                        const subSkills = mockSkillTags.filter(s => s.categoryId === sub.id)
                        return (
                          <button
                            key={sub.id}
                            onClick={() => openCreateForm(sub.name, sub.id)}
                            className="p-3 rounded-lg bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left"
                          >
                            <p className="font-medium text-sm">{sub.name}</p>
                            {subSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {subSkills.slice(0, 2).map(s => (
                                  <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
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
        <h2 className="font-semibold text-lg mb-4">热门维修快捷发单</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(hotItemToCategory).map(([item, catId]) => {
            const cat = getCategoryById(catId)
            const parentCat = cat?.parentId ? getCategoryById(cat.parentId) : null
            return (
              <button
                key={item}
                onClick={() => openCreateForm(item, catId)}
                className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 hover:border-primary-300 transition-all text-left"
              >
                <p className="font-medium">{item}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {parentCat?.name} / {cat?.name}
                </p>
                <p className="text-xs text-primary-600 mt-2 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  一键发单 · 含风险提示
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card bg-gradient-to-br from-warning-50 to-white border-warning-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-warning-800">安全交易提示</h3>
            <p className="text-sm text-warning-700 mt-1">
              本平台不抽取任何佣金，所有交易由双方自主协商。建议维修完成验收合格后再付款，
              如需预付款请留存支付凭证。警惕"上门费"、"检测费"等预收费陷阱！
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => openCreateForm()}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

      <RiskWarningModal
        isOpen={showRiskWarning}
        onClose={() => setShowRiskWarning(false)}
        onConfirm={handleRiskConfirm}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="发布维修任务"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">服务分类 <span className="text-danger-500">*</span></label>
            {!selectedCategory ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">选择服务大类：</p>
                <div className="grid grid-cols-2 gap-2">
                  {mainCategories.map(cat => {
                    const Icon = categoryIcons[cat.id] || Zap
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                      >
                        <Icon className="w-