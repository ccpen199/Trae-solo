import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Edit,
  Trash2,
  BadgeCheck,
  Clock,
  AlertCircle,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Maximize2,
  User,
  ShieldCheck,
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import HouseCard, { type House } from '@/components/HouseCard'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface HouseDetail extends House {
  agentPhone?: string
}

export default function HouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [house, setHouse] = useState<HouseDetail | null>(null)
  const [relatedHouses, setRelatedHouses] = useState<House[]>([])
  const [currentImage, setCurrentImage] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { canEditHouse, canDeleteHouse, canVerifyHouse } = useAuthStore()

  const mockImages = [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('modern living room interior design real estate') + '&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('modern bedroom interior design real estate') + '&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('modern kitchen interior design real estate') + '&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('modern bathroom interior design real estate') + '&image_size=landscape_16_9',
  ]

  useEffect(() => {
    if (id) {
      loadHouse()
    }
  }, [id])

  async function loadHouse() {
    try {
      setLoading(true)
      const result = await api.get(`/houses/${id}`)
      if (result.success && result.data) {
        const h = result.data as any

        const houseData: HouseDetail = {
          id: h.id,
          title: h.title,
          address: h.address,
          price: h.price,
          unitType: h.unit_type,
          houseType: h.house_type,
          area: h.area,
          agentId: h.agent_id,
          agentName: h.agent_name,
          agentPhone: h.agent_phone,
          status: h.status,
          certStatus: h.cert_status,
          certNo: h.cert_no,
          images: JSON.parse(h.images || '[]'),
          description: h.description,
          community: h.community,
          builtYear: h.built_year,
          lng: h.lng,
          lat: h.lat,
          floorInfo: h.floor_info,
          orientation: h.orientation,
          decoration: h.decoration,
          createdAt: h.created_at,
        }
        setHouse(houseData)
        loadRelatedHouses()
      } else {
        console.error('加载房源详情失败:', result.error)
      }
    } catch (err) {
      console.error('加载房源详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadRelatedHouses() {
    try {
      const result = await api.get<House[]>('/houses', { page: 1, pageSize: 4 })
      const processed = Array.isArray(result.data)
        ? result.data
            .filter((h: any) => h.id !== Number(id))
            .slice(0, 3)
            .map((h: any) => ({
              id: h.id,
              title: h.title,
              address: h.address,
              price: h.price,
              unitType: h.unit_type,
              houseType: h.house_type,
              area: h.area,
              agentId: h.agent_id,
              agentName: h.agent_name,
              status: h.status,
              certStatus: h.cert_status,
              certNo: h.cert_no,
              images: JSON.parse(h.images || '[]'),
              description: h.description,
              community: h.community,
              builtYear: h.built_year,
              lng: h.lng,
              lat: h.lat,
              floorInfo: h.floor_info,
              orientation: h.orientation,
              decoration: h.decoration,
              createdAt: h.created_at,
            }))
        : []
      setRelatedHouses(processed)
    } catch (err) {
      console.error('加载相关房源失败:', err)
    }
  }

  async function handleVerify() {
    if (!house) return
    try {
      setVerifying(true)
      await api.post(`/houses/${house.id}/verify`)
      await loadHouse()
    } catch (err) {
      console.error('验真失败:', err)
      alert('验真操作失败，请重试')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDelete() {
    if (!house) return
    if (!confirm('确定要删除该房源吗？此操作不可恢复。')) return

    try {
      setDeleting(true)
      await api.delete(`/houses/${house.id}`)
      navigate('/houses')
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败，请重试')
    } finally {
      setDeleting(false)
    }
  }

  function nextImage() {
    setCurrentImage((prev) => (prev + 1) % mockImages.length)
  }

  function prevImage() {
    setCurrentImage((prev) => (prev - 1 + mockImages.length) % mockImages.length)
  }

  function formatPrice(price: number, unitType: 'sell' | 'rent') {
    if (unitType === 'sell') {
      if (price >= 10000) {
        return `${(price / 10000).toFixed(0)}万`
      }
      return `${price.toLocaleString()}元`
    }
    return `${price.toLocaleString()}元/月`
  }

  const certConfig: Record<string, { label: string; className: string; icon: typeof BadgeCheck }> = {
    verified: { label: '已验真', className: 'text-green-600 bg-green-50', icon: ShieldCheck },
    pending: { label: '待审核', className: 'text-yellow-600 bg-yellow-50', icon: Clock },
    failed: { label: '验真失败', className: 'text-red-600 bg-red-50', icon: AlertCircle },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">房源不存在</h3>
        <button
          onClick={() => navigate('/houses')}
          className="text-blue-600 hover:text-blue-700"
        >
          返回房源列表
        </button>
      </div>
    )
  }

  const cert = certConfig[house.certStatus] || certConfig.pending
  const canEdit = canEditHouse(house.agentId)
  const canDelete = canDeleteHouse()
  const canVerify = canVerifyHouse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/houses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回房源列表
        </button>
        <div className="flex items-center gap-2">
          {canVerify && house.certStatus !== 'verified' && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <BadgeCheck className="w-5 h-5" />}
              {verifying ? '验真中...' : '申请验真'}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => navigate(`/houses/${house.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              编辑
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              {deleting ? '删除中...' : '删除'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="relative h-96 bg-gray-100">
              <img
                src={mockImages[currentImage]}
                alt={house.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowGallery(true)}
              />
              <button
                onClick={() => setShowGallery(true)}
                className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-2 p-4">
              {mockImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={cn(
                    'w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                    currentImage === index ? 'border-blue-600' : 'border-transparent'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{house.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium', cert.className)}>
                    <cert.icon className="w-4 h-4" />
                    {cert.label}
                    {house.certNo && <span className="ml-1">({house.certNo})</span>}
                  </span>
                  <span className="text-sm text-gray-500">
                    {house.unitType === 'sell' ? '出售' : '出租'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">
                  {formatPrice(house.price, house.unitType)}
                </div>
                {house.unitType === 'sell' && house.area && (
                  <div className="text-sm text-gray-500 mt-1">
                    {Math.round(house.price / house.area).toLocaleString()}元/㎡
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{house.houseType || '-'}</div>
                <div className="text-sm text-gray-500">户型</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{house.area || '-'}㎡</div>
                <div className="text-sm text-gray-500">面积</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{house.floorInfo || '-'}</div>
                <div className="text-sm text-gray-500">楼层</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{house.orientation || '-'}</div>
                <div className="text-sm text-gray-500">朝向</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <span className="text-sm text-gray-500">装修情况：</span>
                <span className="text-sm font-medium text-gray-900">{house.decoration || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">小区：</span>
                <span className="text-sm font-medium text-gray-900">{house.community || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">建成年份：</span>
                <span className="text-sm font-medium text-gray-900">{house.builtYear || '-'}</span>
              </div>
            </div>

            {house.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">房源描述</h3>
                <p className="text-gray-600 leading-relaxed">{house.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              位置信息
            </h3>
            <p className="text-gray-600 mb-4">{house.address}</p>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>地图加载中...</p>
                {house.lng && house.lat && (
                  <p className="text-sm mt-1">
                    坐标: {house.lng.toFixed(4)}, {house.lat.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {relatedHouses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">相关房源</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedHouses.map((h) => (
                  <HouseCard key={h.id} house={h} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">经纪人信息</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{house.agentName || '-'}</div>
                <div className="text-sm text-gray-500">资深房产经纪人</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{house.agentPhone || '-'}</span>
              </div>
            </div>
            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Phone className="w-5 h-5" />
              联系经纪人
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">验真状态</h3>
            <div className={cn('p-4 rounded-lg', cert.className)}>
              <div className="flex items-center gap-3">
                <cert.icon className="w-8 h-8" />
                <div>
                  <div className="font-semibold">{cert.label}</div>
                  {house.certNo && (
                    <div className="text-sm opacity-75">验真编号: {house.certNo}</div>
                  )}
                </div>
              </div>
              {house.certStatus === 'pending' && (
                <p className="mt-3 text-sm opacity-75">
                  该房源正在等待验真审核，审核通过后将获得验真标识。
                </p>
              )}
              {house.certStatus === 'verified' && (
                <p className="mt-3 text-sm opacity-75">
                  该房源已通过官方验真，房源信息真实有效。
                </p>
              )}
              {house.certStatus === 'failed' && (
                <p className="mt-3 text-sm opacity-75">
                  该房源验真未通过，请检查房源信息后重新提交。
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showGallery && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 p-3 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img
            src={mockImages[currentImage]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            onClick={nextImage}
            className="absolute right-4 p-3 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {currentImage + 1} / {mockImages.length}
          </div>
        </div>
      )}
    </div>
  )
}
