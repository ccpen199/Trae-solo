import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface FormData {
  title: string
  address: string
  price: string
  unitType: 'sell' | 'rent'
  houseType: string
  area: string
  floorInfo: string
  orientation: string
  decoration: string
  description: string
  community: string
  builtYear: string
  lng: string
  lat: string
  images: string[]
}

interface FormErrors {
  [key: string]: string | undefined
  title?: string
  address?: string
  price?: string
  area?: string
  builtYear?: string
  lng?: string
  lat?: string
}

const initialFormData: FormData = {
  title: '',
  address: '',
  price: '',
  unitType: 'sell',
  houseType: '',
  area: '',
  floorInfo: '',
  orientation: '',
  decoration: '',
  description: '',
  community: '',
  builtYear: '',
  lng: '',
  lat: '',
  images: [],
}

const houseTypeOptions = [
  '一室一厅', '两室一厅', '两室两厅',
  '三室一厅', '三室两厅', '四室两厅', '五室及以上',
]

const orientationOptions = [
  '朝南', '朝北', '朝东', '朝西',
  '南北通透', '东西通透', '东南', '西南',
]

const decorationOptions = [
  '毛坯', '简装修', '中装修', '精装修', '豪装',
]

export default function HouseForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = id !== 'new' && id !== undefined

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [locating, setLocating] = useState(false)

  const { canEditHouse } = useAuthStore()

  useEffect(() => {
    if (isEdit && id) {
      loadHouse()
    }
  }, [id, isEdit])

  async function loadHouse() {
    try {
      setLoading(true)
      const result = await api.get(`/houses/${id}`)
      if (result.success && result.data) {
        const h = result.data as any

        if (!canEditHouse(h.agent_id)) {
          alert('您无权编辑此房源')
          navigate(`/houses/${id}`)
          return
        }

        setFormData({
          title: h.title || '',
          address: h.address || '',
          price: h.price?.toString() || '',
          unitType: h.unit_type || 'sell',
          houseType: h.house_type || '',
          area: h.area?.toString() || '',
          floorInfo: h.floor_info || '',
          orientation: h.orientation || '',
          decoration: h.decoration || '',
          description: h.description || '',
          community: h.community || '',
          builtYear: h.built_year?.toString() || '',
          lng: h.lng?.toString() || '',
          lat: h.lat?.toString() || '',
          images: JSON.parse(h.images || '[]'),
        })
      } else {
        console.error('加载房源失败:', result.error)
      }
    } catch (err) {
      console.error('加载房源失败:', err)
    } finally {
      setLoading(false)
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入房源标题'
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少5个字符'
    }

    if (!formData.address.trim()) {
      newErrors.address = '请输入房源地址'
    }

    if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
      newErrors.price = '请输入有效的价格'
    }

    if (formData.area && (isNaN(Number(formData.area)) || Number(formData.area) < 0)) {
      newErrors.area = '请输入有效的面积'
    }

    if (formData.builtYear && (isNaN(Number(formData.builtYear)) || Number(formData.builtYear) < 1900 || Number(formData.builtYear) > new Date().getFullYear())) {
      newErrors.builtYear = '请输入有效的建成年份'
    }

    if (formData.lng && (isNaN(Number(formData.lng)) || Number(formData.lng) < -180 || Number(formData.lng) > 180)) {
      newErrors.lng = '请输入有效的经度'
    }

    if (formData.lat && (isNaN(Number(formData.lat)) || Number(formData.lat) < -90 || Number(formData.lat) > 90)) {
      newErrors.lat = '请输入有效的纬度'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert('请上传图片文件')
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          alert('图片大小不能超过10MB')
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        const res = await api.upload<{ url: string }>('/upload', formData)
        if (res.success && res.data && (res.data as { url: string }).url) {
          uploadedUrls.push((res.data as { url: string }).url)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }))
      }
    } catch (err) {
      console.error('上传失败:', err)
      alert('图片上传失败，请重试')
    } finally {
      setUploading(false)
    }

    e.target.value = ''
  }

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  async function getCurrentLocation() {
    try {
      setLocating(true)
      if (!navigator.geolocation) {
        alert('您的浏览器不支持地理定位')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            lng: pos.coords.longitude.toFixed(6),
            lat: pos.coords.latitude.toFixed(6),
          }))
          setLocating(false)
        },
        () => {
          alert('获取位置失败，请手动输入经纬度')
          setLocating(false)
        }
      )
    } catch (err) {
      console.error('获取位置失败:', err)
      setLocating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setSubmitting(true)

      const submitData = {
        ...formData,
        price: formData.price ? Number(formData.price) : null,
        area: formData.area ? Number(formData.area) : null,
        builtYear: formData.builtYear ? Number(formData.builtYear) : null,
        lng: formData.lng ? Number(formData.lng) : null,
        lat: formData.lat ? Number(formData.lat) : null,
      }

      if (isEdit && id) {
        await api.put(`/houses/${id}`, submitData)
        alert('房源更新成功')
      } else {
        const res = await api.post('/houses', submitData)
        alert('房源创建成功')
        if (res.data && (res.data as { id?: number }).id) {
          navigate(`/houses/${(res.data as { id: number }).id}`)
          return
        }
      }

      navigate('/houses')
    } catch (err: any) {
      console.error('提交失败:', err)
      alert(err.message || '提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(isEdit && id ? `/houses/${id}` : '/houses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {isEdit ? '返回房源详情' : '返回房源列表'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isEdit ? '编辑房源' : '新增房源'}
        </h1>
        <p className="text-gray-500">请填写房源的详细信息</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            基本信息
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                房源标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="请输入房源标题"
                className={cn(
                  'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.title ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                房源地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="请输入详细地址"
                className={cn(
                  'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.address ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.address}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易类型 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="unitType"
                    value="sell"
                    checked={formData.unitType === 'sell'}
                    onChange={(e) => handleChange('unitType', e.target.value as 'sell' | 'rent')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">出售</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="unitType"
                    value="rent"
                    checked={formData.unitType === 'rent'}
                    onChange={(e) => handleChange('unitType', e.target.value as 'sell' | 'rent')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">出租</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder={formData.unitType === 'sell' ? '总价（元）' : '月租金（元/月）'}
                  className={cn(
                    'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.price ? 'border-red-300' : 'border-gray-200'
                  )}
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">户型</label>
              <select
                value={formData.houseType}
                onChange={(e) => handleChange('houseType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择户型</option>
                {houseTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">建筑面积（㎡）</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                placeholder="请输入建筑面积"
                className={cn(
                  'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.area ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.area}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">楼层信息</label>
              <input
                type="text"
                value={formData.floorInfo}
                onChange={(e) => handleChange('floorInfo', e.target.value)}
                placeholder="如：15/28层"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">朝向</label>
              <select
                value={formData.orientation}
                onChange={(e) => handleChange('orientation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择朝向</option>
                {orientationOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">装修情况</label>
              <select
                value={formData.decoration}
                onChange={(e) => handleChange('decoration', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择装修情况</option>
                {decorationOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">小区名称</label>
              <input
                type="text"
                value={formData.community}
                onChange={(e) => handleChange('community', e.target.value)}
                placeholder="请输入小区名称"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">建成年份</label>
              <input
                type="number"
                value={formData.builtYear}
                onChange={(e) => handleChange('builtYear', e.target.value)}
                placeholder="如：2018"
                className={cn(
                  'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.builtYear ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.builtYear && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.builtYear}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            位置信息（LBS）
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">经度</label>
              <input
                type="text"
                value={formData.lng}
                onChange={(e) => handleChange('lng', e.target.value)}
                placeholder="如：116.4074"
                className={cn(
                  'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.lng ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.lng && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lng}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">纬度</label>
              <input
                type="text"
                value={formData.lat}
                onChange={(e) => handleChange('lat', e.target.value)}
                placeholder="如：39.9042"
                className={cn(
                  'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.lat ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.lat && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lat}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
            {locating ? '获取位置中...' : '获取当前位置'}
          </button>

          {formData.lng && formData.lat && (
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                <p>地图预览位置</p>
                <p className="text-sm mt-1">
                  {formData.lng}, {formData.lat}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            房源图片
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {formData.images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt=""
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Crect fill="%23e5e7eb" width="128" height="128"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片%3C/text%3E%3C/svg%3E'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-1">上传图片</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-gray-500">
            支持 JPG、PNG 格式，单张图片不超过 10MB
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            房源描述
          </h2>

          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="请输入房源的详细描述，包括房源特色、周边配套等信息..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-4 bg-white rounded-xl border border-gray-100 p-4">
          <button
            type="button"
            onClick={() => navigate(isEdit && id ? `/houses/${id}` : '/houses')}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEdit ? '保存修改' : '创建房源'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
