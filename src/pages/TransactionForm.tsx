import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, User, DollarSign, Percent, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface House {
  id: number
  title: string
  price: number
}

interface Client {
  id: number
  name: string
  phone: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(amount)
}

export default function TransactionForm() {
  const navigate = useNavigate()
  const hasRole = useAuthStore(s => s.hasRole)
  const [formData, setFormData] = useState({
    title: '',
    houseId: '',
    clientId: '',
    totalAmount: '',
    commissionRate: '2.5',
  })
  const [houses, setHouses] = useState<House[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const canCreate = hasRole('director', 'manager', 'agent')

  const commissionAmount = parseFloat(formData.totalAmount) && parseFloat(formData.commissionRate)
    ? (parseFloat(formData.totalAmount) * parseFloat(formData.commissionRate) / 100).toFixed(2)
    : '0.00'

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true)
      try {
        const [housesRes, clientsRes] = await Promise.all([
          api.get<House[]>('/houses', { pageSize: 100 }),
          api.get<Client[]>('/clients', { pageSize: 100 }),
        ])
        if (housesRes.success && housesRes.data) {
          setHouses(housesRes.data || [])
        }
        if (clientsRes.success && clientsRes.data) {
          setClients(clientsRes.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch options:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOptions()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleHouseChange = (houseId: string) => {
    handleChange('houseId', houseId)
    const house = houses.find(h => h.id.toString() === houseId)
    if (house) {
      handleChange('totalAmount', house.price.toString())
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = '请输入交易标题'
    if (!formData.houseId) newErrors.houseId = '请选择房源'
    if (!formData.clientId) newErrors.clientId = '请选择客户'
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = '请输入有效的总价'
    }
    if (!formData.commissionRate || parseFloat(formData.commissionRate) <= 0) {
      newErrors.commissionRate = '请输入有效的佣金率'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreate) return
    if (!validate()) return

    setSubmitting(true)
    try {
      const result = await api.post('/transactions', {
        title: formData.title,
        houseId: parseInt(formData.houseId),
        clientId: parseInt(formData.clientId),
        totalAmount: parseFloat(formData.totalAmount),
        commissionRate: parseFloat(formData.commissionRate) / 100,
      })
      if (!result.success) {
        setErrors({ submit: result.error || '创建失败，请重试' })
        return
      }
      navigate('/transactions')
    } catch (err: any) {
      setErrors({ submit: err.message || '创建失败，请重试' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回交易列表
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">创建新交易</h1>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="例如：望京SOHO两居交易"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.title ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="inline w-4 h-4 mr-1" />
                房源 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.houseId}
                onChange={(e) => handleHouseChange(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white',
                  errors.houseId ? 'border-red-300' : 'border-gray-300'
                )}
              >
                <option value="">请选择房源</option>
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.title} - {formatCurrency(house.price)}
                  </option>
                ))}
              </select>
              {errors.houseId && <p className="mt-1 text-sm text-red-600">{errors.houseId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                客户 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white',
                  errors.clientId ? 'border-red-300' : 'border-gray-300'
                )}
              >
                <option value="">请选择客户</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                总价 (元) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => handleChange('totalAmount', e.target.value)}
                placeholder="请输入交易总价"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.totalAmount ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.totalAmount && <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="inline w-4 h-4 mr-1" />
                佣金率 (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => handleChange('commissionRate', e.target.value)}
                placeholder="2.5"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.commissionRate ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.commissionRate && <p className="mt-1 text-sm text-red-600">{errors.commissionRate}</p>}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">预计佣金金额</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(parseFloat(commissionAmount))}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !canCreate}
                className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? '创建中...' : '创建交易'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ')
}
