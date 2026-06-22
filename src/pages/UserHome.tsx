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
} from 'lucide-react'
import { useAppStore } from '../store'
import { getSubCategories, getCategoryPath } from '../data/mockData'
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

export const UserHome: React.FC = () => {
  const navigate = useNavigate()
  const { createTask, technicians } = useAppStore()
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
        <h2 className="font-semibold text-lg mb-4">服务品类</h2>
        <div className="grid grid-cols-4 gap-4">
          {mainCategories.map(cat => {
            const Icon = categoryIcons[cat.id] || Zap
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat)
                  setShowRiskWarning(true)
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">热门维修</h2>
        <div className="space-y-2">
          {['空调不制冷', '水管漏水', '电路跳闸', '马桶堵塞'].map(item => (
            <button
              key={item}
              onClick={() => {
                setTitle(item)
                setShowRiskWarning(true)
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-left"
            >
              <span className="text-gray-700">{item}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowRiskWarning(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

      <RiskWarningModal
        isOpen={showRiskWarning}
        onClose={() => setShowRiskWarning(false)}
        onConfirm={() => {
          setShowRiskWarning(false)
          setShowCreateModal(true)
        }}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="发布维修任务"
        size="lg"
      >
        <div className="space-y-4">
          {!selectedCategory ? (
            <div>
              <label className="label">选择服务大类</label>
              <div className="grid grid-cols-2 gap-2">
                {mainCategories.map(cat => {
                  const Icon = categoryIcons[cat.id] || Zap
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                    >
                      <Icon className="w-5 h-5 text-primary-600" />
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="label">选择细分服务</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 p-3 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  返回上级
                </button>
                {getSubCategories(selectedCategory.id).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSubCategory(cat)}
                    className={`p-3 rounded-lg border text-left ${
                      subCategory?.id === cat.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {(selectedCategory || subCategory) && (
                <div className="mt-2 text-sm text-gray-500">
                  已选：{getCategoryPath(subCategory?.id || selectedCategory.id).map(c => c.name).join(' / ')}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">故障标题</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：空调不制冷"
            />
          </div>

          <div>
            <label className="label">故障描述</label>
            <textarea
              className="input min-h-[100px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请详细描述故障现象，如品牌型号、出现的问题等"
            />
          </div>

          <div>
            <label className="label">上传故障图片（最多6张）</label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">上传图片</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <MapPin className="w-4 h-4" /> 服务地址
            </label>
            <input
              type="text"
              className="input"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="请输入详细地址"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                className="input text-sm"
                value={lat}
                onChange={e => setLat(parseFloat(e.target.value))}
                placeholder="纬度"
              />
              <input
                type="number"
                step="any"
                className="input text-sm"
                value={lng}
                onChange={e => setLng(parseFloat(e.target.value))}
                placeholder="经度"
              />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <Clock className="w-4 h-4" /> 期望响应时间（分钟）
            </label>
            <input
              type="number"
              className="input"
              value={expectedResponseTime}
              onChange={e => setExpectedResponseTime(parseInt(e.target.value))}
              min={15}
              step={15}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!subCategory || !title || !description}
              className="btn-primary flex-1"
            >
              发布并广播派单
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
        title="派单结果：匹配到的师傅"
      >
        <div className="space-y-3">
          {matchedTechs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无匹配的师傅，请稍后查看订单状态</p>
          ) : (
            matchedTechs.map((m, idx) => (
              <div key={m.technician.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {m.technician.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.technician.name}</span>
                    {idx === 0 && <span className="badge-info">最佳匹配</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistance(m.distanceKm)} · 评分{m.technician.rating} · {m.technician.reviewCount}单
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">匹配度</div>
                  <div className="font-semibold text-primary-600">{Math.round(m.totalScore * 100)}%</div>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => {
              setShowMatchingResult(false)
              navigate('/my-tasks')
            }}
            className="btn-primary w-full"
          >
            查看我的订单
          </button>
        </div>
      </Modal>
    </div>
  )
}
